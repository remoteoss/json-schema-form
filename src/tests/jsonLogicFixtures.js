export function createSchemaWithRulesOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-logic-validations': Object.keys(rules),
      },
      field_b: {
        type: 'number',
      },
    },
    required: ['field_a', 'field_b'],
    'x-jsf-logic': { validations: rules },
  };
}

export function createSchemaWithThreePropertiesWithRuleOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
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
    required: ['field_a', 'field_b', 'field_c'],
  };
}

export const schemaWithNonRequiredField = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-validations': ['a_greater_than_ten'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
        rule: {
          '>': [{ var: 'field_a' }, 10],
        },
      },
    },
  },
  required: [],
};

export const schemaWithNativeAndJSONLogicChecks = {
  properties: {
    field_a: {
      type: 'number',
      minimum: 5,
      'x-jsf-logic-validations': ['a_greater_than_ten'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
        rule: {
          '>': [{ var: 'field_a' }, 10],
        },
      },
    },
  },
  required: ['field_a'],
};

export const schemaWithMissingRule = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-validations': ['a_greater_than_ten'],
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
      },
    },
  },
  required: [],
};

export const schemaWithVarThatDoesNotExist = {
  properties: {
    field_a: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
        rule: {
          '>': [{ var: 'field_b' }, 10],
        },
      },
    },
  },
  required: [],
};

export const schemaWithDeepVarThatDoesNotExist = {
  properties: {
    field_a: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    validations: {
      a_greater_than_ten: {
        errorMessage: 'Must be greater than 10',
        rule: {
          '>': [{ var: 'field_a' }, { '*': [2, { '/': [2, { '*': [1, { var: 'field_b' }] }] }] }],
        },
      },
    },
  },
  required: [],
};

export const schemaWithDeepVarThatDoesNotExistOnFieldset = {
  properties: {
    field_a: {
      type: 'object',
      properties: {
        child: {
          type: 'number',
        },
      },
      'x-jsf-logic': {
        validations: {
          a_greater_than_ten: {
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
};

export const schemaWithValidationThatDoesNotExistOnProperty = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-validations': ['iDontExist'],
    },
  },
};

export const schemaWithComputedAttributeThatDoesntExist = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        value: 'iDontExist',
      },
    },
  },
};

export const schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          rule: {
            '+': [{ var: 'IdontExist' }],
          },
        },
      },
    },
  },
};

export const schemaWithComputedAttributeThatDoesntExistTitle = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: `this doesn't exist {{iDontExist}}`,
      },
    },
  },
};

export const schemaWithComputedAttributeThatDoesntExistDescription = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        description: `this doesn't exist {{iDontExist}}`,
      },
    },
  },
};

export const ifConditionWithMissingComputedValue = {
  properties: {
    field_a: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    allOf: [
      {
        if: {
          computedValues: {
            iDontExist: {
              const: 10,
            },
          },
        },
      },
    ],
  },
};

export const ifConditionWithMissingValidation = {
  properties: {
    field_a: {
      type: 'number',
    },
  },
  'x-jsf-logic': {
    allOf: [
      {
        if: {
          validations: {
            iDontExist: {
              const: true,
            },
          },
        },
      },
    ],
  },
};

