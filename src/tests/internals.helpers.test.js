import * as Yup from 'yup';

import { yupToFormErrors } from '../helpers';
import { getFieldDescription, pickXKey } from '../internals/helpers';

describe('getFieldDescription()', () => {
  it('returns no description', () => {
    const descriptionField = getFieldDescription();
    expect(descriptionField).toEqual({});
  });

  it('returns the description from the node', () => {
    const node = { description: 'a description' };
    const customProperties = {};
    const descriptionField = getFieldDescription(node, customProperties);
    expect(descriptionField).toEqual({ description: 'a description' });
  });

  describe('with customProperties', () => {
    it('given no match, returns no description', () => {
      const node = {};
      const customProperties = { a_property: 'a_property' };
      const descriptionField = getFieldDescription(node, customProperties);

      expect(descriptionField).toEqual({});
    });

    it('returns the description from customProperties', () => {
      const node = { description: 'a description' };
      const customProperties = { description: 'a custom description' };

      const descriptionField = getFieldDescription(node, customProperties);

      expect(descriptionField).toEqual({ description: 'a custom description' });
    });
  });

  describe('with x-jsf-presentation attribute', () => {
    it('returns x-jsf-presentation given no base description', () => {
      const node = {
        'x-jsf-presentation': { description: 'a presentation description' },
      };
      const customProperties = {};
      const descriptionField = getFieldDescription(node, customProperties);

      expect(descriptionField).toEqual({
        presentation: { description: 'a presentation description' },
      });
    });

    it('returns presentation overriding the base description', () => {
      const node = {
        description: 'a description',
        'x-jsf-presentation': { description: 'a presentation description' },
      };
      const customProperties = {};
      const descriptionField = getFieldDescription(node, customProperties);

      expect(descriptionField).toEqual({
        description: 'a description',
        presentation: { description: 'a presentation description' },
      });
    });

    it('returns the custom description, overriding the base and presentation description', () => {
      const node = {
        description: 'a description',
        'x-jsf-presentation': { description: 'a presentation description' },
      };
      const customProperties = { description: 'a custom description' };
      const descriptionField = getFieldDescription(node, customProperties);

      expect(descriptionField).toEqual({
        description: 'a custom description',
        presentation: { description: 'a custom description' },
      });
    });
  });
});

describe('yupToFormErrors()', () => {
  it('returns an object given an YupError', () => {
    const yupOpts = { abortEarly: false };
    const YupSchema = Yup.object({
      age: Yup.number().min(18, 'Too young'),
      name: Yup.object({
        first: Yup.string().required(),
        middle: Yup.string(),
        last: Yup.string().required('Required field.'),
      }),
    });

    try {
      YupSchema.validateSync(
        {
          age: 10,
          name: { first: 'Junior' },
        },
        yupOpts
      );
    } catch (yupError) {
      expect(yupToFormErrors(yupError)).toEqual({
        age: 'Too young',
        name: {
          last: 'Required field.',
        },
      });
    }
  });

  it('returns nill given nill', () => {
    expect(yupToFormErrors(undefined)).toEqual(undefined);
    expect(yupToFormErrors(null)).toEqual(null);
  });
});

describe('pickXKey()', () => {
  it('returns the x-jsx attribute', () => {
    const schema = {
      max_length: 255,
      'x-jsf-presentation': {
        inputType: 'text',
      },
      title: 'Address',
      type: 'string',
    };
    const xKey = pickXKey(schema, 'presentation');

    expect(xKey).toEqual({
      inputType: 'text',
    });
  });

  it('returns the deprecated attribute', () => {
    const schema = {
      max_length: 255,
      presentation: {
        inputType: 'text (deprecated)',
      },
      title: 'Address',
      type: 'string',
    };
    const xKey = pickXKey(schema, 'presentation');

    expect(xKey).toEqual({
      inputType: 'text (deprecated)',
    });
  });

  it('return undefined given a key that is not being deprecated', () => {
    const schema = {
      properties: {
        age: { type: 'number' },
        address: { type: 'string' },
      },
      order: ['age', 'address'],
    };
    const xKey = pickXKey(schema, 'order');

    // it's undefined because "x-jsf-order" does not exist,
    // and "order" is not one of the deprecated custom keywords.
    expect(xKey).toBeUndefined();
  });

  it('returns undefined if the key is not found within an object', () => {
    const schema = {
      max_length: 255,
      title: 'Address',
      type: 'string',
    };
    const xKey = pickXKey(schema, 'presentation');

    expect(xKey).toBeUndefined();
  });
});
