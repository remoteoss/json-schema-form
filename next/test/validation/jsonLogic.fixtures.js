export function createSchemaWithRulesOnFieldA(rules) {
  return {
    'properties': {
      field_a: {
        'type': 'number',
        'x-jsf-logic-validations': Object.keys(rules),
      },
      field_b: {
        type: 'number',
      },
    },
    'required': ['field_a', 'field_b'],
    'x-jsf-logic': { validations: rules },
  }
}

export function createSchemaWithThreePropertiesWithRuleOnFieldA(rules) {
  return {
    'properties': {
      field_a: {
        'type': 'number',
        'x-jsf-logic-validations': Object.keys(rules),
      },
      field_b: {
        type: 'number',
      },
      field_c: {
        type: 'number',
      },
    },
    'x-jsf-logic': { validations: rules },
    'required': ['field_a', 'field_b', 'field_c'],
  }
}

export const schemaWithNonRequiredField = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-validations': ['a_greater_than_field_b'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_field_b: {
        errorMessage: 'Must be greater than field_a',
        rule: {
          '>': [{ var: 'field_a' }, { var: 'field_b' }],
        },
      },
    },
  },
  'required': [],
}

export const schemaWithNativeAndJSONLogicChecks = {
  'properties': {
    field_a: {
      'type': 'number',
      'minimum': 100,
      'x-jsf-logic-validations': ['a_multiple_of_ten'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_multiple_of_ten: {
        errorMessage: 'Must be a multiple of 10',
        rule: {
          '===': [{ '%': [{ var: 'field_a' }, 10] }, 0],
        },
      },
    },
  },
  'required': ['field_a'],
}

export const schemaWithMissingRule = {
  'properties': {
    field_a: {
      'type': 'number',
      'x-jsf-logic-validations': ['a_greater_than_ten'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
        // rule: { '>': [{ var: 'field_a' }, 10] }, this missing causes test to fail.
      },
    },
  },
  'required': [],
}

export const schemaWithUnknownVariableInValidations = {
  'properties': {
    // field_a: { type: 'number' }, this missing causes test to fail.
  },
  'x-jsf-logic': {
    validations: {
      a_equals_ten: {
        errorMessage: 'Must equal 10',
        rule: { '===': [{ var: 'field_a' }, 10] },
      },
    },
  },
}

export const schemaWithUnknownVariableInComputedValues = {
  'properties': {
    // field_a: { type: 'number' }, this missing causes test to fail.
  },
  'x-jsf-logic': {
    computedValues: {
      a_times_ten: {
        rule: { '*': [{ var: 'field_a' }, 10] },
      },
    },
  },
}

export const schemaWithMissingComputedValue = {
  'properties': {
    field_a: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: '{{a_plus_ten}}',
      },
    },
  },
  'x-jsf-logic': {
    computedValues: {
      a_plus_ten: {
        // rule: { '+': [{ var: 'field_a' }, 10 ]} this missing causes test to fail.
      },
    },
  },
  'required': [],
}

export const multiRuleSchema = {
  'properties': {
    field_a: {
      'type': 'number',
      'x-jsf-logic-validations': ['a_bigger_than_b', 'is_even_number'],
    },
    field_b: {
      type: 'number',
    },
  },
  'required': ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      a_bigger_than_b: {
        errorMessage: 'A must be bigger than B',
        rule: {
          '>': [{ var: 'field_a' }, { var: 'field_b' }],
        },
      },
      is_even_number: {
        errorMessage: 'A must be even',
        rule: {
          '===': [{ '%': [{ var: 'field_a' }, 2] }, 0],
        },
      },
    },
  },
}

export const schemaWithTwoRules = {
  'properties': {
    field_a: {
      'type': 'number',
      'x-jsf-logic-validations': ['a_bigger_than_b'],
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-validations': ['is_even_number'],
    },
  },
  'required': ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      a_bigger_than_b: {
        errorMessage: 'A must be bigger than B',
        rule: {
          '>': [{ var: 'field_a' }, { var: 'field_b' }],
        },
      },
      is_even_number: {
        errorMessage: 'B must be even',
        rule: {
          '===': [{ '%': [{ var: 'field_b' }, 2] }, 0],
        },
      },
    },
  },
}

export const schemaWithComputedAttributes = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: 'This is {{a_times_two}}!',
        const: 'a_times_two',
        default: 'a_times_two',
        description: 'This field is 2 times bigger than field_a with value of {{a_times_two}}.',
      },
    },
  },
  'required': ['field_a', 'field_b'],
  'x-jsf-logic': {
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
    },
  },
}

export const badSchemaThatWillNotSetAForcedValue = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        const: 'a_times_three',
        default: 'a_times_two',
      },
    },
  },
  'x-jsf-logic': {
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
      a_times_three: {
        rule: {
          '*': [{ var: 'field_a' }, 3],
        },
      },
    },
  },
}

