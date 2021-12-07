#!/usr/bin/env node
import { Command } from "commander";
import { ObserverApi } from "./observer/ObserverApi";
import { loadConfig } from "./util";

const program = new Command();

program
  .version("v1.0.3")
  .description("ObserverMC CLI.")
  .option("-c, --config <path>", "Configuration file path")
  .parse(process.argv);

const opts = program.opts();

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
