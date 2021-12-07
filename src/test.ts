import { ObserverWrapper } from "./observer/ObserverWrapper";
import { loadConfig } from "./util";

const config = loadConfig("example-config.json");
const wrapper = new ObserverWrapper(config);

console.log("OBSERVER TESTING STARTED");

(async () => {
  // Test whatever you want here
})();
