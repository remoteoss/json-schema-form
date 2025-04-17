import type { JsfSchema, SchemaValue, ValidationErrorPath, ValidationOptions } from '../types'
import jsonLogic from 'json-logic-js'

const JSON_LOGIC_KEYWORDS = {
  validations: 'x-jsf-logic-validations',
} as const

export function validateJsonLogic(value: SchemaValue, schema: JsfSchema, options: ValidationOptions, path: ValidationErrorPath) {
  const logic = schema[JSON_LOGIC_KEYWORDS.validations]
  if (!logic) {
    return []
  }
}
