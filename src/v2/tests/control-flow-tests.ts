export const conditionalTestCases = [
  {
    title: 'Condition with no properties',
    schema: {
      if: {
        properties: { field: { const: 'yes' } },
        required: ['field'],
      },
      then: {
        required: ['otherField'],
        properties: { otherField: { minimum: 10 } },
      },
    },
    validTestCases: [{ data: { field: 'yes', otherField: 10 } }],
    invalidTestCases: [
      { data: { field: 'yes' }, error: { otherField: 'Field is required' } },
      {
        data: { field: 'yes', otherField: 9 },
        error: { otherField: 'otherField must be greater than or equal to 10' },
      },
    ],
  },
  {
    title: 'Basic if/then condition',
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        otherField: { type: 'string' },
      },
      if: {
        properties: {
          field: { const: 'yes' },
        },
        required: ['field'],
      },
      then: {
        required: ['otherField'],
      },
    } as const,
    validTestCases: [{ data: { field: 'no' } }, { data: { field: 'yes', otherField: 'test' } }],
    invalidTestCases: [
      {
        data: { field: 'yes' },
        error: { otherField: 'Field is required' },
      },
    ],
  },
  {
    title: 'Basic if/then/else condition',
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        number: { type: 'number' },
      },
      if: {
        properties: {
          field: { const: 'yes' },
        },
      },
      then: {
        properties: {
          number: { minimum: 10 },
        },
      },
      else: {
        properties: {
          number: { minimum: 5 },
        },
      },
    } as const,
    validTestCases: [{ data: { field: 'yes', number: 10 } }, { data: { field: 'no', number: 5 } }],
    invalidTestCases: [
      {
        data: { field: 'yes', number: 9 },
        error: { number: 'number must be greater than or equal to 10' },
      },
      {
        data: { field: 'no', number: 4 },
        error: { number: 'number must be greater than or equal to 5' },
      },
    ],
  },
  {
    title: 'Multiple field conditions (AND)',
    schema: {
      type: 'object',
      properties: {
        age: { type: 'number' },
        employed: { type: 'boolean' },
        salary: { type: 'number' },
      },
      if: {
        properties: {
          age: { minimum: 18 },
          employed: { const: true },
        },
        required: ['age', 'employed'],
      },
      then: {
        required: ['salary'],
      },
    } as const,
    validTestCases: [
      { data: { age: 17, employed: true } },
      { data: { age: 18, employed: false } },
      { data: { age: 18, employed: true, salary: 50000 } },
    ],
    invalidTestCases: [
      {
        data: { age: 18, employed: true },
        error: { salary: 'Field is required' },
      },
    ],
  },
  {
    title: 'Conditional type changes',
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string' },
        value: { type: 'string' },
      },
      if: {
        properties: { format: { const: 'number' } },
      },
      then: {
        properties: {
          value: { type: 'number' },
        },
      },
    } as const,
    validTestCases: [
      { data: { format: 'text', value: 'hello' } },
      { data: { format: 'number', value: 123 } },
    ],
    invalidTestCases: [
      {
        data: { format: 'number', value: 'not-a-number' },
        error: {
          value: 'value must be a `number` type, but the final value was: `"not-a-number"`.',
        },
      },
    ],
  },
  {
    title: 'Nested if/then conditions',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string' },
      },
      if: {
        properties: { type: { const: 'shirt' } },
      },
      then: {
        required: ['size'],
        if: {
          properties: { size: { const: 'custom' } },
        },
        then: {
          required: ['color'],
        },
      },
    } as const,
    validTestCases: [
      { data: { type: 'pants' } },
      { data: { type: 'shirt', size: 'L' } },
      { data: { type: 'shirt', size: 'custom', color: 'blue' } },
    ],
    invalidTestCases: [
      {
        data: { type: 'shirt' },
        error: { size: 'Field is required' },
      },
      {
        data: { type: 'shirt', size: 'custom' },
        error: { color: 'Field is required' },
      },
    ],
  },
  {
    title: 'Multiple if/then conditions',
    schema: {
      type: 'object',
      properties: {
        accountType: { type: 'string' },
        balance: { type: 'number' },
        hasOverdraft: { type: 'boolean' },
        overdraftLimit: { type: 'number' },
      },
      allOf: [
        {
          if: {
            properties: { accountType: { const: 'business' } },
            required: ['accountType'],
          },
          then: {
            properties: {
              balance: { minimum: 1000 },
            },
          },
        },
        {
          if: {
            properties: { hasOverdraft: { const: true } },
            required: ['hasOverdraft'],
          },
          then: {
            required: ['overdraftLimit'],
            properties: {
              overdraftLimit: { minimum: 100 },
            },
          },
        },
      ],
    },
    validTestCases: [
      { data: { accountType: 'business', balance: 1000 } },
      { data: { accountType: 'business', balance: 1000, hasOverdraft: true, overdraftLimit: 100 } },
    ],
    invalidTestCases: [
      {
        data: { accountType: 'business', balance: 50 },
        error: { balance: 'balance must be greater than or equal to 1000' },
      },
      {
        data: { accountType: 'business', balance: 1000, hasOverdraft: true },
        error: { overdraftLimit: 'Field is required' },
      },
    ],
  },
  {
    title: 'Conditional with empty if condition',
    schema: {
      if: {},
      then: { properties: { field: { minimum: 10 } } },
    },
    validTestCases: [{ data: { field: 10 } }],
    invalidTestCases: [
      { data: { field: 9 }, error: { field: 'field must be greater than or equal to 10' } },
    ],
  },
  {
    title: 'Multiple validations being applied to the same property',
    schema: {
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
      allOf: [
        {
          if: true,
          then: {
            properties: { age: { maximum: 65 } },
          },
        },
        {
          if: true,
          then: {
            properties: { age: { minimum: 18 } },
          },
        },
      ],
    },
    validTestCases: [{ data: { age: 20 } }],
    invalidTestCases: [
      { data: { age: 17 }, error: { age: 'age must be greater than or equal to 18' } },
      { data: { age: 66 }, error: { age: 'age must be less than or equal to 65' } },
    ],
  },
  {
    title: 'Conditional with not operator',
    schema: {
      properties: {
        age: { type: 'number' },
        guardian: { type: 'string' },
      },
      if: {
        not: { properties: { age: { minimum: 18 } } },
      },
      then: {
        required: ['guardian'],
      },
    },
    validTestCases: [{ data: { age: 17, guardian: 'John Doe' } }, { data: { age: 18 } }],
    invalidTestCases: [{ data: { age: 17 }, error: { guardian: 'Field is required' } }],
  },
];

