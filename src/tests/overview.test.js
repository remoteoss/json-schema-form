import { createHeadlessForm } from '../createHeadlessForm';

export const schemaDemo1 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    has_pet: {
      title: 'Has Pet',
      description: 'Do you have a pet?',
      oneOf: [
        {
          title: 'Yes',
          const: 'yes',
        },
        {
          title: 'No',
          const: 'no',
        },
      ],
      'x-jsf-presentation': {
        inputType: 'radio',
      },
      type: 'string',
    },
    pet_name: {
      title: "Pet's name",
      description: "What's your pet's name?",
      'x-jsf-presentation': {
        inputType: 'text',
      },
      type: 'string',
    },
  },
  required: ['has_pet'],
  'x-jsf-order': ['has_pet', 'pet_name'],
  allOf: [
    {
      if: {
        properties: {
          has_pet: {
            const: 'yes',
          },
        },
        required: ['has_pet'],
      },
      then: {
        required: ['pet_name'],
      },
      else: {
        properties: {
          pet_name: false,
        },
      },
    },
  ],
};

export const schemaDemo2 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    a_fieldset: {
      title: 'Fieldset title',
      description: 'Fieldset description',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        id_number: {
          title: 'ID number',
          description: 'The number of your national identification (max 10 digits)',
          maxLength: 10,
          'x-jsf-presentation': {
            inputType: 'text',
            maskSecret: 2,
          },
          type: 'string',
        },
        tabs: {
          title: 'Tabs',
          description: 'How many open tabs do you have?',
          'x-jsf-presentation': {
            inputType: 'number',
          },
          minimum: 1,
          maximum: 10,
          type: 'number',
        },
      },
      required: ['id_number'],
      type: 'object',
    },
    language: {
      type: 'string',
      'x-jsf-presentation': {
        inputType: 'text',
      },
    },
  },
  allOf: [
    {
      if: {
        properties: {
          language: {
            const: 'pt',
          },
        },
        required: ['language'],
      },
      then: {
        properties: {
          a_fieldset: {
            properties: {
              tabs: {
                minimum: 5,
              },
            },
          },
        },
      },
    },
  ],
  required: ['a_fieldset'],
};

it('overview', () => {
  const { fields, handleValidation } = createHeadlessForm(schemaDemo1);

  console.log('___', fields[1].isVisible);

  const { formErrors } = handleValidation({ has_pet: 'yes' });

  console.log('___', fields[1].isVisible);

  console.log(formErrors);
});
