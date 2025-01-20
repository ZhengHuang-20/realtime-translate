type LogLevel = 'info' | 'error' | 'performance';

interface PerformanceLog {
  action: string;
  duration: number;
  timestamp: string;
}

export const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = data 
      ? `[${timestamp}] ${message} ${JSON.stringify(data)}`
      : `[${timestamp}] ${message}`;
    console.log(logMessage);
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = error
      ? `[${timestamp}] ERROR: ${message} ${JSON.stringify(error)}`
      : `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
  },

  performance: (action: string, startTime: number) => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Performance - ${action}: ${duration}ms`);
    return duration;
  },

  // 添加性能监控装饰器
  withPerformanceLogging: async <T>(
    action: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      logger.performance(action, startTime);
      return result;
    } catch (error) {
      logger.error(`${action} failed`, error);
      throw error;
    }
  }
}; 