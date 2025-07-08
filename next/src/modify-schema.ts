import type { JsfSchema } from './types'
import difference from 'lodash/difference'
import get from 'lodash/get'
import intersection from 'lodash/intersection'
import merge from 'lodash/merge'
import mergeWith from 'lodash/mergeWith'
import set from 'lodash/set'

type FieldOutput = Partial<JsfSchema>

type FieldModification = Partial<JsfSchema> & {
  presentation?: JsfSchema['x-jsf-presentation']
  errorMessage?: JsfSchema['x-jsf-errorMessage']
}

interface ModifyConfig {
  fields?: Record<string, FieldModification | ((attrs: JsfSchema) => FieldOutput)>
  allFields?: (name: string, attrs: JsfSchema) => FieldModification
  create?: Record<string, FieldModification>
  pick?: string[]
  orderRoot?: string[] | ((originalOrder: string[]) => string[])
  muteLogging?: boolean
};

type WarningType = 'FIELD_TO_CHANGE_NOT_FOUND'
  | 'ORDER_MISSING_FIELDS'
  | 'FIELD_TO_CREATE_EXISTS'
  | 'PICK_MISSED_FIELD'

interface Warning {
  type: WarningType
  message: string
  meta?: Record<string, any>
}

interface ModifyResult {
  warnings: Warning[] | null
}

/**
 * Converts a short path to a full path
 * @param {string} path
 * @returns {string} The full path
 * @example
 * shortToFullPath('foo.bar') // 'foo.properties.bar'
 */
function shortToFullPath(path: string) {
  return path.replace('.', '.properties.')
}

/**
 * Standardizes the attributes of a field, using the x-jsf-errorMessage and x-jsf-presentation shorthands
 * @param {JsfSchema} attrs - The attributes of a field
 * @returns {JsfSchema} The standardized attributes
 */
