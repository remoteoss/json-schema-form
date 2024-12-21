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
  {
    title: 'properties with null valued instance properties',
    schema: {
      properties: {
        foo: { type: 'null' },
      },
    },
    validTestCases: [{ data: { foo: null } }],
  },
  {
    title: 'properties whose names are Javascript object property names',
    schema: {
      properties: {
        // ['__proto__']: { type: 'number' },
        ['__proto__(not_working_yet)']: { type: 'number' },
        toString: {
          properties: { length: { type: 'string' } },
        },
        // constructor: { type: 'number' },
        ['constructor_(actual_constructor_value_is_still_buggy_and_does_not_work)']: {
          type: 'number',
        },
      },
    },
    validTestCases: [
      { data: [] },
      { data: 12 },
      { data: {} },
      {
        ['__proto__(not_working_yet)']: 12,
        toString: { length: 'foo' },
        ['constructor_(actual_constructor_value_is_still_buggy_and_does_not_work)']: 37,
      },
    ],
    invalidTestCases: [
      { data: { ['__proto__(not_working_yet)']: 'foo' } },
      // { data: { ['toString']: { ['length']: 37 } } }, // issue atm
      {
        data: {
          ['constructor_(actual_constructor_value_is_still_buggy_and_does_not_work)']: 'foo',
        },
      },
    ],
  },
];
