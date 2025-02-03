import type { JSONSchema } from 'json-schema-typed/draft-2020-12'

/**
 * Defines the type of a `Field` in the form.
 */
export type JsfSchemaType = Exclude<JSONSchema, boolean>['type']

/**
 * Defines the type of a value in the form that will be validated against the schema.
 */
export type SchemaValue = string | number | ObjectValue | undefined

/**
 * A nested object value.
 */
export interface ObjectValue {
  [key: string]: SchemaValue
}

/**
 * JSON Schema type with additional JSON Schema Form properties.
 */
export type JsfSchema = Exclude<JSONSchema, boolean> & {
  'properties'?: Record<string, JsfSchema>
  'x-jsf-logic'?: {
    validations: Record<string, object>
    computedValues: Record<string, object>
  }
  'x-jsf-order'?: string[]
} | boolean

/**
 * JSON Schema type without booleans.
 * This type is used for convenience in places where a boolean is not allowed.
 * @see `JsfSchema` for the full schema type which allows booleans and is used for sub schemas.
 */
export type NonBooleanJsfSchema = Exclude<JsfSchema, boolean>
