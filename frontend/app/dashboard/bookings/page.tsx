"use client";

import { useState } from "react";
import { motion } from "@/app/_components/fast-motion";
import { Calendar, CheckCircle2, XCircle, Clock, Dog, Cat } from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

interface Booking {
  id: string;
  petName: string;
  species: "dog" | "cat";
  ownerName: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

const initialBookings: Booking[] = [
  {
    id: "1",
    petName: "Bella",
    species: "dog",
    ownerName: "Sarah Mitchell",
    date: "2024-03-18",
    time: "09:00",
    type: "Post-op Follow-up",
    doctor: "Dr. Emily Chen",
    status: "pending",
  },
  {
    id: "2",
    petName: "Max",
    species: "cat",
    ownerName: "Tom Parker",
    date: "2024-03-18",
    time: "09:30",
    type: "Dental Cleaning",
    doctor: "Dr. Emily Chen",
    status: "confirmed",
  },
  {
    id: "3",
    petName: "Luna",
    species: "dog",
    ownerName: "Maria Garcia",
    date: "2024-03-18",
    time: "10:00",
    type: "Vaccination",
    doctor: "Dr. Aris Rahman",
    status: "pending",
  },
  {
    id: "4",
    petName: "Rocky",
    species: "dog",
    ownerName: "James Wilson",
    date: "2024-03-18",
    time: "10:30",
    type: "Skin Allergy Consult",
    doctor: "Dr. Emily Chen",
    status: "confirmed",
  },
  {
    id: "5",
    petName: "Mittens",
    species: "cat",
    ownerName: "Amy Chen",
    date: "2024-03-18",
    time: "11:00",
    type: "Annual Checkup",
    doctor: "Dr. Aris Rahman",
    status: "pending",
  },
  {
    id: "6",
    petName: "Coco",
    species: "dog",
    ownerName: "David Lee",
    date: "2024-03-19",
    time: "09:00",
    type: "Blood Work",
    doctor: "Dr. Emily Chen",
    status: "pending",
  },
  {
    id: "7",
    petName: "Shadow",
    species: "cat",
    ownerName: "Lisa Brown",
    date: "2024-03-19",
    time: "10:00",
    type: "Spay Surgery",
    doctor: "Dr. Aris Rahman",
    status: "confirmed",
  },
  {
    id: "8",
    petName: "Duke",
    species: "dog",
    ownerName: "Mike Johnson",
    date: "2024-03-17",
    time: "14:00",
    type: "Ear Infection",
    doctor: "Dr. Emily Chen",
    status: "completed",
  },
];

const statusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-orange/10",
    text: "text-orange",
    border: "border-orange/20",
  },
  confirmed: {
    bg: "bg-emerald/10",
    text: "text-emerald",
    border: "border-emerald/20",
  },
  cancelled: {
    bg: "bg-coral/10",
    text: "text-coral",
    border: "border-coral/20",
  },
  completed: {
    bg: "bg-muted/30",
    text: "text-muted-foreground",
    border: "border-border/30",
  },
};

export default function BookingsPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled" | "completed"
  >("all");

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const handleConfirm = (id: string) =>
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "confirmed" as const } : b,
      ),
    );
  const handleCancel = (id: string) =>
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "cancelled" as const } : b,
      ),
    );

  return (
    <motion.div
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("scheduling")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("bookings")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} {t("pending_confirmations")}
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        {(
          ["all", "pending", "confirmed", "cancelled", "completed"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}
          >
            {t(f)} {f === "pending" && pendingCount > 0 && `(${pendingCount})`}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((booking, i) => {
          const sc = statusColors[booking.status];
          const Icon = booking.species === "dog" ? Dog : Cat;
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 border ${sc.border}`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">
                      {booking.petName}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.ownerName} · {booking.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {booking.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.time}
                </span>
                <span className="hidden sm:inline">{booking.doctor}</span>
              </div>
              {booking.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleConfirm(booking.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-emerald-cyan text-primary-foreground glow-emerald"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("confirm")}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCancel(booking.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-coral/10 border border-coral/20 text-coral hover:bg-coral/20"
                  >
                    <XCircle className="w-3.5 h-3.5" /> {t("cancel")}
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
