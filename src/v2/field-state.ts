import { createStore } from 'zustand/vanilla';
import { processSchema, ProcessSchemaReturnType } from './process-schema';
import { JSONSchemaFormConfiguration, SchemaInstanceType } from './types';
import { JSONSchema } from 'json-schema-to-ts';

export function createFieldState<T extends JSONSchema>(
  schema: T,
  config: JSONSchemaFormConfiguration
) {
  const store = createStore<{ fields: ProcessSchemaReturnType }>((set) => ({
    fields: processSchema(schema, { values: config.initialValues }),
  }));

  function updateFields(values: unknown) {
    store.setState({ fields: processSchema(schema, { values }) });
  }

  return {
    fields: store.getState().fields,
    updateFields,
  };
}
