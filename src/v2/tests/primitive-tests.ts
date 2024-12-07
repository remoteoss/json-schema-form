export const stringTestCases = [
  {
    title: 'Basic',
    schema: { type: 'string' } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Min length',
    schema: { type: 'string', minLength: 5 } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Min length error',
    schema: { type: 'string', minLength: 5 } as const,
    values: 'h',
    formErrors: { '': 'this must be at least 5 characters' },
  },
  {
    title: 'Max length error',
    schema: { type: 'string', maxLength: 5 } as const,
    values: 'hello!!',
    formErrors: { '': 'this must be at most 5 characters' },
  },
  {
    title: 'Max length',
    schema: { type: 'string', maxLength: 5 } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Pattern',
    schema: { type: 'string', pattern: '^[a-z]+$' } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Pattern error',
    schema: { type: 'string', pattern: '^[a-z]+$' } as const,
    values: 'hello!',
    formErrors: { '': 'this must match the following: "/^[a-z]+$/"' },
  },
  {
    title: 'Type error',
    schema: { type: 'string' } as const,
    values: 1,
    formErrors: { '': 'this must be a `string` type, but the final value was: `1`.' },
  },
  {
    title: 'Title and description',
    schema: { type: 'string', title: 'Hello', description: 'This is a string' } as const,
    values: 'hello',
    formErrors: undefined,
    fields: [{ type: 'string', label: 'Hello', description: 'This is a string' }],
  },
  {
    title: 'Enum',
    schema: { type: 'string', enum: ['hello', 'world'] } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Enum error',
    schema: { type: 'string', enum: ['hello', 'world'] } as const,
    values: 'goodbye',
    formErrors: { '': 'this must be one of the following values: hello, world' },
  },
  {
    title: 'Const',
    schema: { type: 'string', const: 'hello' } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'Const error',
    schema: { type: 'string', const: 'hello' } as const,
    values: 'goodbye',
    formErrors: { '': 'this must be one of the following values: hello' },
  },
  {
    title: 'Const no type',
    schema: { const: 'hello' } as const,
    values: 'hello',
    formErrors: undefined,
  },
];

export const numberTestCases = [
  {
    title: 'Basic number',
    schema: { type: 'number' } as const,
    values: 1,
    formErrors: undefined,
  },
  {
    title: 'Minimum',
    schema: { type: 'number', minimum: 5 } as const,
    values: 1,
    formErrors: { '': 'this must be greater than or equal to 5' },
  },
  {
    title: 'Maximum',
    schema: { type: 'number', maximum: 5 } as const,
    values: 10,
    formErrors: { '': 'this must be less than or equal to 5' },
  },
  {
    title: 'Integer',
    schema: { type: 'integer' } as const,
    values: 1,
    formErrors: undefined,
  },
  {
    title: 'Integer error',
    schema: { type: 'integer' } as const,
    values: 1.5,
    formErrors: { '': 'this must be an integer' },
  },
  {
    title: 'Const no type',
    schema: { const: 1 } as const,
    values: 1,
    formErrors: undefined,
  },
];

export const booleanTestCases = [
  {
    title: 'True',
    schema: { type: 'boolean' } as const,
    values: true,
    formErrors: undefined,
  },
  {
    title: 'False',
    schema: { type: 'boolean' } as const,
    values: false,
    formErrors: undefined,
  },
  {
    title: 'Type error',
    schema: { type: 'boolean' } as const,
    values: 'true',
    formErrors: { '': 'this must be a `boolean` type, but the final value was: `"true"`.' },
  },
  {
    title: 'True as const',
    schema: { const: true } as const,
    values: true,
    formErrors: undefined,
  },
];

export const nullTestCases = [
  {
    title: 'Null',
    schema: { type: 'null' } as const,
    values: null,
    formErrors: undefined,
  },
  {
    title: 'As const',
    schema: { const: null } as const,
    values: null,
    formErrors: undefined,
  },
  {
    title: 'As const error',
    schema: { const: null } as const,
    values: 1,
    formErrors: { '': 'Value must be null' },
  },
];

export const multiTypeTestCases = [
  {
    title: 'String or number',
    schema: { type: ['string', 'number'] } as const,
    values: 'hello',
    formErrors: undefined,
  },
  {
    title: 'String or number error',
    schema: { type: ['string', 'number'] } as const,
    values: true,
    formErrors: { '': 'Expected string or number, but got boolean.' },
  },
  {
    title: 'string or number but use number',
    schema: { type: ['string', 'number'], minimum: 5 } as const,
    values: 1,
    formErrors: { '': 'this must be greater than or equal to 5' },
  },
  {
    title: 'string or number but use integer',
    schema: {
      type: ['integer', 'string'],
      minimum: 100,
    } as const,
    values: 1.3,
    formErrors: { '': 'Expected integer or string, but got number.' },
  },
];

export const objectTestCases = [
  {
    title: 'Basic object',
    schema: { type: 'object' } as const,
    values: {},
    formErrors: undefined,
  },
  {
    title: 'Basic object with random values',
    schema: { type: 'object' } as const,
    values: { a: 1, b: 'hello' },
    formErrors: undefined,
  },
  {
    title: 'Object with a property that is a string',
    schema: { type: 'object', properties: { a: { type: 'string' } } } as const,
    values: { a: 'hello' },
    formErrors: undefined,
  },
  {
    title: 'Object with a property that is a string error',
    schema: { type: 'object', properties: { a: { type: 'string' } } } as const,
    values: { a: 1 },
    formErrors: { a: 'a must be a `string` type, but the final value was: `1`.' },
  },
  {
    title: 'Object with different types',
    schema: {
      type: 'object',
      properties: {
        string: { type: 'string' },
        boolean: { type: 'boolean' },
        number: { type: 'number' },
        integer: { type: 'integer' },
      },
    } as const,
    values: { string: 'hello', boolean: true, number: 1.332, integer: 1 },
    formErrors: undefined,
  },
  {
    title: 'Additional properties error when not allowed',
    schema: {
      type: 'object',
      properties: {
        string: { type: 'string' },
      },
      additionalProperties: false,
    } as const,
    values: { string: 'hello', x: 1 },
    formErrors: { '': 'this field has unspecified keys: x' },
  },
  {
    title: 'Required properties',
    schema: {
      type: 'object',
      properties: {
        required: { type: 'string' },
        optional: { type: 'number' },
      },
      required: ['required'],
    } as const,
    values: { optional: 123 },
    formErrors: { required: 'Field is required' },
  },
  {
    title: 'Nested object validation',
    schema: {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            field: { type: 'string' },
          },
          required: ['field'],
        },
      },
    } as const,
    values: { nested: { field: 123 } },
    formErrors: {
      nested: { field: 'nested.field must be a `string` type, but the final value was: `123`.' },
    },
  },
];
