"use client";

import { GlobalLoader } from "@/components/common/global-loader";

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading page..." }: PageLoadingProps) {
  return <GlobalLoader isOpen message={message} />;
}
