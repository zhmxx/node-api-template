import { configure, getLogger } from "log4js";

//log4js wrapper
export class Logger {
    static logger;

    static init(level = 'debug') {
        configure({
            appenders: {
                all: {
                    type: 'dateFile',
                    filename: 'all.log',
                    pattern: 'yyyy-MM-dd'
                }
            },
            categories: {
                default: {
                    appenders: ['all'],
                    level: level
                },
            }
        });

        Logger.logger = getLogger('all');
    }

    static trace(message: string) {
        Logger.logger.trace(message);
    }

    static info(message: string) {
        Logger.logger.info(message);
    }

    static debug(message: string) {
        Logger.logger.debug(message);
    }

    static warn(message: string) {
        Logger.logger.warn(message);
    }
    
    static error(message: string) {
        Logger.logger.error(message);
    }
}