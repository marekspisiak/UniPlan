import { appendFile } from "fs";
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";

// Pomôcka pre ESM: získať cestu k aktuálnemu súboru
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Získaj koreňový adresár projektu (napr. 2 úrovne vyššie)
const projectRoot = path.resolve(__dirname, "../../");

// Cesta do logs/ v koreňovom priečinku
const logFilePath = join(projectRoot, "logs", "response.log");

export const responseLogger = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  const logToFile = (body) => {
    const log = {
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      response: body,
    };

    const logString = JSON.stringify(log, null, 2) + "\n\n";

    appendFile(logFilePath, logString, (err) => {
      if (err) console.error("Chyba pri zapisovaní logu:", err);
    });
  };

  res.send = function (body) {
    logToFile(body);
    return originalSend.call(this, body);
  };

  res.json = function (body) {
    logToFile(body);
    return originalJson.call(this, body);
  };

  next();
};
