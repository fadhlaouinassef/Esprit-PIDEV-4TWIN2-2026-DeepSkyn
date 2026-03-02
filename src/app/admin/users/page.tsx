"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Trash2,
  CheckCircle,
  Download,
  UserPlus,
  X,
  Search,
  ImageDown,
} from "lucide-react";

interface User {
  id: number;
  email: string;
  nom?: string | null;
  role: string;
  verified: boolean;
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {pageName}
      </h2>
      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <a
              className="font-medium text-gray-500 hover:text-[#156d95]"
              href="/admin"
            >
              Dashboard /
            </a>
          </li>
          <li className="font-medium text-[#156d95]">{pageName}</li>
        </ol>
      </nav>
    </div>
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
            (mode === "add" ? "Échec de la création" : "Échec de la mise à jour")
          );
        onSaved();
        onClose();
        return data;
      })
      .finally(() => setSaving(false));

    toast.promise(promise, {
      loading:
        mode === "add"
          ? "Création de l'utilisateur…"
          : `Mise à jour de ${form.nom || form.email}…`,
      success:
        mode === "add"
          ? "✅ Utilisateur créé avec succès"
          : `✅ ${form.nom || form.email} mis à jour`,
      error: (err: unknown) =>
        err instanceof Error ? err.message : "Une erreur est survenue",
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
// Modal confirmation de suppression
// ──────────────────────────────────────────
interface DeleteModalProps {
  user: User;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteModal({ user, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      onDeleted();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Delete User
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to delete{" "}
          <strong className="text-gray-900 dark:text-white">
            {user.nom || user.email}
          </strong>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
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
  const barChartRef = useRef<HTMLDivElement>(null);

  const [addModal, setAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);

  const [verifyingId, setVerifyingId] = useState<number | null>(null);

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

  // ── Vérifier un utilisateur ──
  const handleVerify = (user: User) => {
    // Redirige vers la page de vérification dédiée
    router.push('/admin/users/verify');
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

  const statusData = [
    { name: "Verified", value: users.filter((u) => u.verified).length },
    { name: "Unverified", value: users.filter((u) => !u.verified).length },
  ];

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

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Donut Rôles */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Users by Role
              </h3>
              <button
                onClick={() => downloadChart(pieChartRef, "roles_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={pieChartRef} className="bg-white">
              <ResponsiveContainer width="100%" height={200}>
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

          {/* Barre Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Verification Status
              </h3>
              <button
                onClick={() => downloadChart(barChartRef, "status_chart")}
                title="Download chart as PNG"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#156d95] transition-colors"
              >
                <ImageDown className="w-4 h-4" />
              </button>
            </div>
            <div ref={barChartRef} className="bg-white">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? "#10b981" : "#f59e0b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
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
                          onClick={() => handleVerify(user)}
                          disabled={verifyingId === user.id}
                          title="Cliquer pour vérifier ce compte"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors cursor-pointer border border-orange-200 dark:border-orange-700 disabled:opacity-60 disabled:cursor-wait"
                        >
                          {verifyingId === user.id ? (
                            <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {verifyingId === user.id ? "Envoi…" : "Unverified – Verify"}
                        </button>
                      )}
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
                          onClick={() => setDeleteUserModal(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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
      {deleteUserModal && (
        <DeleteModal
          user={deleteUserModal}
          onClose={() => setDeleteUserModal(null)}
          onDeleted={fetchUsers}
        />
      )}
    </AdminLayout>
  );
}
