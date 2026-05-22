import type { SnapConfig } from "@metamask/snaps-cli";
import { resolve } from "path";

// Build-time env injection. Snaps run in a sandbox without `process` global,
// so we rely on webpack DefinePlugin (driven by this field) to substitute
// `process.env.X` references at compile time.
//
// To point the dev snap at a deployed backend instead of localhost:
//   DRAINT_API_BASE=https://draint-be.vercel.app bun run start
const config: SnapConfig = {
  input: resolve(__dirname, "src/index.tsx"),
  server: {
    port: 8080,
  },
  polyfills: {
    buffer: true,
  },
  environment: {
    DRAINT_API_BASE:
      process.env.DRAINT_API_BASE || "http://localhost:3001",
  },
};

export default config;
