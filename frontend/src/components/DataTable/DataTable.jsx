import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DataTable.css';

const PAGE_SIZE = 5; // initial rows shown + increment per "Load More" click

function DataTable({
  columns      = [],
  data         = [],
  loading      = false,
  emptyMessage = 'No data available.',
  pageSize     = PAGE_SIZE,
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const wrapperRef = useRef(null);

  // Build a stable key from the record IDs so we can detect a meaningful
  // data change (new filter / refresh) without firing on every re-render.
  const dataKey = useMemo(
    () => data.map(r => r.id ?? r.userId ?? '').join(','),
    [data]
  );

  // Reset to first page whenever the dataset itself changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [dataKey, pageSize]);

  const visibleData  = data.slice(0, visibleCount);
  const hasMore      = visibleCount < data.length;
  const canShowLess  = visibleCount > pageSize;   // user has expanded beyond initial view
  const allLoaded    = !hasMore && data.length > pageSize;

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + pageSize, data.length));
      setLoadingMore(false);
    }, 280);
  };

  const showAll = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(data.length);
      setLoadingMore(false);
    }, 280);
  };

  const showLess = () => {
    setVisibleCount(pageSize);
    // Scroll the top of the table back into view
    wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

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
    <div className="datatable-wrapper" ref={wrapperRef}>
      <table className="datatable">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleData.map((row, rowIndex) => (
            <tr key={row.id ?? row.userId ?? rowIndex}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="datatable-footer">
        <span className="datatable-count">
          Showing <strong>{visibleData.length}</strong> of <strong>{data.length}</strong>{' '}
          {data.length === 1 ? 'record' : 'records'}
        </span>

        <div className="datatable-actions">
          {/* Load More — only when more records exist */}
          {hasMore && (
            <button
              className="dt-btn dt-btn--primary"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore
                ? <><span className="dt-spinner" />Loading…</>
                : `Load More (${Math.min(pageSize, data.length - visibleCount)} more)`
              }
            </button>
          )}

          {/* Show All — only when more records exist */}
          {hasMore && (
            <button
              className="dt-btn dt-btn--ghost"
              onClick={showAll}
              disabled={loadingMore}
            >
              Show All ({data.length})
            </button>
          )}

          {/* All records loaded confirmation */}
          {allLoaded && (
            <span className="dt-all-loaded">✓ All {data.length} records loaded</span>
          )}

          {/* Show Less — visible whenever the user has expanded beyond the initial view */}
          {canShowLess && (
            <button
              className="dt-btn dt-btn--collapse"
              onClick={showLess}
              disabled={loadingMore}
            >
              Show Less ↑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;
