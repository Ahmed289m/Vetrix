"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  Cat,
  Calendar,
  FileText,
  Bell,
  Activity,
  Clock,
  Dog,
  ChevronRight,
  Volume2,
  CheckCircle2,
  Play,
  Stethoscope,
  X,
} from "lucide-react";
import { fadeUp, stagger } from "@/app/_lib/utils/shared-animations";
import { useLang } from "@/app/_hooks/useLanguage";
import { useAuth } from "@/app/_hooks/useAuth";
import { useAppointments } from "@/app/_hooks/queries/use-appointments";
import { usePets } from "@/app/_hooks/queries/use-pets";
import { usePrescriptions } from "@/app/_hooks/queries/use-prescriptions";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import type { Appointment, Pet } from "@/app/_lib/types/models";
import { cn } from "@/app/_lib/utils";

/** Status badge colors for appointment states */
const statusStyle = (status: string) => {
  switch (status) {
    case "in-progress":
      return {
        dot: "bg-cyan animate-pulse",
        badge: "bg-cyan/15 text-cyan border-cyan/25",
        label: "In Progress",
      };
    case "pending-doctor":
      return {
        dot: "bg-orange animate-pulse",
        badge: "bg-orange/15 text-orange border-orange/25",
        label: "Awaiting Doctor",
      };
    case "confirmed":
      return {
        dot: "bg-emerald",
        badge: "bg-emerald/15 text-emerald border-emerald/25",
        label: "Confirmed",
      };
    default:
      return {
        dot: "bg-muted-foreground",
        badge: "bg-muted/30 text-muted-foreground border-border/30",
        label: status,
      };
  }
};

