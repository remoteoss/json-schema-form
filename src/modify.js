import get from 'lodash/get';
import mergeWith from 'lodash/mergeWith';

/**
 *
 * @param {*} path
 * @example
 * shortToFullPath('foo.bar') // 'foo.properties.bar'
 */
function shortToFullPath(path) {
  return path.replace('.', '.properties.');
}

function mergeReplaceArray(_, newVal) {
  return Array.isArray(newVal) ? newVal : undefined;
}

function standardizeAttrs(attrs) {
  const { errorMessage, properties, ...rest } = attrs;

  return {
    ...rest,
    ...(errorMessage ? { 'x-jsf-errorMessage': errorMessage } : {}),
  };
}

function rewriteFields(schema, fieldsConfig) {
  if (!fieldsConfig) return null;

  const fieldsToModify = Object.entries(fieldsConfig);

  fieldsToModify.forEach(([shortPath, mutation]) => {
    const fieldPath = shortToFullPath(shortPath);

    if (!get(schema.properties, fieldPath)) {
      return; // Ignore field non existent in original schema.
    }

    const fieldAttrs = get(schema.properties, fieldPath);
    const fieldChanges = typeof mutation === 'function' ? mutation(fieldAttrs) : mutation;

    mergeWith(
      get(schema.properties, fieldPath),
      {
        ...fieldAttrs,
        ...standardizeAttrs(fieldChanges),
      },
      mergeReplaceArray
    );

    if (fieldChanges.properties) {
      rewriteFields(get(schema.properties, fieldPath), fieldChanges.properties);
    }
  });
}

function rewriteAllFields(schema, configCallback, context) {
  if (!configCallback) return null;
  const parentName = context?.parent;

  Object.entries(schema.properties).forEach(([fieldName, fieldAttrs]) => {
    const fullName = parentName ? `${parentName}.${fieldName}` : fieldName;
    mergeWith(
      get(schema.properties, fieldName),
      {
        ...fieldAttrs,
        ...configCallback(fullName, fieldAttrs),
      },
      mergeReplaceArray
    );

    // Nested fields, go recursive (fieldset)
    if (fieldAttrs.properties) {
      rewriteAllFields(fieldAttrs, configCallback, {
        parent: fieldName,
      });
    }
  });
}

export function modify(originalSchema, config) {
  const schema = JSON.parse(JSON.stringify(originalSchema));
  let warn = []; // To be implemented in next PRs.

  // All these functions mutate "schema",
  // that's why we create a copy above
  rewriteFields(schema, config.fields);

  rewriteAllFields(schema, config.allFields);

  if (!config.muteWarningTip) {
    console.warn(
      'json-schema-form modify(): Make sure you log the returned `warn` as they highlight possible bugs in your modifications. To mute this log, pass `muteWarningTip: true` to the config.'
    );
  }

  return {
    schema,
    warn: warn.length > 0 ? warn : undefined,
  };
}
