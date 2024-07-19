import { modify } from '../modify';

const schemaPet = {
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
    pet_age: {
      title: "Pet's age in months",
      maximum: 24,
      'x-jsf-presentation': {
        inputType: 'number',
      },
      'x-jsf-errorMessage': {
        maximum: 'Your pet cannot be older than 24 months.',
      },
      type: 'integer',
    },
    pet_fat: {
      title: 'Pet fat percentage',
      'x-jsf-presentation': {
        inputType: 'number',
        percentage: true,
      },
      type: 'integer',
    },
    pet_address: {
      properties: {
        street: {
          title: 'Street',
        },
      },
    },
  },
  required: ['has_pet'],
  'x-jsf-order': ['has_pet', 'pet_name'],
  allOf: [
    {
      id: 'pet_conditional_id',
      if: {
        properties: {
          has_pet: {
            const: 'yes',
          },
        },
        required: ['has_pet'],
      },
      then: {
        required: ['pet_name', 'pet_age', 'pet_fat'],
      },
      else: {
        properties: {
          pet_name: false,
          pet_age: false,
          pet_fat: false,
        },
      },
    },
  ],
};

const schemaAddress = {
  properties: {
    address: {
      properties: {
        street: {
          title: 'Street',
        },
        number: {
          title: 'Number',
        },
        city: {
          title: 'City',
        },
      },
    },
  },
};

describe('modify() - basic mutations', () => {
  it('replace base field', () => {
    const result = modify(schemaPet, {
      fields: {
        pet_name: {
          title: 'Your pet name',
        },
        has_pet: (fieldAttrs) => {
          const options = fieldAttrs.oneOf?.map(({ title }) => title).join(' or ') || '';
          return {
            title: 'Pet owner',
            description: `Do you own a pet? ${options}?`, // "Do you own a pet? Yes or No?"
          };
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        pet_name: {
          title: 'Your pet name',
        },
        has_pet: {
          title: 'Pet owner',
          description: 'Do you own a pet? Yes or No?',
        },
      },
    });
  });

  it('replace nested field', () => {
    const result = modify(schemaAddress, {
      fields: {
        'address.street': {
          title: 'Street name',
        },
        'address.city': () => ({
          title: 'City name',
        }),
        address: () => {
          return {
            properties: {
              number: { title: 'Door number' },
            },
          };
        },
        // TODO: write test to nested field
      },
    });

    expect(result).toMatchObject({
      properties: {
        address: {
          properties: {
            street: {
              title: 'Street name',
            },
            number: {
              title: 'Door number',
            },
            city: {
              title: 'City name',
            },
          },
        },
      },
    });
  });

  it('replace all fields', () => {
    const result = modify(schemaPet, {
      allFields: (fieldName, fieldAttrs) => {
        const { inputType, percentage } = fieldAttrs?.['x-jsf-presentation'] || {};

        if (inputType === 'number' && percentage === true) {
          return {
            styleDecimals: 2,
          };
        }

        return {
          dataFoo: 'abc',
        };
      },
    });

    expect(result).toMatchObject({
      properties: {
        has_pet: {
          dataFoo: 'abc',
        },
        pet_name: {
          dataFoo: 'abc',
        },
        pet_age: {
          dataFoo: 'abc',
        },
        pet_fat: {
          styleDecimals: 2,
        },
        pet_address: {
          properties: {
            street: {
              dataFoo: 'abc',
            },
          },
        },
      },
    });
  });

  it('replace field attrs that are arrays (partial)', () => {
    const result = modify(schemaPet, {
      fields: {
        has_pet: (fieldAttrs) => {
          const labelsMap = {
            yes: 'Yes, I have',
          };

          return {
            oneOf: fieldAttrs.oneOf.map((option) => {
              const customTitle = labelsMap[option.const];
              if (!customTitle) {
                // TODO - test this
                // console.error('The option is not handled.');
                return option;
              }
              return {
                ...option,
                title: customTitle,
              };
            }),
          };
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        has_pet: {
          oneOf: [
            {
              title: 'Yes, I have',
              const: 'yes',
            },
            {
              title: 'No',
              const: 'no',
            },
          ],
        },
      },
    });
  });

  it('replace field attrs that are arrays (full)', () => {
    const result = modify(schemaPet, {
      fields: {
        has_pet: {
          oneOf: [{ const: 'yaaas', title: 'YAAS!' }],
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        has_pet: {
          oneOf: [
            {
              const: 'yaaas',
              title: 'YAAS!',
            },
          ],
        },
      },
    });
  });

  it('error message', () => {
    const result = modify(schemaPet, {
      fields: {
        pet_age: (fieldAttrs) => {
          return {
            errorMessage: {
              minimum: `We only accept pets up to ${fieldAttrs.maximum} months old.`,
              required: 'We need to know your pet name.',
            },
          };
        },
        'pet_address.street': {
          errorMessage: {
            required: 'Your pet cannot live in the street.',
          },
        },
      },
      // ...
    });

    expect(result).toMatchObject({
      properties: {
        pet_age: {
          'x-jsf-errorMessage': {
            minimum: `We only accept pets up to 24 months old.`,
            required: 'We need to know your pet name.',
          },
        },
        pet_address: {
          properties: {
            street: {
              'x-jsf-errorMessage': {
                required: 'Your pet cannot live in the street.',
              },
            },
          },
        },
      },
    });
  });
});
