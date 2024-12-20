export const minimumTests = [
  {
    title: 'minimum',
    schema: { minimum: 1.1 },
    validTestCases: [{ data: 2.6 }, { data: 1.1 }, { data: 'x' }],
    invalidTestCases: [{ data: 0.6 }],
  },
  {
    title: 'minimum validation with signed integer',
    schema: { minimum: -2 },
    validTestCases: [{ data: -1 }, { data: 0 }, { data: -2 }, { data: -2.0 }, { data: 'x' }],
    invalidTestCases: [{ data: -2.0001 }, { data: -3 }],
  },
];
