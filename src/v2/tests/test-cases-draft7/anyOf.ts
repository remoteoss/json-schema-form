export const anyOfTestCases = [
  {
    title: 'anyOf',
    schema: {
      anyOf: [
        {
          type: 'integer',
        },
        {
          minimum: 2,
        },
      ],
    },
    validTestCases: [{ data: 1 }, { data: 2.5 }, { data: 3 }],
    invalidTestCases: [{ data: 1.5 }],
  },
  {
    title: 'anyOf with base schema',
    schema: {
      type: 'string',
      anyOf: [
        {
          maxLength: 2,
        },
        {
          minLength: 4,
        },
      ],
    },
    validTestCases: [{ data: 'foobar' }],
    invalidTestCases: [{ data: 3 }, { data: 'foo' }],
  },
  {
    title: 'anyOf with boolean schemas, all true',
    schema: { anyOf: [true, true] },
    validTestCases: [{ data: 'foo' }, { data: 'bar' }],
  },
  {
    title: 'anyOf with boolean schemas, some true',
    schema: { anyOf: [true, false] },
    validTestCases: [{ data: 'foo' }],
  },
  {
    title: 'anyOf with boolean schemas, all false',
    schema: { anyOf: [false, false] },
    invalidTestCases: [{ data: 'foo' }],
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
    ],
    invalidTestCases: [{ data: { foo: 2, bar: 'quux' } }],
  },
  {
    title: 'anyOf with one empty schema',
    schema: {
      anyOf: [{ type: 'number' }, {}],
    },
    validTestCases: [{ data: 'foo' }, { data: 123 }],
  },
  {
    title: 'nested anyOf, to check validation semantics',
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
    validTestCases: [{ data: null }],
    invalidTestCases: [{ data: 123 }],
  },
];
