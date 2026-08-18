import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="table-container">
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.id}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
