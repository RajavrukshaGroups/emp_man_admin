const columns = [
  "Client",
  "Type",
  "Engagement",
  "Contact",
  "Industry",
  "Status",
  "Actions",
];

export function ClientsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading clients">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                    column === "Actions" ? "text-right" : "text-left"
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={column} className="px-5 py-4">
                    <div
                      className={`h-5 animate-pulse rounded-lg bg-slate-200 ${
                        columnIndex === 0
                          ? "w-40"
                          : columnIndex === 6
                            ? "ml-auto w-16"
                            : "w-24"
                      }`}
                    />
                    {columnIndex === 0 && (
                      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-44 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <span className="sr-only">Loading client records...</span>
    </div>
  );
}