function standardizeAttrs(attrs: FieldModification) {
  const { errorMessage, presentation, properties, ...rest } = attrs as Record<string, unknown>

  return {
    ...rest,
    ...(presentation ? { 'x-jsf-presentation': presentation } : {}),
    ...(errorMessage ? { 'x-jsf-errorMessage': errorMessage } : {}),
  } as JsfSchema
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

/**
 *  Checks if a conditional schema references any of the fields being picked
 * @param {JsfSchema} condition - The conditional schema
 * @param {string[]} fieldsToPick - The fields being picked
 * @returns {boolean} True if the conditional schema references any of the fields being picked
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

/**
 * Rewrites fields in the schema
 * @param {JsfSchema} schema - The schema to rewrite
 * @param {ModifyConfig['fields']} fieldsConfig - The fields to rewrite
 * @returns {ModifyResult} The warnings that occurred during the rewrite
 */
function rewriteFields(schema: JsfSchema, fieldsConfig: ModifyConfig['fields']): ModifyResult {
  if (!fieldsConfig) {
    return { warnings: null }
  }

  const warnings: Warning[] = []

  const fieldsToModify = Object.entries(fieldsConfig)

  fieldsToModify.forEach(([shortPath, mutation]) => {
    const fieldPath = shortToFullPath(shortPath)

    const fieldAttrs = get(schema.properties, fieldPath) as JsfSchema

    if (!fieldAttrs) {
      // Do not override/edit a field that does not exist.
      // That's the job of config.create() method.
      warnings.push({
        type: 'FIELD_TO_CHANGE_NOT_FOUND',
        message: `Changing field "${shortPath}" was ignored because it does not exist.`,
      })
      return
    }

    const fieldChanges = typeof mutation === 'function' ? mutation(fieldAttrs) : mutation

    mergeWith(
      fieldAttrs,
      {
        ...standardizeAttrs(fieldChanges) as object,
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
      const callbackResult = configCallback(fullName, fieldAttrs)
      const resultWithStandardizedAttrs = standardizeAttrs(callbackResult)

      mergeWith(
        get(schema.properties, fieldName),
        {
          ...(fieldAttrs as object),
          ...(resultWithStandardizedAttrs as object),
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

/**
 * Reorders fields in the schema in-place
 * @param {JsfSchema} schema - The schema to reorder
 * @param {ModifyConfig['orderRoot']} configOrder - The order to reorder the fields
 * @returns {ModifyResult} The warnings that occurred during the reordering
 */
function reorderFields(schema: JsfSchema, configOrder: ModifyConfig['orderRoot']) {
  if (!configOrder) {
    return { warnings: null }
  }

  const warnings: Warning[] = []
  const originalOrder = schema['x-jsf-order'] || []
  const orderConfig = typeof configOrder === 'function' ? configOrder(originalOrder) : configOrder
  const remaining = difference(originalOrder, orderConfig)

  if (remaining.length > 0) {
    warnings.push({
      type: 'ORDER_MISSING_FIELDS',
      message: `Some fields got forgotten in the new order. They were automatically appended: ${remaining.join(
        ', ',
      )}`,
    })
  }
  schema['x-jsf-order'] = [...orderConfig, ...remaining]

  return { warnings }
}

/**
 * Creates fields in the schema in-place
 * @param {JsfSchema} schema - The schema to create fields in
 * @param {ModifyConfig['create']} fieldsConfig - The fields to create
 * @returns {ModifyResult} The warnings that occurred during the creation
 */
function createFields(schema: JsfSchema, fieldsConfig: ModifyConfig['create']) {
  if (!fieldsConfig) {
    return { warnings: null }
  }

  const warnings: Warning[] = []
  const fieldsToCreate = Object.entries(fieldsConfig)

  fieldsToCreate.forEach(([shortPath, fieldAttrs]) => {
    const fieldPath = shortToFullPath(shortPath)
    if (!fieldAttrs) {
      return { warnings: null }
    }

    if (fieldAttrs.properties) {
      // Recursive to nested fields...
      const recursiveFieldAttrs = get(schema.properties, fieldPath)
      if (!recursiveFieldAttrs) {
        return { warnings: null }
      }
      const result = createFields(recursiveFieldAttrs, fieldAttrs.properties as ModifyConfig['create'])
      if (result.warnings) {
        warnings.push(...result.warnings)
      }
    }

    const fieldInSchema = get(schema.properties, fieldPath)

    if (fieldInSchema) {
      warnings.push({
        type: 'FIELD_TO_CREATE_EXISTS',
        message: `Creating field "${shortPath}" was ignored because it already exists.`,
      })
      return
    }

    const fieldInObjectPath = set({}, fieldPath, (fieldAttrs))
    merge(schema.properties, fieldInObjectPath)
  })

  return { warnings: warnings.flat() }
}

/**
 * Returns a new schema with only the picked fields
 *
 * @param {JsfSchema} originalSchema - The original schema
 * @param {ModifyConfig['pick']} fieldsToPick - The fields to pick
 * @returns {ModifyResult} The new schema and the warnings that occurred during the picking
 */
function pickFields(originalSchema: JsfSchema, fieldsToPick: ModifyConfig['pick']): { schema: JsfSchema } & ModifyResult {
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
        const newConditionalArray = originalSchema[attrKey]?.filter((condition: JsfSchema) =>
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
  let missingFields: Record<string, { path: string }> = {}
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

  const warnings: Warning[] = []

  if (Object.keys(missingFields).length > 0) {
    // Re-add them to the schema...
    Object.entries(missingFields).forEach(([fieldName]) => {
      set(newSchema.properties!, fieldName, originalSchema.properties?.[fieldName])
    })

    warnings.push({
      type: 'PICK_MISSED_FIELD',
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

/**
 * Finds missing fields in a conditional
 * @param {JsfSchema} conditional - The conditional schema
 * @param {object} params - The parameters
 * @param {string[]} params.fields - The fields to pick
 * @param {string} params.path - The path to the conditional
 * @returns {Record<string, { path: string }>} The missing fields
 */
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

/**
 * Modifies the schema
 * Use modify() when you need to customize the generated fields. This function creates a new version of JSON schema based on a provided configuration. Then you pass the new schema to createHeadlessForm()
 *
 * @example
 * const modifiedSchema = modify(schema, {
 *   fields: {
 *     name: { type: 'string', title: 'Name' },
 *   },
 * })
 * @param {JsfSchema} originalSchema - The original schema
 * @param {ModifyConfig} config - The config
 * @returns {ModifyResult} The new schema and the warnings that occurred during the modifications
 */
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
