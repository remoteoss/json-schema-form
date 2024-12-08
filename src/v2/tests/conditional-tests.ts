export const basicConditionalTestCases = [
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
      //   {
      //     data: { accountType: 'business', balance: 999 },
      //     error: { balance: 'number must be greater than or equal to 1000' },
      //   },
      {
        data: { accountType: 'business', balance: 1000, hasOverdraft: true },
        error: { overdraftLimit: 'Field is required' },
      },
    ],
  },
];
