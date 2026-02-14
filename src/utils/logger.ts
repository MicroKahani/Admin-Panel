/**
 * Centralized logging utility for the Admin Panel
 * Only logs in development mode to keep production builds clean
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === 'true';

class Logger {
    private shouldLog(): boolean {
        return isDevelopment;
    }

    private formatMessage(level: LogLevel, context: string, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
    }

    info(context: string, message: string, data?: any): void {
        if (!this.shouldLog()) return;
        console.log(this.formatMessage('info', context, message), data || '');
    }

    warn(context: string, message: string, data?: any): void {
        if (!this.shouldLog()) return;
        console.warn(this.formatMessage('warn', context, message), data || '');
    }

    error(context: string, message: string, error?: any): void {
        if (!this.shouldLog()) return;
        console.error(this.formatMessage('error', context, message), error || '');
    }

    debug(context: string, message: string, data?: any): void {
        if (!this.shouldLog()) return;
        console.debug(this.formatMessage('debug', context, message), data || '');
    }

    // API-specific logging
    api(method: string, url: string, data?: any): void {
        if (!this.shouldLog()) return;
        console.log(`[API] ${method.toUpperCase()} ${url}`, data || '');
    }

    apiError(method: string, url: string, error: any): void {
        if (!this.shouldLog()) return;
        console.error(`[API ERROR] ${method.toUpperCase()} ${url}`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
        });
    }
}

export const logger = new Logger();
export default logger;
