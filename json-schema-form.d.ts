/**
 * Shorthand to lookup for keys with `x-jsf-*` preffix.
 */
export function pickXKey(node: Object, key: 'presentation' | 'error-message'): Object | undefined


type JSConfig = {
  initialValues?: Record<string, unknown>;
  strictInputType?: boolean;
  customProperties?: {
    description: () => void | string;
    [key: string]: unknown;
  }
  inputTypes?: {
    errorMessage: Record<string, unknown>;
  }
}

type Fields = any; // TODO: We don't know what type we have here, we need to investigate

type $TsFixMe = any;

/**
 * Returns the Yup schema structure of given fields.
 * These fields must be the same from
 * const { fields } = createHeadlessForm()
 */

export function buildCompleteYupSchema(fields: Fields, config: JSConfig): $TsFixMe // TODO: We don't what yup returns here, we'll fix it later