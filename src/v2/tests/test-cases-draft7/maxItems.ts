export const maxItemsTests = [
  {
    title: 'maxItems validation',
    schema: { maxItems: 2 },
    validTestCases: [{ data: [1] }, { data: [1, 2] }, { data: 'foobar' }],
    invalidTestCases: [{ data: [1, 2, 3] }],
  },
  {
    title: 'maxItems validation with a decimal',
    schema: { maxItems: 2.0 },
    validTestCases: [{ data: [1] }],
    invalidTestCases: [{ data: [1, 2, 3] }],
  },
];
