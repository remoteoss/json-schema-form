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
