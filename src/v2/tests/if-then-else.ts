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
];
