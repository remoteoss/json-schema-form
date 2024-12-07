import { yupToFormErrors } from '../../helpers';
import { traverseSchema } from '../process-schema';
import { JSONSchema, JSONSchemaFormPlugin } from '../types';
import * as yup from 'yup';

function getYupSchema(node: JSONSchema) {
  switch (typeof node === 'object' ? node?.type : undefined) {
    case 'string':
      return yup.string();
    case 'number':
      return yup.number();
    case 'boolean':
      return yup.boolean();
    case 'array':
      return yup.array();
    case 'object':
      return yup.object();
  }
}

function buildYupSchema(values: unknown, schema: JSONSchema) {
  return traverseSchema(schema, { values }, getYupSchema);
}

export const yupValidatorPlugin: JSONSchemaFormPlugin = {
  name: 'yup',
  type: 'validator',
  validate(values, schema) {
    let errors;

    const yupSchema = yup.lazy(() => buildYupSchema(values, schema));

    try {
      yupSchema.validateSync(values);
    } catch (e: unknown) {
      if (e instanceof yup.ValidationError) {
        errors = e;
      } else {
        console.warn(`Warning: An unhandled error was caught during validationSchema`, e);
      }
    }

    return {
      yupError: errors,
      formErrors: errors ? yupToFormErrors(errors) : undefined,
    };
  },
};
