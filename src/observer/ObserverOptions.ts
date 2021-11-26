import { MinecraftServerOptions } from "../minecraft-server/MinecraftServerOptions";

export interface ObserverOptions {
  /** Servers list */
  servers: MinecraftServerOptions[];
  /** API Key to authenticate clients */
  apiKey: string;
  /** API port number */
  port: number;
}
