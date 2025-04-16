import type { JsfSchema } from './types'
import difference from 'lodash/difference'
import get from 'lodash/get'
import intersection from 'lodash/intersection'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import set from 'lodash/set'

// NOTE: If you change this, also update the d.ts file.
export const WARNING_TYPES = {
  FIELD_TO_CHANGE_NOT_FOUND: 'FIELD_TO_CHANGE_NOT_FOUND',
  ORDER_MISSING_FIELDS: 'ORDER_MISSING_FIELDS',
  FIELD_TO_CREATE_EXISTS: 'FIELD_TO_CREATE_EXISTS',
  PICK_MISSED_FIELD: 'PICK_MISSED_FIELD',
}

/**
 * Converts a short path to a full path
 * @param {string} path
 * @example
 * shortToFullPath('foo.bar') // 'foo.properties.bar'
 */
function shortToFullPath(path: string) {
  return path.replace('.', '.properties.')
}

/**
 * Customizer function for the mergeWith function
 * @param _ - The target array
 * @param newVal - The array to merge
 * @returns The target array
 */
function mergeReplaceArray(_: any, newVal: any) {
  return Array.isArray(newVal) ? newVal : undefined
}

// TODO: our modify fn should not allow for property names that the json-schema-form parser itself does not support
// function standardizeAttrs(attrs: Partial<JsfSchema>) {
//   const { errorMessage, presentation, properties, ...rest } = attrs

//   return {
//     ...rest,
//     ...(presentation ? { 'x-jsf-presentation': presentation } : {}),
//     ...(errorMessage ? { 'x-jsf-errorMessage': errorMessage } : {}),
//   }
// }

/**
 *  Checks if a conditional schema references any of the fields being picked
 * @param {JsfSchema} condition - The conditional schema
 * @param {string[]} fieldsToPick - The fields being picked
 * @returns {boolean}
 */
function isConditionalReferencingAnyPickedField(condition: JsfSchema, fieldsToPick: string[]): boolean {
  const { if: ifCondition, then: thenCondition, else: elseCondition } = condition

  const inIf = intersection(ifCondition?.required || [], fieldsToPick)

  if (inIf.length > 0) {
    return true
  }

  const inThen
    = intersection(thenCondition?.required || [], fieldsToPick)
      || intersection(Object.keys(thenCondition?.properties || {}), fieldsToPick)

  if (inThen.length > 0) {
    return true
  }

  const inElse
    = intersection(elseCondition?.required || [], fieldsToPick)
      || intersection(Object.keys(elseCondition?.properties || {}), fieldsToPick)

  if (inElse.length > 0) {
    return true
  }

  return false
}

interface RewriteWarning {
  type: typeof WARNING_TYPES[keyof typeof WARNING_TYPES]
  message: string
}

interface RewriteResult {
  warnings: RewriteWarning[] | null
}

/**
 * Rewrites fields in the schema
 * @param {JsfSchema} schema - The schema to rewrite
 * @param {ModifyConfig['fields']} fieldsConfig - The fields to rewrite
 * @returns {RewriteResult}
 */
function rewriteFields(schema: JsfSchema, fieldsConfig: ModifyConfig['fields']): RewriteResult {
  if (!fieldsConfig) {
    return { warnings: null }
  }

  const warnings: RewriteWarning[] = []

  const fieldsToModify = Object.entries(fieldsConfig)

  fieldsToModify.forEach(([shortPath, mutation]) => {
    const fieldPath = shortToFullPath(shortPath)

    if (!get(schema.properties, fieldPath)) {
      // Do not override/edit a field that does not exist.
      // That's the job of config.create() method.
      warnings.push({
        type: WARNING_TYPES.FIELD_TO_CHANGE_NOT_FOUND,
        message: `Changing field "${shortPath}" was ignored because it does not exist.`,
      })
      return
    }

    const fieldAttrs = get(schema.properties, fieldPath)
    if (!fieldAttrs) {
      return { warnings: null }
    }

    const fieldChanges = typeof mutation === 'function' ? mutation(fieldAttrs) : mutation

    mergeWith(
      get(schema.properties, fieldPath),
      {
        ...(fieldAttrs as object),
        ...fieldChanges,
      },
      mergeReplaceArray,
    )

    if (fieldChanges.properties) {
      const result = rewriteFields(get(schema.properties!, fieldPath), fieldChanges.properties as ModifyConfig['fields'])

      if (result.warnings) {
        warnings.push(...result.warnings)
      }
    }
  })

  return { warnings: warnings.flat() }
}

