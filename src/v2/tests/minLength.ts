export const minLengthTests = [
  {
    title: 'minLength validation',
    schema: { minLength: 2 },
    validTestCases: [{ data: 'foo' }, { data: 'fo' }, { data: 1 }],
    invalidTestCases: [{ data: 'f' }, { data: '\uD83D\uDCA9' }],
  },
  {
    title: 'minLength validation with a decimal',
    schema: { minLength: 2.0 },
    validTestCases: [{ data: 'foo' }],
    invalidTestCases: [{ data: 'f' }],
  },
];
