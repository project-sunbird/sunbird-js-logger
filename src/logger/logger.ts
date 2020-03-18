import * as _ from 'lodash';
import { WinstonAdopter } from './winstonAdopter';
import * as path from 'path';
import { ILoggerConfig, ILogger } from './interface';
export let logger: ILogger = console;
let adopter;
export const enableLogger = (config: ILoggerConfig) => {
  if (config.adopterConfig.adopter === 'console') {
    logger = console;
  } else if (config.adopterConfig.adopter === 'winston') {
    adopter = new WinstonAdopter();
    adopter.initialize(config);
    logger = adopter.logger;
  }
};
export * from './interface';
