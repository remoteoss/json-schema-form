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
    },
    field_b: {
      type: 'number',
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
  required: [],
};

export const schemaWithNativeAndJSONLogicChecks = {
  properties: {
    field_a: {
      type: 'number',
      minimum: 100,
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
  required: ['field_a'],
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
