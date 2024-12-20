export const enumTests = [
  {
    title: 'simple enum validation',
    schema: { enum: [1, 2, 3] },
    validTestCases: [{ data: 1 }, { data: 2 }, { data: 3 }],
    invalidTestCases: [{ data: 4 }],
  },
  {
    title: 'heterogeneous enum validation',
    schema: { enum: [6, 'foo', [], true, { foo: 12 }] },
    validTestCases: [{ data: [] }, { data: { foo: 12 } }],
    invalidTestCases: [{ data: null }, { data: { foo: false } }, { data: { foo: 12, boo: 42 } }],
  },
  {
    title: 'heterogeneous enum-with-null validation',
    schema: { enum: [6, null] },
    validTestCases: [{ data: null }, { data: 6 }],
    invalidTestCases: [{ data: 7 }, { data: 'foo' }],
  },
  {
    title: 'enums in properties',
    schema: {
      type: 'object',
      properties: {
        foo: { enum: ['foo'] },
        bar: { enum: ['bar'] },
      },
      required: ['bar'],
    },
    validTestCases: [{ data: { foo: 'foo', bar: 'bar' } }, { data: { bar: 'bar' } }],
    invalidTestCases: [
      { data: { foo: 'foot', bar: 'bar' } },
      { data: { foo: 'foo', bar: 'bart' } },
      { data: { foo: 'foo' } },
      { data: {} },
    ],
  },
  {
    title: 'enum with escaped characters',
    schema: {
      enum: ['foo\nbar', 'foo\rbar'],
    },
    validTestCases: [{ data: 'foo\nbar' }, { data: 'foo\rbar' }],
    invalidTestCases: [{ data: 'abc' }],
  },
  {
    title: 'enum with false does not match 0',
    schema: { enum: [false] },
    validTestCases: [{ data: false }],
    invalidTestCases: [{ data: 0 }, { data: 0.0 }],
  },
  {
    title: 'enum with [false] does not match [0]',
    schema: { enum: [[false]] },
    validTestCases: [{ data: [false] }],
    invalidTestCases: [{ data: [0] }, { data: [0.0] }],
  },
  {
    title: 'enum with true does not match 1',
    schema: { enum: [true] },
    validTestCases: [{ data: true }],
    invalidTestCases: [{ data: 1 }, { data: 1.0 }],
  },
  {
    title: 'enum with [true] does not match [1]',
    schema: { enum: [[true]] },
    validTestCases: [{ data: [true] }],
    invalidTestCases: [{ data: [1] }, { data: [1.0] }],
  },
  {
    title: 'enum with 0 does not match false',
    schema: { enum: [0] },
    validTestCases: [{ data: 0 }, { data: 0.0 }],
    invalidTestCases: [{ data: false }],
  },
  {
    title: 'enum with [0] does not match [false]',
    schema: { enum: [[0]] },
    validTestCases: [{ data: [0] }, { data: [0.0] }],
    invalidTestCases: [{ data: [false] }],
  },
  {
    title: 'enum with 1 does not match true',
    schema: { enum: [1] },
    validTestCases: [{ data: 1 }, { data: 1.0 }],
    invalidTestCases: [{ data: true }],
  },
  {
    title: 'enum with [1] does not match [true]',
    schema: { enum: [[1]] },
    validTestCases: [{ data: [1] }, { data: [1.0] }],
    invalidTestCases: [{ data: [true] }],
  },
  {
    title: 'null characters in strings',
    schema: { enum: ['hello\u0000there'] },
    validTestCases: [{ data: 'hello\u0000there' }],
    invalidTestCases: [{ data: 'hellothere' }],
  },
];
