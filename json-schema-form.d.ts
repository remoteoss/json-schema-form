/**
 * Shorthand to lookup for keys with `x-jsf-*` preffix.
 */
export function pickXKey(node: Object, key: 'presentation' | 'errorMessage'): Object | undefined;
type ValidationTypes =
  | 'type'
  | 'minimum'
  | 'maximum'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'maxFileSize'
  | 'accept'
  | 'required';

type JSFConfig = {
  /**
   * Initial json values to prefill the form fields.
   * This influences the initial visibility of conditional fields.
   */
  initialValues?: Record<string, unknown>;
  /**
   * It inforces all json properties (fields) to have x-jsf-presentation.inputType.
    @default true 
  */
  strictInputType?: boolean;
  /**
   * Customize the output of a given named Field.
   * Useful if you want to enhance the UI/UX of a particular field.
   * @example
   * { has_pet: { "optionsDirection": "horizontal" } }
   */
  customProperties?: {
    description?: (description: string, field: $TSFixMe) => string | string;
    [key: string]: unknown;
  };
  /**
   * Customize the config for each inputType
   */
  inputTypes?: {
    /**
     * Customize the error error message of this input type.
     * @example
     * { required: "This number is required." }
     */
    errorMessage?: Partial<Record<ValidationTypes, string>>;
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
  /**
   * List of Fields. Each Field corresponds to a form input from the json schema.
   * @example
   * [
      {
        name: "has_pet",
        label: "Has Pet",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ],
        required: true,
        inputType: "radio",
        jsonType: "string",
        description: "Do you have a pet?",
        errorMessage: {},
        isVisible: true
      },
      {
        type: "text",
        label: "Pet's name",
        description: "What's your pet's name?",
        required: false,
        inputType: "text",
        jsonType: "string",
        isVisible: false
      }
   * ]
   */
  fields: Fields;
  /**
   * Validates given values and returns the respective errors.
   * @example
   * const { formErrors } = handleValidation({ has_pet: "yes" });
   * console.log(formErrors) // { pet_name: "Required field." }
   */
  handleValidation: (values: Record<string, unknown>) => {
    yupError: $TSFixMe;
    formErrors: $TSFixMe;
  };
  isError: boolean;
  error?: Error;
};

type JSONSchemaObjectType = Record<string, unknown>;
type FieldName = string;
type FieldAttrs = Record<string, unknown>;

type ModifyConfig = {
  /**
   * An object with the fields to be modified with the returned attributes.
   */
  fields?: Record<FieldName, FieldAttrs | ((fieldAttrs: FieldAttrs) => FieldAttrs)>;
  /**
   * A callback function that runs through all fields, to modify them with the returned attributes.
   */
  allFields?: (fieldName: FieldName, fieldAttrs: FieldAttrs) => FieldAttrs;
  /**
   * An object of new fields to be created with the new attributes.
   */
  create?: Record<FieldName, FieldAttrs>;
  /**
   * An array of the fields to keep, removing the remaining fields.
   */
  pick?: FieldName[];
  /**
   * An array of fieldNames with the new order. Can be an object or callback function
   * */
  orderRoot?: FieldName[] | ((originalOrder: FieldName[]) => FieldName[]);
  /**
   * Mutes any logs or warnings from the library.
   */
  muteLogging?: boolean;
};

type WarningType =
  | 'FIELD_TO_CHANGE_NOT_FOUND'
  | 'ORDER_MISSING_FIELDS'
  | 'FIELD_TO_CREATE_EXISTS'
  | 'PICK_MISSED_FIELD';

type Warning = {
  message: string;
  type: WarningType;
  meta?: Record<string, unknown>;
};

type ModifyOutput = {
  schema: JSONSchemaObjectType;
  warnings: Warning[];
};

/**
 * Generates the Headless form based on the provided JSON schema
 */
export function createHeadlessForm(
  /** A JSON Schema of type object */
  jsonSchema: JSONSchemaObjectType,
  customConfig?: JSFConfig
): HeadlessFormOutput;

/**
 * Returns a new JSON Schema modified based a given configuration.
 * This does not mutate the original JSON Schema.
 */
export function modify(
  /**
   * The original JSON schema as base to the modifications.
   */
  originalSchema: JSONSchemaObjectType,
  /**
   * The configuration object to create a new JSON Schema based on the originalSchema.
   */
  config?: ModifyConfig
): ModifyOutput;
