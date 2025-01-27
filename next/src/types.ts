import type { JSONSchema } from 'json-schema-typed/draft-2020-12'

export type JsfSchema = Exclude<JSONSchema, boolean> & {
  'x-jsf-logic'?: {
    validations: Record<string, object>
    computedValues: Record<string, object>
  }
  'x-jsf-order'?: string[]
}
