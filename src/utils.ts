import type { Field } from './field/type'
import type { CreateHeadlessFormOptions } from './form'
import type { JsfSchema } from './types'

/**
 * Get a field from a list of fields by name.
 * If the field is nested, you can pass additional names to access a nested field.
 * @param fields - The list of fields to search in.
 * @param name - The name of the field to search for.
 * @param subNames - The names of the nested fields to access.
 * @returns The field if found, otherwise undefined.
 */
export function getField(fields: Field[], name: string, ...subNames: string[]) {
  const field = fields.find(f => f.name === name)
  if (subNames.length) {
    if (!field?.fields) {
      return undefined
    }
    return getField(field.fields, subNames[0], ...subNames.slice(1))
  }
  return field
}

// Helper function to convert KB to MB
export function convertKBToMB(kb: number): number {
  if (kb === 0) {
    return 0
  }
  const mb = kb / 1024 // KB to MB
  return Number.parseFloat(mb.toFixed(2)) // Keep 2 decimal places
}

// When merging a conditional branch into a schema, we should skip merging the if/then/else
// properties as we could be creating wrong conditions
const KEYS_TO_SKIP = ['if', 'then', 'else']

function isObject(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks if the array is options-like.
 * Options-like arrays are arrays of objects, all items of which have a const property.
 *
 * @param schemaKey - The key of the schema to check.
 * @param schema - The schema to check.
 * @returns True if the schema is options-like, false otherwise.
 */
function isOptionsLikeSchema(schemaKey: string, schema: JsfSchema[]): boolean {
  switch (schemaKey) {
    case 'options':
    case 'enum':
      return true
    case 'oneOf':
    case 'anyOf':
      return schema.length > 0 && schema.every(item => isObject(item) && 'const' in item)
    default:
      return false
  }
}

/**
 * Returns the value that identifies an option, regardless of the option-like array shape:
 * - `oneOf`/`anyOf` entries are `{ const, title }` objects, identified by `const`
 * - `options` entries are `{ value, label }` objects, identified by `value`
 * - `enum` entries are the raw values themselves
 */
function getOptionIdentity(option: unknown): unknown {
  if (isObject(option)) {
    const obj = option as Record<string, any>
    if ('const' in obj) {
      return obj.const
    }
    if ('value' in obj) {
      return obj.value
    }
  }
  return option
}

let hasWarnedAboutNewConditionalOptions = false

/**
 * Warns (once) that a conditional branch introduces option(s) not present on the base field.
 * This is only relevant while running with the legacy behavior (disallowNewConditionalOptions: false).
 */
function warnAboutNewConditionalOptions(): void {
  if (!hasWarnedAboutNewConditionalOptions) {
    hasWarnedAboutNewConditionalOptions = true
    console.warn(
      '[json-schema-form] A conditional branch introduces option(s) not present on the base field. '
      + 'This currently works but is deprecated and will be disallowed in a future major version. '
      + 'Set `disallowNewConditionalOptions: true` to opt into the new behavior now. (see PR #265)',
    )
  }
}

/**
 * Merges a conditional branch schema into the base schema recursively.
 *
 * When `options.disallowNewConditionalOptions` is true, option-like arrays (enum/oneOf/anyOf/options)
 * are restricted to the options already present on the base field: the branch may narrow or re-label
 * existing options, but any option whose value isn't present in the base is ignored. If the base
 * field declares no option array for a given key, the branch's options are dropped entirely.
 *
 * When it is false (default, legacy behavior), option-like arrays are replaced wholesale, so a branch
 * may introduce new options. In that case, if a branch would introduce an option that the new
 * behavior would drop, a one-time deprecation warning is emitted.
 *
 * @param schema1 - The base schema to merge into
 * @param schema2 - The conditional branch schema to merge from
 * @param options - The form options
 */
export function mergeSchemaBranch<T extends Record<string, any>>(schema1?: T, schema2?: T, options?: CreateHeadlessFormOptions): void {
  // Handle null/undefined values
  if (!schema1 || !schema2) {
    return
  }

  // Handle non-objects
  if (typeof schema1 !== 'object' || typeof schema2 !== 'object') {
    return
  }

  const { disallowNewConditionalOptions = false } = options ?? {}

  // Merge all properties from schema2 into schema1
  for (const [key, schema2Value] of Object.entries(schema2)) {
    // let's skip merging some properties
    if (KEYS_TO_SKIP.includes(key)) {
      continue
    }

    const schema1Value = schema1[key]

    if (isOptionsLikeSchema(key, schema2Value)) {
      // Restrict option-like arrays to the options already present on the base field
      if (disallowNewConditionalOptions) {
        // Base declares no options for this key, let a conditional branch introduce them
        if (!Array.isArray(schema1Value)) {
          schema1[key as keyof T] = schema2Value
          continue
        }

        const allowedOptions = new Set(schema1Value.map(option => getOptionIdentity(option)))
        // Keep the branch's option objects (so changing options properties works),
        // but only for values that are already present in the base
        // Note: this will set an empty array if the options are not of an expected format
        schema1[key as keyof T] = schema2Value.filter(
          (option: unknown) => allowedOptions.has(getOptionIdentity(option)),
        )
        continue
      }

      // Legacy behavior: option-like arrays are fully replaced below, but warn (once) if the
      // branch introduces an option that the new behavior would have dropped.
      else if (Array.isArray(schema1Value)) {
        const allowedOptions = new Set(schema1Value.map(option => getOptionIdentity(option)))
        const introducesNewOption = schema2Value.some(
          (option: unknown) => !allowedOptions.has(getOptionIdentity(option)),
        )
        if (introducesNewOption) {
          warnAboutNewConditionalOptions()
        }
      }
    }

    // If the value is an object:
    if (isObject(schema2Value)) {
      // If both schemas have this key and it's an object, merge recursively
      if (isObject(schema1Value)) {
        mergeSchemaBranch(schema1Value, schema2Value, options)
      }
      // Otherwise, if the value is different, just assign it
      else if (schema1Value !== schema2Value) {
        schema1[key as keyof T] = schema2Value
      }
    }
    // If the value is an array, replace the whole array
    // for the "required" key, we only add new elements to the array
    else if (schema1Value && Array.isArray(schema2Value)) {
      if (key === 'required') {
        for (const item of schema2Value) {
          if (!schema1Value.includes(item)) {
            schema1Value.push(item)
          }
        }
      }
      // Otherwise, just assign it
      else {
        schema1[key as keyof T] = schema2Value as T[keyof T]
      }
    }
    // Finally, if the value is different, just assign it
    else if (schema1[key] !== schema2Value) {
      schema1[key as keyof T] = schema2Value
    }
  }
}

/**
 * Merges a freshly-built field into an existing field, in place.
 *
 * @param target - The existing field to merge into
 * @param source - The newly-built field to merge from
 */
export function mergeFieldProperties(target: Field, source: Field): void {
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key]

    // If both values are plain objects, merge them recursively
    if (isObject(sourceValue) && isObject(targetValue)) {
      mergeFieldProperties(targetValue as Field, sourceValue as Field)
    }
    // Otherwise, replace when the value changed, arrays are fully replaced
    else if (targetValue !== sourceValue) {
      target[key] = sourceValue
    }
  }
}
