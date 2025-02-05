/**
 * WIP interface for UI field output
 */
export interface Field {
  name: string
  label?: string
  fields?: Field[]
}
