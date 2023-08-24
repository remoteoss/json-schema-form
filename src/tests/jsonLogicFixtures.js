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

export const schemaWithInlineRuleForComputedAttributeWithOnlyTheRule = {
  properties: {
    field_a: {
      type: 'number',
    },
    field_b: {
      type: 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: {
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
