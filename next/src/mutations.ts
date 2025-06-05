import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema, ObjectValue, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { buildFieldSchema } from './field/schema'
import { deepMergeSchemas } from './utils'
import { applyComputedAttrsToSchema, getJsonLogicContextFromSchema } from './validation/json-logic'
import { validateSchema } from './validation/schema'
import { isObjectValue, safeDeepClone } from './validation/util'

/**
 * Creates a new version of the schema with all the computed attrs applied, as well as the
 * final version of each property (taking into account conditional rules)
 * @param params - The parameters for the function
 * @param params.schema - The original schema
 * @param params.values - The current form values
 * @param params.options - Validation options
 * @returns The new schema
 */
export function calculateFinalSchema({
  schema,
  values,
  options = {},
}: {
  schema: JsfObjectSchema
  values: SchemaValue
  options?: ValidationOptions
}): JsfObjectSchema {
  const jsonLogicContext = schema['x-jsf-logic'] ? getJsonLogicContextFromSchema(schema['x-jsf-logic'], values) : undefined
  const schemaCopy = safeDeepClone(schema)

  applySchemaRules(schemaCopy, values, options, jsonLogicContext)

  if (jsonLogicContext?.schema.computedValues) {
    applyComputedAttrsToSchema(schemaCopy, jsonLogicContext.schema.computedValues, values)
  }

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
  const conditionIsTrue = validateSchema(values, rule.if!, options).length === 0

  // Prevent fields from being shown when required fields have type errors
  let hasTypeErrors = false
  if (conditionIsTrue && rule.if?.required) {
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

  return { rule, matches: conditionIsTrue && !hasTypeErrors }
}

/**
 * Applies JSON Schema conditional rules to determine updated field properties
 * @param schema - The JSON schema containing the rules
 * @param values - The current form values
 * @param options - Validation options
 * @param jsonLogicContext - JSON Logic context
 */
function applySchemaRules(
  schema: JsfObjectSchema,
  values: SchemaValue = {},
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
      // Delete the then branch to avoid processing it again when validating the schema
      delete rule.then
    }
    // If the rule doesn't match, process the else branch
    else if (!matches && rule.else) {
      processBranch(schema, values, rule.else, options, jsonLogicContext)
      // Delete the else branch to avoid processing it again when validating the schema
      delete rule.else
    }
  }

  if (schema.properties) {
    for (const [key, property] of Object.entries(schema.properties)) {
      if (typeof property === 'object') {
        const propertySchema = property as JsfObjectSchema
        if (propertySchema.type === 'object') {
          applySchemaRules(propertySchema, values[key] as ObjectValue, options, jsonLogicContext)
        }
        if (propertySchema.items) {
          applySchemaRules(propertySchema.items as JsfObjectSchema, values[key], options, jsonLogicContext)
        }
      }
    }
  }
}

/**
 * Processes a branch of a conditional rule, updating the properties of fields based on the branch's schema
 * @param schema - The JSON schema containing the rules
 * @param values - The current form values
 * @param branch - The branch (schema representing and then/else) to process
 * @param options - Validation options
 * @param jsonLogicContext - JSON Logic context
 */
function processBranch(schema: JsfObjectSchema, values: SchemaValue, branch: JsfSchema, options: ValidationOptions = {}, jsonLogicContext: JsonLogicContext | undefined) {
  const branchSchema = branch as JsfObjectSchema

  applySchemaRules(branchSchema, values, options, jsonLogicContext)
  deepMergeSchemas(schema, branchSchema)
}

/**
 * Updates fields (in place) based on a schema, recursively if needed
 * @param fields - The fields array to mutate
 * @param schema - The schema to use for updating fields
 */
export function updateFieldProperties(fields: Field[], schema: JsfObjectSchema, originalSchema: JsfSchema): void {
  // Get new fields from schema
  const newFields = buildFieldSchema({
    schema,
    name: 'root',
    required: true,
    originalSchema,
    strictInputType: false,
  })?.fields || []

  // cycle through the original fields and merge the new fields with the original fields
  for (const field of fields) {
    const newField = newFields.find(f => f.name === field.name)

    if (newField) {
      // Properties might have been removed with the most recent schema (due to most recent form values)
      // so we need to remove them from the original field
      removeNonExistentProperties(field, newField)
      deepMergeSchemas(field, newField)

      const fieldSchema = schema.properties?.[field.name]

      if (fieldSchema && typeof fieldSchema === 'object') {
        if (field.fields && fieldSchema.type === 'object') {
          updateFieldProperties(field.fields, fieldSchema as JsfObjectSchema, originalSchema)
        }
      }
    }
  }
}

/**
 * Recursively removes properties that don't exist in newObj
 * @param obj - The object to remove properties from
 * @param newObj - The object to compare with
 */
function removeNonExistentProperties(obj: Field, newObj: Field) {
  for (const [key] of Object.entries(obj)) {
    if (!newObj[key]) {
      delete obj[key]
    }
    else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])
      && newObj[key] && typeof newObj[key] === 'object' && !Array.isArray(newObj[key])) {
      // Recursively process nested objects
      removeNonExistentProperties(obj[key] as Field, newObj[key] as Field)
    }
  }
}
