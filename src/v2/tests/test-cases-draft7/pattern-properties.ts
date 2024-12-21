export const patternPropertiesTestCases = [
  {
    title: 'Basic pattern',
    schema: {
      patternProperties: {
        'f.*o': { type: 'integer' },
      },
    },
    validTestCases: [
      { data: { foo: 1 } },
      { data: { foo: 1, foooooo: 2 } },
      { data: ['foo'] },
      { data: 'foo' },
      { data: 12 },
    ],
    invalidTestCases: [
      { data: { foo: 'bar', fooooo: 2 } },
      { data: { foo: 'bar', foooooo: 'baz' } },
    ],
  },
  {
    title: 'multiple simultaneous patternProperties are validate',
    schema: {
      patternProperties: {
        'a*': { type: 'integer' },
        'aaa*': { maximum: 20 },
      },
    },
    validTestCases: [{ data: { a: 21 } }, { data: { aaaa: 18 } }, { data: { a: 21, aaaa: 18 } }],
    invalidTestCases: [
      { data: { a: 'bar' } },
      { data: { aaaa: 31 } },
      { data: { aaa: 'foo', aaaa: 31 } },
    ],
  },
  {
    title: 'regexes are not anchored by default and are case sensitive',
    schema: {
      patternProperties: {
        '[0-9]{2,}': { type: 'boolean' },
        X_: { type: 'string' },
      },
    },
    validTestCases: [{ data: { 'answer 1': '42' } }, { data: { a_x_3: 3 } }],
    invalidTestCases: [{ data: { a31b: null } }, { data: { a_X_3: 3 } }],
  },
  {
    title: 'patternProperties with boolean schemas',
    schema: {
      patternProperties: {
        'f.*': true,
        'b.*': false,
      },
    },
    validTestCases: [{ data: { foo: 1 } }, { data: {} }],
    invalidTestCases: [{ data: { bar: 2 } }, { data: { foo: 1, bar: 2 } }, { data: { foobar: 1 } }],
  },
  {
    title: 'patternProperties with null valued instance properties',
    schema: {
      patternProperties: {
        '^.*bar$': { type: 'null' },
      },
    },
    validTestCases: [{ data: { foobar: null } }],
  },
];
