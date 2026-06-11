"use client";

import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/Toast";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <TopBar />
      <main className="flex-1 pt-16">{children}</main>
    </ToastProvider>
  );
}
