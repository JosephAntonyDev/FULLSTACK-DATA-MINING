import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Header } from "@/shared/components/layout/Header";
import "@/styles/dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dash-layout">
      <Sidebar />
      <div className="dash-content-wrapper">
        <Header />
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
