export const patternTestCases = [
  {
    title: 'pattern validation',
    schema: { pattern: '^a*$' },
    validTestCases: [
      { data: 'aaa' },
      { data: true },
      { data: 123 },
      { data: 1.0 },
      { data: {} },
      { data: [] },
      { data: null },
      { data: undefined },
    ],
    invalidTestCases: [{ data: 'abc' }],
  },
  {
    title: 'pattern is not anchored',
    schema: { pattern: 'a+' },
    validTestCases: [{ data: 'xxaayy' }],
  },
];
