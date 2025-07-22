#### 1.0.2 (2025-07-22)

##### Bug Fixes

*  use commiter date as sorting order for tags, not version ([#220](https://github.com/remoteoss/json-schema-form/pull/220)) ([53a2464e](https://github.com/remoteoss/json-schema-form/commit/53a2464e0d1327368affe616df3f0ea6495e55b6))
*  update changelog on non-dev release ([#219](https://github.com/remoteoss/json-schema-form/pull/219)) ([9e313591](https://github.com/remoteoss/json-schema-form/commit/9e313591115fef475c0b74c278f7309c1752acac))

#### 1.0.1

##### Bug fixes

* fix: allow for computed values to be used inside conditionals (#215)
* fix(conditionals): respect "if" blocks that are booleans (#216)

#### 1.0.0

##### Migrating from v0

The migration guide can be found [here](https://github.com/remoteoss/json-schema-form/blob/main/MIGRATING.md)

##### Bug Fixes

*  Improve release scripts [#214](https://github.com/remoteoss/json-schema-form/pull/214))

#### 1.0.0-beta.12 (2025-07-16)

##### Chores

*  prepare release script for official releases ([#210](https://github.com/remoteoss/json-schema-form/pull/210)) ([74a569e7](https://github.com/remoteoss/json-schema-form/commit/74a569e7bcc4853a1a53f1242895b38aaa39ec45))
*  Explain ValidationOptions are a backward-compatibility with v0 mistakes ([#211](https://github.com/remoteoss/json-schema-form/pull/211)) ([f361513d](https://github.com/remoteoss/json-schema-form/commit/f361513d11e1ea5bbd67dc6ceeb2670a1022b270))

##### Bug Fixes

*  properly handle function as custom field properties ([#213](https://github.com/remoteoss/json-schema-form/pull/213)) ([a2e8f4d0](https://github.com/remoteoss/json-schema-form/commit/a2e8f4d0c71fb98e6210062f4c27ed6169a41bc2))
*  rename validationOptions to legacyOptions ([#212](https://github.com/remoteoss/json-schema-form/pull/212)) ([3cd3c3c2](https://github.com/remoteoss/json-schema-form/commit/3cd3c3c217dbdfee9f27d4f148214cac3510a06c))

#### 1.0.0-beta.11 (2025-07-14)

##### Chores

*  improve migration doc ([#207](https://github.com/remoteoss/json-schema-form/pull/207)) ([bbd1158f](https://github.com/remoteoss/json-schema-form/commit/bbd1158fd62df10f82c0e8fbcd04383125ab0f8e))
*  rename github actions ([#206](https://github.com/remoteoss/json-schema-form/pull/206)) ([71e3b776](https://github.com/remoteoss/json-schema-form/commit/71e3b77654dcf331c7359db0f4d0535d125205bf))
*  move next codebase to root and added migration guide ([#204](https://github.com/remoteoss/json-schema-form/pull/204)) ([dc41922d](https://github.com/remoteoss/json-schema-form/commit/dc41922d1b3003bb3e78653c3446b199a77fd8c7))
*  move v0 code to separate folder ([8314149e](https://github.com/remoteoss/json-schema-form/commit/8314149ecfeac8d7d6c1a5e0fc08fdcdc9013250))
*  adjust eslint rules for if statements and fix new errors ([#201](https://github.com/remoteoss/json-schema-form/pull/201)) ([738378f7](https://github.com/remoteoss/json-schema-form/commit/738378f78b1fd85c195ff616fea75e2f40f44091))

##### New Features

* **v1:**  add support for shorthands on modifySchema ([3432b75d](https://github.com/remoteoss/json-schema-form/commit/3432b75dcbe53a25c7e0cc676362be2095b77dda))

##### Bug Fixes

*  adapt v1 scripts to use correct paths ([#209](https://github.com/remoteoss/json-schema-form/pull/209)) ([b5a97265](https://github.com/remoteoss/json-schema-form/commit/b5a972658312641f2082559b566267000de4e812))
*  fix v1 script paths ([#208](https://github.com/remoteoss/json-schema-form/pull/208)) ([29e734e2](https://github.com/remoteoss/json-schema-form/commit/29e734e2995cc3131fae6a9da6b56c2effd671f8))

#### 1.0.0-beta.10 (2025-07-01)

##### Chores

* throw error when deprecated modifyConfig option is passed to createHeadlessForm ([#199](https://github.com/remoteoss/json-schema-form/pull/199)) ([5be36cda](https://github.com/remoteoss/json-schema-form/commit/5be36cdaf602b11c543e1a63046a3979a7e68038))

#### 1.0.0-beta.9 (2025-06-30)

##### Bug Fixes

* don't fail validation when oneOf array is empty ([#198](https://github.com/remoteoss/json-schema-form/pull/198)) ([03bfb787](https://github.com/remoteoss/json-schema-form/commit/03bfb7874f0075ab5c0594b07cfe2acafecf7e99))

#### 1.0.0-beta.8 (2025-06-05)

##### Chores

* refactor field building approach + fix some issues with v0 backward compatibility ([#193](https://github.com/remoteoss/json-schema-form/pull/193)) ([6f2e7d74](https://github.com/remoteoss/json-schema-form/commit/6f2e7d7463e03d0287b9c51e2bc3dc48bb4f457f))
* **README:**  Better explain JSF, mention the Playground and next version v1 ([#192](https://github.com/remoteoss/json-schema-form/pull/192)) ([4efb07e3](https://github.com/remoteoss/json-schema-form/commit/4efb07e3cd27a2e0a79b704e57e12432c80310f2))

##### New Features

* add allowForbiddenValues validation option ([#194](https://github.com/remoteoss/json-schema-form/pull/194)) ([bb59dac6](https://github.com/remoteoss/json-schema-form/commit/bb59dac677c9f1a2ceecd6eba6786a6e1b443fe8))
* allowing x-jsf-logic to affect field attributes ([#179](https://github.com/remoteoss/json-schema-form/pull/179)) ([2d80c2d7](https://github.com/remoteoss/json-schema-form/commit/2d80c2d7e0cb0efc7ccce9c17f669b5498cd5616))

##### Bug Fixes

* check for emptiness of required array/object properties values ([#191](https://github.com/remoteoss/json-schema-form/pull/191)) ([d59eb3ad](https://github.com/remoteoss/json-schema-form/commit/d59eb3ad08c6d158061b885525d465e392ca2816))

#### 1.0.0-beta.7 (2025-05-20)

##### Bug Fixes

- don't override `options` property provided via `x-jsf-presentation` ([#189](https://github.com/remoteoss/json-schema-form/pull/189)) ([5e81ca8e](https://github.com/remoteoss/json-schema-form/commit/5e81ca8e407b06eef1c1f7fb699d06c2a5bc5862))

#### 1.0.0-beta.6 (2025-05-20)

##### Bug Fixes

- fixes a bug where a fields required status was not updated through conditional schemas ([#188](https://github.com/remoteoss/json-schema-form/pull/188)) ([345ed303](https://github.com/remoteoss/json-schema-form/commit/345ed303ab27f555b26bef87aa8ac134b3c6e361))

#### 1.0.0-beta.5 (2025-05-19)

##### Bug Fixes

- export types correctly ([#186](https://github.com/remoteoss/json-schema-form/pull/186))

#### 1.0.0-beta.4 (2025-05-14)

##### Chores

- Type JSONSchema enum as unknown for better type safety ([#184](https://github.com/remoteoss/json-schema-form/pull/184)) ([e745444c](https://github.com/remoteoss/json-schema-form/commit/e745444c112337c22def693a924eae49f575c14d))

##### New Features

- group-array field support ([#177](https://github.com/remoteoss/json-schema-form/pull/177)) ([e32f69b7](https://github.com/remoteoss/json-schema-form/commit/e32f69b771ab245583c3f4e167ab67b8f36b9a3f))

#### 1.0.0-beta.3 (2025-04-23)

##### Chores

- fix linter and type checker warnings ([#166](https://github.com/remoteoss/json-schema-form/pull/166)) ([5592a206](https://github.com/remoteoss/json-schema-form/commit/5592a2067799ec2f0427cb3089674357c8829329))

##### New Features

- implement file validation ([#168](https://github.com/remoteoss/json-schema-form/pull/168)) ([2feb459c](https://github.com/remoteoss/json-schema-form/commit/2feb459c6dab2c5a26587a0fe042360940467e9d))
- custom validations with json logic ([eb26fab5](https://github.com/remoteoss/json-schema-form/commit/eb26fab56c46fb190e7988ba0585d514200e2bc9))
- DEVXP-2540: validate arrays ([#165](https://github.com/remoteoss/json-schema-form/pull/165)) ([b7d110eb](https://github.com/remoteoss/json-schema-form/commit/b7d110eb6d9690f6d053d1b325961f014b748900))
- add modify utility ([52af6b78](https://github.com/remoteoss/json-schema-form/commit/52af6b78c8580463838c4b225888318b87d8c79a))

##### Bug Fixes

- fix version number ([#170](https://github.com/remoteoss/json-schema-form/pull/170)) ([4d9484cd](https://github.com/remoteoss/json-schema-form/commit/4d9484cd717d8d7ff34faf514882b98e7d0efc48))
- fallback to schema type when presentation is not present ([4f213051](https://github.com/remoteoss/json-schema-form/commit/4f21305147a195495870d5a951aed49e110f08b6))

#### 1.0.0-beta.1 (2025-04-15)