export const schemaWithInlineRuleForComputedAttributeWithoutCopy = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
}

export const schemaWithComputedAttributeThatDoesntExist = {
  properties: {
    field_a: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'iDontExist',
      },
    },
  },
  // x-jsf-logic: { computedValues: { iDontExist: { rule: 10 }} this missing causes test to fail.
}

export const schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar = {
  properties: {
    // iDontExist: { type: 'number' } this missing causes test to fail.
    field_a: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          rule: {
            '+': [{ var: 'IdontExist' }, 10],
          },
        },
      },
    },
  },
}

export const schemaWithComputedAttributeThatDoesntExistTitle = {
  properties: {
    field_a: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: `this doesn't exist {{iDontExist}}`,
      },
    },
  },
}

export const schemaWithComputedAttributeThatDoesntExistDescription = {
  properties: {
    // iDontExist: { type: 'number'}, this missing causes test to fail
    field_a: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        description: `this doesn't exist {{iDontExist}}`,
      },
    },
  },
}

export const schemaWithComputedAttributesAndErrorMessages = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        'minimum': 'a_times_two',
        'maximum': 'a_times_four',
        'x-jsf-errorMessage': {
          minimum: 'Must be bigger than {{a_times_two}}',
          maximum: 'Must be smaller than {{a_times_four}}',
        },
        'x-jsf-presentation': {
          statement: {
            description: 'Must be bigger than {{a_times_two}} and smaller than {{a_times_four}}',
          },
        },
      },
    },
  },
  'required': ['field_a', 'field_b'],
  'x-jsf-logic': {
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
      a_times_four: {
        rule: {
          '*': [{ var: 'field_a' }, 4],
        },
      },
    },
  },
}

export const schemaWithDeepVarThatDoesNotExist = {
  'properties': {
    field_a: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    validations: {
      dummy_rule: {
        errorMessage: 'Random stuff to illustrate a deeply nested rule.',
        rule: {
          '>': [{ var: 'field_a' }, { '*': [2, { '/': [2, { '*': [1, { var: 'field_b' }] }] }] }],
        },
      },
    },
  },
  'required': [],
}

export const schemaWithDeepVarThatDoesNotExistOnFieldset = {
  properties: {
    field_a: {
      'type': 'object',
      'properties': {
        child: {
          type: 'number',
        },
      },
      'x-jsf-logic': {
        validations: {
          dummy_rule: {
            errorMessage: 'Must be greater than 10',
            rule: {
              '>': [{ var: 'child' }, { '*': [2, { '/': [2, { '*': [1, { var: 'field_a' }] }] }] }],
            },
          },
        },
      },
    },
  },
  required: [],
}

export const schemaWithValidationThatDoesNotExistOnProperty = {
  properties: {
    field_a: {
      'type': 'number',
      'x-jsf-logic-validations': ['iDontExist'],
    },
  },
}

export const schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset = {
  'properties': {
    field_a: {
      'type': 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      'properties': {
        child: {
          'type': 'number',
          'x-jsf-logic-validations': ['child_greater_than_10'],
        },
        other_child: {
          'type': 'number',
          'x-jsf-logic-validations': ['greater_than_child'],
        },
      },
      'required': ['child', 'other_child'],
    },
  },
  // the issue here is that this should be nested inside `field_a` in order to not fail.
  'x-jsf-logic': {
    validations: {
      validation_parent: {
        errorMessage: 'Must be greater than 10!',
        rule: {
          '>': [{ var: 'child' }, 10],
        },
      },
      greater_than_child: {
        errorMessage: 'Must be greater than child',
        rule: {
          '>': [{ var: 'other_child' }, { var: 'child' }],
        },
      },
    },
  },
  'required': ['field_a'],
}

export const schemaWithBadOperation = {
  'properties': {},
  'x-jsf-logic': {
    validations: {
      badOperator: {
        rule: {
          '++': [10, 2],
        },
      },
    },
  },
}

export const schemaWithInlineRuleForComputedAttributeWithCopy = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          value: 'I need this to work using the {{rule}}.',
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
}

export const schemaWithInlineMultipleRulesForComputedAttributes = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        description: {
          value: 'Must be between {{half_a}} and {{double_a}}.',
          half_a: {
            '/': [{ var: 'field_a' }, 2],
          },
          double_a: {
            '*': [{ var: 'field_a' }, 2],
          },
        },
      },
    },
  },
}

export const schemaInlineComputedAttrForTitle = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          value: '{{rule}}',
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
}

export const schemaValidationForMaximumAndMinimumValues = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-validations': [
        'max_a',
        'min_a',
      ],
    },
  },
  'x-jsf-logic': {
    validations: {
      max_a: {
        errorMessage: 'Field B must be smaller than or equal to {{field_a}} + 2',
        rule: {
          '>=': [
            {
              '+': [
                {
                  var: 'field_a',
                },
                2,
              ],
            },
            {
              var: 'field_b',
            },
          ],
        },
      },
      min_a: {
        errorMessage: 'Field B must be greater than or equal to {{field_a}} - 2',
        rule: {
          '<=': [
            {
              '-': [
                {
                  var: 'field_a',
                },
                2,
              ],
            },
            {
              var: 'field_b',
            },
          ],
        },
      },
    },
  },
}

