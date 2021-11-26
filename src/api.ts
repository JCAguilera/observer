#!/usr/bin/env node
import fs from "fs";
import crypto from "crypto";
import { Command } from "commander";
import { ObserverApi } from "./observer/ObserverApi";
import { ObserverOptions } from "./observer/ObserverOptions";
import { Logger } from "./util";

const program = new Command();

program
  .version("v1.0.3")
  .description("ObserverMC CLI.")
  .option("-c, --config <path>", "Configuration file path")
  .parse(process.argv);

const opts = program.opts();

console.log(opts);

if (opts.config) {
  const config = loadConfig(opts.config);
  const observerApi = new ObserverApi(config);
  observerApi.listen();
} else {
  console.error(
    "Please provide the config file path using the --config option"
  );
  process.exit(0);
}

function loadConfig(path: string): ObserverOptions {
  let config: ObserverOptions;
  try {
    config = JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch {
    Logger.error("Could not load the config file, creating example file...");
    config = {
      servers: [],
      apiKey: crypto.randomBytes(20).toString("hex"),
      port: 3000,
    };
    fs.writeFileSync(path, JSON.stringify(config));
    Logger.log(
      "Generated config file! Edit it and restart the wrapper to apply changes."
    );
    // Display API key
    console.log("\nYour auto-generated API key is: " + config.apiKey);
    console.log("DO NOT SHARE IT\n");
  }
  return config;
}
