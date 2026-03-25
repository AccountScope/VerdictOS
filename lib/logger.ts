// Structured logging utility
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: any
}

class Logger {
  private context: LogContext = {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  private log(level: LogLevel, message: string, data?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data
    }

    // In production, send to logging service (Datadog, CloudWatch, etc.)
    // For now, structured console output
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry))
    } else {
      // Development: pretty print
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level]
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '')
    }
  }

  debug(message: string, data?: LogContext) {
    this.log('debug', message, data)
  }

  info(message: string, data?: LogContext) {
    this.log('info', message, data)
  }

  warn(message: string, data?: LogContext) {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | any, data?: LogContext) {
    this.log('error', message, {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const child = new Logger()
    child.setContext({ ...this.context, ...context })
    return child
  }
}

// Export singleton instance
export const logger = new Logger()

// Helper to create request-scoped logger
export function createRequestLogger(requestId: string, clientId?: string) {
  return logger.child({
    request_id: requestId,
    client_id: clientId
  })
}
