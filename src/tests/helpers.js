// -------------------------------------
// ----------- Inputs Schema -----------
// -------------------------------------

export const mockTextInput = {
  title: 'ID number',
  description: 'The number of your national identification (max 10 digits)',
  maxLength: 10,
  'x-jsf-presentation': {
    inputType: 'text',
    maskSecret: 2,
  },
  type: 'string',
};

export const mockTextInputDeprecated = {
  title: 'ID number',
  description: 'The number of your national identification (max 10 digits)',
  maxLength: 10,
  presentation: {
    inputType: 'text',
    maskSecret: 2,
  },
  type: 'string',
};

export const mockTextareaInput = {
  title: 'Comment',
  description: 'Explain how was the organization of the event.',
  'x-jsf-presentation': {
    inputType: 'textarea',
    placeholder: 'Leave your comment...',
  },
  maximum: 250,
  type: 'string',
};

export const mockNumberInput = {
  title: 'Tabs',
  description: 'How many open tabs do you have?',
  'x-jsf-presentation': {
    inputType: 'number',
  },
  minimum: 1,
  maximum: 10,
  type: 'number',
};

export const schemaInputTypeNumberZeroMaximum = {
  properties: {
    tabs: {
      title: 'Tabs',
      description: 'How many open tabs do you have?',
      'x-jsf-presentation': {
        inputType: 'number',
      },
      minimum: -100,
      maximum: 0,
      type: 'number',
    },
  },
};

export const schemaInputTypeIntegerNumber = {
  properties: {
    tabs: {
      title: 'Tabs',
      description: 'How many open tabs do you have?',
      'x-jsf-presentation': {
        inputType: 'integer',
      },
      minimum: 1,
      maximum: 10,
      type: 'integer',
    },
  },
};

export const mockNumberInputWithPercentage = {
  title: 'Shares',
  description: 'What % of shares do you own?',
  'x-jsf-presentation': {
    inputType: 'number',
    percentage: true,
  },
  minimum: 1,
  maximum: 100,
  type: 'number',
};

export const mockNumberInputWithPercentageAndCustomRange = {
  ...mockNumberInputWithPercentage,
  minimum: 50,
  maximum: 70,
};

export const mockTextPatternInput = {
  ...mockTextInput,
  maxLength: 11,
  pattern: '^[0-9]{3}-[0-9]{2}-(?!0{4})[0-9]{4}$',
};

export const mockTextMaxLengthInput = {
  ...mockTextInput,
  maxLength: 10,
};

export const mockRadioInputDeprecated = {
  title: 'Has siblings',
  description: 'Do you have any siblings?',
  type: 'string',
  enum: ['yes', 'no'],
  'x-jsf-presentation': {
    inputType: 'radio',
    options: [
      {
        label: 'Yes',
        value: 'yes',
      },
      {
        label: 'No',
        value: 'no',
      },
    ],
  },
};

export const mockRadioInput = {
  title: 'Has siblings',
  description: 'Do you have any siblings?',
  oneOf: [
    {
      const: 'yes',
      title: 'Yes',
    },
    {
      const: 'no',
      title: 'No',
    },
  ],
  'x-jsf-presentation': {
    inputType: 'radio',
  },
  type: 'string',
};

export const mockRadioCardExpandableInput = {
  title: 'Experience level',
  description:
    'Please select the experience level that aligns with this role based on the job description (not the employees overall experience)',
  oneOf: [
    {
      const: 'junior',
      title: 'Junior level',
      description:
        'Entry level employees who perform tasks under the supervision of a more experienced employee.',
    },
    {
      const: 'mid',
      title: 'Mid level',
      description:
        'Employees who perform tasks with a good degree of autonomy and/or with coordination and control functions.',
    },
    {
      const: 'senior',
      title: 'Senior level',
      description:
        'Employees who perform tasks with a high degree of autonomy and/or with coordination and control functions.',
    },
  ],
  'x-jsf-presentation': {
    inputType: 'radio',
    variant: 'card-expandable',
  },
  type: 'string',
};

export const mockRadioCardInput = {
  title: 'Payment method',
  description: 'Chose how you want to be paid',
  oneOf: [
    {
      const: 'cc',
      title: 'Credit Card',
      description: 'Plastic money, which is still money',
    },
    {
      const: 'cash',
      title: 'Cash',
      description: 'Rules Everything Around Me',
    },
  ],
  'x-jsf-presentation': {
    inputType: 'radio',
    variant: 'card',
  },
  type: 'string',
};

export const mockSelectInputSoloDeprecated = {
  title: 'Benefits (solo)',
  description: 'Life Insurance',
  items: {
    enum: ['Medical Insurance, Health Insurance', 'Travel Bonus'],
  },
  'x-jsf-presentation': {
    inputType: 'select',
    options: [
      {
        label: 'Medical Insurance',
        value: 'Medical Insurance',
      },
      {
        label: 'Health Insurance',
        value: 'Health Insurance',
      },
      {
        label: 'Travel Bonus',
        value: 'Travel Bonus',
        disabled: true,
      },
    ],
    placeholder: 'Select...',
  },
};

export const mockSelectInputMultipleDeprecated = {
  ...mockSelectInputSoloDeprecated,
  title: 'Benefits (multiple)',
  type: 'array',
};

export const mockSelectInputSolo = {
  title: 'Browsers (solo)',
  description: 'This solo select also includes a disabled option.',
  type: 'string',
  oneOf: [
    {
      const: 'chr',
      title: 'Chrome',
    },
    {
      const: 'ff',
      title: 'Firefox',
    },
    {
      const: 'ie',
      title: 'Internet Explorer',
      disabled: true,
    },
  ],
  'x-jsf-presentation': {
    inputType: 'select',
  },
};

export const mockSelectInputMultiple = {
  title: 'Browsers (multiple)',
  description: 'This multi-select also includes a disabled option.',
  type: 'array',
  uniqueItems: true,
  items: {
    anyOf: [
      {
        const: 'chr',
        title: 'Chrome',
      },
      {
        const: 'ff',
        title: 'Firefox',
      },
      {
        value: 'ie',
        label: 'Internet Explorer',
        disabled: true,
      },
    ],
  },
  'x-jsf-presentation': {
    inputType: 'select',
  },
};

