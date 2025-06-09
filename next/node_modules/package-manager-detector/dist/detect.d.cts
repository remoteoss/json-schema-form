import { D as DetectOptions, d as DetectResult, a as AgentName } from './shared/package-manager-detector.ncFwAKgD.cjs';

/**
 * Detects the package manager used in the project.
 * @param options {DetectOptions} The options to use when detecting the package manager.
 * @returns {Promise<DetectResult | null>} The detected package manager or `null` if not found.
 */
declare function detect(options?: DetectOptions): Promise<DetectResult | null>;
/**
 * Detects the package manager used in the project.
 * @param options {DetectOptions} The options to use when detecting the package manager.
 * @returns {DetectResult | null>} The detected package manager or `null` if not found.
 */
declare function detectSync(options?: DetectOptions): DetectResult | null;
/**
 * Detects the package manager used in the running process.
 *
 * This method will check for `process.env.npm_config_user_agent`.
 */
declare function getUserAgent(): AgentName | null;

export { detect, detectSync, getUserAgent };
