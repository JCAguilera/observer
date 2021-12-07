import fs from "fs";
import crypto from "crypto";
import { ObserverOptions } from "./observer/ObserverOptions";
import dayjs from "dayjs";

export class Logger {
  static log(message: string, ...optionalParams: any[]) {
    console.log(
      dayjs().format("DD/MM/YYYY HH:mm") + "  [INFO] " + message,
      ...optionalParams
    );
  }

  static error(message: string, ...optionalParams: any[]) {
    console.log(
      dayjs().format("DD/MM/YYYY HH:mm") + " [ERROR] " + message,
      ...optionalParams
    );
  }
}

export function loadConfig(path: string): ObserverOptions {
  let config: ObserverOptions;
  try {
    config = JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch {
    Logger.error("Could not load the config file, creating example file...");
    config = {
      servers: [],
      apiKey: crypto.randomBytes(20).toString("hex"),
      port: 3000,
    };
    fs.writeFileSync(path, JSON.stringify(config));
    Logger.log(
      "Generated config file! Edit it and restart the wrapper to apply changes."
    );
    // Display API key
    console.log("\nYour auto-generated API key is: " + config.apiKey);
    console.log("DO NOT SHARE IT\n");
  }
  return config;
}
