export type Translator = (key: string) => string;

const SECTION_LABEL_KEYS: Record<string, string> = {
  Environment: "sections.environment",
  Introduction: "sections.introduction",
  Water: "sections.water",
  Fomites: "sections.fomites",
  Biovectors: "sections.biovectors",
  Personnel: "sections.personnel",
  Management: "sections.management",
  Health: "sections.health",
  VMP: "sections.vmp",
  Equipment: "sections.equipment",
  SOP: "sections.sop",
};

export function translateSectionLabel(section: string, t: Translator): string {
  const key = SECTION_LABEL_KEYS[section];
  return key ? t(key) : section;
}
