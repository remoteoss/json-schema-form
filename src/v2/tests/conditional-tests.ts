export const basicConditionalTestCases = [
  //   {
  //     title: 'Basic if/then condition',
  //     schema: {
  //       type: 'object',
  //       properties: {
  //         field: { type: 'string' },
  //         otherField: { type: 'string' },
  //       },
  //       if: {
  //         properties: {
  //           field: { const: 'yes' },
  //         },
  //         required: ['field'],
  //       },
  //       then: {
  //         required: ['otherField'],
  //       },
  //     } as const,
  //     validTestCases: [{ data: { field: 'no' } }, { data: { field: 'yes', otherField: 'test' } }],
  //     invalidTestCases: [
  //       {
  //         data: { field: 'yes' },
  //         error: { otherField: 'Field is required' },
  //       },
  //     ],
  //   },
  {
    title: 'Basic if/then/else condition',
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        number: { type: 'number' },
      },
      if: {
        properties: {
          field: { const: 'yes' },
        },
      },
      then: {
        properties: {
          number: { minimum: 10 },
        },
      },
      else: {
        properties: {
          number: { minimum: 5 },
        },
      },
    } as const,
    validTestCases: [{ data: { field: 'yes', number: 10 } }, { data: { field: 'no', number: 5 } }],
    invalidTestCases: [{ data: { field: 'yes', number: 9 } }],
  },
];
