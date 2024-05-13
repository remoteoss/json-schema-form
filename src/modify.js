import get from 'lodash/get';
// import set from 'lodash/set';
import merge from 'lodash/merge';
import { difference } from 'lodash';

/**
 *
 * @param {*} path
 * @example
 * shortToFullPath('foo.bar') // 'foo.properties.bar'
 */
function shortToFullPath(path) {
  return path.replace('.', '.properties.');
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
      ...fieldChanges,
    });
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

    // Nested, go recursive (fieldset)
    if (fieldAttrs.properties) {
      rewriteAllFields(fieldAttrs, configCallback, {
        parent: fieldName,
      });
    }
  });
}

function reorderFields(schema, orderCallback) {
  if (!orderCallback) return null;

  const originalOrder = schema['x-jsf-order'];
  const orderConfig = orderCallback(originalOrder);
  const remaining = difference(originalOrder, orderConfig.order);

  const finalOrder =
    orderConfig.rest === 'end'
      ? [...orderConfig.order, ...remaining]
      : [...remaining, ...orderConfig.order];

  schema['x-jsf-order'] = finalOrder;
}

export function modify(originalSchema, config) {
  const schema = JSON.parse(JSON.stringify(originalSchema));

  // All these functions mutate "schema",
  // that's why we create a copy of originalSchema.
  rewriteFields(schema, config.fields);
  rewriteAllFields(schema, config.allFields);
  reorderFields(schema, config.order);

  return schema;
}
