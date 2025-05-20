import type { RulesLogic } from 'json-logic-js'
import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema, ObjectValue, SchemaValue } from '../types'
import type { ValidationOptions } from './schema'
import jsonLogic from 'json-logic-js'
import { validateSchema } from './schema'
import { safeDeepClone } from './util'

/**
 * Checks if a string contains handlebars syntax ({{...}})
 * @param value The string to check
 * @returns true if the string contains handlebars syntax, false otherwise
 */
function containsHandlebars(value: string): boolean {
  return /\{\{.*?\}\}/.test(value)
}

/**
 * jsonLogic interprets  undefined and null values differently when running comparisons and that creates inconsistent results.
 * This function attempts to fix that (ported from v0).
 *
 * @param {object} values - a set of values from a form
 * @returns {object} values object without any undefined
 */
function replaceUndefinedAndNullValuesWithNaN(values: ObjectValue = {}) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined || value === null ? Number.NaN : value }
  }, {})
}

/**
 * Validates the JSON Logic rules for a given schema.
 *
 * @param {NonBooleanJsfSchema} schema - JSON Schema to validate.
 * @param {JsonLogicContext | undefined} jsonLogicContext - JSON Logic context.
 * @param {ValidationErrorPath} path - Current validation error path.
 * @throws {Error} If a validation has missing rule.
 */
export function validateJsonLogicRules(
  schema: NonBooleanJsfSchema,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const validations = schema['x-jsf-logic-validations']

  // if the current schema has no validations, we skip the validation
  if (!validations || validations.length === 0) {
    return []
  }

  return validations.map((validationName: string) => {
    const validationData = jsonLogicContext?.schema?.validations?.[validationName]
    const formValue = jsonLogicContext?.value

    // if the validation name does not reference any valid rule, we throw an error
    if (!validationData) {
      throw new Error(
        `[json-schema-form] json-logic error: "${schema.title}" required validation "${validationName}" doesn't exist.`,
      )
    }

    const result: any = jsonLogic.apply(validationData.rule, replaceUndefinedAndNullValuesWithNaN(formValue as ObjectValue))

    // If the condition is false, we return a validation error
    if (result === false) {
      return [{ path, validation: 'json-logic', customErrorMessage: validationData.errorMessage, schema, value: formValue } as ValidationError]
    }

    return []
  }).flat()
}

/**
 * Validates the JSON Logic computed attributes for a given schema.
 *
 * @param {SchemaValue} values - Current form values.
 * @param {NonBooleanJsfSchema} schema - JSON Schema to validate.
 * @param {ValidationOptions} options - Validation options.
 * @param {JsonLogicContext | undefined} jsonLogicContext - JSON Logic context.
 * @param {ValidationErrorPath} path - Current validation error path.
 * @throws {Error} If a computed attribute has missing rule.
 */
export function validateJsonLogicComputedAttributes(
  values: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: ValidationOptions = {},
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const computedAttributes = schema['x-jsf-logic-computedAttrs']

  // if the current schema has no computed attributes, we skip the validation
  if (!computedAttributes || Object.keys(computedAttributes).length === 0) {
    return []
  }

  // Create a copy of the schema
  const schemaCopy: NonBooleanJsfSchema = safeDeepClone(schema)

  // Remove the computed attributes from the schema
  delete schemaCopy['x-jsf-logic-computedAttrs']

  // add the new computed attributes to the schema
  Object.entries(computedAttributes).forEach(([schemaKey, value]) => {
    if (schemaKey === 'x-jsf-errorMessage') {
      const computedErrorMessages = computePropertyAttributes(
        value as Record<string, string>,
        jsonLogicContext,
      )
      if (computedErrorMessages) {
        schemaCopy['x-jsf-errorMessage'] = computedErrorMessages
      }
    }
    else {
      const validationName = value as string
      const computedAttributeRule = jsonLogicContext?.schema?.computedValues?.[validationName]?.rule

      const formValue = jsonLogicContext?.value

      // if the computation name does not reference any valid rule, we throw an error
      if (!computedAttributeRule) {
        throw new Error(`[json-schema-form] json-logic error: Computed value "${validationName}" has missing rule.`)
      }

      const result: any = jsonLogic.apply(computedAttributeRule, replaceUndefinedAndNullValuesWithNaN(formValue as ObjectValue))

      // If running the apply function returns null, some variables are probably missing
      if (result === null) {
        return
      }

      schemaCopy[schemaKey as keyof NonBooleanJsfSchema] = result
    }
  })

  // Validate the modified schema
  return validateSchema(values, schemaCopy, options, path, jsonLogicContext)
}

/**
 * Interpolates handlebars expressions in a message with computed values
 * @param message The message containing handlebars expressions
 * @param jsonLogicContext JSON Logic context containing computations
 * @returns Interpolated message with computed values
 */
function interpolate(message: string, jsonLogicContext: JsonLogicContext | undefined): string {
  if (!jsonLogicContext?.schema?.computedValues) {
    console.warn('No computed values found in the JSON Logic context')
    return message
  }

  return message.replace(/\{\{(.*?)\}\}/g, (_, computation) => {
    const computationName = computation.trim()
    const computedRule = jsonLogicContext.schema.computedValues?.[computationName]?.rule

    if (!computedRule) {
      throw new Error(
        `[json-schema-form] json-logic error: Computed value "${computationName}" doesn't exist`,
      )
    }

    const result = jsonLogic.apply(
      computedRule,
      replaceUndefinedAndNullValuesWithNaN(jsonLogicContext.value as ObjectValue),
    )

    return result?.toString() ?? `{{${computationName}}}`
  })
}

/**
 * Calculates the computed attributes for a given schema,
 * running the handlebars expressions through the JSON Logic context
 *
 * @param value The computed attributes to compute
 * @param jsonLogicContext The JSON Logic context
 * @returns The computed computed attributes
 */
function computePropertyAttributes(
  value: Record<string, string>,
  jsonLogicContext: JsonLogicContext | undefined,
): Record<string, string> | undefined {
  if (!value) {
    return undefined
  }

  const computedObjectValues: Record<string, string> = {}

  Object.entries(value).forEach(([key, value]) => {
    let computedMessage = value
    // If the message contains handlebars, interpolate it
    if (containsHandlebars(value)) {
      computedMessage = interpolate(value, jsonLogicContext)
    }
    else {
      // Check if the object value is the name of a computed value and if so, calculate it
      const rule = jsonLogicContext?.schema?.computedValues?.[value]?.rule
      if (rule) {
        computedMessage = jsonLogic.apply(rule, replaceUndefinedAndNullValuesWithNaN(jsonLogicContext.value as ObjectValue))
      }
    }
    computedObjectValues[key] = computedMessage
  })

  return computedObjectValues
}

export function computePropertyValues(
  rule: RulesLogic,
  values: SchemaValue,
): any {
  if (!rule) {
    return undefined
  }

  const result: any = jsonLogic.apply(rule, replaceUndefinedAndNullValuesWithNaN(values as ObjectValue))

  return result
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
  // If the schema has any computed attributes, we need to apply them by cloning the schema and applying the computed values
  // Otherwise, we return the original schema
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
