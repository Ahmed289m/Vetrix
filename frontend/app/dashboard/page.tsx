"use client";

import dynamic from "next/dynamic";
import { useRole } from "@/app/_components/RoleContext";

function RoleDashboardLoading() {
  return (
    <div className="route-fade-in p-4 sm:p-6 lg:p-8">
      <div className="w-10 h-10 rounded-full border-2 border-emerald/25 border-t-emerald animate-spin" />
      <div className="mt-4 h-3 w-56 rounded bg-tint/5 border border-tint/10 animate-pulse" />
      <div className="mt-2 h-3 w-80 rounded bg-tint/5 border border-tint/10 animate-pulse" />
    </div>
  );
}

const AdminDashboard = dynamic(
  () => import("./_components/AdminDashboard").then((m) => m.AdminDashboard),
  { ssr: false, loading: () => <RoleDashboardLoading /> },
);
const OwnerDashboard = dynamic(
  () => import("./_components/OwnerDashboard").then((m) => m.OwnerDashboard),
  { ssr: false, loading: () => <RoleDashboardLoading /> },
);
const StaffDashboard = dynamic(
  () => import("./_components/StaffDashboard").then((m) => m.StaffDashboard),
  { ssr: false, loading: () => <RoleDashboardLoading /> },
);
const DoctorDashboard = dynamic(
  () => import("./_components/DoctorDashboard").then((m) => m.DoctorDashboard),
  { ssr: false, loading: () => <RoleDashboardLoading /> },
);
const ClientDashboard = dynamic(
  () => import("./_components/ClientDashboard").then((m) => m.ClientDashboard),
  { ssr: false, loading: () => <RoleDashboardLoading /> },
);

export default function DashboardPage() {
  const { role } = useRole();

  return (
    <>
      {role === "admin" && <AdminDashboard />}
      {role === "owner" && <OwnerDashboard />}
      {role === "staff" && <StaffDashboard />}
      {role === "doctor" && <DoctorDashboard />}
      {role === "client" && <ClientDashboard />}
    </>
  );
}
