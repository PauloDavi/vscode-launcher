import { createLogger, format, transports } from "winston";
import * as path from "path";
import { app } from "electron";

const logDir = app.getPath("userData");
const logFile = path.join(logDir, "app.log");

const logger = createLogger({
  level: "error",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [new transports.File({ filename: logFile })],
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export default logger;
