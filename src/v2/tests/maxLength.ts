export const maxLengthTests = [
  {
    title: 'maxLength validation',
    schema: { maxLength: 2 },
    validTestCases: [
      { data: 'f' },
      { data: 'fo' },
      { data: 100 },
      { data: '\uD83D\uDCA9\uD83D\uDCA9' },
    ],
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'maxLength validation with a decimal',
    schema: { maxLength: 2.0 },
    validTestCases: [{ data: 'f' }],
    invalidTestCases: [{ data: 'foo' }],
  },
];
