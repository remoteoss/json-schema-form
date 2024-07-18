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
  'x-jsf-order': ['has_pet', 'pet_name', 'pet_age', 'pet_fat', 'pet_address'],
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

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

describe('modify() - warnings', () => {
  it('logs a warning by default', () => {
    const result = modify(schemaPet, {});

    expect(console.warn).toBeCalledWith(
      'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteLogging: true` to the config.'
    );

    console.warn.mockClear();
    expect(result.warnings).toEqual([]);
  });

  it('given muteLogging, it does not log the warning', () => {
    const result = modify(schemaPet, {
      muteLogging: true,
    });

    expect(console.warn).not.toBeCalled();
    expect(result.warnings).toEqual([]);
  });
});

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

    expect(result.schema).toMatchObject({
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
        // You can use dot notation
        'address.street': {
          title: 'Street name',
        },
        'address.city': () => ({
          title: 'City name',
        }),
        // Or pass the native object
        address: (fieldAttrs) => {
          return {
            properties: {
              number: (nestedAttrs) => {
                return {
                  'x-test-siblings': Object.keys(fieldAttrs.properties),
                  title: `Door ${nestedAttrs.title}`,
                };
              },
            },
          };
        },
      },
    });

    expect(result.schema).toMatchObject({
      properties: {
        address: {
          properties: {
            street: {
              title: 'Street name',
            },
            number: {
              title: 'Door Number',
              'x-test-siblings': ['street', 'number', 'city'],
            },
            city: {
              title: 'City name',
            },
          },
        },
      },
    });
  });

  it('replace fields that dont exist gets ignored', () => {
    // IMPORTANT NOTE on this behavior:
    // Context: At Remote we have a lot of global customization that run equally across multiple different JSON Schemas.
    // With this, we avoid applying customizations to non-existing fields. (aka create fields)
    // That's why we have the "create" config, specific to create new fields.
    const result = modify(schemaPet, {
      fields: {
        unknown_field: {
          title: 'This field does not exist in the original schema',
        },
        'nested.field': {
          title: 'Nop',
        },
        pet_name: {
          title: 'New pet title',
        },
      },
    });

    expect(result.schema.properties.unknown_field).toBeUndefined();
    expect(result.schema.properties.nested).toBeUndefined();
    expect(result.schema.properties.pet_name).toEqual({
      ...schemaPet.properties.pet_name,
      title: 'New pet title',
    });

    expect(result.warnings).toEqual([
      {
        type: 'FIELD_TO_CHANGE_NOT_FOUND',
        message: 'Changing field "unknown_field" was ignored because it does not exist.',
      },
      {
        type: 'FIELD_TO_CHANGE_NOT_FOUND',
        message: 'Changing field "nested.field" was ignored because it does not exist.',
      },
    ]);
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

    expect(result.schema).toMatchObject({
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
          // assert recursivity
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

    expect(result.schema).toMatchObject({
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

    expect(result.schema).toMatchObject({
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

    expect(result.schema).toMatchObject({
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

describe('modify() - reoder fields', () => {
  it('reorder fields - basic usage', () => {
    const baseExample = {
      properties: {
        /* does not matter */
      },
      'x-jsf-order': ['field_a', 'field_b', 'field_c', 'field_d'],
    };
    const result = modify(baseExample, {
      orderRoot: ['field_c', 'field_b'],
    });

    // 💡 Note how the missing field (field_d) was added to the end as safety measure.
    expect(result.schema).toMatchObject({
      'x-jsf-order': ['field_c', 'field_b', 'field_a', 'field_d'],
    });

    expect(result.warnings).toMatchObject([
      {
        type: 'ORDER_MISSING_FIELDS',
        message:
          'Some fields got forgotten in the new order. They were automatically appended: field_a, field_d',
      },
    ]);
  });

  it('reorder fields - basic usage fallback', () => {
    const baseExample = {
      properties: {
        /* does not matter */
      },
    };
    const result = modify(baseExample, {
      orderRoot: ['field_c', 'field_b'],
    });

    // Does not explode if it doesn't have an original order.
    expect(result.schema).toMatchObject({
      'x-jsf-order': ['field_c', 'field_b'],
    });

    expect(result.warnings).toEqual([]);
  });

  it('reorder fields -  as callback based on original order', () => {
    const baseExample = {
      properties: {
        /* does not matter */
      },
      'x-jsf-order': ['field_a', 'field_b', 'field_c', 'field_d'],
    };
    const result = modify(baseExample, {
      orderRoot: (original) => original.reverse(),
    });

    expect(result.schema).toMatchObject({
      'x-jsf-order': ['field_d', 'field_c', 'field_b', 'field_a'],
    });
  });

  it('reorder fields in fieldsets (through config.fields)', () => {
    // NOTE: A better API is needed but we decided to not implement it yet
    // as we didn't agreed on the best DX. Check PR #78 for proposed APIs.
    // Until then this is the workaround.
    // Note the warning "ORDER_MISSING_FIELDS" won't be added.

    const baseExample = {
      properties: {
        address: {
          properties: {
            /* does not matter */
          },
          'x-jsf-order': ['first_line', 'zipcode', 'city'],
        },
        age: {
          /* ... */
        },
      },
      'x-jsf-order': ['address', 'age'],
    };

    const result = modify(baseExample, {
      fields: {
        address: (attrs) => {
          // eslint-disable-next-line no-unused-vars
          const [_firstLine, ...restOrder] = attrs['x-jsf-order'];
          return { 'x-jsf-order': restOrder.reverse() }; // ['city', 'zipcode']
        },
      },
    });

    expect(result.schema).toMatchObject({
      properties: {
        address: {
          // Note how first_line was NOT appended
          'x-jsf-order': ['city', 'zipcode'],
        },
      },
    });
  });
});

describe('modify() - set new fields', () => {
  it('create base field', () => {
    const result = modify(schemaAddress, {
      create: {
        new_field: {
          title: 'New field',
          type: 'string',
        },
        address: {
          something: 'foo',
        },
      },
    });

    expect(result.schema).toMatchObject({
      properties: {
        new_field: {
          title: 'New field',
          type: 'string',
        },
        address: schemaAddress.properties.address,
      },
    });

    // this is ignored because the field already exists
    expect(result.properties.address.something).toBe(undefined);
  });

  it('create nested field', () => {
    const result = modify(schemaAddress, {
      create: {
        // Pointer as string
        'address.state': {
          title: 'State',
        },
        // Pointer as object
        address: {
          properties: {
            district: {
              title: 'District',
            },
          },
        },
        // this is ignored because the field already exists [1]
        'address.street': {
          title: 'Foo',
        },
      },
    });

    expect(result.warnings).toEqual([]);
    expect(result.properties.address.properties).toMatchObject({
      ...schemaAddress.properties.address.properties,
      state: {
        title: 'State',
      },
      district: {
        title: 'District',
      },
    });

    // this is ignored because the field already exists [1]
    expect(result.properties.address.properties.street.title).toBe('Street');
  });

  // Enable this on PR !78
  it.skip('reorder new created fields', () => {
    const result = modify(schemaPet, {
      create: {
        new_field: {
          title: 'New field',
          type: 'string',
        },
      },
      order: {
        fields: (originalOrder) => {
          const newOrder = [...originalOrder];
          return newOrder.splice(1, 0, 'new_field');
        },
      },
    });

    expect(result).toMatchObject({
      'x-jsf-order': ['has_pet', 'new_field'],
    });
  });
});
