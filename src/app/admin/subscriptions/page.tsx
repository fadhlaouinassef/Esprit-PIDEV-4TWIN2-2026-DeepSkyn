"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { AdminLayout } from "@/app/ui/AdminLayout";
import {
  CreditCard,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Download,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  RefreshCw,
  ChevronDown,
  User,
  Mail,
  Package,
  History,
  BadgeCheck,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PaymentStatus = "Paid" | "Expiring" | "Expired";

interface SubscriptionRow {
  id: number;
  userId: number;
  userName: string;
  email: string;
  image: string | null;
  initials: string;
  plan: string;
  date_debut: string;
  date_fin: string;
  paymentStatus: PaymentStatus;
  amount: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function planColor(plan: string): string {
  switch (plan.toUpperCase()) {
    case "BASIC":   return "bg-slate-100 text-slate-600";
    case "PRO":     return "bg-blue-50 text-blue-700";
    case "PREMIUM": return "bg-violet-50 text-violet-700";
    default:        return "bg-gray-100 text-gray-600";
  }
}

function avatarBg(plan: string): string {
  switch (plan.toUpperCase()) {
    case "BASIC":   return "bg-slate-200 text-slate-700";
    case "PRO":     return "bg-blue-100 text-blue-700";
    case "PREMIUM": return "bg-violet-100 text-violet-700";
    default:        return "bg-gray-200 text-gray-600";
  }
}



/* --- old static data removed ---
_REMOVED_ARRAY = [
  {
    id: 1,
    userName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    avatar: "SJ",
    plan: "Premium",
    status: "Active",
    startDate: "2025-09-01",
    endDate: "2026-09-01",
    paymentStatus: "Paid",
    amount: 79.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-09-01", event: "Subscription started – Premium Plan" },
      { date: "2025-08-20", event: "Upgraded from Pro to Premium" },
      { date: "2025-01-15", event: "Subscription started – Pro Plan" },
    ],
    payments: [
      { date: "2025-09-01", amount: 79.99, method: "Visa •••• 4242", status: "Paid" },
      { date: "2025-01-15", amount: 49.99, method: "Visa •••• 4242", status: "Paid" },
    ],
  },
  {
    id: 2,
    userName: "James Carter",
    email: "james.carter@email.com",
    avatar: "JC",
    plan: "Pro",
    status: "Active",
    startDate: "2025-11-15",
    endDate: "2026-11-15",
    paymentStatus: "Paid",
    amount: 49.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-11-15", event: "Subscription started – Pro Plan" },
    ],
    payments: [
      { date: "2025-11-15", amount: 49.99, method: "Mastercard •••• 7890", status: "Paid" },
    ],
  },
  {
    id: 3,
    userName: "Emily Zhang",
    email: "emily.zhang@email.com",
    avatar: "EZ",
    plan: "Basic",
    status: "Expired",
    startDate: "2024-12-01",
    endDate: "2025-12-01",
    paymentStatus: "Unpaid",
    amount: 19.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-12-01", event: "Subscription expired – Basic Plan" },
      { date: "2024-12-01", event: "Subscription started – Basic Plan" },
    ],
    payments: [
      { date: "2024-12-01", amount: 19.99, method: "PayPal", status: "Paid" },
    ],
  },
  {
    id: 4,
    userName: "Marcus Williams",
    email: "marcus.w@email.com",
    avatar: "MW",
    plan: "Premium",
    status: "Active",
    startDate: "2025-06-10",
    endDate: "2026-06-10",
    paymentStatus: "Paid",
    amount: 79.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-06-10", event: "Subscription started – Premium Plan" },
    ],
    payments: [
      { date: "2025-06-10", amount: 79.99, method: "Visa •••• 1111", status: "Paid" },
    ],
  },
  {
    id: 5,
    userName: "Layla Hassan",
    email: "layla.hassan@email.com",
    avatar: "LH",
    plan: "Pro",
    status: "Cancelled",
    startDate: "2025-03-20",
    endDate: "2025-09-20",
    paymentStatus: "Unpaid",
    amount: 49.99,
    renewalType: "Monthly",
    history: [
      { date: "2025-09-20", event: "Subscription cancelled" },
      { date: "2025-03-20", event: "Subscription started – Pro Plan" },
    ],
    payments: [
      { date: "2025-09-20", amount: 49.99, method: "Visa •••• 5678", status: "Unpaid" },
      { date: "2025-03-20", amount: 49.99, method: "Visa •••• 5678", status: "Paid" },
    ],
  },
  {
    id: 6,
    userName: "Noah Bennett",
    email: "noah.bennett@email.com",
    avatar: "NB",
    plan: "Basic",
    status: "Pending",
    startDate: "2026-02-25",
    endDate: "2027-02-25",
    paymentStatus: "Unpaid",
    amount: 19.99,
    renewalType: "Yearly",
    history: [
      { date: "2026-02-25", event: "Subscription pending – Basic Plan" },
    ],
    payments: [],
  },
  {
    id: 7,
    userName: "Chloe Martin",
    email: "chloe.martin@email.com",
    avatar: "CM",
    plan: "Premium",
    status: "Active",
    startDate: "2025-10-05",
    endDate: "2026-10-05",
    paymentStatus: "Paid",
    amount: 79.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-10-05", event: "Subscription started – Premium Plan" },
    ],
    payments: [
      { date: "2025-10-05", amount: 79.99, method: "Amex •••• 3456", status: "Paid" },
    ],
  },
  {
    id: 8,
    userName: "Ethan Nguyen",
    email: "ethan.nguyen@email.com",
    avatar: "EN",
    plan: "Pro",
    status: "Active",
    startDate: "2025-07-22",
    endDate: "2026-07-22",
    paymentStatus: "Paid",
    amount: 49.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-07-22", event: "Subscription started – Pro Plan" },
    ],
    payments: [
      { date: "2025-07-22", amount: 49.99, method: "Mastercard •••• 9999", status: "Paid" },
    ],
  },
  {
    id: 9,
    userName: "Amira Osei",
    email: "amira.osei@email.com",
    avatar: "AO",
    plan: "Basic",
    status: "Expired",
    startDate: "2024-08-01",
    endDate: "2025-08-01",
    paymentStatus: "Unpaid",
    amount: 19.99,
    renewalType: "Yearly",
    history: [
      { date: "2025-08-01", event: "Subscription expired – Basic Plan" },
      { date: "2024-08-01", event: "Subscription started – Basic Plan" },
    ],
    payments: [
      { date: "2024-08-01", amount: 19.99, method: "PayPal", status: "Paid" },
    ],
  },
  {
    id: 10,
    userName: "Luca Rossi",
    email: "luca.rossi@email.com",
    avatar: "LR",
    plan: "Pro",
    status: "Active",
    startDate: "2025-12-01",
    endDate: "2026-12-01",
    paymentStatus: "Paid",
    amount: 49.99,
    renewalType: "Monthly",
    history: [
      { date: "2025-12-01", event: "Subscription started – Pro Plan" },
    ],
    payments: [
      { date: "2026-02-01", amount: 49.99, method: "Visa •••• 2222", status: "Paid" },
      { date: "2026-01-01", amount: 49.99, method: "Visa •••• 2222", status: "Paid" },
      { date: "2025-12-01", amount: 49.99, method: "Visa •••• 2222", status: "Paid" },
    ],
  },
  {
    id: 11,
    userName: "Fatima Al-Rashid",
    email: "fatima.ar@email.com",
    avatar: "FA",
    plan: "Premium",
    status: "Cancelled",
    startDate: "2025-05-01",
    endDate: "2025-11-01",
    paymentStatus: "Unpaid",
    amount: 79.99,
    renewalType: "Monthly",
    history: [
      { date: "2025-11-01", event: "Subscription cancelled" },
      { date: "2025-05-01", event: "Subscription started – Premium Plan" },
    ],
    payments: [
      { date: "2025-11-01", amount: 79.99, method: "PayPal", status: "Unpaid" },
    ],
  },
  {
    id: 12,
    userName: "Diego Flores",
    email: "diego.flores@email.com",
    avatar: "DF",
    plan: "Basic",
    status: "Pending",
    startDate: "2026-03-01",
    endDate: "2027-03-01",
    paymentStatus: "Unpaid",
    amount: 19.99,
    renewalType: "Yearly",
    history: [
      { date: "2026-03-01", event: "Subscription pending – Basic Plan" },
    ],
    payments: [],
  },
];
--- */ 

const ITEMS_PER_PAGE = 8;

// ─────────────────────────────────────────────
// Badge components
// ─────────────────────────────────────────────
function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { cls: string; icon: React.ReactNode }> = {
    Paid:     { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: <CheckCircle size={12} /> },
    Expiring: { cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",    icon: <Clock size={12} /> },
    Expired:  { cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",   icon: <AlertCircle size={12} /> },
  };
  const { cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {icon} {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${planColor(plan)}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()}
    </span>
  );
}

function AvatarCircle({ sub }: { sub: SubscriptionRow }) {
  if (sub.image) {
    return (
      <Image
        src={sub.image}
        alt={sub.userName}
        width={36}
        height={36}
        className="size-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarBg(sub.plan)}`}>
      {sub.initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Summary Card
// ─────────────────────────────────────────────
function SummaryCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────
function DetailModal({
  sub,
  onClose,
}: {
  sub: SubscriptionRow;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"info" | "history">("info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AvatarCircle sub={sub} />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                {sub.userName}
              </h3>
              <p className="text-sm text-gray-400">{sub.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
          {(["info", "history"] as const).map((t) => {
            const labels = { info: "Subscription Info", history: "History" };
            const icons = {
              info: <BadgeCheck size={14} />,
              history: <History size={14} />,
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? "border-[#156d95] text-[#156d95]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {icons[t]} {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Info Tab ── */}
          {tab === "info" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name",       value: sub.userName,                          icon: <User       size={14} /> },
                { label: "Email",           value: sub.email,                             icon: <Mail       size={14} /> },
                { label: "Plan",            value: <PlanBadge plan={sub.plan} />,         icon: <Package    size={14} /> },
                { label: "Start Date",      value: formatDate(sub.date_debut),            icon: <Calendar   size={14} /> },
                { label: "End Date",        value: formatDate(sub.date_fin),              icon: <Calendar   size={14} /> },
                {
                  label: "Payment Status",
                  value: <PaymentBadge status={sub.paymentStatus} />,
                  icon: <CreditCard size={14} />,
                },
                { label: "Renewal", value: "Yearly",                                     icon: <RefreshCw  size={14} /> },
                { label: "Amount",  value: `$${sub.amount.toFixed(2)}`,                   icon: <DollarSign size={14} /> },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3.5"
                >
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1.5">
                    {icon}
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── History Tab (static placeholder) ── */}
          {tab === "history" && (
            <div className="relative pl-4">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600" />
              <ul className="space-y-5">
                <li className="relative pl-6">
                  <div className="absolute -left-1 top-1.5 size-2.5 rounded-full bg-[#156d95] ring-2 ring-white dark:ring-gray-800" />
                  <p className="text-xs text-gray-400 font-medium">{formatDate(sub.date_debut)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">
                    Subscription started – {sub.plan} Plan
                  </p>
                </li>
              </ul>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-700/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">
              <RefreshCw size={14} /> Renew Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "All">("All");
  const [planFilter, setPlanFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSub, setSelectedSub] = useState<SubscriptionRow | null>(null);

  // ── Fetch data from DB ──
  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => setSubscriptions(d.subscriptions ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  const [showFilters, setShowFilters] = useState(false);

  // ── Stats ──
  const total   = subscriptions.length;
  const active  = subscriptions.filter((s) => s.paymentStatus === "Paid").length;
  const expired = subscriptions.filter((s) => s.paymentStatus === "Expired").length;
  const monthlyRevenue = subscriptions
    .filter((s) => s.paymentStatus === "Paid")
    .reduce((acc, s) => acc + s.amount / 12, 0)
    .toFixed(2);

  // ── Unique plans for dropdown ──
  const uniquePlans = useMemo(
    () => [...new Set(subscriptions.map((s) => s.plan))],
    [subscriptions]
  );

  // ── Filtering ──
  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.userName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchPayment = paymentFilter === "All" || s.paymentStatus === paymentFilter;
      const matchPlan    = planFilter === "All" || s.plan === planFilter;
      const matchFrom    = !dateFrom || s.date_debut.slice(0, 10) >= dateFrom;
      const matchTo      = !dateTo   || s.date_fin.slice(0, 10)   <= dateTo;
      return matchSearch && matchPayment && matchPlan && matchFrom && matchTo;
    });
  }, [subscriptions, search, paymentFilter, planFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilterChange = () => setPage(1);

  const exportToCSV = () => {
    const headers = ["User Name", "Email", "Plan", "Start Date", "End Date", "Payment Status", "Amount"];
    const rows = filtered.map((s) => [
      s.userName,
      s.email,
      s.plan,
      formatDate(s.date_debut),
      formatDate(s.date_fin),
      s.paymentStatus,
      `$${s.amount.toFixed(2)}`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6" style={{ fontFamily: "Satoshi, sans-serif" }}>
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <span>Admin</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Subscriptions</span>
        </nav>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subscriptions Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage all user subscription plans
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
            <Calendar size={13} />
            Last updated: March 2, 2026
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Subscriptions"
            value={total}
            sub={`${filtered.length} matching current filters`}
            icon={<Users size={22} className="text-[#156d95]" />}
            accent="bg-[#eaf4f9] dark:bg-[#156d95]/20"
          />
          <SummaryCard
            title="Active Subscriptions"
            value={active}
            sub={total > 0 ? `${((active / total) * 100).toFixed(0)}% of all subscriptions` : "–"}
            icon={<CheckCircle size={22} className="text-emerald-600" />}
            accent="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <SummaryCard
            title="Expired Subscriptions"
            value={expired}
            sub="Require renewal attention"
            icon={<AlertCircle size={22} className="text-orange-500" />}
            accent="bg-orange-50 dark:bg-orange-900/20"
          />
          <SummaryCard
            title="Monthly Revenue"
            value={`$${monthlyRevenue}`}
            sub="From active subscriptions"
            icon={<TrendingUp size={22} className="text-violet-600" />}
            accent="bg-violet-50 dark:bg-violet-900/20"
          />
        </div>

        {/* ── Table Card ── */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#156d95]/30 focus:border-[#156d95] transition"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    showFilters
                      ? "border-[#156d95] text-[#156d95] bg-[#eaf4f9] dark:bg-[#156d95]/20"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <Filter size={14} />
                  Filters
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>
                <span className="px-2.5 py-1 rounded-full bg-[#eaf4f9] dark:bg-[#156d95]/20 text-[#156d95] text-xs font-bold">
                  {filtered.length}
                </span>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  title="Export filtered results to CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Payment Status */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                    Payment Status
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => { setPaymentFilter(e.target.value as PaymentStatus | "All"); handleFilterChange(); }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#156d95]/30 focus:border-[#156d95] transition"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Expiring">Expiring</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                {/* Plan */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                    Plan
                  </label>
                  <select
                    value={planFilter}
                    onChange={(e) => { setPlanFilter(e.target.value); handleFilterChange(); }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#156d95]/30 focus:border-[#156d95] transition"
                  >
                    <option value="All">All Plans</option>
                    {uniquePlans.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#156d95]/30 focus:border-[#156d95] transition"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                    End Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#156d95]/30 focus:border-[#156d95] transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-700/30">
                  {[
                    "User",
                    "Plan",
                    "Start Date",
                    "End Date",
                    "Payment",
                    "Amount",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <RefreshCw size={28} className="mx-auto mb-3 opacity-30 animate-spin" />
                      <p className="text-sm font-medium">Loading subscriptions…</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">
                      <Search size={36} className="mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-medium">No subscriptions match your filters</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <AvatarCircle sub={sub} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {sub.userName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{sub.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <PlanBadge plan={sub.plan} />
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(sub.date_debut)}
                      </td>

                      {/* End Date */}
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(sub.date_fin)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={sub.paymentStatus} />
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        ${sub.amount.toFixed(2)}
                        <span className="ml-1 text-xs text-gray-400 font-normal">/yr</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedSub(sub)}
                            title="View Details"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#156d95] bg-[#eaf4f9] dark:bg-[#156d95]/20 hover:bg-[#156d95] hover:text-white transition-colors"
                          >
                            <Eye size={13} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {filtered.length}
              </span>{" "}
              subscriptions
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-[#156d95] hover:text-[#156d95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    p === page
                      ? "bg-[#156d95] text-white shadow-sm"
                      : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#156d95] hover:text-[#156d95]"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-[#156d95] hover:text-[#156d95] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedSub && (
        <DetailModal sub={selectedSub} onClose={() => setSelectedSub(null)} />
      )}

    </AdminLayout>
  );
}