export function ClientDashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const [showTracker, setShowTracker] = useState(false);
  const hasAnnounced = useRef(false);
  const announcedForPos = useRef<string | null>(null);

  // ── TTS announcement: fires when client's case becomes in-progress ──
  const playAnnouncement = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // ── Airport-style 3-tone chime via Web Audio API ──
    const playChime = (): Promise<void> => {
      return new Promise((resolve) => {
        try {
          const ctx = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          const tones = [
            { freq: 880, start: 0, dur: 0.35 }, // A5
            { freq: 740, start: 0.3, dur: 0.35 }, // F#5
            { freq: 587, start: 0.58, dur: 0.55 }, // D5 (resolving)
          ];
          tones.forEach(({ freq, start, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(
              0.22,
              ctx.currentTime + start + 0.02,
            );
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + start + dur,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur);
          });
          // Resolve after all tones finish + small buffer
          setTimeout(() => {
            ctx.close();
            resolve();
          }, 1300);
        } catch {
          resolve(); // Web Audio not supported — skip silently
        }
      });
    };

    const synth = window.speechSynthesis;
    synth.cancel();

    const EN_TEXT = "Your turn is now. Please proceed to the doctor room.";
    const AR_TEXT =
      "\u062d\u0627\u0646 \u062f\u0648\u0631\u0643 \u0627\u0644\u0622\u0646. \u0645\u0646 \u0641\u0636\u0644\u0643 \u062a\u0648\u062c\u0647 \u0625\u0644\u0649 \u063a\u0631\u0641\u0629 \u0627\u0644\u0637\u0628\u064a\u0628.";

    const makeUtterance = (text: string, lang: string) => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.rate = 0.88;
      utt.pitch = 1.05;
      utt.volume = 1;
      const voices = synth.getVoices();
      const female =
        voices.find(
          (v) =>
            v.lang === lang &&
            /female|zira|samantha|karen|moira|victoria|tessa/i.test(v.name),
        ) ??
        voices.find((v) => v.lang === lang) ??
        voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (female) utt.voice = female;
      return utt;
    };

    const doSpeak = () => {
      const enUtt = makeUtterance(EN_TEXT, "en-US");
      const arUtt = makeUtterance(AR_TEXT, "ar-SA");
      enUtt.onend = () => setTimeout(() => synth.speak(arUtt), 150); // 150ms gap
      synth.speak(enUtt);
    };

    // Play chime first, then speak
    playChime().then(() => {
      if (synth.getVoices().length === 0) {
        synth.addEventListener("voiceschanged", doSpeak, { once: true } as any);
      } else {
        doSpeak();
      }
    });
  }, []);

  // ── Live sync – WebSocket invalidates React Query caches on every backend event
  useWebSocket();

  // ── Data (NO useUsers – clients get 403 on /users) ──────────────────────
  const { data: appointmentsData } = useAppointments();
  const { data: petsData } = usePets();
  const { data: prescriptionsData } = usePrescriptions();

  const appointments = appointmentsData?.data ?? [];
  const pets = petsData?.data ?? [];
  const prescriptions = prescriptionsData?.data ?? [];

  // ── Client-scoped stats ────────────────────────────────────────────────────
  const clientStats = useMemo(() => {
    const myPets = pets.filter((p: Pet) => p.client_id === user?.userId).length;

    const now = new Date();
    const upcomingAppointments = appointments.filter((apt: Appointment) => {
      const aptDate = new Date(apt.appointment_date ?? "");
      return (
        apt.client_id === user?.userId &&
        aptDate >= now &&
        (apt.status === "pending" || apt.status === "confirmed")
      );
    }).length;

    const myPrescriptions = prescriptions.filter(
      (rx: any) => rx.client_id === user?.userId,
    ).length;

    const myConfirmedAppointments = appointments.filter(
      (apt: Appointment) =>
        apt.client_id === user?.userId && apt.status === "confirmed",
    ).length;

    return {
      myPets,
      upcomingAppointments,
      myPrescriptions,
      myConfirmedAppointments,
    };
  }, [pets, appointments, prescriptions, user?.userId]);

  // ── Case queue ─────────────────────────────────────────────────────────────
  // Sort: in-progress first (being seen now), then by appointment date ascending.
  // This gives the client an accurate picture of who is ahead of them.
  const ACTIVE_STATUSES = ["confirmed", "pending-doctor", "in-progress"];

  const caseQueue = useMemo(() => {
    const statusOrder: Record<string, number> = {
      "in-progress": 0,
      "pending-doctor": 1,
      confirmed: 2,
    };
    return appointments
      .filter((apt: Appointment) => ACTIVE_STATUSES.includes(apt.status))
      .sort((a: Appointment, b: Appointment) => {
        const aPriority = statusOrder[a.status] ?? 9;
        const bPriority = statusOrder[b.status] ?? 9;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const dateA = a.appointment_date
          ? new Date(a.appointment_date).getTime()
          : 0;
        const dateB = b.appointment_date
          ? new Date(b.appointment_date).getTime()
          : 0;
        return dateA - dateB;
      })
      .map((apt: Appointment, index: number) => {
        const pet = pets.find((p: Pet) => p.pet_id === apt.pet_id);
        return {
          id: apt.appointment_id,
          caseNumber: `APT-${String(index + 1).padStart(4, "0")}`,
          petName: pet?.name || t("unknown_pet"),
          species: (pet?.type || "dog") as "dog" | "cat",
          breed: pet?.breed || t("mixed"),
          complaint: apt.reason || t("regular_checkup"),
          status: apt.status,
          date: apt.appointment_date ?? "",
          isMyAppointment: apt.client_id === user?.userId,
        };
      });
  }, [appointments, pets, user?.userId, t]);

  // How many cases are actively waiting AHEAD of the client (not counting in-progress)
  const myCase = caseQueue.find((c) => c.isMyAppointment) ?? null;
  const waitingCases = caseQueue.filter((c) => c.status !== "in-progress");
  const myWaitingIdx = waitingCases.findIndex((c) => c.isMyAppointment);
  // Position in the waiting queue: 1-based; null if already in-progress or not found
  const myQueuePosition =
    myCase?.status === "in-progress"
      ? null // being seen right now — not "waiting"
      : myWaitingIdx >= 0
        ? myWaitingIdx + 1
        : null;

  // Total waiting (excluding the case currently in-progress)
  const totalWaiting = waitingCases.length;

  // Auto-trigger announcement when client's case becomes "in-progress" (doctor accepted)
  useEffect(() => {
    const triggerKey = myCase ? `${myCase.id}:in-progress` : null;
    if (
      myCase?.status === "in-progress" &&
      showTracker &&
      announcedForPos.current !== triggerKey
    ) {
      announcedForPos.current = triggerKey;
      const t = setTimeout(() => playAnnouncement(), 800);
      return () => clearTimeout(t);
    }
    // Reset if case is no longer in-progress so it can re-fire if needed
    if (!myCase || myCase.status !== "in-progress") {
      if (announcedForPos.current?.endsWith(":in-progress")) {
        announcedForPos.current = null;
      }
    }
  }, [myCase?.status, myCase?.id, showTracker, playAnnouncement]);

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: t("my_pets"),
      value: clientStats.myPets,
      icon: Cat,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      label: t("upcoming_appts"),
      value: clientStats.upcomingAppointments,
      icon: Calendar,
      color: "text-cyan",
      bg: "bg-cyan/10",
      border: "border-cyan/20",
    },
    {
      label: t("prescriptions"),
      value: clientStats.myPrescriptions,
      icon: FileText,
      color: "text-orange",
      bg: "bg-orange/10",
      border: "border-orange/20",
    },
    {
      label: t("notifications"),
      value: clientStats.myConfirmedAppointments,
      icon: Bell,
      color: "text-coral",
      bg: "bg-coral/10",
      border: "border-coral/20",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">
            {t("my_pets")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-arabic">
            {t("client_portal")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {t("manage_your_pets_appointments_and_records")}
          </p>
        </div>

        {/* Case tracker toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowTracker(!showTracker)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            showTracker
              ? "bg-coral/10 border border-coral/30 text-coral"
              : "gradient-emerald-cyan text-primary-foreground glow-emerald"
          }`}
        >
          {showTracker ? (
            <X className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {showTracker ? t("exit_sim") : t("case_tracker")}
        </motion.button>
      </motion.div>

      {/* ── Case Tracker ── */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 space-y-5 shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)]">
              {/* Tracker header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={myCase ? { rotate: 360 } : {}}
                    transition={{
                      repeat: myCase ? Infinity : 0,
                      duration: 3,
                      ease: "linear",
                    }}
                    className="w-8 h-8 rounded-full gradient-emerald-cyan flex items-center justify-center glow-emerald shrink-0"
                  >
                    <Activity className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-bold">{t("case_tracker")}</h3>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-pulse" />
                      Live — updates automatically
                    </p>
                  </div>
                </div>

                {/* Queue progress dots */}
                <div className="flex items-center gap-1.5">
                  {caseQueue.slice(0, 8).map((c) => (
                    <div
                      key={c.id}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        c.status === "in-progress" && c.isMyAppointment
                          ? "bg-cyan glow-emerald scale-150 animate-pulse"
                          : c.isMyAppointment
                            ? "bg-emerald glow-emerald scale-125"
                            : c.status === "in-progress"
                              ? "bg-cyan animate-pulse"
                              : "bg-muted/40"
                      }`}
                    />
                  ))}
                  {caseQueue.length > 8 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      +{caseQueue.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* No active appointment / Completion state */}
              {!myCase && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 rounded-xl border-2 border-dashed border-emerald/30 bg-emerald/5 text-center space-y-3"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald/60 mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    {caseQueue.length === 0
                      ? "Simulation Complete"
                      : t("no_active_appointments")}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {caseQueue.length === 0
                      ? "All clinic cases have been completed."
                      : t("waiting_for_your_turn")}
                  </p>
                </motion.div>
              )}

              {/* ── My case in-progress (being seen NOW) ── */}
              {myCase?.status === "in-progress" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-xl border-2 border-cyan/50 bg-cyan/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] relative overflow-hidden space-y-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan/15 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan animate-pulse">
                      You are being seen now
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {myCase.species === "dog" ? (
                        <Dog className="w-6 h-6" />
                      ) : (
                        <Cat className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-extrabold">{myCase.petName}</p>
                      <p className="text-xs text-muted-foreground">
                        {myCase.breed} · {myCase.caseNumber}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan text-primary-foreground shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)]">
                      <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                      In Progress
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 relative z-10">
                    {myCase.complaint}
                  </p>
                </motion.div>
              )}

              {/* ── My case still waiting in queue ── */}
              {myCase && myQueuePosition && (
                <div className="space-y-4">
                  {/* Position grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-emerald/20 bg-emerald/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {t("position_in_queue")}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span
                          className={cn(
                            "text-3xl font-extrabold tabular-nums",
                            myQueuePosition === 1
                              ? "text-cyan animate-pulse"
                              : "text-emerald",
                          )}
                        >
                          {myQueuePosition}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("of_total")} {totalWaiting}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-cyan/20 bg-cyan/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {t("case_number")}
                      </p>
                      <p className="text-lg font-mono font-bold text-cyan mt-2">
                        {myCase.caseNumber}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-orange/20 bg-orange/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Cases before you
                      </p>
                      <p className="text-3xl font-extrabold text-orange mt-2">
                        {myQueuePosition - 1}
                      </p>
                    </div>
                  </div>

                  {/* My appointment card */}
                  {(() => {
                    const ss = statusStyle(myCase.status);
                    const isActive = myQueuePosition === 1;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={cn(
                          "p-5 rounded-xl border-2 space-y-3 relative overflow-hidden",
                          isActive
                            ? "border-cyan/50 bg-cyan/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)]"
                            : "border-emerald/30 bg-emerald/5",
                        )}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-cyan/15 to-transparent pointer-events-none" />
                        )}

                        {/* Status row */}
                        <div className="flex items-center gap-2 relative z-10">
                          <Clock
                            className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              isActive ? "text-cyan" : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest flex-1",
                              isActive
                                ? "text-cyan animate-pulse"
                                : "text-muted-foreground",
                            )}
                          >
                            {isActive
                              ? t("it_is_your_turn") || "YOUR TURN NOW"
                              : t("your_appointment")}
                          </span>

                          {/* 🔊 Replay announcement button */}
                          {isActive && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={playAnnouncement}
                              title="Replay announcement (EN + AR)"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan/15 border border-cyan/30 text-cyan hover:bg-cyan/25 transition-colors text-[10px] font-bold shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Replay</span>
                            </motion.button>
                          )}
                        </div>

                        {/* Pet info */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                            {myCase.species === "dog" ? (
                              <Dog className="w-6 h-6 text-foreground" />
                            ) : (
                              <Cat className="w-6 h-6 text-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-extrabold">
                              {myCase.petName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {myCase.breed}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                              {myCase.caseNumber}
                            </p>
                          </div>
                          {/* Live status badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0",
                              ss.badge,
                            )}
                          >
                            <span
                              className={cn("w-2 h-2 rounded-full", ss.dot)}
                            />
                            {ss.label}
                          </span>
                        </div>

                        <p className="text-sm text-foreground/80 relative z-10">
                          {myCase.complaint}
                        </p>
                      </motion.div>
                    );
                  })()}

                  {/* Current case (if not mine) */}
                  {caseQueue[0] && !caseQueue[0].isMyAppointment && (
                    <div className="p-4 rounded-xl bg-muted/10 border border-border/30 border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {t("current_case")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                          {caseQueue[0].species === "dog" ? (
                            <Dog className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Cat className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">
                            {caseQueue[0].petName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {caseQueue[0].complaint}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {caseQueue[0].caseNumber}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full queue list (when no personal appointment) */}
              {!myCase && caseQueue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Active cases (
                    {caseQueue.length})
                  </p>
                  {caseQueue.slice(0, 4).map((c, i) => {
                    const ss = statusStyle(c.status);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20 text-xs"
                      >
                        <span className="font-mono text-muted-foreground w-12 shrink-0">
                          {c.caseNumber}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                          {c.species === "dog" ? (
                            <Dog className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Cat className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="flex-1 font-semibold truncate">
                          {c.petName}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border text-[10px]",
                            ss.badge,
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", ss.dot)}
                          />
                          {ss.label}
                        </span>
                      </div>
                    );
                  })}
                  {caseQueue.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{caseQueue.length - 4} more cases
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <motion.div
              key={s.label}
              className={`glass-card p-5 border ${s.border} card-hover cursor-default`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}
              >
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <motion.p
                className="text-3xl font-extrabold mt-4 tabular-nums"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {s.value}
              </motion.p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Placeholder notice */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center mt-8"
      >
        <h3 className="text-lg font-bold">{t("client_module_placeholder")}</h3>
        <p className="text-muted-foreground mt-2">
          {t("client_features_coming")}
        </p>
      </motion.div>
    </motion.div>
  );
}
