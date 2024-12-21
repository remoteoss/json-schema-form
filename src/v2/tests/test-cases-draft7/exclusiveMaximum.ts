export const exclusiveMaximumTests = [
  {
    title: 'exclusiveMaximum',
    schema: { exclusiveMaximum: 3.0 },
    validTestCases: [{ data: 2.2 }, { data: 'x' }],
    invalidTestCases: [{ data: 3.0 }, { data: 3.5 }],
  },
];
