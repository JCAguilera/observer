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
