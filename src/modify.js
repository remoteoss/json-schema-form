import difference from 'lodash/difference';
import get from 'lodash/get';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import set from 'lodash/set';

const WARNING_TYPES = {
  FIELD_TO_CHANGE_NOT_FOUND: 'FIELD_TO_CHANGE_NOT_FOUND',
  ORDER_MISSING_FIELDS: 'ORDER_MISSING_FIELDS',
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
  const { errorMessage, presentation, properties, ...rest } = attrs;

  return {
    ...rest,
    ...(errorMessage ? { 'x-jsf-errorMessage': errorMessage } : {}),
    ...(presentation ? { 'x-jsf-presentation': presentation } : {}),
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

function reorderFields(schema, configOrder) {
  if (!configOrder) return { warnings: null };

  const warnings = [];
  const originalOrder = schema['x-jsf-order'] || [];
  const orderConfig = typeof configOrder === 'function' ? configOrder(originalOrder) : configOrder;
  const remaining = difference(originalOrder, orderConfig);

  if (remaining.length > 0) {
    warnings.push({
      type: WARNING_TYPES.ORDER_MISSING_FIELDS,
      message: `Some fields got forgotten in the new order. They were automatically appended: ${remaining.join(
        ', '
      )}`,
    });
  }
  schema['x-jsf-order'] = [...orderConfig, ...remaining];

  return { warnings };
}

function setFields(schema, fieldsConfig) {
  if (!fieldsConfig) return null;

  const fieldsToAdd = Object.entries(fieldsConfig);

  fieldsToAdd.forEach(([shortPath, fieldAttrs]) => {
    const fieldPath = shortToFullPath(shortPath);

    console.log('fieldAttrs', fieldAttrs);

    if (fieldAttrs.properties) {
      // Recursive to nested fields...
      setFields(get(schema.properties, fieldPath), fieldAttrs.properties);
    }

    const fieldInSchema = get(schema.properties, fieldPath);
    if (fieldInSchema) {
      // NOTE: Not sure if we should ignore or overwrite it
      // when it exists. Let's ignore until someone complains.
      return;
    }

    const fieldInObjectPath = set({}, fieldPath, standardizeAttrs(fieldAttrs));
    merge(schema.properties, fieldInObjectPath);
  });
}

export function modify(originalSchema, config) {
  const schema = JSON.parse(JSON.stringify(originalSchema));
  // All these functions mutate "schema" that's why we create a copy above

  const resultRewrite = rewriteFields(schema, config.fields);
  rewriteAllFields(schema, config.allFields);
  setFields(schema, config.add);

  const resultReorder = reorderFields(schema, config.orderRoot);

  if (!config.muteLogging) {
    console.warn(
      'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteLogging: true` to the config.'
    );
  }

  const warnings = [resultRewrite.warnings, resultReorder.warnings].flat().filter(Boolean);

  return {
    schema,
    warnings,
  };
}
