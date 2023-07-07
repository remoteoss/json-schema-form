export function createSchemaWithRulesOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-requiredValidations': Object.keys(rules),
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
        'x-jsf-requiredValidations': Object.keys(rules),
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
      'x-jsf-requiredValidations': ['a_greater_than_ten'],
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
      'x-jsf-requiredValidations': ['a_greater_than_ten'],
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
      'x-jsf-requiredValidations': ['a_greater_than_ten'],
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
              'x-jsf-requiredValidations': ['c_must_be_large'],
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
