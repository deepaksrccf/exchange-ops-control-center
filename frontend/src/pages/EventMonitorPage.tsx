import {
  AllCommunityModule,
  themeQuartz,
  type ColDef,
  type ColumnState,
  type GridApi,
  type ICellRendererParams,
  type SelectionChangedEvent,
  type SortChangedEvent,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonTable } from "../components/ui/Skeleton";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useRealtimeStore } from "../store/realtimeStore";
import type { EventPage, EventSort, MarketEvent } from "../types/events";
import { formatTimestamp } from "../utils/formatters";

const modules = [AllCommunityModule];
const gridPreferencesKey = "event-monitor-grid-preferences";
const maxComparisonRows = 4;

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

function latencyClass(latency: number): string {
  if (latency >= 100) {
    return "ag-latency ag-latency--high";
  }

  if (latency >= 50) {
    return "ag-latency ag-latency--medium";
  }

  return "ag-latency ag-latency--normal";
}

function sanitizeCsvValue(value: unknown): string {
  const text = String(value ?? "");

  return /^[+\-=@\t\r]/.test(text) ? `'${text}` : text;
}

interface EventDetailsProps {
  event: MarketEvent;
  onClose: () => void;
}

function EventDetails({ event, onClose }: EventDetailsProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();

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
              Sequence {integerFormatter.format(event.sequenceNumber)}
            </h2>
          </div>

          <button
            ref={closeButton}
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
              <dt>Latency</dt>
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
  const gridApi = useRef<GridApi<MarketEvent> | null>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [sort, setSort] = useState<EventSort>("eventTimestamp,desc");
  const [quickFilter, setQuickFilter] = useState("");
  const [gridPreferences, setGridPreferences] = useLocalStorageState<{
    density: "compact" | "comfortable";
    columnState: ColumnState[] | null;
  }>(gridPreferencesKey, { density: "compact", columnState: null });
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [selectedRows, setSelectedRows] = useState<MarketEvent[]>([]);

  const [paused, setPaused] = useState(false);
  const [pausedAtEventCount, setPausedAtEventCount] = useState(0);
  const [displayData, setDisplayData] = useState<EventPage | undefined>(
    undefined,
  );

  const receivedEventCount = useRealtimeStore(
    (state) => state.receivedEventCount,
  );

  const query = useEventsQuery({
    page,
    size,
    sort,
  });

  const paginationKey = `${page}-${size}-${sort}`;
  const lastPaginationKey = useRef(paginationKey);
  const detailsOpen = selectedEvent !== null;

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const paginationChanged = lastPaginationKey.current !== paginationKey;

    if (!paused && !detailsOpen) {
      setDisplayData(query.data);
    } else if (paginationChanged) {
      setDisplayData(query.data);
    }

    lastPaginationKey.current = paginationKey;
  }, [query.data, paused, detailsOpen, paginationKey]);

  const openDetails = useCallback((event: MarketEvent) => {
    setSelectedEvent(event);
  }, []);

  const pauseDisplay = () => {
    setPausedAtEventCount(receivedEventCount);
    setPaused(true);
  };

  const resumeDisplay = () => {
    setPaused(false);

    if (query.data) {
      setDisplayData(query.data);
    }

    void query.refetch();
  };

  const newEventsAvailable = paused
    ? Math.max(0, receivedEventCount - pausedAtEventCount)
    : 0;

  const columnDefs = useMemo<ColDef<MarketEvent>[]>(
    () => [
      {
        field: "sequenceNumber",
        headerName: "Sequence",
        width: 130,
        sort: sort.startsWith("sequenceNumber")
          ? sort.endsWith("desc")
            ? "desc"
            : "asc"
          : undefined,
        valueFormatter: ({ value }) =>
          integerFormatter.format(Number(value ?? 0)),
        cellClass: "ag-cell-number",
      },
      {
        field: "eventType",
        headerName: "Type",
        width: 150,
        sortable: false,
        cellRenderer: ({ value }: ICellRendererParams<MarketEvent, string>) => (
          <Badge tone={eventTone(value ?? "")}>{value ?? "UNKNOWN"}</Badge>
        ),
      },
      {
        field: "venueCode",
        headerName: "Venue",
        width: 110,
        sortable: false,
      },
      {
        field: "symbolTicker",
        headerName: "Symbol",
        width: 115,
        sortable: false,
      },
      {
        field: "price",
        headerName: "Price",
        width: 125,
        sortable: false,
        valueFormatter: ({ value }) =>
          priceFormatter.format(Number(value ?? 0)),
        cellClass: "ag-cell-number",
      },
      {
        field: "quantity",
        headerName: "Quantity",
        width: 125,
        sortable: false,
        valueFormatter: ({ value }) =>
          integerFormatter.format(Number(value ?? 0)),
        cellClass: "ag-cell-number",
      },
      {
        field: "eventTimestamp",
        headerName: "Event Time",
        minWidth: 205,
        flex: 1,
        sort: sort.startsWith("eventTimestamp")
          ? sort.endsWith("desc")
            ? "desc"
            : "asc"
          : undefined,
        valueFormatter: ({ value }) => formatTimestamp(String(value ?? "")),
      },
      {
        field: "receivedTimestamp",
        headerName: "Received Time",
        minWidth: 205,
        flex: 1,
        sortable: false,
        valueFormatter: ({ value }) => formatTimestamp(String(value ?? "")),
      },
      {
        field: "processingLatencyMs",
        headerName: "Latency",
        width: 120,
        sort: sort.startsWith("processingLatencyMs")
          ? sort.endsWith("desc")
            ? "desc"
            : "asc"
          : undefined,
        valueFormatter: ({ value }) => `${value ?? 0} ms`,
        cellClass: ({ value }) => latencyClass(Number(value ?? 0)),
      },
      {
        field: "source",
        headerName: "Source",
        width: 150,
        sortable: false,
      },
      {
        colId: "actions",
        headerName: "Details",
        width: 110,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "right",
        cellRenderer: ({ data }: ICellRendererParams<MarketEvent>) =>
          data ? (
            <button
              type="button"
              className="ag-details-button"
              aria-label={`View event ${data.sequenceNumber}`}
              onClick={() => openDetails(data)}
            >
              <Eye size={15} aria-hidden="true" />
              View
            </button>
          ) : null,
      },
    ],
    [openDetails, sort],
  );

  const defaultColumnDefinition = useMemo<ColDef<MarketEvent>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 90,
    }),
    [],
  );

  const handleSort = (event: SortChangedEvent<MarketEvent>) => {
    const sortedColumn = event.api
      .getColumnState()
      .find((column) => column.sort);

    if (!sortedColumn?.sort) {
      return;
    }

    const supportedFields = new Set([
      "eventTimestamp",
      "sequenceNumber",
      "processingLatencyMs",
    ]);

    if (!supportedFields.has(sortedColumn.colId)) {
      return;
    }

    setSort(`${sortedColumn.colId},${sortedColumn.sort}` as EventSort);
    setPage(0);
  };

  const persistColumnState = useCallback(
    (api: GridApi<MarketEvent>) => {
      setGridPreferences((current) => ({
        ...current,
        columnState: api.getColumnState(),
      }));
    },
    [setGridPreferences],
  );

  const handleSelectionChanged = (
    event: SelectionChangedEvent<MarketEvent>,
  ) => {
    const rows = event.api.getSelectedRows();

    if (rows.length > maxComparisonRows) {
      const overflowIds = new Set(
        rows.slice(maxComparisonRows).map((row) => row.id),
      );

      event.api.forEachNode((node) => {
        if (node.data && overflowIds.has(node.data.id)) {
          node.setSelected(false);
        }
      });

      setSelectedRows(rows.slice(0, maxComparisonRows));
      return;
    }

    setSelectedRows(rows);
  };

  const exportCsv = () => {
    gridApi.current?.exportDataAsCsv({
      fileName: "synthetic-exchange-events.csv",
      processCellCallback: ({ value }) => sanitizeCsvValue(value),
    });
  };

  if (query.isPending) {
    return (
      <div className="page">
        <span className="sr-only" role="status">
          Loading synthetic events...
        </span>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
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

  const data = displayData ?? query.data;

  if (!data) {
    return (
      <div className="page">
        <span className="sr-only" role="status">
          Loading synthetic events...
        </span>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header event-page-header">
        <div>
          <p className="page__eyebrow">Live Operations Monitoring</p>
          <h1>Event Monitor</h1>
          <p>
            Explore persisted synthetic events using a virtualized operations
            grid. No real market data is used.
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

          <button
            type="button"
            className="event-action-button"
            onClick={paused ? resumeDisplay : pauseDisplay}
          >
            {paused ? (
              <PlayCircle size={17} aria-hidden="true" />
            ) : (
              <PauseCircle size={17} aria-hidden="true" />
            )}
            {paused ? "Resume Display" : "Pause Display"}
          </button>
        </div>
      </header>

      {paused && (
        <p className="operation-feedback" role="status">
          Display paused. The synthetic generator keeps running in the
          background.{" "}
          {newEventsAvailable > 0
            ? `${newEventsAvailable} new event${newEventsAvailable === 1 ? "" : "s"} available.`
            : "No new events yet."}
        </p>
      )}

      <Card title="Grid Controls">
        <div className="ag-grid-toolbar">
          <label className="ag-grid-search">
            Search loaded rows
            <input
              type="search"
              value={quickFilter}
              placeholder="Venue, symbol, type, source..."
              onChange={(event) => setQuickFilter(event.target.value)}
            />
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

          <label>
            Density
            <select
              value={gridPreferences.density}
              onChange={(event) =>
                setGridPreferences((current) => ({
                  ...current,
                  density: event.target.value as "compact" | "comfortable",
                }))
              }
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </label>

          <button
            type="button"
            className="event-action-button"
            onClick={() => {
              gridApi.current?.resetColumnState();
              setGridPreferences((current) => ({
                ...current,
                columnState: null,
              }));
              setQuickFilter("");
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset columns
          </button>

          <button
            type="button"
            className="event-action-button"
            onClick={exportCsv}
          >
            <Download size={16} aria-hidden="true" />
            Export loaded rows
          </button>

          <span
            className="event-refresh-status"
            role="status"
            aria-live="polite"
          >
            {query.isFetching
              ? "Retrieving persisted events"
              : `${data.content.length} rows loaded`}
          </span>
        </div>
      </Card>

      <Card title="Synthetic Market Events">
        <div className="ag-event-grid" aria-label="Synthetic market event grid">
          <AgGridProvider modules={modules}>
            <AgGridReact<MarketEvent>
              theme={themeQuartz}
              rowData={data.content}
              columnDefs={columnDefs}
              defaultColDef={defaultColumnDefinition}
              quickFilterText={quickFilter}
              cacheQuickFilter
              rowHeight={gridPreferences.density === "compact" ? 36 : 48}
              headerHeight={gridPreferences.density === "compact" ? 40 : 48}
              rowSelection={{
                mode: "multiRow",
              }}
              suppressMultiSort
              animateRows={false}
              getRowId={({ data: event }) => event.id}
              onGridReady={({ api }) => {
                gridApi.current = api;

                if (gridPreferences.columnState) {
                  api.applyColumnState({
                    state: gridPreferences.columnState,
                    applyOrder: true,
                  });
                }
              }}
              onSortChanged={handleSort}
              onColumnMoved={({ api }) => persistColumnState(api)}
              onColumnResized={({ api, finished }) => {
                if (finished) {
                  persistColumnState(api);
                }
              }}
              onColumnVisible={({ api }) => persistColumnState(api)}
              onSelectionChanged={handleSelectionChanged}
            />
          </AgGridProvider>
        </div>

        <footer className="pagination-bar">
          <span>
            Page {data.page + 1} of {Math.max(data.totalPages, 1)}
          </span>

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

      {selectedRows.length > 0 && (
        <Card
          title="Selected Event Comparison"
          action={
            <button
              type="button"
              className="event-action-button"
              onClick={() => {
                gridApi.current?.deselectAll();
                setSelectedRows([]);
              }}
            >
              Clear selection
            </button>
          }
        >
          <p className="analytics-scope-note">
            Comparing {selectedRows.length} of up to {maxComparisonRows}{" "}
            selected rows.
          </p>

          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">Selected event comparison</caption>

              <thead>
                <tr>
                  <th scope="col">Sequence</th>
                  <th scope="col">Event Time</th>
                  <th scope="col">Received Time</th>
                  <th scope="col">Latency</th>
                  <th scope="col">Price</th>
                  <th scope="col">Quantity</th>
                </tr>
              </thead>

              <tbody>
                {selectedRows.map((event) => (
                  <tr key={event.id}>
                    <td>{integerFormatter.format(event.sequenceNumber)}</td>
                    <td>{formatTimestamp(event.eventTimestamp)}</td>
                    <td>{formatTimestamp(event.receivedTimestamp)}</td>
                    <td>{event.processingLatencyMs} ms</td>
                    <td>{priceFormatter.format(event.price)}</td>
                    <td>{integerFormatter.format(event.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
