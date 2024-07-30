#### 0.11.2-beta.0 (2024-07-30)

##### Bug Fixes

- **modify:**

  - Support x-jsf shorthands in all methods, fix TS declarations; ([#85](https://github.com/remoteoss/json-schema-form/pull/85)) ([9a87c19b](https://github.com/remoteoss/json-schema-form/commit/9a87c19b6d373a8f660dd24b20a48725f3dbe8d0))

- **createHeadlessForm:**

  - mark createHeadlessForm config.customProperties as deprecated ([#85](https://github.com/remoteoss/json-schema-form/pull/85)) ([9a87c19b](https://github.com/remoteoss/json-schema-form/commit/9a87c19b6d373a8f660dd24b20a48725f3dbe8d0))
  - support custom attributes as functions (do not execute them) ([#86](https://github.com/remoteoss/json-schema-form/pull/86)) ([3674fc87](https://github.com/remoteoss/json-schema-form/commit/3674fc87d44df44a5ba9b13b40465c2ccda448ca))

#### 0.11.1-beta.0 (2024-07-26)

##### Chores

- **modify:** Add missing Typescript declarations ([#84](https://github.com/remoteoss/json-schema-form/pull/84)) ([86b3af2a](https://github.com/remoteoss/json-schema-form/commit/86b3af2a31981718ad349ac8d08fbdce3aa86acf))

#### 0.11.0-beta.0 (2024-07-25)

##### Breaking changes

- **modify:**
  - Change the return result to include warnings ([#83](https://github.com/remoteoss/json-schema-form/pull/83)) ([e07fcec8](https://github.com/remoteoss/json-schema-form/commit/e07fcec8e11cfcba2b477e5e6339cebbcc42038c))

##### New Features

- **modify:**
  - Allow picking fields ([#79](https://github.com/remoteoss/json-schema-form/pull/79)) ([2e044021](https://github.com/remoteoss/json-schema-form/commit/2e044021f30292be81cede3805eefb4f1ea96dd9))
  - Add x-jsf-presentation shorthand ([#81](https://github.com/remoteoss/json-schema-form/pull/81)) ([7cfaab0b](https://github.com/remoteoss/json-schema-form/commit/7cfaab0bdbb05a1555f6c1d74b26b1e6d7fa8c43))
  - Allow creating fields ([#80](https://github.com/remoteoss/json-schema-form/pull/80)) ([8a82254d](https://github.com/remoteoss/json-schema-form/commit/8a82254d7cf5799471fa0bf2d3d09179f1327187))
  - Allow customize fields order ([#78](https://github.com/remoteoss/json-schema-form/pull/78)) ([adc88179](https://github.com/remoteoss/json-schema-form/commit/adc88179a5d1e5bd85371c0cc581b35964bf6edf))

##### Bug Fixes

- **modify:** Customize attrs as Array now overrides the value ([#82](https://github.com/remoteoss/json-schema-form/pull/82)) ([7cc0853e](https://github.com/remoteoss/json-schema-form/commit/7cc0853e30f0c06ff160d8a3e4c4b4e402a1e520))

#### 0.10.1-beta.0 (2024-07-23)

##### Chores

- **Text field docs:** Change naming of ID number property ([#74](https://github.com/remoteoss/json-schema-form/pull/74)) ([338ddd2a](https://github.com/remoteoss/json-schema-form/commit/338ddd2a5f008ec089f38db834f075100b856001))

#### 0.10.0-beta.0 (2024-06-20)

Adds `modify` utility for better customizations ([#75](https://github.com/remoteoss/json-schema-form/pull/75))

#### 0.9.1-beta.0 (2024-03-26)

##### Bug Fixes

- **select/radio:** Allow numbers in oneOf ([#49](https://github.com/remoteoss/json-schema-form/pull/49)) ([04c2598a](https://github.com/remoteoss/json-schema-form/commit/04c2598a3f4e31d8a9495e0d69c0427b6b8c9f56))

#### 0.9.0-beta.0 (2024-03-11)

##### Breaking changes

- Rename `value` -> `forcedValue`. This is in regards to the `json-logic`, where a "forced value" will now be returned in each relevant field (i.e. fields where the schema `const` and `default` are the same) with `forcedValue` over `value`. ([#66](https://github.com/remoteoss/json-schema-form/pull/66)) ([77c445a9](https://github.com/remoteoss/json-schema-form/commit/77c445a9dce657a7648642312f22c18f972187c7))

#### 0.8.2-beta.0 (2024-02-13)

##### Bug Fixes

- **helpers:** getFieldOptions - return empty array if oneOf missing in radio ([#67](https://github.com/remoteoss/json-schema-form/pull/67)) ([6511330f](https://github.com/remoteoss/json-schema-form/commit/6511330f55a2accedb1c58a61ff915a3a0186dbb))

#### 0.8.1-beta.0 (2024-02-12)

##### Bug Fixes

- **conditionals:** Certain conditions in a JSON schema were failing. This bugfix adds missing field context to the evaluation to prevent the error. ([#65](https://github.com/remoteoss/json-schema-form/pull/65)) ([6755a2fd](https://github.com/remoteoss/json-schema-form/commit/6755a2fd29f3f806a57ba19e29ad7e21daf9e51b))

#### 0.8.0-beta.0 (2024-02-01)

##### Bug Fixes

- **fieldset:** Support customProperties with sub-fields clashing with reserved words. ([#64](https://github.com/remoteoss/json-schema-form/pull/64)) ([8340cdea](https://github.com/remoteoss/json-schema-form/commit/8340cdea27b711064079055af939a595d1c38031))

#### 0.7.6-beta.0 (2024-01-23)

##### Chores

BREAKING CHANGES:

- **select:** Remove creatable logic ([#62](https://github.com/remoteoss/json-schema-form/pull/62)) ([0a6273c6](https://github.com/remoteoss/json-schema-form/commit/0a6273c63049a2f03bcf0b212dec6455ab48b5e5)) Added in 0.7.1

#### 0.7.5-beta.0 (2023-11-15)

##### Chores

- Follow-up of #57. Ignore internal attributes from conditional attributes removal (`visibilityCondition`) ([#59](https://github.com/remoteoss/json-schema-form/pull/59)) ([57fe4468](https://github.com/remoteoss/json-schema-form/commit/57fe446834636d727a5da5a91f7e5f3cc4eab8f8))

#### 0.7.4-beta.0 (2023-11-07)

##### Chores

- Follow-up of #57. Ignore internal attributes from conditional attributes removal (`Component`, `calculateDynamicProperties`) ([#58](https://github.com/remoteoss/json-schema-form/pull/58)) ([ee762c2e](https://github.com/remoteoss/json-schema-form/commit/ee762c2e90834a9ec0d7b88af47cefe1e3a03dd1))

#### 0.7.3-beta.0 (2023-11-07)

##### Bug Fixes

- Remove conditional attributes after the condition is unmatched ([#57](https://github.com/remoteoss/json-schema-form/pull/57)) ([8bac7145](https://github.com/remoteoss/json-schema-form/commit/8bac7145dfdd4136c0613044389666a614eb12f7))

#### 0.7.2-beta.0 (2023-11-06)

##### Bug Fixes

- **select/radio:** Support oneOf[].pattern validation ([#47](https://github.com/remoteoss/json-schema-form/pull/47)) ([5a4bb592](https://github.com/remoteoss/json-schema-form/commit/5a4bb59266ff595a9cb65f5b261a4ae2f3ad279f))

#### 0.7.1-beta.0 (2023-10-31)

##### Bug Fixes

- **select:** support string type ([#54](https://github.com/remoteoss/json-schema-form/pull/54)) ([b00f8776](https://github.com/remoteoss/json-schema-form/commit/b00f8776aa244803375ba64fbdd52c8fff9b9bd8))

#### 0.7.0-beta.0 (2023-10-23)

##### Chores

BREAKING CHANGES:

- **Description/Extra/Statement fields:** We have removed the sorrounding spans that we output in these fields ([#17](https://github.com/remoteoss/json-schema-form/pull/27)) ([6257533](https://github.com/remoteoss/json-schema-form/commit/6257533bead9c0f7391f240c2e5bacc801a90af7))

```diff
-description: '<span class="jsf-description">Write in <b>hh:ss</b> format</span>',
+description: 'Write in <b>hh:ss</b> format',
```

#### 0.6.6-beta.0 (2023-10-17)

##### Chores

- **github:** Add template for issues and pull requests ([#45](https://github.com/remoteoss/json-schema-form/pull/45)) ([621e3338](https://github.com/remoteoss/json-schema-form/commit/621e33389638541e771d2229c91655e430ea7ec4))

##### Bug Fixes

- allow 0 in const validation ([#48](https://github.com/remoteoss/json-schema-form/pull/48)) ([cde19fc9](https://github.com/remoteoss/json-schema-form/commit/cde19fc960c4eacdde476ddcdd8c650a4ff5ce96))

#### 0.6.5-beta.0 (2023-09-18)

##### Changes

- json-logic: Add conditional logic checking. ([#41](https://github.com/remoteoss/json-schema-form/pull/41)) ([6292b01e](https://github.com/remoteoss/json-schema-form/commit/6292b01e3f77a9038328d7375080ffc4cb30dbc8))

###### Full API additions now supported from 0.6.5 onwards.

- New custom JSON Schema keyword `x-jsf-logic` added to support cross-field validations. Built on top of [JsonLogic](https://jsonlogic.com/).

- `x-jsf-logic` can contain:

  - `validations` - JsonLogic rules that validate fields and return booleans
  - `computedValues` - JsonLogic rules that compute dynamic values
  - `allOf.if/then/else` - Conditional logic using validations and computedValues

- New property `x-jsf-logic-validations` added to individual schema properties. Lists the validation names that should run on that property.
- New property `x-jsf-logic-computedAttrs` added to individual schema properties. Allows computed values to be used for attributes like `title`, `description`, `const`, etc.
- Computed values and validations defined in `x-jsf-logic` can reference schema properties using `vars` and any syntax supported from [JsonLogic](https://jsonlogic.com/).

- Conditional logic blocks allow selectively requiring fields or applying attributes based on validations/computed values.

While docs are underway, you can read examples from all the [tests](https://github.com/remoteoss/json-schema-form/blob/main/src/tests/jsonLogic.test.js) along with the [sample schemas](https://github.com/remoteoss/json-schema-form/blob/main/src/tests/jsonLogic.fixtures.js).

In short: `x-jsf-logic` is added to support complex conditional cross-field validations. Properties like `x-jsf-logic-validations` allow hooking those up to individual fields.

#### 0.6.4-beta.0 (2023-09-15)

##### Changes

- json-logic: computedAttrs - handle inline rules ([#40](https://github.com/remoteoss/json-schema-form/pull/40)) ([860ad91b](https://github.com/remoteoss/json-schema-form/commit/860ad91b034ab35d4d4bc51c0c04675f102bf278))

#### 0.6.1-beta.0 (2023-09-13)

##### Changes

- json-logic: Computed string based values ([#37](https://github.com/remoteoss/json-schema-form/pull/37)) ([6e042ea5](https://github.com/remoteoss/json-schema-form/commit/6e042ea579497ea573710c307a6ff7ee2f19b931))

#### 0.5.0-beta.0 (2023-09-12)

##### Changes

- json-logic: Computed Attributes ([#36](https://github.com/remoteoss/json-schema-form/pull/36)) ([80c29589](https://github.com/remoteoss/json-schema-form/commit/80c29589ac0972e0f33add70a59df15a46db1b43))
- json-logic: Initial skeleton implementation ([#35](https://github.com/remoteoss/json-schema-form/pull/35)) ([63149ae8](https://github.com/remoteoss/json-schema-form/commit/63149ae863cf1b5ad76a3b2a49c7f343e55ce07b))

#### 0.4.5-beta.0 (2023-08-31)

##### Bug fixes

- Validate values based on `const` key ([#34](https://github.com/remoteoss/json-schema-form/pull/34)) ([bf07870d](https://github.com/remoteoss/json-schema-form/commit/bf07870d407d9b9b078882a078b9e4c7928df868))

#### 0.4.4-beta.0 (2023-08-30)

##### Chores

- **fieldset:** ignore values not matching the field type ([#44](https://github.com/remoteoss/json-schema-form/pull/44)) ([f0af54e5](https://github.com/remoteoss/json-schema-form/commit/f0af54e5d425fb78524ab150bb31629d00369a61))

#### 0.4.3-beta.0 (2023-08-09)

##### Bug fixes

- **conditions:** Validate a deeply nested if (e.g. checking an object with a number property) in an if property now doesn't break the form. ([#33](https://github.com/remoteoss/json-schema-form/pull/33)) ([e34cfcc](https://github.com/remoteoss/json-schema-form/commit/e34cfccaf45f1460b346f3cff0c797b3d11259e3))

#### 0.4.2-beta.0 (2023-07-20)

##### Bug Fixes

- **date:** Validate based on minDate and maxDate ([#30](https://github.com/remoteoss/json-schema-form/pull/30)) ([01c0143e](https://github.com/remoteoss/json-schema-form/commit/01c0143ea4a3775f9489ae6cb8fd99a90b3f1394))

#### 0.4.1-beta.0 (2023-07-03)

##### Bug Fixes

- **fieldset:** support root conditionals for fieldsets ([#23](https://github.com/remoteoss/json-schema-form/pull/23)) ([65d87b3a](https://github.com/remoteoss/json-schema-form/commit/65d87b3a93018f0729aed565000eb2a2ce1f2ce7))
- **select/radio:** Accept just the values in options (plus `''` and `null` for backward-compatibility) ([#18](https://github.com/remoteoss/json-schema-form/pull/18)) ([37501d2d](https://github.com/remoteoss/json-schema-form/commit/37501d2ddafdd5e207b34d2ca3f6b7b7a1006e9d))

#### 0.4.0-beta.0 (2023-06-22)

##### New Features

BREAKING CHANGES:

- **Radio/Select:** In each option, spread `x-jsf-presentation` value to option root ([#17](https://github.com/remoteoss/json-schema-form/pull/17)) ([367688c2](https://github.com/remoteoss/json-schema-form/commit/367688c24e212c1a0a1d2e7b19cbd7efa7021a15))

#### 0.3.0-beta.0 (2023-06-21)

##### Fixes

- **Text:** Fix validation to only accept strings ([#12](https://github.com/remoteoss/json-schema-form/pull/12)) ([00017c0](https://github.com/remoteoss/json-schema-form/commit/00017c056d8a3583d56d9fefc4d3c7e0f4c1dd99))

##### Chores

- Update Yup to v.0.30.0 ([#12](https://github.com/remoteoss/json-schema-form/pull/12)) ([00017c0](https://github.com/remoteoss/json-schema-form/commit/00017c056d8a3583d56d9fefc4d3c7e0f4c1dd99))

#### 0.2.0-beta.0 (2023-06-20)

##### New Features

- Add Typescript declarations to the library ([2404188c](https://github.com/remoteoss/json-schema-form/commit/2404188cba52a5a665f257430a65a0ebb938dd44))

##### Fixes

- **Number:** Support maximum 0 ([#10](https://github.com/remoteoss/json-schema-form/pull/10)) ([1e9d6cf9](https://github.com/remoteoss/json-schema-form/commit/1e9d6cf96436cf16018e045b351567c643e10dac))

##### Chores

- Add json-schema-form meta schema ([#6](https://github.com/remoteoss/json-schema-form/pull/6)) ([414a5fe2](https://github.com/remoteoss/json-schema-form/commit/414a5fe2cf2b015a8761f554f03bbb507fae1784))

#### 0.1.0-beta.0 (2023-05-18)

##### New Features

- Initial release ([#1](https://github.com/remoteoss/json-schema-form/pull/1)) ([9a687351](https://github.com/remoteoss/json-schema-form/commit/9a6873513445a7a53e9f9222d457c5ce585cbbd8) and ([#5](https://github.com/remoteoss/json-schema-form/pull/5)) ([ceb6f47b](https://github.com/remoteoss/json-schema-form/commit/ceb6f47b3d1ff031e1789a504af32ecc36834d8e))
