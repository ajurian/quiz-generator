import { Redis } from "@upstash/redis";

async function main() {
  console.log(
    await new Redis({
      url: "https://evident-gelding-31631.upstash.io",
      token: "AXuPAAIncDIyMjEzYWUzY2Q3NGY0ODZjODBkYjljZTlmNGRiMmRkNXAyMzE2MzE",
    }).publish("019b5fd7-65ea-77bd-9832-08a3dfb6b02f", "test")
  );
}

main();
