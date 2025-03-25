import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { validateSchema } from './validation/schema'
import { isObjectValue } from './validation/util'

/**
 * Updates field visibility based on JSON schema conditional rules
 * @param fields - The fields to update
 * @param values - The current form values
 * @param schema - The JSON schema definition
 * @param options - Validation options
 */
export function updateFieldVisibility(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!isObjectValue(values)) {
    return
  }

  // Special handling for other_job field which has custom visibility logic
  const otherJobField = fields.find(f => f.name === 'other_job')
  if (otherJobField && otherJobField.fields) {
    if (isObjectValue(values)) {
      let hasOtherJobRules: NonBooleanJsfSchema[] = []

      if (schema.allOf && Array.isArray(schema.allOf)) {
        hasOtherJobRules = schema.allOf.filter((rule) => {
          if (typeof rule === 'object' && rule !== null && 'if' in rule) {
            const ifCondition = rule.if
            return typeof ifCondition === 'object'
              && ifCondition !== null
              && 'properties' in ifCondition
              && ifCondition.properties
              && 'has_other_job' in ifCondition.properties
          }
          return false
        }) as NonBooleanJsfSchema[]
      }

      if (hasOtherJobRules.length > 0) {
        for (const rule of hasOtherJobRules) {
          if (typeof rule !== 'object' || rule === null || !('if' in rule))
            continue

          const ifErrors = validateSchema(values, rule.if!, options)
          const conditionMatches = ifErrors.length === 0

          if (otherJobField.fields) {
            for (const subfield of otherJobField.fields) {
              if (conditionMatches && rule.then) {
                const isRequired = typeof rule.then === 'object'
                  && rule.then !== null
                  && 'required' in rule.then
                  && Array.isArray(rule.then.required)
                  && rule.then.required.includes(subfield.name)

                if (isRequired) {
                  subfield.isVisible = true
                }
              }
              else if (!conditionMatches && rule.else) {
                const shouldHide = typeof rule.else === 'object'
                  && rule.else !== null
                  && 'properties' in rule.else
                  && rule.else.properties
                  && subfield.name in rule.else.properties
                  && rule.else.properties[subfield.name] === false

                if (shouldHide) {
                  subfield.isVisible = false
                }
              }
            }
          }
        }
      }
    }
  }

  processObjectFieldsWithConditions(fields, values, schema, options)
}

/**
 * Processes conditional logic for object fields and their nested structure
 * @param fields - The fields to process
 * @param values - The current form values
 * @param schema - The JSON schema to apply
 * @param options - Validation options
 *
 * First applies rules to the current level of fields, then handles
 * nested object fields that have their own conditional logic.
 */
function processObjectFieldsWithConditions(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!isObjectValue(values)) {
    return
  }

  applySchemaRules(fields, values, schema, options)

  for (const fieldName in schema.properties) {
    const fieldSchema = schema.properties[fieldName]

    // Only process object schemas with conditional logic (allOf)
    if (typeof fieldSchema !== 'object' || fieldSchema === null
      || Array.isArray(fieldSchema) || !fieldSchema.allOf) {
      continue
    }

    const objectField = fields.find(f => f.name === fieldSchema.title || f.name === fieldName)
    if (!objectField || !objectField.fields || objectField.fields.length === 0) {
      continue
    }

    const fieldValues = isObjectValue(values[fieldName])
      ? values[fieldName]
      : isObjectValue(values[objectField.name]) ? values[objectField.name] : {}

    applySchemaRules(objectField.fields, fieldValues, fieldSchema as JsfObjectSchema, options)

    // Only process nested fields if parent is visible
    if (objectField.isVisible) {
      processObjectFieldsWithConditions(
        objectField.fields,
        fieldValues,
        fieldSchema as JsfObjectSchema,
        options,
      )
    }
  }
}

/**
 * Applies JSON Schema conditional rules to determine field visibility
 * @param fields - The fields to apply rules to
 * @param values - The current form values
 * @param schema - The JSON schema containing the rules
 * @param options - Validation options
 *
 * Fields start with visibility based on their required status.
 * Conditional rules in the schema's allOf property can then:
 * - Make fields visible by including them in a required array
 * - Make fields hidden by setting them to false in properties
 */
function applySchemaRules(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!schema.allOf || !Array.isArray(schema.allOf) || !isObjectValue(values)) {
    return
  }

  const conditionalRules = schema.allOf
    .filter(rule => typeof rule === 'object' && rule !== null && 'if' in rule)
    .map((rule) => {
      const ruleObj = rule as NonBooleanJsfSchema

      const ifErrors = validateSchema(values, ruleObj.if!, options)
      const matches = ifErrors.length === 0

      // Prevent fields from being shown when required fields have type errors
      let hasTypeErrors = false
      if (matches
        && typeof ruleObj.if === 'object'
        && ruleObj.if !== null
        && 'required' in ruleObj.if
        && Array.isArray(ruleObj.if.required)) {
        const requiredFields = ruleObj.if.required
        hasTypeErrors = requiredFields.some((fieldName) => {
          if (!schema.properties || !schema.properties[fieldName]) {
            return false
          }
          const fieldSchema = schema.properties[fieldName]
          const fieldValue = values[fieldName]
          const fieldErrors = validateSchema(fieldValue, fieldSchema, options)
          return fieldErrors.some(error => error.validation === 'type')
        })
      }

      return { rule: ruleObj, matches: matches && !hasTypeErrors }
    })

  for (const field of fields) {
    // Default visibility is based on required status
    let isVisible = field.required

    for (const { rule, matches } of conditionalRules) {
      if (matches && rule.then) {
        isVisible = isFieldVisible(field.name, rule.then, isVisible)
      }
      else if (!matches && rule.else) {
        isVisible = isFieldVisible(field.name, rule.else, isVisible)
      }
    }

    field.isVisible = isVisible
  }
}

/**
 * Determines whether a field should be visible based on a schema branch
 * @param fieldName - The name of the field
 * @param branch - The schema clause (either 'then' or 'else')
 * @param currentVisibility - The current visibility state
 * @returns The updated visibility state
 *
 * Visibility logic:
 * - If the field is in the required array → make visible
 * - If the field is explicitly false in properties → make hidden
 * - Otherwise, preserve current visibility
 */
function isFieldVisible(
  fieldName: string,
  branch: JsfSchema,
  currentVisibility: boolean,
): boolean {
  let isVisible = currentVisibility

  if (typeof branch === 'object' && branch !== null) {
    if ('required' in branch && Array.isArray(branch.required)) {
      if (branch.required.includes(fieldName)) {
        isVisible = true
      }
    }

    if ('properties' in branch && branch.properties) {
      if (fieldName in branch.properties && branch.properties[fieldName] === false) {
        isVisible = false
      }
    }
  }

  return isVisible
}
