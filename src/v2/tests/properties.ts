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
    validTestCases: [{ data: { foo: [1, 2] } }],
    invalidTestCases: [{ data: { foo: [1, 2, 3, 4] } }, { data: { foo: [] } }],
  },
];
