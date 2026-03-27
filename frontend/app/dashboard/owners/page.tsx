"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import { Plus, Search, UserPlus, PawPrint, Mail, Phone, MapPin, X, Dog, Cat, Bird, ChevronRight, Edit2, Trash2 } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat" | "bird" | "other";
  breed: string;
  age: string;
  weight: string;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  hasAccount: boolean;
  pets: Pet[];
  createdAt: string;
}

const speciesIcons = { dog: Dog, cat: Cat, bird: Bird, other: PawPrint };

const initialOwners: Owner[] = [
  { id: "1", firstName: "Sarah", lastName: "Mitchell", email: "sarah.m@email.com", phone: "+1 555-0101", address: "123 Oak Street", hasAccount: true, pets: [
    { id: "p1", name: "Bella", species: "dog", breed: "Golden Retriever", age: "4 years", weight: "28.5 kg" },
    { id: "p2", name: "Whiskers", species: "cat", breed: "Persian", age: "2 years", weight: "4.2 kg" },
  ], createdAt: "2024-01-15" },
  { id: "2", firstName: "Tom", lastName: "Parker", email: "tom.p@email.com", phone: "+1 555-0102", address: "456 Elm Avenue", hasAccount: true, pets: [
    { id: "p3", name: "Max", species: "cat", breed: "Siamese", age: "3 years", weight: "3.8 kg" },
  ], createdAt: "2024-02-20" },
  { id: "3", firstName: "Maria", lastName: "Garcia", email: "maria.g@email.com", phone: "+1 555-0103", address: "789 Pine Road", hasAccount: false, pets: [
    { id: "p4", name: "Luna", species: "dog", breed: "Labrador", age: "2 years", weight: "25.0 kg" },
  ], createdAt: "2024-03-10" },
  { id: "4", firstName: "James", lastName: "Wilson", email: "james.w@email.com", phone: "+1 555-0104", address: "321 Maple Drive", hasAccount: false, pets: [], createdAt: "2024-03-15" },
];

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>(initialOwners);
  const [search, setSearch] = useState("");
  const [showCreateOwner, setShowCreateOwner] = useState(false);
  const [showAddPet, setShowAddPet] = useState<string | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "" });
  const [newPet, setNewPet] = useState({ name: "", species: "dog" as Pet["species"], breed: "", age: "", weight: "" });

  const filtered = owners.filter((o) =>
    `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOwner = () => {
    if (!newOwner.firstName || !newOwner.lastName) return;
    const owner: Owner = { id: Date.now().toString(), ...newOwner, hasAccount: false, pets: [], createdAt: new Date().toISOString().split("T")[0] };
    setOwners((prev) => [owner, ...prev]);
    setNewOwner({ firstName: "", lastName: "", email: "", phone: "", address: "" });
    setShowCreateOwner(false);
  };

  const handleAddPet = (ownerId: string) => {
    if (!newPet.name) return;
    const pet: Pet = { id: Date.now().toString(), ...newPet };
    setOwners((prev) => prev.map((o) => o.id === ownerId ? { ...o, pets: [...o.pets, pet] } : o));
    setNewPet({ name: "", species: "dog", breed: "", age: "", weight: "" });
    setShowAddPet(null);
  };

  const handleCreateAccount = (ownerId: string) => setOwners((prev) => prev.map((o) => o.id === ownerId ? { ...o, hasAccount: true } : o));
  const handleDeleteOwner = (ownerId: string) => setOwners((prev) => prev.filter((o) => o.id !== ownerId));

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-1">Client Management</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Owners & Pets</h2>
          <p className="text-sm text-muted-foreground mt-1">{owners.length} registered owners · {owners.reduce((sum, o) => sum + o.pets.length, 0)} pets</p>
        </div>
        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreateOwner(true)} className="flex items-center gap-2 gradient-emerald-cyan text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold glow-emerald ripple">
          <UserPlus className="w-4 h-4" /> New Owner
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search owners..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
      </motion.div>

      {/* Create Owner Modal */}
      <AnimatePresence>
        {showCreateOwner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateOwner(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Create Owner Profile</h3>
                <button onClick={() => setShowCreateOwner(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">First Name *</label><input value={newOwner.firstName} onChange={(e) => setNewOwner((p) => ({ ...p, firstName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Last Name *</label><input value={newOwner.lastName} onChange={(e) => setNewOwner((p) => ({ ...p, lastName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              </div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label><input value={newOwner.email} onChange={(e) => setNewOwner((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label><input value={newOwner.phone} onChange={(e) => setNewOwner((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Address</label><input value={newOwner.address} onChange={(e) => setNewOwner((p) => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              <button onClick={handleCreateOwner} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Create Owner</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Pet Modal */}
      <AnimatePresence>
        {showAddPet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddPet(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Add Pet</h3>
                <button onClick={() => setShowAddPet(null)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Pet Name *</label><input value={newPet.name} onChange={(e) => setNewPet((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Species</label>
                  <select value={newPet.species} onChange={(e) => setNewPet((p) => ({ ...p, species: e.target.value as Pet["species"] }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none">
                    <option value="dog">Dog</option><option value="cat">Cat</option><option value="bird">Bird</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Breed</label><input value={newPet.breed} onChange={(e) => setNewPet((p) => ({ ...p, breed: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Age</label><input value={newPet.age} onChange={(e) => setNewPet((p) => ({ ...p, age: e.target.value }))} placeholder="e.g. 3 years" className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Weight</label><input value={newPet.weight} onChange={(e) => setNewPet((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 12.5 kg" className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30" /></div>
              </div>
              <button onClick={() => handleAddPet(showAddPet)} className="w-full gradient-emerald-cyan text-primary-foreground py-3 rounded-xl text-sm font-bold glow-emerald">Add Pet</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Owner List */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((owner, i) => {
          const isExpanded = expandedOwner === owner.id;
          return (
            <motion.div key={owner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedOwner(isExpanded ? null : owner.id)}>
                <div className="w-12 h-12 rounded-2xl gradient-emerald-cyan flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                  {owner.firstName[0]}{owner.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{owner.firstName} {owner.lastName}</p>
                    {owner.hasAccount ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald/15 text-emerald">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-orange/15 text-orange">No Account</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{owner.email}</span>
                    <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" />{owner.pets.length} pets</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{owner.phone || "No phone"}</div>
                        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{owner.address || "No address"}</div>
                        <div className="text-muted-foreground">Registered: {owner.createdAt}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pets</span>
                          <button onClick={() => setShowAddPet(owner.id)} className="flex items-center gap-1 text-xs font-semibold text-emerald hover:underline">
                            <Plus className="w-3 h-3" /> Add Pet
                          </button>
                        </div>
                        {owner.pets.length === 0 ? (
                          <p className="text-xs text-muted-foreground/50 italic">No pets registered</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {owner.pets.map((pet) => {
                              const Icon = speciesIcons[pet.species];
                              return (
                                <div key={pet.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                                  <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                                  <div className="min-w-0"><p className="text-sm font-semibold truncate">{pet.name}</p><p className="text-[11px] text-muted-foreground">{pet.breed} · {pet.age} · {pet.weight}</p></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        {!owner.hasAccount && (
                          <button onClick={() => handleCreateAccount(owner.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold gradient-emerald-cyan text-primary-foreground glow-emerald">
                            <UserPlus className="w-3.5 h-3.5" /> Create Account
                          </button>
                        )}
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/30 border border-border/50 hover:border-emerald/30">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDeleteOwner(owner.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-coral/10 border border-coral/20 text-coral hover:bg-coral/20">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
