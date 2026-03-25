"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MonthlyRegistrationsChart } from "@/app/components/admin/MonthlyRegistrationsChart";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Pencil,
  CheckCircle,
  Download,
  UserPlus,
  X,
  Search,
  ImageDown,
  PowerOff,
  Power,
  ChevronRight,
} from "lucide-react";



interface User {
  id: number;
  email: string;
  nom?: string | null;
  role: string;
  verified: boolean;
  activated: boolean;
  created_at: Date;
  age?: number | null;
  sexe?: string | null;
  skin_type?: string | null;
  image?: string | null;
}

// ──────────────────────────────────────────
// Breadcrumb
// ──────────────────────────────────────────
function Breadcrumb({ pageName }: { pageName: string }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
      <span>Admin</span>
      <ChevronRight size={14} />
      <span className="text-gray-700 dark:text-gray-200 font-medium">{pageName}</span>
    </nav>
  );
}


// ──────────────────────────────────────────
// Modal Ajout / Édition
// ──────────────────────────────────────────
interface ModalFormData {
  nom: string;
  email: string;
  role: string;
  verified: boolean;
  age: string;
  sexe: string;
  password?: string;
}

const EMPTY_FORM: ModalFormData = {
  nom: "",
  email: "",
  role: "USER",
  verified: false,
  age: "",
  sexe: "",
  password: "",
};

interface UserModalProps {
  mode: "add" | "edit";
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ mode, user, onClose, onSaved }: UserModalProps) {
  const [form, setForm] = useState<ModalFormData>(
    user
      ? {
        nom: user.nom || "",
        email: user.email,
        role: user.role,
        verified: user.verified,
        age: user.age?.toString() || "",
        sexe: user.sexe || "",
      }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fetchOp =
      mode === "add"
        ? fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: form.nom,
            email: form.email,
            role: form.role,
            verified: form.verified,
            age: form.age ? parseInt(form.age) : undefined,
            sexe: form.sexe || undefined,
            password: form.password,
          }),
        })
        : fetch(`/api/users/${user!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: form.nom,
            email: form.email,
            role: form.role,
            verified: form.verified,
            age: form.age ? parseInt(form.age) : undefined,
            sexe: form.sexe || undefined,
          }),
        });

    const promise = fetchOp
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            data.error ||
            (mode === "add" ? "Failed to create user" : "Failed to update user")
          );
        onSaved();
        onClose();
        return data;
      })
      .finally(() => setSaving(false));

    toast.promise(promise, {
      loading:
        mode === "add"
          ? "Creating user…"
          : `Updating ${form.nom || form.email}…`,
      success:
        mode === "add"
          ? "✅ User created successfully"
          : `✅ ${form.nom || form.email} updated`,
      error: (err: unknown) =>
        err instanceof Error ? err.message : "An error occurred",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === "add" ? "Add New User" : "Edit User"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
                placeholder="user@example.com"
              />
            </div>
          </div>

          {mode === "add" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
                placeholder="Minimum 8 characters"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
              >
                <option value="USER">USER</option>
                <option value="PREMIUM_USER">PREMIUM_USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age
              </label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
                placeholder="Age"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <select
              name="sexe"
              value={form.sexe}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
            >
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="verified"
              name="verified"
              type="checkbox"
              checked={form.verified}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-[#156d95]"
            />
            <label
              htmlFor="verified"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account Verified
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#156d95] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a87b8] disabled:opacity-60 transition-colors"
            >
              {saving
                ? "Saving..."
                : mode === "add"
                  ? "Create User"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Activate / Deactivate confirmation modal
// ──────────────────────────────────────────
interface ToggleActivationModalProps {
  user: User;
  targetState: boolean; // true = activate, false = deactivate
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ToggleActivationModal({
  user,
  targetState,
  onClose,
  onConfirm,
  loading,
}: ToggleActivationModalProps) {
  const isDeactivating = !targetState;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isDeactivating
                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
            }`}
          >
            {isDeactivating ? <PowerOff size={20} /> : <Power size={20} />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isDeactivating ? "Deactivate Account" : "Activate Account"}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isDeactivating ? (
            <>
              Are you sure you want to{" "}
              <strong className="text-red-600">deactivate</strong> the account of{" "}
              <strong className="text-gray-900 dark:text-white">
                {user.nom || user.email}
              </strong>
              ? The user will no longer be able to sign in.
            </>
          ) : (
            <>
              Activate the account of{" "}
              <strong className="text-gray-900 dark:text-white">
                {user.nom || user.email}
              </strong>
              ? The user will be able to sign in again.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
              isDeactivating
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isDeactivating ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Couleurs des rôles
// ──────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#7c3aed",
  PREMIUM_USER: "#d97706",
  USER: "#156d95",
};

