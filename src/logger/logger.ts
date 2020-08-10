import * as _ from 'lodash';
import { WinstonAdopter } from './winstonAdopter';
import * as path from 'path';
import { ILoggerConfig, ILogger, LogAdopter, logLevels } from './interface';
export let logger: ILogger = console;
let adopter: LogAdopter;
export const enableLogger = (config: ILoggerConfig) => {
  if (config.adopterConfig.adopter === 'console') {
    logger = console;
  } else if (config.adopterConfig.adopter === 'winston') {
    adopter = new WinstonAdopter();
    adopter.initialize(config);
    logger = adopter.logger;
  }
};
export const enableDebugMode = (timeInterval: number, logLevel: logLevels) => {
  if (adopter.enableDebugMode) {
      adopter.enableDebugMode(timeInterval, logLevel);
      return true;
  }
  return false;
};
export * from './interface';
