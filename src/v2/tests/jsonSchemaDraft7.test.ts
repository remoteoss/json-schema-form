import { createHeadlessForm } from '../create-headless-form';
import { conditionalTestCases } from './test-cases-draft7/control-flow-tests';
import {
  stringTestCases,
  numberTestCases,
  nullTestCases,
  multiTypeTestCases,
  objectTestCases,
  arrayTestCases,
} from './test-cases-draft7/primitive-tests';
import { uniqueItemsTestCases } from './test-cases-draft7/uniqueItems';
import { requiredTestCases } from './test-cases-draft7/required';
import { propertiesTestCases } from './test-cases-draft7/properties';
import { patternPropertiesTestCases } from './test-cases-draft7/pattern-properties';
import { patternTestCases } from './test-cases-draft7/pattern';
import { typeTestCases } from './test-cases-draft7/type';
import { oneOfTestCases } from './test-cases-draft7/oneOf';
import { notTestCases } from './test-cases-draft7/not';
import { multipleOfTests } from './test-cases-draft7/multipleOf';
import { minimumTests } from './test-cases-draft7/minimum';
import { minLengthTests } from './test-cases-draft7/minLength';
import { minItemsTests } from './test-cases-draft7/minItems';
import { maximumTests } from './test-cases-draft7/maximum';
import { maxLengthTests } from './test-cases-draft7/maxLength';
import { maxItemsTests } from './test-cases-draft7/maxItems';
import { itemsTests } from './test-cases-draft7/items';
import { ifThenElseTests } from './test-cases-draft7/if-then-else';
import { formatTests } from './test-cases-draft7/format';
import { exclusiveMinimumTests } from './test-cases-draft7/exclusiveMinimum';
import { exclusiveMaximumTests } from './test-cases-draft7/exclusiveMaximum';
import { enumTests } from './test-cases-draft7/enum';
import { dependenciesTestCases } from './test-cases-draft7/dependencies';
import { defaultTestCases } from './test-cases-draft7/default';
import { containsTestCases } from './test-cases-draft7/contains';
import { constTestCases } from './test-cases-draft7/const';
import { booleanTestCases } from './test-cases-draft7/boolean_schema';
import { anyOfTestCases } from './test-cases-draft7/anyOf';
import { allOfTestCases } from './test-cases-draft7/allOf';

describe('createHeadlessForm', () => {
  it('should create a headless form and return the correct structure', () => {
    const form = createHeadlessForm({});
    expect(form).toMatchObject({
      fields: expect.any(Array),
      handleValidation: expect.any(Function),
    });
  });

  [
    { title: 'String', testCases: stringTestCases },
    { title: 'Number', testCases: numberTestCases },
    { title: 'Null', testCases: nullTestCases },
    { title: 'Multi type', testCases: multiTypeTestCases },
    { title: 'Object', testCases: objectTestCases },
    { title: 'Array', testCases: arrayTestCases },
    // { title: 'Conditionals', testCases: conditionalTestCases },
    // { title: 'AllOf', testCases: allOfTestCases },
    { title: 'AnyOf', testCases: anyOfTestCases },
    { title: 'Boolean Schemas', testCases: booleanTestCases },
    { title: 'Const', testCases: constTestCases },
    { title: 'Contains', testCases: containsTestCases },
    { title: 'Default', testCases: defaultTestCases },
    // definitions todo
    { title: 'Dependencies', testCases: dependenciesTestCases },
    { title: 'Enum', testCases: enumTests },
    { title: 'Exclusive maximum', testCases: exclusiveMaximumTests },
    { title: 'Exclusive minimum', testCases: exclusiveMinimumTests },
    { title: 'Format', testCases: formatTests },
    { title: 'If/Then/Else', testCases: ifThenElseTests },
    // infinite loop detection case todo
    { title: 'Items', testCases: itemsTests },
    { title: 'MaxItems', testCases: maxItemsTests },
    { title: 'MaxLength', testCases: maxLengthTests },
    // max properties todo
    { title: 'Maximum', testCases: maximumTests },
    { title: 'MinItems', testCases: minItemsTests },
    { title: 'MinLength', testCases: minLengthTests },
    // min properties todo
    { title: 'Minimum', testCases: minimumTests },
    { title: 'MultipleOf', testCases: multipleOfTests },
    { title: 'Not', testCases: notTestCases },
    { title: 'OneOf', testCases: oneOfTestCases },
    { title: 'Pattern', testCases: patternTestCases },
    { title: 'Pattern properties', testCases: patternPropertiesTestCases },
    { title: 'Properties', testCases: propertiesTestCases },
    // property names todo
    { title: 'Required', testCases: requiredTestCases },
    { title: 'Type', testCases: typeTestCases },
    { title: 'Unique items', testCases: uniqueItemsTestCases },
  ].forEach(({ title, testCases }) => {
    describe(title, () => {
      testCases.forEach(
        ({
          title,
          schema,
          validTestCases,
          invalidTestCases,
          fields = undefined,
        }: {
          title: string;
          schema: any;
          validTestCases?: Array<{ data: any }>;
          invalidTestCases?: Array<{ data: any; error?: any }>;
        }) => {
          describe(title, () => {
            const form = createHeadlessForm(schema);

            if (validTestCases) {
              validTestCases.forEach(({ data, fields }: { data: any; fields?: any }) => {
                it(`${JSON.stringify(data)}`, () => {
                  const result = form.handleValidation(data);
                  expect(result.formErrors).toEqual(undefined);
                  if (fields) {
                    expect(result.fields).toMatchObject(fields);
                  }
                });
              });
            }

            if (invalidTestCases) {
              invalidTestCases.forEach(({ data, error }: { data: any; error?: any }) => {
                it(`Invalid: ${JSON.stringify(data)}`, () => {
                  const result = form.handleValidation(data).formErrors;
                  expect(result).toBeTruthy();
                  if (error) {
                    expect(result).toMatchObject(error);
                  }
                });
              });
            }

            if (fields) {
              it('should have correct field structure', () => {
                expect(form.fields).toEqual(fields);
              });
            }
          });
        }
      );
    });
  });
});
