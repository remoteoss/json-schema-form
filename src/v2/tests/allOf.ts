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
  },
];
