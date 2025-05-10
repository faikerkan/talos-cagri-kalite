"use strict";
/**
 * Basit bir loglama utility'si
 * Winston benzeri bir yapı kurabiliriz ama şu an için basit bir logger yeterli olacaktır
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customLogger = void 0;
class Logger {
    constructor() {
        this.isDevEnvironment = process.env.NODE_ENV !== 'production';
    }
    formatLog(level, message, metadata) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
    }
    outputLog(logObject) {
        // Geliştirme ortamında konsola yaz
        if (this.isDevEnvironment) {
            const metadataString = logObject.metadata ? ` ${JSON.stringify(logObject.metadata)}` : '';
            switch (logObject.level) {
                case 'error':
                    console.error(`[${logObject.timestamp}] [ERROR] ${logObject.message}${metadataString}`);
                    break;
                case 'warn':
                    console.warn(`[${logObject.timestamp}] [WARN] ${logObject.message}${metadataString}`);
                    break;
                case 'info':
                    console.info(`[${logObject.timestamp}] [INFO] ${logObject.message}${metadataString}`);
                    break;
                case 'debug':
                    console.debug(`[${logObject.timestamp}] [DEBUG] ${logObject.message}${metadataString}`);
                    break;
            }
        }
        else {
            // Production ortamında burada bir loglama servisi (Winston, Pino vb.) kullanılabilir
            // veya harici bir logging hizmetine (ELK, Sentry, CloudWatch) gönderebiliriz
            // Şimdilik console kullanıyoruz, ama üretim ortamında değiştirilmelidir
            console.log(JSON.stringify(logObject));
        }
    }
    error(message, metadata) {
        this.outputLog(this.formatLog('error', message, metadata));
    }
    warn(message, metadata) {
        this.outputLog(this.formatLog('warn', message, metadata));
    }
    info(message, metadata) {
        this.outputLog(this.formatLog('info', message, metadata));
    }
    debug(message, metadata) {
        // Debug logları sadece geliştirme ortamında gösterilir
        if (this.isDevEnvironment) {
            this.outputLog(this.formatLog('debug', message, metadata));
        }
    }
}
exports.customLogger = new Logger();
