import type { Field } from './field/type'
import type { FormErrors, ValidationResult } from './form'

function resetVisibility(fields: Field[]) {
  for (const field of fields) {
    field.isVisible = true
    if (field.fields) {
      resetVisibility(field.fields)
    }
  }
}

function affectFieldVisibilityOfFields(fields: Field[], formErrors: FormErrors) {
  for (const fieldName in formErrors) {
    const error = formErrors[fieldName]
    if (typeof error === 'string') {
      if (error === 'Always fails') {
        const field = fields.find(field => field.name === fieldName)
        if (field) {
          field.isVisible = false
        }
      }
    }
    else if (typeof error === 'object') {
      const fieldset = fields.find(field => field.name === fieldName)
      if (fieldset?.fields) {
        affectFieldVisibilityOfFields(fieldset.fields, error)
      }
    }
  }
}

/**
 * Updates field visibility based on JSON schema conditional rules
 * @param fields - The fields to update
 * @param validationResult - The current form errors
 */
export function updateFieldVisibility(
  fields: Field[],
  validationResult: ValidationResult,
) {
  resetVisibility(fields)
  const { formErrors } = validationResult

  if (!formErrors) {
    return
  }

  affectFieldVisibilityOfFields(fields, formErrors)
}
