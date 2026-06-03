// components/DataTable/DataTable.jsx
// -----------------------------------
// Purpose: A fully reusable table component that renders any backend data dynamically.
//
// Design decisions:
//   - Receives all data and column definitions through props – it knows nothing
//     about attractions, users, or any specific entity type.
//   - Uses Array.prototype.map() to generate both table header cells (from
//     the columns prop) and table rows (from the data prop).
//   - A custom render function per column lets callers format values (e.g.,
//     displaying "$35" instead of "35", showing "Free" when price is 0).
//   - Handles three states: loading, empty data, and populated data.
//
// Props:
//   columns  {Array}   – Array of column descriptor objects:
//                         { key: string, label: string, render?: (value, row) => ReactNode }
//                         - key:    The object property to read from each data row.
//                         - label:  The column header text.
//                         - render: Optional formatter function. If omitted,
//                                   the raw value is displayed.
//   data     {Array}   – Array of data objects (one object = one table row).
//   loading  {boolean} – When true, shows a loading message instead of data.
//   emptyMessage {string} – Text shown when data array is empty (optional).
//
// Reusability examples:
//   - Dashboard uses it for attractions.
//   - Could be reused for users, destinations, trips, etc. with zero changes.

import React from 'react';
import './DataTable.css';

function DataTable({ columns = [], data = [], loading = false, emptyMessage = 'No data available.' }) {

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="datatable-status">
        <span className="loading-spinner" aria-label="Loading data" />
        <p>Loading data from server...</p>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="datatable-status datatable-empty">
        <span className="empty-icon">📭</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // ── Populated state ─────────────────────────────────────────────────────
  return (
    <div className="datatable-wrapper">
      <table className="datatable">
        {/* ── Table Head: generated from the columns prop ── */}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>

        {/* ── Table Body: one <tr> per data row ── */}
        <tbody>
          {data.map((row, rowIndex) => (
            // Use index as fallback key; prefer a unique row ID when available
            <tr key={row.id ?? row.userId ?? rowIndex}>
              {columns.map((col) => (
                <td key={col.key}>
                  {/* If the column has a custom renderer, use it; otherwise show raw value */}
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Row count footer */}
      <p className="datatable-count">
        Showing {data.length} {data.length === 1 ? 'record' : 'records'}
      </p>
    </div>
  );
}

export default DataTable;
