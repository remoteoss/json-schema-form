import { createStore } from 'zustand/vanilla';
import { processSchema, ProcessSchemaReturnType } from '../process-schema';
import { JSONSchemaFormConfiguration } from '../types';
import { JSONSchema } from 'json-schema-to-ts';

export function createFieldState<T extends JSONSchema>(
  schema: T,
  config: JSONSchemaFormConfiguration
) {
  const store = createStore<{ fields: ProcessSchemaReturnType }>(() => ({
    fields: processSchema(schema, {
      values: config.initialValues,
      schemaValidator: config.schemaValidator,
    }),
  }));

  function updateFields(values: unknown) {
    store.setState({
      fields: processSchema(schema, { values, schemaValidator: config.schemaValidator }),
    });
    const newFields = store.getState().fields;
    return newFields;
  }

  return {
    fields: store.getState().fields,
    updateFields,
  };
}
