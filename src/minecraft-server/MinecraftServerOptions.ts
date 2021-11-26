import { MinecraftServerType } from "./MinecraftServerType";

export interface MinecraftServerOptions {
  /** Unique name for the server */
  name: string;
  /** Server type */
  type: MinecraftServerType;
  /** Server directory path */
  path: string;
  /** Jar file name */
  jar: string;
  /** Java Arguments */
  args: string[];
  /** (Optional) Auto stop timeout (in milliseconds) */
  autostop?: number;
  /** (Optional) RCON configuration. */
  rcon?: {
    host: string;
    port: number;
    password: string;
  };
}