export const mockSelectInputMultipleOptional = {
  ...mockSelectInputMultiple,
  title: 'Browsers (multiple) (optional)',
  description: 'This optional multi-select also includes a disabled option.',
  type: ['array', 'null'],
};

export const mockFileInput = {
  description: 'File Input Description',
  'x-jsf-presentation': {
    inputType: 'file',
    accept: '.png,.jpg,.jpeg,.pdf',
    maxFileSize: 20480,
    fileDownload: 'http://some.domain.com/file-name.pdf',
    fileName: 'My File',
  },
  title: 'File Input',
  type: 'string',
};

export const mockFileInputWithSkippable = {
  ...mockFileInput,
  'x-jsf-presentation': {
    ...mockFileInput['x-jsf-presentation'],
    skippableLabel: 'This document does not apply to my profile.',
  },
};

export const mockFileInputWithAllowLaterUpload = {
  ...mockFileInput,
  title: 'File skippable',
  'x-jsf-presentation': {
    ...mockFileInput['x-jsf-presentation'],
    skippableLabel: "I don't have this document yet.",
    description:
      'File input, with attribute "allowLaterUpload". This tells the API to mark the file as skipped so that it is asked again later in the process.',
    allowLaterUpload: true,
  },
};

export const mockFieldset = {
  title: 'Fieldset title',
  description: 'Fieldset description',
  'x-jsf-presentation': {
    inputType: 'fieldset',
  },
  properties: {
    id_number: mockTextInput,
    tabs: mockNumberInput,
  },
  required: ['id_number'],
  type: 'object',
};

export const mockFocusedFieldset = {
  title: 'Focused fieldset title',
  description: 'Focused fieldset description',
  'x-jsf-presentation': {
    inputType: 'fieldset',
    variant: 'focused',
  },
  properties: {
    id_number: mockTextInput,
    tabs: mockNumberInput,
  },
  required: ['id_number'],
  type: 'object',
};

export const mockNestedFieldset = {
  title: 'Nested fieldset title',
  description: 'Nested fieldset description',
  'x-jsf-presentation': {
    inputType: 'fieldset',
  },
  properties: {
    innerFieldset: mockFieldset,
  },
  type: 'object',
};

export const mockGroupArrayInput = {
  items: {
    properties: {
      birthdate: {
        description: 'Enter your child’s date of birth',
        format: 'date',
        'x-jsf-presentation': {
          inputType: 'date',
        },
        title: 'Child Birthdate',
        type: 'string',
        maxLength: 255,
      },
      full_name: {
        description: 'Enter your child’s full name',
        'x-jsf-presentation': {
          inputType: 'text',
        },
        title: 'Child Full Name',
        type: 'string',
        maxLength: 255,
      },
      sex: {
        description:
          'We know sex is non-binary but for insurance and payroll purposes, we need to collect this information.',
        enum: ['female', 'male'],
        'x-jsf-presentation': {
          inputType: 'radio',
          options: [
            {
              label: 'Male',
              value: 'male',
            },
            {
              label: 'Female',
              value: 'female',
            },
          ],
        },
        title: 'Child Sex',
        type: 'string',
      },
    },
    'x-jsf-order': ['full_name', 'birthdate', 'sex'],
    required: ['full_name', 'birthdate', 'sex'],
    type: 'object',
  },
  'x-jsf-presentation': {
    inputType: 'group-array',
    addFieldText: 'Add new field',
  },
  title: 'Child details',
  description: 'Add the dependents you claim below',
  type: 'array',
};

const simpleGroupArrayInput = {
  items: {
    properties: {
      full_name: {
        description: 'Enter your child’s full name',
        'x-jsf-presentation': {
          inputType: 'text',
        },
        title: 'Child Full Name',
        type: 'string',
        maxLength: 255,
      },
    },
    required: ['full_name'],
    type: 'object',
  },
  'x-jsf-presentation': {
    inputType: 'group-array',
  },
  title: 'Child names',
  description: 'Add the dependents names',
  type: 'array',
};

export const mockOptionalGroupArrayInput = {
  ...mockGroupArrayInput,
  title: 'Child details (optional)',
  description:
    'This is an optional group-array. For a better UX, this Component asks a Yes/No question before allowing to add new field entries.',
};

export const mockEmailInput = {
  title: 'Email address',
  description: 'Enter your email address',
  maxLength: 255,
  format: 'email',
  'x-jsf-presentation': {
    inputType: 'email',
  },
  type: 'string',
};

export const mockCheckboxInput = {
  const: 'Permanent',
  description: 'I acknowledge that all employees in France will be hired on indefinite contracts.',
  'x-jsf-presentation': {
    inputType: 'checkbox',
  },
  title: 'Contract duration',
  type: 'string',
};

export const mockTelWithPattern = {
  properties: {
    phone_number: {
      title: 'Phone number',
      description: 'Enter your telephone number',
      type: 'string',
      'x-jsf-presentation': {
        inputType: 'tel',
      },
      oneOf: [
        {
          title: 'Portugal',
          pattern: '^(\\+351)[0-9]{9,}$',
          'x-jsf-presentation': { meta: { countryCode: '351' } },
        },
        {
          title: 'United Kingdom (UK)',
          pattern: '^(\\+44)[0-9]{1,}$',
          'x-jsf-presentation': { meta: { countryCode: '44' } },
        },
        {
          title: 'Bolivia',
          pattern: '^(\\+591)[0-9]{9,}$',
          'x-jsf-presentation': { meta: { countryCode: '591' } },
        },
        {
          title: 'Canada',
          pattern: '^(\\+1)(206|224)[0-9]{1,}$',
          'x-jsf-presentation': { meta: { countryCode: '1' } },
        },
        {
          title: 'United States',
          pattern: '^(\\+1)[0-9]{1,}$',
          'x-jsf-presentation': { meta: { countryCode: '1' } },
        },
      ],
    },
  },
};

