import fs from "fs";
import { join } from "path";
import * as mcServerProps from "minecraft-server-properties";
import { Logger } from "../util";

export class MinecraftServerProperties {
  private _path: string;
  private _properties: { [key: string]: string | boolean | number };

  constructor(directory: string) {
    this._path = join(directory, "server.properties");
    const contents = fs.readFileSync(this._path, "utf-8");
    this._properties = mcServerProps.parse(contents);
  }

  /**
   * Gets a value.
   * @param {string} key Key of the value.
   * @return {*}  {(string | boolean | number)} Parsed value.
   */
  get(key: string): string | boolean | number {
    return this._properties[key];
  }

  /**
   * Sets a value and saves the server.properties file.
   * @param {string} key Key of the value.
   * @param {(string | boolean | number)} value The value.
   */
  set(key: string, value: string | boolean | number) {
    this._properties[key] = value;
    try {
      this.save();
      return true;
    } catch (error) {
      Logger.error("Could not save server.properties file!");
      return false;
    }
  }

  private save() {
    const contents = mcServerProps.stringify(this._properties);
    fs.writeFileSync(this._path, contents);
  }

  get object() {
    return this._properties;
  }
}
