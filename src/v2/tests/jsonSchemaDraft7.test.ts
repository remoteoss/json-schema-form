import { createHeadlessForm } from '../create-headless-form';
import { conditionalTestCases, anyOfTestCases } from './control-flow-tests';
import {
  stringTestCases,
  numberTestCases,
  booleanTestCases,
  nullTestCases,
  multiTypeTestCases,
  objectTestCases,
  arrayTestCases,
} from './primitive-tests';
import { uniqueItemsTestCases } from './unique-items-test-cases';
import { requiredTestCases } from './required';
import { propertiesTestCases } from './properties';
import { patternPropertiesTestCases } from './pattern-properties';
import { patternTestCases } from './pattern';
import { typeTestCases } from './type';
import { oneOfTestCases } from './oneOf';
import { notTestCases } from './not';
import { multipleOfTests } from './multipleOf';
import { minimumTests } from './minimum';
import { minLengthTests } from './minLength';
import { minItemsTests } from './minItems';
import { maximumTests } from './maximum';
import { maxLengthTests } from './maxLength';
import { maxItemsTests } from './maxItems';
import { itemsTests } from './items';

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
    { title: 'Boolean', testCases: booleanTestCases },
    { title: 'Null', testCases: nullTestCases },
    { title: 'Multi type', testCases: multiTypeTestCases },
    { title: 'Object', testCases: objectTestCases },
    { title: 'Array', testCases: arrayTestCases },
    // { title: 'Conditionals', testCases: conditionalTestCases },
    // { title: 'AnyOf keyword', testCases: anyOfTestCases },

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
          fields?: any;
        }) => {
          describe(title, () => {
            const form = createHeadlessForm(schema);

            if (validTestCases) {
              validTestCases.forEach(({ data }: { data: any }) => {
                it(`${JSON.stringify(data)}`, () => {
                  expect(form.handleValidation(data).formErrors).toEqual(undefined);
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
