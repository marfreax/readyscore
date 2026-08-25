import taxonomy from "../data/taxonomy-v1.json";

export type TaxonomyIndicator = { code: string };
export type TaxonomySubdomain = {
  code: string;
  name: string;
  indicators: TaxonomyIndicator[];
};
export type TaxonomyDomain = {
  code: string;
  name: string;
  subdomains: TaxonomySubdomain[];
};

export const TAXONOMY = taxonomy as { version: string; domains: TaxonomyDomain[] };

export function findDomain(value: string | null | undefined) {
  if (!value) return undefined;
  return TAXONOMY.domains.find((item) => item.code === value || item.name === value);
}

export function findSubdomain(domainValue: string, value: string | null | undefined) {
  const domain = findDomain(domainValue);
  if (!domain || !value) return undefined;
  return domain.subdomains.find((item) => item.code === value || item.name === value);
}

export function validateMapping(
  domainValue: string,
  subdomainValue: string | null,
  indicatorValue: string | null,
) {
  const domain = findDomain(domainValue);
  if (!domain) throw new Error("UNKNOWN_DOMAIN");

  const subdomain = subdomainValue ? findSubdomain(domain.code, subdomainValue) : undefined;
  if (subdomainValue && !subdomain) throw new Error("UNKNOWN_SUBDOMAIN_OR_DOMAIN_MISMATCH");

  const indicator = indicatorValue
    ? subdomain?.indicators.find((item) => item.code === indicatorValue)
    : undefined;
  if (indicatorValue && !indicator) throw new Error("UNKNOWN_INDICATOR_OR_TAXONOMY_MISMATCH");

  return {
    domain: domain.code,
    subdomain: subdomain?.code ?? null,
    indicator: indicator?.code ?? null,
  };
}
