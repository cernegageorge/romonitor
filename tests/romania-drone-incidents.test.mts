import { strict as assert } from 'node:assert';
import test from 'node:test';
import type { NewsItem, MilitaryFlight } from '../src/types';
import {
  classifyRomaniaDroneArticle,
  filterRomaniaDroneFlights,
  findRomaniaDroneArticles,
} from '../src/services/romania-drone-incidents';

function article(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    source: 'Digi24',
    title: 'Drona a fost semnalata in Tulcea',
    link: 'https://example.com/drone',
    description: '',
    snippet: '',
    pubDate: new Date('2026-09-02T10:00:00Z'),
    isAlert: true,
    ...overrides,
  };
}

function flight(overrides: Partial<MilitaryFlight> = {}): MilitaryFlight {
  return {
    id: 'drone-1',
    source: 'adsb.lol',
    callsign: 'REAPER',
    hexCode: 'abc123',
    aircraftType: 'drone',
    operator: 'other',
    operatorCountry: 'XX',
    lat: 45.9,
    lon: 24.9,
    altitude: 1000,
    heading: 90,
    speed: 200,
    lastSeen: new Date('2026-09-02T10:00:00Z'),
    confidence: 'medium',
    ...overrides,
  };
}

test('matches Romanian diacritics and classifies Romanian media as reported', () => {
  const result = classifyRomaniaDroneArticle(article({ title: 'O dronă navală a fost observată lângă Constanța' }));
  assert.equal(result?.confidence, 'reported');
  assert.deepEqual(result?.matchedTerms, ['drona/drone', 'drona navala']);
});

test('deduplicates matching articles by link', () => {
  const result = findRomaniaDroneArticles([
    article(),
    article({ title: 'Dronă în Tulcea, informații noi' }),
  ]);
  assert.equal(result.length, 1);
});

test('keeps only drone flights inside Romanian bounds', () => {
  const result = filterRomaniaDroneFlights([
    flight(),
    flight({ id: 'aircraft-1', aircraftType: 'fighter' }),
    flight({ id: 'drone-2', lon: 30.1 }),
  ]);
  assert.deepEqual(result.map((item) => item.id), ['drone-1']);
});
