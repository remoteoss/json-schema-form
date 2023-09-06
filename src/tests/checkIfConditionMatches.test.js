import { checkIfConditionMatchesProperties } from '../checkIfConditionMatches';

it('Empty if is always going to be true', () => {
  expect(checkIfConditionMatchesProperties({ if: { properties: {} } })).toBe(true);
});

it('Basic if check passes with correct value', () => {
  expect(
    checkIfConditionMatchesProperties(
      { if: { properties: { a: { const: 'hello' } } } },
      {
        a: 'hello',
      }
    )
  ).toBe(true);
});

it('Basic if check fails with incorrect value', () => {
  expect(
    checkIfConditionMatchesProperties(
      { if: { properties: { a: { const: 'hello' } } } },
      {
        a: 'goodbye',
      }
    )
  ).toBe(false);
});

it('Nested properties check passes with correct value', () => {
  expect(
    checkIfConditionMatchesProperties(
      { if: { properties: { parent: { properties: { child: { const: 'hello from child' } } } } } },
      {
        parent: { child: 'hello from child' },
      },
      [{ name: 'parent', fields: [] }]
    )
  ).toBe(true);
});

it('Nested properties check passes with correct value', () => {
  expect(
    checkIfConditionMatchesProperties(
      { if: { properties: { parent: { properties: { child: { const: 'hello from child' } } } } } },
      {
        parent: { child: 'goodbye from child' },
      },
      [{ name: 'parent', fields: [] }]
    )
  ).toBe(false);
});
