import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, AlertTriangle, Edit2, Trash2, X, TrendingDown, TrendingUp } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  price: number;
  supplier: string;
  lastRestocked: string;
}

const initialItems: InventoryItem[] = [
  { id: "1", name: "Propofol 10mg/mL", category: "Anesthetics", stock: 2, unit: "vials", minStock: 10, price: 45.00, supplier: "VetPharm Co.", lastRestocked: "2024-03-01" },
  { id: "2", name: "Meloxicam 1.5mg/mL", category: "NSAIDs", stock: 8, unit: "bottles", minStock: 15, price: 28.50, supplier: "VetPharm Co.", lastRestocked: "2024-03-05" },
  { id: "3", name: "Surgical Gloves (M)", category: "Supplies", stock: 1, unit: "boxes", minStock: 5, price: 12.00, supplier: "MedSupply Plus", lastRestocked: "2024-02-20" },
  { id: "4", name: "Amoxicillin 250mg Tabs", category: "Antibiotics", stock: 45, unit: "tablets", minStock: 30, price: 0.85, supplier: "VetPharm Co.", lastRestocked: "2024-03-10" },
  { id: "5", name: "IV Catheter 22G", category: "Supplies", stock: 25, unit: "units", minStock: 20, price: 3.50, supplier: "MedSupply Plus", lastRestocked: "2024-03-08" },
  { id: "6", name: "Ketamine 100mg/mL", category: "Anesthetics", stock: 6, unit: "vials", minStock: 8, price: 65.00, supplier: "VetPharm Co.", lastRestocked: "2024-03-02" },
  { id: "7", name: "Suture Material 3-0", category: "Supplies", stock: 30, unit: "packs", minStock: 10, price: 8.50, supplier: "SurgicalVet", lastRestocked: "2024-03-12" },
  { id: "8", name: "Cephalexin 500mg Tabs", category: "Antibiotics", stock: 60, unit: "tablets", minStock: 40, price: 1.20, supplier: "VetPharm Co.", lastRestocked: "2024-03-11" },
];

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", stock: "", unit: "", minStock: "", price: "", supplier: "" });

  const filtered = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase()));
  const criticalCount = items.filter(i => i.stock <= i.minStock * 0.3).length;
  const lowCount = items.filter(i => i.stock <= i.minStock && i.stock > i.minStock * 0.3).length;

  const getStockLevel = (item: InventoryItem) => {
    if (item.stock <= item.minStock * 0.3) return "critical";
    if (item.stock <= item.minStock) return "low";
    return "normal";
  };

  const handleAdd = () => {
    if (!newItem.name) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(), name: newItem.name, category: newItem.category, stock: Number(newItem.stock) || 0, unit: newItem.unit, minStock: Number(newItem.minStock) || 0, price: Number(newItem.price) || 0, supplier: newItem.supplier, lastRestocked: new Date().toISOString().split("T")[0],
    }]);
    setNewItem({ name: "", category: "", stock: "", unit: "", minStock: "", price: "", supplier: "" });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Supply Chain</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items · <span className="text-coral font-semibold">{criticalCount} critical</span> · <span className="text-orange font-semibold">{lowCount} low</span></p>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <Plus className="w-4 h-4" /> Add Item
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 border border-emerald/20">
          <p className="text-3xl font-extrabold text-emerald">{items.filter(i => getStockLevel(i) === "normal").length}</p>
          <p className="text-xs text-muted-foreground mt-1">In Stock</p>
        </div>
        <div className="glass-card p-4 border border-orange/20">
          <p className="text-3xl font-extrabold text-orange">{lowCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Low Stock</p>
        </div>
        <div className="glass-card p-4 border border-coral/20">
          <p className="text-3xl font-extrabold text-coral">{criticalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Critical</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Price</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Supplier</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const level = getStockLevel(item);
                return (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{item.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{item.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold">{item.stock}</span> <span className="text-muted-foreground text-xs">{item.unit}</span>
                      <span className="text-[10px] text-muted-foreground/50 ml-1">(min: {item.minStock})</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground hidden md:table-cell">${item.price.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{item.supplier}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          level === "critical" ? "bg-coral/15 text-coral" : level === "low" ? "bg-orange/15 text-orange" : "bg-emerald/15 text-emerald"
                        }`}>{level}</span>
                        <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-coral/10 text-muted-foreground hover:text-coral transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Add Inventory Item</h3>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Name *</label>
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
                  <input value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit</label>
                  <input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="vials, boxes..." className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Stock</label>
                  <input type="number" value={newItem.stock} onChange={e => setNewItem(p => ({ ...p, stock: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Min Stock</label>
                  <input type="number" value={newItem.minStock} onChange={e => setNewItem(p => ({ ...p, minStock: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price ($)</label>
                  <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Supplier</label>
                <input value={newItem.supplier} onChange={e => setNewItem(p => ({ ...p, supplier: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" />
              </div>
              <button onClick={handleAdd} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Add Item</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