/**
 * Compose a schema with lower chance of human error
 * @param {Object} schema version
 * @returns {Object} A JSON schema
 * @example
 *  JSONSchemaBuilder().addInput({
      id_number: mockTextInput,
    })
    .build();
 */

/**
 * @deprecated in favor of normal JSON schema.
 * Why? This adds extra complexity to read and to
 * copy-paste into the Playground, validators, etc
 * */
export function JSONSchemaBuilder() {
  return {
    addInput: function addInput(input) {
      this.properties = {
        ...this.properties,
        ...input,
      };
      return this;
    },
    setRequiredFields: function setRequiredFields(required) {
      this.requiredFields = required;
      return this;
    },
    setOrder: function setOrder(order) {
      this['x-jsf-order'] = order;
      return this;
    },
    addAnyOf: function addAnyOf(items) {
      this.anyOf = items;

      return this;
    },
    addAllOf: function addAllOf(items) {
      this.allOf = items;

      return this;
    },
    addCondition: function addCondition(ifCondition, thenBranch, elseBranch) {
      this.if = ifCondition;
      this.then = thenBranch;
      this.else = elseBranch;
      return this;
    },
    build: function build() {
      return {
        type: 'object',
        additionalProperties: false,
        properties: this.properties,
        ...(this['x-jsf-order'] ? { 'x-jsf-order': this['x-jsf-order'] } : {}),
        required: this.requiredFields || [],
        anyOf: this.anyOf,
        allOf: this.allOf,
        if: this.if,
        then: this.then,
        else: this.else,
      };
    },
  };
}

// -------------------------------------
// --------- Schemas pre-built ---------
// -------------------------------------

export const schemaWithoutInputTypes = {
  properties: {
    a_string: {
      title: 'A string -> text',
      type: 'string',
    },
    a_string_oneOf: {
      title: 'A string with oneOf -> radio',
      type: 'string',
      oneOf: [
        { const: 'yes', title: 'Yes' },
        { const: 'no', title: 'No' },
      ],
    },
    a_string_email: {
      title: 'A string with format:email -> email',
      type: 'string',
      format: 'email',
    },
    a_string_date: {
      title: 'A string with format:email -> date',
      type: 'string',
      format: 'date',
    },
    a_string_file: {
      title: 'A string with format:data-url -> file',
      type: 'string',
      format: 'data-url',
    },
    a_number: {
      title: 'A number -> number',
      type: 'number',
    },
    a_integer: {
      title: 'A integer -> number',
      type: 'integer',
    },
    a_boolean: {
      title: 'A boolean -> checkbox',
      type: 'boolean',
    },
    a_object: {
      title: 'An object -> fieldset',
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    },
    a_array_items: {
      title: 'An array items.anyOf -> select',
      type: 'array',
      items: {
        anyOf: [
          {
            const: 'chr',
            title: 'Chrome',
          },
          {
            const: 'ff',
            title: 'Firefox',
          },
          {
            value: 'ie',
            label: 'Internet Explorer',
          },
        ],
      },
    },
    a_array_properties: {
      title: 'An array items.properties -> group-array',
      items: {
        properties: {
          role: { title: 'Role', type: 'string' },
          years: { title: 'Years', type: 'number' },
        },
      },
      type: 'array',
    },
    a_void: {
      title: 'A void -> text',
      description: 'Given no type, returns text',
    },
  },
  required: ['a_array_properties'],
};

export const schemaWithoutTypes = {
  properties: {
    default: {
      title: 'Default -> text',
    },
    with_oneOf: {
      title: 'With oneOf -> radio',
      oneOf: [
        { const: 'yes', title: 'Yes' },
        { const: 'no', title: 'No' },
      ],
    },
    with_email: {
      title: 'With format:email -> email',
      format: 'email',
    },
    with_object: {
      title: 'With properties -> fieldset',
      properties: {
        foo: {},
        bar: {},
      },
    },
    with_items_anyOf: {
      title: 'With items.anyOf -> select',
      items: {
        anyOf: [
          {
            const: 'chr',
            title: 'Chrome',
          },
          {
            const: 'ff',
            title: 'Firefox',
          },
          {
            value: 'ie',
            label: 'Internet Explorer',
          },
        ],
      },
    },
    with_items_properties: {
      title: 'With items.properties -> group-array',
      items: {
        properties: {
          role: { title: 'Role' },
          years: { title: 'Years' },
        },
      },
    },
  },
};

export const schemaInputTypeText = {
  properties: {
    id_number: mockTextInput,
  },
  required: ['id_number'],
};

export const schemaInputWithStatement = {
  properties: {
    bonus: {
      title: 'Bonus',
      'x-jsf-presentation': {
        inputType: 'text',
        statement: {
          description: 'This is a custom statement message.',
          inputType: 'statement',
          severity: 'info',
        },
      },
    },
    role: {
      title: 'Role',
      'x-jsf-presentation': {
        inputType: 'text',
        statement: {
          description: 'This is another statement message, but more severe.',
          inputType: 'statement',
          severity: 'warning',
        },
      },
    },
  },
};

export const schemaInputWithExtra = {
  properties: {
    bonus: {
      title: 'Bonus',
      'x-jsf-presentation': {
        inputType: 'text',
        description: 'Remote lives around <strong>core values</strong> across the company.',
        extra: `They are:
          <ul>
            <li>Kindness</li>
            <li>Ownership</li>
            <li>Excellence</li>
            <li>Transparency</li>
            <li>Ambition</li>
          </ul>
          <p>You can read more at <a href="https://www.notion.so/remotecom/Handbook-a3439c6ccaac4d5f8c7515c357345c11" target="_blank">our public handbook</a>. They are also referred as <em>KOETA</em>.</p>
        `,
      },
    },
  },
};

export const schemaInputWithCustomDescription = {
  properties: {
    other: {
      title: 'Other',
      'x-jsf-presentation': {
        inputType: 'text',
        description: 'Some other information might still be <strong>relevant</strong> for you.',
      },
      type: 'string',
    },
  },
};

