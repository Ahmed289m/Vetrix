import { DashboardLayout } from "@/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Sub-pages
import Owners from "./staff/Owners";
import Bookings from "./staff/Bookings";
import Visits from "./staff/Visits";
import Inventory from "./staff/Inventory";
import Finances from "./staff/Finances";
import Reports from "./staff/Reports";
import Invoices from "./staff/Invoices";
import Cases from "./staff/Cases";
import StaffHome from "./StaffHome";

export default function StaffDashboard() {
  return (
    <DashboardLayout role="staff">
      <Routes>
        <Route index element={<StaffHome />} />
        <Route path="owners" element={<Owners />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="visits" element={<Visits />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="finances" element={<Finances />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="cases" element={<Cases />} />
        <Route path="*" element={<StaffHome />} />
      </Routes>
    </DashboardLayout>
  );
}
