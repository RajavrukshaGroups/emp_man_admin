export function UserTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      role="status"
      aria-label="Loading users"
    >
      <div className="overflow-x-auto">
        <div className="min-w-[1250px]">
          <div className="grid grid-cols-8 gap-5 border-b border-gray-200 bg-gray-50/80 px-5 py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            ))}
          </div>

          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-8 items-center gap-5 border-b border-gray-100 px-5 py-4"
            >
              {Array.from({ length: 8 }).map((_, column) => (
                <div
                  key={column}
                  className="h-9 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-9 w-44 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <span className="sr-only">Loading user accounts...</span>
    </div>
  );
}