"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="p-10">
      <h1>Something went wrong</h1>

      <p>{error.message}</p>

      <button onClick={reset}>Try Again</button>
    </div>
  );
}