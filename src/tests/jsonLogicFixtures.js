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

export const schemaWithMissingComputedValue = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: '{{a_plus_ten}}',
      },
    },
  },
  'x-jsf-logic': {
    computedValues: {
      a_plus_ten: {},
    },
  },
  required: [],
};

export const schemaWithMissingValueInlineRule = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        title: {
          ruleOne: {
            '+': [1, 2],
          },
          ruleTwo: {
            '+': [3, 4],
          },
        },
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
        default: 'iDontExist',
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

export const schemaWhereValidationAndComputedValueIsAppliedOnNormalThenStatement = {
  properties: {
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
  allOf: [
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
};

export const schemaWithTwoValidationsWhereOneOfThemIsAppliedConditionally = {
  required: ['field_a', 'field_b'],
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
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
  allOf: [
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
        const: 'a_times_two',
        default: 'a_times_two',
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

export const schemaWithInlineMultipleRulesForComputedAttributes = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
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
};

export const schemaSelfContainedValueForTitleWithNoTemplate = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
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
};

export const schemaSelfContainedValueForMaximumMinimumValues = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        maximum: {
          rule: {
            '+': [{ var: 'field_a' }, 10],
          },
        },
        minimum: {
          rule: {
            '-': [{ var: 'field_a' }, 10],
          },
        },
      },
    },
  },
};

export const schemaWithJSFLogicAndInlineRule = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
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
};

export const schemaWithComputedAttributesAndErrorMessages = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'a_times_two',
        maximum: 'a_times_four',
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
  required: ['field_a', 'field_b'],
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
};
