import * as _ from 'lodash';
import { IClassLoggerOptions, IMethodLoggerOptions } from '../logger/interface';
import { logger } from './../logger/logger';
const NS_PER_SEC = 1e9;
const defaultClassLoggerOptions: IClassLoggerOptions = {
  logLevel: 'debug',
  logTime: false,
};
export function ClassLogger(classLoggerOptions: IClassLoggerOptions = defaultClassLoggerOptions) {
  return (constructor: any) => {
    Object.getOwnPropertyNames(constructor.prototype)
      .filter(
        (methodName: string) =>
          (!classLoggerOptions.logMethods || _.includes(classLoggerOptions.logMethods, methodName)) &&
          methodName !== 'constructor' &&
          typeof constructor.prototype[methodName] === 'function',
      )
      .forEach(methodName => {
        const originalMethod = constructor.prototype[methodName];
        if (originalMethod.__loggerAttached) {
          return;
        }
        logger.debug(
          'classDecorator warping method',
          constructor.name + '.' + methodName
        );
        constructor.prototype[methodName] = wrapMethodWithLogAsync(originalMethod, methodName, constructor.name, {
          logLevel: classLoggerOptions.logLevel,
          logTime: classLoggerOptions.logTime,
        });
      });
  };
}
function wrapMethodWithLogAsync(
  method: any,
  methodName: string,
  className: string,
  options: IMethodLoggerOptions,
): any {
  return function(...args: any[]) {
    // async added creates promise for sync function also, this need to be handled
    const startHrTime = process.hrtime();
    const loggerMethod = logger[options.logLevel] || logger.debug;
    const argMap = args.map(arg => {
      if (typeof arg === 'function') {
        return 'function';
      }
      if (_.get(arg, '__proto__.constructor.name') === 'IncomingMessage') {
        return 'RequestObject';
      }
      if (_.get(arg, '__proto__.constructor.name') === 'ServerResponse') {
        return 'ResponseObject';
      }
      return arg;
    });
    loggerMethod(`${className}.${methodName} called with: `, ...argMap);
    try {
      const result = method.apply(this, args);
      if (_.get(result, '__proto__.constructor.name') !== 'Promise' && _.get(result, '__proto__.constructor.name') !== 'WrappedPromise') {
        const diff = process.hrtime(startHrTime);
        const endTime = (diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC;
        loggerMethod(`===> ${className}.${methodName} returned with: `, result, `. Took ${endTime} sec`);
        return result;
      }
      return result
        .then((response: any) => {
          const diff = process.hrtime(startHrTime);
          const endTime = (diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC;
          loggerMethod(`===> ${className}.${methodName} returned with: `, response, `. Took ${endTime} sec`);
          return response;
        })
        .catch((error: any) => {
          const diff = process.hrtime(startHrTime);
          const endTime = (diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC;
          loggerMethod(`===> ${className}.${methodName} failed with: `, error, `. Took ${endTime} sec`);
          throw error;
        });
    } catch (error) {
      const diff = process.hrtime(startHrTime);
      const endTime = (diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC;
      loggerMethod(`===> ${className}.${methodName} failed with: `, error, `. Took ${endTime} sec`);
      throw error;
    }
  };
}
export function MethodLogger(methodLogOption: IMethodLoggerOptions = defaultClassLoggerOptions): any {
  return (classRef: any, methodName: string, methodRef: PropertyDescriptor | any) => {
    if (methodRef === undefined) {
      methodRef = Object.getOwnPropertyDescriptor(classRef, methodName);
    }
    methodRef.value = wrapMethodWithLogAsync(methodRef.value, methodName, classRef.constructor.name, methodLogOption);
    methodRef.value.__loggerAttached = true;
  };
}

export function ProxyLogger(targetObject: object, targetObjectName: string, methodLogOption: IMethodLoggerOptions = defaultClassLoggerOptions): any {
  return new Proxy(targetObject, {
    get (target: any, prop: any, receiver: any) {
        const property = Reflect.get(target, prop, receiver);
        if (typeof property === 'function') {
          return wrapMethodWithLogAsync(property, prop, targetObjectName, methodLogOption);
        }
        return property;
    }
  })
}

export * from '../logger/interface';
