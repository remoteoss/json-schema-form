export const stringTestCases = [
  {
    title: 'String length constraints',
    schema: { type: 'string', minLength: 5, maxLength: 10 } as const,
    validTestCases: [{ data: 'hello' }, { data: 'helloworld' }],
    invalidTestCases: [
      {
        data: 'hi',
        error: { '': 'this must be at least 5 characters' },
      },
      {
        data: 'helloworldtoolong',
        error: { '': 'this must be at most 10 characters' },
      },
    ],
  },
  {
    title: 'String pattern matching',
    schema: { type: 'string', pattern: '^[a-z]+$' } as const,
    validTestCases: [{ data: 'hello' }, { data: 'world' }],
    invalidTestCases: [
      {
        data: 'hello!',
        error: { '': 'this must match the following: "/^[a-z]+$/"' },
      },
      {
        data: 'Hello',
        error: { '': 'this must match the following: "/^[a-z]+$/"' },
      },
    ],
  },
  {
    title: 'String enum validation',
    schema: { type: 'string', enum: ['hello', 'world'] } as const,
    validTestCases: [{ data: 'hello' }, { data: 'world' }],
    invalidTestCases: [
      {
        data: 'goodbye',
        error: { '': 'this must be one of the following values: hello, world' },
      },
    ],
  },
  {
    title: 'Date format validation',
    schema: { type: 'string', format: 'date' } as const,
    validTestCases: [{ data: '2024-01-01' }, { data: '2024-12-31' }],
    invalidTestCases: [
      {
        data: 'banana',
        error: { '': 'this must be a valid date' },
      },
      {
        data: '2024-02-31',
        error: { '': 'this must be a valid date' },
      },
      {
        data: '2024-2-1',
        error: { '': 'this must be a valid date' },
      },
    ],
  },
  {
    title: 'Const with no type',
    schema: { const: 'yes' } as const,
    validTestCases: [{ data: 'yes' }],
    invalidTestCases: [
      {
        data: 'no',
        error: { '': 'this must be equal to constant: "yes"' },
      },
    ],
  },
  {
    title: 'String with if/then/else',
    schema: {
      type: 'string',
      if: { pattern: '^[0-9]+$' },
      then: { maxLength: 5 },
      else: { maxLength: 10 },
    },
    validTestCases: [{ data: '12345' }, { data: 'H123456790' }],
    invalidTestCases: [{ data: '101010', error: { '': 'this must be at most 5 characters' } }],
  },
];

export const numberTestCases = [
  {
    title: 'Number range validation',
    schema: { type: 'number', minimum: 5, maximum: 10 } as const,
    validTestCases: [{ data: 5 }, { data: 7.5 }, { data: 10 }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'this must be greater than or equal to 5' },
      },
      {
        data: 11,
        error: { '': 'this must be less than or equal to 10' },
      },
    ],
  },
];

export const nullTestCases = [
  {
    title: 'Null const validation',
    schema: { const: null } as const,
    validTestCases: [{ data: null }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'this must be equal to constant: null' },
      },
    ],
  },
  {
    title: 'Multi-type with null',
    schema: { type: ['string', 'null'] } as const,
    validTestCases: [{ data: null }, { data: 'hello' }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'Expected string or null, but got number.' },
      },
    ],
  },
  {
    title: 'Multi-type with null',
    schema: { type: ['string', 'number', 'null'] } as const,
    validTestCases: [{ data: null }, { data: 'hello' }, { data: 1 }],
    invalidTestCases: [
      {
        data: true,
        error: { '': 'Expected string or number or null, but got boolean.' },
      },
    ],
  },
];

export const multiTypeTestCases = [
  {
    title: 'String or number validation',
    schema: { type: ['string', 'number'] } as const,
    validTestCases: [{ data: 'hello' }, { data: 42 }],
    invalidTestCases: [
      {
        data: true,
        error: { '': 'Expected string or number, but got boolean.' },
      },
    ],
  },
  {
    title: 'Number with constraints in multi-type',
    schema: { type: ['string', 'number'], minimum: 5 } as const,
    validTestCases: [{ data: 'hello' }, { data: 10 }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'this must be greater than or equal to 5' },
      },
    ],
  },
];

export const objectTestCases = [
  {
    title: 'Object with property constraints',
    schema: {
      type: 'object',
      properties: { field: { type: 'string' } },
      required: ['field'],
    } as const,
    validTestCases: [{ data: { field: 'hello' } }],
    invalidTestCases: [
      {
        data: { field: 123 },
        error: { field: 'field must be a `string` type, but the final value was: `123`.' },
      },
      {
        data: {},
        error: { field: 'Field is required' },
      },
    ],
  },
];

export const arrayTestCases = [
  {
    title: 'Array with item constraints',
    schema: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 3,
    } as const,
    validTestCases: [{ data: ['one'] }, { data: ['one', 'two', 'three'] }],
    invalidTestCases: [
      {
        data: [],
        error: { '': 'this field must have at least 1 items' },
      },
      {
        data: ['one', 'two', 'three', 'four'],
        error: { '': 'this field must have less than or equal to 3 items' },
      },
      {
        data: ['one', 2],
        error: { '1': '[1] must be a `string` type, but the final value was: `2`.' },
      },
    ],
  },
];
