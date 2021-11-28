import { ObserverOptions } from "./ObserverOptions";
import { ObserverWrapper } from "./ObserverWrapper";
import { Logger } from "../util";
import express from "express";
import * as http from "http";
import { Server, Socket } from "socket.io";

export class ObserverApi {
  private _app = express();
  private _server = http.createServer(this._app);
  private _io = new Server(this._server);
  private _wrapper;
  private _sockets: { [id: string]: string } = {};

  constructor(private _config: ObserverOptions) {
    console.log("### ObserverMC API ###\n");
    this._wrapper = new ObserverWrapper(this._config);
    for (const serverName of this._wrapper.servers) {
      this._getServer(serverName).onEvent((event: string, data: any) => {
        for (let id in this._sockets) {
          // For every authorized socket
          const socket = this._io.sockets.sockets.get(id); // Get current socket
          if (!!socket) {
            // If socket exists, send events
            socket.emit(`event:${event}`, serverName, data);
            if (event !== "line")
              socket.emit(`event:any`, serverName, { name: event, data });
          }
        }
      });
      Logger.log(`Loaded server "${serverName}"!`);
    }
    const serversCount = Object.keys(this._wrapper.servers).length;
    Logger.log(
      `Loaded ${serversCount} server${serversCount !== 1 ? "s" : ""}.`
    );
    // Express
    this._app.get("/", (req, res) => {
      res.end("<h1>Observer HTTP API: Coming soon</h1>");
    });
    // Socket.io
    this._io.on("connection", (socket: Socket) => {
      Logger.log("New socket connection, waiting for auth...");

      let conn = setTimeout(() => {
        socket.disconnect(true);
      }, 5000);

      socket.on(
        "authenticate",
        (name: string, key: string, callbackFn: Function) => {
          if (this._isAuthorized(socket.id)) {
            callbackFn(true, "authenticated");
            return;
          }
          const logged = key === this._config.apiKey;
          if (logged) {
            this._sockets[socket.id] = name; // add to authorized sockets lists
            clearInterval(conn);
            Logger.log(name + " authenticated!");
            callbackFn(logged);
          } else {
            Logger.error(name + " could not authenticate!");
            callbackFn(logged, "authentication");
          }
        }
      );

      socket.on("start", async (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked start!");
          const server = this._getServer(serverName);
          if (!server) {
            callbackFn(false, "server-not-found");
            return;
          }
          const started = await server.start();
          callbackFn(started);
        }
      });

      socket.on("stop", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked stop!");
          const server = this._getServer(serverName);
          if (!server) {
            callbackFn(false, "server-not-found");
            return;
          }
          const stopped = server.stop();
          callbackFn(stopped);
        }
      });

      socket.on(
        "console",
        (serverName: string, command: string, callbackFn: Function) => {
          if (this._isAuthorized(socket.id)) {
            Logger.log(this._getName(socket.id) + " invoked command!");
            const server = this._getServer(serverName);
            if (!server) {
              callbackFn(false, "server-not-found");
              return;
            }
            const sent = server.console(command);
            callbackFn(sent);
          }
        }
      );

      socket.on("onlinePlayers", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked onlinePlayers!");
          const server = this._getServer(serverName);
          if (!server) {
            callbackFn(null, "server-not-found");
            return;
          }
          callbackFn(server.onlinePlayers);
        }
      });

      socket.on("status", (serverName: string, callbackFn: Function) => {
        if (this._isAuthorized(socket.id)) {
          Logger.log(this._getName(socket.id) + " invoked status!");
          const server = this._getServer(serverName);
          if (!server) {
            callbackFn(null, "server-not-found");
            return;
          }
          callbackFn(server.status);
        }
      });

      socket.on(
        "whitelist",
        async (
          serverName,
          data: {
            action: "list" | "add" | "remove" | "clear";
            username?: string;
          },
          callbackFn: Function
        ) => {
          if (this._isAuthorized(socket.id)) {
            Logger.log(
              this._getName(socket.id) +
                " invoked whitelist " +
                data.action +
                "!"
            );
            const server = this._getServer(serverName);
            if (!server) {
              callbackFn(null, "server-not-found");
              return;
            }
            let ret: {
              res: { uuid: string; name: string }[] | boolean;
              error?: string;
            };
            switch (data.action) {
              case "list":
                ret = { res: server.whitelist.array };
                break;
              case "add":
                ret = await this._wrapper
                  .getServer(serverName)
                  .whitelist.add(data.username || "");
                break;
              case "remove":
                ret = await this._wrapper
                  .getServer(serverName)
                  .whitelist.remove(data.username || "");
                break;
              case "clear":
                ret = server.whitelist.clear();
                break;
            }
            callbackFn(ret.res, ret.error);
          }
        }
      );

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
      Logger.log("Listening on http://localhost:" + port);
    });
  }

  private _getServer(serverName: string) {
    const server = this._wrapper.getServer(serverName);
    if (!server) Logger.error(`Could not get server ${serverName}`);
    return server;
  }

  private _isAuthorized(id: string): boolean {
    return this._sockets.hasOwnProperty(id);
  }

  private _getName(id: string): string {
    return this._sockets[id];
  }
}
