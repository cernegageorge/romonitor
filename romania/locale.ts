export const ROMANIA_LOCALE = {
  locale: 'ro',
  country: 'RO',
  languages: ['română', 'engleză'],
  appName: 'World Monitor România',
  nav: {
    overview: 'Prezentare generală',
    news: 'Știri',
    markets: 'Piețe',
    energy: 'Energie',
    infrastructure: 'Infrastructură',
    geopolitics: 'Geopolitică',
  },
  filters: {
    romaniaOnly: 'Doar România',
    region: 'Regiune',
    marketFocus: 'Focus pe piață',
    energyFocus: 'Focus pe energie',
  },
  defaults: {
    localeLabel: 'Limba: română',
    countryLabel: 'Țară: România',
    variantLabel: 'Variantă: România',
  },
} as const;

export type RomaniaLocale = typeof ROMANIA_LOCALE;
