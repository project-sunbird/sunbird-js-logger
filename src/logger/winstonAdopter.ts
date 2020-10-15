const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const stringify = require('json-stringify-safe');
import { LogAdopter, ILogAdopterConfig, logLevels } from './interface';
import * as path from 'path';
import { QueryOptions } from 'winston';

export class WinstonAdopter implements LogAdopter {
  public logger: any;
  private config!: ILogAdopterConfig;
  private transports: any = [];
  private exceptionHandlers: any = [];
  public initialize(config: ILogAdopterConfig) {
    this.config = config;
    this.transports = [this.getDailyRotateFileLogger('app')];
    this.exceptionHandlers = [this.getDailyRotateFileLogger('exceptions')];
    if (process.env.NODE_ENV !== 'production') {
      this.transports.push(new transports.Console());
      this.exceptionHandlers.push(new transports.Console());
    }
    const combineMessage = format((info: any, opts: any) => {
      const splat = info[Symbol.for('splat')] || [];
      if (splat.length) {
        info.message = typeof info.message === 'object' ? JSON.stringify(info.message) : info.message
        splat.forEach((arg: any) => {
          if (typeof arg === 'object') {
            info.message = info.message + ' ' + stringify(arg);
          } else {
            info.message = info.message + ' ' + arg;
          }
        });
        info[Symbol.for('splat')] = [];
      }
      return info;
    });
    this.logger = createLogger({
      level: this.config.logLevel,
      defaultMeta: this.config.context,
      format: format.combine(
        combineMessage(), // should be added at first
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
      ),
      transports: this.transports,
      exceptionHandlers: this.exceptionHandlers,
    });
    return true;
  }
  public enableDebugMode(time = 1000 * 60 * 10, logLevel: logLevels = 'debug') {
    this.logger
      .clear()
      .add(this.getDailyRotateFileLogger('debug'))
      .add(new transports.Console());
    this.logger.level = logLevel;
    setTimeout(() => {
      this.logger.clear();
      this.logger.level = this.config.logLevel;
      this.logger.add(this.getDailyRotateFileLogger('app')).add(new transports.Console());
    }, time);
    return true;
  }
  private getDailyRotateFileLogger(fileName: string) {
    return new transports.DailyRotateFile({
      auditFile: path.join(this.config.logBasePath, 'audit.json'),
      filename: path.join(this.config.logBasePath, fileName + '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '10d',
      json: true
    });
  }

  public getLogs(options: QueryOptions) {
    return new Promise((resolve, reject) => {
      this.logger.query(options, (err: any, results: any) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      })
    });
  }
}
