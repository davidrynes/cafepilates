import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { csCZLocale } from "@sanity/locale-cs-cz";
import { schemaTypes, SINGLETONS } from "./schemaTypes";

// Public identifiers, not secrets: the dataset is world-readable anyway, and
// editing requires signing in with a Sanity account that has project access.
export const PROJECT_ID = "ija35k0i";
export const DATASET = "production";

export default defineConfig({
  name: "cafepilates",
  title: "Café Pilates – web",
  projectId: PROJECT_ID,
  dataset: DATASET,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Obsah webu")
          .items([
            S.listItem()
              .title("Obrazovka v kavárně")
              .id("obrazovka")
              .child(S.document().schemaType("obrazovka").documentId("obrazovka")),
          ]),
    }),
    csCZLocale(),
  ],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from the "+" menu…
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  document: {
    // …nor deleted or duplicated by accident — only edited and published.
    actions: (actions, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
});
