export const allOfTestCases = [
  {
    title: 'allOf',
    schema: {
      allOf: [
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
    validTestCases: [{ data: { foo: 'baz', bar: 2 } }],
    invalidTestCases: [
      { data: { foo: 'baz' } },
      { data: { bar: 2 } },
      { data: { foo: 'baz', bar: 'quux' } },
    ],
  },
  {
    title: 'allOf with base schema',
    schema: {
      properties: { bar: { type: 'integer' } },
      required: ['bar'],
      allOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
          required: ['foo'],
        },
        {
          properties: {
            baz: { type: 'null' },
          },
          required: ['baz'],
        },
      ],
    },
    validTestCases: [{ data: { foo: 'quux', bar: 2, baz: null } }],
    invalidTestCases: [
      { data: { foo: 'quux', baz: null } },
      { data: { bar: 2, baz: null } },
      { data: { foo: 'quux', bar: 2 } },
      { data: { bar: 2 } },
    ],
  },
  {
    title: 'allOf simple types',
    schema: {
      allOf: [{ maximum: 30 }, { minimum: 20 }],
    },
    validTestCases: [{ data: 25 }],
    invalidTestCases: [{ data: 35 }],
  },
  {
    title: 'allOf with boolean schemas, all true',
    schema: { allOf: [true, true] },
    validTestCases: [{ data: 'foo' }],
  },
  {
    title: 'allOf with boolean schemas, some false',
    schema: { allOf: [true, false] },
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'allOf with boolean schemas, all false',
    schema: { allOf: [false, false] },
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'allOf with one empty schema',
    schema: {
      allOf: [{}],
    },
    validTestCases: [{ data: 1 }],
  },
  {
    title: 'allOf with two empty schemas',
    schema: { allOf: [{}, {}] },
    validTestCases: [{ data: 1 }],
  },
  {
    title: 'allOf with the first empty schema',
    schema: {
      allOf: [{}, { type: 'number' }],
    },
    validTestCases: [{ data: 1 }],
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'allOf with the last empty schema',
    schema: {
      allOf: [{ type: 'number' }, {}],
    },
    validTestCases: [{ data: 1 }],
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'nested allOf, to check validation semantics',
    schema: {
      allOf: [
        {
          allOf: [
            {
              type: 'null',
            },
          ],
        },
      ],
    },
    validTestCases: [{ data: null }],
    invalidTestCases: [{ data: 123 }],
  },
  {
    title: 'allOf combined with anyOf, oneOf',
    schema: {
      allOf: [{ multipleOf: 2 }],
      anyOf: [{ multipleOf: 3 }],
      oneOf: [{ multipleOf: 5 }],
    },
    validTestCases: [{ data: 30 }],
    invalidTestCases: [
      { data: 1 },
      { data: 5 },
      { data: 3 },
      { data: 15 },
      { data: 2 },
      { data: 10 },
      { data: 6 },
    ],
  },
];
