import { DashboardLayout } from "@/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";

import Prescriptions from "./doctor/Prescriptions";
import Calculators from "./doctor/Calculators";
import DoctorCases from "./doctor/Cases";
import DoctorHome from "./DoctorHome";

export default function DoctorDashboard() {
  return (
    <DashboardLayout role="doctor">
      <Routes>
        <Route index element={<DoctorHome />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="calculators" element={<Calculators />} />
        <Route path="cases" element={<DoctorCases />} />
        <Route path="*" element={<DoctorHome />} />
      </Routes>
    </DashboardLayout>
  );
}
