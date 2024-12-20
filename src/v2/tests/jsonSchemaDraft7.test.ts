import { createHeadlessForm } from '../create-headless-form';
import { conditionalTestCases } from './control-flow-tests';
import {
  stringTestCases,
  numberTestCases,
  nullTestCases,
  multiTypeTestCases,
  objectTestCases,
  arrayTestCases,
} from './primitive-tests';
import { uniqueItemsTestCases } from './uniqueItems';
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
import { ifThenElseTests } from './if-then-else';
import { formatTests } from './format';
import { exclusiveMinimumTests } from './exclusiveMinimum';
import { exclusiveMaximumTests } from './exclusiveMaximum';
import { enumTests } from './enum';
import { dependenciesTestCases } from './dependencies';
import { defaultTestCases } from './default';
import { containsTestCases } from './contains';
import { constTestCases } from './const';
import { booleanTestCases } from './boolean_schema';
import { anyOfTestCases } from './anyOf';
import { allOfTestCases } from './allOf';

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
    { title: 'Conditionals', testCases: conditionalTestCases },

    { title: 'AllOf', testCases: allOfTestCases },
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
