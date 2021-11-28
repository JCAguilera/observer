import { MinecraftServerWhitelist } from "./MinecraftServerWhitelist";
import { MinecraftServerEventParser } from "./MinecraftServerEvents";
import { Config, DeepPartial, ScriptServer } from "@scriptserver/core";
import { Logger } from "../util";
import { MinecraftServerOptions } from "./MinecraftServerOptions";
import { MinecraftServerProperties } from "./MinecraftServerProperties";

enum Status {
  Offline = "offline",
  Starting = "starting",
  Online = "online",
  Stopping = "stopping",
}

export class MinecraftServer {
  /** JServer Options */
  private _config: MinecraftServerOptions;
  /** Checks if the stop timeout is enabled */
  private _stopTimeoutEnabled = true;
  /** Stop server timeout */
  private _stopTimeout: NodeJS.Timeout | undefined;
  /** Checks if the timeout was arleady cleared */
  private _stopTimeoutCleared = true;
  /** Locks the start to prevent starting the server more than once */
  private _startlock = false;
  /** Events that the server emits */
  private _events = {
    status: (code: Status) => {},
    joined: (username: string) => {},
    leaved: (username: string) => {},
    line: (line: string) => {},
    rconRunning: () => {},
    any: (event: string, data: any) => {},
  };
  /** Script Server instance */
  private _scriptServer: ScriptServer;
  /** Online player list */
  private _online: string[] = [];
  /** Server status */
  private _status: Status = Status.Offline;
  /** Server stop timeout in minutes */
  private _timeout = 0; // mins
  /** Event parser */
  private _eventParser: MinecraftServerEventParser;
  /** Server properties */
  private _properties: MinecraftServerProperties;
  /** Whitelist */
  private _whitelist: MinecraftServerWhitelist;

  constructor(options: MinecraftServerOptions) {
    this._config = options; // Save options
    // Setup timeout
    this._stopTimeoutEnabled = !!options.autostop;
    this._timeout = options.autostop ? options.autostop : 0;
    // Event parser
    this._eventParser = new MinecraftServerEventParser(
      options.type,
      options.events
    );
    // Setup server properties
    this._properties = new MinecraftServerProperties(options.path);
    // Setup whitelist
    this._whitelist = new MinecraftServerWhitelist(
      options.path,
      this._properties.get("online_mode") as boolean
    );
    // Setup script server
    const scriptServerOptions: DeepPartial<Config> = {
      javaServer: {
        path: options.path,
        jar: options.jar,
        args: options.args,
        pipeStdout: false,
        flavorSpecific: {
          default: {
            startedRegExp: RegExp(this._eventParser.triggers.online),
            stoppedRegExp: RegExp(this._eventParser.triggers.offline),
          },
        },
      },
    };
    if (options.rcon) {
      scriptServerOptions["rconConnection"] = options.rcon;
    }
    this._scriptServer = new ScriptServer(scriptServerOptions);
  }

  /** Stars the stop timeout */
  private _startTimeout(reason?: string) {
    reason = reason || "";
    if (this._stopTimeoutCleared) {
      this._stopTimeout = setTimeout(() => {
        Logger.log(`[${this.name}] Timeout! Stopping the server...`);
        this.stop();
      }, this._timeout);
      Logger.log(`[${this.name}] Timeout started! (${reason})`);
      this._stopTimeoutCleared = false;
      return;
    }
    Logger.error(`[${this.name}] Timeout already started! (${reason})`);
  }

  /** Clears the stop timeout */
  private _clearTimeout(reason?: string) {
    reason = reason || "";
    if (!this._stopTimeoutCleared) {
      if (this._stopTimeout) clearTimeout(this._stopTimeout);
      this._stopTimeoutCleared = true;
      Logger.log(`[${this.name}] Timeout stopped! (${reason})`);
      return;
    }
    Logger.error(`[${this.name}] Timeout already cleared! (${reason})`);
  }

  /** Event emitted everytime the server status changes */
  onStatusChanged(callback: (code: Status) => void) {
    this._events.status = callback;
  }

  /** Event emitted everytime a user joins */
  onUserJoined(callback: (username: String) => void) {
    this._events.joined = callback;
  }

  /** Event emitted everytime a user leaves */
  onUserLeaved(callback: (username: String) => void) {
    this._events.leaved = callback;
  }

  /** Event emitted for every line in the console output */
  onConsoleLine(callback: (line: string) => void) {
    this._events.line = callback;
  }

  /** Event emitted when the rcon is running */
  onRconRunning(callback: () => void) {
    this._events.rconRunning = callback;
  }

  /** Event emitted on any event */
  onEvent(callback: (event: string, data: any) => void) {
    this._events.any = callback;
  }

  /** Starts the server */
  start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this._status !== Status.Offline || this._startlock) {
        Logger.error(`[${this.name}] Could not start server!`);
        resolve(false);
        return;
      }
      this._startlock = true;
      this._scriptServer.javaServer.on("console", this.onConsole.bind(this));
      this._scriptServer.start();
      resolve(true);
    });
  }

  onConsole(line: string) {
    this._events.line(line);
    var e = this._eventParser.parse(line);
    this._events.any(e.event, e.data);
    if (e.event === "starting") {
      this._setStatus(Status.Starting);
    }
    if (e.event === "online") {
      // Server online event
      this._setStatus(Status.Online);
      this._startlock = false;
      if (this._stopTimeoutEnabled) {
        this._startTimeout("Server started");
      }
    } else if (e.event === "rconRunning") {
      // Rcon Running event
      Logger.log(`[${this.name}] Rcon running`);
      this._events.rconRunning();
    } else if (e.event === "login") {
      // Player login event
      this._online = [...this._online, e.data.user];
      this._events.joined(e.data.user);
      if (this._online.length === 1) {
        this._clearTimeout("Player joined");
      }
    } else if (e.event === "logout") {
      // Player logout event
      this._online.splice(this._online.indexOf(e.data.user), 1);
      this._events.leaved(e.data.user);
      if (this._online.length === 0 && this._stopTimeoutEnabled) {
        this._startTimeout("Last player logout");
      }
    } else if (e.event === "stopping") {
      // Server stopping event
      this._setStatus(Status.Stopping);
      this._online = [];
    } else if (e.event === "offline") {
      // Server stopped event
      this._scriptServer.stop(); // Stops RCON and Process
      this._setStatus(Status.Offline);
    }
  }

  /** Send a console command */
  console(command: string) {
    if (this._status !== Status.Online) {
      Logger.error(
        `[${this.name}] Server not online. Could not send command '/${command}'`
      );
      return false;
    }
    Logger.log(`Sending command '/${command}'`);
    this._scriptServer.javaServer.send(command);
    return true;
  }

  /** Stops the server */
  stop() {
    if (this._status !== Status.Online) {
      Logger.error(`[${this.name}] Server not online. Could not stop`);
      return false;
    }
    this._scriptServer.javaServer.send("stop");
    this._clearTimeout("Stop server");
    return true;
  }

  /** Server status */
  get status() {
    return this._status;
  }

  /** Online player list */
  get onlinePlayers() {
    return this._online.slice();
  }

  /** Sets the server status */
  private _setStatus(status: Status) {
    this._status = status;
    this._events.status(status);
    this._events.any("status", status);
  }

  get name() {
    return this._config.name;
  }

  get config() {
    return this._config;
  }

  get whitelist() {
    return this._whitelist;
  }

  get properties() {
    return this._properties;
  }
}
