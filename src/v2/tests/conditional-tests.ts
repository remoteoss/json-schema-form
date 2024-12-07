export const basicConditionalTestCases = [
  {
    title: 'Basic conditional',
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
      },
      if: { properties: { field: { type: 'string' } } },
    },
  },
];