export const schemaInputDeprecated = JSONSchemaBuilder()
  .addInput({
    age_empty: {
      title: 'Age (Empty) (Deprecated)',
      'x-jsf-presentation': {
        inputType: 'number',
        description: 'What is your age?',
        deprecated: {
          description: 'Field deprecated empty.',
        },
      },
      deprecated: true,
      readOnly: true,
      type: 'number',
    },
  })
  .addInput({
    age_filled: {
      title: 'Age (Filled) (Deprecated)',
      'x-jsf-presentation': {
        inputType: 'number',
        description: 'What is your age?',
        deprecated: {
          description: 'Field deprecated and readOnly with a default value.',
        },
      },
      default: 18,
      deprecated: true,
      readOnly: true,
      type: 'number',
    },
  })
  .addInput({
    age_editable: {
      title: 'Age (Editable) (Deprecated)',
      'x-jsf-presentation': {
        inputType: 'number',
        description: 'What is your age?',
        deprecated: {
          description: 'Field deprecated but editable.',
        },
      },
      deprecated: true,
      type: 'number',
    },
  })
  .build();

/** @deprecated */
export const schemaInputTypeRadioDeprecated = {
  properties: {
    has_siblings: mockRadioInputDeprecated,
  },
  required: ['has_siblings'],
};

export const schemaInputTypeRadio = {
  properties: {
    has_siblings: mockRadioInput,
  },
  required: ['has_siblings'],
};

export const mockRadioInputOptionalNull = {
  title: 'Has car',
  oneOf: [
    { const: 'yes', title: 'Yes' },
    { const: 'no', title: 'No' },
    // JSF excludes the null option from the field output
    // But keeps null as an accepted value
    { const: null, title: 'N/A' },
  ],
  'x-jsf-presentation': { inputType: 'radio' },
  type: ['string', 'null'], // Yes, the JSON Schema spec is 'null', not null.
};

export const schemaInputTypeRadioRequiredAndOptional = {
  properties: {
    has_siblings: mockRadioInput,
    has_car: {
      ...mockRadioInputOptionalNull,
      description: 'Do you have a car? (optional field, check oneOf)',
    },
  },
  required: ['has_siblings'],
};

export const schemaInputRadioOptionalNull = {
  properties: {
    has_car: mockRadioInputOptionalNull,
  },
};

export const schemaInputRadioOptionalConventional = {
  properties: {
    has_car: {
      title: 'Has car',
      oneOf: [
        { const: 'yes', title: 'Yes' },
        { const: 'no', title: 'No' },
      ],
      'x-jsf-presentation': { inputType: 'radio' },
      type: 'string',
    },
  },
};

export const schemaInputTypeRadioCard = {
  properties: {
    experience_level: mockRadioCardExpandableInput,
    payment_method: mockRadioCardInput,
  },
  required: ['experience_level'],
};

export const schemaInputTypeRadioOptionsWithDetails = {
  properties: {
    health_perks: {
      title: 'Health perks',
      description:
        'This example contains options with more custom details, under the x-jsf-presentation key',
      oneOf: [
        {
          const: 'basic',
          title: 'Basic',
          'x-jsf-presentation': {
            meta: {
              displayCost: '$30.00/mo',
            },
          },
          'x-another': 'extra-thing',
        },
        {
          const: 'standard',
          title: 'Standard',
          'x-jsf-presentation': {
            meta: {
              displayCost: '$50.00/mo',
            },
          },
        },
      ],
      'x-jsf-presentation': {
        inputType: 'radio',
      },
      type: 'string',
    },
  },
};

export const schemaInputTypeRadioWithoutOptions = {
  properties: {
    health_perks: {
      title: 'Health perks',
      description:
        'This example contains options with more custom details, under the x-jsf-presentation key',
      'x-jsf-presentation': { inputType: 'radio' },
      type: 'string',
    },
  },
};

/** @deprecated */
export const schemaInputTypeSelectSoloDeprecated = JSONSchemaBuilder()
  .addInput({
    benefits: mockSelectInputSoloDeprecated,
  })
  .setRequiredFields(['benefits'])
  .build();
export const schemaInputTypeSelectSolo = JSONSchemaBuilder()
  .addInput({
    browsers: mockSelectInputSolo,
  })
  .setRequiredFields(['browsers'])
  .build();

/** @deprecated */
export const schemaInputTypeSelectMultipleDeprecated = JSONSchemaBuilder()
  .addInput({
    benefits_multi: mockSelectInputMultipleDeprecated,
  })
  .setRequiredFields(['benefits_multi'])
  .build();
export const schemaInputTypeSelectMultiple = JSONSchemaBuilder()
  .addInput({
    browsers_multi: mockSelectInputMultiple,
  })
  .setRequiredFields(['browsers_multi'])
  .build();

export const schemaInputTypeSelectMultipleOptional = JSONSchemaBuilder()
  .addInput({
    browsers_multi_optional: mockSelectInputMultipleOptional,
  })
  .build();

export const schemaInputTypeNumber = JSONSchemaBuilder()
  .addInput({
    tabs: mockNumberInput,
  })
  .setRequiredFields(['tabs'])
  .build();

export const schemaInputTypeNumberWithPercentage = JSONSchemaBuilder()
  .addInput({
    shares: mockNumberInputWithPercentage,
  })
  .setRequiredFields(['shares'])
  .build();

export const schemaInputTypeDate = {
  type: 'object',
  additionalProperties: false,
  properties: {
    birthdate: {
      'x-jsf-presentation': { inputType: 'date', maxDate: '2022-03-17', minDate: '1922-03-01' },
      title: 'Birthdate',
      type: 'string',
      format: 'date',
    },
  },
  required: ['birthdate'],
};

export const schemaInputTypeEmail = JSONSchemaBuilder()
  .addInput({
    email_address: mockEmailInput,
  })
  .setRequiredFields(['email_address'])
  .build();

export const schemaInputTypeFile = JSONSchemaBuilder()
  .addInput({
    a_file: mockFileInput,
  })
  .setRequiredFields(['a_file'])
  .build();

