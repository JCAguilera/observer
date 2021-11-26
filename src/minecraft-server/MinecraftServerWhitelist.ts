import { MinecraftServerPlayer } from "./MinecraftServerPlayer";
import { Logger } from "../util";
import { join } from "path";
import fs from "fs";

export class MinecraftServerWhitelist {
  private _path: string;
  private _whitelist: { uuid: string; name: string }[] = [];
  private _lastError = "";
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
      return false;
    }
    try {
      const player = new MinecraftServerPlayer(username);
      const uuid = this._onlineMode
        ? await player.uuid
        : await player.offlineUuid;
      if (this._whitelist.find((v) => v.uuid === uuid)) {
        Logger.error("Error adding user to whitelist: Already in whitelist");
        this._lastError = "add";
        return false;
      }
      this._whitelist = [...this._whitelist, { uuid, name: username }];
      this.saveWhitelist();
      return true;
    } catch (error) {
      Logger.error("Error adding user to whitelist: Could not get UUID");
      return false;
    }
  }

  async remove(username: string) {
    if (this._loadError) {
      Logger.error("Error removing user from whitelist: Whitelist not loaded!");
      return false;
    }
    try {
      const player = new MinecraftServerPlayer(username);
      const uuid = this._onlineMode
        ? await player.uuid
        : await player.offlineUuid;
      if (!this._whitelist.find((v) => v.uuid === uuid)) {
        Logger.error("Error removing user from whitelist: Not in whirelist");
        this._lastError = "remove";
        return false;
      }
      this._whitelist = this._whitelist.filter((v) => v.uuid !== uuid);
      this.saveWhitelist();
      return true;
    } catch (error) {
      Logger.error("Error removing user from whitelist: Could not get UUID");
      return false;
    }
  }

  clear() {
    if (this._loadError) {
      Logger.error("Error clearing whitelist: Whitelist not loaded!");
      return false;
    }
    try {
      this._whitelist = [];
      this.saveWhitelist();
      return true;
    } catch (error) {
      Logger.error("Error clearing whitelist: Could not save!");
      return false;
    }
  }

  private saveWhitelist() {
    try {
      fs.writeFileSync(this._path, JSON.stringify(this._whitelist));
    } catch (error) {
      throw error;
    }
  }

  private loadWhitelist() {
    try {
      this._whitelist = JSON.parse(fs.readFileSync(this._path, "utf-8"));
    } catch (error) {
      this._lastError = "load";
      this._loadError = true;
      Logger.error("Error loading whitelist!");
      console.error(error);
    }
  }

  get lastError() {
    return this._lastError;
  }
}
