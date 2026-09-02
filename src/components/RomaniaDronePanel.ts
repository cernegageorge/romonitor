import { Panel } from './Panel';
import { fetchMilitaryFlights } from '@/services/military-flights';
import type { NewsItem } from '@/types';
import {
  filterRomaniaDroneFlights,
  findRomaniaDroneArticles,
  type DroneIncidentConfidence,
  type RomaniaDroneArticle,
} from '@/services/romania-drone-incidents';
import { escapeHtml, sanitizeUrl, unsafeRawHtml } from '@/utils/sanitize';

const CONFIDENCE_LABELS: Record<DroneIncidentConfidence, string> = {
  detected: 'Detectat prin tracking',
  official: 'Sursa oficiala',
  reported: 'Raportat de presa',
  unverified: 'Neverificat',
};

function formatDate(date: Date): string {
  return date.toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' });
}

function articleCard(article: RomaniaDroneArticle): string {
  const { item } = article;
  const url = sanitizeUrl(item.link);
  const title = escapeHtml(item.title);
  const source = escapeHtml(item.source);
  const details = `${CONFIDENCE_LABELS[article.confidence]} · ${article.matchedTerms.join(', ')}`;
  const body = `<div class="romania-drone-card__meta">${source} · ${formatDate(item.pubDate)}</div><div class="romania-drone-card__title">${title}</div><div class="romania-drone-card__tag">${escapeHtml(details)}</div>`;
  return url
    ? `<a class="romania-drone-card" href="${url}" target="_blank" rel="noopener noreferrer">${body}</a>`
    : `<div class="romania-drone-card">${body}</div>`;
}

function flightCard(flight: { callsign: string; aircraftModel?: string; altitude: number; speed: number; confidence: string }): string {
  const identity = escapeHtml(flight.callsign || flight.aircraftModel || 'Drone necunoscuta');
  const model = flight.aircraftModel ? ` · ${escapeHtml(flight.aircraftModel)}` : '';
  return `<div class="romania-drone-card"><div class="romania-drone-card__meta">Detectat prin tracking · incredere ${escapeHtml(flight.confidence)}</div><div class="romania-drone-card__title">${identity}${model}</div><div class="romania-drone-card__tag">Altitudine ${Math.round(flight.altitude)} m · viteza ${Math.round(flight.speed)} km/h</div></div>`;
}

export class RomaniaDronePanel extends Panel {
  private latestFlights: Awaited<ReturnType<typeof fetchMilitaryFlights>>['flights'] = [];

  constructor(private getLatestNews: () => NewsItem[]) {
    super({
      id: 'romania-drone',
      title: 'Drone si incidente in Romania',
      infoTooltip: 'Drone detectate prin tracking si articole relevante din surse oficiale sau presa romaneasca.',
      showCount: false,
      trackActivity: true,
      defaultRowSpan: 2,
    });
    this.showLoading();
    void this.refresh();
    this.scheduleRefresh();
  }

  public async fetchData(): Promise<void> {
    await this.refresh();
  }

  private scheduleRefresh(): void {
    setTimeout(() => {
      if (!this.element?.isConnected) return;
      void this.refresh();
      this.scheduleRefresh();
    }, 60_000);
  }

  private async refresh(): Promise<void> {
    try {
      const result = await fetchMilitaryFlights();
      this.latestFlights = filterRomaniaDroneFlights(result.flights);
    } catch {
      this.latestFlights = [];
    }
    if (!this.element?.isConnected) return;
    this.render();
  }

  private render(): void {
    const articles = findRomaniaDroneArticles(this.getLatestNews());
    const flights = this.latestFlights;
    const flightMarkup = flights.length
      ? flights.map(flightCard).join('')
      : '<div class="romania-drone-empty">Nicio drona aeriana detectata in limitele Romaniei.</div>';
    const articleMarkup = articles.length
      ? articles.map(articleCard).join('')
      : '<div class="romania-drone-empty">Niciun articol relevant in sursele monitorizate.</div>';
    this.setSafeContent(unsafeRawHtml(`<div class="romania-drone-panel"><div class="romania-drone-summary"><strong>${flights.length}</strong> drone detectate · <strong>${articles.length}</strong> articole relevante</div><h4>Detectii aeriene</h4><div class="romania-drone-list">${flightMarkup}</div><h4>Stiri si alerte</h4><div class="romania-drone-list">${articleMarkup}</div><div class="romania-drone-disclaimer">Datele de tracking nu inlocuiesc alertele oficiale. Articolele sunt etichetate separat dupa tipul sursei.</div></div>`, 'Romania drone panel'));
  }
}
