import {
  mockTextInput,
  mockNumberInput,
  mockEmailInput,
  mockCheckboxInput,
  mockFileInput,
  mockSelectInputSolo,
} from './helpers';

export const schemaInputTypeTextarea = {
  properties: {
    comment: {
      title: 'Your comment',
      presentation: {
        inputType: 'textarea',
      },
      maxLength: 250,
      type: 'string',
    },
  },
  required: ['comment'],
};

export const inputTypeCountriesSolo = {
  title: 'Countries',
  oneOf: [
    { title: 'Afghanistan', const: 'Afghanistan' },
    { title: 'Albania', const: 'Albania' },
    { title: 'Algeria', const: 'Algeria' },
  ],
  type: 'string',
  presentation: {
    inputType: 'countries',
  },
};

export const schemaInputTypeCountriesSolo = {
  properties: {
    birthplace: {
      ...inputTypeCountriesSolo,
      title: 'Birthplace',
      description: 'Where were you born?',
    },
  },
  required: ['birthplace'],
};

export const schemaInputTypeCountriesMultiple = {
  properties: {
    nationality: {
      title: 'Nationality',
      description: 'Where are you a legal citizen?',
      items: {
        anyOf: [
          { title: 'Afghanistan', const: 'Afghanistan' },
          { title: 'Albania', const: 'Albania' },
          { title: 'Algeria', const: 'Algeria' },
        ],
      },
      type: 'array',
      presentation: {
        inputType: 'countries',
      },
    },
  },
  required: ['nationality'],
};

export const schemaInputTypeFileUploadLater = {
  properties: {
    b_file: {
      ...mockFileInput,
      title: 'File skippable',
      'x-jsf-presentation': {
        ...mockFileInput['x-jsf-presentation'],
        skippableLabel: "I don't have this document yet.",
        description:
          'File input, with attribute "allowLaterUpload". This tells the API to mark the file as skipped so that it is asked again later in the process.',
        allowLaterUpload: true,
      },
    },
  },
};

export const schemaInputTypeTel = {
  properties: {
    phone_number: {
      title: 'Phone number',
      description: 'Enter your telephone number',
      type: 'string',
      pattern: '^(\\+|00)[0-9]{6,}$',
      maxLength: 30,
      presentation: {
        inputType: 'tel',
      },
      errorMessage: {
        maxLength: 'Must be at most 30 digits',
        pattern: 'Please insert only the country code and phone number, without letters or spaces',
      },
    },
  },
  required: ['phone_number'],
};

const mockTelInput = {
  title: 'Phone number',
  description: 'Enter your telephone number',
  maxLength: 30,
  presentation: {
    inputType: 'tel',
  },
  pattern: '^(\\+|00)\\d*$',
  type: 'string',
};

export const mockMoneyInput = {
  title: 'Weekly salary',
  description: 'This field has a min and max values. Max has a custom error message.',
  presentation: {
    inputType: 'money',
    currency: 'EUR',
  },
  $comment: 'The value is in cents format. e.g. 1000 -> 10.00€',
  minimum: 100000,
  maximum: 500000,
  'x-jsf-errorMessage': {
    type: 'Please, use US standard currency format. Ex: 1024.12',
    maximum: 'No more than €5000.00',
  },
  type: 'integer',
};

export const schemaInputTypeMoney = {
  properties: {
    salary: mockMoneyInput,
  },
  required: ['salary'],
};

export const schemaCustomComponentWithAck = {
  properties: {
    salary: mockMoneyInput,
    terms: mockCheckboxInput,
  },
  required: ['salary'],
};

export const schemaCustomComponent = {
  properties: {
    salary: {
      title: 'Monthly gross salary',
      description: 'This field gets represented by a custom UI Component.',
      presentation: {
        inputType: 'money',
        currency: 'EUR',
      },
      type: 'integer',
      'x-jsf-errorMessage': {
        type: 'Please, use US standard currency format. Ex: 1024.12',
      },
    },
  },
  required: ['salary'],
};

export const schemaInputTypeHidden = {
  properties: {
    a_hidden_field_text: {
      ...mockTextInput,
      title: 'Text hidden',
      'x-jsf-presentation': { inputType: 'hidden' },
      default: '12345',
    },
    a_hidden_field_number: {
      ...mockNumberInput,
      title: 'Number hidden',
      'x-jsf-presentation': { inputType: 'hidden' },
      default: 5,
    },
    a_hidden_field_tel: {
      ...mockTelInput,
      title: 'Tel hidden',
      'x-jsf-presentation': { inputType: 'hidden' },
      default: '+123456789',
    },
    a_hidden_field_email: {
      ...mockEmailInput,
      title: 'Email hidden',
      'x-jsf-presentation': { inputType: 'hidden' },
      default: 'test@remote.com',
    },
    a_hidden_field_money: {
      ...mockMoneyInput,
      title: 'Money hidden',
      'x-jsf-presentation': { inputType: 'hidden', currency: 'EUR' },
      minimum: 0,
      default: 12.3,
    },
    a_hidden_select: {
      ...mockSelectInputSolo,
      title: 'Select hidden',
      'x-jsf-presentation': { inputType: 'hidden' },
      default: 'chr',
    },
    a_hidden_select_multiple: {
      ...schemaInputTypeCountriesMultiple.properties.nationality,
      title: 'Select multi hidden',
      default: ['Albania, Algeria'],
      'x-jsf-presentation': { inputType: 'hidden' },
      const: ['Albania, Algeria'],
      type: 'array',
    },
  },
  required: [
    'a_hidden_field_text',
    'a_hidden_field_number',
    'a_hidden_field_tel',
    'a_hidden_field_email',
    'a_hidden_field_money',
    'a_hidden_select',
    'a_hidden_select_multiple,',
  ],
};