function rewriteAllFields(schema: JsfSchema, configCallback: ModifyConfig['allFields'], context?: { parent: string }) {
  if (!configCallback || typeof schema !== 'object' || schema === null) {
    return { warnings: null }
  }

  const parentName = context?.parent

  if (typeof schema === 'object' && schema.properties) {
    Object.entries(schema.properties).forEach(([fieldName, fieldAttrs]) => {
      const fullName = parentName ? `${parentName}.${fieldName}` : fieldName
      mergeWith(
        get(schema.properties, fieldName),
        {
          ...(fieldAttrs as object),
          ...configCallback(fullName, fieldAttrs),
        },
        mergeReplaceArray,
      )

      // Nested fields, go recursive (fieldset)
      if (fieldAttrs.properties) {
        rewriteAllFields(fieldAttrs, configCallback, {
          parent: fieldName,
        })
      }
    })
  }

  return { warnings: null }
}

function reorderFields(schema: JsfSchema, configOrder: ModifyConfig['orderRoot']) {
  if (!configOrder) {
    return { warnings: null }
  }

  const warnings: RewriteWarning[] = []
  const originalOrder = schema['x-jsf-order'] || []
  const orderConfig = typeof configOrder === 'function' ? configOrder(originalOrder) : configOrder
  const remaining = difference(originalOrder, orderConfig)

  if (remaining.length > 0) {
    warnings.push({
      type: WARNING_TYPES.ORDER_MISSING_FIELDS,
      message: `Some fields got forgotten in the new order. They were automatically appended: ${remaining.join(
        ', ',
      )}`,
    })
  }
  schema['x-jsf-order'] = [...orderConfig, ...remaining]

  return { warnings }
}

function createFields(schema: JsfSchema, fieldsConfig: ModifyConfig['create']) {
  if (!fieldsConfig) {
    return { warnings: null }
  }

  const warnings: RewriteWarning[] = []
  const fieldsToCreate = Object.entries(fieldsConfig)

  fieldsToCreate.forEach(([shortPath, fieldAttrs]) => {
    const fieldPath = shortToFullPath(shortPath)
    const newFieldAttrs = get(schema.properties, fieldPath)
    if (!fieldAttrs || !newFieldAttrs) {
      return { warnings: null }
    }

    if (fieldAttrs.properties) {
      // Recursive to nested fields...
      const result = createFields(newFieldAttrs, fieldAttrs.properties)
      if (result.warnings) {
        warnings.push(...result.warnings)
      }
    }

    const fieldInSchema = get(schema.properties, fieldPath)

    if (fieldInSchema) {
      warnings.push({
        type: WARNING_TYPES.FIELD_TO_CREATE_EXISTS,
        message: `Creating field "${shortPath}" was ignored because it already exists.`,
      })
      return
    }

    const fieldInObjectPath = set({}, fieldPath, (fieldAttrs))
    merge(schema.properties, fieldInObjectPath)
  })

  return { warnings: warnings.flat() }
}

