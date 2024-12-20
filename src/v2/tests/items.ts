export const itemsTests = [
  {
    title: 'a schema given for items',
    schema: {
      items: { type: 'integer' },
    },
    validTestCases: [
      { data: [1, 2, 3] },
      { data: { foo: 'bar' } },
      {
        data: {
          '0': 'invalid',
          length: 1,
        },
      },
    ],
    invalidTestCases: [{ data: [1, 'x'] }],
  },
  {
    title: 'an array of schemas for items',
    schema: {
      items: [{ type: 'integer' }, { type: 'string' }],
    },
    validTestCases: [
      { data: [1, 'foo'] },
      { data: [1] },
      { data: [1, 'foo', true] },
      { data: [] },
      {
        data: {
          '0': 'invalid',
          '1': 'valid',
          length: 2,
        },
      },
    ],
    invalidTestCases: [{ data: ['foo', 1] }],
  },
  {
    title: 'items with boolean schema (true)',
    schema: { items: true },
    validTestCases: [{ data: [1, 'foo', true] }, { data: [] }],
  },
  {
    title: 'items with boolean schema (false)',
    schema: { items: false },
    validTestCases: [{ data: [] }],
    invalidTestCases: [{ data: [1, 'foo', true] }],
  },
  {
    title: 'items with boolean schemas',
    schema: { items: [true, false] },
    validTestCases: [{ data: [1] }, { data: [] }],
    invalidTestCases: [{ data: [1, 'foo'] }],
  },
  // todo: https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/items.json#L134C25-L134C43
  {
    title: 'nested items',
    schema: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
        },
      },
    },
    validTestCases: [{ data: [[[[1]], [[2], [3]]], [[[4], [5], [6]]]] }],
    invalidTestCases: [
      { data: [[[['1']], [[2], [3]]], [[[4], [5], [6]]]] },
      {
        data: [
          [[1], [2], [3]],
          [[4], [5], [6]],
        ],
      },
    ],
  },
  {
    title: 'single-form items with null instance elements',
    schema: {
      items: {
        type: 'null',
      },
    },
    validTestCases: [{ data: [null] }],
  },
  {
    title: 'array-form items with null instance elements',
    schema: {
      items: [
        {
          type: 'null',
        },
      ],
    },
    validTestCases: [{ data: [null] }],
  },
];
