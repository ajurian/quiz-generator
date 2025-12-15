import { randomUUIDv7 } from "bun";

const base64url = randomUUIDv7("base64url");
console.log(btoa(base64url));