export const notKeywordTestCases = [
  {
    title: 'Not a string',
    schema: { not: { type: 'string' } },
    validTestCases: [{ data: 123 }, { data: true }, { data: { foo: 'bar' } }, { data: [1, 2, 3] }],
    invalidTestCases: [{ data: 'hello', error: { '': 'does not match not schema' } }],
  },
  {
    title: 'Not with enum values',
    schema: {
      type: 'string',
      not: { enum: ['pending', 'rejected'] },
    },
    validTestCases: [{ data: 'approved' }, { data: 'completed' }],
    invalidTestCases: [
      { data: 'pending', error: { '': 'does not match not schema' } },
      { data: 'rejected', error: { '': 'does not match not schema' } },
    ],
  },
  {
    title: 'Not with pattern',
    schema: {
      type: 'string',
      not: { pattern: '^[0-9]+$' },
    },
    validTestCases: [{ data: 'abc' }, { data: 'abc123' }],
    invalidTestCases: [{ data: '123', error: { '': 'does not match not schema' } }],
  },
  {
    title: 'Not with object properties',
    schema: {
      type: 'object',
      not: {
        properties: {
          type: { const: 'admin' },
          active: { const: true },
        },
        required: ['type', 'active'],
      },
    },
    validTestCases: [
      { data: { type: 'user', active: true } },
      { data: { type: 'admin', active: false } },
      { data: { type: 'admin' } },
    ],
    invalidTestCases: [
      {
        data: { type: 'admin', active: true },
        error: { '': 'does not match not schema' },
      },
    ],
  },
  {
    title: 'Not with nested not',
    schema: {
      not: {
        not: {
          type: 'number',
        },
      },
    },
    validTestCases: [{ data: 42 }],
    invalidTestCases: [
      { data: 'string', error: { '': 'does not match not schema' } },
      { data: true, error: { '': 'does not match not schema' } },
    ],
  },
  {
    title: 'Not with array constraints',
    schema: {
      type: 'array',
      not: {
        minItems: 3,
        items: { type: 'number' },
      },
    },
    validTestCases: [{ data: [1, 2] }, { data: [1, 'string'] }, { data: [] }],
    invalidTestCases: [{ data: [1, 2, 3], error: { '': 'does not match not schema' } }],
  },
  {
    title: 'Not with number constraints',
    schema: {
      type: 'number',
      not: {
        minimum: 0,
        maximum: 100,
      },
    },
    validTestCases: [{ data: -1 }, { data: 101 }],
    invalidTestCases: [{ data: 50, error: { '': 'does not match not schema' } }],
  },

  {
    title: 'Not string with multiple constraints',
    schema: {
      not: {
        type: 'string',
        minLength: 5,
        pattern: '^[A-Z]',
      },
    },
    validTestCases: [{ data: 'abc' }, { data: 'lower' }, { data: 123 }],
    invalidTestCases: [{ data: 'Upper', error: { '': 'does not match not schema' } }],
  },
];

