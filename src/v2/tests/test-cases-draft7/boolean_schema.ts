export const booleanTestCases = [
  {
    title: 'boolean schema true',
    schema: true,
    validTestCases: [
      { data: 1 },
      { data: 'foo' },
      { data: true },
      { data: false },
      { data: null },
      { data: { foo: 'bar' } },
      { data: {} },
      { data: [] },
      { data: ['foo'] },
    ],
  },
  {
    title: 'boolean schema false',
    schema: false,
    invalidTestCases: [
      { data: 1 },
      { data: 'foo' },
      { data: true },
      { data: false },
      { data: null },
      { data: { foo: 'bar' } },
      { data: {} },
      { data: [] },
      { data: ['foo'] },
    ],
  },
];
