import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "en" | "ar";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  // Common
  "dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "appointments": { en: "Appointments", ar: "المواعيد" },
  "patients": { en: "Patients", ar: "المرضى" },
  "prescriptions": { en: "Prescriptions", ar: "الوصفات" },
  "calculators": { en: "Calculators", ar: "الحاسبات" },
  "cases": { en: "Cases", ar: "الحالات" },
  "ai_assistant": { en: "AI Assistant", ar: "المساعد الذكي" },
  "owners_pets": { en: "Owners & Pets", ar: "الملاك والحيوانات" },
  "bookings": { en: "Bookings", ar: "الحجوزات" },
  "visits": { en: "Visits", ar: "الزيارات" },
  "inventory": { en: "Inventory", ar: "المخزون" },
  "finances": { en: "Finances", ar: "المالية" },
  "reports": { en: "Reports", ar: "التقارير" },
  "navigation": { en: "Navigation", ar: "التنقل" },
  "users_management": { en: "Users Management", ar: "إدارة المستخدمين" },
  "clinics": { en: "Clinics", ar: "العيادات" },
  "visits_cases": { en: "Visits & Cases", ar: "الزيارات والحالات" },
  "inventory_drugs": { en: "Inventory & Drugs", ar: "المخزون والأدوية" },
  "medical_calculators": { en: "Medical Calculators", ar: "الحاسبات الطبية" },
  "analytics_reports": { en: "Analytics & Reports", ar: "التحليلات والتقارير" },
  "financial_overview": { en: "Financial Overview", ar: "نظرة عامة مالية" },
  "clients": { en: "Clients", ar: "العملاء" },
  "switch_to_staff": { en: "Switch to Staff", ar: "التبديل للموظف" },
  "switch_to_doctor": { en: "Switch to Doctor", ar: "التبديل للطبيب" },
  "sign_out": { en: "Sign Out", ar: "تسجيل الخروج" },
  "search": { en: "Search patients, appointments...", ar: "بحث المرضى، المواعيد..." },
  "search_anything": { en: "Search anything...", ar: "بحث عن أي شيء..." },
  "search_cases": { en: "Search cases...", ar: "بحث في الحالات..." },
  "notifications": { en: "Notifications", ar: "التنبيهات" },
  "toggle_theme": { en: "Toggle Theme", ar: "تبديل المظهر" },
  "settings": { en: "Settings", ar: "الإعدادات" },
  "vet_clinic": { en: "Vet Clinic", ar: "عيادة بيطرية" },
  "veterinarian": { en: "Veterinarian", ar: "طبيب بيطري" },
  "reception": { en: "Reception", ar: "الاستقبال" },
  "good_morning": { en: "Good morning", ar: "صباح الخير" },
  "welcome_back": { en: "Welcome back,", ar: "أهلاً بعودتك،" },
  "reception_desk": { en: "Reception Desk", ar: "مكتب الاستقبال" },
  "today": { en: "today", ar: "اليوم" },
  "doctors_on_duty": { en: "doctors on duty", ar: "أطباء في الخدمة" },
  "simulation": { en: "Simulation", ar: "المحاكاة" },
  "exit_sim": { en: "Exit Sim", ar: "إنهاء المحاكاة" },
  "new_appointment": { en: "New Appointment", ar: "موعد جديد" },
  "on_duty": { en: "On Duty", ar: "في الخدمة" },
  "todays_schedule": { en: "Today's Schedule", ar: "جدول اليوم" },
  "total": { en: "total", ar: "الإجمالي" },
  "check_in": { en: "Check in", ar: "تسجيل دخول" },
  "weekly_revenue": { en: "Weekly Revenue", ar: "إيرادات الأسبوع" },
  "billing_queue": { en: "Billing Queue", ar: "قائمة الفواتير" },
  "inventory_alerts": { en: "Inventory Alerts", ar: "تنبيهات المخزون" },
  "stock": { en: "Stock", ar: "المخزون" },
  "new_prescription": { en: "New Prescription", ar: "وصفة جديدة" },
  "create_prescription": { en: "Create Prescription", ar: "إنشاء وصفة" },
  "pharmacy": { en: "Pharmacy", ar: "الصيدلية" },
  "active_prescriptions": { en: "active prescriptions", ar: "وصفات نشطة" },
  "medications": { en: "Medications", ar: "الأدوية" },
  "notes": { en: "Notes", ar: "ملاحظات" },
  "case_number": { en: "Case Number", ar: "رقم الحالة" },
  "patient": { en: "Patient", ar: "المريض" },
  "back": { en: "Back", ar: "رجوع" },
  "current_case": { en: "Current Case", ar: "الحالة الحالية" },
  "next_case": { en: "Up Next", ar: "التالي" },
  "start": { en: "Start", ar: "بدء" },
  "complete": { en: "Complete", ar: "إنهاء" },
  "completed": { en: "Completed", ar: "مكتمل" },
  "waiting": { en: "Waiting", ar: "في الانتظار" },
  "in_progress": { en: "In Progress", ar: "قيد التنفيذ" },
  "sim_mode": { en: "Case Tracker", ar: "متتبع الحالات" },
  "no_more_cases": { en: "All cases completed!", ar: "تم إنهاء جميع الحالات!" },
  "staff_controls": { en: "Staff controls the case flow", ar: "الموظف يتحكم بسير الحالات" },
  "doctor_view": { en: "Doctor View (Read-only)", ar: "عرض الطبيب (للقراءة فقط)" },
  "clinical_tools": { en: "Clinical Tools", ar: "الأدوات السريرية" },
  "drug_dose": { en: "Drug Dose", ar: "جرعة الدواء" },
  "fluid_therapy": { en: "Fluid Therapy", ar: "العلاج بالسوائل" },
  "cri": { en: "CRI", ar: "CRI" },
  "visit_management": { en: "Visit Management", ar: "إدارة الزيارات" },
  "visits_history": { en: "Visits & History", ar: "الزيارات والسجل" },
  "my_caseload": { en: "My Caseload", ar: "قائمة حالاتي" },
  "all_cases": { en: "All Cases", ar: "جميع الحالات" },
  "total_cases": { en: "Total Cases", ar: "إجمالي الحالات" },
  "last_case": { en: "Last Case", ar: "آخر حالة" },
  "no_cases_role": { en: "Cases are not available for your role.", ar: "الحالات غير متوفرة لدورك." },
  "details": { en: "Details", ar: "التفاصيل" },
  "case_management": { en: "Case Management", ar: "إدارة الحالات" },
  "drug_interaction_check": { en: "Drug Interaction Check", ar: "فحص تفاعلات الأدوية" },
  "check_interactions": { en: "Check Interactions", ar: "فحص التفاعلات" },
  "no_interactions": { en: "No Known Interaction", ar: "لا تفاعلات معروفة" },
  "interaction_detected": { en: "Potential Interaction Detected", ar: "تم اكتشاف تفاعل محتمل" },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === "ar" ? "rtl" as const : "ltr" as const;

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={lang}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          dir={dir}
          className={lang === "ar" ? "font-arabic h-full" : "h-full"}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
