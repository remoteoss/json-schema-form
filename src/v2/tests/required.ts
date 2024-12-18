export const requiredTestCases = [
  {
    title: 'required validation',
    schema: {
      properties: {
        foo: {},
        bar: {},
      },
      required: ['foo'],
    },
    validTestCases: [{ data: { foo: 1 } }, { data: [] }],
    invalidTestCases: [{ data: { bar: 1 } }],
  },
];
