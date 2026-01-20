import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { getField } from '../../src/utils'

describe('Field visibility', () => {
  describe('if inside allOf', () => {
    describe('if a "then" branch is not provided', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
        },
        allOf: [
          {
            if: {
              properties: {
                name: {
                  const: 'admin',
                },
              },
              required: ['name'],
            },
            else: {
              properties: {
                password: false,
              },
            },
          },
        ],
      }

      it('should hide the password field by default', () => {
        const form = createHeadlessForm(schema, { initialValues: { name: 'asd', password: null } })
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)

        // Different name provided
        form.handleValidation({
          name: 'some name',
          password: null,
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)
      })

      it('should show the password field if the name is admin', () => {
        const form = createHeadlessForm(schema)
        form.handleValidation({
          name: 'admin',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })
    })
    describe('if an "else" branch is not provided', () => {
      const userName = 'user that does not need password field visible'
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
        },
        allOf: [
          {
            if: {
              properties: {
                name: {
                  const: userName,
                },
              },
              required: ['name'],
            },
            then: {
              properties: {
                password: false,
              },
            },
          },
        ],
      }

      it('should show the password field by default', () => {
        const form = createHeadlessForm(schema)
        // No name provided
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })

      it('should hide the password field if the name is "user that does not need password field visible"', () => {
        const form = createHeadlessForm(schema, { initialValues: { name: userName, password: null } })
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)
      })
    })
    describe('if no "else" or "then" branch are provided', () => {
      const userName = 'admin'
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
        },
        allOf: [
          {
            if: {
              properties: {
                name: {
                  const: userName,
                },
              },
              required: ['name'],
            },
          },
        ],
      }

      it('should show the password field by default', () => {
        const form = createHeadlessForm(schema)
        // No name provided
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })

      it('should show the password field if the name is "admin"', () => {
        const form = createHeadlessForm(schema)
        form.handleValidation({
          name: userName,
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })
    })
  })

  describe('if on a fieldset schema level', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        form: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
        },
      },
      if: {
        properties: {
          form: {
            properties: {
              name: {
                const: 'admin',
              },
            },
            required: ['name'],
          },
        },
        required: ['form'],
      },
      else: {
        properties: {
          form: {
            properties: {
              password: false,
            },
          },
        },
      },
    }

    it('should hide the password field by default', () => {
      const form = createHeadlessForm(schema, { initialValues: { form: { name: '', password: null } } })
      // No name provided
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(false)

      // Different name provided
      form.handleValidation({
        form: {
          name: 'some name',
          password: null,
        },
      })
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(false)
    })

    it('should show the password field if the name is admin', () => {
      const form = createHeadlessForm(schema, { initialValues: { form: { name: 'admin', password: null } } })
      form.handleValidation({ form: {
        name: 'admin',
      } })
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(true)
    })

    it('should allow hiding the whole fieldset', () => {
      const conditionalFieldsetSchema: JsfObjectSchema = {
        type: 'object',
        properties: {
          hide_form: {
            type: 'string',
          },
          form: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
            },
          },
        },
        if: {
          properties: {
            hide_form: {
              const: 'yes',
            },
          },
          required: ['hide_form'],
        },
        then: {
          properties: {
            form: false,
          },
        },
      }

      const form = createHeadlessForm(conditionalFieldsetSchema, { initialValues: { form: { name: 'admin', password: null } } })
      form.handleValidation({ hide_form: 'yes' })

      expect(getField(form.fields, 'form')?.isVisible).toBe(false)
    })

    describe('supports conditionals over nested fieldsets', () => {
      const schemaWithNestedFieldsetsConditionals: JsfObjectSchema = {
        'additionalProperties': false,
        'type': 'object',
        'properties': {
          perks: {
            'additionalProperties': false,
            'properties': {
              benefits_package: {
                'oneOf': [
                  {
                    const: 'basic',
                    title: 'Basic',
                  },
                  {
                    const: 'plus',
                    title: 'Plus',
                  },
                ],
                'title': 'Benefits package',
                'type': 'string',
                'x-jsf-presentation': {
                  inputType: 'radio',
                },
              },
              has_retirement_plan: {
                'oneOf': [
                  {
                    const: 'yes',
                    title: 'Yes',
                  },
                  {
                    const: 'no',
                    title: 'No',
                  },
                ],
                'title': 'Has retirement plan?',
                'type': 'string',
                'x-jsf-presentation': {
                  inputType: 'radio',
                },
              },
              declare_amount: {
                'oneOf': [
                  {
                    const: 'yes',
                    title: 'Yes',
                  },
                  {
                    const: 'no',
                    title: 'No',
                  },
                ],
                'title': 'Declare planned retirement amount?',
                'type': 'string',
                'default': 'yes',
                'x-jsf-presentation': {
                  inputType: 'radio',
                },
              },
              retirement_plan: {
                'allOf': [
                  {
                    if: {
                      properties: {
                        create_plan: {
                          const: 'yes',
                        },
                      },
                      required: ['create_plan'],
                    },
                    then: {},
                    else: {
                      properties: {
                        planned_contributions: false,
                      },
                    },
                  },
                ],
                'type': 'object',
                'title': 'Retirement plan',
                'properties': {
                  plan_name: {
                    type: 'string',
                    title: 'Plan name',
                  },
                  year: {
                    type: 'number',
                    title: 'Year',
                    default: 2025,
                  },
                  amount: {
                    type: 'number',
                    title: 'Planned amount',
                  },
                  create_plan: {
                    'type': 'string',
                    'title': 'Create plan?',
                    'oneOf': [
                      {
                        const: 'yes',
                        title: 'Yes',
                      },
                      {
                        const: 'no',
                        title: 'No',
                      },
                    ],
                    'default': 'yes',
                    'x-jsf-presentation': {
                      inputType: 'radio',
                    },
                  },
                  planned_contributions: {
                    'type': 'object',
                    'title': 'Planned contributions',
                    'properties': {
                      months: {
                        'default': ['january', 'february'],
                        'items': {
                          anyOf: [
                            {
                              const: 'january',
                              title: 'January',
                            },
                            {
                              const: 'february',
                              title: 'February',
                            },
                            {
                              const: 'march',
                              title: 'March',
                            },
                            {
                              const: 'april',
                              title: 'April',
                            },
                            {
                              const: 'may',
                              title: 'May',
                            },
                            {
                              const: 'june',
                              title: 'June',
                            },
                          ],
                        },
                        'title': 'Select the months when you\'ll contribute',
                        'type': 'array',
                        'x-jsf-presentation': {
                          inputType: 'checkbox',
                        },
                      },
                    },
                    'x-jsf-presentation': {
                      inputType: 'fieldset',
                    },
                  },
                },
                'required': ['plan_name', 'year'],
                'x-jsf-presentation': {
                  inputType: 'fieldset',
                },
              },
            },
            'required': ['benefits_package', 'has_retirement_plan'],
            'title': 'Perks',
            'type': 'object',
            'x-jsf-presentation': {
              inputType: 'fieldset',
            },
          },
          total_contributions: {
            'title': 'Total contributions',
            'description': 'The total contributions for the retirement plan',
            'type': 'number',
            'x-jsf-presentation': {
              inputType: 'number',
            },
            'x-jsf-logic-computedAttrs': {
              const: 'total_contributions',
              default: 'total_contributions',
              description: 'You will contribute {{total_contributions}} times this year',
            },
          },
        },
        'allOf': [
          {
            if: {
              properties: {
                perks: {
                  properties: {
                    declare_amount: {
                      const: 'no',
                    },
                  },
                  required: ['declare_amount'],
                },
              },
              required: ['perks'],
            },
            then: {
              properties: {
                perks: {
                  properties: {
                    retirement_plan: {
                      properties: {
                        amount: false,
                      },
                    },
                  },
                },
              },
            },
          },
          {
            if: {
              properties: {
                perks: {
                  properties: {
                    has_retirement_plan: {
                      const: 'yes',
                    },
                  },
                  required: ['has_retirement_plan'],
                },
              },
              required: ['perks'],
            },
            then: {},
            else: {
              properties: {
                perks: {
                  properties: {
                    retirement_plan: false,
                    declare_amount: false,
                  },
                },
              },
            },
          },
          {
            if: {
              properties: {
                perks: {
                  properties: {
                    has_retirement_plan: {
                      const: 'yes',
                    },
                    declare_amount: {
                      const: 'yes',
                    },
                  },
                  required: ['has_retirement_plan', 'declare_amount'],
                },
              },
              required: ['perks'],
            },
            then: {
              properties: {
                perks: {
                  properties: {
                    retirement_plan: {
                      required: ['amount'],
                    },
                  },
                },
              },
            },
          },
        ],
        'x-jsf-logic': {
          computedValues: {
            total_contributions: {
              rule: {
                if: [
                  {
                    and: [
                      {
                        '===': [
                          {
                            var: 'perks.has_retirement_plan',
                          },
                          'yes',
                        ],
                      },
                      {
                        '===': [
                          {
                            var: 'perks.retirement_plan.create_plan',
                          },
                          'yes',
                        ],
                      },
                    ],
                  },
                  {
                    '+': [
                      {
                        if: [
                          {
                            in: [
                              'january',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        if: [
                          {
                            in: [
                              'february',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        if: [
                          {
                            in: [
                              'march',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        if: [
                          {
                            in: [
                              'april',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        if: [
                          {
                            in: [
                              'may',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        if: [
                          {
                            in: [
                              'june',
                              {
                                var: 'perks.retirement_plan.planned_contributions.months',
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      }

      it('retirement_plan fieldset is hidden when no values are provided', () => {
        const form = createHeadlessForm(
          schemaWithNestedFieldsetsConditionals,
          {},
        )

        expect(getField(form.fields, 'perks', 'retirement_plan')?.isVisible).toBe(false)

        const errors = form.handleValidation({ perks: {} })

        expect(errors.formErrors).toEqual({
          perks: {
            benefits_package: 'Required field',
            has_retirement_plan: 'Required field',
          },
        })
        expect(getField(form.fields, 'perks', 'retirement_plan')?.isVisible).toBe(false)
      })

      it('submits without retirement_plan when user selects \'no\' for has_retirement_plan', () => {
        const form = createHeadlessForm(
          schemaWithNestedFieldsetsConditionals,
          {},
        )

        const errors = form.handleValidation({ perks: { benefits_package: 'basic', has_retirement_plan: 'no' } })

        expect(errors.formErrors).toBeUndefined()
        expect(getField(form.fields, 'perks', 'retirement_plan')?.isVisible).toBe(false)
      })

      it('retirement_plan fieldset is visible when user selects \'yes\' for has_retirement_plan', () => {
        const form = createHeadlessForm(
          schemaWithNestedFieldsetsConditionals,
          {},
        )

        const errors = form.handleValidation({
          perks: {
            benefits_package: 'basic',
            has_retirement_plan: 'yes',
            declare_amount: 'yes',
            retirement_plan: { plan_name: 'test', year: 2025 },
          },
        })

        expect(errors.formErrors).toEqual({
          perks: {
            retirement_plan: {
              amount: 'Required field',
            },
          },
        })
        expect(getField(form.fields, 'perks', 'retirement_plan')?.isVisible).toBe(true)
        expect(getField(form.fields, 'perks', 'declare_amount')?.isVisible).toBe(true)
        expect(getField(form.fields, 'perks', 'declare_amount')?.default).toBe('yes')
        expect(getField(form.fields, 'perks', 'retirement_plan', 'amount')?.isVisible).toBe(true)
      })

      it('retirement_plan\'s amount field is hidden when user selects \'no\' for declare_amount', () => {
        const form = createHeadlessForm(
          schemaWithNestedFieldsetsConditionals,
          {},
        )

        const errors = form.handleValidation({
          perks: {
            benefits_package: 'basic',
            has_retirement_plan: 'yes',
            declare_amount: 'no',
            retirement_plan: { plan_name: 'test', year: 2025 },
          },
        })

        expect(errors.formErrors).toBeUndefined()
        expect(getField(form.fields, 'perks', 'retirement_plan')?.isVisible).toBe(true)
        expect(getField(form.fields, 'perks', 'declare_amount')?.isVisible).toBe(true)
        expect(getField(form.fields, 'perks', 'retirement_plan', 'amount')?.isVisible).toBe(false)
      })

      it('submits with valid retirement_plan', () => {
        const form = createHeadlessForm(
          schemaWithNestedFieldsetsConditionals,
          {},
        )

        const errors = form.handleValidation({
          perks: {
            benefits_package: 'plus',
            has_retirement_plan: 'yes',
            retirement_plan: { plan_name: 'test', year: 2025, amount: 1000 },
          },
        })

        expect(errors.formErrors).toBeUndefined()
      })
    })
  })
})
