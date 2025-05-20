import type { JSONSchema } from 'json-schema-typed'
import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema, ObjectValue, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { buildFieldSchema } from './field/schema'
import { computePropertyValues } from './validation/json-logic'
import { validateSchema } from './validation/schema'
import { isObjectValue, safeDeepClone } from './validation/util'

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

  // Apply rules to current level of fields
  applySchemaRules(fields, values, schema, options)

  // Process nested object fields that have conditional logic
  for (const fieldName in schema.properties) {
    const fieldSchema = schema.properties[fieldName]
    const field = fields.find(field => field.name === fieldName)

    if (field?.fields) {
      applySchemaRules(field.fields, values[fieldName], fieldSchema as JsfObjectSchema, options)
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
 *
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
      processBranch(fields, values, rule.then, options)
    }
    // If the rule doesn't match, process the else branch
    else if (!matches && rule.else) {
      processBranch(fields, values, rule.else, options)
    }
  }
}

/**
 * Processes a branch of a conditional rule, updating the properties of fields based on the branch's schema
 * @param fields - The fields to process
 * @param values - The current form values
 * @param branch - The branch (schema representing and then/else) to process
 * @param options - Validation options
 */
function processBranch(fields: Field[], values: SchemaValue, branch: JsfSchema, options: ValidationOptions = {}) {
  if (branch.properties) {
    // Cycle through each property in the schema and search for any property that needs
    // to be updated in the fields collection.
    // Note: False schemas mean the field should be hidden in the form (isVisible = false)
    for (const fieldName in branch.properties) {
      const fieldSchema = branch.properties[fieldName]
      const field = fields.find(e => e.name === fieldName)
      if (field) {
        // If the field has a false schema, it should be removed from the form (hidden)
        if (fieldSchema === false) {
          field.isVisible = false
        }
        // If the field has inner fields, we need to process them
        else if (field?.fields) {
          processBranch(field.fields, values, fieldSchema)
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

  // Apply rules to the branch
  applySchemaRules(fields, values, branch as JsfObjectSchema, options)
}

/**
 * Applies any computed attributes to a schema, based on the provided values. When there are values to apply,
 * it creates a deep clone of the schema and applies the computed values to the clone,otherwise it returns the original schema.
 *
 * @param schema - The schema to apply computed attributes to
 * @param values - The current form values
 * @returns The schema with computed attributes applied
 */
export function applyComputedAttrsToSchema(schema: JsfObjectSchema, values: SchemaValue) {
  // make a version with all the computed attrs computed and applied
  // check if the schema has a 'x-jsf-logic' property with a 'computedValues' property
  if (schema['x-jsf-logic']?.computedValues) {
    // apply the computed values to the schema
    const computedValuesDefinition = schema['x-jsf-logic'].computedValues
    const computedValues: Record<string, string> = {}

    Object.entries(computedValuesDefinition).forEach(([name, definition]) => {
      const computedValue = computePropertyValues(definition.rule, values)
      computedValues[name] = computedValue
    })

    const schemaCopy = safeDeepClone(schema)

    cycleThroughPropertiesAndApplyValues(schemaCopy, computedValues)

    return schemaCopy
  }
  else {
    return schema
  }
}

/**
 * Cycles through the properties of a schema and applies the computed values to it
 * @param schemaCopy - The schema to apply computed values to
 * @param computedValues - The computed values to apply
 */
function cycleThroughPropertiesAndApplyValues(schemaCopy: JsfObjectSchema, computedValues: Record<string, string>) {
  for (const propertyName in schemaCopy.properties) {
    const computedAttrs = schemaCopy.properties[propertyName]['x-jsf-logic-computedAttrs']
    if (computedAttrs) {
      const propertySchema = schemaCopy.properties[propertyName] as JsfObjectSchema
      cycleThroughAttrsAndApplyValues(propertySchema, computedValues, computedAttrs)

      if (propertySchema.type === 'object' && propertySchema.properties) {
        Object.entries(propertySchema.properties).forEach(([_, property]) => {
          cycleThroughPropertiesAndApplyValues(property as JsfObjectSchema, computedValues)
        })
      }
      delete propertySchema['x-jsf-logic-computedAttrs']
    }
  }
}

/**
 * Cycles through the attributes of a schema and applies the computed values to it
 * @param propertySchema - The schema to apply computed values to
 * @param computedValues - The computed values to apply
 */
function cycleThroughAttrsAndApplyValues(propertySchema: JsfObjectSchema, computedValues: Record<string, string>, computedAttrs: JsfSchema['x-jsf-logic-computedAttrs']) {
  for (const key in computedAttrs) {
    const attributeName = key as keyof NonBooleanJsfSchema
    const computationName = computedAttrs[key]
    // const computedValue = computedValues[key]
    // If the computation points to a string, it's a computed value and we can apply it directly
    if (typeof computationName === 'string') {
      const computedValue = computedValues[computationName]
      propertySchema[attributeName] = computedValue
    }
    else {
      Object.entries(computationName).forEach(([key, value]) => {
        propertySchema[attributeName][key] = computedValues[value]
      })
    }
  }
}
