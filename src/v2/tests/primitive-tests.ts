export const stringTestCases = [
  {
    title: 'Basic string validation',
    schema: { type: 'string' } as const,
    validTestCases: [{ data: 'hello' }, { data: '' }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'this must be a `string` type, but the final value was: `1`.' },
      },
    ],
  },
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
        error: { '': 'does not validate against format "date"' },
      },
      {
        data: '2024-02-31',
        error: { '': 'does not validate against format "date"' },
      },
      {
        data: '2024-2-1',
        error: { '': 'does not validate against format "date"' },
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
        error: { '': 'this must be one of the following values: yes' },
      },
    ],
  },
];

export const numberTestCases = [
  {
    title: 'Basic number validation',
    schema: { type: 'number' } as const,
    validTestCases: [{ data: 1 }, { data: 1.5 }, { data: 0 }, { data: -1 }],
    invalidTestCases: [
      {
        data: '1',
        error: { '': 'this must be a `number` type, but the final value was: `"1"`.' },
      },
    ],
  },
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
  {
    title: 'Integer validation',
    schema: { type: 'integer' } as const,
    validTestCases: [{ data: 1 }, { data: 0 }, { data: -1 }],
    invalidTestCases: [
      {
        data: 1.5,
        error: { '': 'this must be an integer' },
      },
    ],
  },
];

export const booleanTestCases = [
  {
    title: 'Boolean validation',
    schema: { type: 'boolean' } as const,
    validTestCases: [{ data: true }, { data: false }],
    invalidTestCases: [
      {
        data: 'true',
        error: { '': 'this must be a `boolean` type, but the final value was: `"true"`.' },
      },
    ],
  },
  {
    title: 'Boolean const validation',
    schema: { const: true } as const,
    validTestCases: [{ data: true }],
    invalidTestCases: [
      {
        data: false,
        error: { '': 'this must be one of the following values: true' },
      },
    ],
  },
];

export const nullTestCases = [
  {
    title: 'Null validation',
    schema: { type: 'null' } as const,
    validTestCases: [{ data: null }],
    invalidTestCases: [
      {
        data: 'null',
        error: { '': 'Value must be null' },
      },
    ],
  },
  {
    title: 'Null const validation',
    schema: { const: null } as const,
    validTestCases: [{ data: null }],
    invalidTestCases: [
      {
        data: 1,
        error: { '': 'Value must be null' },
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
    title: 'Basic object validation',
    schema: { type: 'object' } as const,
    validTestCases: [{ data: {} }, { data: { a: 1, b: 'hello' } }],
    invalidTestCases: [
      {
        data: 'not-an-object',
        error: { '': 'this must be a `object` type, but the final value was: `"not-an-object"`.' },
      },
    ],
  },
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
    title: 'Basic array validation',
    schema: { type: 'array' } as const,
    validTestCases: [{ data: [] }, { data: [1, 'two', true] }],
    invalidTestCases: [
      {
        data: 'not-an-array',
        error: { '': 'this must be a `array` type, but the final value was: `"not-an-array"`.' },
      },
    ],
  },
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