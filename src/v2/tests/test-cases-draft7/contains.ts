export const containsTestCases = [
  {
    title: 'contains validation',
    schema: {
      contains: { minimum: 5 },
    },
    validTestCases: [
      { data: [3, 4, 5] },
      { data: [3, 4, 6] },
      { data: [3, 4, 5, 6] },
      { data: {} },
    ],
    invalidTestCases: [{ data: [2, 3, 4] }, { data: [] }],
  },
  {
    title: 'contains keyword with const keyword',
    schema: {
      contains: { const: 5 },
    },
    validTestCases: [{ data: [3, 4, 5] }, { data: [3, 4, 5, 5] }],
    invalidTestCases: [{ data: [1, 2, 3, 4] }],
  },
  {
    title: 'contains keyword with boolean schema true',
    schema: { contains: true },
    validTestCases: [{ data: ['foo'] }],
    invalidTestCases: [{ data: [] }],
  },
  {
    title: 'contains with null instance elements',
    schema: {
      contains: {
        type: 'null',
      },
    },
    validTestCases: [{ data: [null] }],
  },
];
