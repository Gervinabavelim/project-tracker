export default function TrayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tray-root h-screen overflow-hidden">{children}</div>
  );
}
