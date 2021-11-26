import got from "got";
import { toUUID } from "to-uuid";

export class MinecraftServerPlayer {
  private _name: string;
  private _uuid: string = "";
  private _offlineUuid: string = "";

  constructor(name: string) {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  get uuid(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this._uuid !== "") resolve(this._uuid);
      got("https://api.minetools.eu/uuid/" + this.name).then((res) => {
        try {
          const uuid = JSON.parse(res.body).id;
          this._uuid = toUUID(uuid);
          resolve(this._uuid);
        } catch (error) {
          console.error(error);
          reject("Could not get uuid");
        }
      });
    });
  }

  get offlineUuid(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this._offlineUuid !== "") resolve(this._offlineUuid);
      got("http://tools.glowingmines.eu/convertor/nick/" + this.name).then(
        (res) => {
          try {
            const uuid = JSON.parse(res.body).offlinesplitteduuid;
            this._offlineUuid = uuid;
            resolve(this._offlineUuid);
          } catch (error) {
            console.error(error);
            reject("Could not get offline uuid");
          }
        }
      );
    });
  }
}
