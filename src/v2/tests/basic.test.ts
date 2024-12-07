import { createHeadlessForm } from '../create-headless-form';
import {
  stringTestCases,
  numberTestCases,
  booleanTestCases,
  nullTestCases,
  multiTypeTestCases,
} from './primitive-tests';

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
  ].forEach(({ title, testCases }) => {
    describe(title, () => {
      testCases.forEach(({ title, schema, values, formErrors, fields = undefined }) => {
        it(title, () => {
          const form = createHeadlessForm<typeof schema>(schema);
          expect(form.handleValidation(values).formErrors).toEqual(formErrors);
          if (fields) {
            expect(form.fields).toEqual(fields);
          }
        });
      });
    });
  });
});
