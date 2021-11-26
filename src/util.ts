import dayjs from "dayjs";
import fs from "fs";
import crypto from "crypto";
import { ObserverOptions } from "./observer/ObserverOptions";

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
