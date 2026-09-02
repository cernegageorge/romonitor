import type { NewsItem, MilitaryFlight } from '@/types';

export type DroneIncidentConfidence = 'detected' | 'official' | 'reported' | 'unverified';

export interface RomaniaDroneArticle {
  item: NewsItem;
  confidence: DroneIncidentConfidence;
  matchedTerms: string[];
}

const ROMANIA_BOUNDS = Object.freeze({ south: 43.5, north: 48.3, west: 20.2, east: 29.8 });

const INCIDENT_TERMS: Array<[string, RegExp]> = [
  ['drona/drone', /\bdron(?:a|e|elor|elor)\b/i],
  ['UAV/UAS', /\b(?:uav|uas)\b/i],
  ['obiect zburator neidentificat', /obiect\s+(?:aerian|zburator)\s+neidentificat/i],
  ['aeronava fara pilot', /aeronava\s+fara\s+pilot/i],
  ['drona navala', /dron(?:a|ă)\s+naval(?:a|ă)/i],
  ['ambarcațiune fara echipaj', /ambarca(?:ț|t)iune\s+f(?:ă|a)r(?:ă|a)\s+echipaj/i],
  ['RO-Alert', /ro[ -]?alert/i],
];

const ROMANIA_TERMS = /\b(?:romania|roman(?:ian|e|esti)|tulcea|constanta|galati|braila|sulina|delta\s+dunarii|marea\s+neagra|bucuresti|ucraina|moldova)\b/i;
const OFFICIAL_SOURCE = /(?:DSU|IGSU|MAI|MAPN|RO-Alert|Agerpres|Guvernul Romaniei|ISU\b)/i;
const ROMANIAN_SOURCE = /(?:Digi24|HotNews|G4Media|Agerpres|Romania Insider|Euractiv Romania|Bursa\.ro|Digi Sport|ProTV|Antena|News\.ro|Adevarul|Libertatea|Mediafax|Ziarul Financiar)/i;

function searchableText(item: NewsItem): string {
  return `${item.title} ${item.snippet || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function classifyRomaniaDroneArticle(item: NewsItem): RomaniaDroneArticle | null {
  const text = searchableText(item);
  const matchedTerms = INCIDENT_TERMS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  if (matchedTerms.length === 0) return null;

  // Romanian outlets are intentionally included even when the event is abroad;
  // the panel is a media watch as well as a geospatial detection layer.
  if (!ROMANIA_TERMS.test(text) && !ROMANIAN_SOURCE.test(item.source) && !OFFICIAL_SOURCE.test(item.source)) return null;

  const confidence: DroneIncidentConfidence = OFFICIAL_SOURCE.test(item.source)
    ? 'official'
    : ROMANIAN_SOURCE.test(item.source)
      ? 'reported'
      : 'unverified';
  return { item, confidence, matchedTerms };
}

export function findRomaniaDroneArticles(items: NewsItem[], limit = 30): RomaniaDroneArticle[] {
  const seen = new Set<string>();
  return items
    .map(classifyRomaniaDroneArticle)
    .filter((article): article is RomaniaDroneArticle => article !== null)
    .sort((a, b) => b.item.pubDate.getTime() - a.item.pubDate.getTime())
    .filter((article) => {
      const key = article.item.link || article.item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function filterRomaniaDroneFlights(flights: MilitaryFlight[]): MilitaryFlight[] {
  return flights.filter((flight) => (
    flight.aircraftType === 'drone'
    && flight.lat >= ROMANIA_BOUNDS.south
    && flight.lat <= ROMANIA_BOUNDS.north
    && flight.lon >= ROMANIA_BOUNDS.west
    && flight.lon <= ROMANIA_BOUNDS.east
  ));
}
