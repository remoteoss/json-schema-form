export const uniqueItemsTestCases = [
  {
    title: 'Unique items',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [1, 2] }, { data: ['a', 'b', 'c'] }, { data: [] }],
    invalidTestCases: [{ data: [1, 1, 2] }, { data: ['a', 'b', 'a'] }, { data: [1, 2, 1] }],
  },
  {
    title: 'Numbers are unique if mathematically unequal',
    schema: {
      uniqueItems: true,
    },
    invalidTestCases: [{ data: [1.0, 1] }],
  },
  {
    title: 'false is not equal to zero',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [false, 0] }],
  },
  {
    title: 'true is not equal to one',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [true, 1] }],
  },
  {
    title: 'unique array of objects are valid',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [{ a: 1 }, { b: 2 }] }],
  },
  {
    title: 'non-unique array of objects are invalid',
    schema: {
      uniqueItems: true,
    },
    invalidTestCases: [{ data: [{ foo: 'bar' }, { foo: 'bar' }] }],
  },
  {
    title: 'property order of array of objects is ignored',
    schema: {
      uniqueItems: true,
    },
    invalidTestCases: [
      {
        data: [
          { foo: 'bar', bar: 'foo' },
          { bar: 'foo', foo: 'bar' },
        ],
      },
    ],
  },
  {
    title: 'Array of nested objects',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [{ foo: { bar: { baz: true } } }, { foo: { bar: { baz: false } } }] }],
    invalidTestCases: [
      { data: [{ foo: { bar: { baz: true } } }, { foo: { bar: { baz: true } } }] },
    ],
  },
  {
    title: 'Array of arrays',
    schema: {
      uniqueItems: true,
    },
    validTestCases: [{ data: [['foo'], ['bar']] }],
    invalidTestCases: [{ data: [['foo'], ['foo']] }, { data: [['foo'], ['bar'], ['foo']] }],
  },
  {
    title: 'Corner cases',
    schema: { uniqueItems: true },
    validTestCases: [
      { data: [1, true] },
      { data: [0, false] },
      { data: [[1], [true]] },
      { data: [[0], [false]] },
      {
        data: [
          [[1], 'foo'],
          [[true], 'foo'],
        ],
      },
      {
        data: [
          [[0], 'foo'],
          [[false], 'foo'],
        ],
      },
      {
        data: [{}, [1], true, null, 1, '{}'],
      },
      { data: [{ a: false }, { a: 0 }] },
      { data: [{ a: true }, { a: 1 }] },
    ],
    invalidTestCases: [{ data: [{}, [1], true, null, {}, 1] }],
  },
  {
    title: 'different objects are unique',
    schema: { uniqueItems: true },
    validTestCases: [
      { a: 1, b: 2 },
      { a: 2, b: 1 },
    ],
  },
  {
    title: 'objects are non-unique despite key order',
    schema: { uniqueItems: true },
    invalidTestCases: [
      {
        data: [
          { a: 1, b: 2 },
          { b: 2, a: 1 },
        ],
      },
    ],
  },
];
