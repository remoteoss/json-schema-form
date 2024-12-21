export const dependenciesTestCases = [
  {
    title: 'dependencies',
    schema: {
      dependencies: {
        bar: ['foo'],
      },
    },
    validTestCases: [
      { data: {} },
      { data: { foo: 1 } },
      { data: { foo: 1, bar: 2 } },
      { data: ['bar'] },
      { data: 'foobar' },
      { data: 12 },
    ],
    invalidTestCases: [{ data: { bar: 2 } }],
  },
  {
    title: 'dependencies with empty array',
    schema: {
      dependencies: {
        bar: [],
      },
    },
    validTestCases: [{ data: {} }, { data: { bar: 2 } }, { data: 1 }],
  },
  {
    title: 'multiple dependencies',
    schema: {
      dependencies: { quux: ['foo', 'bar'] },
    },
    validTestCases: [
      { data: {} },
      { data: { foo: 1, bar: 2 } },
      { data: { foo: 1, bar: 2, quux: 3 } },
    ],
    invalidTestCases: [
      { data: { foo: 1, quux: 2 } },
      { data: { bar: 1, quux: 2 } },
      { data: { quux: 1 } },
    ],
  },
  {
    title: 'multiple dependencies subschema',
    schema: {
      dependencies: {
        bar: {
          properties: {
            foo: { type: 'integer' },
            bar: { type: 'integer' },
          },
        },
      },
    },
    validTestCases: [{ data: { foo: 1, bar: 2 } }, { data: { foo: 'quux' } }],
    invalidTestCases: [
      { data: { foo: 'quux', bar: 2 } },
      { data: { foo: 2, bar: 'quux' } },
      { data: { foo: 'quux', bar: 'quux' } },
    ],
  },
  {
    title: 'dependencies with boolean subschemas',
    schema: {
      dependencies: {
        foo: true,
        bar: false,
      },
    },
    validTestCases: [{ data: { foo: 1 } }, { data: {} }],
    invalidTestCases: [{ data: { bar: 2 } }, { data: { foo: 1, bar: 2 } }],
  },
  {
    title: 'dependencies with escaped characters',
    schema: {
      dependencies: {
        'foo\nbar': ['foo\rbar'],
        'foo\tbar': {
          minProperties: 4,
        },
        "foo'bar": { required: ['foo"bar'] },
        'foo"bar': ["foo'bar"],
      },
    },
    validTestCases: [
      {
        data: {
          'foo\nbar': 1,
          'foo\rbar': 2,
        },
      },
      {
        data: {
          'foo\tbar': 1,
          a: 2,
          b: 3,
          c: 4,
        },
      },
      {
        data: {
          "foo'bar": 1,
          'foo"bar': 2,
        },
      },
    ],
    invalidTestCases: [
      {
        data: {
          'foo\nbar': 1,
          foo: 2,
        },
      },
      //   {
      //     data: {
      //       'foo\tbar': 1,
      //       a: 2,
      //     },
      //   },
      {
        data: {
          "foo'bar": 1,
        },
      },
      {
        data: {
          'foo"bar': 2,
        },
      },
    ],
  },
  {
    title: 'dependent subschema incompatible with root',
    schema: {
      properties: {
        foo: {},
      },
      dependencies: {
        foo: {
          properties: {
            bar: {},
          },
          additionalProperties: false,
        },
      },
    },
    validTestCases: [{ data: { bar: 1 } }, { data: { baz: 1 } }],
    invalidTestCases: [{ data: { foo: 1 } }, { data: { foo: 1, bar: 2 } }],
  },
];
