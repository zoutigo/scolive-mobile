import type { PageHelpSection } from "../help/PageHelpModal";

export function FEED_HELP_SECTIONS(
  t: (key: string) => string,
): PageHelpSection[] {
  return [
    {
      title: t("feed.classLife.help.section1Title"),
      body: [t("feed.classLife.help.section1Body")],
    },
    {
      title: t("feed.classLife.help.section2Title"),
      body: [t("feed.classLife.help.section2Body")],
    },
    {
      title: t("feed.classLife.help.section3Title"),
      body: [t("feed.classLife.help.section3Body")],
    },
    {
      title: t("feed.classLife.help.section4Title"),
      body: [t("feed.classLife.help.section4Body")],
    },
    {
      title: t("feed.classLife.help.section5Title"),
      body: [t("feed.classLife.help.section5Body")],
    },
    {
      title: t("feed.classLife.help.section6Title"),
      body: [t("feed.classLife.help.section6Body")],
    },
    {
      title: t("feed.classLife.help.section7Title"),
      body: [t("feed.classLife.help.section7Body")],
    },
  ];
}
