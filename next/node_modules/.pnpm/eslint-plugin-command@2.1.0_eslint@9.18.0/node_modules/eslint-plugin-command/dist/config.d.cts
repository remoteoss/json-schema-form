import { Linter } from 'eslint';
import { ESLintPluginCommandOptions } from './types.cjs';
import '@typescript-eslint/utils';

declare function config(options?: ESLintPluginCommandOptions): Linter.FlatConfig;

export = config;
