import { Logger } from "../util";
import { ObserverOptions } from "./ObserverOptions";
import { MinecraftServer } from "../minecraft-server/MinecraftServer";
export class ObserverWrapper {
  private _options: ObserverOptions;
  private _servers: { [serverName: string]: MinecraftServer } = {};

  /**
   * Creates an instance of ObserverWrapper.
   * @param {ObserverOptions} [options] Observe Options.
   */
  constructor(options: ObserverOptions) {
    this._options = options;
    // Load servers in memory
    for (const serverOptions of this._options.servers) {
      this._servers[serverOptions.name] = new MinecraftServer(serverOptions);
    }
  }

  /**
   * Starts all servers.
   * @return {*} Promise that resolves to an object with the server names as key and if they started as value.
   */
  start(): Promise<{ [serverName: string]: boolean }>;
  /**
   * Starts a server.
   * @param {string} serverName Name of the server.
   * @return {Promise<boolean>} Promise that resolves to true if the server started.
   */
  start(serverName: string): Promise<boolean>;
  start(
    serverName?: string
  ): Promise<{ [serverName: string]: boolean } | boolean> {
    if (serverName) {
      Logger.log(`Starting server "${serverName}"`);
      return this.getServer(serverName).start();
    } else {
      Logger.log(`Starting all servers...`);
      return new Promise(async (resolve, reject) => {
        const started: { [serverName: string]: boolean } = {};
        for (const s in this._servers) {
          try {
            started[s] = await this.start(s);
          } catch (e) {
            reject(e);
          }
          resolve(started);
        }
      });
    }
  }

  /**
   * Sends a stop command to all servers.
   * @return {*} An object with the server names as key and if the command was sent as value.
   */
  stop(): { [serverName: string]: boolean };
  /**
   * Sends a stop command to a server.
   * @param {string} serverName Name of the server.
   * @return {boolean} true if signal was sent.
   */
  stop(serverName: string): boolean;
  stop(serverName?: string): { [serverName: string]: boolean } | boolean {
    if (serverName) {
      return this.getServer(serverName).stop();
    } else {
      const stopped: { [serverName: string]: boolean } = {};
      for (const s in this._servers) {
        try {
          stopped[s] = this.stop(s);
        } catch (e) {
          throw e;
        }
      }
      return stopped;
    }
  }

  /**
   * Get online players from all servers.
   * @return {*} An object with the server names as key and the server's online players names list as value.
   */
  getOnlinePlayers(): { [serverName: string]: string[] };
  /**
   * Get online players from a server.
   * @param {string} serverName Name of the server.
   * @return {string[]} The server's online players names list.
   */
  getOnlinePlayers(serverName: string): string[];
  getOnlinePlayers(serverName?: string) {
    if (serverName) {
      return this._servers[serverName].onlinePlayers;
    } else {
      const players: { [serverName: string]: string[] } = {};
      for (const s in this._servers) {
        try {
          players[s] = this.getOnlinePlayers(s);
        } catch (e) {
          throw e;
        }
      }
      return players;
    }
  }

  /** Gets an instance of a server. */
  getServer(serverName: string) {
    return this._servers[serverName];
  }

  /** Servers name list */
  get servers() {
    return Object.keys(this._servers);
  }
}
