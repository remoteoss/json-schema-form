import { JSONSchemaFormConfiguration } from '../types';

export function getValidator(config: JSONSchemaFormConfiguration) {
  const validator = config.plugins?.find((plugin) => plugin.name === config.validator);

  if (validator === undefined)
    throw new Error(
      'You must define a validator in `createHeadlessForm(schema, config) where config has a property of `validator`.`'
    );

  return validator;
}
