export const DOMAIN_CATALOG = [
  { id: "motivasi", name: "Motivasi" },
  { id: "disiplin", name: "Disiplin" },
  { id: "kemandirian", name: "Kemandirian" },
  { id: "critical-thinking", name: "Critical Thinking" },
  { id: "problem-solving", name: "Problem Solving" },
  { id: "komunikasi", name: "Komunikasi" },
  { id: "leadership", name: "Leadership" },
  { id: "emotional-resilience", name: "Emotional Resilience" },
] as const;

export type DomainName = (typeof DOMAIN_CATALOG)[number]["name"];
