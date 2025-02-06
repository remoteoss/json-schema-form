import type { Field } from '../field/type'
import type { JsfSchema } from '../types'

function sort(params: {
  fields: Field[]
  order: string[]
}): Field[] {
  const { fields: prevFields, order } = params

  // Map from field name to expected index
  const indexMap: Record<string, number | undefined> = {}
  order.forEach((key, index) => {
    indexMap[key] = index
  })

  const nextFields = prevFields.sort((a, b) => {
    // Compare by index
    const indexA = indexMap[a.name] ?? Infinity
    const indexB = indexMap[b.name] ?? Infinity

    // The else actually only happens when both are Infinity,
    // i.e., not specified in the order array
    if (indexA !== indexB)
      return indexA - indexB

    // If not specified, maintain original relative order
    return prevFields.indexOf(a) - prevFields.indexOf(b)
  })

  return nextFields
}

/**
 * Sort fields by schema's `x-jsf-order`
 */
export function setCustomOrder(params: {
  schema: JsfSchema
  fields: Field[]
}): Field[] {
  const { schema, fields } = params

  // TypeScript does not yield if we remove this check,
  // but it's only because our typing is likely not right.
  // See internal discussion:
  // - https://remote-com.slack.com/archives/C02HTN0LY02/p1738745237733389?thread_ts=1738741631.346809&cid=C02HTN0LY02
  if (typeof schema === 'boolean')
    throw new Error('Schema must be an object')

  if (schema['x-jsf-order'] !== undefined)
    return sort({ fields, order: schema['x-jsf-order'] })

  return fields
}
