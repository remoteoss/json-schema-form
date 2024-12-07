import { createHeadlessForm } from '../create-headless-form';

describe('createHeadlessForm', () => {
  it('should create a headless form and return the correct structure', () => {
    const form = createHeadlessForm({});
    expect(form).toMatchObject({
      fields: expect.any(Array),
      handleValidation: expect.any(Function),
    });
  });

  describe('String primitive', () => {
    it('Should handle a basic string', () => {
      const schema = { type: 'string' } as const;
      const form = createHeadlessForm<typeof schema>(schema);
      expect(form.handleValidation('hello').formErrors).toBeUndefined();
      expect(form.fields).toEqual([{ type: 'string' }]);
    });

    it('Returns a title as the label key', () => {
      const schema = { type: 'string', title: 'Hello' } as const;
      const form = createHeadlessForm<typeof schema>(schema);
      expect(form.fields).toEqual([{ type: 'string', label: 'Hello' }]);
    });

    it('Returns the description as the description key', () => {
      const schema = { type: 'string', description: 'Hello' } as const;
      const form = createHeadlessForm<typeof schema>(schema);
      expect(form.fields).toEqual([{ type: 'string', description: 'Hello' }]);
    });
  });

  describe('Number primitive', () => {
    it('Should handle a basic number', () => {
      const schema = { type: 'number' } as const;
      const form = createHeadlessForm<typeof schema>(schema);
      expect(form.handleValidation(1).formErrors).toBeUndefined();
      expect(form.fields).toEqual([{ type: 'number' }]);
    });
  });
});
