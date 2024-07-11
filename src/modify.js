import get from 'lodash/get';
import merge from 'lodash/merge';
import intersection from 'lodash/intersection';
import mergeWith from 'lodash/mergeWith';
import set from 'lodash/set';

const WARNING_TYPES = {
  FIELD_TO_CHANGE_NOT_FOUND: 'FIELD_TO_CHANGE_NOT_FOUND',
  ORDER_MISSING_FIELDS: 'ORDER_MISSING_FIELDS',
  FIELD_TO_CREATE_EXISTS: 'FIELD_TO_CREATE_EXISTS',
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

  if (inIf.length > 0) {
    return true;
  }

  const inThen =
    intersection(thenCondition.required, fieldsToPick) ||
    intersection(Object.keys(thenCondition.properties), fieldsToPick);

  if (inThen.length > 0) {
    return true;
  }

  const inElse =
    intersection(elseCondition.required, fieldsToPick) ||
    intersection(Object.keys(elseCondition.properties), fieldsToPick);

  if (inElse.length > 0) {
    return true;
  }

  return false;
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

    // recrusive
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

    // Nested, go recursive (fieldset)
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

function createFields(schema, fieldsConfig) {
  if (!fieldsConfig) return { warnings: null };

  const warnings = [];
  const fieldsToCreate = Object.entries(fieldsConfig);

  fieldsToCreate.forEach(([shortPath, fieldAttrs]) => {
    const fieldPath = shortToFullPath(shortPath);

    if (fieldAttrs.properties) {
      // Recursive to nested fields...
      const result = createFields(get(schema.properties, fieldPath), fieldAttrs.properties);
      warnings.push(result.warnings);
    }

    const fieldInSchema = get(schema.properties, fieldPath);

    if (fieldInSchema) {
      warnings.push({
        type: WARNING_TYPES.FIELD_TO_CREATE_EXISTS,
        message: `Creating field "${shortPath}" was ignored because it already exists.`,
      });
      return;
    }

    const fieldInObjectPath = set({}, fieldPath, standardizeAttrs(fieldAttrs));
    merge(schema.properties, fieldInObjectPath);
  });

  return { warnings: warnings.flat() };
}

function pickFields(originalSchema, pickConfig) {
  if (!pickConfig) return { schema: originalSchema, warnings: null };

  const fieldsToPick = pickConfig.fields;
  const newSchema = {
    properties: {},
  };

  Object.entries(originalSchema).forEach(([attrKey, attrValue]) => {
    switch (attrKey) {
      case 'properties':
        // TODO — handle recursive nested fieldsets
        fieldsToPick.forEach((fieldPath) => {
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

  // Look for unpicked fields in the conditionals...
  let missingFields = {};

  newSchema.allOf.forEach((condition, ix) => {
    const { if: ifCondition, then: thenCondition, else: elseCondition } = condition;

    missingFields = {
      ...missingFields,
      ...findMissingFields(ifCondition, {
        fields: fieldsToPick,
        path: `allOf[${ix}].if`,
      }),
      ...findMissingFields(thenCondition, {
        fields: fieldsToPick,
        path: `allOf[${ix}].then`,
      }),
      ...findMissingFields(elseCondition, {
        fields: fieldsToPick,
        path: `allOf[${ix}].else`,
      }),
    };
  });

  if (Object.keys(missingFields).length > 0) {
    // Read them to the new schema...
    Object.entries(missingFields).forEach(([fieldName]) => {
      set(newSchema.properties, fieldName, originalSchema.properties[fieldName]);
    });
    // And warn about it (the most important part!)
    pickConfig.onWarn({
      message: 'You picked a field with conditional fields. They got added:',
      missingFields,
    });
  }

  return newSchema;
}

function findMissingFields(conditional, { fields, path }) {
  if (!conditional) {
    return null;
  }

  let missingFields = {};

  conditional.required?.forEach((fieldName) => {
    if (!fields.includes(fieldName)) {
      missingFields[fieldName] = {
        path,
      };
    }
  });

  Object.entries(conditional.properties || []).forEach(([fieldName, fieldAttrs]) => {
    if (!fields.includes(fieldName)) {
      missingFields[fieldName] = { path };
    }

    if (fieldAttrs.properties) {
      const nested = findMissingFields(fieldAttrs.properties, fields);
      missingFields = {
        ...missingFields,
        ...nested,
      };
    }
  });

  return missingFields;
}

export function modify(originalSchema, config) {
  const schema = JSON.parse(JSON.stringify(originalSchema));
  // All these functions mutate "schema" that's why we create a copy above

  const resultRewrite = rewriteFields(schema, config.fields);
  rewriteAllFields(schema, config.allFields);

  const resultCreate = createFields(schema, config.create);

  const resultPick = pickFields(schema, config.pick);
  const finalSchema = resultPick.schema;
  const resultReorder = reorderFields(finalSchema, config.orderRoot);

  if (!config.muteLogging) {
    console.warn(
      'json-schema-form modify(): We highly recommend you to handle/report the returned `warnings` as they highlight possible bugs in your modifications. To mute this log, pass `muteLogging: true` to the config.'
    );
  }

  const warnings = [
    resultRewrite.warnings,
    resultCreate.warnings,
    resultPick.warnings,
    resultReorder.warnings,
  ]
    .flat()
    .filter(Boolean);

  return {
    schema: finalSchema,
    warnings,
  };
}
