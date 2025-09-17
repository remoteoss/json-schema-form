import type { JsfSchema } from '../src/types'
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { modifySchema } from '../src/modify-schema'

describe('modifySchema', () => {
  function fail() {
    throw new Error('It should not reach this point of the code')
  }

  const schemaPet: JsfSchema = {
    'type': 'object',
    'additionalProperties': false,
    'properties': {
      has_pet: {
        'title': 'Has Pet',
        'description': 'Do you have a pet?',
        'oneOf': [
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
        'type': 'string',
      },
      pet_name: {
        'title': 'Pet\'s name',
        'description': 'What\'s your pet\'s name?',
        'x-jsf-presentation': {
          inputType: 'text',
        },
        'type': 'string',
      },
      pet_age: {
        'title': 'Pet\'s age in months',
        'maximum': 24,
        'x-jsf-presentation': {
          inputType: 'number',
        },
        'x-jsf-errorMessage': {
          maximum: 'Your pet cannot be older than 24 months.',
        },
        'type': 'integer',
      },
      pet_fat: {
        'title': 'Pet fat percentage',
        'x-jsf-presentation': {
          inputType: 'number',
          percentage: true,
        },
        'type': 'integer',
      },
      pet_address: {
        properties: {
          street: {
            'title': 'Street',
            'x-jsf-presentation': {
              inputType: 'text',
            },
          },
        },
      },
    },
    'required': ['has_pet'],
    'x-jsf-order': ['has_pet', 'pet_name', 'pet_age', 'pet_fat', 'pet_address'],
    'allOf': [
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
  }

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
          apartment: {
            title: 'House',
            properties: {
              floor: {
                title: 'Floor',
              },
              number: {
                title: 'Number',
              },
            },
          },
        },
      },
    },
  }

  beforeEach(() => {
  })

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { })
  })

  afterAll(() => {
    (console.warn as jest.Mock).mockRestore()
  })

  describe('Common behavior', () => {
    it('should not mutate the original schema', () => {
      const baseSchema: JsfSchema = {
        'properties': {
          name: {
            type: 'string',
            title: 'Name',
          },
          age: {
            type: 'number',
            title: 'Age',
          },
          address: {
            type: 'object',
            properties: {
              street: {
                type: 'string',
                title: 'Street',
              },
              city: {
                type: 'string',
                title: 'City',
              },
            },
          },
        },
        'required': ['name', 'age'],
        'x-jsf-order': ['name', 'age', 'address'],
      }
      const originalSchema = JSON.parse(JSON.stringify(baseSchema))

      modifySchema(baseSchema, {
        fields: {
          name: {
            title: 'Modified',
          },
        },
        muteLogging: true,
      })

      expect(baseSchema).toEqual(originalSchema)
    })
    describe('modify() - warnings', () => {
      it('logs a warning by default', () => {
        const result = modifySchema(schemaPet as JsfSchema, {})

        expect(console.warn).toBeCalledWith(
          'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteLogging: true` to the config.',
        );

        (console.warn as jest.Mock).mockClear()
        expect(result.warnings).toEqual([])
      })

      it('given muteLogging, it does not log the warning', () => {
        const result = modifySchema(schemaPet as JsfSchema, {
          muteLogging: true,
        })

        expect(console.warn).not.toBeCalled()
        expect(result.warnings).toEqual([])
      })
    })
  })

  describe('modify() - basic mutations', () => {
    it('replace base field', () => {
      const result = modifySchema(schemaPet, {
        fields: {
          pet_name: {
            title: 'Your pet name',
          },
          has_pet: (fieldAttrs) => {
            if (typeof fieldAttrs.oneOf !== 'object') {
              fail()
            }
            const options = (fieldAttrs.oneOf as { title?: string }[]).map(({ title }) => title).join(' or ') || ''
            return {
              title: 'Pet owner',
              description: `Do you own a pet? ${options}?`, // "Do you own a pet? Yes or No?",
              presentation: {
                inputType: 'select',
              },
            }
          },
        },
      })

      expect(result.schema).toMatchObject({
        properties: {
          pet_name: {
            title: 'Your pet name',
          },
          has_pet: {
            'title': 'Pet owner',
            'description': 'Do you own a pet? Yes or No?',
            'x-jsf-presentation': { // new presentation should be renamed to 'x-jsf-presentation'
              inputType: 'select',
            },
          },
        },
      })
    })

    it('replace nested field', () => {
      const customComponent = () => {
        return null
      }
      const result = modifySchema(schemaAddress, {
        fields: {
          // You can use dot notation
          'address.street': {
            title: 'Street name',
          },
          'address.city': () => ({
            title: 'City name',
          }),
          // should be able to handle deep nested fields
          'address.apartment.number': {
            'title': 'Apartment Number',
            'x-jsf-presentation': {
              Component: customComponent,
            },
          },
          // Or pass the native object
          'address': (fieldAttrs) => {
            return {
              properties: {
                number: (nestedAttrs: JsfSchema) => {
                  return {
                    'x-test-siblings': Object.keys(fieldAttrs.properties!),
                    'title': `Door ${(nestedAttrs as { title?: string }).title}`,
                  }
                },
              },
            }
          },
        },
      })

      expect(result.schema).toMatchObject({
        properties: {
          address: {
            properties: {
              street: {
                title: 'Street name',
              },
              number: {
                'title': 'Door Number',
                'x-test-siblings': ['street', 'number', 'city', 'apartment'],
              },
              city: {
                title: 'City name',
              },
              apartment: {
                properties: {
                  floor: {
                    title: 'Floor',
                  },
                  number: {
                    'title': 'Apartment Number',
                    'x-jsf-presentation': {
                      Component: customComponent,
                    },
                  },
                },
              },
            },
          },
        },
      })
    })

    it('replace fields that dont exist gets ignored', () => {
      // IMPORTANT NOTE on this behavior:
      // Context: At Remote we have a lot of global customization that run equally across multiple different JSON Schemas.
      // With this, we avoid applying customizations to non-existing fields. (aka create fields)
      // That's why we have the "create" config, specific to create new fields.
      const result = modifySchema(schemaPet, {
        fields: {
          'unknown_field': {
            title: 'This field does not exist in the original schema',
          },
          'nested.field': {
            title: 'Nop',
          },
          'pet_name': {
            title: 'New pet title',
          },
        },
      })

      expect(result.schema.properties?.unknown_field).toBeUndefined()
      expect(result.schema.properties?.nested).toBeUndefined()
      expect(result.schema.properties?.pet_name).toEqual({
        ...((schemaPet as any).properties?.pet_name),
        title: 'New pet title',
      })

      expect(result.warnings).toEqual([
        {
          type: 'FIELD_TO_CHANGE_NOT_FOUND',
          message: 'Changing field "unknown_field" was ignored because it does not exist.',
        },
        {
          type: 'FIELD_TO_CHANGE_NOT_FOUND',
          message: 'Changing field "nested.field" was ignored because it does not exist.',
        },
      ])
    })

    it('replace all fields', () => {
      const result = modifySchema(schemaPet, {
        allFields: (fieldName, fieldAttrs) => {
          let inputType, percentage
          const presentation = fieldAttrs['x-jsf-presentation']

          if (presentation) {
            inputType = presentation.inputType
            percentage = presentation.percentage
          }

          if (inputType === 'number' && percentage === true) {
            return {
              styleDecimals: 2,
            }
          }

          if (fieldName === 'has_pet') {
            return {
              title: 'abc',
              presentation: {
                inputType: 'text',
              },
              errorMessage: {
                required: 'Custom error message for required field',
              },
            }
          }

          return {
            title: 'abc',
          }
        },
      })

      expect(result.schema).toMatchObject({
        properties: {
          has_pet: {
            'x-jsf-presentation': {
              // Assert that presentation and errorMessage shorthands are replaced
              inputType: 'text',
            },
            'x-jsf-errorMessage': {
              required: 'Custom error message for required field',
            },
            'title': 'abc',
          },
          pet_name: {
            title: 'abc',
          },
          pet_age: {
            title: 'abc',
          },
          pet_fat: {
            styleDecimals: 2,
          },
          pet_address: {
            // assert recursivity
            properties: {
              street: {
                title: 'abc',
              },
            },
          },
        },
      })
    })

    it('replace field attrs that are arrays (partial)', () => {
      const result = modifySchema(schemaPet, {
        fields: {
          has_pet: (fieldAttrs) => {
            const labelsMap = {
              yes: 'Yes, I have',
            }

            return {
              oneOf: fieldAttrs.oneOf?.map((option: JsfSchema) => {
                if (typeof option === 'object' && 'const' in option) {
                  const customTitle = (labelsMap as any)[option.const]
                  if (!customTitle) {
                    // TODO - test this
                    // console.error('The option is not handled.');
                    return option
                  }
                  return {
                    ...option,
                    title: customTitle,
                  }
                }
                return option
              }),
            }
          },
        },
      })

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
      })
    })

    it('replace field attrs that are arrays (full)', () => {
      const result = modifySchema(schemaPet, {
        fields: {
          has_pet: {
            oneOf: [{ const: 'yaaas', title: 'YAAS!' }],
          },
        },
      })

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
      })
    })
  })

  describe('supporting custom attributes', () => {
    const invoiceSchema: JsfSchema = {
      properties: {
        title: {
          'title': 'Invoice title',
          'x-jsf-presentation': {
            inputType: 'text',
          },
          'x-jsf-errorMessage': {
            required: 'Cannot be empty.',
          },
          'type': 'string',
        },
        total: {
          'title': 'Invoice amount',
          'x-jsf-presentation': {
            inputType: 'money',
          },
          'type': 'number',
        },
        taxes: {
          title: 'Taxes details',
          properties: {
            country: {
              'title': 'Country',
              'x-jsf-presentation': {
                inputType: 'country',
              },
              'type': 'string',
            },
            percentage: {
              'title': 'Percentage',
              'x-jsf-presentation': {
                inputType: 'number',
              },
              'type': 'integer',
            },
          },
        },
      },
      required: ['title'],
    }

    it('basic support for x-jsf-presentation and x-jsf-errorMessage in config.fields', () => {
      const result = modifySchema(invoiceSchema, {
        fields: {
          'title': {
            'x-jsf-errorMessage': {
              maxLength: 'Must be shorter.',
            },
            'x-jsf-presentation': {
              dataFoo: 123,
            },
          },
          'taxes.country': {
            'x-jsf-errorMessage': {
              required: 'The country is required.',
            },
            'x-jsf-presentation': {
              flags: true,
            },
          },
        },
      })

      // Assert all the other propreties are kept
      expect(result.schema).toMatchObject(invoiceSchema)

      expect(result.schema).toMatchObject({
        properties: {
          title: {
            'x-jsf-errorMessage': {
              maxLength: 'Must be shorter.',
            },
            'x-jsf-presentation': {
              dataFoo: 123,
            },
          },
          taxes: {
            properties: {
              country: {
                'x-jsf-errorMessage': {
                  required: 'The country is required.',
                },
                'x-jsf-presentation': {
                  flags: true,
                },
              },
            },
          },
        },
      })
    })

    it('support for presentation and errorMessage shorthands', () => {
      const result = modifySchema(invoiceSchema, {
        fields: {
          'title': {
            errorMessage: {
              maxLength: 'Must be shorter.',
            },
            presentation: {
              dataFoo: 123,
            },
          },
          'taxes.country': {
            errorMessage: {
              required: 'The country is required.',
            },
            presentation: {
              flags: true,
            },
          },
        },
      })

      // Assert all the other properties are kept
      expect(result.schema).toMatchObject(invoiceSchema)

      // Assert that the shorthands are converted to full x-jsf-* attributes
      expect(result.schema).toMatchObject({
        properties: {
          title: {
            'x-jsf-errorMessage': {
              maxLength: 'Must be shorter.',
            },
            'x-jsf-presentation': {
              dataFoo: 123,
            },
          },
          taxes: {
            properties: {
              country: {
                'x-jsf-errorMessage': {
                  required: 'The country is required.',
                },
                'x-jsf-presentation': {
                  flags: true,
                },
              },
            },
          },
        },
      })
    })
  })

  const schemaTickets = {
    'properties': {
      age: {
        title: 'Age',
        type: 'integer',
      },
      quantity: {
        title: 'Quantity',
        type: 'integer',
      },
      has_premium: {
        title: 'Has premium',
        type: 'string',
      },
      premium_id: {
        title: 'Premium ID',
        type: 'boolean',
      },
      reason: {
        title: 'Why not premium?',
        type: 'string',
      },
    },
    'x-jsf-order': ['age', 'quantity', 'has_premium', 'premium_id', 'reason'],
    'allOf': [
      {
        // Empty conditional to sanity test empty cases
        if: {},
        then: {},
        else: {},
      },
      // Create two conditionals to test both get matched
      {
        if: {
          has_premium: {
            const: 'yes',
          },
          required: ['has_premium'],
        },
        then: {
          required: ['premium_id'],
        },
        else: {},
      },
      {
        if: {
          properties: {
            has_premium: {
              const: 'no',
            },
          },
          required: ['has_premium'],
        },
        then: {
          properties: {
            reason: false,
          },
        },
        else: {},
      },
    ],
  }

  describe('modify() - reorder fields', () => {
    it('reorder fields - basic usage', () => {
      const baseExample = {
        'properties': {
          /* does not matter */
        },
        'x-jsf-order': ['field_a', 'field_b', 'field_c', 'field_d'],
      }
      const result = modifySchema(baseExample, {
        orderRoot: ['field_c', 'field_b'],
      })

      // 💡 Note how the missing field (field_d) was added to the end as safety measure.
      expect(result.schema).toMatchObject({
        'x-jsf-order': ['field_c', 'field_b', 'field_a', 'field_d'],
      })

      expect(result.warnings).toMatchObject([
        {
          type: 'ORDER_MISSING_FIELDS',
          message:
            'Some fields got forgotten in the new order. They were automatically appended: field_a, field_d',
        },
      ])
    })

    it('reorder fields - basic usage fallback', () => {
      const baseExample = {
        properties: {
          /* does not matter */
        },
      }
      const result = modifySchema(baseExample, {
        orderRoot: ['field_c', 'field_b'],
      })

      // Does not explode if it doesn't have an original order.
      expect(result.schema).toMatchObject({
        'x-jsf-order': ['field_c', 'field_b'],
      })

      expect(result.warnings).toEqual([])
    })

    it('reorder fields -  as callback based on original order', () => {
      const baseExample = {
        'properties': {
          /* does not matter */
        },
        'x-jsf-order': ['field_a', 'field_b', 'field_c', 'field_d'],
      }
      const result = modifySchema(baseExample, {
        orderRoot: original => original.reverse(),
      })

      expect(result.schema).toMatchObject({
        'x-jsf-order': ['field_d', 'field_c', 'field_b', 'field_a'],
      })
    })

    it('reorder fields in fieldsets (through config.fields)', () => {
      // NOTE: A better API is needed but we decided to not implement it yet
      // as we didn't agreed on the best DX. Check PR #78 for proposed APIs.
      // Until then this is the workaround.
      // Note the warning "ORDER_MISSING_FIELDS" won't be added.

      const baseExample = {
        'properties': {
          address: {
            'properties': {
              /* does not matter */
            },
            'x-jsf-order': ['first_line', 'zipcode', 'city'],
          },
          age: {
            /* ... */
          },
        },
        'x-jsf-order': ['address', 'age'],
      }

      const result = modifySchema(baseExample, {
        fields: {
          address: (attrs) => {
            const [_firstLine, ...restOrder] = attrs['x-jsf-order'] || []
            return { 'x-jsf-order': restOrder.reverse() } // ['city', 'zipcode']
          },
        },
      })

      expect(result.schema).toMatchObject({
        properties: {
          address: {
            // Note how first_line was NOT appended
            'x-jsf-order': ['city', 'zipcode'],
          },
        },
      })
    })
  })

  describe('modify() - create fields', () => {
    it('create base field', () => {
      const result = modifySchema(schemaAddress, {
        create: {
          new_field: {
            title: 'New field',
            type: 'string',
          },
          address: {
            // @ts-expect-error someAttr is not a known property of the spec, so it should be ignored
            someAttr: 'foo',
          },
        },
      })

      expect(result.schema).toMatchObject({
        properties: {
          new_field: {
            title: 'New field',
            type: 'string',
          },
          address: schemaAddress.properties.address,
        },
      })

      // this is ignored because the field already exists
      // @ts-expect-error someAttr is not a known property of the spec
      expect(result.schema.properties?.address?.someAttr).toBe(undefined)

      expect(result.warnings).toEqual([
        {
          type: 'FIELD_TO_CREATE_EXISTS',
          message: 'Creating field "address" was ignored because it already exists.',
        },
      ])
    })

    it('create nested field', () => {
      const result = modifySchema(schemaAddress, {
        create: {
          // Pointer as string
          'address.state': {
            title: 'State',
          },
          // Pointer as object
          'address': {
            // @ts-expect-error someAttr is not a known property of the spec, so it should be ignored
            someAttr: 'foo',
            properties: {
              district: {
                title: 'District',
              },
            },
          },
          // Ignore field street because the field already exists [1]
          'address.street': {
            title: 'Foo',
          },
        },
      })

      expect(result.schema.properties?.address.properties).toMatchObject({
        ...schemaAddress.properties.address.properties,
        state: {
          title: 'State',
        },
        district: {
          title: 'District',
        },
      })

      // Ignore address.someAttr because the address itself already exists.
      // @ts-expect-error someAttr is not a known property of the spec
      expect(result.schema.properties?.address?.someAttr).toBeUndefined()

      // Ignore field street because it already exists [1]
      if (typeof result.schema.properties?.address?.properties?.street === 'object') {
        expect(result.schema.properties?.address?.properties?.street?.title).toBe('Street')
      }

      expect(result.warnings).toEqual([
        {
          type: 'FIELD_TO_CREATE_EXISTS',
          message: 'Creating field "address" was ignored because it already exists.',
        },
        {
          type: 'FIELD_TO_CREATE_EXISTS',
          message: 'Creating field "address.street" was ignored because it already exists.',
        },
      ])
    })
  })

  describe('modify() - pick fields', () => {
    it('basic usage', () => {
      const { schema, warnings } = modifySchema(schemaTickets, {
        pick: ['quantity'],
      })

      // Note how the other fields got removed from
      // from the root properties, the "order" and "allOf".
      expect(schema.properties).toEqual({
        quantity: {
          title: 'Quantity',
          type: 'integer',
        },
      })
      expect(schema.properties?.age).toBeUndefined()
      expect(schema.properties?.has_premium).toBeUndefined()
      expect(schema.properties?.premium_id).toBeUndefined()

      expect(schema['x-jsf-order']).toEqual(['quantity'])
      expect(schema.allOf).toEqual([]) // conditional got removed.

      expect(warnings).toHaveLength(0)
    })

    it('basic usage without conditionals', () => {
      const schemaMinimal = {
        'properties': {
          age: {
            title: 'Age',
            type: 'integer',
          },
          quantity: {
            title: 'Quantity',
            type: 'integer',
          },
        },
        'x-jsf-order': ['age', 'quantity'],
      }
      const { schema, warnings } = modifySchema(schemaMinimal, {
        pick: ['quantity'],
      })

      expect(schema.properties?.quantity).toBeDefined()
      expect(schema.properties?.age).toBeUndefined()
      // `allOf` conditionals were not defined, and continue to be so.
      // This test guards against a regression where lack of `allOf` caused a TypeError.
      expect(schema.allOf).toBeUndefined()
      expect(warnings).toHaveLength(0)
    })

    it('related conditionals are kept - (else)', () => {
      const { schema, warnings } = modifySchema(schemaTickets, {
        pick: ['has_premium'],
      })

      expect(schema).toMatchObject({
        properties: {
          has_premium: {
            title: 'Has premium',
          },
          premium_id: {
            title: 'Premium ID',
          },
          reason: {
            title: 'Why not premium?',
          },
        },
        allOf: [schemaTickets.allOf[1], schemaTickets.allOf[2]],
      })

      expect(schema.properties?.quantity).toBeUndefined()
      expect(schema.properties?.age).toBeUndefined()
      expect(warnings).toEqual([
        {
          type: 'PICK_MISSED_FIELD',
          message:
            'The picked fields are in conditionals that refeer other fields. They added automatically: "premium_id", "reason". Check "meta" for more details.',
          meta: { premium_id: { path: 'allOf[1].then' }, reason: { path: 'allOf[2].then' } },
        },
      ])
    })

    it('related conditionals are kept - (if)', () => {
      const { schema, warnings } = modifySchema(schemaTickets, {
        pick: ['premium_id'],
      })

      expect(schema).toMatchObject({
        properties: {
          has_premium: {
            title: 'Has premium',
          },
          premium_id: {
            title: 'Premium ID',
          },
        },
        allOf: [schemaTickets.allOf[0]],
      })

      expect(schema.properties?.quantity).toBeUndefined()
      expect(schema.properties?.age).toBeUndefined()
      expect(warnings).toEqual([
        {
          type: 'PICK_MISSED_FIELD',
          message:
            'The picked fields are in conditionals that refeer other fields. They added automatically: "has_premium". Check "meta" for more details.',
          meta: { has_premium: { path: 'allOf[1].if' } },
        },
      ])
    })

    it('reorder only handles the picked fields', () => {
      const { schema, warnings } = modifySchema(schemaTickets, {
        pick: ['age', 'quantity'],
        orderRoot: original => original.reverse(),
      })

      // The order only includes those 2 fields
      expect(schema['x-jsf-order']).toEqual(['quantity', 'age'])
      // There are no warnings about forgotten fields.
      expect(warnings).toHaveLength(0)

      // Sanity check the result
      expect(schema.properties?.quantity).toBeDefined()
      expect(schema.properties?.age).toBeDefined()
      expect(schema.properties?.has_premium).toBeUndefined()
      expect(schema.properties?.premium_id).toBeUndefined()
      expect(schema.allOf).toEqual([])
    })

    // For later on when needed.
    it.todo('ignore conditionals with unpicked fields')

    it.todo('pick nested fields (fieldsets)')
    /* Use cases:
        - conditionals inside fieldstes. eg properties.family.allOf[0].if...
        - conditional in the root pointing to nested fields: eg if properties.family.properties.simblings is 0 then hide properties.playTogether ...
        - variations of each one of these similar to the existing tests.
        */
  })
})
