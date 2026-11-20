import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * The TV in the café: a slideshow of portrait images at /obrazovka.
 *
 * The weekly soups get their own field at the top because that is the one
 * thing someone changes every week — they shouldn't have to find it in a
 * list. Everything else is an ordered list where drag-and-drop sets the order
 * on screen, and a slide can be switched off or limited to a date range
 * (a seasonal offer, an event poster) without deleting it.
 */
export const obrazovka = defineType({
  name: "obrazovka",
  title: "Obrazovka v kavárně",
  type: "document",
  fields: [
    defineField({
      name: "polevky",
      title: "Polévky tohoto týdne",
      type: "image",
      description:
        "Obrázek na výšku v poměru 9 : 16, ideálně 1080 × 1920 px. Každý týden stačí nahrát nový — na obrazovce se ukazuje jako první.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slides",
      title: "Další obrázky",
      type: "array",
      description: "Pořadí na obrazovce změníte přetažením.",
      of: [
        defineArrayMember({
          type: "object",
          name: "slide",
          title: "Obrázek",
          fields: [
            defineField({
              name: "obrazek",
              title: "Obrázek",
              type: "image",
              description: "Na výšku 9 : 16.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "popis",
              title: "Popisek",
              type: "string",
              description: "Jen pro vás, na obrazovce se nezobrazuje. Např. „Happy hours“.",
            }),
            defineField({
              name: "zobrazovat",
              title: "Zobrazovat",
              type: "boolean",
              description: "Vypnutý obrázek zůstane uložený, jen se nepromítá.",
              initialValue: true,
            }),
            defineField({
              name: "od",
              title: "Zobrazovat od",
              type: "date",
              description: "Nepovinné. Před tímto dnem se obrázek nepromítá.",
              options: { dateFormat: "D. M. YYYY" },
            }),
            defineField({
              name: "do",
              title: "Zobrazovat do",
              type: "date",
              description: "Nepovinné. Po tomto dni se obrázek přestane promítat sám.",
              options: { dateFormat: "D. M. YYYY" },
              validation: (rule) =>
                rule.custom((value, context) => {
                  const od = (context.parent as { od?: string } | undefined)?.od;
                  return !value || !od || value >= od ? true : "Konec nemůže být dřív než začátek.";
                }),
            }),
          ],
          preview: {
            select: { popis: "popis", media: "obrazek", zobrazovat: "zobrazovat", od: "od", do: "do" },
            prepare({ popis, media, zobrazovat, od, do: doDne }) {
              const datum = (iso?: string) => (iso ? iso.split("-").reverse().join(". ") : "");
              const obdobi = od || doDne ? `${datum(od) || "…"} – ${datum(doDne) || "…"}` : "";
              return {
                title: popis || "Obrázek bez popisku",
                subtitle: [zobrazovat === false ? "vypnuto" : "", obdobi].filter(Boolean).join(" · "),
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "sekundNaObrazek",
      title: "Jak dlouho ukazovat jeden obrázek",
      type: "number",
      description: "V sekundách.",
      initialValue: 8,
      validation: (rule) => rule.required().min(3).max(120),
    }),
    defineField({
      name: "sekundPrelinani",
      title: "Délka prolnutí",
      type: "number",
      description: "V sekundách. Musí být kratší než doba jednoho obrázku.",
      initialValue: 5,
      validation: (rule) =>
        rule
          .required()
          .min(0)
          .custom((value, context) => {
            const naObrazek = (context.document as { sekundNaObrazek?: number } | undefined)?.sekundNaObrazek;
            return value === undefined || !naObrazek || value < naObrazek
              ? true
              : "Prolnutí musí být kratší než doba jednoho obrázku.";
          }),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Obrazovka v kavárně" }),
  },
});
