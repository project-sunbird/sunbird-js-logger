// import { createLogger, format, transports } from 'winston';
const { createLogger, format, transports } = require('winston');
// import * as DailyRotateFile from 'winston-daily-rotate-file';
require('winston-daily-rotate-file');
import { LogAdopter, ILogAdopterConfig } from './interface';
import { pathToFileURL } from 'url';
import * as path from 'path';

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
        info.message = info.message + splat.join(' ');
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
  public enableDebugMode(time = 10000) {
    this.logger
      .clear()
      .add(this.getDailyRotateFileLogger('debug'))
      .add(new transports.Console());
    this.logger.level = 'debug';
    setTimeout(() => {
      this.logger.clear();
      this.logger.level = this.config.logLevel;
      this.logger.add(this.getDailyRotateFileLogger('app')).add(new transports.Console());
    }, time);
    return true;
  }
  private getDailyRotateFileLogger(fileName: string) {
    return new transports.DailyRotateFile({
      auditFile:path.join(this.config.logBasePath, 'audit.json' ),
      filename: path.join(this.config.logBasePath, fileName +'-%DATE%.log' ),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '10d',
    });
  }
}
