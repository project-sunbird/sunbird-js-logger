import * as _ from 'lodash';
import { WinstonAdopter } from './winstonAdopter';
import * as path from 'path';
import { ILoggerConfig } from './interface';
const logBasePath = path.join(__dirname, './../../../../../');
const appLogLevel = 'info';
export let logger = console;
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
