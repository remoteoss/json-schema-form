import { createHeadlessForm } from '../create-headless-form';

describe('createHeadlessForm', () => {
  it('should create a headless form and return the correct structure', () => {
    const form = createHeadlessForm({}, {});
    expect(form).toMatchObject({
      fields: expect.any(Array),
      handleValidation: expect.any(Function),
    });
  });

  it('Should handle a basic string', () => {
    const schema = { type: 'string' } as const;
    const form = createHeadlessForm<typeof schema>(schema);
    expect(form.handleValidation('hello').formErrors).toBeUndefined();
    expect(form.fields).toEqual([
      {
        type: 'string',
      },
    ]);
  });
});
