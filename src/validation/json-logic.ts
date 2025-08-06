import type { RulesLogic } from 'json-logic-js'
import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsfObjectSchema, JsfSchema, JsonLogicContext, JsonLogicRules, JsonLogicSchema, NonBooleanJsfSchema, ObjectValue, SchemaValue } from '../types'
import jsonLogic from 'json-logic-js'

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
      // We default to consider the error message as a string
      // However, if it contains handlebars, we need to evaluate it using the computed values
      let errorMessage = validationData.errorMessage

      if (errorMessage && containsHandlebars(errorMessage)) {
        errorMessage = errorMessage.replace(/\{\{(.*?)\}\}/g, (_, handlebarsVar) => {
          const computationName = handlebarsVar.trim()
          const jsonLogicComputation = jsonLogicContext.schema.computedValues?.[computationName]

          // If the handlebars variable matches the name of a computation, we run it
          if (jsonLogicComputation) {
            return jsonLogic.apply(jsonLogicComputation.rule, replaceUndefinedAndNullValuesWithNaN(formValue as ObjectValue))
          }
          else {
            // Otherwise, it's probably referring to a variable in the form, so we use it instead
            return jsonLogic.apply({ var: computationName }, replaceUndefinedAndNullValuesWithNaN(formValue as ObjectValue))
          }
        })
      }

      return [{ path, validation: 'json-logic', customErrorMessage: errorMessage, schema, value: formValue } as ValidationError]
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
 * Note: this function mutates the schema in place.
 *
 * @param schema - The schema to apply computed attributes to
 * @param computedValuesDefinition - The computed values to apply
 * @param values - The current form values
 * @returns The schema with computed attributes applied
 */
export function applyComputedAttrsToSchema(schema: JsfObjectSchema, computedValuesDefinition: JsonLogicRules['computedValues'], values: SchemaValue): JsfObjectSchema {
  if (computedValuesDefinition) {
    const computedValues: Record<string, any> = {}

    Object.entries(computedValuesDefinition).forEach(([name, definition]) => {
      const computedValue = computePropertyValues(name, definition.rule, values)
      computedValues[name] = computedValue
    })

    cycleThroughPropertiesAndApplyValues(schema, computedValues)
  }

  return schema
}

/**
 * Cycles through the properties of a schema and applies the computed values to it
 * @param schemaCopy - The schema to apply computed values to
 * @param computedValues - The computed values to apply
 */
function cycleThroughPropertiesAndApplyValues(schemaCopy: JsfSchema, computedValues: Record<string, string>) {
  function processProperty(propertySchema: JsfSchema) {
    // Checking that the schema is non-boolean and is has a type property before processing it
    if (typeof propertySchema !== 'object') {
      return
    }

    const computedAttrs = propertySchema['x-jsf-logic-computedAttrs']
    if (computedAttrs) {
      cycleThroughAttrsAndApplyValues(propertySchema, computedValues, computedAttrs)
    }

    if (propertySchema.type === 'object' && propertySchema.properties) {
      cycleThroughPropertiesAndApplyValues(propertySchema, computedValues)
    }

    // deleting x-jsf-logic-computedAttrs to keep the schema clean
    delete propertySchema['x-jsf-logic-computedAttrs']
  }

  // If the schemas has properties, we need to cycle through each one and apply the computed values
  // Otherwise, just process the property
  if (schemaCopy.properties) {
    for (const propertyName in schemaCopy.properties) {
      processProperty(schemaCopy.properties[propertyName])
    }
  }
  else {
    processProperty(schemaCopy)
  }

  // If the schema has an if statement, we need to cycle through the properties and apply the computed values
  if (typeof schemaCopy.if === 'object') {
    cycleThroughPropertiesAndApplyValues(schemaCopy.if, computedValues)
  }

  /* If the schema has an allOf or anyOf property, we need to cycle through each property inside it and
   * apply the computed values
   */

  if (schemaCopy.allOf && schemaCopy.allOf.length > 0) {
    for (const schema of schemaCopy.allOf) {
      cycleThroughPropertiesAndApplyValues(schema, computedValues)
    }
  }

  if (schemaCopy.anyOf && schemaCopy.anyOf.length > 0) {
    for (const schema of schemaCopy.anyOf) {
      cycleThroughPropertiesAndApplyValues(schema, computedValues)
    }
  }

  if (schemaCopy.oneOf && schemaCopy.oneOf.length > 0) {
    for (const schema of schemaCopy.oneOf) {
      cycleThroughPropertiesAndApplyValues(schema, computedValues)
    }
  }
}

/**
 * Cycles through the attributes of a schema and applies the computed values to it
 * @param propertySchema - The schema to apply computed values to
 * @param computedValues - The computed values to apply
 */
function cycleThroughAttrsAndApplyValues(propertySchema: JsfSchema, computedValues: Record<string, string>, computedAttrs: JsfSchema['x-jsf-logic-computedAttrs']) {
  if (typeof propertySchema !== 'object') {
    return
  }

  /**
   * Evaluates a string or a handlebars template, using the computed values mapping, and returns the computed value
   * @param message - The string or template to evaluate
   * @returns The computed value
   */
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

  /**
   * Recursively applies the computed values to a nested schema
   * @param propertySchema - The schema to apply computed values to
   * @param attrName - The name of the attribute to apply the computed values to
   * @param computationName - The name of the computed value to apply
   * @param computedValues - The computed values to apply
   */
  function applyNestedComputedValues(propertySchema: JsfSchema, attrName: string, computationName: string | object, computedValues: Record<string, string>) {
    // Checking that the schema is non-boolean and is has a type property before processing it
    if (typeof propertySchema !== 'object') {
      return
    }

    const attributeName = attrName as keyof NonBooleanJsfSchema
    if (!propertySchema[attributeName]) {
      // Making sure the attribute object is created if it does not exist in the original schema
      propertySchema[attributeName] = {}
    }

    Object.entries(computationName).forEach(([key, compName]) => {
      if (typeof compName === 'string') {
        propertySchema[attributeName][key] = evalStringOrTemplate(compName)
      }
      else {
        applyNestedComputedValues(propertySchema[attributeName], key, compName, computedValues)
      }
    })
  }

  for (const key in computedAttrs) {
    const attributeName = key as keyof NonBooleanJsfSchema
    const computationName = computedAttrs[key]
    // If the computed value is a string, we can apply it directly by referencing the computed value by key
    if (typeof computationName === 'string') {
      propertySchema[attributeName] = evalStringOrTemplate(computationName)
    }
    else if (typeof propertySchema === 'object') {
      // Otherwise, it's a nested object, so we need to apply the computed values to the nested object
      applyNestedComputedValues(propertySchema, attributeName, computationName, computedValues)
    }
  }
}

export function addCustomJsonLogicOperations(ops?: Record<string, (...args: any[]) => any>) {
  if (ops) {
    for (const [name, func] of Object.entries(ops)) {
      jsonLogic.add_operation(name, func)
    }
  }
}

export function removeCustomJsonLogicOperations(ops?: Record<string, (...args: any[]) => any>) {
  if (ops) {
    for (const name of Object.keys(ops)) {
      jsonLogic.rm_operation(name)
    }
  }
}
