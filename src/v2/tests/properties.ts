export const propertiesTestCases = [
  {
    title: 'object properties validation',
    schema: {
      properties: {
        foo: { type: 'integer' },
        bar: { type: 'string' },
      },
    },
    validTestCases: [
      { data: { foo: 1, bar: 'baz' } },
      { data: { quux: [] } },
      { data: [] },
      { data: 12 },
    ],
    invalidTestCases: [{ data: { foo: 1, bar: {} } }, { data: { foo: [], bar: {} } }],
  },
  {
    title: 'properties, patternProperties, additionalProperties interaction',
    schema: {
      properties: {
        foo: { type: 'array', maxItems: 3 },
        bar: { type: 'array' },
      },
      patternProperties: { 'f.o': { minItems: 2 } },
      additionalProperties: { type: 'integer' },
    },
    validTestCases: [
      { data: { foo: [1, 2] } },
      { data: { fxo: [1, 2] } },
      { data: { bar: [] } },
      { data: { quux: 3 } },
    ],
    invalidTestCases: [
      { data: { foo: [1, 2, 3, 4] } },
      { data: { fxo: [] } },
      { data: { foo: [] }, error: { foo: 'this field must have at least 2 items' } },
      {
        data: { quux: 'foo' },
        error: { quux: 'this must be a `number` type, but the final value was: `"foo"`.' },
      },
    ],
  },
  {
    title: 'properties with boolean schema',
    schema: {
      properties: {
        foo: true,
        bar: false,
      },
    },
    validTestCases: [{ data: {} }, { data: { foo: 1 } }],
    invalidTestCases: [{ data: { bar: 2 } }, { data: { foo: 1, bar: 2 } }],
  },
  {
    title: 'properties with escaped characters',
    schema: {
      properties: {
        'foo\nbar': { type: 'number' },
        'foo"bar': { type: 'number' },
        'foo\\bar': { type: 'number' },
        'foo\rbar': { type: 'number' },
        'foo\tbar': { type: 'number' },
        'foo\fbar': { type: 'number' },
      },
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
          'foo\\bar': '1',
          'foo\rbar': '1',
          'foo\tbar': '1',
          'foo\fbar': '1',
        },
      },
    ],
  },
];
