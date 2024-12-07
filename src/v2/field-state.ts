import { createStore } from 'zustand/vanilla';
import { processSchema, ProcessSchemaReturnType } from './process-schema';
import { JSONSchemaFormConfiguration } from './types';
import { JSONSchema } from 'json-schema-to-ts';

export function createFieldState<T extends JSONSchema>(
  schema: T,
  config: JSONSchemaFormConfiguration
) {
  const store = createStore<{ fields: ProcessSchemaReturnType }>((set) => ({
    fields: processSchema(schema, config),
  }));

  return {
    fields: store.getState().fields,
  };
}
