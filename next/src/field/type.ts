import type { JsfSchemaType } from '../types'

export type FieldType = 'text' | 'number' | 'select' | 'file' | 'radio' | 'group-array' | 'email' | 'date' | 'checkbox' | 'fieldset' | 'money' | 'country' | 'textarea'

interface BaseField {
  type: FieldType
  name: string
  label: string
  required: boolean
  inputType: FieldType
  jsonType: JsfSchemaType
  errorMessage: Record<string, string>
  schema: any
  isVisible: boolean
}

export interface FieldOption {
  label: string
  value?: string | number | boolean | Record<string, any>
  [key: string]: unknown
}

export interface FieldSelect extends BaseField {
  type: 'select'
  options: FieldOption[]
}

export interface FieldTextarea extends BaseField {
  type: 'textarea'
  maxLength?: number
  minLength?: number
}

export interface FieldDate extends BaseField {
  type: 'date'
  format: string
  minDate?: string
  maxDate?: string
  maxLength?: number
}

export interface FieldText extends BaseField {
  type: 'text'
  maxLength?: number
  maskSecret?: number
  pattern?: string
}

export interface FieldRadio extends BaseField {
  type: 'radio'
  options: FieldOption[]
  direction?: 'row' | 'column'
  const?: string
}

export interface FieldNumber extends BaseField {
  type: 'number'
  minimum?: number
  maximum?: number
}

export interface FieldMoney extends BaseField {
  type: 'money'

}

export interface FieldCheckbox extends BaseField {
  type: 'checkbox'
  options?: FieldOption[]
  multiple?: boolean
  direction?: 'row' | 'column'
  checkboxValue?: string | boolean
  const?: string
}

export interface FieldEmail extends BaseField {
  type: 'email'
  maxLength?: number
  format: 'email'
}

export interface FieldFile extends BaseField {
  type: 'file'
  accept: string
  multiple?: boolean
  fileDownload: string
  fileName: string
}
export interface FieldFieldSet extends BaseField {
  type: 'fieldset'
  valueGroupingDisabled?: boolean
  visualGroupingDisabled?: boolean
  variant?: 'card' | 'focused' | 'default'
  fields: Field[]
}

export interface GroupArrayField extends BaseField {
  type: 'group-array'
  name: string
  label: string
  description: string
  fields: () => Field[]
  addFieldText: string
}

export interface FieldCountry extends BaseField {
  type: 'country'
  options?: FieldOption[]
}

export interface Field extends BaseField {
  computedAttributes?: Record<string, unknown>
  description?: string

  // Select specific properties
  options?: FieldOption[]

  // Text specific properties
  maxLength?: number
  maskSecret?: number
  minLength?: number
  pattern?: string

  // Date specific properties
  format?: string
  minDate?: string
  maxDate?: string

  // Radio specific properties
  const?: string

  // Number specific properties
  minimum?: number
  maximum?: number

  // Money specific properties
  currency?: string

  // Checkbox specific properties
  multiple?: boolean
  checkboxValue?: string | boolean

  // File specific properties
  accept?: string
  fileName?: string

  // Fieldset specific properties
  valueGroupingDisabled?: boolean
  visualGroupingDisabled?: boolean

  fields?: Field[]

  // GroupArray specific properties
  addFieldText?: string

  enum?: string[]
}
