import { createStore } from 'zustand/vanilla';
import { processSchema, ProcessSchemaReturnType } from '../process-schema';
import { JSONSchemaFormConfiguration } from '../types';
import { JSONSchema } from 'json-schema-to-ts';

export function createFieldState<T extends JSONSchema>(
  schema: T,
  config: JSONSchemaFormConfiguration
) {
  let publicState = processSchema(schema, {
    values: config.initialValues,
    schemaValidator: config.schemaValidator,
  });

  const store = createStore<{ fields: ProcessSchemaReturnType }>((set) => ({
    fields: publicState,
  }));

  function updateFields(values: unknown) {
    store.setState({
      fields: processSchema(schema, { values, schemaValidator: config.schemaValidator }),
    });
    const newFields = store.getState().fields;
    return newFields;
  }

  store.subscribe((state) => {
    // deeply mutate the fields one by one, property by property
    for (let i = 0; i < state.fields.length; i++) {
      for (const key in state.fields[i]) {
        publicState[i][key] = state.fields[i][key];
      }
    }
  });

  return {
    fields: publicState,
    updateFields,
  };
}
