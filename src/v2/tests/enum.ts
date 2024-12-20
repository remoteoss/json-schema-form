export const enumTests = [
  {
    title: 'simple enum validation',
    schema: { enum: [1, 2, 3] },
    validTestCases: [{ data: 1 }, { data: 2 }, { data: 3 }],
    invalidTestCases: [{ data: 4 }],
  },
  {
    title: 'heterogeneous enum validation',
    schema: { enum: [6, 'foo', [], true, { foo: 12 }] },
    validTestCases: [{ data: [] }, { data: { foo: 12 } }],
    invalidTestCases: [{ data: null }, { data: { foo: false } }, { data: { foo: 12, boo: 42 } }],
  },
  {
    title: 'heterogeneous enum-with-null validation',
    schema: { enum: [6, null] },
    validTestCases: [{ data: null }, { data: 6 }],
    invalidTestCases: [{ data: 7 }, { data: 'foo' }],
  },
  {
    title: 'enums in properties',
    schema: {
      type: 'object',
      properties: {
        foo: { enum: ['foo'] },
        bar: { enum: ['bar'] },
      },
      required: ['bar'],
    },
    validTestCases: [{ data: { foo: 'foo', bar: 'bar' } }, { data: { bar: 'bar' } }],
    invalidTestCases: [
      { data: { foo: 'foot', bar: 'bar' } },
      { data: { foo: 'foo', bar: 'bart' } },
      { data: { foo: 'foo' } },
      { data: {} },
    ],
  },
];
