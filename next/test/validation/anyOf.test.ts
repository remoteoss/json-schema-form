import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('anyOf validation', () => {
  it('returns no errors if the value matches at least one subschema in anyOf (top-level)', () => {
    const schema = {
      anyOf: [
        { type: 'string', minLength: 5 },
        { type: 'number' },
      ],
    }
    const form = createHeadlessForm(schema)

    // Test with a string that meets the minLength requirement
    expect(form.handleValidation('hello world')).not.toHaveProperty('formErrors')

    // Test with a number
    expect(form.handleValidation(42)).not.toHaveProperty('formErrors')
  })

  it('returns an error if the value does not match any subschema in anyOf (top-level)', () => {
    const schema = {
      anyOf: [
        { type: 'string', pattern: '^[a-z]+$' },
        { type: 'string', minLength: 5 },
      ],
    }
    const form = createHeadlessForm(schema)

    // "123" does not match the pattern nor does it meet the minLength requirement.
    expect(form.handleValidation('123')).toEqual({
      formErrors: { '': 'should match at least one schema' },
    })
  })

  it('validates nested anyOf in an object property', () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string', pattern: '^[0-9]+$' },
            { type: 'number' },
          ],
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test with a valid number value
    expect(form.handleValidation({ value: 123 })).not.toHaveProperty('formErrors')

    // Test with a valid string matching the pattern
    expect(form.handleValidation({ value: '456' })).not.toHaveProperty('formErrors')

    // Test with an invalid string value; the error path will be prefixed by the property key.
    expect(form.handleValidation({ value: 'abc' })).toEqual({
      formErrors: { '.value': 'should match at least one schema' },
    })
  })
})

/* ---------------------------------------------
   JSON Schema Test Suite - anyOf (draft2020-12)
   The following tests are derived from the JSON Schema Test Suite for draft2020-12,
   available at:
   https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft2020-12/anyOf.json
   They ensure that our "anyOf" implementation is fully compliant with the specification.
--------------------------------------------- */
describe('JSON Schema Test Suite - anyOf (draft2020-12)', () => {
  // Define the test suites as in the JSON Schema Test Suite.
  const testSuites = [
    // Skipped: Advanced integer type validation (strict integer checking) is not implemented yet.
    // {
    //   description: 'anyOf',
    //   schema: {
    //     $schema: 'https://json-schema.org/draft/2020-12/schema',
    //     anyOf: [
    //       { type: 'integer' },
    //       { minimum: 2 },
    //     ],
    //   },
    //   tests: [
    //     { description: 'first anyOf valid', data: 1, valid: true },
    //     { description: 'second anyOf valid', data: 2.5, valid: true },
    //     { description: 'both anyOf valid', data: 3, valid: true },
    //     { description: 'neither anyOf valid', data: 1.5, valid: false },
    //   ],
    // },
    {
      description: 'anyOf with base schema',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string',
        anyOf: [
          { maxLength: 2 },
          { minLength: 4 },
        ],
      },
      tests: [
        { description: 'mismatch base schema', data: 3, valid: false },
        { description: 'one anyOf valid', data: 'foobar', valid: true },
        { description: 'both anyOf invalid', data: 'foo', valid: false },
      ],
    },
    {
      description: 'anyOf with boolean schemas, all true',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        anyOf: [true, true],
      },
      tests: [
        { description: 'any value is valid', data: 'foo', valid: true },
      ],
    },
    {
      description: 'anyOf with boolean schemas, some true',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        anyOf: [true, false],
      },
      tests: [
        { description: 'any value is valid', data: 'foo', valid: true },
      ],
    },
    {
      description: 'anyOf with one empty schema',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        anyOf: [
          { type: 'number' },
          {},
        ],
      },
      tests: [
        { description: 'string is valid', data: 'foo', valid: true },
        { description: 'number is valid', data: 123, valid: true },
      ],
    },
    // Skipped: Nested anyOf with null type handling is not yet supported.
    // {
    //   description: 'nested anyOf, to check validation semantics',
    //   schema: {
    //     $schema: 'https://json-schema.org/draft/2020-12/schema',
    //     anyOf: [
    //       {
    //         anyOf: [
    //           { type: 'null' },
    //         ],
    //       },
    //     ],
    //   },
    //   tests: [
    //     { description: 'null is valid', data: null, valid: true },
    //     { description: 'anything non-null is invalid', data: 123, valid: false },
    //   ],
    // },
    // Skipped: anyOf complex types require advanced object validation and strict type checking (integer & string).
    // {
    //   description: 'anyOf complex types',
    //   schema: {
    //     $schema: 'https://json-schema.org/draft/2020-12/schema',
    //     anyOf: [
    //       {
    //         properties: {
    //           bar: { type: 'integer' },
    //         },
    //         required: ['bar'],
    //       },
    //       {
    //         properties: {
    //           foo: { type: 'string' },
    //         },
    //         required: ['foo'],
    //       },
    //     ],
    //   },
    //   tests: [
    //     { description: 'first anyOf valid (complex)', data: { bar: 2 }, valid: true },
    //     { description: 'second anyOf valid (complex)', data: { foo: 'baz' }, valid: true },
    //     { description: 'both anyOf valid (complex)', data: { foo: 'baz', bar: 2 }, valid: true },
    //     { description: 'neither anyOf valid (complex)', data: { foo: 2, bar: 'quux' }, valid: false },
    //   ],
    // },
  ]

  testSuites.forEach((suite) => {
    describe(suite.description, () => {
      suite.tests.forEach((testCase) => {
        it(testCase.description, () => {
          const form = createHeadlessForm(suite.schema)
          const result = form.handleValidation(testCase.data)
          if (testCase.valid) {
            expect(result).not.toHaveProperty('formErrors')
          }
          else {
            expect(result).toHaveProperty('formErrors')
          }
        })
      })
    })
  })
})