export const anyOfTestCases = [
  {
    title: 'Basic check',
    schema: {
      anyOf: [
        { type: 'string', maxLength: 5 },
        { type: 'number', minimum: 0 },
      ],
    },
    validTestCases: [{ data: 'short' }, { data: 12 }],
    invalidTestCases: [
      {
        data: 'toolong',
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: -1,
        error: {
          '': 'Invalid anyOf match',
        },
      },
    ],
  },
  {
    title: 'anyOf with different types',
    schema: {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
    validTestCases: [{ data: 'hello' }, { data: 42 }, { data: true }],
    invalidTestCases: [
      {
        data: { key: 'value' },
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: null,
        error: {
          '': 'Invalid anyOf match',
        },
      },
    ],
  },
  {
    title: 'anyOf with number ranges',
    schema: {
      type: 'number',
      anyOf: [
        { minimum: 0, maximum: 10 },
        { minimum: 20, maximum: 30 },
        { minimum: 40, maximum: 50 },
      ],
    },
    validTestCases: [{ data: 5 }, { data: 25 }, { data: 45 }],
    invalidTestCases: [
      {
        data: 15,
        error: { '': 'Invalid anyOf match' },
      },
      {
        data: 35,
        error: { '': 'Invalid anyOf match' },
      },
    ],
  },
  {
    title: 'anyOf with complex dependencies',
    schema: {
      type: 'object',
      anyOf: [
        {
          properties: {
            country: { const: 'US' },
            zipCode: { pattern: '^\\d{5}$' },
          },
          required: ['country', 'zipCode'],
        },
        {
          properties: {
            country: { const: 'UK' },
            postcode: { pattern: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$' },
          },
          required: ['country', 'postcode'],
        },
      ],
    },
    validTestCases: [
      {
        data: {
          country: 'US',
          zipCode: '12345',
        },
      },
      {
        data: {
          country: 'UK',
          postcode: 'SW1A 1AA',
        },
      },
    ],
    invalidTestCases: [
      {
        data: {
          country: 'US',
          zipCode: '1234',
        },
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: {
          country: 'UK',
          zipCode: '12345',
        },
        error: {
          '': 'Invalid anyOf match',
        },
      },
    ],
  },
  {
    description: 'nested anyOf, to check validation semantics',
    schema: {
      anyOf: [
        {
          anyOf: [
            {
              type: 'null',
            },
          ],
        },
      ],
    },
    validTestCases: [
      {
        data: null,
      },
    ],
    invalidTestCases: [
      {
        data: 123,
        error: { '': 'Invalid anyOf match' },
      },
    ],
  },
  {
    title: 'anyOf with one empty schema',
    schema: {
      anyOf: [
        { type: 'number' },
        {}, // empty schema matches anything
      ],
    },
    validTestCases: [
      { data: 'foo' },
      { data: 123 },
      { data: true },
      { data: null },
      { data: { key: 'value' } },
      { data: [1, 2, 3] },
    ],
    invalidTestCases: [],
  },
  {
    title: 'anyOf complex types',
    schema: {
      anyOf: [
        {
          properties: {
            bar: { type: 'integer' },
          },
          required: ['bar'],
        },
        {
          properties: {
            foo: { type: 'string' },
          },
          required: ['foo'],
        },
      ],
    },
    validTestCases: [
      { data: { bar: 2 } },
      { data: { foo: 'baz' } },
      { data: { foo: 'baz', bar: 2 } },
      { data: { foo: 'baz', bar: 2 } },
    ],
    invalidTestCases: [
      {
        data: { foo: 2, bar: 'quux' },
        error: {
          '': 'Invalid anyOf match',
        },
      },
    ],
  },
  {
    title: 'anyOf with boolean schemas, all false',
    schema: {
      anyOf: [false, false],
    },
    validTestCases: [], // nothing can be valid when all schemas are false
    invalidTestCases: [
      {
        data: 'foo',
        error: {
          '': 'Invalid anyOf match',
        },
      },
      // Additional test cases to verify all types fail
      {
        data: 123,
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: true,
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: null,
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: { key: 'value' },
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        data: [],
        error: {
          '': 'Invalid anyOf match',
        },
      },
      {
        title: 'anyOf with boolean schemas, some true',
        schema: {
          anyOf: [true, false],
        },
        validTestCases: [
          { data: 'foo' },
          { data: 123 },
          { data: true },
          { data: null },
          { data: { key: 'value' } },
          { data: [] },
          { data: undefined },
        ],
        invalidTestCases: [], // nothing can be invalid when any schema is true
      },
      {
        title: 'anyOf with boolean schemas, all true',
        schema: {
          anyOf: [true, true],
        },
        validTestCases: [
          { data: 'foo' },
          { data: 123 },
          { data: true },
          { data: false },
          { data: null },
          { data: { key: 'value' } },
          { data: [] },
          { data: undefined },
        ],
        invalidTestCases: [], // nothing can be invalid when all schemas are true
      },
    ],
  },
];