export const schemaInputTypeFileWithSkippable = JSONSchemaBuilder()
  .addInput({
    b_file: mockFileInputWithSkippable,
  })
  .build();

export const schemaInputTypeFieldset = {
  properties: {
    a_fieldset: mockFieldset,
  },
  required: ['a_fieldset'],
};

export const schemaInputTypeFocusedFieldset = JSONSchemaBuilder()
  .addInput({
    focused_fieldset: mockFocusedFieldset,
  })
  .setRequiredFields(['focused_fieldset'])
  .build();

export const schemaInputTypeGroupArray = JSONSchemaBuilder()
  .addInput({
    dependent_details: mockGroupArrayInput,
    optional_dependent_details: mockOptionalGroupArrayInput,
  })
  .setRequiredFields(['dependent_details'])
  .build();

export const schemaInputTypeCheckbox = JSONSchemaBuilder()
  .addInput({
    contract_duration: mockCheckboxInput,
    contract_duration_checked: {
      ...mockCheckboxInput,
      title: 'Checkbox (checked by default)',
      default: 'Permanent',
    },
  })
  .setRequiredFields(['contract_duration'])
  .build();

export const schemaInputTypeCheckboxBooleans = JSONSchemaBuilder()
  .addInput({
    boolean_empty: {
      title: 'It is christmas',
      description: 'This one is optional.',
      type: 'boolean',
      'x-jsf-presentation': {
        inputType: 'checkbox',
      },
    },
    boolean_required: {
      title: 'Is it rainy (required)',
      description: 'This one is required. Is must have const: true to work properly.',
      type: 'boolean',
      const: true, // Must be explicit that `true` (checked) is the only accepted value.
      'x-jsf-presentation': {
        inputType: 'checkbox',
      },
    },
    boolean_checked: {
      title: 'It is sunny (Default checked)',
      description: 'This is checked by default thanks to `default: true`.',
      type: 'boolean',
      default: true,
      'x-jsf-presentation': {
        inputType: 'checkbox',
      },
    },
  })
  .setRequiredFields(['boolean_required'])
  .build();

export const schemaCustomErrorMessageByField = {
  properties: {
    tabs: {
      title: 'Tabs',
      description: 'How many open tabs do you have?',
      'x-jsf-presentation': {
        inputType: 'number',
        position: 0,
      },
      minimum: 1,
      maximum: 99,
      type: 'number',
      'x-jsf-errorMessage': {
        required: 'This is required.',
        minimum: 'You must have at least 1 open tab.',
        maximum: 'Your browser does not support more than 99 tabs.',
      },
    },
  },
  required: ['tabs'],
};

// The custom error message is below at jsfConfigForErrorMessageSpecificity
export const schemaForErrorMessageSpecificity = {
  properties: {
    weekday: {
      title: 'Weekday',
      description: "This text field has the traditional error message. 'Required field'",
      type: 'string',
      presentation: { inputType: 'text' },
    },
    day: {
      title: 'Day',
      type: 'number',
      description:
        'The remaining fields are numbers and were customized to say "This cannot be empty." instead of "Required field".',

      maximum: 31,
      presentation: { inputType: 'number' },
    },
    month: {
      title: 'Month',
      type: 'number',
      minimum: 1,
      maximum: 12,
      presentation: { inputType: 'number' },
    },
    year: {
      title: 'Year',
      description:
        "This number field has a custom error message declared in the json schema, which has a higher specificity than the one declared in createHeadlessForm's configuration.",
      type: 'number',
      presentation: { inputType: 'number' },
      'x-jsf-errorMessage': {
        required: 'The year is mandatory.',
      },
      minimum: 1900,
      maximum: 2023,
    },
  },
  required: ['weekday', 'day', 'month', 'year'],
};

export const jsfConfigForErrorMessageSpecificity = {
  inputTypes: {
    number: {
      errorMessage: {
        required: 'This cannot be empty.',
      },
    },
  },
};

export const schemaWithPositionDeprecated = JSONSchemaBuilder()
  .addInput({
    age: {
      title: 'age',
      'x-jsf-presentation': { inputType: 'number', position: 1 },
    },
    street: {
      title: 'street',
      'x-jsf-presentation': { inputType: 'fieldset', position: 2 },
      properties: {
        line_one: {
          title: 'Street',
          'x-jsf-presentation': { inputType: 'text', position: 0 },
        },
        postal_code: {
          title: 'Postal code',
          'x-jsf-presentation': { inputType: 'text', position: 2 },
        },
        number: {
          title: 'Number',
          'x-jsf-presentation': { inputType: 'number', position: 1 },
        },
      },
    },
    username: {
      title: 'Username',
      'x-jsf-presentation': { inputType: 'text', position: 0 },
    },
  })
  .build();

export const schemaWithOrderKeyword = JSONSchemaBuilder()
  .addInput({
    age: {
      title: 'Age',
      'x-jsf-presentation': { inputType: 'number' },
    },
    street: {
      title: 'Street',
      'x-jsf-presentation': { inputType: 'fieldset' },
      properties: {
        line_one: {
          title: 'Street',
          'x-jsf-presentation': { inputType: 'text' },
        },
        postal_code: {
          title: 'Postal code',
          'x-jsf-presentation': { inputType: 'text' },
        },
        number: {
          title: 'Number',
          'x-jsf-presentation': { inputType: 'number' },
        },
      },
      'x-jsf-order': ['line_one', 'number', 'postal_code'],
    },
    username: {
      title: 'Username',
      'x-jsf-presentation': { inputType: 'text' },
    },
  })
  .setOrder(['username', 'age', 'street'])
  .build();