const CHART_COLORS = ["#156d95", "#10b981", "#f59e0b", "#ef4444", "#7c3aed"];

// ──────────────────────────────────────────
// Page principale
// ──────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const router = useRouter();

  const pieChartRef = useRef<HTMLDivElement>(null);
  const accountStatusChartRef = useRef<HTMLDivElement>(null);
  const ageChartRef = useRef<HTMLDivElement>(null);
  const monthlyChartRef = useRef<HTMLDivElement>(null);

  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [toggleActivationUser, setToggleActivationUser] = useState<{
    user: User;
    targetState: boolean;
  } | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setFiltered(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          (u.nom || "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  // ── Verify a user ──
  const handleVerify = () => {
    router.push('/admin/users/verify');
  };

  // ── Toggle account activation ──
  const doToggleActivation = async (user: User, activated: boolean) => {
    setActivatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      await fetchUsers();
      toast.success(
        activated
          ? `✅ ${user.nom || user.email}’s account activated`
          : `🚫 ${user.nom || user.email}’s account deactivated`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActivatingId(null);
      setToggleActivationUser(null);
    }
  };

  const handleToggleActivation = (user: User) => {
    setToggleActivationUser({ user, targetState: !user.activated });
  };

  // ── Export CSV ──
  const downloadCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Role",
      "Status",
      "Age",
      "Gender",
      "Joined",
    ];
    const rows = filtered.map((u) => [
      u.id,
      u.nom || "",
      u.email,
      u.role,
      u.verified ? "Verified" : "Unverified",
      u.age || "",
      u.sexe || "",
      new Date(u.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Téléchargement chart via SVG (évite le bug oklch/lab de html2canvas) ──
  const downloadChart = (
    ref: React.RefObject<HTMLDivElement | null>,
    name: string
  ) => {
    if (!ref.current) return;

    // Recharts génère du SVG natif → on le capture directement
    const svgEl = ref.current.querySelector("svg");
    if (!svgEl) return;

    // Cloner pour éviter de modifier l'original
    const clone = svgEl.cloneNode(true) as SVGSVGElement;

    // Dimensions réelles
    const width = svgEl.getBoundingClientRect().width || 500;
    const height = svgEl.getBoundingClientRect().height || 300;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    // Ajouter un fond blanc explicite
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    const svgStr = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${name}_${new Date().toISOString().split("T")[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // ── Données charts ──
  const roleData = Object.entries(
    users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const accountStatusData = [
    { name: "Active", value: users.filter((u) => u.activated).length },
    { name: "Inactive", value: users.filter((u) => !u.activated).length },
  ];

  const ageGroupData = [
    { range: "<18", count: users.filter((u) => u.age !== null && u.age !== undefined && u.age < 18).length },
    { range: "18–25", count: users.filter((u) => u.age !== null && u.age !== undefined && u.age >= 18 && u.age <= 25).length },
    { range: "26–35", count: users.filter((u) => u.age !== null && u.age !== undefined && u.age >= 26 && u.age <= 35).length },
    { range: "36–50", count: users.filter((u) => u.age !== null && u.age !== undefined && u.age >= 36 && u.age <= 50).length },
    { range: "50+", count: users.filter((u) => u.age !== null && u.age !== undefined && u.age > 50).length },
  ];

  const monthlyData = (() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const d = new Date(u.created_at);
      const key = d.toLocaleDateString("en", { year: "2-digit", month: "short" });
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => new Date(`01 ${a[0]}`).getTime() - new Date(`01 ${b[0]}`).getTime())
      .slice(-8)
      .map(([month, count]) => ({ month, count }));
  })();

  // ──────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#156d95] mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading users...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">
          <Breadcrumb pageName="Users" />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6 space-y-6">
        <Breadcrumb pageName="Users Management" />

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Users",
              value: users.length,
              color: "text-gray-900 dark:text-white",
            },
            {
              label: "Verified",
              value: users.filter((u) => u.verified).length,
              color: "text-green-600",
            },
            {
              label: "Unverified",
              value: users.filter((u) => !u.verified).length,
              color: "text-orange-500",
            },
            {
              label: "Admins",
              value: users.filter((u) => u.role === "ADMIN").length,
              color: "text-purple-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Ligne 1 : Monthly Registrations (2/3) + Users by Role (1/3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Monthly Registrations – 2/3 */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Monthly Registrations</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Updated {new Date().toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => downloadChart(monthlyChartRef, "monthly_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={monthlyChartRef}>
              <MonthlyRegistrationsChart
                data={monthlyData.map((d) => ({ x: d.month, y: d.count }))}
              />
            </div>
          </div>

          {/* Users by Role – 1/3 */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Users by Role</h3>
              <button
                onClick={() => downloadChart(pieChartRef, "roles_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={pieChartRef} className="bg-white">
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          ROLE_COLORS[entry.name] ||
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Ligne 2 : Age Groups (1/3) + Account Status (2/3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Age Groups – 1/3 */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Age Groups</h3>
              <button
                onClick={() => downloadChart(ageChartRef, "age_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={ageChartRef} className="bg-white">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ageGroupData.map((entry, index) => (
                      <Cell key={entry.range} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Account Status – 2/3 */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Account Status</h3>
              <button
                onClick={() => downloadChart(accountStatusChartRef, "account_status_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={accountStatusChartRef} className="bg-white">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={accountStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or role…"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#156d95]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setAddModal(true)}
                className="flex items-center gap-2 rounded-lg bg-[#156d95] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a87b8] transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  {[
                    "User",
                    "Email",
                    "Role",
                    "Status",
                    "Account",
                    "Age",
                    "Gender",
                    "Joined",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Avatar + Nom */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.nom || user.email}
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-[#156d95] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(user.nom || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.nom || "—"}
                          </p>
                          <p className="text-xs text-gray-400">#{user.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                          : user.role === "PREMIUM_USER"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Status – cliquable si Unverified */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {user.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerify()}
                          title="Cliquer pour vérifier ce compte"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors cursor-pointer border border-orange-200 dark:border-orange-700"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Unverified – Verify
                        </button>
                      )}
                    </td>

                    {/* Activation compte */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivation(user)}
                        disabled={activatingId === user.id}
                        title={user.activated ? "Click to deactivate" : "Click to activate"}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border disabled:opacity-60 disabled:cursor-wait ${
                          user.activated
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 border-emerald-200 dark:border-emerald-700"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 border-red-200 dark:border-red-700"
                        }`}
                      >
                        {activatingId === user.id ? (
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : user.activated ? (
                          <Power className="w-3 h-3" />
                        ) : (
                          <PowerOff className="w-3 h-3" />
                        )}
                        {activatingId === user.id
                          ? "Updating…"
                          : user.activated
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.age || "—"}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.sexe || "—"}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditUser(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#156d95]/10 hover:text-[#156d95] transition-all"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActivation(user)}
                          disabled={activatingId === user.id}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-60 ${
                            user.activated
                              ? "text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-500 dark:hover:bg-green-900/30"
                          }`}
                          title={user.activated ? "Deactivate account" : "Activate account"}
                        >
                          {activatingId === user.id ? (
                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : user.activated ? (
                            <PowerOff size={15} />
                          ) : (
                            <Power size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-gray-400 dark:text-gray-500">
                  {search
                    ? "No users match your search."
                    : "No users found."}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-3">
            <p className="text-xs text-gray-400">
              Showing <strong>{filtered.length}</strong> of{" "}
              <strong>{users.length}</strong> users
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {addModal && (
        <UserModal
          mode="add"
          onClose={() => setAddModal(false)}
          onSaved={fetchUsers}
        />
      )}
      {editUser && (
        <UserModal
          mode="edit"
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={fetchUsers}
        />
      )}
      {toggleActivationUser && (
        <ToggleActivationModal
          user={toggleActivationUser.user}
          targetState={toggleActivationUser.targetState}
          loading={activatingId === toggleActivationUser.user.id}
          onClose={() => setToggleActivationUser(null)}
          onConfirm={() =>
            doToggleActivation(
              toggleActivationUser.user,
              toggleActivationUser.targetState
            )
          }
        />
      )}
    </AdminLayout>
  );
}
