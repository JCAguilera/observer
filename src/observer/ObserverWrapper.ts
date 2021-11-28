import { Logger } from "../util";
import { ObserverOptions } from "./ObserverOptions";
import { MinecraftServer } from "../minecraft-server/MinecraftServer";
export class ObserverWrapper {
  private _options: ObserverOptions;
  private _servers: { [serverName: string]: MinecraftServer } = {};

  /**
   * Creates an instance of ObserverWrapper.
   * @param {ObserverOptions} [options] Observe Options
   */
  constructor(options: ObserverOptions) {
    this._options = options;
    // Load servers in memory
    for (const serverOptions of this._options.servers) {
      this._servers[serverOptions.name] = new MinecraftServer(serverOptions);
    }
  }

  /**
   * Starts a server
   * @param {string} serverName Name of the server
   * @return {Promise<boolean>} Resolves to true if server is starting
   */
  start(serverName: string): Promise<boolean> {
    Logger.log(`Starting server "${serverName}"`);
    return this.getServer(serverName).start();
  }

  /**
   * Sends a stop command to a server
   * @param {string} serverName Name of the server
   * @return {boolean} true if signal was sent
   */
  stop(serverName: string): boolean {
    return this.getServer(serverName).stop();
  }

  /** Starts all servers */
  async startAll() {
    Logger.log("Starting all servers...");
    const serversStarted: { [serverName: string]: boolean } = {};
    for (const serverName in this._servers) {
      const started = await this.start(serverName);
      if (!started) Logger.error(`Could not start server "${serverName}"`);
      serversStarted[serverName] = started;
    }
    return serversStarted;
  }

  /** Sends a stop command to all servers */
  stopAll() {
    Logger.log("Sending a stop command to all servers...");
    for (const serverName in this._servers) {
      const stopped = this.stop(serverName);
      if (!stopped)
        Logger.error(`Could not send stop to server "${serverName}"`);
    }
  }

  /** Gets an instance of a server */
  getServer(serverName: string) {
    return this._servers[serverName];
  }

  /** Servers name list */
  get servers() {
    return Object.keys(this._servers);
  }
}
