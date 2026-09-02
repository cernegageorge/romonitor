// Romania variant - romania.worldmonitor.app
import type { PanelConfig, MapLayers } from '@/types';
import type { VariantConfig } from './base';
import {
  DEFAULT_PANELS as FULL_DEFAULT_PANELS,
  DEFAULT_MAP_LAYERS as FULL_DEFAULT_MAP_LAYERS,
  MOBILE_DEFAULT_MAP_LAYERS as FULL_MOBILE_DEFAULT_MAP_LAYERS,
} from './full';

export * from './base';

export const DEFAULT_PANELS: Record<string, PanelConfig> = {
  ...FULL_DEFAULT_PANELS,
  map: { name: 'Hartă România', enabled: true, priority: 1 },
  'live-news': { name: 'Știri live', enabled: true, priority: 1 },
  'romania-drone': { name: 'Drone și incidente', enabled: true, priority: 1 },
  'live-webcams': { name: 'Webcam-uri live', enabled: true, priority: 1 },
  'threat-timeline': { name: 'Cronologia riscurilor', enabled: true, priority: 1 },
  intel: { name: 'Inteligență locală', enabled: true, priority: 1 },
  cii: { name: 'Instabilitate țară', enabled: true, priority: 1 },
  'strategic-risk': { name: 'Riscuri strategice', enabled: true, priority: 1 },
  politics: { name: 'Știri din România', enabled: true, priority: 1 },
  europe: { name: 'Europa & România', enabled: true, priority: 1 },
  energy: { name: 'Energie & resurse', enabled: true, priority: 1 },
  gov: { name: 'Guvern & politică', enabled: true, priority: 1 },
  markets: { name: 'Piețe & BVB', enabled: true, priority: 1 },
  economic: { name: 'Indicatori economici', enabled: true, priority: 1 },
  commodities: { name: 'Materii prime & logistică', enabled: true, priority: 1 },
  finance: { name: 'Finanțe', enabled: true, priority: 1 },
  tech: { name: 'Tehnologie & digitalizare', enabled: true, priority: 2 },
  romania: { name: 'România', enabled: true, priority: 2 },
};

export const DEFAULT_MAP_LAYERS: MapLayers = {
  ...FULL_DEFAULT_MAP_LAYERS,
  hotspots: true,
  conflicts: true,
  bases: true,
  weather: true,
  outages: true,
  economic: true,
  pipelines: true,
  waterways: true,
  tradeRoutes: true,
  sanctions: true,
  resilienceScore: true,
  dayNight: true,
  protests: true,
  flights: true,
};

export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = {
  ...FULL_MOBILE_DEFAULT_MAP_LAYERS,
  hotspots: true,
  conflicts: true,
  bases: true,
  weather: true,
  outages: true,
  economic: true,
  tradeRoutes: true,
  resilienceScore: true,
  dayNight: true,
};

export const VARIANT_CONFIG: VariantConfig = {
  name: 'romania',
  description: 'Dashboard de inteligență pentru România, cu default-uri în limba română și focus pe piețe, energie, infrastructură și risc local.',
  panels: DEFAULT_PANELS,
  mapLayers: DEFAULT_MAP_LAYERS,
  mobileMapLayers: MOBILE_DEFAULT_MAP_LAYERS,
};
