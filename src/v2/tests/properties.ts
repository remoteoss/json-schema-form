export const propertiesTestCases = [
  {
    title: 'object properties validation',
    schema: {
      properties: {
        foo: { type: 'integer' },
        bar: { type: 'string' },
      },
    },
    validTestCases: [{ data: { foo: 1, bar: 'baz' } }],
    invalidTestCases: [{ data: { foo: 1, bar: {} } }],
  },
];
