import type { JsfSchema } from '../types'
import type { Field } from './type'
import { buildFieldsObject } from './object'

export function buildFieldsSchema(params: {
  schema: JsfSchema
}): Field[] {
  const { schema } = params

  if (typeof schema === 'boolean')
    return []

  if (schema.type === 'object') {
    return buildFieldsObject({ schema })
  }

  return []
}
