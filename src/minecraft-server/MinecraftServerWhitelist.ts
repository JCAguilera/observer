import { MinecraftServerPlayer } from "./MinecraftServerPlayer";
import { Logger } from "../util";
import { join } from "path";
import fs from "fs";

export class MinecraftServerWhitelist {
  private _path: string;
  private _whitelist: { uuid: string; name: string }[] = [];
  private _loadError = false;
  private _onlineMode = true;

  constructor(directory: string, onlineMode?: boolean) {
    this._onlineMode = onlineMode || true;
    this._path = join(directory, "whitelist.json");
    this.loadWhitelist();
  }

  get array() {
    if (this._loadError) {
      Logger.error("Error getting array: Whitelist not loaded!");
    }
    return this._whitelist.slice();
  }

  async add(username: string) {
    if (this._loadError) {
      Logger.error("Error adding user to whitelist: Whitelist not loaded!");
      return { res: false, error: "load" };
    }
    try {
      const player = new MinecraftServerPlayer(username);
      const uuid = this._onlineMode
        ? await player.uuid
        : await player.offlineUuid;
      if (this._whitelist.find((v) => v.uuid === uuid)) {
        Logger.error("Error adding user to whitelist: Already in whitelist");
        return { res: false, error: "add" };
      }
      this._whitelist = [...this._whitelist, { uuid, name: username }];
      this.saveWhitelist();
      return { res: true };
    } catch (error) {
      if (error === "save") {
        Logger.error("Error clearing whitelist: Could not save whitelist!");
        return { res: false, error: "save" };
      }
      Logger.error("Error removing user from whitelist: Could not get UUID");
      return { res: false, error: "uuid" };
    }
  }

  async remove(username: string) {
    if (this._loadError) {
      Logger.error("Error removing user from whitelist: Whitelist not loaded!");
      return { res: false, error: "load" };
    }
    try {
      const player = new MinecraftServerPlayer(username);
      const uuid = this._onlineMode
        ? await player.uuid
        : await player.offlineUuid;
      if (!this._whitelist.find((v) => v.uuid === uuid)) {
        Logger.error("Error removing user from whitelist: Not in whirelist");
        return { res: false, error: "remove" };
      }
      this._whitelist = this._whitelist.filter((v) => v.uuid !== uuid);
      this.saveWhitelist();
      return { res: true };
    } catch (error) {
      if (error === "save") {
        Logger.error("Error clearing whitelist: Could not save whitelist!");
        return { res: false, error: "save" };
      }
      Logger.error("Error removing user from whitelist: Could not get UUID");
      return { res: false, error: "uuid" };
    }
  }

  clear() {
    if (this._loadError) {
      Logger.error("Error clearing whitelist: Whitelist not loaded!");
      return { res: false, error: "load" };
    }
    try {
      this._whitelist = [];
      this.saveWhitelist();
      return { res: true };
    } catch (error) {
      Logger.error("Error clearing whitelist: Could not save whitelist!");
      return { res: false, error: "save" };
    }
  }

  private saveWhitelist() {
    try {
      fs.writeFileSync(this._path, JSON.stringify(this._whitelist));
    } catch (error) {
      throw "save";
    }
  }

  private loadWhitelist() {
    try {
      this._whitelist = JSON.parse(fs.readFileSync(this._path, "utf-8"));
    } catch (error) {
      this._loadError = true;
      Logger.error("Error loading whitelist!");
      console.error(error);
    }
  }
}