export const schemaDynamicValidationConst = {
  properties: {
    a_fieldset: mockFieldset,
    a_group_array: simpleGroupArrayInput,
    validate_tabs: {
      title: 'Should "Tabs" value be required?',
      description: 'Toggle this radio for changing the validation of the fieldset bellow',
      oneOf: [
        {
          title: 'Yes',
          value: 'yes',
        },
        {
          title: 'No',
          value: 'no',
        },
      ],
      'x-jsf-presentation': {
        inputType: 'radio',
      },
    },
    mandatory_group_array: {
      title: 'Add required group array field',
      description: 'Toggle this radio for displaying a mandatory group array field',
      oneOf: [
        {
          title: 'Yes',
          value: 'yes',
        },
        {
          title: 'No',
          value: 'no',
        },
      ],
      'x-jsf-presentation': {
        inputType: 'radio',
      },
    },
  },
  allOf: [
    {
      if: {
        properties: {
          mandatory_group_array: {
            const: 'yes',
          },
        },
        required: ['mandatory_group_array'],
      },
      then: {
        required: ['a_group_array'],
      },
      else: {
        properties: {
          a_group_array: false,
        },
      },
    },
  ],
  if: {
    properties: {
      validate_tabs: {
        const: 'yes',
      },
    },
    required: ['validate_tabs'],
  },
  then: {
    properties: {
      a_fieldset: {
        required: ['id_number', 'tabs'],
      },
    },
  },
  required: ['a_fieldset', 'validate_tabs', 'mandatory_group_array'],
  'x-jsf-order': ['validate_tabs', 'a_fieldset', 'mandatory_group_array', 'a_group_array'],
};

export const schemaDynamicValidationMinimumMaximum = JSONSchemaBuilder()
  .addInput({
    a_number: mockNumberInput,
    a_conditional_text: mockTextInput,
  })
  .addCondition(
    {
      properties: {
        a_number: {
          minimum: 1,
        },
      },
      required: ['a_number'],
    },
    {
      if: {
        properties: {
          a_number: {
            maximum: 10,
          },
        },
        required: ['a_number'],
      },
      then: {
        required: [],
      },
      else: {
        required: ['a_conditional_text'],
      },
    },
    {
      required: ['a_conditional_text'],
    }
  )
  .build();

export const schemaDynamicValidationMinLengthMaxLength = JSONSchemaBuilder()
  .addInput({
    a_text: mockTextInput,
    a_conditional_text: mockTextInput,
  })
  .addCondition(
    // if a_text is between 3 and 5 chars, a_conditional_text is optional.
    {
      properties: {
        a_text: {
          minLength: 3,
          maxLength: 5,
        },
      },
      required: ['a_text'],
    },
    {
      required: [],
    },
    {
      required: ['a_conditional_text'],
    }
  )
  .build();

export const schemaDynamicValidationContains = JSONSchemaBuilder()
  .addInput({
    a_fieldset: mockFieldset,
    validate_fieldset: {
      title: 'Fieldset validation',
      type: 'array',
      description: 'Select what fieldset fields are required',
      items: {
        enum: ['all', 'id_number'],
      },
      'x-jsf-presentation': {
        inputType: 'select',
        options: [
          {
            label: 'All',
            value: 'all',
          },
          {
            label: 'ID Number',
            value: 'id_number',
          },
        ],
        placeholder: 'Select...',
      },
    },
  })
  .addCondition(
    {
      properties: {
        validate_fieldset: {
          contains: {
            pattern: '^all$',
          },
        },
      },
      required: ['validate_fieldset'],
    },
    {
      properties: {
        a_fieldset: {
          required: ['id_number', 'tabs'],
        },
      },
    }
  )
  .setRequiredFields(['a_fieldset', 'validate_fieldset'])
  .setOrder(['validate_fieldset', 'a_fieldset'])
  .build();

export const schemaAnyOfValidation = JSONSchemaBuilder()
  .addInput({
    field_a: {
      ...mockTextInput,
      title: 'Field A',
      description: 'Field A is needed if B and C are empty',
    },
    field_b: {
      ...mockTextInput,
      title: 'Field B',
      description: 'Field B is needed if A is empty and C is not empty',
    },
    field_c: {
      ...mockTextInput,
      title: 'Field C',
      description: 'Field C is needed if A is empty and B is not empty',
    },
  })
  .addAnyOf([
    {
      required: ['field_a'],
    },
    {
      required: ['field_b', 'field_c'],
    },
  ])
  .build();

export const schemaWithConditionalPresentationProperties = JSONSchemaBuilder()
  .addInput({
    mock_radio: mockRadioInput,
  })
  .addAllOf([
    {
      if: {
        properties: {
          mock_radio: {
            const: 'no',
          },
        },
        required: ['mock_radio'],
      },
      then: {
        properties: {
          mock_radio: {
            'x-jsf-presentation': {
              statement: {
                description: '<a href="">conditional statement markup</a>',
                severity: 'info',
              },
            },
          },
        },
      },
      else: {
        properties: {
          'x-jsf-presentation': {
            mock_radio: null,
          },
        },
      },
    },
  ])
  .setRequiredFields(['mock_radio'])
  .build();

export const schemaWithConditionalReadOnlyProperty = JSONSchemaBuilder()
  .addInput({ field_a: mockRadioInput })
  .addInput({ field_b: mockTextInput })
  .addAllOf([
    {
      if: {
        properties: {
          field_a: {
            const: 'yes',
          },
        },
        required: ['field_a'],
      },
      then: {
        properties: {
          field_b: {
            readOnly: false,
          },
        },
        required: ['field_b'],
      },
      else: {
        if: {
          properties: {
            field_a: {
              const: 'no',
            },
          },
          required: ['field_a'],
        },
        then: {
          properties: {
            field_b: {
              readOnly: true,
            },
          },
          required: ['field_b'],
        },
        else: {
          properties: {
            field_b: false,
          },
        },
      },
    },
  ])
  .setRequiredFields(['field_a'])
  .build();

export const schemaWithConditionalAcknowledgementProperty = JSONSchemaBuilder()
  .addInput({ field_a: mockRadioInput })
  .addInput({ field_b: mockCheckboxInput })
  .addAllOf([
    {
      if: {
        properties: {
          field_a: {
            const: 'yes',
          },
        },
        required: ['field_a'],
      },
      then: {
        required: ['field_b'],
      },
      else: {
        properties: {
          field_b: false,
        },
      },
    },
  ])
  .setRequiredFields(['field_a'])
  .build();

