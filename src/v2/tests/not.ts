export const notTestCases = [
  {
    title: 'not',
    schema: { not: { type: 'integer' } },
    validTestCases: [{ data: 'foo' }],
    invalidTestCases: [{ data: 1 }],
  },
  {
    title: 'not multiple types',
    schema: { not: { type: ['integer', 'boolean'] } },
    validTestCases: [{ data: 'foo' }],
    invalidTestCases: [{ data: 1 }, { data: true }],
  },
  {
    title: 'not more complex schema',
    schema: {
      not: {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      },
    },
    validTestCases: [{ data: 1 }, { data: { foo: 1 } }],
    invalidTestCases: [{ data: { foo: 'bar' } }],
  },
  {
    title: 'forbidden property',
    schema: {
      properties: {
        foo: {
          not: {},
        },
      },
    },
    validTestCases: [{ data: { bar: 1, baz: 2 } }],
    invalidTestCases: [{ data: { foo: 1, bar: 2 } }],
  },
];
