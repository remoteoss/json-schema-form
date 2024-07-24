import get from 'lodash/get';
import mergeWith from 'lodash/mergeWith';

const WARNING_TYPES = {
  FIELD_TO_CHANGE_NOT_FOUND: 'FIELD_TO_CHANGE_NOT_FOUND',
};
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
  if (!fieldsConfig) return { warnings: null };
  const warnings = [];

  const fieldsToModify = Object.entries(fieldsConfig);

  fieldsToModify.forEach(([shortPath, mutation]) => {
    const fieldPath = shortToFullPath(shortPath);

    if (!get(schema.properties, fieldPath)) {
      // Do not override/edit a field that does not exist.
      // That's the job of config.create() method.
      warnings.push({
        type: WARNING_TYPES.FIELD_TO_CHANGE_NOT_FOUND,
        message: `Changing field "${shortPath}" was ignored because it does not exist.`,
      });
      return;
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
      const result = rewriteFields(get(schema.properties, fieldPath), fieldChanges.properties);
      warnings.push(result.warnings);
    }
  });

  return { warnings: warnings.flat() };
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
  // All these functions mutate "schema" that's why we create a copy above

  const resultRewrite = rewriteFields(schema, config.fields);
  rewriteAllFields(schema, config.allFields);

  if (!config.muteWarningTip) {
    console.warn(
      'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteWarningTip: true` to the config.'
    );
  }

  const allWarnings = [resultRewrite.warnings].flat().filter(Boolean);

  return {
    schema,
    warnings: allWarnings.length > 0 ? allWarnings : null,
  };
}
