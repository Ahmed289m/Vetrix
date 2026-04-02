"use client";

import * as React from "react";
import {
  Wallet,
  DollarSign,
  Download,
  Plus,
  MoreHorizontal,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Badge } from "@/app/_components/ui/badge";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import { Label } from "@/app/_components/ui/label";
import { cn } from "@/app/_lib/utils";

interface Transaction {
  id: string;
  client: string;
  category: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Voided";
}

// Real data will be fetched and displayed
const transactions: Transaction[] = [];

export default function FinancesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormOpen(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              Treasury
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Financial <span className="text-emerald">Overview</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Track revenue streams, managed expenses and generate clinical
            receipts.
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Bill
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-emerald/10 backdrop-blur-md rounded-[2.5rem] border border-emerald/20 p-8 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald/20 rounded-full blur-[60px]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald mb-2">
            Monthly Revenue
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-foreground">$14,250.00</h2>
            <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-muted/40 backdrop-blur-md rounded-[2.5rem] border border-border/10 p-8 relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
            Expenses
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-foreground">$4,120.50</h2>
            <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-red-400">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-muted/40 backdrop-blur-md rounded-[2.5rem] border border-border/10 p-8 relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
            Profit Projection
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-foreground">$10,129.50</h2>
            <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-blue-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            placeholder="Search transactions by client, ID or category..."
            className="pl-12 h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-medium"
          />
        </div>
        <Button
          variant="ghost"
          className="h-14 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-muted/40 border border-border/10 hover:bg-muted/50"
        >
          Download Ledger
        </Button>
      </div>

      {/* Table Item */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-br from-emerald/10 to-transparent rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
        <div className="relative bg-muted/40 backdrop-blur-md rounded-4xl border border-border/10 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/10 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Tx ID & Client
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Category
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Amount
                </TableHead>
                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                  Status
                </TableHead>
                <TableHead className="py-6 px-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="border-b border-border/10 hover:bg-muted/40 transition-colors group/row"
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black tracking-widest text-emerald bg-emerald/5 w-fit px-2 py-0.5 rounded-md uppercase">
                          {tx.id}
                        </span>
                        <span className="font-black text-foreground group-hover/row:text-emerald transition-colors tracking-tight">
                          {tx.client}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground/80 leading-none">
                          {tx.category}
                        </span>
                        <span className="text-xs text-muted-foreground/40 font-bold">
                          {tx.date}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <span
                        className={cn(
                          "text-lg font-black tracking-tight",
                          tx.amount > 0 ? "text-emerald" : "text-white/80",
                        )}
                      >
                        {tx.amount > 0
                          ? `+ $${tx.amount}`
                          : `- $${Math.abs(tx.amount)}`}
                      </span>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge
                        className={cn(
                          "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                          tx.status === "Paid"
                            ? "bg-emerald/10 text-emerald"
                            : "bg-orange-500/10 text-orange-400",
                        )}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group-hover/row:bg-muted/50 rounded-xl h-10 w-10"
                          >
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover/95 backdrop-blur-xl border-border/10 rounded-2xl p-2 w-56 shadow-2xl"
                        >
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                            Treasury Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                            <Receipt className="w-4 h-4" /> View Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald/10 focus:text-emerald cursor-pointer font-bold flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Ledger
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-muted/40 mx-2" />
                          <DropdownMenuItem className="rounded-xl py-3 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-bold">
                            Void Transaction
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground font-semibold">
                      No transactions found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DashboardForm
        title="Create Final Bill"
        description="Select clinical activity and items to generate a billing receipt."
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        submitLabel="Generate Bill"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Client Search
            </Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
              <Input
                placeholder="Search client profile..."
                className="pl-12 h-14 bg-muted/40 border-border/10 focus:border-emerald/30 focus:ring-emerald/20 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/10">
            <Label className="text-sm font-black uppercase tracking-widest text-emerald ml-1">
              Billing Items
            </Label>
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/10">
                <span className="text-sm font-bold text-foreground/80">
                  Consultation Fee
                </span>
                <span className="text-sm font-black text-foreground">
                  $50.00
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/10">
                <span className="text-sm font-bold text-foreground/80">
                  Amoxicillin 500mg
                </span>
                <span className="text-sm font-black text-foreground">
                  $25.00
                </span>
              </div>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl border border-dashed border-border/10 text-muted-foreground/60 hover:text-emerald hover:border-emerald/30 hover:bg-emerald/5 uppercase text-[10px] font-black tracking-widest"
              >
                + Add Billing Entry
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-muted-foreground/60 tracking-widest">
                Subtotal
              </span>
              <span className="text-sm font-black text-foreground">$75.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald tracking-widest">
                Total Due
              </span>
              <span className="text-2xl font-black text-foreground">
                $75.00
              </span>
            </div>
          </div>
        </div>
      </DashboardForm>
    </div>
  );
}
