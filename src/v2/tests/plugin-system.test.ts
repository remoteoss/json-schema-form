import { createHeadlessForm } from '../create-headless-form';

it('Throw if no validator plugin is provided', () => {
  expect(() =>
    createHeadlessForm({ type: 'object', properties: {} }, { validator: undefined })
  ).toThrow();
});
