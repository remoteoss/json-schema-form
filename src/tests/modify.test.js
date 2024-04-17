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
      'x-jsf-presentation': {
        inputType: 'number',
        maximum: 24,
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

describe('modify() - attributes', () => {
  it('replace base field', () => {
    const result = modify(schemaPet, {
      fields: {
        has_pet: {
          title: 'Pet owner',
          description: (fieldAttrs) => {
            // You can access any raw field attribute to do whatever verification you need,
            // but remember to be cautious, as they might change.
            const options = fieldAttrs.oneOf?.map(({ title }) => title).join('or ') || '';
            return `Do you own a pet? ${options}?`;
          },
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        has_pet: {
          title: 'Pet owner',
          description: 'Do you own a pet? Yes or No?',
        },
      },
    });
  });

  it('replace nested field', () => {
    const baseAddress = {}; // TODO - imagine it is a fieldset, { address: { street, number, city } }
    const result = modify(baseAddress, {
      fields: {
        'address.street': {
          title: 'Street name',
        },
        // Q:❓ or manual nesting — both would work.
        address: {
          properties: {
            number: { title: 'Door number' },
          },
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        address: {
          properties: {
            street: {
              title: 'Street name',
              number: 'Door number',
            },
          },
        },
      },
    });
  });

  it('replace all fields', () => {
    const result = modify(schemaPet, {
      // This is a callback recursive through all fields
      allFields: (fieldName, fieldAttrs) => {
        const { inputType, percentage } = fieldAttrs.presentation;

        // This is based on a real example I remember from G.codebase.
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
      },
    });
  });

  it('error message', () => {
    const result = modify(schemaPet, {
      fields: {
        pet_name: (fieldAttrs) => {
          //console.log(fieldsAttrs.maximum) // 24
          return {
            errorMessage: {
              minimum: `We only accept pets up to ${fieldAttrs.maximum} months old.`,
            },
          };
        },
      },
      // ...
    });

    expect(result).toMatchObject({
      properties: {
        pet_name: {
          'x-jsf-errorMessage': {
            // maximum: (before) 'Your pet cannot be older than 24 months.',
            minimum: `We only accept pets up to 24 months old.`,
          },
        },
      },
    });
  });

  it('reorder fields', () => {
    const baseExample = {
      properties: {
        /*...*/
      },
      'x-jsf-order': ['field_a', 'field_b', 'field_c', 'field_d'],
    };
    const result = modify(baseExample, {
      // eslint-disable-next-line no-unused-vars
      order: (originalOrder) => {
        // console.log(order) // ['field_a', 'field_b', 'field_c', 'field_d']
        return {
          order: ['field_c', 'field_a', 'field_b'],
          rest: 'start', // 'start' | 'end'
        };
      },
    });

    // 💡 Note how the missing field (field_d) got automatically added as safety measure.
    expect(result).toMatchObject({
      'x-jsf-order': ['field_d', 'field_c', 'field_a', 'field_b'],
    });
  });

  // Q:❓ Would this be useful for first version or too advanced?
  it('customize conditional effects', () => {
    const result = modify(schemaPet, {
      conditionals: {
        // The idea is to target a conditional by its id. (new!)
        pet_conditional_id: {
          else: {
            has_pet: {
              description: 'You should think about finding one.',
            },
          },
        },
      },
    });

    expect(result).toMatchObject({
      allOf: [
        {
          id: 'pet_conditional_id',
          if: {
            /*...*/
          },
          then: {
            /*...*/
          },
          else: {
            properties: {
              has_pet: {
                description: 'You should think about finding one.',
              },
            },
          },
        },
      ],
    });
  });
});

const schemaTickets = {
  properties: {
    age: {
      /* ... */
    },
    quatity: {
      /* ... */
    },
    has_premium: {
      /* ... */
    },
    premium_id: {
      /* ... */
    },
  },
  'x-jsf-order': ['age', 'quantity', 'has_premium', 'premium_id'],
  allOf: [
    {
      if: {
        properties: {
          has_premium: {
            const: 'yes',
          },
        },
        required: ['has_premium'],
      },
      then: {
        required: ['premium_id'],
      },
      else: {
        properties: {
          premium_id: false,
        },
      },
    },
  ],
};

describe('modify() - structures', () => {
  it('pick fields - basic', () => {
    const result = modify(schemaTickets, {
      pick: {
        fields: ['quantity'],
      },
    });

    // Note how the other fields got discarded,
    // as well the order and allOf got reduced.
    expect(result).toMatchObject({
      properties: {
        quatity: {
          /*...*/
        },
      },
      'x-jsf-order': ['quantity'],
      // ...
    });
  });
  it('pick fields - with conditionals', () => {
    const result = modify(schemaTickets, {
      pick: {
        fields: ['has_premium'],
        onWarn: (ex) => {
          // A field depends on this one, which was automatically added.
          // "premium_id" added as it depends on "has_premium".
          console.warn('Pick was adjusted', ex.message);
        },
      },
    });

    expect(result).toMatchObject({
      properties: {
        has_premium: {
          /*...*/
        },
        premium_id: {
          /*...*/
        },
      },
      allOf: [
        // the same as schemaTickets
      ],
    });
  });

  // Q:❓ Would this be really needed?
  it('omit fields - basic usage', () => {
    const result = modify(schemaTickets, {
      omit: 'has_premium',
    });

    // Note how both "has_premium" and the respective conditional got removed.
    expect(result).toMatchObject({
      properties: {
        age: {
          /* ... */
        },
        quatity: {
          /* ... */
        },
      },
      'x-jsf-order': ['age', 'quantity'],
      allOf: [],
    });
  });

  it('split fields - basic', () => {
    // eslint-disable-next-line no-undef
    const result = modify(someSchema, {
      split: {
        // 💡 Note how "*" is mandatory to ensure
        // remaining fields has a fallback place.
        // otherwise the split will fail.
        parts: [
          ['field_a', 'field_b'],
          ['field_c', '*'],
        ],
        onError: (ex) => {
          console.error('Split failed', ex.message);
        },
      },
    });

    expect(result).toMatchObject({
      parts: [
        // Part 1
        {
          properties: {
            field_a: {
              /* ... */
            },
            field_b: {
              /* ... */
            },
          },
        },
        // Part 2
        {
          properties: {
            field_c: {
              /* ... */
            },
            field_d: {
              // come from the wild "*" selector.
              /* ... */
            },
          },
        },
      ],
    });
  });

  // CONTINUE HEREEE!
  //  it.todo('split fields - handling condional fields - Approach A', () => {
  //    const result = modify(someSchema, {
  //      split: {
  //        // 💡 Note how "*" is mandatory to ensure
  //        // remaining fields has a fallback place.
  //        // otherwise the split will fail.
  //        parts: [
  //          ['field_a', 'field_b'],
  //          ['field_c', '*'],
  //        ],
  //        onError: (ex) => {
  //          log('Split failed', ex.message);
  //        },
  //      },
  //    });

  //    expect(result).toMatchObject({
  //      parts: [
  //        // Part 1
  //        {
  //          properties: {
  //            field_a: {
  //              /* ... */
  //            },
  //            field_b: {
  //              /* ... */
  //            },
  //          },
  //        },
  //        // Part 2
  //        {
  //          properties: {
  //            field_c: {
  //              /* ... */
  //            },
  //            field_d: {
  //              // come from the wild "*" selector.
  //              /* ... */
  //            },
  //          },
  //        },
  //      ],
  //    });
  //  });

  //  it.todo('split fields - handling condional fields - Approach B', () => {
  //    const result = modify(someSchema, {
  //      split: {
  //        // 💡 Note how "*" is mandatory to ensure
  //        // remaining fields has a fallback place.
  //        // otherwise the split will fail.
  //        parts: [
  //          ['field_a', 'field_b'],
  //          ['field_c', '*'],
  //        ],
  //        onError: (ex) => {
  //          log('Split failed', ex.message);
  //        },
  //      },
  //    });

  //    expect(result).toMatchObject({
  //      parts: [
  //        // Part 1
  //        {
  //          properties: {
  //            field_a: {
  //              /* ... */
  //            },
  //            field_b: {
  //              /* ... */
  //            },
  //          },
  //        },
  //        // Part 2
  //        {
  //          properties: {
  //            field_c: {
  //              /* ... */
  //            },
  //            field_d: {
  //              // come from the wild "*" selector.
  //              /* ... */
  //            },
  //          },
  //        },
  //      ],
  //    });
  //  });
});
