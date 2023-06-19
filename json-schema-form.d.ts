/**
 * Shorthand to lookup for keys with `x-jsf-*` preffix.
 */
export function pickXKey(node: Object, key: 'presentation' | 'errorMessage'): Object | undefined;

type JSFConfig = {
  initialValues?: Record<string, unknown>;
  strictInputType?: boolean;
  customProperties?: {
    description: (description: string, field: $TSFixMe) => string | string;
    [key: string]: unknown;
  };
  inputTypes?: {
    errorMessage: Record<string, unknown>;
  };
};

type Fields = Record<string, unknown>[]; //TODO: Type the field based on the given JSON Schema properties.

type $TSFixMe = any;

/**
 * Returns the Yup schema structure of given fields.
 * These fields must be the same from
 * const { fields } = createHeadlessForm()
 */
export function buildCompleteYupSchema(fields: Fields, config: JSFConfig): $TSFixMe; //TODO: We need to update Yup to 1.0 which supports TS.

type HeadlessFormOutput = {
  fields: Fields;
  handleValidation: () => $TSFixMe;
  isError: boolean;
  error?: Error;
};

type JSONSchemaObjectType = Record<string, unknown>;

/**
 * Generates the Headless form based on the provided JSON schema
 */
export function createHeadlessForm(
  jsonSchema: JSONSchemaObjectType,
  customConfig: JSFConfig
): HeadlessFormOutput;
