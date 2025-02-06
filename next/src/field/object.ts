import type { JSONSchema } from 'json-schema-typed'
import type { Field } from './type'
import { setCustomOrder } from '../custom/order'
import { buildFieldSingle } from './single'

export function buildFieldObject(params: {
  schema: JSONSchema
}): Field[] {
  const { schema } = params

  if (typeof schema === 'boolean')
    throw new Error('Schema must be an object')

  if (schema.type !== 'object')
    throw new Error('Schema must be of type "object"')

  const fields: Field[] = []

  Object
    .entries(schema.properties ?? {})
    .forEach((entry) => {
      const [name, schema] = entry
      const field = buildFieldSingle({ name, schema })
      if (field !== null)
        fields.push(field)
    })

  const withOrder = setCustomOrder({ fields, schema })

  return withOrder
}
