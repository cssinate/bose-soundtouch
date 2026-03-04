export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export function createLogger(
  prefix: string,
  level: LogLevel = "info",
): Logger {
  const threshold = LOG_LEVELS[level];

  const log = (
    logLevel: Exclude<LogLevel, "silent">,
    message: string,
    ...args: unknown[]
  ) => {
    if (LOG_LEVELS[logLevel] >= threshold) {
      const fn = logLevel === "debug" ? "log" : logLevel;
      console[fn](`[${prefix}] ${message}`, ...args);
    }
  };

  return {
    debug: (msg, ...args) => log("debug", msg, ...args),
    info: (msg, ...args) => log("info", msg, ...args),
    warn: (msg, ...args) => log("warn", msg, ...args),
    error: (msg, ...args) => log("error", msg, ...args),
  };
}
