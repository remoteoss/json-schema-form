import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, JsonLogicRules, NonBooleanJsfSchema, ObjectValue, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { buildFieldSchema } from './field/schema'
import { deepMerge } from './utils'
import { applyComputedAttrsToSchema, getJsonLogicContextFromSchema } from './validation/json-logic'
import { validateSchema } from './validation/schema'
import { isObjectValue, safeDeepClone } from './validation/util'

/**
 * Mutates a schema to take into account the computed values and the conditional rules
 * @param schema
 * @param computedValuesDefinition - The computed values definition
 * @param values - The current form values
 * @returns The mutated schema
 */
export function mutateSchema(schema: JsfObjectSchema, computedValuesDefinition: JsonLogicRules['computedValues'], values: SchemaValue, options: ValidationOptions = {}, jsonLogicContext: JsonLogicContext | undefined): JsfObjectSchema {
  const schemaCopy = safeDeepClone(schema)

  applySchemaRules(schemaCopy, values, options, jsonLogicContext)

  applyComputedAttrsToSchema(schemaCopy, computedValuesDefinition, values)

  return schemaCopy
}

/**
 * Evaluates the conditional rules for a field
 * @param values - The current field values
 * @param schema - The JSON schema definition
 * @param rule - Schema identifying the conditional rule
 * @param options - Validation options
 * @returns An object containing the rule and whether it matches
 */
function evaluateConditional(
  values: ObjectValue,
  schema: JsfObjectSchema,
  rule: NonBooleanJsfSchema,
  options: ValidationOptions = {},
) {
  const ifErrors = validateSchema(values, rule.if!, options)
  const matches = ifErrors.length === 0

  // Prevent fields from being shown when required fields have type errors
  let hasTypeErrors = false
  if (matches && rule.if?.required) {
    const requiredFields = rule.if.required
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

  return { rule, matches: matches && !hasTypeErrors }
}

/**
 * Applies JSON Schema conditional rules to determine updated field properties
 * @param fields - The fields to apply rules to
 * @param values - The current form values
 * @param schema - The JSON schema containing the rules
 * @param options - Validation options
 * @param jsonLogicContext - JSON Logic context
 */
function applySchemaRules(
  schema: JsfObjectSchema,
  values: SchemaValue,
  options: ValidationOptions = {},
  jsonLogicContext: JsonLogicContext | undefined,
) {
  if (!isObjectValue(values)) {
    return
  }

  const conditionalRules: { rule: NonBooleanJsfSchema, matches: boolean }[] = []

  // If the schema has an if property, evaluate it and add it to the conditional rules array
  if (schema.if) {
    conditionalRules.push(evaluateConditional(values, schema, schema, options))
  }

  // If the schema has an allOf property, evaluate each rule and add it to the conditional rules array
  (schema.allOf ?? [])
    .filter((rule: JsfSchema) => typeof rule.if !== 'undefined')
    .forEach((rule) => {
      const result = evaluateConditional(values, schema, rule as NonBooleanJsfSchema, options)
      conditionalRules.push(result)
    })

  // Process the conditional rules
  for (const { rule, matches } of conditionalRules) {
    // If the rule matches, process the then branch
    if (matches && rule.then) {
      processBranch(schema, values, rule.then, options, jsonLogicContext)
    }
    // If the rule doesn't match, process the else branch
    else if (!matches && rule.else) {
      processBranch(schema, values, rule.else, options, jsonLogicContext)
    }
  }
}

/**
 * Processes a branch of a conditional rule, updating the properties of fields based on the branch's schema
 * @param fields - The fields to process
 * @param values - The current form values
 * @param branch - The branch (schema representing and then/else) to process
 * @param options - Validation options
 * @param jsonLogicContext - JSON Logic context
 */
function processBranch(schema: JsfObjectSchema, values: SchemaValue, branch: JsfSchema, options: ValidationOptions = {}, jsonLogicContext: JsonLogicContext | undefined) {
  const branchSchema = branch as JsfObjectSchema

  applySchemaRules(branchSchema, values, options, jsonLogicContext)
  deepMerge(schema, branchSchema)
}

/**
 * Updates fields in place based on a schema, recursively if needed
 * @param fields - The fields array to mutate
 * @param schema - The schema to use for updating fields
 */
export function updateFieldProperties(fields: Field[], schema: JsfObjectSchema): void {
  // Get new fields from schema
  const newFields = buildFieldSchema(schema, 'root', true, false, 'object')?.fields || []

  // cycle through the original fields and merge the new fields with the original fields
  for (const field of fields) {
    const newField = newFields.find(f => f.name === field.name)

    if (newField) {
      deepMerge(field, newField)

      const fieldSchema = schema.properties?.[field.name]

      if (fieldSchema && typeof fieldSchema === 'object') {
        if (field.fields && fieldSchema.type === 'object') {
          updateFieldProperties(field.fields, fieldSchema as JsfObjectSchema)
        }
      }
    }
  }
}
