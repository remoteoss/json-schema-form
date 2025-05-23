import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema, ObjectValue, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { buildFieldSchema } from './field/schema'
import { applyComputedAttrsToSchema, getJsonLogicContextFromSchema } from './validation/json-logic'
import { validateSchema } from './validation/schema'
import { isObjectValue } from './validation/util'

/**
 * Updates field properties based on JSON schema conditional rules
 * @param fields - The fields to update
 * @param values - The current form values
 * @param schema - The JSON schema definition
 * @param options - Validation options
 */
export function mutateFields(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!isObjectValue(values)) {
    return
  }

  // We should get the json-logic context from the schema in case we need to mutate fields using computed values
  const jsonLogicSchema = schema['x-jsf-logic']
  const jsonLogicContext = jsonLogicSchema ? getJsonLogicContextFromSchema(jsonLogicSchema, values) : undefined

  // Apply schema rules to current level of fields
  applySchemaRules(fields, values, schema, options, jsonLogicContext)

  // Process nested object fields that have conditional logic
  for (const fieldName in schema.properties) {
    const fieldSchema = schema.properties[fieldName]
    const field = fields.find(field => field.name === fieldName)

    if (field?.fields) {
      applySchemaRules(field.fields, values[fieldName], fieldSchema as JsfObjectSchema, options, jsonLogicContext)
    }
  }
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
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
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
      processBranch(fields, values, rule.then, options, jsonLogicContext)
    }
    // If the rule doesn't match, process the else branch
    else if (!matches && rule.else) {
      processBranch(fields, values, rule.else, options, jsonLogicContext)
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
function processBranch(fields: Field[], values: SchemaValue, branch: JsfSchema, options: ValidationOptions = {}, jsonLogicContext: JsonLogicContext | undefined) {
  if (branch.properties) {
    // Cycle through each property in the schema and search for any property that needs
    // to be updated in the fields collection.
    for (const fieldName in branch.properties) {
      let fieldSchema = branch.properties[fieldName]

      // If the field schema has computed attributes, we need to apply them to the field schema
      if (fieldSchema['x-jsf-logic-computedAttrs']) {
        fieldSchema = applyComputedAttrsToSchema(fieldSchema as JsfObjectSchema, jsonLogicContext?.schema.computedValues, values)
      }

      const field = fields.find(e => e.name === fieldName)
      if (field) {
        // If the field has a false schema, it should be removed from the form (hidden)
        if (fieldSchema === false) {
          field.isVisible = false
        }
        // If the field has inner fields, we need to process them
        else if (field?.fields) {
          processBranch(field.fields, values, fieldSchema, options, jsonLogicContext)
        }
        // If the field has properties being declared on this branch, we need to update the field
        // with the new properties
        const newField = buildFieldSchema(fieldSchema as JsfObjectSchema, fieldName, false)
        for (const key in newField) {
          // We don't want to override the type property
          if (!['type'].includes(key)) {
            field[key] = newField[key]
          }
        }
      }
    }
  }

  // Go through the `required` array and mark all fields included in the array as required
  if (Array.isArray(branch.required)) {
    fields.forEach((field) => {
      if (branch.required!.includes(field.name)) {
        field.required = true
      }
    })
  }

  // Apply rules to the branch
  applySchemaRules(fields, values, branch as JsfObjectSchema, options, jsonLogicContext)
}
