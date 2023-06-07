import { useState } from "react";

import "./styles.css";
import { createHeadlessForm } from "../../src/index";

import {
  Box,
  Stack,
  LabelRadio,
  RadioOptions,
  Fieldset,
  InputText,
  Hint,
  ErrorMessage,
  Label
} from "./App.styled";
import { formValuesToJsonValues, getDefaultValuesFromFields } from "./utils";

const jsonSchemaDemo = {
  type: "object",
  additionalProperties: false,
  properties: {
    phone: {
      title: "Your phone",
      oneOf: [
        {
          title: "Android",
          value: "android"
        },
        {
          title: "iPhone",
          value: "iphone"
        },
        {
          title: "Other",
          value: "other"
        }
      ],
      presentation: {
        inputType: "select",
        position: 0
      },
      type: "string"
    }
  },
  required: ["phone"]
};

const fieldsMap = {
  text: FieldText,
  number: FieldNumber,
  radio: FieldRadio,
  error: FieldUnknown,
  select: FieldSelect
};

export default function WithReact() {
  const { fields, handleValidation } = createHeadlessForm(jsonSchemaDemo, {
    strictInputType: false // so you don't need to pass presentation.inputType
  });
  async function handleOnSubmit(jsonValues, { formValues }) {
    alert(
      `Submitted with succes! ${JSON.stringify(
        { formValues, jsonValues },
        null,
        3
      )}`
    );
    console.log("Submitted!", { formValues, jsonValues });
  }

  return (
    <article>
      <h1>json-schema-form + React</h1>
      <p>This demo uses React without any other Form library.</p>
      <br />

      <SmartForm
        onSubmit={handleOnSubmit}
        // From JSF
        fields={fields}
        handleValidation={handleValidation}
      />
    </article>
  );
}

// ===============================
// ====== UI COMPONENTS ==========
// ===============================

function SmartForm({ name, fields, handleValidation, onSubmit }) {
  const [values, setValues] = useState(() =>
    getDefaultValuesFromFields(fields)
  );
  const [errors, setErrors] = useState({});
  const [submited, setSubmited] = useState(false);

  function handleInternalValidation(valuesToValidate) {
    const valuesForJson = formValuesToJsonValues(valuesToValidate, fields);
    const { formErrors } = handleValidation(valuesForJson);

    setErrors(formErrors || {});

    return {
      errors: formErrors,
      jsonValues: valuesForJson
    };
  }

  function handleFieldChange(fieldName, value) {
    const newValues = {
      ...values,
      [fieldName]: value
    };
    setValues(newValues);

    handleInternalValidation(newValues);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmited(true);

    const validation = handleInternalValidation({ phone: "foo" });

    if (validation.errors) {
      return null;
    }

    return onSubmit(validation.jsonValues, { formValues: values });
  }

  return (
    <form name={name} onSubmit={handleSubmit} noValidate>
      <Stack gap="24px">
        {fields?.map((field) => {
          const { name: fieldName, inputType } = field;
          const FieldComponent = fieldsMap[inputType] || fieldsMap.error;

          return (
            <FieldComponent
              key={fieldName}
              value={values?.[fieldName]}
              error={errors[fieldName]}
              submited={submited}
              onChange={handleFieldChange}
              {...field}
            />
          );
        })}

        <button type="submit">Submit</button>
      </Stack>
    </form>
  );
}

function FieldText({
  type,
  name,
  label,
  description,
  value,
  isVisible,
  error,
  submited,
  onChange,
  required,
  ...props
}) {
  const [touched, setTouched] = useState(false);

  if (!isVisible) return null;

  function handleChange(e) {
    if (!touched) setTouched(true);
    onChange(name, e.target.value);
  }

  return (
    <Box>
      <Label htmlFor={name}>{label}</Label>
      {description && <Hint id={`${name}-description`}>{description}</Hint>}
      <InputText
        id={name}
        type="text"
        defaultValue={value}
        onChange={handleChange}
        aria-invalid={!!error}
        aria-describedby={`${name}-error ${name}-description`}
        aria-required={required}
        {...props}
      />
      {(touched || submited) && error && (
        <ErrorMessage id={`${name}-error`}>{error}</ErrorMessage>
      )}
    </Box>
  );
}

function FieldNumber(props) {
  return (
    <FieldText
      inputMode="decimal"
      // accepts numbers and dots (eg 10, 15.50)
      pattern="^[0-9.]*$"
      {...props}
    />
  );
}

function FieldRadio({
  name,
  label,
  description,
  value,
  options,
  isVisible,
  error,
  submited,
  onChange
}) {
  const [touched, setTouched] = useState(false);

  if (!isVisible) return null;

  function handleChange(e) {
    if (!touched) setTouched(true);
    onChange(name, e.target.value);
  }

  const displayError = submited || touched ? error : null;

  return (
    <Fieldset key={name}>
      {/* A11Y errors: https://blog.tenon.io/accessible-validation-of-checkbox-and-radiobutton-groups/ */}
      <Label as="legend" aria-label={`${label} ${displayError}`}>
        {label}
      </Label>
      {description && <Hint>{description}</Hint>}
      <RadioOptions onChange={handleChange}>
        {options.map((opt) => (
          <LabelRadio key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={value === opt.value}
            />
            {opt.label}
          </LabelRadio>
        ))}
      </RadioOptions>
      {displayError && <ErrorMessage>{displayError}</ErrorMessage>}
    </Fieldset>
  );
}

function FieldUnknown({ type, name, error }) {
  return (
    <p style={{ border: "1px dashed gray", padding: "8px" }}>
      Field "{name}" unsupported: The type "{type}" has no UI component built
      yet.
      {error && <ErrorMessage id={`${name}-error`}>{error}</ErrorMessage>}
    </p>
  );
}

function FieldSelect({
  name,
  label,
  description,
  value,
  options,
  isVisible,
  error,
  submited,
  onChange
}) {
  const [touched, setTouched] = useState(false);

  if (!isVisible) return null;

  function handleChange(e) {
    if (!touched) setTouched(true);
    onChange(name, e.target.value);
  }

  const displayError = submited || touched ? error : null;

  return (
    <Fieldset key={name}>
      {/* A11Y errors: https://blog.tenon.io/accessible-validation-of-checkbox-and-radiobutton-groups/ */}
      <Label as="legend" aria-label={`${label} ${displayError}`}>
        {label}
      </Label>
      {description && <Hint>{description}</Hint>}
      <select value={value} onChange={handleChange}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {displayError && <ErrorMessage>{displayError}</ErrorMessage>}
    </Fieldset>
  );
}
