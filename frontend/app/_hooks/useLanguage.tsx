import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

type Lang = "en" | "ar";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  // Common
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  appointments: { en: "Appointments", ar: "المواعيد" },
  patients: { en: "Patients", ar: "المرضى" },
  prescriptions: { en: "Prescriptions", ar: "الوصفات" },
  calculators: { en: "Calculators", ar: "الحاسبات" },
  cases: { en: "Cases", ar: "الحالات" },
  ai_assistant: { en: "AI Assistant", ar: "المساعد الذكي" },
  owners_pets: { en: "Owners & Pets", ar: "الملاك والحيوانات" },
  bookings: { en: "Bookings", ar: "الحجوزات" },
  visits: { en: "Visits", ar: "الزيارات" },
  inventory: { en: "Inventory", ar: "المخزون" },
  finances: { en: "Finances", ar: "المالية" },
  reports: { en: "Reports", ar: "التقارير" },
  navigation: { en: "Navigation", ar: "التنقل" },
  users_management: { en: "Users Management", ar: "إدارة المستخدمين" },
  clinics: { en: "Clinics", ar: "العيادات" },
  visits_cases: { en: "Visits & Cases", ar: "الزيارات والحالات" },
  inventory_drugs: { en: "Inventory & Drugs", ar: "المخزون والأدوية" },
  medical_calculators: { en: "Medical Calculators", ar: "الحاسبات الطبية" },
  analytics_reports: { en: "Analytics & Reports", ar: "التحليلات والتقارير" },
  financial_overview: { en: "Financial Overview", ar: "نظرة عامة مالية" },
  clients: { en: "Clients", ar: "العملاء" },
  switch_to_staff: { en: "Switch to Staff", ar: "التبديل للموظف" },
  switch_to_doctor: { en: "Switch to Doctor", ar: "التبديل للطبيب" },
  sign_out: { en: "Sign Out", ar: "تسجيل الخروج" },
  search: {
    en: "Search patients, appointments...",
    ar: "بحث المرضى، المواعيد...",
  },
  search_anything: { en: "Search anything...", ar: "بحث عن أي شيء..." },
  search_cases: { en: "Search cases...", ar: "بحث في الحالات..." },
  notifications: { en: "Notifications", ar: "التنبيهات" },
  toggle_theme: { en: "Toggle Theme", ar: "تبديل المظهر" },
  settings: { en: "Settings", ar: "الإعدادات" },
  vet_clinic: { en: "Vet Clinic", ar: "عيادة بيطرية" },
  veterinarian: { en: "Veterinarian", ar: "طبيب بيطري" },
  reception: { en: "Reception", ar: "الاستقبال" },
  good_morning: { en: "Good morning", ar: "صباح الخير" },
  welcome_back: { en: "Welcome back,", ar: "أهلاً بعودتك،" },
  reception_desk: { en: "Reception Desk", ar: "مكتب الاستقبال" },
  today: { en: "today", ar: "اليوم" },
  doctors_on_duty: { en: "doctors on duty", ar: "أطباء في الخدمة" },
  simulation: { en: "Simulation", ar: "المحاكاة" },
  exit_sim: { en: "Exit Sim", ar: "إنهاء المحاكاة" },
  new_appointment: { en: "New Appointment", ar: "موعد جديد" },
  on_duty: { en: "On Duty", ar: "في الخدمة" },
  todays_schedule: { en: "Today's Schedule", ar: "جدول اليوم" },
  total: { en: "total", ar: "الإجمالي" },
  check_in: { en: "Check in", ar: "تسجيل دخول" },
  weekly_revenue: { en: "Weekly Revenue", ar: "إيرادات الأسبوع" },
  billing_queue: { en: "Billing Queue", ar: "قائمة الفواتير" },
  inventory_alerts: { en: "Inventory Alerts", ar: "تنبيهات المخزون" },
  stock: { en: "Stock", ar: "المخزون" },
  new_prescription: { en: "New Prescription", ar: "وصفة جديدة" },
  create_prescription: { en: "Create Prescription", ar: "إنشاء وصفة" },
  pharmacy: { en: "Pharmacy", ar: "الصيدلية" },
  active_prescriptions: { en: "active prescriptions", ar: "وصفات نشطة" },
  medications: { en: "Medications", ar: "الأدوية" },
  notes: { en: "Notes", ar: "ملاحظات" },
  case_number: { en: "Case Number", ar: "رقم الحالة" },
  patient: { en: "Patient", ar: "المريض" },
  back: { en: "Back", ar: "رجوع" },
  current_case: { en: "Current Case", ar: "الحالة الحالية" },
  next_case: { en: "Up Next", ar: "التالي" },
  start: { en: "Start", ar: "بدء" },
  complete: { en: "Complete", ar: "إنهاء" },
  completed: { en: "Completed", ar: "مكتمل" },
  waiting: { en: "Waiting", ar: "في الانتظار" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  sim_mode: { en: "Case Tracker", ar: "متتبع الحالات" },
  no_more_cases: { en: "All cases completed!", ar: "تم إنهاء جميع الحالات!" },
  staff_controls: {
    en: "Staff controls the case flow",
    ar: "الموظف يتحكم بسير الحالات",
  },
  doctor_view: {
    en: "Doctor View (Read-only)",
    ar: "عرض الطبيب (للقراءة فقط)",
  },
  clinical_tools: { en: "Clinical Tools", ar: "الأدوات السريرية" },
  drug_dose: { en: "Drug Dose", ar: "جرعة الدواء" },
  fluid_therapy: { en: "Fluid Therapy", ar: "العلاج بالسوائل" },
  cri: { en: "CRI", ar: "CRI" },
  visit_management: { en: "Visit Management", ar: "إدارة الزيارات" },
  visits_history: { en: "Visits & History", ar: "الزيارات والسجل" },
  my_caseload: { en: "My Caseload", ar: "قائمة حالاتي" },
  all_cases: { en: "All Cases", ar: "جميع الحالات" },
  total_cases: { en: "Total Cases", ar: "إجمالي الحالات" },
  last_case: { en: "Last Case", ar: "آخر حالة" },
  no_cases_role: {
    en: "Cases are not available for your role.",
    ar: "الحالات غير متوفرة لدورك.",
  },
  details: { en: "Details", ar: "التفاصيل" },
  case_management: { en: "Case Management", ar: "إدارة الحالات" },
  drug_interaction_check: {
    en: "Drug Interaction Check",
    ar: "فحص تفاعلات الأدوية",
  },
  check_interactions: { en: "Check Interactions", ar: "فحص التفاعلات" },
  no_interactions: { en: "No Known Interaction", ar: "لا تفاعلات معروفة" },
  interaction_detected: {
    en: "Potential Interaction Detected",
    ar: "تم اكتشاف تفاعل محتمل",
  },
  user: { en: "User", ar: "مستخدم" },
  clinic: { en: "Clinic", ar: "عيادة" },
  switch_to_en: { en: "Switch to EN", ar: "Switch to EN" },
  switch_to_ar: { en: "Switch to Arabic", ar: "التبديل إلى العربية" },
  clinic_operations: { en: "Clinic Operations", ar: "عمليات العيادة" },
  staff_dashboard: { en: "Staff Dashboard", ar: "لوحة الموظفين" },
  manage_appointments_prescriptions_and_patient_care: {
    en: "Manage appointments, prescriptions, and patient care.",
    ar: "إدارة المواعيد والوصفات ورعاية المرضى.",
  },
  todays_appointments: { en: "Today's Appointments", ar: "مواعيد اليوم" },
  upcoming_appointments: {
    en: "Upcoming Appointments",
    ar: "المواعيد القادمة",
  },
  pending_prescriptions: { en: "Pending Prescriptions", ar: "الوصفات المعلقة" },
  active_patients: { en: "Active Patients", ar: "المرضى النشطون" },
  staff_priority_summary: {
    en: "Staff Priority Summary",
    ar: "ملخص أولويات الموظفين",
  },
  todays_workload: { en: "Today's Workload", ar: "عبء عمل اليوم" },
  action_required: { en: "Action Required", ar: "إجراء مطلوب" },
  prescriptions_pending: {
    en: "Prescriptions pending",
    ar: "وصفات بانتظار المعالجة",
  },
  inventory_status: { en: "Inventory Status", ar: "حالة المخزون" },
  drugs_low: { en: "Drugs low", ar: "أدوية منخفضة" },
  stock_healthy: { en: "Stock healthy", ar: "المخزون جيد" },
  data_source_summary: {
    en: "Data is sourced from appointments, prescriptions, visits, pets, and drugs.",
    ar: "يتم جلب البيانات من المواعيد والوصفات والزيارات والحيوانات الأليفة والأدوية.",
  },
  pending_prescriptions_alert: {
    en: "You have pending prescriptions awaiting processing. Please review and update their status.",
    ar: "لديك وصفات معلقة بانتظار المعالجة. يرجى مراجعتها وتحديث حالتها.",
  },
  low_drug_stock: { en: "Low Drug Stock", ar: "انخفاض مخزون الأدوية" },
  low_stock_alert: {
    en: "Drugs are running low on stock. Consider ordering more supplies.",
    ar: "مخزون بعض الأدوية منخفض. يُرجى التفكير في طلب مزيد من الإمدادات.",
  },
  simulation_mode: { en: "Simulation Mode", ar: "وضع المحاكاة" },
  staff_controls_short: { en: "Staff Controls", ar: "تحكم الموظف" },
  doctor_view_short: { en: "Doctor View", ar: "عرض الطبيب" },
  no_active_cases: { en: "No active cases", ar: "لا توجد حالات نشطة" },
  waiting_for_confirmed_appointments: {
    en: "Waiting for confirmed appointments to appear in the queue",
    ar: "بانتظار ظهور المواعيد المؤكدة في قائمة الانتظار",
  },
  next_case_label: { en: "Next Case", ar: "الحالة التالية" },
  create_visit: { en: "Create Visit", ar: "إنشاء زيارة" },
  prescribe: { en: "Prescribe", ar: "وصف" },
  visit_notes: { en: "Visit Notes", ar: "ملاحظات الزيارة" },
  enter_visit_notes: {
    en: "Enter visit notes...",
    ar: "أدخل ملاحظات الزيارة...",
  },
  cancel: { en: "Cancel", ar: "إلغاء" },
  creating: { en: "Creating...", ar: "جاري الإنشاء..." },
  prescribe_medication: { en: "Prescribe Medication", ar: "وصف دواء" },
  drug: { en: "Drug", ar: "الدواء" },
  select_a_drug: { en: "Select a drug...", ar: "اختر دواء..." },
  dosage: { en: "Dosage", ar: "الجرعة" },
  dosage_example: { en: "e.g., 5mg twice daily", ar: "مثال: 5mg مرتين يومياً" },
  prescribing: { en: "Prescribing...", ar: "جاري الوصف..." },
  unknown_pet: { en: "Unknown Pet", ar: "حيوان غير معروف" },
  mixed: { en: "Mixed", ar: "مختلط" },
  unknown_owner: { en: "Unknown Owner", ar: "مالك غير معروف" },
  regular_checkup: { en: "Regular checkup", ar: "فحص دوري" },
  doctor_assigned: { en: "Dr. Assigned", ar: "الطبيب المكلّف" },
  visit_created_from_simulation_mode: {
    en: "Visit created from simulation mode",
    ar: "تم إنشاء الزيارة من وضع المحاكاة",
  },
  normal: { en: "Normal", ar: "عادي" },
  urgent: { en: "Urgent", ar: "عاجل" },
  emergency: { en: "Emergency", ar: "طارئ" },
  clinic_performance: { en: "Clinic Performance", ar: "أداء العيادة" },
  owner_dashboard: { en: "Owner Dashboard", ar: "لوحة المالك" },
  track_revenue_appointments_and_overall_clinic_health: {
    en: "Track revenue, appointments, and overall clinic health.",
    ar: "تتبّع الإيرادات والمواعيد والصحة العامة للعيادة.",
  },
  active_clients: { en: "Active Clients", ar: "العملاء النشطون" },
  registered_pets: { en: "Registered Pets", ar: "الحيوانات المسجلة" },
  clinic_snapshot: { en: "Clinic Snapshot", ar: "لمحة عن العيادة" },
  visit_activity_this_month: {
    en: "Visit Activity (This Month)",
    ar: "نشاط الزيارات (هذا الشهر)",
  },
  appointment_completion: {
    en: "Appointment Completion",
    ar: "إتمام المواعيد",
  },
  care_team_online: { en: "Care Team Online", ar: "طاقم الرعاية المتاح" },
  doctors: { en: "doctors", ar: "أطباء" },
  staff: { en: "staff", ar: "موظفون" },
  owner_data_source_summary: {
    en: "Data is sourced from users, pets, appointments, prescriptions, and visits.",
    ar: "يتم جلب البيانات من المستخدمين والحيوانات والمواعيد والوصفات والزيارات.",
  },
  system_overview: { en: "System Overview", ar: "نظرة عامة على النظام" },
  admin_dashboard: { en: "Admin Dashboard", ar: "لوحة المدير" },
  manage_clinics_users_and_platform_settings: {
    en: "Manage clinics, users, and platform settings.",
    ar: "إدارة العيادات والمستخدمين وإعدادات المنصة.",
  },
  total_clinics: { en: "Total Clinics", ar: "إجمالي العيادات" },
  active_subscriptions: { en: "Active Subscriptions", ar: "الاشتراكات النشطة" },
  platform_uptime: { en: "Platform Uptime", ar: "جاهزية المنصة" },
  system_alerts: { en: "System Alerts", ar: "تنبيهات النظام" },
  admin_module_placeholder: {
    en: "Admin Module (Placeholder)",
    ar: "وحدة المدير (تجريبية)",
  },
  admin_features_coming: {
    en: "More administrative features will be implemented here.",
    ar: "سيتم إضافة المزيد من ميزات الإدارة هنا.",
  },
  my_pets: { en: "My Pets", ar: "حيواناتي" },
  client_portal: { en: "Client Portal", ar: "بوابة العميل" },
  manage_your_pets_appointments_and_records: {
    en: "Manage your pets, appointments, and records.",
    ar: "إدارة حيواناتك ومواعيدك وسجلاتك.",
  },
  upcoming_appts: { en: "Upcoming Appts", ar: "مواعيد قادمة" },
  medical_records: { en: "Medical Records", ar: "السجلات الطبية" },
  client_module_placeholder: {
    en: "Client Module (Placeholder)",
    ar: "وحدة العميل (تجريبية)",
  },
  client_features_coming: {
    en: "Pet profiles, vaccination history, and appointment booking will be implemented here.",
    ar: "سيتم إضافة ملفات الحيوانات وسجل التطعيمات وحجز المواعيد هنا.",
  },
  scheduling: { en: "Scheduling", ar: "الجدولة" },
  pending_confirmations: { en: "pending confirmations", ar: "تأكيدات معلقة" },
  all: { en: "all", ar: "الكل" },
  confirmed: { en: "confirmed", ar: "مؤكد" },
  cancelled: { en: "cancelled", ar: "ملغي" },
  confirm: { en: "Confirm", ar: "تأكيد" },
  clinical_decision_support: {
    en: "Clinical Decision Support",
    ar: "دعم القرار السريري",
  },
  medical_calculators_title: {
    en: "Medical Calculators",
    ar: "الحاسبات الطبية",
  },
  calculators_description: {
    en: "Access specialized veterinary tools for precise clinical calculations and treatment planning.",
    ar: "الوصول إلى أدوات بيطرية متخصصة لحسابات سريرية دقيقة وتخطيط العلاج.",
  },
  open_calculator: { en: "Open Calculator", ar: "فتح الحاسبة" },
  intelligence_unit: { en: "Intelligence Unit", ar: "وحدة التحليلات" },
  analytics_and_reports_title: {
    en: "Analytics & Reports",
    ar: "التحليلات والتقارير",
  },
  reports_description: {
    en: "Strategic overview of clinic growth, revenue trends and patient demographics.",
    ar: "نظرة استراتيجية على نمو العيادة واتجاهات الإيرادات وتركيبة المرضى.",
  },
  custom_filter: { en: "Custom Filter", ar: "تصفية مخصصة" },
  export_data: { en: "Export Data", ar: "تصدير البيانات" },
  failed_load_dashboard_data: {
    en: "Failed to load dashboard data.",
    ar: "فشل تحميل بيانات لوحة التحكم.",
  },
  retry_persist_issue_refresh: {
    en: "Please retry. If the issue persists, refresh the page.",
    ar: "يرجى المحاولة مرة أخرى. إذا استمرت المشكلة، حدّث الصفحة.",
  },
  retry: { en: "Retry", ar: "إعادة المحاولة" },
  global_network: { en: "Global Network", ar: "الشبكة العامة" },
  clinic_management: { en: "Clinic Management", ar: "إدارة العيادات" },
  manage_clinic_network: {
    en: "Manage your veterinary clinic network, locations, and settings.",
    ar: "إدارة شبكة عياداتك البيطرية والمواقع والإعدادات.",
  },
  add_new_clinic: { en: "Add New Clinic", ar: "إضافة عيادة جديدة" },
  search_clinics: {
    en: "Search by clinic name or location...",
    ar: "ابحث باسم العيادة أو الموقع...",
  },
  status: { en: "Status", ar: "الحالة" },
  all_statuses: { en: "All Statuses", ar: "كل الحالات" },
  active: { en: "Active", ar: "نشط" },
  pending: { en: "Pending", ar: "معلق" },
  clinic_info: { en: "Clinic Info", ar: "بيانات العيادة" },
  location: { en: "Location", ar: "الموقع" },
  owner: { en: "Owner", ar: "المالك" },
  loading_clinics: { en: "Loading clinics...", ar: "جاري تحميل العيادات..." },
  no_clinics_found: {
    en: "No clinics active context.",
    ar: "لا توجد عيادات حالياً.",
  },
  clinic_settings: { en: "Clinic Settings", ar: "إعدادات العيادة" },
  configure_details: { en: "Configure Details", ar: "تهيئة التفاصيل" },
  delete_clinic: { en: "Delete Clinic", ar: "حذف العيادة" },
  confirm_delete_clinic: {
    en: "Are you sure you want to delete this clinic?",
    ar: "هل أنت متأكد من حذف هذه العيادة؟",
  },
  no_owner_assigned: { en: "No Owner Assigned", ar: "لا يوجد مالك مخصص" },
  update_clinic_details: {
    en: "Update Clinic Details",
    ar: "تحديث بيانات العيادة",
  },
  register_branch: { en: "Register Branch", ar: "تسجيل فرع" },
  connect_new_branch: {
    en: "Connect a new veterinary branch to the Vetrix network.",
    ar: "ربط فرع بيطري جديد بشبكة Vetrix.",
  },
  saving: { en: "Saving...", ar: "جاري الحفظ..." },
  save_settings: { en: "Save Settings", ar: "حفظ الإعدادات" },
  register_clinic: { en: "Register Clinic", ar: "تسجيل العيادة" },
  clinic_name: { en: "Clinic Name", ar: "اسم العيادة" },
  address: { en: "Address", ar: "العنوان" },
  phone: { en: "Phone", ar: "الهاتف" },
  subscription: { en: "Subscription", ar: "الاشتراك" },
  central_vet: { en: "Central Vet", ar: "العيادة المركزية" },
  city_country: { en: "City, Country", ar: "المدينة، الدولة" },
  trial: { en: "Trial", ar: "تجريبي" },
  expired: { en: "Expired", ar: "منتهي" },
  user_management: { en: "User Management", ar: "إدارة المستخدمين" },
  manage_staff_and_doctors: {
    en: "Manage your clinic staff, doctors, and administrators.",
    ar: "إدارة طاقم العيادة والأطباء والمشرفين.",
  },
  add_new_user: { en: "Add New User", ar: "إضافة مستخدم جديد" },
  search_users: {
    en: "Search by name or email...",
    ar: "ابحث بالاسم أو البريد الإلكتروني...",
  },
  filter_by_role: { en: "Filter by Role", ar: "تصفية حسب الدور" },
  all_roles: { en: "All Roles", ar: "كل الأدوار" },
  loading_users: { en: "Loading users...", ar: "جاري تحميل المستخدمين..." },
  no_users_found: { en: "No users found.", ar: "لا يوجد مستخدمون." },
  user_info: { en: "User Info", ar: "بيانات المستخدم" },
  role: { en: "Role", ar: "الدور" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  actions: { en: "Actions", ar: "الإجراءات" },
  edit_profile: { en: "Edit Profile", ar: "تعديل الملف" },
  show_password: { en: "Show Password", ar: "عرض كلمة المرور" },
  deactivate: { en: "Deactivate", ar: "تعطيل" },
  delete_user: { en: "Delete User", ar: "حذف المستخدم" },
  confirm_delete_user: {
    en: "Are you sure you want to deactivate or delete this user?",
    ar: "هل أنت متأكد من تعطيل أو حذف هذا المستخدم؟",
  },
  global: { en: "Global", ar: "عام" },
  unknown_clinic: { en: "Unknown Clinic", ar: "عيادة غير معروفة" },
  doctor: { en: "Doctor", ar: "طبيب" },
  password: { en: "Password", ar: "كلمة المرور" },
  done: { en: "Done", ar: "تم" },
  unassigned_global: { en: "Unassigned / Global", ar: "غير مخصص / عام" },
  user_updated_success: {
    en: "User updated successfully.",
    ar: "تم تحديث المستخدم بنجاح.",
  },
  user_update_failed: {
    en: "Failed to update user. Please try again.",
    ar: "فشل تحديث المستخدم. يرجى المحاولة مرة أخرى.",
  },
  user_created_success: {
    en: "User created successfully.",
    ar: "تم إنشاء المستخدم بنجاح.",
  },
  user_create_failed: {
    en: "Failed to create user. Please try again.",
    ar: "فشل إنشاء المستخدم. يرجى المحاولة مرة أخرى.",
  },
  user_deactivated_success: {
    en: "User deactivated successfully.",
    ar: "تم تعطيل المستخدم بنجاح.",
  },
  user_deactivate_failed: {
    en: "Failed to deactivate user. Please try again.",
    ar: "فشل تعطيل المستخدم. يرجى المحاولة مرة أخرى.",
  },
  password_loaded_success: {
    en: "Password loaded successfully.",
    ar: "تم تحميل كلمة المرور بنجاح.",
  },
  password_load_failed: {
    en: "Failed to load password. Please try again.",
    ar: "فشل تحميل كلمة المرور. يرجى المحاولة مرة أخرى.",
  },
  modifying_profile_for: {
    en: "Modifying profile for",
    ar: "تعديل الملف الشخصي لـ",
  },
  invite_new_staff: {
    en: "Invite a new staff member to the platform.",
    ar: "دعوة عضو جديد من الطاقم إلى المنصة.",
  },
  user_created_title: {
    en: "User Created Successfully!",
    ar: "تم إنشاء المستخدم بنجاح!",
  },
  save_credentials_notice: {
    en: "Save these credentials now. The password is shown only here.",
    ar: "احفظ بيانات الدخول الآن. كلمة المرور تظهر هنا فقط.",
  },
  generated_email: { en: "Generated Email", ar: "البريد الإلكتروني المُنشأ" },
  generated_password: { en: "Generated Password", ar: "كلمة المرور المُنشأة" },
  name_label: { en: "Name:", ar: "الاسم:" },
  role_label: { en: "Role:", ar: "الدور:" },
  phone_label: { en: "Phone:", ar: "الهاتف:" },
  email_label: { en: "Email:", ar: "البريد الإلكتروني:" },
  current_password_title: { en: "Current Password", ar: "كلمة المرور الحالية" },
  current_password_description: {
    en: "Here's the current password for this user.",
    ar: "هذه هي كلمة المرور الحالية لهذا المستخدم.",
  },
  configuring_settings_for: {
    en: "Configuring settings for",
    ar: "تهيئة الإعدادات لـ",
  },
  patient_portal: { en: "Patient Portal", ar: "بوابة المرضى" },
  patient_records: { en: "Patient Records", ar: "سجلات المرضى" },
  manage_patient_records: {
    en: "Manage patient records, owner information, and clinical history.",
    ar: "إدارة سجلات المرضى ومعلومات المالك والسجل السريري.",
  },
  add_new_patient: { en: "Add New Patient", ar: "إضافة مريض جديد" },
  search_patients: {
    en: "Search by pet name, breed or owner...",
    ar: "ابحث باسم الحيوان أو السلالة أو المالك...",
  },
  species: { en: "Species", ar: "النوع" },
  all_species: { en: "All Species", ar: "كل الأنواع" },
  dogs: { en: "Dogs", ar: "كلاب" },
  cats: { en: "Cats", ar: "قطط" },
  other: { en: "Other", ar: "أخرى" },
  patient_and_owner: { en: "Patient & Owner", ar: "المريض والمالك" },
  contact_info: { en: "Contact info", ar: "بيانات التواصل" },
  loading_patients: { en: "Loading patients...", ar: "جاري تحميل المرضى..." },
  no_patients_found: {
    en: "No patients found. Add one to get started.",
    ar: "لا يوجد مرضى. أضف مريضًا للبدء.",
  },
  weight: { en: "Weight", ar: "الوزن" },
  patient_actions: { en: "Patient Actions", ar: "إجراءات المريض" },
  delete_record: { en: "Delete Record", ar: "حذف السجل" },
  update_patient_profile: {
    en: "Update Patient Profile",
    ar: "تحديث ملف المريض",
  },
  register_new_patient: { en: "Register New Patient", ar: "تسجيل مريض جديد" },
  modifying_clinical_records_for: {
    en: "Modifying clinical records for",
    ar: "تعديل السجلات السريرية لـ",
  },
  enter_patient_details: {
    en: "Enter patient details and link them to an existing clinical owner.",
    ar: "أدخل بيانات المريض واربطه بمالك سريري موجود.",
  },
  save_profile: { en: "Save Profile", ar: "حفظ الملف" },
  register_patient: { en: "Register Patient", ar: "تسجيل المريض" },
  assigned_clinical_owner: {
    en: "Assigned Clinical Owner *",
    ar: "المالك السريري المخصص *",
  },
  search_or_select_client: {
    en: "Search or Select Client",
    ar: "ابحث أو اختر عميلًا",
  },
  register_clients_in_owners: {
    en: 'Register new clients in the "Owners" section',
    ar: 'سجّل عملاء جدد في قسم "الملاك"',
  },
  patient_identity: { en: "Patient Identity", ar: "هوية المريض" },
  patient_name_placeholder: { en: "Patient name...", ar: "اسم المريض..." },
  species_type: { en: "Species Type", ar: "نوع الحيوان" },
  dog: { en: "Dog", ar: "كلب" },
  cat: { en: "Cat", ar: "قط" },
  weight_kg: { en: "Weight (KG)", ar: "الوزن (كجم)" },
  weight_example: { en: "10.5", ar: "10.5" },
  confirm_delete_patient: {
    en: "Are you sure you want to delete this patient?",
    ar: "هل أنت متأكد من حذف هذا المريض؟",
  },
  no_phone: { en: "No Phone", ar: "لا يوجد هاتف" },
  client_created_success: {
    en: "Client created successfully.",
    ar: "تم إنشاء العميل بنجاح.",
  },
  client_create_failed: {
    en: "Failed to create client. Please try again.",
    ar: "فشل إنشاء العميل. يرجى المحاولة مرة أخرى.",
  },
  pet_added_success: {
    en: "Pet added successfully.",
    ar: "تمت إضافة الحيوان بنجاح.",
  },
  pet_add_failed: {
    en: "Failed to add pet. Please try again.",
    ar: "فشلت إضافة الحيوان. يرجى المحاولة مرة أخرى.",
  },
  confirm_delete_client: {
    en: "Are you sure you want to deactivate or remove this client?",
    ar: "هل أنت متأكد من تعطيل أو إزالة هذا العميل؟",
  },
  client_deactivated_success: {
    en: "Client deactivated successfully.",
    ar: "تم تعطيل العميل بنجاح.",
  },
  client_deactivate_failed: {
    en: "Failed to deactivate client. Please try again.",
    ar: "فشل تعطيل العميل. يرجى المحاولة مرة أخرى.",
  },
  clinical_network: { en: "Clinical Network", ar: "الشبكة السريرية" },
  client_management: { en: "Client Management", ar: "إدارة العملاء" },
  registered_owners: { en: "registered owners", ar: "ملاك مسجلون" },
  new_owner: { en: "New Owner", ar: "مالك جديد" },
  search_owners: { en: "Search owners...", ar: "ابحث عن الملاك..." },
  create_owner_profile: { en: "Create Owner Profile", ar: "إنشاء ملف مالك" },
  register_clinical_owner: {
    en: "Register a new clinical owner to the system.",
    ar: "تسجيل مالك سريري جديد في النظام.",
  },
  create_owner: { en: "Create Owner", ar: "إنشاء مالك" },
  full_name_required: { en: "Full Name *", ar: "الاسم الكامل *" },
  add_new_pet: { en: "Add New Pet", ar: "إضافة حيوان جديد" },
  registering: { en: "Registering...", ar: "جاري التسجيل..." },
  register_pet: { en: "Register Pet", ar: "تسجيل الحيوان" },
  pet_name_required: { en: "Pet Name *", ar: "اسم الحيوان *" },
  loading_clients: { en: "Loading clients...", ar: "جاري تحميل العملاء..." },
  no_clients_found: {
    en: "No clients found. Add one to get started.",
    ar: "لا يوجد عملاء. أضف واحدًا للبدء.",
  },
  pets: { en: "pets", ar: "حيوانات" },
  no_address_in_model: {
    en: "No address in model",
    ar: "لا يوجد عنوان في النموذج",
  },
  add_pet: { en: "Add Pet", ar: "إضافة حيوان" },
  no_pets_registered: { en: "No pets registered", ar: "لا توجد حيوانات مسجلة" },
  remove_owner: { en: "Remove Owner", ar: "إزالة المالك" },
  client_created_title: {
    en: "Client Created Successfully!",
    ar: "تم إنشاء العميل بنجاح!",
  },

  // ─── Sidebar ───────────────────────────────────────────────────────
  medical_portal: { en: "Medical Portal", ar: "البوابة الطبية" },
  management_portal: { en: "Management Portal", ar: "بوابة الإدارة" },
  online: { en: "Online", ar: "متصل" },
  signing_out: { en: "Signing out", ar: "جاري الخروج" },

  // ─── Doctor Dashboard ──────────────────────────────────────────────
  welcome: { en: "Welcome", ar: "أهلاً وسهلاً" },
  hello: { en: "Hello", ar: "مرحباً" },
  confirmed_stat: { en: "Confirmed", ar: "المؤكدة" },
  pending_stat: { en: "Pending", ar: "قيد الانتظار" },
  todays_patients: { en: "Today's Patients", ar: "مرضى اليوم" },
  total_stat: { en: "Total", ar: "الإجمالي" },
  todays_appointments_title: {
    en: "Today's Appointments",
    ar: "مواعيد اليوم",
  },
  on_duty_status: { en: "On Duty", ar: "متصل" },
  no_appointments_today: {
    en: "No appointments today",
    ar: "لا توجد مواعيد لهذا اليوم",
  },
  scheduled: { en: "Scheduled", ar: "مجدول" },
  appointments_scheduled_today: {
    en: "appointments scheduled today",
    ar: "موعد مجدول لهذا اليوم",
  },
  exit_simulation: { en: "Exit Sim", ar: "خروج" },
  simulation_label: { en: "Simulation", ar: "محاكاة" },
  quick_actions: { en: "Quick Actions", ar: "إجراءات سريعة" },
  case_distribution: { en: "Case Distribution", ar: "توزيع الحالات" },
  visit_trends: { en: "Visit Trends", ar: "اتجاهات الزيارات" },
  add_patient: { en: "Add Patient", ar: "إضافة مريض" },
  new_appt: { en: "New Appt", ar: "موعد جديد" },
  prescription: { en: "Prescription", ar: "وصفة" },
  consultation: { en: "Consultation", ar: "استشارة" },

  // ─── Appointments Page ─────────────────────────────────────────────
  scheduling_portal: { en: "Scheduling Portal", ar: "بوابة الجدولة" },
  bookings_and_appointments: {
    en: "Bookings & Appointments",
    ar: "الحجوزات والمواعيد",
  },
  manage_daily_schedule: {
    en: "Manage your daily clinic schedule, patient arrivals and availability.",
    ar: "إدارة الجدول اليومي للعيادة ووصول المرضى والتوافر.",
  },
  book_appointment: { en: "Book Appointment", ar: "حجز موعد" },
  search_appointments: {
    en: "Search by ID, pet or owner...",
    ar: "بحث بالمعرف أو الحيوان أو المالك...",
  },
  all_statuses_filter: { en: "All Statuses", ar: "كل الحالات" },
  schedule_id_pet: { en: "Schedule ID & Pet", ar: "معرف الجدول والحيوان" },
  loading_appointments: {
    en: "Loading appointments...",
    ar: "جاري تحميل المواعيد...",
  },
  no_appointments_found: {
    en: "No appointments found.",
    ar: "لم يتم العثور على مواعيد.",
  },
  operations: { en: "Operations", ar: "العمليات" },
  check_in_patient: { en: "Check In Patient", ar: "تسجيل دخول المريض" },
  cancel_appointment: { en: "Cancel", ar: "إلغاء" },
  book_appointment_title: { en: "Book Appointment", ar: "حجز موعد" },
  schedule_new_session: {
    en: "Schedule a new clinical session for a patient.",
    ar: "جدولة جلسة سريرية جديدة لمريض.",
  },
  client_owner: { en: "Client Owner", ar: "المالك العميل" },
  select_client: { en: "Select Client", ar: "اختر العميل" },
  select_pet_label: { en: "Select Pet", ar: "اختر الحيوان" },
  select_pet_choose_client: {
    en: "Select Pet (Choose Client First)",
    ar: "اختر الحيوان (اختر العميل أولاً)",
  },
  booking: { en: "Booking...", ar: "جاري الحجز..." },
  confirm_booking: { en: "Confirm Booking", ar: "تأكيد الحجز" },

  // ─── Cases Page ────────────────────────────────────────────────────
  clinical_tracker: { en: "Clinical Tracker", ar: "المتتبع السريري" },
  visits_and_cases_title: { en: "Visits & Cases", ar: "الزيارات والحالات" },
  monitor_cases: {
    en: "Monitor ongoing clinical cases, visit history and medical progress.",
    ar: "متابعة الحالات السريرية الجارية وسجل الزيارات والتقدم الطبي.",
  },
  create_new_case: { en: "Create New Case", ar: "إنشاء حالة جديدة" },
  search_cases_page: {
    en: "Search by case ID, patient or reason...",
    ar: "بحث بمعرف الحالة أو المريض أو السبب...",
  },
  case_id_patient: { en: "Case ID & Patient", ar: "معرف الحالة والمريض" },
  reason_doctor: { en: "Reason & Doctor", ar: "السبب والطبيب" },
  visit_date: { en: "Visit Date", ar: "تاريخ الزيارة" },
  no_cases_found: { en: "No cases found.", ar: "لم يتم العثور على حالات." },
  case_operations: { en: "Case Operations", ar: "عمليات الحالة" },
  clinical_notes: { en: "Clinical Notes", ar: "ملاحظات سريرية" },
  mark_completed: { en: "Mark Completed", ar: "تحديد كمكتمل" },
  update_clinical_case: {
    en: "Update Clinical Case",
    ar: "تحديث الحالة السريرية",
  },
  register_visit: { en: "Register Visit", ar: "تسجيل زيارة" },
  provide_diagnosis: {
    en: "Provide initial diagnosis and assignment for the clinical visit.",
    ar: "تقديم التشخيص الأولي والتعيين للزيارة السريرية.",
  },
  updating_records: { en: "Updating records for case", ar: "تحديث سجلات الحالة" },
  save_case_profile: { en: "Save Case Profile", ar: "حفظ ملف الحالة" },
  open_case: { en: "Open Case", ar: "فتح حالة" },
  pet_id_label: { en: "Pet ID", ar: "معرف الحيوان" },
  client_id_label: { en: "Client ID", ar: "معرف العميل" },
  doctor_id_label: { en: "Doctor ID", ar: "معرف الطبيب" },
  prescription_id_label: { en: "Prescription ID", ar: "معرف الوصفة" },
  all_doctors: { en: "All Doctors", ar: "كل الأطباء" },
  assigned_label: { en: "Assigned:", ar: "المكلّف:" },
  owner_label: { en: "Owner:", ar: "المالك:" },

  // ─── Prescriptions Page ────────────────────────────────────────────
  pharmacy_portal: { en: "Pharmacy Portal", ar: "بوابة الصيدلية" },
  medical_prescriptions: { en: "Medical Prescriptions", ar: "الوصفات الطبية" },
  review_medication_history: {
    en: "Review patient medication history and issue new clinical prescriptions.",
    ar: "مراجعة سجل أدوية المريض وإصدار وصفات سريرية جديدة.",
  },
  new_prescription_btn: { en: "New Prescription", ar: "وصفة جديدة" },
  search_prescriptions: {
    en: "Search by Rx ID, patient or medication...",
    ar: "بحث بمعرف الوصفة أو المريض أو الدواء...",
  },
  all_prescriptions: { en: "All Prescriptions", ar: "كل الوصفات" },
  rx_id_patient: { en: "Rx ID & Patient", ar: "معرف الوصفة والمريض" },
  primary_medication: { en: "Primary Medication", ar: "الدواء الأساسي" },
  loading_prescriptions_text: {
    en: "Loading prescriptions...",
    ar: "جاري تحميل الوصفات...",
  },
  no_prescriptions_found: {
    en: "No prescriptions found.",
    ar: "لم يتم العثور على وصفات.",
  },
  pharmacy_actions: { en: "Pharmacy Actions", ar: "إجراءات الصيدلية" },
  export_pdf: { en: "Export PDF", ar: "تصدير PDF" },
  revoke: { en: "Revoke", ar: "إلغاء" },
  issue_prescription: { en: "Issue Prescription", ar: "إصدار وصفة" },
  select_formulation: {
    en: "Select a patient and formulation to generate a clinical prescription.",
    ar: "اختر مريضاً وتركيبة لإنشاء وصفة سريرية.",
  },
  generating: { en: "Generating...", ar: "جاري الإنشاء..." },
  generate_rx: { en: "Generate Rx", ar: "إنشاء الوصفة" },
  medication_formulation: {
    en: "Medication Formulation",
    ar: "تركيبة الدواء",
  },
  select_existing_formulation: {
    en: "Select Existing Formulation",
    ar: "اختر تركيبة موجودة",
  },
  define_drugs_notice: {
    en: "Please define new drugs/formulations in the inventory manager.",
    ar: "يرجى تحديد الأدوية/التركيبات الجديدة في مدير المخزون.",
  },

  // ─── Visits Page ───────────────────────────────────────────────────
  total_recorded_visits: {
    en: "total recorded visits",
    ar: "إجمالي الزيارات المسجلة",
  },
  loading_visits: {
    en: "Loading visits data...",
    ar: "جاري تحميل بيانات الزيارات...",
  },
  no_visits_found: { en: "No visits found.", ar: "لم يتم العثور على زيارات." },
  completed_status: { en: "Completed", ar: "مكتمل" },
  clinical_visit: { en: "Clinical Visit", ar: "زيارة سريرية" },
  no_date_recorded: { en: "No date recorded", ar: "لا يوجد تاريخ مسجل" },
  details_btn: { en: "Details", ar: "التفاصيل" },
  visit_id_label: { en: "Visit ID:", ar: "معرف الزيارة:" },
  clinical_record_overview: {
    en: "Clinical Record Overview",
    ar: "نظرة عامة على السجل السريري",
  },
  date_label: { en: "Date", ar: "التاريخ" },
  time_label: { en: "Time", ar: "الوقت" },
  anytime: { en: "Anytime", ar: "في أي وقت" },
  doctor_label: { en: "Doctor", ar: "الطبيب" },
  status_label: { en: "Status", ar: "الحالة" },
  clinical_notes_report: {
    en: "Clinical Notes / Report",
    ar: "ملاحظات سريرية / تقرير",
  },
  no_clinical_notes: {
    en: "No additional clinical notes recorded for this visit session.",
    ar: "لا توجد ملاحظات سريرية إضافية مسجلة لهذه الجلسة.",
  },
  prescribed_medicine: { en: "Prescribed Medicine", ar: "الأدوية الموصوفة" },

  // ─── Drugs Page ────────────────────────────────────────────────────
  drug_formulary: { en: "Drug Formulary", ar: "دليل الأدوية" },
  drug_formulary_title: {
    en: "Drug Formulary",
    ar: "دليل الأدوية",
  },
  search_drugs: {
    en: "Search by name, class or indication...",
    ar: "بحث بالاسم أو الفئة أو الاستطباب...",
  },
  add_new_drug: { en: "Add New Drug", ar: "إضافة دواء جديد" },
  edit_drug: { en: "Edit Drug", ar: "تعديل الدواء" },
  delete_drug: { en: "Delete", ar: "حذف" },
  drug_name: { en: "Drug Name", ar: "اسم الدواء" },
  drug_class: { en: "Drug Class", ar: "فئة الدواء" },
  indications_label: { en: "Indications", ar: "الاستطبابات" },
  side_effects: { en: "Side Effects", ar: "الآثار الجانبية" },
  contraindications_label: { en: "Contraindications", ar: "موانع الاستعمال" },
  drug_interactions_label: { en: "Drug Interactions", ar: "تفاعلات الأدوية" },
  dosage_guidelines: { en: "Dosage Guidelines", ar: "إرشادات الجرعات" },
  toxicity_information: { en: "Toxicity Information", ar: "معلومات السمية" },
  clinic_assignment: { en: "Clinic Assignment", ar: "تعيين العيادة" },
  global_visible: {
    en: "Global (visible to all)",
    ar: "عام (مرئي للجميع)",
  },
  save_changes: { en: "Save Changes", ar: "حفظ التغييرات" },
  add_drug: { en: "Add Drug", ar: "إضافة دواء" },
  saving_ellipsis: { en: "Saving…", ar: "جاري الحفظ…" },
  no_indications: { en: "No indications listed", ar: "لا توجد استطبابات مدرجة" },
  manageable_label: { en: "manageable", ar: "قابل للإدارة" },
  read_only_other_clinic: {
    en: "This drug belongs to another clinic — read only.",
    ar: "هذا الدواء ينتمي لعيادة أخرى — للقراءة فقط.",
  },
  global_contact_admin: {
    en: "Global drug — contact admin to modify.",
    ar: "دواء عام — تواصل مع المدير للتعديل.",
  },
  separate_with_commas: {
    en: "Separate multiple entries with commas",
    ar: "افصل بين الإدخالات المتعددة بفواصل",
  },
  admin_only: { en: "Admin Only", ar: "المدير فقط" },
  leave_global_hint: {
    en: "Leave as Global to make this drug visible across all clinics.",
    ar: "اتركه كعام لجعل الدواء مرئياً لكل العيادات.",
  },
  dosage_dog: { en: "Dosage (Dog)", ar: "الجرعة (كلب)" },
  dosage_cat: { en: "Dosage (Cat)", ar: "الجرعة (قط)" },
  toxicity_dog: { en: "Toxicity (Dog)", ar: "السمية (كلب)" },
  toxicity_cat: { en: "Toxicity (Cat)", ar: "السمية (قط)" },
  toxicity_severity_dog: {
    en: "Toxicity Severity (Dog)",
    ar: "شدة السمية (كلب)",
  },
  toxicity_severity_cat: {
    en: "Toxicity Severity (Cat)",
    ar: "شدة السمية (قط)",
  },
  select_severity: { en: "Select severity", ar: "اختر الشدة" },
  high: { en: "High", ar: "عالية" },
  medium: { en: "Medium", ar: "متوسطة" },
  low: { en: "Low", ar: "منخفضة" },
  no_risk: { en: "No Risk", ar: "لا خطر" },
  bulk_import_json: { en: "Bulk Import JSON", ar: "استيراد JSON جماعي" },
  drugs_label: { en: "Drugs", ar: "الأدوية" },
  formulary_desc: {
    en: "Manage your veterinary drug formulary, interactions and dosage guidelines.",
    ar: "إدارة دليل الأدوية البيطرية والتفاعلات وإرشادات الجرعات.",
  },

  // ─── Client Dashboard ─────────────────────────────────────────────
  case_tracker: { en: "Case Tracker", ar: "متتبع الحالات" },
  your_queue_position: { en: "Your Queue Position", ar: "موقعك في قائمة الانتظار" },
  current_case_order: { en: "Current Case Order", ar: "ترتيب الحالة الحالية" },
  no_active_appointments: {
    en: "No active appointments",
    ar: "لا توجد مواعيد نشطة",
  },
  waiting_for_your_turn: {
    en: "Waiting for your turn in the queue",
    ar: "بانتظار دورك في قائمة الانتظار",
  },
  your_appointment: { en: "Your Appointment", ar: "موعدك" },
  position_in_queue: { en: "Position in queue", ar: "الموقع في القائمة" },
  of_total: { en: "of", ar: "من" },

  // ─── Common page labels ────────────────────────────────────────────
  today_filter: { en: "Today", ar: "اليوم" },
  this_week: { en: "This Week", ar: "هذا الأسبوع" },
  this_month: { en: "This Month", ar: "هذا الشهر" },
  all_time: { en: "All Time", ar: "كل الأوقات" },
  delete_record_btn: { en: "Delete Record", ar: "حذف السجل" },

  // ─── Drugs Page — extended ─────────────────────────────────────────
  pharmacology: { en: "Pharmacology", ar: "علم الأدوية" },
  total_stat_label: { en: "Total", ar: "الإجمالي" },
  scope_all: { en: "All", ar: "الكل" },
  scope_global: { en: "Global", ar: "عام" },
  scope_clinic: { en: "Clinic", ar: "عيادة" },
  json_shape_example: {
    en: "Expected JSON Shape Example:",
    ar: "مثال على الشكل المتوقع لـ JSON:",
  },
  json_payload: { en: "JSON Payload", ar: "حمولة JSON" },
  import_drugs_json: {
    en: "Import Drugs via JSON",
    ar: "استيراد الأدوية عبر JSON",
  },
  import_drugs_desc: {
    en: "Paste a standard JSON array of drug objects to import in bulk.",
    ar: "الصق مصفوفة JSON قياسية من كائنات أدوية للاستيراد الجماعي.",
  },
  error_parsing_payload: {
    en: "Error parsing payload",
    ar: "خطأ في تحليل البيانات",
  },
  importing_drugs: { en: "Importing Drugs...", ar: "جاري استيراد الأدوية..." },
  start_import: { en: "Start Import", ar: "بدء الاستيراد" },
  updating_formulary_for: {
    en: "Updating formulary record for",
    ar: "تحديث سجل الدليل لـ",
  },
  admin_register_drug_hint: {
    en: "Register a drug — optionally assign to a clinic",
    ar: "تسجيل دواء — مع إمكانية تعيينه لعيادة",
  },
  clinic_drug_adding_hint: {
    en: "Adding clinic drug — will be assigned to",
    ar: "إضافة دواء للعيادة — سيتم تعيينه لـ",
  },
  your_clinic: { en: "your clinic", ar: "عيادتك" },
  global_no_clinic: { en: "Global (no clinic)", ar: "عام (بدون عيادة)" },
  clinic_assignment_admin_only: {
    en: "Clinic Assignment (Admin Only)",
    ar: "تعيين العيادة (للمدير فقط)",
  },
  drug_exclusively_assigned_to: {
    en: "This drug will be exclusively assigned to",
    ar: "سيتم تعيين هذا الدواء حصراً لـ",
  },
  not_visible_other_clinics: {
    en: "It will not be visible to other clinics.",
    ar: "لن يكون مرئياً للعيادات الأخرى.",
  },
  failed_load_drugs: {
    en: "Failed to load drugs. Please try again.",
    ar: "فشل تحميل الأدوية. يرجى المحاولة مرة أخرى.",
  },
  no_drugs_match_search: {
    en: "No drugs match your search.",
    ar: "لا توجد أدوية تطابق بحثك.",
  },
  no_drugs_found_text: { en: "No drugs found.", ar: "لا توجد أدوية." },
  add_first_drug: { en: "Add the first drug", ar: "أضف أول دواء" },
  you_manage_drugs_for: {
    en: "You can manage drugs assigned to",
    ar: "يمكنك إدارة الأدوية المخصصة لـ",
  },
  global_drugs_readonly_notice: {
    en: "Global drugs are read-only — contact admin to modify them.",
    ar: "الأدوية العامة للقراءة فقط — تواصل مع المدير للتعديل.",
  },
  read_only_formulary_as: {
    en: "You have read-only access to the formulary as",
    ar: "لديك وصول للقراءة فقط لدليل الأدوية بصفتك",
  },
  edit_drug_title: { en: "Edit Drug", ar: "تعديل الدواء" },
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

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[lang] || key;
    },
    [lang],
  );

  const dir = lang === "ar" ? ("rtl" as const) : ("ltr" as const);

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
