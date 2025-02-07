/**
 * WIP type for UI field output that allows for all `x-jsf-presentation` properties to be splatted
 */
export type Field = {
  name: string
  label?: string
  fields?: Field[]
  type: string
  inputType: string
  required: boolean
  accept?: string
  description?: string
  maxFileSize?: number
  minDate?: string
  maxDate?: string
} & {
  [key: string]: unknown
}
