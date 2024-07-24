import difference from 'lodash/difference';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import set from 'lodash/set';

const WARNING_TYPES = {
  FIELD_TO_CHANGE_NOT_FOUND: 'FIELD_TO_CHANGE_NOT_FOUND',
  ORDER_MISSING_FIELDS: 'ORDER_MISSING_FIELDS',
  FIELD_TO_CREATE_EXISTS: 'FIELD_TO_CREATE_EXISTS',
  PICK_MISSED_FIELD: 'PICK_MISSED_FIELD',
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

function pickFields(originalSchema, fieldsToPick) {
  if (!fieldsToPick) {
    return { schema: originalSchema, warnings: null };
  }

  const newSchema = {
    properties: {},
  };

  Object.entries(originalSchema).forEach(([attrKey, attrValue]) => {
    switch (attrKey) {
      case 'properties':
        // TODO — handle recursive nested fields
        fieldsToPick.forEach((fieldPath) => {
          set(newSchema.properties, fieldPath, attrValue[fieldPath]);
        });
        break;
      case 'x-jsf-order':
      case 'required':
        newSchema[attrKey] = attrValue.filter((fieldName) => fieldsToPick.includes(fieldName));
        break;
      case 'allOf': {
        // remove conditionals that do not contain any reference to fieldsToPick
        const newAllOf = originalSchema.allOf.filter((condition) =>
          isConditionalReferencingAnyPickedField(condition, fieldsToPick)
        );

        newSchema[attrKey] = newAllOf;

        break;
      }
      default:
        newSchema[attrKey] = attrValue;
    }
  });

  // Look for unpicked fields in the conditionals...
  let missingFields = {};
  newSchema.allOf.forEach((condition) => {
    const { if: ifCondition, then: thenCondition, else: elseCondition } = condition;
    const index = originalSchema.allOf.indexOf(condition);
    missingFields = {
      ...missingFields,
      ...findMissingFields(ifCondition, {
        fields: fieldsToPick,
        path: `allOf[${index}].if`,
      }),
      ...findMissingFields(thenCondition, {
        fields: fieldsToPick,
        path: `allOf[${index}].then`,
      }),
      ...findMissingFields(elseCondition, {
        fields: fieldsToPick,
        path: `allOf[${index}].else`,
      }),
    };
  });

  const warnings = [];

  if (Object.keys(missingFields).length > 0) {
    // Re-add them to the schema...
    Object.entries(missingFields).forEach(([fieldName]) => {
      set(newSchema.properties, fieldName, originalSchema.properties[fieldName]);
    });

    warnings.push({
      type: WARNING_TYPES.PICK_MISSED_FIELD,
      message: `The picked fields have related conditional fields that got added automatically. ${Object.keys(
        missingFields
      ).join(', ')}. Check "meta" for more details.`,
      meta: missingFields,
    });
  }

  return { schema: newSchema, warnings };
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

  Object.entries(conditional.properties || []).forEach(([fieldName]) => {
    if (!fields.includes(fieldName)) {
      missingFields[fieldName] = { path };
    }

    // TODO support nested fields (eg if properties.adddress.properties.door_number)
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
