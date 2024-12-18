const specialObjectWithProto = Object.create(null);
specialObjectWithProto.toString = { length: 'foo' };
specialObjectWithProto.constructor = 37;
specialObjectWithProto.__proto__ = 12;

export const requiredTestCases = [
  {
    title: 'required validation',
    schema: {
      properties: {
        foo: {},
        bar: {},
      },
      required: ['foo'],
    } as const,
    validTestCases: [{ data: { foo: 1 } }, { data: [] }, { data: '' }, { data: 12 }],
    invalidTestCases: [{ data: { bar: 1 } }],
  },
  {
    title: 'required default validation',
    schema: {
      properties: {
        foo: {},
      },
    },
    validTestCases: [{ data: {} }],
  },
  {
    title: 'required with empty array',
    schema: {
      properties: {
        foo: {},
      },
      required: [],
    },
    validTestCases: [{ data: {} }],
  },
  {
    title: 'required with escaped characters',
    schema: {
      required: [`foo\nbar`, `foo\"bar`, `foo\\bar`, `foo\rbar`, `foo\tbar`, `foo\fbar`],
    },
    validTestCases: [
      {
        data: {
          'foo\nbar': 1,
          'foo"bar': 1,
          'foo\\bar': 1,
          'foo\rbar': 1,
          'foo\tbar': 1,
          'foo\fbar': 1,
        },
      },
    ],
    invalidTestCases: [
      {
        data: {
          'foo\nbar': '1',
          'foo"bar': '1',
        },
      },
    ],
  },
  {
    title: 'required properties whose names are Javascript object property names',
    schema: { required: ['__proto__', 'toString', 'constructor'] } as const,
    validTestCases: [
      { data: [] },
      { data: 12 },
      {
        data: specialObjectWithProto,
      },
    ],
    invalidTestCases: [
      { data: {} },
      { data: { __proto__: 'foo' } },
      { data: { toString: { length: 37 } } },
      { data: { constructor: { length: 37 } } },
    ],
  },
];
