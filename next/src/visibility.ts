import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema, ObjectValue, SchemaValue } from './types'
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

  // Apply rules to current level of fields
  applySchemaRules(fields, values, schema, options)

  // Process nested object fields that have conditional logic
  for (const fieldName in schema.properties) {
    const fieldSchema = schema.properties[fieldName]

    // Only process object schemas with conditional logic (allOf)
    if (typeof fieldSchema !== 'object' || fieldSchema === null
      || Array.isArray(fieldSchema) || !fieldSchema.allOf) {
      continue
    }

    const objectField = fields.find(field => field.name === fieldSchema.title || field.name === fieldName)
    if (!objectField || !objectField.fields || objectField.fields.length === 0) {
      continue
    }

    const fieldValues = isObjectValue(values[fieldName])
      ? values[fieldName]
      : isObjectValue(values[objectField.name]) ? values[objectField.name] : {}

    // Apply rules to nested fields
    applySchemaRules(objectField.fields, fieldValues, fieldSchema as JsfObjectSchema, options)
  }
}

function evaluateConditional(
  values: ObjectValue,
  schema: JsfObjectSchema,
  rule: NonBooleanJsfSchema,
  options: ValidationOptions = {},
) {
  const ruleObj = rule as NonBooleanJsfSchema

  const ifErrors = validateSchema(values, ruleObj.if!, options)
  const matches = ifErrors.length === 0

  // Prevent fields from being shown when required fields have type errors
  let hasTypeErrors = false
  if (matches
    && typeof ruleObj.if === 'object'
    && ruleObj.if !== null
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
  if (!isObjectValue(values)) {
    return
  }

  const conditionalRules: { rule: NonBooleanJsfSchema, matches: boolean }[] = []

  if (schema.if) {
    conditionalRules.push(evaluateConditional(values, schema, schema, options))
  }

  /// TODO: should we check for anyOf as well??
  (schema.allOf ?? [])
    .filter(rule => typeof rule === 'object' && rule !== null && 'if' in rule)
    .forEach((rule) => {
      const result = evaluateConditional(values, schema, rule as NonBooleanJsfSchema, options)
      conditionalRules.push(result)
    })

  resetVisibility(fields)

  for (const { rule, matches } of conditionalRules) {
    if (matches && rule.then) {
      processBranch(fields, rule.then)
    }
    else if (!matches && rule.else) {
      processBranch(fields, rule.else)
    }
  }
}

function resetVisibility(fields: Field[]) {
  for (const field of fields) {
    field.isVisible = true
    if (field.fields) {
      resetVisibility(field.fields)
    }
  }
}

function processBranch(fields: Field[], branch: JsfSchema) {
  if (branch.properties) {
    // cycle through each branch property
    for (const fieldName in branch.properties) {
      const fieldSchema = branch.properties[fieldName]
      const field = fields.find(e => e.name === fieldName)
      if (field) {
        if (field?.fields) {
          processBranch(field.fields, fieldSchema)
        }
        else if (fieldSchema === false) {
          field.isVisible = false
        }
        else {
          field.isVisible = true
        }
      }
    }
  }
}
