import winston from 'winston';

export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'infusion', context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        })
      ]
    });

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, { ...meta, context: this.context });
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, { ...meta, context: this.context });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { ...meta, context: this.context });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { ...meta, context: this.context });
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, { ...meta, context: this.context });
  }

  silly(message: string, meta?: any): void {
    this.logger.silly(message, { ...meta, context: this.context });
  }

  // Specialized logging methods for AI operations
  logIntent(intent: string, confidence: number, riskLevel: string): void {
    this.info('AI Intent Processed', {
      intent,
      confidence,
      riskLevel,
      timestamp: new Date().toISOString()
    });
  }

  logAction(action: any, result: any): void {
    this.info('Action Executed', {
      actionType: action.action_type,
      chain: action.chain,
      success: result.success,
      gasUsed: result.gasUsed,
      cost: result.cost,
      timestamp: new Date().toISOString()
    });
  }

  logSwap(swap: any): void {
    this.info('Swap Executed', {
      tokenIn: swap.tokenIn,
      tokenOut: swap.tokenOut,
      amountIn: swap.amountIn,
      amountOut: swap.amountOut,
      chain: swap.chain,
      protocol: swap.protocol,
      gasUsed: swap.gasUsed,
      timestamp: new Date().toISOString()
    });
  }

  logError(error: Error, context?: string): void {
    this.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      context: context || this.context,
      timestamp: new Date().toISOString()
    });
  }

  logPerformance(operation: string, duration: number, metadata?: any): void {
    this.info('Performance metric', {
      operation,
      duration,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  logSecurity(event: string, details: any): void {
    this.warn('Security event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Create a child logger with additional context
  child(subContext: string): Logger {
    const childLogger = new Logger(`${this.context}:${subContext}`);
    return childLogger;
  }
}

export default Logger; 