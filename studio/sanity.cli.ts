import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: { projectId: "ija35k0i", dataset: "production" },
  // Hosted on Vercel (see vercel.json), not on *.sanity.studio.
  deployment: { autoUpdates: false },
});
