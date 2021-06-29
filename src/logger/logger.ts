import * as _ from 'lodash';
import { WinstonAdopter } from './winstonAdopter';
import { ILoggerConfig, ILogger, LogAdopter, logLevels } from './interface';
import { QueryOptions } from 'winston';
export let logger: ILogger = console;
let adopter: LogAdopter;
export const enableLogger = (config: ILoggerConfig) => {
  if (config.adopterConfig.adopter === 'console') {
    logger = console;
  } else if (config.adopterConfig.adopter === 'winston') {
    adopter = new WinstonAdopter();
    adopter.initialize(config);
    logger = new Proxy(adopter.logger, logProxyHandler());
  }
};
export const enableDebugMode = (timeInterval: number, logLevel: logLevels, combineLogs: boolean) => {
  if (adopter.enableDebugMode) {
    adopter.enableDebugMode(timeInterval, logLevel, combineLogs);
    return true;
  }
  return false;
};

const logProxyHandler = () => {
  return {
    get(target: any, prop: any, receiver: any) {
      const property = Reflect.get(target, prop, receiver);
      if (prop === 'debug') {
        return (context: any, ...args: any) => {
          if (_.get(context, 'isDebugEnabled')) {
            target.info(context, ...args);
          } else {
            property.apply(target, [context, ...args]);
          }
        };
      }
      return property;
    },
  };
};

export const getLogs = async (options: QueryOptions) => {
  if (!adopter) {
    throw new Error('Adopter does not exists');
  } else if (adopter.getLogs) {
    return adopter.getLogs(options);
  }
};
export * from './interface';
