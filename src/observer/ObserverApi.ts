import { ObserverWrapper } from "./ObserverWrapper";
import { loadConfig, Logger } from "../util";
import express from "express";
import * as http from "http";
import { Server, Socket } from "socket.io";

export class ObserverApi {
  private _app = express();
  private _server = http.createServer(this._app);
  private _io = new Server(this._server);
  private _config = loadConfig();
  private _wrapper = new ObserverWrapper(this._config);
  private _sockets: { [key: string]: string } = {};

  constructor() {
    console.log("### Observer API ###\n");
    for (const serverName of this._wrapper.servers) {
      this._wrapper
        .getServer(serverName)
        .onEvent((event: string, data: any) => {
          for (let id in this._sockets) {
            // For every authorized socket
            const socket = this._io.sockets.sockets.get(id); // Get current socket
            if (!!socket) {
              // If socket exists, send events
              socket.emit(`event:${event}`, serverName, data);
              socket.emit(`event:any`, serverName, { event, data });
            }
          }
        });
    }
    Logger.log(`Loaded ${Object.keys(this._wrapper.servers).length} servers`);
    // Express
    this._app.get("/", (req, res) => {
      res.end("<h1>Observer HTTP API: Coming soon</h1>");
    });
    // Socket.io
    this._io.on("connection", (socket: Socket) => {
      Logger.log("New socket connection, waiting for auth...");

      let conn = setTimeout(() => {
        socket.disconnect(true);
      }, 30000);

      socket.on(
        "authenticate",
        (name: string, key: string, callbackFn: Function) => {
          if (this._isAuthorized(socket.id)) {
            callbackFn(true);
            return;
          }
          const logged = key === this._config.apiKey;
          if (logged) {
            this._sockets[socket.id] = name; // add to authorized sockets lists
            clearInterval(conn);
            Logger.log(name + " authenticated!");
          } else {
            Logger.error(name + " could not authenticate!");
          }
          callbackFn(logged);
        }
      );

      socket.on("start", async (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked start!");
          const started = await this._wrapper.start(serverName);
          callbackFn(started);
        }
      });

      socket.on("stop", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked stop!");
          const stopped = this._wrapper.stop(serverName);
          callbackFn(stopped);
        }
      });

      socket.on(
        "console",
        (serverName: string, command: string, callbackFn: Function) => {
          if (this._isAuthorized(socket.id)) {
            Logger.log(this._getName(socket.id) + " invoked command!");
            const sent = this._wrapper.getServer(serverName).console(command);
            callbackFn(sent);
          }
        }
      );

      socket.on("onlinePlayers", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked onlinePlayers!");
          callbackFn(this._wrapper.getServer(serverName).onlinePlayers);
        }
      });

      socket.on("status", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked status!");
          callbackFn(this._wrapper.getServer(serverName).status);
        }
      });

      socket.on("disconnect", () => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " disconnected");
          delete this._sockets[socket.id];
        }
      });
    });
  }

  listen(port?: number) {
    // HTTP Server
    port = port || this._config.port;
    this._server.listen(port, () => {
      Logger.log("Listening on *:" + port);
    });
  }

  private _isAuthorized(id: string): boolean {
    return this._sockets.hasOwnProperty(id);
  }

  private _getName(id: string): string {
    return this._sockets[id];
  }
}
