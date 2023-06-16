/**
 * Shorthand to lookup for keys with `x-jsf-*` preffix.
 */
export function pickXKey(node: Object, key: 'presentation' | 'error-message'): Object | undefined;

type JSConfig = {
  initialValues?: Record<string, unknown>;
  strictInputType?: boolean;
  customProperties?: {
    description: Function | string;
    [key: string]: unknown;
  };
  inputTypes?: {
    errorMessage: Record<string, unknown>;
  };
};

type Fields = Record<string, unknown>[]; // TODO: We don't know what type we have here, we need to investigate

type $TsFixMe = any;

/**
 * Returns the Yup schema structure of given fields.
 * These fields must be the same from
 * const { fields } = createHeadlessForm()
 */
export function buildCompleteYupSchema(fields: Fields, config: JSConfig): $TsFixMe; // TODO: We don't what yup returns here, we'll fix it later

type HeadlessFormOutput = {
  fields: Fields;
  handleValidation: () => $TsFixMe;
  isError: boolean;
  error?: undefined;
};

/**
 * Generates the Headless form based on the provided JSON schema
 */
export function createHeadlessForm(
  jsonSchema: Record<string, unknown>,
  customConfig: JSConfig
): HeadlessFormOutput;
