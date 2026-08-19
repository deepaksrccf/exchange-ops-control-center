export type MarketEventMetadata = Record<string, unknown>;

export interface MarketEvent {
  id: string;
  venueId: string;
  venueCode: string;
  symbolId: string;
  symbolTicker: string;
  sequenceNumber: number;
  eventType: string;
  price: number;
  quantity: number;
  eventTimestamp: string;
  receivedTimestamp: string;
  processingLatencyMs: number;
  source: string;
  metadata: MarketEventMetadata;
}

export interface EventPage {
  content: MarketEvent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type EventSort =
  | "eventTimestamp,desc"
  | "eventTimestamp,asc"
  | "sequenceNumber,desc"
  | "sequenceNumber,asc"
  | "processingLatencyMs,desc"
  | "processingLatencyMs,asc";

export interface EventQueryParameters {
  page: number;
  size: number;
  sort: EventSort;
}