// Note: The second conditional (field_a_wrong) is incorrect,
// it's used to test/catch the scenario where devs forget to add the if.required[]
export const schemaWithWrongConditional = JSONSchemaBuilder()
  .addInput({ field_a: mockRadioInput })
  .addInput({ field_b: mockTextInput })
  .addInput({ field_a_wrong: mockRadioInput })
  .addInput({ field_b_wrong: mockTextInput })
  .addAllOf([
    {
      if: {
        properties: {
          field_a: {
            const: 'yes',
          },
        },
        required: ['field_a'],
      },
      then: {
        required: ['field_b'],
      },
      else: {
        properties: {
          field_b: false,
        },
      },
    },
    {
      if: {
        properties: {
          field_a_wrong: {
            const: 'yes',
          },
        },
        // it's missing this "required" keyword, for field_b_wrong to be visible.
        // required: ['field_a_wrong'],
      },
      then: {
        required: ['field_b_wrong'],
      },
      else: {
        properties: {
          field_b_wrong: false,
        },
      },
    },
  ])
  .setRequiredFields(['field_a', 'field_a_wrong'])
  .build();

export const schemaFieldsetScopedCondition = {
  additionalProperties: false,
  properties: {
    child: {
      type: 'object',
      title: 'Child details',
      description:
        'In the JSON Schema, you will notice the if/then/else is inside the property, not in the root.',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        has_child: {
          description: 'If yes, it will show its age.',
          'x-jsf-presentation': {
            inputType: 'radio',
            options: [
              {
                label: 'Yes',
                value: 'yes',
              },
              {
                label: 'No',
                value: 'no',
              },
            ],
          },
          title: 'Do you have a child?',
          type: 'string',
        },
        age: {
          description: 'This age is required, but the "age" at the root level is still optional.',
          'x-jsf-presentation': {
            inputType: 'number',
          },
          title: 'Age',
          type: 'number',
        },
        passport_id: {
          description: 'Passport ID is optional',
          'x-jsf-presentation': {
            inputType: 'text',
          },
          title: 'Passport ID',
          type: 'string',
        },
      },
      required: ['has_child'],
      allOf: [
        {
          if: {
            properties: {
              has_child: {
                const: 'yes',
              },
            },
            required: ['has_child'],
          },
          then: {
            required: ['age'],
          },
          else: {
            properties: {
              age: false,
              passport_id: false,
            },
          },
        },
      ],
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-jsf-presentation': {
        inputType: 'number',
        description: 'This field is optional, always.',
      },
    },
  },
  required: ['child'],
  type: 'object',
};

export const schemaWithConditionalToFieldset = {
  additionalProperties: false,
  type: 'object',
  properties: {
    work_hours_per_week: {
      title: 'Hours per week',
      type: 'number',
      description: 'Above 30 hours, the Perk>Food options change, and PTO is required.',
      'x-jsf-presentation': {
        inputType: 'number',
      },
    },
    pto: {
      title: 'Time-off (days)',
      type: 'number',
      'x-jsf-presentation': {
        inputType: 'number',
      },
    },
    perks: {
      additionalProperties: false,
      properties: {
        food: {
          oneOf: [
            {
              const: 'lunch',
              title: 'Lunch',
            },
            {
              const: 'dinner',
              title: 'Dinner',
            },
            {
              const: 'all',
              title: 'All',
              description: 'Every meal',
            },
            {
              const: 'no',
              title: 'No food',
            },
          ],
          title: 'Food',
          type: 'string',
          'x-jsf-presentation': {
            inputType: 'radio',
          },
        },
        retirement: {
          oneOf: [
            {
              const: 'basic',
              title: 'Basic',
            },
            {
              const: 'plus',
              title: 'Plus',
            },
          ],
          title: 'Retirement',
          type: 'string',
          'x-jsf-presentation': {
            inputType: 'radio',
          },
        },
      },
      required: ['food', 'retirement'],
      title: 'Perks',
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
    },
  },
  allOf: [
    {
      if: {
        properties: {
          work_hours_per_week: {
            minimum: 30,
          },
        },
        required: ['work_hours_per_week'],
      },
      then: {
        properties: {
          pto: {
            $comment: '@BUG: This description does not disappear once activated.',
            description: 'Above 30 hours, the PTO needs to be at least 20 days.',
            minimum: 20,
          },
          perks: {
            properties: {
              food: {
                description: "Above 30 hours, the 'no' option disappears.",
                oneOf: [
                  {
                    const: 'lunch',
                    title: 'Lunch',
                  },
                  {
                    const: 'dinner',
                    title: 'Dinner',
                  },
                  {
                    const: 'all',
                    title: 'all',
                  },
                ],
              },
            },
          },
        },
        required: ['pto'],
      },
    },
  ],
  required: ['perks', 'work_hours_per_week'],
};