export const schemaWithGreaterThanChecksForThreeFields = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      require_c: {
        rule: {
          and: [
            { '!==': [{ var: 'field_b' }, null] },
            { '!==': [{ var: 'field_a' }, null] },
            { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
          ],
        },
      },
    },
    allOf: [
      {
        if: {
          validations: {
            require_c: {
              const: true,
            },
          },
        },
        then: {
          required: ['field_c'],
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const schemaWithPropertiesCheckAndValidationsInAIf = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      require_c: {
        rule: {
          and: [
            { '!==': [{ var: 'field_b' }, null] },
            { '!==': [{ var: 'field_a' }, null] },
            { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
          ],
        },
      },
    },
    allOf: [
      {
        if: {
          validations: {
            require_c: {
              const: true,
            },
          },
          properties: {
            field_a: {
              const: 10,
            },
          },
        },
        then: {
          required: ['field_c'],
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const schemaWithChecksAndThenValidationsOnThen = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      c_must_be_large: {
        errorMessage: 'Needs more numbers',
        rule: {
          '>': [{ var: 'field_c' }, 200],
        },
      },
      require_c: {
        rule: {
          and: [
            { '!==': [{ var: 'field_b' }, null] },
            { '!==': [{ var: 'field_a' }, null] },
            { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
          ],
        },
      },
    },
    allOf: [
      {
        if: {
          validations: {
            require_c: {
              const: true,
            },
          },
        },
        then: {
          required: ['field_c'],
          properties: {
            field_c: {
              description: 'I am a description!',
              'x-jsf-logic-validations': ['c_must_be_large'],
            },
          },
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const schemaWithComputedValueChecksInIf = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    computedValues: {
      require_c: {
        rule: {
          and: [
            { '!==': [{ var: 'field_b' }, null] },
            { '!==': [{ var: 'field_a' }, null] },
            { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
          ],
        },
      },
    },
    allOf: [
      {
        if: {
          computedValues: {
            require_c: {
              const: true,
            },
          },
        },
        then: {
          required: ['field_c'],
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const schemaWithMultipleComputedValueChecks = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      double_b: {
        errorMessage: 'Must be two times B',
        rule: {
          '>': [{ var: 'field_c' }, { '*': [{ var: 'field_b' }, 2] }],
        },
      },
    },
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
      mod_by_five: {
        rule: {
          '%': [{ var: 'field_b' }, 5],
        },
      },
    },
    allOf: [
      {
        if: {
          computedValues: {
            a_times_two: {
              const: 20,
            },
            mod_by_five: {
              const: 3,
            },
          },
        },
        then: {
          required: ['field_c'],
          properties: {
            field_c: {
              'x-jsf-logic-validations': ['double_b'],
              title: 'Adding a title.',
            },
          },
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const schemaWithIfStatementWithComputedValuesAndValidationChecks = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
    field_c: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    validations: {
      greater_than_b: {
        rule: {
          '>': [{ var: 'field_a' }, { var: 'field_b' }],
        },
      },
    },
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
    },
    allOf: [
      {
        if: {
          computedValues: {
            a_times_two: {
              const: 20,
            },
          },
          validations: {
            greater_than_b: {
              const: true,
            },
          },
        },
        then: {
          required: ['field_c'],
        },
        else: {
          properties: {
            field_c: false,
          },
        },
      },
    ],
  },
};

export const multiRuleSchema = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-validations': ['a_bigger_than_b', 'is_even_number'],
    },
    field_b: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
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
};

export const schemaWithTwoRules = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-validations': ['a_bigger_than_b'],
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-validations': ['is_even_number'],
    },
  },
  required: ['field_a', 'field_b'],
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
};

export const schemaWithComputedAttributes = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: 'This is {{a_times_two}}!',
        value: 'a_times_two',
        description: 'This field is 2 times bigger than field_a with value of {{a_times_two}}.',
      },
    },
  },
  required: ['field_a', 'field_b'],
  'x-jsf-logic': {
    computedValues: {
      a_times_two: {
        rule: {
          '*': [{ var: 'field_a' }, 2],
        },
      },
    },
  },
};

export const nestedFieldsetWithValidationSchema = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
          'x-jsf-logic-validations': ['child_greater_than_10'],
        },
      },
      required: ['child'],
      'x-jsf-logic': {
        validations: {
          child_greater_than_10: {
            errorMessage: 'Must be greater than 10!',
            rule: {
              '>': [{ var: 'child' }, 10],
            },
          },
        },
      },
    },
  },
  required: ['field_a'],
};

export const validatingTwoNestedFieldsSchema = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
          'x-jsf-logic-validations': ['child_greater_than_10'],
        },
        other_child: {
          type: 'number',
          'x-jsf-logic-validations': ['greater_than_child'],
        },
      },
      required: ['child', 'other_child'],
      'x-jsf-logic': {
        validations: {
          child_greater_than_10: {
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
    },
  },
  required: ['field_a'],
};

export const twoLevelsOfJSONLogicSchema = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
          'x-jsf-logic-validations': ['child_greater_than_10'],
        },
      },
      required: ['child'],
      'x-jsf-logic': {
        validations: {
          child_greater_than_10: {
            errorMessage: 'Must be greater than 10!',
            rule: {
              '>': [{ var: 'child' }, 10],
            },
          },
        },
      },
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-validations': ['validation_parent', 'peek_to_nested'],
    },
  },
  'x-jsf-logic': {
    validations: {
      validation_parent: {
        errorMessage: 'Must be greater than 10!',
        rule: {
          '>': [{ var: 'field_b' }, 10],
        },
      },
      peek_to_nested: {
        errorMessage: 'child must be greater than 15!',
        rule: {
          '>': [{ var: 'field_a.child' }, 15],
        },
      },
    },
  },
  required: ['field_a', 'field_b'],
};

export const fieldsetWithComputedAttributes = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
        },
        other_child: {
          type: 'number',
          readOnly: true,
          'x-jsf-logic-computedAttrs': {
            value: 'child_times_10',
            description: 'this is {{child_times_10}}',
          },
        },
      },
      required: ['child'],
      'x-jsf-logic': {
        computedValues: {
          child_times_10: {
            rule: {
              '*': [{ var: 'child' }, 10],
            },
          },
        },
      },
    },
  },
  required: ['field_a'],
};

export const fieldsetWithAConditionalToApplyExtraValidations = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
        },
        other_child: {
          type: 'number',
        },
        third_child: {
          type: 'number',
        },
      },
      required: ['child', 'other_child'],
      'x-jsf-logic': {
        validations: {
          child_is_greater_than_other_child: {
            rule: {
              '>': [{ var: 'child' }, { var: 'other_child' }],
            },
          },
          third_child_is_greater_than_other_child: {
            errorMessage: 'Must be greater than other child.',
            rule: {
              '>': [{ var: 'third_child' }, { var: 'other_child' }],
            },
          },
        },
        computedValues: {
          child_times_10: {
            rule: {
              '*': [{ var: 'child' }, 10],
            },
          },
        },
        allOf: [
          {
            if: {
              computedValues: {
                child_times_10: {
                  const: 100,
                },
              },
              validations: {
                child_is_greater_than_other_child: {
                  const: false,
                },
              },
              properties: {
                child: {
                  const: 10,
                },
              },
            },
            then: {
              required: ['third_child'],
              properties: {
                third_child: {
                  'x-jsf-logic-validations': ['third_child_is_greater_than_other_child'],
                },
              },
            },
            else: {
              properties: {
                third_child: false,
              },
            },
          },
        ],
      },
    },
  },
  required: ['field_a'],
};

