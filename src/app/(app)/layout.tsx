import TopBar from "@/components/TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar />
      <main className="flex-1 pt-16">{children}</main>
    </>
  );
}