export const schemaWorkSchedule = {
  type: 'object',
  properties: {
    employee_schedule: {
      title: 'Employee Schedule',
      'x-jsf-presentation': {
        inputType: 'fieldset',
        position: 0,
      },
      properties: {
        schedule_type: {
          type: 'string',
          title: 'Employee Schedule Type',
          oneOf: [
            { const: 'flexible', title: "Employee's hours are flexible" },
            {
              const: 'core_business_hours',
              title: "Employee works employer's core business hours",
            },
            { const: 'fixed_hours', title: 'Employee works fixed hours' },
          ],
          'x-jsf-presentation': {
            inputType: 'select',
            position: 0,
          },
        },
        daily_schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: {
                type: 'string',
                enum: [
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday',
                ],
              },
              start_time: {
                type: 'string',
                pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
              },
              end_time: {
                type: 'string',
                pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
              },
              hours: {
                type: 'number',
                minimum: 0,
              },
              break_duration_minutes: {
                type: 'integer',
                minimum: 0,
              },
            },
            required: ['day', 'start_time', 'end_time', 'hours', 'break_duration_minutes'],
          },
          'x-jsf-presentation': {
            position: 1,
            inputType: 'work-schedule',
          },
          default: [],
        },
        work_hours_per_week: {
          type: 'number',
          title: 'Work Hours Per Week',
          maximum: 50,
          minimum: 1,
          'x-jsf-errorMessage': {
            minimum: 'You must enter work hours to equal more than 0.',
          },
          'x-jsf-presentation': {
            inputType: 'number',
            position: 2,
          },
        },
        exclude_breaks_in_work_hours: {
          const: true,
          readOnly: true,
          'x-jsf-presentation': {
            inputType: 'hidden',
          },
          type: 'boolean',
        },
      },
      allOf: [
        {
          if: {
            properties: {
              schedule_type: {
                enum: ['flexible', 'core_business_hours', 'fixed_hours'],
              },
            },
            required: ['schedule_type'],
          },
          then: {
            required: ['work_hours_per_week'],
          },
          else: {
            properties: {
              work_hours_per_week: false,
            },
          },
        },
        {
          if: {
            properties: {
              schedule_type: {
                enum: ['core_business_hours', 'fixed_hours'],
              },
            },
            required: ['schedule_type'],
          },
          then: {
            required: ['daily_schedule'],
          },
          else: {
            properties: {
              daily_schedule: false,
            },
          },
        },
        {
          if: {
            properties: {
              schedule_type: {
                const: 'flexible',
              },
            },
            required: ['schedule_type'],
          },
          then: {
            required: ['work_hours_per_week'],
            properties: {
              work_hours_per_week: {
                readOnly: false,
              },
            },
          },
        },
        {
          if: {
            properties: {
              schedule_type: {
                const: 'core_business_hours',
              },
            },
            required: ['schedule_type'],
          },
          then: {
            required: ['work_hours_per_week'],
            properties: {
              daily_schedule: {
                title: 'Core business hours',
                default: [
                  {
                    day: 'monday',
                    start_time: '10:00',
                    end_time: '17:30',
                    hours: 8.5,
                    break_duration_minutes: 60,
                  },
                  {
                    day: 'wednesday',
                    start_time: '10:00',
                    end_time: '17:30',
                    hours: 7.5,
                    break_duration_minutes: 45,
                  },
                  {
                    day: 'friday',
                    start_time: '09:00',
                    end_time: '17:30',
                    hours: 8.5,
                    break_duration_minutes: 45,
                  },
                ],
              },
              work_hours_per_week: {
                readOnly: false,
              },
            },
          },
        },
        {
          if: {
            properties: {
              schedule_type: {
                const: 'fixed_hours',
              },
            },
            required: ['schedule_type'],
          },
          then: {
            properties: {
              daily_schedule: {
                title: 'Work hours',
                default: [
                  {
                    day: 'monday',
                    start_time: '10:00',
                    end_time: '17:30',
                    hours: 8.5,
                    break_duration_minutes: 60,
                  },
                  {
                    day: 'wednesday',
                    start_time: '10:00',
                    end_time: '17:30',
                    hours: 7.5,
                    break_duration_minutes: 45,
                  },
                  {
                    day: 'saturday',
                    start_time: '09:00',
                    end_time: '17:30',
                    hours: 8.5,
                    break_duration_minutes: 45,
                  },
                ],
              },
              work_hours_per_week: {
                readOnly: true,
              },
            },
          },
        },
      ],
      required: ['schedule_type'],
      type: 'object',
    },
  },
  required: ['employee_schedule'],
  allOf: [],
};

export const schemaWithCustomValidations = {
  properties: {
    work_hours_per_week: {
      title: 'Work hours per week',
      'x-jsf-presentation': {
        inputType: 'number',
      },
      minimum: 1,
      maximum: 40,
      type: 'number',
    },
    available_pto: {
      'x-jsf-presentation': {
        inputType: 'number',
      },
      title: 'Number of paid time off days',
      type: 'number',
    },
  },
  'x-jsf-order': ['work_hours_per_week', 'available_pto'],
  required: ['work_hours_per_week', 'available_pto'],
};

export const schemaWithCustomValidationsAndConditionals = {
  properties: {
    work_schedule: {
      oneOf: [
        { const: 'full_time', title: 'Full-time' },
        { const: 'part_time', title: 'Part-time' },
      ],
      'x-jsf-presentation': {
        inputType: 'radio',
      },
      type: 'string',
      title: 'Type of employee',
    },
    work_hours_per_week: {
      title: 'Work hours per week',
      description: 'Please indicate the number of hours the employee will work per week.',
      'x-jsf-presentation': {
        inputType: 'number',
      },
      minimum: 1,
      maximum: 40,
      type: 'number',
    },
    annual_gross_salary: {
      title: 'Annual gross salary',
      'x-jsf-presentation': {
        inputType: 'money',
        currency: 'EUR',
      },
      $comment: 'The minimum is dynamically calculated with jsf.',
      type: ['integer', 'null'],
    },
    hourly_gross_salary: {
      title: 'Hourly gross salary',
      'x-jsf-presentation': {
        inputType: 'money',
        currency: 'EUR',
      },
      $comment: 'The minimum is dynamically calculated with jsf.',
      type: ['integer', 'null'],
    },
  },
  'x-jsf-order': [
    'work_schedule',
    'work_hours_per_week',
    'annual_gross_salary',
    'hourly_gross_salary',
  ],
  required: ['work_schedule', 'work_hours_per_week'],
  allOf: [
    {
      if: {
        properties: {
          work_schedule: {
            const: 'full_time',
          },
        },
        required: ['work_schedule'],
      },
      then: {
        properties: {
          work_hours_per_week: {
            minimum: 36,
            maximum: 40,
            'x-jsf-errorMessage': {
              minimum: 'Must be at least 36 hours per week.',
              maximum: 'Must be no more than 40 hours per week.',
            },
          },
          hourly_gross_salary: false,
        },
        required: ['annual_gross_salary'],
      },
      else: {
        required: ['hourly_gross_salary'],
        properties: {
          annual_gross_salary: false,
          work_hours_per_week: {
            minimum: 1,
            maximum: 35,
            'x-jsf-errorMessage': {
              minimum: 'Must be at least 1 hour per week.',
              maximum: 'Must be no more than 35 hours per week.',
            },
          },
        },
      },
    },
  ],
};
