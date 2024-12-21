export const defaultTestCases = [
  {
    title: 'invalid type for default',
    schema: {
      properties: {
        foo: {
          type: 'integer',
          default: [],
        },
      },
    },
    validTestCases: [{ data: { foo: 13 } }, { data: {} }],
  },
  {
    title: 'invalid string value for default',
    schema: {
      properties: {
        bar: {
          type: 'string',
          minLength: 4,
          default: 'bad',
        },
      },
    },
    validTestCases: [{ data: { bar: 'good' } }, { data: {} }],
  },
  {
    title: 'the default keyword does not do anything if the property is missing',
    schema: {
      type: 'object',
      properties: {
        alpha: {
          type: 'number',
          maximum: 3,
          default: 5,
        },
      },
    },
    validTestCases: [{ data: { alpha: 1 } }, { data: {} }],
    invalidTestCases: [{ data: { alpha: 5 } }],
  },
];
