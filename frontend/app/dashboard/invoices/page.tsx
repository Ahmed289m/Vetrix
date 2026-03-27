"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { FileText, Plus, Download, X, Printer, CheckCircle2 } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  ownerName: string;
  petName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: "paid" | "unpaid" | "partial";
  total: number;
}

const initialInvoices: Invoice[] = [
  { id: "1", invoiceNumber: "INV-2024-0847", ownerName: "Sarah Mitchell", petName: "Bella", date: "2024-03-18", dueDate: "2024-04-01", items: [
    { description: "TPLO Surgery", quantity: 1, unitPrice: 950 },
    { description: "Anesthesia (General)", quantity: 1, unitPrice: 150 },
    { description: "Post-op Medications", quantity: 1, unitPrice: 85 },
    { description: "Hospitalization (2 nights)", quantity: 2, unitPrice: 75 },
  ], status: "unpaid", total: 1335 },
  { id: "2", invoiceNumber: "INV-2024-0846", ownerName: "Tom Parker", petName: "Max", date: "2024-03-18", dueDate: "2024-04-01", items: [
    { description: "Dental Cleaning", quantity: 1, unitPrice: 120 },
    { description: "Tooth Extraction x2", quantity: 2, unitPrice: 45 },
    { description: "Dental Radiographs", quantity: 1, unitPrice: 40 },
  ], status: "unpaid", total: 250 },
  { id: "3", invoiceNumber: "INV-2024-0845", ownerName: "Maria Garcia", petName: "Luna", date: "2024-03-17", dueDate: "2024-03-31", items: [
    { description: "DHPP Vaccination", quantity: 1, unitPrice: 35 },
    { description: "Rabies Vaccination", quantity: 1, unitPrice: 25 },
    { description: "Wellness Exam", quantity: 1, unitPrice: 55 },
  ], status: "paid", total: 115 },
  { id: "4", invoiceNumber: "INV-2024-0843", ownerName: "Lisa Brown", petName: "Shadow", date: "2024-03-16", dueDate: "2024-03-30", items: [
    { description: "Emergency Exam", quantity: 1, unitPrice: 150 },
    { description: "Urinary Catheterization", quantity: 1, unitPrice: 250 },
    { description: "IV Fluids", quantity: 1, unitPrice: 120 },
    { description: "Lab Work (Blood Panel)", quantity: 1, unitPrice: 180 },
    { description: "Hospitalization (3 nights)", quantity: 3, unitPrice: 75 },
  ], status: "partial", total: 925 },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-emerald/15", text: "text-emerald" },
  unpaid: { bg: "bg-coral/15", text: "text-coral" },
  partial: { bg: "bg-orange/15", text: "text-orange" },
};

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newItems, setNewItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [newInvoice, setNewInvoice] = useState({ ownerName: "", petName: "" });

  const addLineItem = () => setNewItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Billing</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Invoices</h2>
          <p className="text-sm text-muted-foreground mt-1">{invoices.filter((i) => i.status === "unpaid").length} unpaid · ${invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0).toLocaleString()} outstanding</p>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <Plus className="w-4 h-4" /> Generate Invoice
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {invoices.map((inv, i) => {
          const sc = statusColors[inv.status];
          return (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer card-hover" onClick={() => setSelectedInvoice(inv)}>
              <div className="w-11 h-11 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{inv.invoiceNumber}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}>{inv.status}</span>
                </div>
                <p className="text-sm font-bold mt-0.5">{inv.ownerName} — {inv.petName}</p>
                <p className="text-xs text-muted-foreground">{inv.date} · Due: {inv.dueDate}</p>
              </div>
              <p className="text-lg font-extrabold tabular-nums shrink-0">${inv.total.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">{selectedInvoice.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${statusColors[selectedInvoice.status].bg} ${statusColors[selectedInvoice.status].text}`}>{selectedInvoice.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Issued: {selectedInvoice.date} · Due: {selectedInvoice.dueDate}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
                <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Client</p><p className="text-sm font-semibold mt-0.5">{selectedInvoice.ownerName}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Patient</p><p className="text-sm font-semibold mt-0.5">{selectedInvoice.petName}</p></div>
              </div>
              <div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/30">
                    <th className="text-left py-2 text-[10px] font-bold uppercase text-muted-foreground">Item</th>
                    <th className="text-center py-2 text-[10px] font-bold uppercase text-muted-foreground">Qty</th>
                    <th className="text-right py-2 text-[10px] font-bold uppercase text-muted-foreground">Price</th>
                    <th className="text-right py-2 text-[10px] font-bold uppercase text-muted-foreground">Total</th>
                  </tr></thead>
                  <tbody>
                    {selectedInvoice.items.map((item, j) => (
                      <tr key={j} className="border-b border-border/20">
                        <td className="py-2.5">{item.description}</td>
                        <td className="py-2.5 text-center tabular-nums">{item.quantity}</td>
                        <td className="py-2.5 text-right tabular-nums">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-3 pt-3 border-t border-border/30">
                  <p className="text-lg font-extrabold tabular-nums">Total: ${selectedInvoice.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-emerald-cyan text-primary-foreground glow-emerald"><CheckCircle2 className="w-3.5 h-3.5" /> Mark as Paid</button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50"><Printer className="w-3.5 h-3.5" /> Print</button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50"><Download className="w-3.5 h-3.5" /> PDF</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Generate Invoice</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Owner Name</label>
                  <input value={newInvoice.ownerName} onChange={(e) => setNewInvoice((p) => ({ ...p, ownerName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pet Name</label>
                  <input value={newInvoice.petName} onChange={(e) => setNewInvoice((p) => ({ ...p, petName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Line Items</span>
                  <button onClick={addLineItem} className="text-xs font-semibold text-emerald hover:underline">+ Add Item</button>
                </div>
                {newItems.map((item, j) => (
                  <div key={j} className="grid grid-cols-6 gap-2 mb-2">
                    <input placeholder="Description" value={item.description} onChange={(e) => { const items = [...newItems]; items[j].description = e.target.value; setNewItems(items); }} className="col-span-3 px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                    <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => { const items = [...newItems]; items[j].quantity = Number(e.target.value); setNewItems(items); }} className="col-span-1 px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none text-center" />
                    <input type="number" placeholder="Price" value={item.unitPrice || ""} onChange={(e) => { const items = [...newItems]; items[j].unitPrice = Number(e.target.value); setNewItems(items); }} className="col-span-2 px-2 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none" />
                  </div>
                ))}
                <p className="text-right text-sm font-bold mt-2">Total: ${newItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Generate Invoice</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
