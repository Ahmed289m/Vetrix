"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "@/app/_lib/utils";
import { useLang } from "@/app/_hooks/useLanguage";

// Mock data for charts
const growthData = [
  { month: "Jan", patients: 65 },
  { month: "Feb", patients: 85 },
  { month: "Mar", patients: 120 },
  { month: "Apr", patients: 110 },
  { month: "May", patients: 160 },
  { month: "Jun", patients: 195 },
];

const revenueData = [
  { name: "Clinical", value: 45, color: "hsl(160, 84%, 39%)" },
  { name: "Pharmacy", value: 30, color: "hsl(200, 80%, 50%)" },
  { name: "Surgery", value: 20, color: "hsl(280, 70%, 60%)" },
  { name: "Other", value: 5, color: "hsl(30, 80%, 50%)" },
];

export default function ReportsPage() {
  const { t } = useLang();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("intelligence_unit")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("analytics_and_reports_title")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t("reports_description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-muted/40 border border-border/10 hover:bg-muted/50"
          >
            <Filter className="w-4 h-4 mr-2" /> {t("custom_filter")}
          </Button>
          <Button className="h-12 px-6 bg-emerald text-white font-black rounded-xl shadow-xl shadow-emerald/20 flex items-center gap-2">
            <Download className="w-4 h-4" /> {t("export_data")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Growth",
            value: "+24.5%",
            sub: "vs last month",
            icon: TrendingUp,
            color: "text-emerald",
          },
          {
            label: "New Patients",
            value: "156",
            sub: "this month",
            icon: Users,
            color: "text-blue-400",
          },
          {
            label: "Revenue",
            value: "$12.4k",
            sub: "7d forecast",
            icon: DollarSign,
            color: "text-emerald",
          },
          {
            label: "Retention",
            value: "92%",
            sub: "annual rate",
            icon: Calendar,
            color: "text-purple-400",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-muted/40 backdrop-blur-md rounded-4xl border border-border/10 p-6 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-foreground">
                {stat.value}
              </p>
              <span className={cn("text-[10px] font-bold", stat.color)}>
                {stat.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patient Growth Area Chart */}
        <div className="bg-muted/40 backdrop-blur-md rounded-3xl sm:rounded-[2.5rem] border border-border/10 p-4 sm:p-6 lg:p-8 group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-foreground">
              Patient Growth
            </h3>
            <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
              Last 6 Months
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(160, 84%, 39%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(160, 84%, 39%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  backdropFilter: "blur(12px)",
                }}
                itemStyle={{ color: "hsl(160, 84%, 39%)", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={3}
                fill="url(#growthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Mix Pie Chart */}
        <div className="bg-muted/40 backdrop-blur-md rounded-3xl sm:rounded-[2.5rem] border border-border/10 p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg font-black text-foreground mb-8">
            Revenue Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={revenueData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  stroke="none"
                  paddingAngle={4}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {revenueData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-bold text-muted-foreground/80 group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-foreground">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Performance Card */}
      <div className="bg-linear-to-br from-emerald/10 to-transparent backdrop-blur-xl border border-border/10 rounded-3xl sm:rounded-[3rem] p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center gap-8 sm:gap-12 group overflow-hidden relative">
        <div className="absolute h-1 w-full top-0 left-0 bg-linear-to-r from-emerald to-transparent opacity-50" />
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl font-black text-foreground">
            Clinic Efficiency Score
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-8 border-border/10 flex items-center justify-center relative">
              <span className="text-2xl font-black text-emerald">88</span>
              <div className="absolute inset-0 rounded-full border-8 border-emerald border-t-transparent -rotate-45" />
            </div>
            <p className="text-muted-foreground font-medium max-w-sm">
              Your clinic is performing above the 85th percentile for patient
              retention and average visit value in your region.
            </p>
          </div>
        </div>
        <Button className="h-14 px-8 bg-muted/40 hover:bg-muted/50 text-foreground font-black rounded-2xl border border-border/10 group-hover:scale-105 transition-all">
          Detailed Performance Audit <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
