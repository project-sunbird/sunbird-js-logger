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
    logger = new Proxy(adopter.logger, logProxyHandler());
  }
};
export const enableDebugMode = (timeInterval: number, logLevel: logLevels) => {
  if (adopter.enableDebugMode) {
      adopter.enableDebugMode(timeInterval, logLevel);
      return true;
  }
  return false;
};

const logProxyHandler =  () => {
  return {
    get (target: any, prop: any, receiver: any) {
      const property = Reflect.get(target, prop, receiver);
      if(prop === "debug"){
        return (context: any, ...args: any) => {
            if(_.get(context, 'isDebugEnabled')){
              target.info(context, ...args);
            } else {
              property.apply(target, [context, ...args]);
            }
        }
      }
      return property;
    }
  }
}
export * from './interface';
