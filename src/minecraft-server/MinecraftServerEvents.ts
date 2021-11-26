import { MinecraftServerType } from "./MinecraftServerType";

export const DefaultTriggers: {
  [type: string]: MinecraftServerEventsTriggers;
} = {
  paper: {
    starting: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: Starting minecraft server version (?<version>\d\.\d{1,}\.\d{1,}) */g,
    online: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: Done \((?<run>\d{1,2}.\d{3}s)\)! For help, type."help" */g,
    offline: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: ThreadedAnvilChunkStorage: All dimensions are saved */g,
    stopping: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: Stopping server */g,
    login: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: (?<user>\w+)\[\/(?<ip>(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])):(?<port>[0-9]+)\] logged in with entity id (?<entity>[0-9]+) at \(\[(?<world>\w+)\](?<x>\-?[0-9]+\.[0-9E]+), (?<y>\-?[0-9]+\.[0-9E]+), (?<z>\-?[0-9]+\.[0-9E]+)\) */g,
    logout: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: (?<user>\w+) left the game */g,
    rconRunning: /\[(?<time>(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)) INFO\]: RCON running on (?<ip>(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])):(?<port>[0-9]+) */g,
  },
};

type AdjustedRegex = RegExpExecArray & { groups: any }; // Workaround for missing "groups" property

export interface MinecraftServerEventsTriggers {
  starting: RegExp | string;
  online: RegExp | string;
  offline: RegExp | string;
  stopping: RegExp | string;
  login: RegExp | string;
  logout: RegExp | string;
  rconRunning: RegExp | string;
  [event: string]: RegExp | string;
}

export class MinecraftServerEventParser {
  private _triggers = DefaultTriggers;

  constructor(
    private serverType: MinecraftServerType,
    customEvents?: MinecraftServerEventsTriggers
  ) {
    if (customEvents) {
      // Create empty events object
      const cEvents: {
        [type: string]: MinecraftServerEventsTriggers;
      } = {};
      // Save customEvents in empty events object
      cEvents[this.serverType] = customEvents;
      // Merge custom events into event triggers
      this._triggers = { ...DefaultTriggers, ...cEvents };
    }
  }

  parse(line: string) {
    const triggers = this._triggers[this.serverType];
    for (const event in triggers) {
      const matches = RegExp(triggers[event]).exec(line) as AdjustedRegex;
      if (matches !== null) {
        return { event, data: matches.groups };
      }
    }
    return { event: "line", data: line };
  }

  get triggers() {
    return this._triggers[this.serverType];
  }
}
