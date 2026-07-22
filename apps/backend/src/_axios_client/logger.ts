// logger.service.ts
import { createLogger, format } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
const logDir = path.resolve(__dirname, '..', '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: () => moment().format('YYYY-MM-DD HH:mm:ss'),
    }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${JSON.stringify(message)}`;
    }),
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '365',
      auditFile: path.join(logDir, '.audit-log.json'),
    }),
  ],
});
