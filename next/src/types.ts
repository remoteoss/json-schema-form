import type { JSONSchema } from 'json-schema-typed/draft-2020-12'

/**
 * Defines the type of a `Field` in the form.
 */
export type JsfSchemaType = Exclude<JSONSchema, boolean>['type']

/**
 * Defines the type of a value in the form that will be validated against the schema.
 */
export type SchemaValue = string | number | ObjectValue | null | undefined | Array<SchemaValue>

/**
 * A nested object value.
 */
export interface ObjectValue {
  [key: string]: SchemaValue
}

export type JsfPresentation = {
  inputType?: string
  description?: string
  accept?: string
  maxFileSize?: number
  minDate?: string
  maxDate?: string
} & {
  [key: string]: unknown
}

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
  'x-jsf-logic'?: {
    validations: Record<string, object>
    computedValues: Record<string, object>
  }
  // Note: if we don't have this property here, when inspecting any recursive
  // schema (like an if inside another schema), the required property won't be
  // present in the type
  'required'?: string[]
  'x-jsf-order'?: string[]
  'x-jsf-presentation'?: JsfPresentation
  'x-jsf-errorMessage'?: Record<string, string>
}

/**
 * JSON Schema Form type without booleans.
 * This type is used for convenience in places where a boolean is not allowed.
 * @see `JsfSchema` for the full schema type which allows booleans and is used for sub schemas.
 */
export type NonBooleanJsfSchema = Exclude<JsfSchema, boolean>

const ok: NonBooleanJsfSchema = {
  allOf: [
    {
      if: {
        required: ['123'],
      },
    },
  ],
}

const ok2: JSONSchema = {
  if: {
    required: ['123'],
  },
}

/**
 * JSON Schema Form type specifically for object schemas.
 * This type ensures the schema has type 'object'.
 */
export type JsfObjectSchema = NonBooleanJsfSchema & {
  type: 'object'
}
