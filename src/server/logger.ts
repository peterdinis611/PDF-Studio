import pino from "pino";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function usePretty(): boolean {
  if (isProd()) return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.LOG_LEVEL === "silent") return false;
  return true;
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd() ? "info" : "debug"),
  base: { service: "pdf-studio" },
  ...(usePretty()
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,service",
          },
        },
      }
    : {}),
});
