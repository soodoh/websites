import { startStaticServer } from "@websites/static-site/preview";

const port = Number(process.argv[2] ?? "4200");
await startStaticServer({ root: ".amplify-hosting/static", port });
console.log(`Static artifact listening on http://127.0.0.1:${port}`);
