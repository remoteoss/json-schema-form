import type { RulesLogic } from 'json-logic-js'
import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, JsonLogicRules, JsonLogicSchema, NonBooleanJsfSchema, ObjectValue, SchemaValue } from '../types'
import jsonLogic from 'json-logic-js'
import { safeDeepClone } from './util'

/**
 * Builds a json-logic context based on a schema and the current value
 * @param schema - The schema to build the context from
 * @param value - The current value of the form
 * @returns The json-logic context
 */
export function getJsonLogicContextFromSchema(schema: JsonLogicSchema, value: SchemaValue): JsonLogicContext {
  const { validations, computedValues } = schema
  const jsonLogicRules: JsonLogicRules = {
    validations,
    computedValues,
  }
  const jsonLogicContext = {
    schema: jsonLogicRules,
    value,
  }
  return jsonLogicContext
}

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

export function computePropertyValues(
  name: string,
  rule: RulesLogic,
  values: SchemaValue,
): any {
  if (!rule) {
    throw new Error(
      `[json-schema-form] json-logic error: Computed value "${name}" doesn't exist`,
    )
  }

  const result: any = jsonLogic.apply(rule, replaceUndefinedAndNullValuesWithNaN(values as ObjectValue))
  return result
}

/**
 * Applies any computed attributes to a schema, based on the provided values. When there are values to apply,
 * it creates a deep clone of the schema and applies the computed values to the clone,otherwise it returns the original schema.
 *
 * @param schema - The schema to apply computed attributes to
 * @param computedValues - The computed values to apply
 * @param values - The current form values
 * @returns The schema with computed attributes applied
 */
export function applyComputedAttrsToSchema(schema: JsfObjectSchema, computedValuesDefinition: JsonLogicRules['computedValues'], values: SchemaValue): JsfObjectSchema {
  // If the schema has any computed attributes, we need to:
  // - clone the original schema
  // - calculate all the computed values
  // - apply the computed values to the cloned schema
  // Otherwise, we return the original schema
  if (computedValuesDefinition) {
    const computedValues: Record<string, string> = {}

    Object.entries(computedValuesDefinition).forEach(([name, definition]) => {
      const computedValue = computePropertyValues(name, definition.rule, values)
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
  function processProperty(propertySchema: JsfObjectSchema) {
    const computedAttrs = propertySchema['x-jsf-logic-computedAttrs']
    if (computedAttrs) {
      cycleThroughAttrsAndApplyValues(propertySchema, computedValues, computedAttrs)
    }

    if (propertySchema.type === 'object' && propertySchema.properties) {
      cycleThroughPropertiesAndApplyValues(propertySchema, computedValues)
    }

    delete propertySchema['x-jsf-logic-computedAttrs']
  }

  // If this is a full property schema, we need to cycle through the properties and apply the computed values
  // Otherwise, just process the property
  if (schemaCopy.properties) {
    for (const propertyName in schemaCopy.properties) {
      processProperty(schemaCopy.properties[propertyName] as JsfObjectSchema)
    }
  }
  else {
    processProperty(schemaCopy)
  }
}

/**
 * Cycles through the attributes of a schema and applies the computed values to it
 * @param propertySchema - The schema to apply computed values to
 * @param computedValues - The computed values to apply
 */
function cycleThroughAttrsAndApplyValues(propertySchema: JsfObjectSchema, computedValues: Record<string, string>, computedAttrs: JsfSchema['x-jsf-logic-computedAttrs']) {
  function evalStringOrTemplate(message: string) {
    // If it's a string, we can apply it directly by referencing the computed value by key
    if (!containsHandlebars(message)) {
      return computedValues[message]
    }

    // If it's a template, we need to interpolate it, replacing the handlebars with the computed value
    return message.replace(/\{\{(.*?)\}\}/g, (_, computation) => {
      const computationName = computation.trim()
      return computedValues[computationName] || `{{${computationName}}}`
    })
  }

  for (const key in computedAttrs) {
    const attributeName = key as keyof NonBooleanJsfSchema
    const computationName = computedAttrs[key]
    if (typeof computationName === 'string') {
      propertySchema[attributeName] = evalStringOrTemplate(computationName)
    }
    else {
      if (!propertySchema[attributeName]) {
        propertySchema[attributeName] = {}
      }
      Object.entries(computationName).forEach(([key, value]) => {
        propertySchema[attributeName][key] = evalStringOrTemplate(value)
      })
    }
  }
}
