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
