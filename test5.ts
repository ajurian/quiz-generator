const origFetch = global.fetch;
global.fetch = async (...args) => {
  const [resource, config] = args;
  const url = resource instanceof Request ? resource.url : resource;
  console.log(`[Fetch Detected] Request to: ${url}`);

  return origFetch(...args);
};

import { Redis } from "@upstash/redis";
import { EventSource } from "eventsource";

async function main() {
  const subscription = new Redis({
    url: "https://evident-gelding-31631.upstash.io",
    token: "AXuPAAIncDIyMjEzYWUzY2Q3NGY0ODZjODBkYjljZTlmNGRiMmRkNXAyMzE2MzE",
  }).subscribe("019b5fd7-65ea-77bd-9832-08a3dfb6b02f");

  subscription.on("subscribe", () => {
    console.log(
      "Subscribed to Redis channel '019b5fd7-65ea-77bd-9832-08a3dfb6b02f'"
    );
  });

  subscription.on("message", (data) => {
    console.log("Redis Message:", data);
  });
}

main();
