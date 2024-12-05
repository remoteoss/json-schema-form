import { flow } from 'lodash';
import inRange from 'lodash/inRange';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import isObject from 'lodash/isObject';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';

import { pickXKey } from './internals/helpers';
import { buildYupSchema } from './yupSchema';

export const SUPPORTED_CUSTOM_VALIDATION_FIELD_PARAMS = ['minimum', 'maximum'];

const isCustomValidationAllowed = (fieldParams) => (customValidation, customValidationKey) => {
  // don't apply custom validation in cases when the fn returns null.
  if (isNil(customValidation)) {
    return false;
  }

  const { minimum, maximum } = fieldParams;
  const isAllowed = inRange(
    customValidation,
    minimum ?? -Infinity,
    maximum ? maximum + 1 : Infinity
  );

  if (!isAllowed) {
    const errorMessage = `Custom validation for ${fieldParams.name} is not allowed because ${customValidationKey}:${customValidation} is less strict than the original range: ${minimum} to ${maximum}`;

    if (process.env.NODE_ENV === 'development') {
      throw new Error(errorMessage);
    } else {
      // eslint-disable-next-line no-console
      console.warn(errorMessage);
    }
  }

  return isAllowed;
};

export function calculateCustomValidationProperties(fieldParams, customProperties) {
  return (isRequired, conditionBranch, formValues) => {
    const params = { ...fieldParams, ...conditionBranch?.properties?.[fieldParams.name] };
    const presentation = pickXKey(params, 'presentation') ?? {};

    const supportedParams = pick(customProperties, SUPPORTED_CUSTOM_VALIDATION_FIELD_PARAMS);

    const checkIfAllowed = isCustomValidationAllowed(params);

    const customErrorMessages = [];
    const fieldParamsWithNewValidation = mapValues(
      supportedParams,
      (customValidationValue, customValidationKey) => {
        const originalValidation = params[customValidationKey];

        const customValidation = isFunction(customValidationValue)
          ? customValidationValue(formValues, params)
          : customValidationValue;

        if (isObject(customValidation)) {
          if (checkIfAllowed(customValidation[customValidationKey], customValidationKey)) {
            customErrorMessages.push(pickXKey(customValidation, 'errorMessage'));

            return customValidation[customValidationKey];
          }

          return originalValidation;
        }

        return checkIfAllowed(customValidation, customValidationKey)
          ? customValidation
          : originalValidation;
      }
    );

    const errorMessage = Object.assign({ ...params.errorMessage }, ...customErrorMessages);

    return {
      ...params,
      ...fieldParamsWithNewValidation,
      type: presentation?.inputType || params.inputType,
      errorMessage,
      required: isRequired,
      schema: flow(
        buildYupSchema({
          ...params,
          ...fieldParamsWithNewValidation,
          errorMessage,
          required: isRequired,
        })
      ),
    };
  };
}
