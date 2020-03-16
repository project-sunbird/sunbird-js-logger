export type logLevels = 'error' | 'warn' | 'info' | 'debug';
export type defaultAdopters = 'console' | 'winston';
export interface IClassLoggerOptions extends IMethodLoggerOptions {
  logMethods?: string[];
}
export interface IMethodLoggerOptions {
  logLevel: logLevels;
  logTime: boolean;
}
export interface ILoggerConfig extends ILogAdopterConfig {
  adopterConfig: {
    adopter: defaultAdopters | LogAdopter;
  };
}
export interface ILogAdopterConfig {
  logBasePath: string;
  logLevel: logLevels;
  context: any;
}
export abstract class LogAdopter {
  abstract logger: ILogger;
  abstract initialize(config: ILogAdopterConfig): boolean;
  abstract enableDebugMode(): boolean;
}
export interface ILogger {
  error(...arg: any): void;
  warn(...arg: any): void;
  info(...arg: any): void;
  debug(...arg: any): void;
}
