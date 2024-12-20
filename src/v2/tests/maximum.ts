export const maximumTests = [
  {
    title: 'maximum validation',
    schema: { maximum: 3.0 },
    validTestCases: [{ data: 2.6 }, { data: 3.0 }, { data: 'x' }],
    invalidTestCases: [{ data: 3.5 }],
  },
  {
    title: 'maximum validation with unsigned integer',
    schema: { maximum: 300 },
    validTestCases: [{ data: 299.97 }, { data: 300 }, { data: 300.0 }],
    invalidTestCases: [{ data: 300.5 }],
  },
];
