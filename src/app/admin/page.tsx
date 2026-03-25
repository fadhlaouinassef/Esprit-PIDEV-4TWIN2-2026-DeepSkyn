
"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { PaymentsOverviewChart } from "@/app/components/admin/PaymentsOverviewChart";
import { WeeksProfitChart } from "@/app/components/admin/WeeksProfitChart";
import { DonutChart } from "@/app/components/admin/DonutChart";
import { RegionLabels } from "@/app/components/admin/RegionLabels";

import { Users, CreditCard, TrendingUp, DollarSign } from "lucide-react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/admin/stats");
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    const kpiCards = [
        {
            title: "Total Users",
            value: stats?.totalUsers?.toLocaleString() || "0",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: "+12.5% vs last month"
        },
        {
            title: "Active Subscriptions",
            value: stats?.totalSubscriptions?.toLocaleString() || "0",
            icon: CreditCard,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: "Real-time from DB"
        },
        {
            title: "Growth Trends",
            value: stats?.userGrowthSeries?.[0]?.data?.slice(-1)?.[0]?.toLocaleString() || "0",
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-50",
            trend: "New users this month"
        },
        {
            title: "Est. Revenue",
            value: `$${(stats?.paymentsData?.received?.reduce((acc: any, curr: any) => acc + curr.y, 0) || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-50",
            trend: "Total current period"
        }
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Monitoring real-time performance and user growth.</p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiCards.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">{card.title}</h3>
                                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{card.value}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 italic">{card.trend}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* First Row: 2/3 + 1/3 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2/3 width - Payments Overview */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payments Overview</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Real statistics from database</p>
                            </div>
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-black">
                                LAST 9 MONTHS
                            </span>
                        </div>
                        <PaymentsOverviewChart data={stats?.paymentsData} />
                    </div>

                    {/* 1/3 width - Weeks Profit */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Weekly Profit</h2>
                        <WeeksProfitChart data={stats?.profitData} />
                    </div>
                </div>

                {/* Second Row: 1/3 + 2/3 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Visitors by Country</h2>
                        <DonutChart data={stats?.donutData} />
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[32px] shadow-sm p-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <RegionLabels data={stats?.donutData} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}


