export type RomaniaSiteVariant = {
  id: 'romania';
  locale: 'ro';
  countryCode: 'RO';
  countryName: 'România';
  siteName: 'World Monitor România';
  url: 'https://romania.worldmonitor.app/dashboard';
  hostname: 'romania.worldmonitor.app';
  aliases: string[];
};

export const ROMANIA_SITE_VARIANT: RomaniaSiteVariant = {
  id: 'romania',
  locale: 'ro',
  countryCode: 'RO',
  countryName: 'România',
  siteName: 'World Monitor România',
  url: 'https://romania.worldmonitor.app/dashboard',
  hostname: 'romania.worldmonitor.app',
  aliases: ['www.worldmonitor.ro', 'worldmonitor.ro', 'romania.worldmonitor.app'],
};

export const ROMANIA_HOSTNAMES = ['romania.worldmonitor.app', 'www.worldmonitor.ro', 'worldmonitor.ro'];

export function isRomaniaHostname(hostname?: string | null): boolean {
  if (!hostname) return false;
  const normalized = hostname.trim().toLowerCase();
  return ROMANIA_HOSTNAMES.some((candidate) => normalized === candidate || normalized.endsWith(`.${candidate}`));
}

export function resolveRomaniaVariant(hostname?: string | null): 'romania' | 'full' {
  return isRomaniaHostname(hostname) ? 'romania' : 'full';
}
