export const exclusiveMinimumTests = [
  {
    title: 'exclusiveMinimum',
    schema: { exclusiveMinimum: 1.1 },
    validTestCases: [{ data: 1.2 }, { data: 'x' }],
    invalidTestCases: [{ data: 1.1 }, { data: 0.6 }],
  },
];
