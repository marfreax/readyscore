export const CLIENT_ORGANIZATION_ROLES = ["ADMIN", "VIEWER"] as const;
export type ClientOrganizationRole = (typeof CLIENT_ORGANIZATION_ROLES)[number];

export type ClientOrganizationSummary = {
  id: string;
  code: string;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  membership: { role: ClientOrganizationRole };
};
