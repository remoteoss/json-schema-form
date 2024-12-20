export const constTestCases = [
  {
    title: 'const validation',
    schema: { const: 2 },
    validTestCases: [{ data: 2 }],
    invalidTestCases: [{ data: 3 }, { data: 'x' }],
  },
  {
    title: 'const with object',
    schema: { const: { foo: 'bar', baz: 'bax' } },
    validTestCases: [{ data: { foo: 'bar', baz: 'bax' } }, { data: { baz: 'bax', foo: 'bar' } }],
    invalidTestCases: [{ data: { foo: 'bar' } }, { data: [1, 2] }],
  },
  {
    title: 'const with array',
    schema: { const: [{ foo: 'bar' }] },
    validTestCases: [{ data: [{ foo: 'bar' }] }],
    invalidTestCases: [{ data: [2] }, { data: [1, 2, 3] }],
  },
  {
    title: 'const with null',
    schema: { const: null },
    validTestCases: [{ data: null }],
    invalidTestCases: [{ data: 0 }],
  },
  {
    title: 'const with false does not match 0',
    schema: { const: false },
    validTestCases: [{ data: false }],
    invalidTestCases: [{ data: 0 }, { data: 0.0 }],
  },
  {
    title: 'const with true does not match 1',
    schema: { const: true },
    validTestCases: [{ data: true }],
    invalidTestCases: [{ data: 1 }, { data: 1.0 }],
  },
  {
    title: 'const with [false] does not match [0]',
    schema: { const: [false] },
    validTestCases: [{ data: [false] }],
    invalidTestCases: [{ data: [0] }, { data: [0.0] }],
  },
  {
    title: 'const with [true] does not match [1]',
    schema: { const: [true] },
    validTestCases: [{ data: [true] }],
    invalidTestCases: [{ data: [1] }, { data: [1.0] }],
  },
  {
    title: 'const with {"a": false} does not match {"a": 0}',
    schema: { const: { a: false } },
    validTestCases: [{ data: { a: false } }],
    invalidTestCases: [{ data: { a: 0 } }, { data: { a: 0.0 } }],
  },
  {
    title: 'const with {"a": true} does not match {"a": 1}',
    schema: { const: { a: true } },
    validTestCases: [{ data: { a: true } }],
    invalidTestCases: [{ data: { a: 1 } }, { data: { a: 1.0 } }],
  },
  {
    title: 'const with 0 does not match other zero-like types',
    schema: { const: 0 },
    validTestCases: [{ data: 0 }],
    invalidTestCases: [{ data: false }],
  },
];
