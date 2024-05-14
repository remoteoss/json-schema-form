import difference from 'lodash/difference';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import merge from 'lodash/merge';
import set from 'lodash/set';

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
  const {
    errorMessage, // to be renamed
    properties, // ignored because of recurisve call
    ...rest
  } = attrs;

  return {
    ...rest,
    ...(errorMessage ? { 'x-jsf-errorMessage': errorMessage } : {}),
  };
}

function isConditionalReferencingAnyPickedField(condition, fieldsToPick) {
  const { if: ifCondition, then: thenCondition, else: elseCondition } = condition;

  const inIf = intersection(ifCondition.required, fieldsToPick);

  console.log({ inIf });
  if (inIf.length > 0) {
    return true;
  }

  const inThen =
    intersection(thenCondition.required, fieldsToPick) ||
    intersection(Object.keys(thenCondition.properties), fieldsToPick);

  console.log({ inThen });

  if (inThen.length > 0) {
    return true;
  }

  const inElse =
    intersection(elseCondition.required, fieldsToPick) ||
    intersection(Object.keys(elseCondition.properties), fieldsToPick);

  console.log({ inElse });

  if (inElse.length > 0) {
    return true;
  }

  return false;
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

    // recrusive
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

function pickFields(originalSchema, pickConfig) {
  if (!pickConfig) return originalSchema;

  const fieldsToPick = pickConfig.fields;
  const newSchema = {
    properties: {},
  };

  Object.entries(originalSchema).forEach(([attrKey, attrValue]) => {
    switch (attrKey) {
      case 'properties':
        // TODO — handle recursive nested fieldsets
        fieldsToPick.forEach((fieldPath) => {
          console.log('set', fieldPath, attrValue, fieldPath);
          set(newSchema.properties, fieldPath, attrValue[fieldPath]);
        });
        break;
      case 'x-jsf-order':
      case 'required':
        newSchema[attrKey] = attrValue.filter((fieldName) => fieldsToPick.includes(fieldName));
        break;
      case 'allOf': {
        const newAllOf = [];
        // remove conditional ("if, then, else") if it does not contain any reference to fieldsToPick
        originalSchema.allOf.forEach((condition) => {
          if (isConditionalReferencingAnyPickedField(condition, fieldsToPick)) {
            console.log('entao');
            newAllOf.push(condition);
          }
        });
        newSchema[attrKey] = newAllOf;

        break;
      }
      default:
        newSchema[attrKey] = attrValue;
    }
  });

  return newSchema;
}

export function modify(originalSchema, config) {
  const schema = JSON.parse(JSON.stringify(originalSchema));

  // All these functions mutate "schema",
  // that's why we create a copy above
  rewriteFields(schema, config.fields);

  rewriteAllFields(schema, config.allFields);

  reorderFields(schema, config.order);

  const newSchema = pickFields(schema, config.pick);
  return newSchema;
}
