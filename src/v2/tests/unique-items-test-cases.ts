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
  {
    title: 'uniqueItems with an array of items',
    schema: {
      items: [{ type: 'boolean' }, { type: 'boolean' }],
      uniqueItems: true,
    },
    validTestCases: [
      { data: [true, false] },
      { data: [false, true] },
      { data: [false, true, 'foo', 'bar'] },
      { data: [true, false, 'foo', 'bar'] },
    ],
    invalidTestCases: [
      { data: [true, true] },
      { data: [false, false] },
      { data: [false, true, 'foo', 'foo'] },
      { data: [true, false, 'foo', 'foo'] },
    ],
  },
  {
    title: 'uniqueItems with an array of items and additionalItems=false',
    schema: {
      items: [{ type: 'boolean' }, { type: 'boolean' }],
      uniqueItems: true,
      additionalItems: false,
    },
    validTestCases: [{ data: [true, false] }, { data: [false, true] }],
    invalidTestCases: [
      { data: [true, true] },
      { data: [false, false] },
      { data: [false, true, null] },
    ],
  },
  {
    title: 'uniqueItems=false with an array of items and additionalItems=false',
    schema: {
      items: [{ type: 'boolean' }, { type: 'boolean' }],
      uniqueItems: false,
      additionalItems: false,
    },
    validTestCases: [
      { data: [false, true] },
      { data: [true, false] },
      { data: [false, false] },
      { data: [true, true] },
    ],
    invalidTestCases: [
      {
        data: [false, true, null],
      },
    ],
  },
];

