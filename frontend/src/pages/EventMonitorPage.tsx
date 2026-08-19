import { ChevronLeft, ChevronRight, Eye, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useEventsQuery } from "../hooks/useEventsQuery";
import type { EventSort, MarketEvent } from "../types/events";
import { formatTimestamp } from "../utils/formatters";

const integerFormatter = new Intl.NumberFormat("en-US");

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function eventTone(
  eventType: string,
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (eventType.toUpperCase()) {
    case "HALT":
      return "danger";
    case "RESUME":
      return "success";
    case "TRADE":
      return "info";
    case "QUOTE":
      return "neutral";
    default:
      return "warning";
  }
}

function latencyTone(latency: number): string {
  if (latency >= 100) {
    return "event-latency event-latency--high";
  }

  if (latency >= 50) {
    return "event-latency event-latency--medium";
  }

  return "event-latency event-latency--normal";
}

interface EventDetailsProps {
  event: MarketEvent;
  onClose: () => void;
}

function EventDetails({ event, onClose }: EventDetailsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="event-panel-backdrop">
      <button
        type="button"
        className="event-panel-backdrop__close"
        aria-label="Close event details"
        onClick={onClose}
      />

      <aside
        className="event-details-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-details-title"
      >
        <header className="event-details-panel__header">
          <div>
            <p className="page__eyebrow">Synthetic Event</p>
            <h2 id="event-details-title">
              Event {integerFormatter.format(event.sequenceNumber)}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label="Close event details"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="event-details-panel__body">
          <dl className="event-detail-list">
            <div>
              <dt>Event type</dt>
              <dd>
                <Badge tone={eventTone(event.eventType)}>
                  {event.eventType}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{event.venueCode}</dd>
            </div>
            <div>
              <dt>Symbol</dt>
              <dd>{event.symbolTicker}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{priceFormatter.format(event.price)}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{integerFormatter.format(event.quantity)}</dd>
            </div>
            <div>
              <dt>Event timestamp</dt>
              <dd>{formatTimestamp(event.eventTimestamp)}</dd>
            </div>
            <div>
              <dt>Received timestamp</dt>
              <dd>{formatTimestamp(event.receivedTimestamp)}</dd>
            </div>
            <div>
              <dt>Processing latency</dt>
              <dd>{event.processingLatencyMs} ms</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{event.source}</dd>
            </div>
            <div>
              <dt>Event ID</dt>
              <dd className="event-id">{event.id}</dd>
            </div>
          </dl>

          <section className="event-metadata">
            <h3>Metadata</h3>

            {Object.entries(event.metadata).length === 0 ? (
              <p>No metadata was provided.</p>
            ) : (
              <dl className="event-detail-list">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

export function EventMonitorPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [sort, setSort] = useState<EventSort>("eventTimestamp,desc");
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);

  const query = useEventsQuery({
    page,
    size,
    sort,
  });

  if (query.isPending) {
    return <LoadingState message="Loading synthetic events..." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={
          query.error instanceof Error
            ? query.error.message
            : "Unable to load events."
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;

  return (
    <div className="page">
      <header className="page__header event-page-header">
        <div>
          <p className="page__eyebrow">Operations Monitoring</p>
          <h1>Event Monitor</h1>
          <p>
            Review paginated synthetic market events from fictional exchange
            venues. No real market data is used.
          </p>
        </div>

        <div className="event-page-header__actions">
          <span className="event-record-count">
            {integerFormatter.format(data.totalElements)} events
          </span>

          <button
            type="button"
            className="event-action-button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw
              size={17}
              aria-hidden="true"
              className={query.isFetching ? "icon-spinning" : undefined}
            />
            {query.isFetching ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      <Card title="Event Controls">
        <div className="event-toolbar">
          <label>
            Sort events
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as EventSort);
                setPage(0);
              }}
            >
              <option value="eventTimestamp,desc">Newest events</option>
              <option value="eventTimestamp,asc">Oldest events</option>
              <option value="sequenceNumber,desc">Highest sequence</option>
              <option value="sequenceNumber,asc">Lowest sequence</option>
              <option value="processingLatencyMs,desc">Highest latency</option>
              <option value="processingLatencyMs,asc">Lowest latency</option>
            </select>
          </label>

          <label>
            Rows per page
            <select
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div
            className="event-refresh-status"
            role="status"
            aria-live="polite"
          >
            {query.isFetching
              ? "Retrieving updated events"
              : "Event data is current"}
          </div>
        </div>
      </Card>

      <Card title="Synthetic Market Events">
        <div className="event-table-container">
          <table className="data-table event-table">
            <caption className="sr-only">
              Paginated synthetic exchange events
            </caption>

            <thead>
              <tr>
                <th scope="col">Sequence</th>
                <th scope="col">Type</th>
                <th scope="col">Venue</th>
                <th scope="col">Symbol</th>
                <th scope="col">Price</th>
                <th scope="col">Quantity</th>
                <th scope="col">Event time</th>
                <th scope="col">Latency</th>
                <th scope="col">Source</th>
                <th scope="col">Details</th>
              </tr>
            </thead>

            <tbody>
              {data.content.length === 0 ? (
                <tr>
                  <td colSpan={10} className="data-table__empty">
                    No events were found.
                  </td>
                </tr>
              ) : (
                data.content.map((marketEvent) => (
                  <tr key={marketEvent.id}>
                    <td>
                      {integerFormatter.format(marketEvent.sequenceNumber)}
                    </td>
                    <td>
                      <Badge tone={eventTone(marketEvent.eventType)}>
                        {marketEvent.eventType}
                      </Badge>
                    </td>
                    <td>{marketEvent.venueCode}</td>
                    <td>
                      <strong>{marketEvent.symbolTicker}</strong>
                    </td>
                    <td>{priceFormatter.format(marketEvent.price)}</td>
                    <td>{integerFormatter.format(marketEvent.quantity)}</td>
                    <td>{formatTimestamp(marketEvent.eventTimestamp)}</td>
                    <td>
                      <span
                        className={latencyTone(marketEvent.processingLatencyMs)}
                      >
                        {marketEvent.processingLatencyMs} ms
                      </span>
                    </td>
                    <td>{marketEvent.source}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action-button"
                        aria-label={`View event ${marketEvent.sequenceNumber}`}
                        onClick={() => setSelectedEvent(marketEvent)}
                      >
                        <Eye size={16} aria-hidden="true" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="pagination-bar">
          <div>
            Page {data.page + 1} of {Math.max(data.totalPages, 1)}
          </div>

          <div className="pagination-bar__actions">
            <button
              type="button"
              disabled={data.first || query.isFetching}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>

            <button
              type="button"
              disabled={data.last || query.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </Card>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