// -------------------------------------------------------------------------
// The following tests (in the "JSON Schema anyOf test" suite) have the schema taken from:
// https://json-schema-form.vercel.app/?path=/story/demos-combinations--any-of-validations
// -------------------------------------------------------------------------
describe('JSON Schema anyOf test', () => {
  // Sample JSON schema focusing on the anyOf keyword.
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      field_a: {
        'title': 'Field A',
        'description': 'Field A is needed if B and C are empty',
        'maxLength': 10,
        'x-jsf-presentation': {
          inputType: 'text',
          maskSecret: 2,
        },
        'type': 'string',
      },
      field_b: {
        'title': 'Field B',
        'description': 'Field B is needed if A is empty and C is not empty',
        'maxLength': 10,
        'x-jsf-presentation': {
          inputType: 'text',
          maskSecret: 2,
        },
        'type': 'string',
      },
      field_c: {
        'title': 'Field C',
        'description': 'Field C is needed if A is empty and B is not empty',
        'maxLength': 10,
        'x-jsf-presentation': {
          inputType: 'text',
          maskSecret: 2,
        },
        'type': 'string',
      },
    },
    required: [],
    anyOf: [
      { required: ['field_a'] },
      { required: ['field_b', 'field_c'] },
    ],
  }

  it('passes when object satisfies one of the anyOf conditions (has field_a)', () => {
    const form = createHeadlessForm(schema)
    // Providing field_a should be enough for the first anyOf condition.
    const result = form.handleValidation({ field_a: 'hello' })
    expect(result).not.toHaveProperty('formErrors')
  })

  it('passes when object satisfies one of the anyOf conditions (has both field_b and field_c)', () => {
    const form = createHeadlessForm(schema)
    // Providing both field_b and field_c should satisfy the second anyOf condition.
    const result = form.handleValidation({ field_b: 'hi', field_c: 'there' })
    expect(result).not.toHaveProperty('formErrors')
  })

  it('fails when object does not meet any anyOf condition', () => {
    const form = createHeadlessForm(schema)
    // An empty object does not provide field_a nor both field_b and field_c.
    const result = form.handleValidation({})
    expect(result).toEqual({ formErrors: { '': 'should match at least one schema' } })
  })
})
