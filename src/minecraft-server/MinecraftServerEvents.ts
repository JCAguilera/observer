import { MinecraftServerType } from "./MinecraftServerType";

type AdjustedRegex = RegExpExecArray & { groups: any }; // Workaround for missing "groups" property

export interface MinecraftServerEventsTriggers {
  starting: RegExp;
  online: RegExp;
  offline: RegExp;
  stopping: RegExp;
  login: RegExp;
  logout: RegExp;
  rconRunning: RegExp;
  [event: string]: RegExp;
}

export function getEvent(line: string, serverType: MinecraftServerType) {
  for (const event in DefaultTriggers[serverType]) {
    const matches = DefaultTriggers[serverType][event].exec(
      line
    ) as AdjustedRegex;
    if (matches !== null) {
      return { event, data: matches.groups };
    }
  }
  return { event: "line", data: line };
}

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
