#### 0.5.0-beta.0 (2023-09-12)

##### Changes

- Computed Attributes ([#36](https://github.com/remoteoss/json-schema-form/pull/36)) ([80c29589](https://github.com/remoteoss/json-schema-form/commit/80c29589ac0972e0f33add70a59df15a46db1b43))
- JSON Logic Skeleton ([#35](https://github.com/remoteoss/json-schema-form/pull/35)) ([63149ae8](https://github.com/remoteoss/json-schema-form/commit/63149ae863cf1b5ad76a3b2a49c7f343e55ce07b))

#### 0.4.5-beta.0 (2023-08-31)

##### Changes

* Allow validation of consts to support single values ([#34](https://github.com/remoteoss/json-schema-form/pull/34)) ([bf07870d](https://github.com/remoteoss/json-schema-form/commit/bf07870d407d9b9b078882a078b9e4c7928df868))

#### 0.4.4-beta.0 (2023-08-30)

##### Chores

* **fieldset:**  ignore values not matching the field type ([#44](https://github.com/remoteoss/json-schema-form/pull/44)) ([f0af54e5](https://github.com/remoteoss/json-schema-form/commit/f0af54e5d425fb78524ab150bb31629d00369a61))

#### 0.4.3-beta.0 (2023-08-09)

##### Bug fixes

* **conditions:** Validate a deeply nested if (e.g. checking an object with a number property) in an if property now doesn't break the form. ([#33](https://github.com/remoteoss/json-schema-form/pull/33)) ([e34cfcc](https://github.com/remoteoss/json-schema-form/commit/e34cfccaf45f1460b346f3cff0c797b3d11259e3))

#### 0.4.2-beta.0 (2023-07-20)

##### Bug Fixes

* **date:**  Validate based on minDate and maxDate ([#30](https://github.com/remoteoss/json-schema-form/pull/30)) ([01c0143e](https://github.com/remoteoss/json-schema-form/commit/01c0143ea4a3775f9489ae6cb8fd99a90b3f1394))

#### 0.4.1-beta.0 (2023-07-03)

##### Bug Fixes

* **fieldset:**  support root conditionals for fieldsets ([#23](https://github.com/remoteoss/json-schema-form/pull/23)) ([65d87b3a](https://github.com/remoteoss/json-schema-form/commit/65d87b3a93018f0729aed565000eb2a2ce1f2ce7))
* **select/radio:**  Accept just the values in options (plus `''` and `null` for backward-compatibility) ([#18](https://github.com/remoteoss/json-schema-form/pull/18)) ([37501d2d](https://github.com/remoteoss/json-schema-form/commit/37501d2ddafdd5e207b34d2ca3f6b7b7a1006e9d))

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
