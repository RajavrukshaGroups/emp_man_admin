import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProvider } from "@/providers/app-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Employee Management System",
    template: "%s | Employee Management System",
  },
  description:
    "Manage employees, departments, teams and company operations.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}