export const schemaValidationForMaximumAndMinimumValuesWithDynamicErrorMessage = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-validations': [
        'max_a',
        'min_a',
      ],
    },
  },
  'x-jsf-logic': {
    computedValues: {
      field_a_plus_2: {
        rule: {
          '+': [
            {
              var: 'field_a',
            },
            2,
          ],
        },
      },
      field_a_minus_2: {
        rule: {
          '-': [
            {
              var: 'field_a',
            },
            2,
          ],
        },
      },
    },
    validations: {
      max_a: {
        errorMessage: 'Field B must be smaller than or equal to {{field_a_plus_2}}',
        rule: {
          '>=': [
            {
              '+': [
                {
                  var: 'field_a',
                },
                2,
              ],
            },
            {
              var: 'field_b',
            },
          ],
        },
      },
      min_a: {
        errorMessage: 'Field B must be greater than or equal to {{field_a_minus_2}}',
        rule: {
          '<=': [
            {
              '-': [
                {
                  var: 'field_a',
                },
                2,
              ],
            },
            {
              var: 'field_b',
            },
          ],
        },
      },
    },
  },
}

export const schemaWithJSFLogicAndInlineRule = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          value: 'Going to use {{rule}} and {{not_inline}}',
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
  'x-jsf-logic': {
    computedValues: {
      not_inline: {
        rule: {
          '+': [1, 3],
        },
      },
    },
  },
}

export const schemaWhereValidationAndComputedValueIsAppliedOnNormalThenStatement = {
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    computedValues: {
      a_plus_ten: {
        rule: {
          '+': [{ var: 'field_a' }, 10],
        },
      },
    },
    validations: {
      greater_than_a_plus_ten: {
        errorMessage: 'Must be greater than Field A + 10',
        rule: {
          '>': [{ var: 'field_b' }, { '+': [{ var: 'field_a' }, 10] }],
        },
      },
    },
  },
  'allOf': [
    {
      if: {
        properties: {
          field_a: {
            const: 20,
          },
        },
      },
      then: {
        properties: {
          field_b: {
            'x-jsf-logic-computedAttrs': {
              title: 'Must be greater than {{a_plus_ten}}.',
            },
            'x-jsf-logic-validations': ['greater_than_a_plus_ten'],
          },
        },
      },
    },
  ],
}

export const schemaWithTwoValidationsWhereOneOfThemIsAppliedConditionally = {
  'required': ['field_a', 'field_b'],
  'properties': {
    field_a: {
      type: 'number',
    },
    field_b: {
      'type': 'number',
      'x-jsf-logic-validations': ['greater_than_field_a'],
    },
  },
  'x-jsf-logic': {
    validations: {
      greater_than_field_a: {
        errorMessage: 'Must be greater than A',
        rule: {
          '>': [{ var: 'field_b' }, { var: 'field_a' }],
        },
      },
      greater_than_two_times_a: {
        errorMessage: 'Must be greater than two times A',
        rule: {
          '>': [{ var: 'field_b' }, { '*': [{ var: 'field_a' }, 2] }],
        },
      },
    },
  },
  'allOf': [
    {
      if: {
        properties: {
          field_a: {
            const: 20,
          },
        },
      },
      then: {
        properties: {
          field_b: {
            'x-jsf-logic-validations': ['greater_than_two_times_a'],
          },
        },
      },
    },
  ],
}

export const schemaWithReduceAccumulator = {
  'properties': {
    work_days: {
      'items': {
        anyOf: [
          { const: 'monday', title: 'Monday' },
          { const: 'tuesday', title: 'Tuesday' },
          { const: 'wednesday', title: 'Wednesday' },
          { const: 'thursday', title: 'Thursday' },
          { const: 'friday', title: 'Friday' },
          { const: 'saturday', title: 'Saturday' },
          { const: 'sunday', title: 'Sunday' },
        ],
      },
      'type': 'array',
      'uniqueItems': true,
      'x-jsf-presentation': {
        inputType: 'select',
      },
    },
    working_hours_per_day: {
      type: 'number',
    },
    working_hours_per_week: {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        const: 'computed_work_hours_per_week',
        defaultValue: 'computed_work_hours_per_week',
        title: '{{computed_work_hours_per_week}} hours per week',
      },
    },
  },
  'x-jsf-logic': {
    computedValues: {
      computed_work_hours_per_week: {
        rule: {
          '*': [
            { var: 'working_hours_per_day' },
            {
              reduce: [{ var: 'work_days' }, { '+': [{ var: ['accumulator', 0] }, 1] }, 0],
            },
          ],
        },
      },
    },
  },
}
