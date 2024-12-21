export const ifThenElseTests = [
  {
    title: 'ignore if without then or else',
    schema: {
      if: {
        const: 0,
      },
    },
    validTestCases: [{ data: 0 }, { data: 'hello' }],
  },
  {
    title: 'ignore then without if',
    schema: {
      then: {
        const: 0,
      },
    },
    validTestCases: [{ data: 0 }, { data: 'hello' }],
  },
  {
    title: 'ignore else without if',
    schema: {
      else: {
        const: 0,
      },
    },
    validTestCases: [{ data: 0 }, { data: 'hello' }],
  },
  {
    title: 'if and then without else',
    schema: {
      if: {
        exclusiveMaximum: 0,
      },
      then: {
        minimum: -10,
      },
    },
    validTestCases: [{ data: -1 }, { data: 3 }],
    invalidTestCases: [{ data: -100 }],
  },
  {
    title: 'if and else without then',
    schema: {
      if: {
        exclusiveMaximum: 0,
      },
      else: {
        multipleOf: 2,
      },
    },
    validTestCases: [{ data: -1 }, { data: 4 }],
    invalidTestCases: [{ data: 3 }],
  },
  {
    title: 'validate against correct branch, then vs else',
    schema: {
      if: {
        exclusiveMaximum: 0,
      },
      then: {
        minimum: -10,
      },
      else: {
        multipleOf: 2,
      },
    },
    validTestCases: [{ data: -1 }, { data: 4 }],
    invalidTestCases: [{ data: -100 }, { data: 3 }],
  },
  {
    title: 'non-interference across combined schemas',
    schema: {
      allOf: [
        {
          if: {
            exclusiveMaximum: 0,
          },
        },
        {
          then: {
            minimum: -10,
          },
        },
        {
          else: {
            multipleOf: 2,
          },
        },
      ],
    },
    validTestCases: [{ data: -100 }, { data: 3 }],
  },
  {
    title: 'if with boolean schema true',
    schema: {
      if: true,
      then: { const: 'then' },
      else: { const: 'else' },
    },
    validTestCases: [{ data: 'then' }],
    invalidTestCases: [{ data: 'else' }],
  },
  {
    title: 'if with boolean schema false',
    schema: {
      if: false,
      then: { const: 'then' },
      else: { const: 'else' },
    },
    validTestCases: [{ data: 'else' }],
    invalidTestCases: [{ data: 'then' }],
  },
  {
    title: 'if appears at the end when serialized (keyword processing sequence)',
    schema: {
      then: { const: 'yes' },
      else: { const: 'other' },
      if: { maxLength: 4 },
    },
    validTestCases: [{ data: 'yes' }, { data: 'other' }],
    invalidTestCases: [{ data: 'no' }, { data: 'invalid' }],
  },
];
