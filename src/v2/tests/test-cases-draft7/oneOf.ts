export const oneOfTestCases = [
  {
    title: 'oneOf',
    schema: {
      oneOf: [
        {
          type: 'integer',
        },
        {
          minimum: 2,
        },
      ],
    },
    validTestCases: [{ data: 1 }, { data: 2.5 }],
    invalidTestCases: [{ data: 3 }, { data: 1.5 }],
  },
  {
    title: 'oneOf with base schema',
    schema: {
      type: 'string',
      oneOf: [
        {
          minLength: 2,
        },
        {
          maxLength: 4,
        },
      ],
    },
    validTestCases: [{ data: 'foobar' }],
    invalidTestCases: [{ data: 3 }, { data: 'foo' }],
  },
  {
    title: 'oneOf with boolean schemas, all true',
    schema: {
      oneOf: [true, true, true],
    },
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'oneOf with boolean schemas, one true',
    schema: {
      oneOf: [true, false, false],
    },
    validTestCases: [{ data: 'foo' }],
  },
  {
    title: 'oneOf with boolean schemas, more than one true',
    schema: {
      oneOf: [true, true, false],
    },
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'oneOf with boolean schemas, all false',
    schema: {
      oneOf: [false, false, false],
    },
    invalidTestCases: [{ data: 'foo' }],
  },
  {
    title: 'oneOf complex types',
    schema: {
      oneOf: [
        {
          properties: {
            bar: { type: 'integer' },
          },
          required: ['bar'],
        },
        {
          properties: {
            foo: { type: 'string' },
          },
          required: ['foo'],
        },
      ],
    },
    validTestCases: [{ data: { bar: 2 } }, { data: { foo: 'baz' } }],
    invalidTestCases: [{ data: { foo: 'baz', bar: 2 } }, { data: { foo: 2, bar: 'quux' } }],
  },
  {
    title: 'oneOf with empty schemas',
    schema: {
      oneOf: [{ type: 'number' }, {}],
    },
    validTestCases: [{ data: 'foo' }],
    invalidTestCases: [{ data: 123 }],
  },
  {
    title: 'oneOf with required',
    schema: {
      type: 'object',
      oneOf: [{ required: ['foo', 'bar'] }, { required: ['foo', 'baz'] }],
    },
    validTestCases: [{ data: { foo: 1, bar: 2 } }, { data: { foo: 1, baz: 3 } }],
    invalidTestCases: [{ data: { bar: 2 } }, { foo: 1, bar: 2, baz: 3 }],
  },
  {
    title: 'oneOf with missing optional property',
    schema: {
      oneOf: [
        {
          properties: {
            bar: true,
            baz: true,
          },
          required: ['bar'],
        },
        {
          properties: {
            foo: true,
          },
          required: ['foo'],
        },
      ],
    },
    validTestCases: [{ data: { bar: 8 } }, { data: { foo: 'foo' } }],
    invalidTestCases: [{ data: { foo: 'foo', bar: 8 } }, { data: { baz: 'quux' } }],
  },
  {
    title: 'nested oneOf, to check validation semantics',
    schema: {
      oneOf: [
        {
          oneOf: [
            {
              type: 'null',
            },
          ],
        },
      ],
    },
    validTestCases: [{ data: null }],
    invalidTestCases: [{ data: 123 }],
  },
];
