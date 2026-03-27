import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft, X, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Transaction {
  id: string;
  type: "incoming" | "outgoing";
  description: string;
  amount: number;
  category: string;
  date: string;
  reference: string;
}

const initialTransactions: Transaction[] = [
  { id: "1", type: "incoming", description: "Payment - Sarah Mitchell (Bella surgery)", amount: 1250.00, category: "Surgery", date: "2024-03-18", reference: "PAY-0847" },
  { id: "2", type: "incoming", description: "Payment - Tom Parker (Dental cleaning)", amount: 185.00, category: "Dental", date: "2024-03-18", reference: "PAY-0846" },
  { id: "3", type: "outgoing", description: "VetPharm Co. - Medical supplies order", amount: 2340.00, category: "Supplies", date: "2024-03-17", reference: "PO-1234" },
  { id: "4", type: "incoming", description: "Payment - Maria Garcia (Vaccination)", amount: 95.00, category: "Vaccination", date: "2024-03-17", reference: "PAY-0845" },
  { id: "5", type: "outgoing", description: "Staff salary - March (partial)", amount: 8500.00, category: "Payroll", date: "2024-03-15", reference: "SAL-0315" },
  { id: "6", type: "incoming", description: "Payment - James Wilson (Consultation)", amount: 120.00, category: "Consultation", date: "2024-03-16", reference: "PAY-0844" },
  { id: "7", type: "outgoing", description: "Utility bills - March", amount: 450.00, category: "Utilities", date: "2024-03-15", reference: "UTL-0315" },
  { id: "8", type: "incoming", description: "Payment - Lisa Brown (Emergency care)", amount: 890.00, category: "Emergency", date: "2024-03-16", reference: "PAY-0843" },
];

const revenueData = [
  { day: "Mon", amount: 2400 }, { day: "Tue", amount: 3200 }, { day: "Wed", amount: 2800 },
  { day: "Thu", amount: 3600 }, { day: "Fri", amount: 4100 }, { day: "Sat", amount: 1900 }, { day: "Sun", amount: 800 },
];

export default function Finances() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filter, setFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({ type: "incoming" as Transaction["type"], description: "", amount: "", category: "", reference: "" });

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.type === filter);
  const totalIncoming = transactions.filter(t => t.type === "incoming").reduce((s, t) => s + t.amount, 0);
  const totalOutgoing = transactions.filter(t => t.type === "outgoing").reduce((s, t) => s + t.amount, 0);

  const handleAdd = () => {
    if (!newTx.description || !newTx.amount) return;
    setTransactions(prev => [{
      id: Date.now().toString(), type: newTx.type, description: newTx.description, amount: Number(newTx.amount), category: newTx.category, date: new Date().toISOString().split("T")[0], reference: newTx.reference || `TX-${Date.now().toString().slice(-4)}`,
    }, ...prev]);
    setNewTx({ type: "incoming", description: "", amount: "", category: "", reference: "" });
    setShowAdd(false);
  };

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Financial Management</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Finances</h2>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <Plus className="w-4 h-4" /> Record Transaction
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-5 border border-emerald/20">
          <div className="flex items-center gap-2 mb-2"><ArrowDownLeft className="w-4 h-4 text-emerald" /><span className="text-xs font-bold uppercase text-muted-foreground">Income</span></div>
          <p className="text-2xl font-extrabold text-emerald tabular-nums">${totalIncoming.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 border border-coral/20">
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-coral" /><span className="text-xs font-bold uppercase text-muted-foreground">Expenses</span></div>
          <p className="text-2xl font-extrabold text-coral tabular-nums">${totalOutgoing.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 border border-cyan/20">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-cyan" /><span className="text-xs font-bold uppercase text-muted-foreground">Net</span></div>
          <p className={`text-2xl font-extrabold tabular-nums ${totalIncoming - totalOutgoing >= 0 ? "text-emerald" : "text-coral"}`}>
            ${(totalIncoming - totalOutgoing).toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* Revenue chart */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Weekly Revenue</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="finGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(217, 33%, 17%)", border: "1px solid hsl(217, 33%, 22%)", borderRadius: "12px", fontSize: "12px", color: "hsl(210, 20%, 92%)" }} formatter={(v: number) => [`$${v}`, "Revenue"]} />
            <Area type="monotone" dataKey="amount" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#finGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(["all", "incoming", "outgoing"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            filter === f ? "gradient-emerald-cyan text-primary-foreground glow-emerald" : "bg-muted/30 border border-border/50 text-muted-foreground hover:border-emerald/30"
          }`}>{f}</button>
        ))}
      </motion.div>

      {/* Transaction list */}
      <motion.div variants={fadeUp} className="space-y-2">
        {filtered.map((tx, i) => (
          <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={`glass-card p-4 flex items-center gap-4 border ${tx.type === "incoming" ? "border-emerald/10" : "border-coral/10"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "incoming" ? "bg-emerald/10" : "bg-coral/10"}`}>
              {tx.type === "incoming" ? <ArrowDownLeft className="w-5 h-5 text-emerald" /> : <ArrowUpRight className="w-5 h-5 text-coral" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{tx.category} · {tx.date} · <span className="font-mono">{tx.reference}</span></p>
            </div>
            <p className={`text-sm font-bold tabular-nums shrink-0 ${tx.type === "incoming" ? "text-emerald" : "text-coral"}`}>
              {tx.type === "incoming" ? "+" : "-"}${tx.amount.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Record Transaction</h3>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2">
                {(["incoming", "outgoing"] as const).map(t => (
                  <button key={t} onClick={() => setNewTx(p => ({ ...p, type: t }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    newTx.type === t ? (t === "incoming" ? "bg-emerald/15 text-emerald border border-emerald/30" : "bg-coral/15 text-coral border border-coral/30") : "bg-muted/30 border border-border/50 text-muted-foreground"
                  }`}>{t}</button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description *</label>
                <input value={newTx.description} onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount ($) *</label>
                  <input type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
                  <input value={newTx.category} onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Record</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
