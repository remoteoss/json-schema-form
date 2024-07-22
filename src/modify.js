import get from 'lodash/get';
import merge from 'lodash/merge';

/**
 *
 * @param {*} path
 * @example
 * shortToFullPath('foo.bar') // 'foo.properties.bar'
 */
function shortToFullPath(path) {
  return path.replace('.', '.properties.');
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

    merge(get(schema.properties, fieldPath), {
      ...fieldAttrs,
      ...standardizeAttrs(fieldChanges),
    });

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
    merge(get(schema.properties, fieldName), {
      ...fieldAttrs,
      ...configCallback(fullName, fieldAttrs),
    });

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

  rewriteFields(schema, config.fields);

  rewriteAllFields(schema, config.allFields);

  return schema;
}
