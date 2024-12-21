export const multipleOfTests = [
  {
    title: 'by int',
    schema: { multipleOf: 2 },
    validTestCases: [{ data: 10 }, { data: 'foo' }],
    invalidTestCases: [{ data: 7 }],
  },
  {
    title: 'by number',
    schema: { multipleOf: 1.5 },
    validTestCases: [{ data: 0 }, { data: 4.5 }],
    invalidTestCases: [{ data: 35 }],
  },
  {
    title: 'by small number',
    schema: { multipleOf: 0.0001 },
    validTestCases: [{ data: 0.0075 }],
    invalidTestCases: [{ data: 0.00751 }],
  },
  {
    title: 'float division = inf',
    schema: { type: 'integer', multipleOf: 0.123456789 },
    invalidTestCases: [{ data: 1e308 }],
  },
  {
    title: 'small multiple of large integer',
    schema: { type: 'integer', multipleOf: 1e-8 },
    validTestCases: [{ data: 12391239123 }],
  },
];