function pickFields(originalSchema: JsfSchema, fieldsToPick: ModifyConfig['pick']): { schema: JsfSchema, warnings: RewriteWarning[] | null } {
  if (!fieldsToPick) {
    return { schema: originalSchema, warnings: null }
  }

  // Start a new schema without any properties
  const newSchema: JsfSchema = {
    properties: {},
  }

  Object.entries(originalSchema).forEach(([attrKey, attrValue]) => {
    switch (attrKey) {
      case 'properties':
        // TODO — handle recursive nested fields
        fieldsToPick.forEach((fieldPath) => {
          set(newSchema.properties!, fieldPath, attrValue[fieldPath])
        })
        break
      case 'x-jsf-order':
      case 'required':
        newSchema[attrKey] = attrValue.filter((fieldName: string) => fieldsToPick.includes(fieldName))
        break
      case 'allOf': {
        // remove conditionals that do not contain any reference to fieldsToPick
        const newConditionalArray = originalSchema[attrKey]?.filter(condition =>
          isConditionalReferencingAnyPickedField(condition, fieldsToPick),
        )

        newSchema[attrKey] = newConditionalArray

        break
      }
      case 'x-jsf-logic':
        newSchema[attrKey] = attrValue
        break
    }
  })

  // TODO: Improve this, as this logic could be done in the isConditionalReferencingAnyPickedField function
  // Look for unpicked fields in the conditionals
  let missingFields = {}
  if (newSchema.allOf?.length) {
    newSchema.allOf.forEach((condition: JsfSchema) => {
      const { if: ifCondition, then: thenCondition, else: elseCondition } = condition
      const index = originalSchema.allOf?.indexOf(condition)
      missingFields = {
        ...missingFields,
        ...findMissingFields(ifCondition, {
          fields: fieldsToPick,
          path: `allOf[${index}].if`,
        }),
        ...findMissingFields(thenCondition, {
          fields: fieldsToPick,
          path: `allOf[${index}].then`,
        }),
        ...findMissingFields(elseCondition, {
          fields: fieldsToPick,
          path: `allOf[${index}].else`,
        }),
      }
    })
  }

  const warnings = []

  if (Object.keys(missingFields).length > 0) {
    // Re-add them to the schema...
    Object.entries(missingFields).forEach(([fieldName]) => {
      set(newSchema.properties!, fieldName, originalSchema.properties?.[fieldName])
    })

    warnings.push({
      type: WARNING_TYPES.PICK_MISSED_FIELD,
      message: `The picked fields are in conditionals that refeer other fields. They added automatically: ${Object.keys(
        missingFields,
      )
        .map(name => `"${name}"`)
        .join(', ')}. Check "meta" for more details.`,
      meta: missingFields,
    })
  }

  return { schema: newSchema, warnings }
}

function findMissingFields(conditional: JsfSchema | undefined, { fields, path }: { fields: string[], path: string }) {
  if (!conditional) {
    return null
  }

  const missingFields: Record<string, { path: string }> = {}

  conditional.required?.forEach((fieldName: string) => {
    if (!fields.includes(fieldName)) {
      missingFields[fieldName] = {
        path,
      }
    }
  })

  Object.entries(conditional.properties || []).forEach(([fieldName]) => {
    if (!fields.includes(fieldName)) {
      missingFields[fieldName] = { path }
    }

    // TODO support nested fields (eg if properties.adddress.properties.door_number)
  })

  return missingFields
}

interface ModifyConfig {
  fields?: Record<string, Partial<JsfSchema> | ((attrs: JsfSchema) => Partial<JsfSchema>)>
  allFields?: (name: string, attrs: JsfSchema) => Partial<JsfSchema>
  create?: Record<string, Partial<JsfSchema>>
  pick?: string[]
  orderRoot?: string[] | ((originalOrder: string[]) => string[])
  muteLogging?: boolean
};

export function modifySchema(originalSchema: JsfSchema, config: ModifyConfig) {
  // Create a deep copy of the original schema so we don't mutate the original one.
  const schema = JSON.parse(JSON.stringify(originalSchema))

  const resultRewrite = rewriteFields(schema, config.fields)
  const resultRewriteAll = rewriteAllFields(schema, config.allFields)

  const resultCreate = createFields(schema, config.create)

  const resultPick = pickFields(schema, config.pick)

  const finalSchema = resultPick.schema
  const resultReorder = reorderFields(finalSchema, config.orderRoot)

  if (!config.muteLogging) {
    console.warn(
      'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteLogging: true` to the config.',
    )
  }

  const warnings = [
    resultRewrite.warnings,
    resultRewriteAll.warnings,
    resultCreate.warnings,
    resultPick.warnings,
    resultReorder.warnings,
  ]
    .flat()
    .filter(Boolean)

  return {
    schema: finalSchema,
    warnings,
  }
}
