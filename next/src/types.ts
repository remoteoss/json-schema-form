import type { RulesLogic } from 'json-logic-js'
import type { JSONSchema } from 'json-schema-typed/draft-2020-12'
import type { FieldType } from './field/type'
/**
 * Defines the type of a `Field` in the form.
 */
export type JsfSchemaType = Exclude<JSONSchema, boolean>['type']

/**
 * Defines the type of a value in the form that will be validated against the schema.
 */
export type SchemaValue = string | number | ObjectValue | null | undefined | Array<SchemaValue> | boolean

/**
 * A nested object value.
 */
export interface ObjectValue {
  [key: string]: SchemaValue
}

export type JsfPresentation = {
  inputType?: FieldType
  description?: string
  accept?: string
  maxFileSize?: number
  minDate?: string
  maxDate?: string
} & {
  [key: string]: unknown
}

export interface JsonLogicContext {
  schema: JsonLogicRules
  value: SchemaValue
}

// x-jsf-logic schema can have validations/computedValues as well as conditional rules present in any JSON Schema
export interface JsonLogicRules {
  validations?: Record<string, {
    errorMessage?: string
    rule: RulesLogic
  }>
  computedValues?: Record<string, {
    rule: RulesLogic
  }>
}
export interface JsonLogicRootSchema extends Pick<NonBooleanJsfSchema, 'if' | 'then' | 'else' | 'allOf' | 'anyOf' | 'oneOf' | 'not'> {}

export interface JsonLogicSchema extends JsonLogicRules, JsonLogicRootSchema {}

/**
 * JSON Schema Form extending JSON Schema with additional JSON Schema Form properties.
 */
export type JsfSchema = JSONSchema & {
  'properties'?: Record<string, JsfSchema>
  'items'?: JsfSchema
  'anyOf'?: JsfSchema[]
  'allOf'?: JsfSchema[]
  'oneOf'?: JsfSchema[]
  'not'?: JsfSchema
  'if'?: JsfSchema
  'then'?: JsfSchema
  'else'?: JsfSchema
  // Note: if we don't have this property here, when inspecting any recursive
  // schema (like an if inside another schema), the required property won't be
  // present in the type
  'required'?: string[]
  // Defines the order of the fields in the form.
  'x-jsf-order'?: string[]
  // Defines the presentation of the field in the form.
  'x-jsf-presentation'?: JsfPresentation
  // Defines the error message of the field in the form.
  'x-jsf-errorMessage'?: Record<string, string>
  'x-jsf-logic'?: JsonLogicSchema
  // Extra validations to run. References validations in the `x-jsf-logic` root property.
  'x-jsf-logic-validations'?: string[]
  // Extra attributes to add to the schema. References computedValues in the `x-jsf-logic` root property.
  'x-jsf-logic-computedAttrs'?: Record<keyof JsfSchema, string>
}

const ok: JsfSchema = {
  'x-jsf-logic-computedAttrs': {
    minimum: 'foo',
  },
}

/**
 * JSON Schema Form type without booleans.
 * This type is used for convenience in places where a boolean is not allowed.
 * @see `JsfSchema` for the full schema type which allows booleans and is used for sub schemas.
 */
export type NonBooleanJsfSchema = Exclude<JsfSchema, boolean>

/**
 * JSON Schema Form type specifically for object schemas.
 * This type ensures the schema has type 'object'.
 */
export type JsfObjectSchema = NonBooleanJsfSchema & {
  type: 'object'
}
