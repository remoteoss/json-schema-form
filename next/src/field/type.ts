import type { JsfSchemaType } from '../types'

export type FieldType = 'text' | 'number' | 'select' | 'file' | 'radio' | 'group-array' | 'email' | 'date' | 'checkbox' | 'fieldset' | 'money' | 'country' | 'textarea'

interface BaseField {
  type: FieldType
  name: string
  label: string
  required: boolean
  inputType: FieldType
  jsonType: JsfSchemaType
  computedAttributes?: Record<string, unknown>
  errorMessage: Record<string, string>
  schema: any
  isVisible: boolean
  description?: string
  statement?: {
    title: string
    inputType: 'statement'
    severity: 'warning' | 'error' | 'info'
  }
  [key: string]: unknown
}

export interface FieldOption {
  label: string
  value: string
  description?: string
}

export interface FieldSelect extends BaseField {
  type: 'select'
  options: FieldOption[]
}

export interface FieldTextarea extends BaseField {
  type: 'textarea'
  maxLength: number
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
  maxLength: number
  maskSecret?: number
}

export interface FieldRadio extends BaseField {
  type: 'radio'
  options: FieldOption[]
  direction?: 'row' | 'column'
  const?: string
}

export interface FieldNumber extends BaseField {
  type: 'number'
}

export interface FieldMoney extends BaseField {
  type: 'money'
  currency: string
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
  maxLength: number
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

export type Field =
  | FieldSelect
  | FieldTextarea
  | FieldDate
  | FieldText
  | FieldRadio
  | FieldNumber
  | FieldMoney
  | FieldCheckbox
  | FieldEmail
  | FieldFile
  | FieldFieldSet
  | GroupArrayField
