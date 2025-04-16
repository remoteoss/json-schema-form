import type { JsfSchema } from '../src/types'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { modifySchema } from '../src/modify-schema'

describe('modifySchema', () => {
  function fail() {
    throw new Error('It should not reach this point of the code')
  }

  let baseSchema: JsfSchema

  beforeEach(() => {
    baseSchema = {
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
  })

  describe('Common behavior', () => {
    it('should not mutate the original schema', () => {
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
  })

  describe('[fields] rewrite individual fields', () => {
    it('should modify existing fields via simple object', () => {
      const { schema, warnings } = modifySchema(baseSchema, {
        fields: {
          name: {
            title: 'Full Name',
            description: 'Enter your full name',
          },
        },
        muteLogging: true,
      })

      if (typeof schema.properties?.name === 'object') {
        expect(schema.properties?.name?.title).toBe('Full Name')
        expect(schema.properties?.name?.description).toBe('Enter your full name')
        expect(warnings).toHaveLength(0)
      }
      else {
        fail()
      }
    })

    it('should allow for modifying nested fields', () => {
      const { schema, warnings } = modifySchema(baseSchema, {
        fields: {
          'address.street': {
            title: 'Street Name',
          },
        },
        muteLogging: true,
      })

      if (typeof schema.properties?.address?.properties?.street === 'object') {
        expect(schema.properties?.address?.properties?.street?.title).toBe('Street Name')
        expect(warnings).toHaveLength(0)
      }
      else {
        fail()
      }
    })

    it('should modify existing fields via function', () => {
      const { schema } = modifySchema(baseSchema, {
        fields: {
          age: (field: any) => ({
            ...field,
            minimum: 18,
            maximum: 100,
          }),
        },
        muteLogging: true,
      })

      if (typeof schema.properties?.age === 'object') {
        expect(schema.properties?.age?.minimum).toBe(18)
        expect(schema.properties?.age?.maximum).toBe(100)
      }
      else {
        fail()
      }
    })

    it('should warn when modifying non-existent fields', () => {
      const { warnings } = modifySchema(baseSchema, {
        fields: {
          nonexistent: {
            title: 'Does not exist',
          },
        },
        muteLogging: true,
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('FIELD_TO_CHANGE_NOT_FOUND')
    })
  })

  describe('[allFields] modify all fields', () => {
    it('should modify all fields with function', () => {
      const { schema } = modifySchema(baseSchema, {
        allFields: (name: string) => ({
          'x-jsf-presentation': {
            customAttribute: `customValue-${name}`,
          },
        }),
        muteLogging: true,
      })

      Object.keys(schema.properties!).forEach((property) => {
        expect(schema.properties?.[property]?.['x-jsf-presentation']?.customAttribute).toEqual(`customValue-${property}`)
      })
    })
  })

  describe('[create] create new fields', () => {
    it('should create new fields without warnings', () => {
      const { schema, warnings } = modifySchema(baseSchema, {
        create: {
          email: {
            type: 'string',
            title: 'Email',
            format: 'email',
          },
        },
        muteLogging: true,
      })

      if (typeof schema.properties?.email === 'object') {
        expect(schema.properties?.email).toBeDefined()
        expect(schema.properties?.email?.format).toBe('email')
      }
      else {
        fail()
      }

      expect(warnings).toHaveLength(0)
    })

    it('should warn when creating existing fields', () => {
      const { warnings } = modifySchema(baseSchema, {
        create: {
          name: {
            type: 'string',
            title: 'Name',
          },
        },
        muteLogging: true,
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('FIELD_TO_CREATE_EXISTS')
    })
  })

  describe('[pick] filtering fields', () => {
    it('should pick specified fields without warnings', () => {
      const { schema } = modifySchema(baseSchema, {
        pick: ['name', 'age'],
        muteLogging: true,
      })

      if (typeof schema.properties === 'object') {
        expect(Object.keys(schema.properties)).toHaveLength(2)
        expect(schema.properties.name).toBeDefined()
        expect(schema.properties.age).toBeDefined()
        expect(schema.properties.address).toBeUndefined()
      }
      else {
        fail()
      }
    })

    it('should adjust required properties when picking fields', () => {
      const { schema } = modifySchema(baseSchema, {
        pick: ['name'],
        muteLogging: true,
      })

      // The new schema should still have name as a required property and
      // remove any other properties
      expect(schema.required).toEqual(['name'])
    })

    describe('picking fields affected by condtionals ', () => {
      beforeEach(() => {
        baseSchema.allOf = [{
          if: {
            required: ['name'],
          },
          then: {
            required: ['age'],
          },
          else: {
            properties: {
              email: {
                type: 'string',
              },
            },
          },
        }]
      })

      it('should handle conditional fields when picking', () => {
        const { schema, warnings } = modifySchema(baseSchema, {
          pick: ['name'],
          muteLogging: true,
        })

        expect(warnings).toHaveLength(1)
        expect(warnings[0]?.type).toBe('PICK_MISSED_FIELD')
        expect(schema.properties?.age).toBeDefined()
      })
    })
  })

  describe('[orderRoot] reorder fields', () => {
    it('should reorder fields with an array', () => {
      expect(baseSchema['x-jsf-order']).toEqual(['name', 'age', 'address'])
      const { schema } = modifySchema(baseSchema, {
        orderRoot: ['age', 'name', 'address'],
        muteLogging: true,
      })

      expect(schema['x-jsf-order']).toEqual(['age', 'name', 'address'])
    })

    it('should reorder fields via a function', () => {
      const { schema } = modifySchema(baseSchema, {
        orderRoot: order => order.reverse(),
        muteLogging: true,
      })

      expect(schema['x-jsf-order']).toEqual(['address', 'age', 'name'])
    })

    it('should warn about missing fields in order', () => {
      const { warnings } = modifySchema(baseSchema, {
        orderRoot: ['age', 'name'], // missing 'address'
        muteLogging: true,
      })

      expect(warnings).toHaveLength(1)
      expect(warnings[0]?.type).toBe('ORDER_MISSING_FIELDS')
    })
  })
})
