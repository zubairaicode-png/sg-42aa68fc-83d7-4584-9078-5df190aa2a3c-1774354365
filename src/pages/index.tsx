import { SEO } from "@/components/SEO";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default function HomePage() {
  return (
    <>
      <SEO 
        title="Dashboard - Saudi ERP System"
        description="Complete ERP solution for Saudi Arabian businesses with sales, purchases, inventory, and accounting"
      />
      <DashboardLayout>
        <DashboardOverview />
      </DashboardLayout>
    </>
  );
}