export const minItemsTests = [
  {
    title: 'minItems validation',
    schema: { minItems: 1 },
    validTestCases: [{ data: [1, 2] }, { data: [1] }, { data: '' }],
    invalidTestCases: [{ data: [] }],
  },
  {
    title: 'minItems validation with a decimal',
    schema: { minItems: 1.0 },
    validTestCases: [{ data: [1, 2] }],
    invalidTestCases: [{ data: [] }],
  },
];