export const schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset = {
  properties: {
    field_a: {
      type: 'object',
      'x-jsf-presentation': {
        inputType: 'fieldset',
      },
      properties: {
        child: {
          type: 'number',
          'x-jsf-logic-validations': ['child_greater_than_10'],
        },
        other_child: {
          type: 'number',
          'x-jsf-logic-validations': ['greater_than_child'],
        },
      },
      required: ['child', 'other_child'],
    },
  },
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
  required: ['field_a'],
};

export const simpleArrayValidationSchema = {
  properties: {
    field_array: {
      type: 'array',
      items: {
        properties: {
          array_item: {
            type: 'number',
            'x-jsf-logic-validations': ['divisible_by_two'],
          },
        },
        required: ['array_item'],
        'x-jsf-logic': {
          validations: {
            divisible_by_two: {
              errorMessage: 'Must be divisible by two',
              rule: {
                '===': [{ '%': [{ var: 'array_item' }, 2] }, 0],
              },
            },
          },
        },
      },
    },
  },
};

export const validatingASingleItemInTheArray = {
  properties: {
    field_array: {
      type: 'array',
      'x-jsf-logic-validations': ['second_item_is_divisible_by_four'],
      items: {
        properties: {
          item: {
            type: 'number',
          },
        },
        required: ['item'],
      },
    },
  },
  'x-jsf-logic': {
    validations: {
      second_item_is_divisible_by_four: {
        errorMessage: 'Second item in array must be divisible by 4',
        rule: {
          '===': [{ '%': [{ var: 'field_array.1.item' }, 4] }, 0],
        },
      },
    },
  },
};

// FIXME: This doesn't work because conditionals in items are not supported.
export const conditionalAppliedInAnItem = {
  properties: {
    field_array: {
      type: 'array',
      items: {
        properties: {
          item: {
            type: 'number',
          },
          other_item: {
            type: 'number',
          },
        },
        required: ['item'],
        'x-jsf-logic': {
          validations: {
            divisible_by_three: {
              rule: {
                '===': [{ '%': [{ var: 'item' }, 3] }, 0],
              },
            },
            other_item_divisible_by_three: {
              errorMessage: 'Must be disivisble_by_three',
              rule: {
                '===': [{ '%': [{ var: 'other_item' }, 3] }, 0],
              },
            },
          },
          allOf: [
            {
              if: { validations: { divisible_by_three: { cosnt: true } } },
              then: {
                required: ['other_item'],
                other_item: { 'x-jsf-logic-validations': ['other_item_divisible_by_three'] },
              },
              else: { properties: { other_item: false } },
            },
          ],
        },
      },
    },
  },
};

export const aConditionallyAppliedComputedAttributeMinimum = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
  },
  allOf: [
    {
      if: { properties: { field_a: { const: 20 } } },
      then: {
        properties: {
          field_b: {
            'x-jsf-logic-computedAttrs': {
              minimum: 'a_divided_by_two',
              'x-jsf-errorMessage': {
                minimum: 'use {{a_divided_by_two}} or more',
              },
            },
          },
        },
      },
    },
  ],
  'x-jsf-logic': {
    computedValues: {
      a_divided_by_two: {
        rule: {
          '/': [{ var: 'field_a' }, 2],
        },
      },
    },
  },
};

export const aConditionallyAppliedComputedAttributeValue = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
    },
  },
  allOf: [
    {
      if: { properties: { field_a: { const: 20 } } },
      then: {
        properties: {
          field_b: {
            readOnly: true,
            'x-jsf-logic-computedAttrs': {
              const: 'a_divided_by_two',
              value: 'a_divided_by_two',
            },
          },
        },
      },
      else: {
        properties: {
          field_b: {
            readOnly: false,
          },
        },
      },
    },
  ],
  'x-jsf-logic': {
    computedValues: {
      a_divided_by_two: {
        rule: {
          '/': [{ var: 'field_a' }, 2],
        },
      },
    },
  },
};

export const schemaWithInlineRuleForComputedAttributeWithCopy = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
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
};

export const schemaWithInlineRuleForComputedAttributeWithoutCopy = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
};

export const schemaWithInlineRuleForComputedAttributeWithOnlyTheRule = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        minumum: {
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
        'x-jsf-errorMessage': {
          minimum: {
            value: 'This should be greater than {{rule}}.',
            rule: {
              '+': [{ var: 'field_a' }, 10],
            },
          },
        },
      },
    },
  },
};

export const schemaWithInlineRuleForComputedAttributeInConditionallyAppliedSchema = {};
