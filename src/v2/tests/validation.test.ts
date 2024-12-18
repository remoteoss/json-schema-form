import { createHeadlessForm } from '../create-headless-form';
import {
  conditionalTestCases,
  notKeywordTestCases,
  anyOfTestCases,
  oneOfTestCases,
} from './control-flow-tests';
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
    // { title: 'Not keyword', testCases: notKeywordTestCases },
    // { title: 'AnyOf keyword', testCases: anyOfTestCases },
    { title: 'OneOf keyword', testCases: oneOfTestCases },
    { title: 'Unique items', testCases: uniqueItemsTestCases },
    { title: 'Required', testCases: requiredTestCases },
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
              validTestCases.forEach(({ data }: { data: any }, index: number) => {
                it(`${JSON.stringify(data)}`, () => {
                  expect(form.handleValidation(data).formErrors).toEqual(undefined);
                });
              });
            }

            if (invalidTestCases) {
              invalidTestCases.forEach(
                ({ data, error }: { data: any; error?: any }, index: number) => {
                  it(`Invalid: ${index + 1}`, () => {
                    const result = form.handleValidation(data).formErrors;
                    expect(result).toBeTruthy();
                    if (error) {
                      expect(result).toMatchObject(error);
                    }
                  });
                }
              );
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
