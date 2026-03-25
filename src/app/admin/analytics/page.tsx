"use client";

import React, { useState, useEffect } from "react";

import dynamic from "next/dynamic";
import {
    Users,
    UserCheck,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Briefcase,
    Activity,
    Zap,
    ShieldCheck,
    AlertCircle,
    Download,
    Filter,
    Calendar,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Search
} from "lucide-react";

import { AdminLayout } from "@/app/ui/AdminLayout";
import { motion } from "framer-motion";
import { ApexOptions } from "apexcharts";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

// --- Mock Data ---

const KPI_STATS = [
    {
        label: "Total Users",
        value: "142,593",
        trend: "+12.5%",
        isPositive: true,
        icon: Users,
        color: "bg-blue-500",
        description: "Total registered accounts"
    },
    {
        label: "Active Users",
        value: "28,491",
        trend: "+3.2%",
        isPositive: true,
        icon: UserCheck,
        color: "bg-emerald-500",
        description: "DAU: Daily Active Users"
    },
    {
        label: "Monthly Revenue",
        value: "$42,670",
        trend: "+18.4%",
        isPositive: true,
        icon: DollarSign,
        color: "bg-violet-500",
        description: "Subscription & One-time revenue"
    },
    {
        label: "Conversion Rate",
        value: "4.2%",
        trend: "-0.5%",
        isPositive: false,
        icon: Activity,
        color: "bg-amber-500",
        description: "Visitor to Premium conversion"
    },
];

const ANALYTICS_DATA = {
    userGrowthSeries: [
        {
            name: "New Users",
            data: [310, 440, 280, 510, 420, 1090, 1000, 1200, 1100, 1400, 1450, 1700],
        },
        {
            name: "Active Users",
            data: [1100, 3200, 4500, 3200, 3400, 5200, 4100, 4900, 5100, 6000, 6200, 7100],
        },
    ],
    revenueSeries: [
        {
            name: "Revenue",
            data: [12000, 15000, 18000, 17000, 21000, 25000, 30000, 32000, 35000, 38000, 40000, 42670],
        },
    ],
    subscriptionDistribution: [45, 25, 30], // Free, Pro, Enterprise
    engagementHeatmap: [
        { name: "Mon", data: [10, 20, 40, 50, 60, 80, 40, 30] },
        { name: "Tue", data: [20, 30, 50, 60, 70, 90, 50, 40] },
        { name: "Wed", data: [30, 40, 60, 70, 80, 100, 60, 50] },
        { name: "Thu", data: [20, 30, 50, 60, 70, 90, 50, 40] },
        { name: "Fri", data: [40, 50, 70, 80, 90, 110, 70, 60] },
        { name: "Sat", data: [50, 60, 80, 90, 100, 120, 80, 70] },
        { name: "Sun", data: [60, 70, 90, 100, 110, 130, 90, 80] },
    ]
};

// --- Chart Options ---

const lineChartOptions: ApexOptions = {
    chart: {
        type: "area",
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: "inherit",
        zoom: { enabled: false },
    },
    stroke: { curve: "smooth", width: 3 },
    fill: {
        type: "gradient",
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [20, 100],
        },
    },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 5, borderColor: "rgba(100, 116, 139, 0.1)" },
    colors: ["#6366f1", "#10b981"],
    xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#64748b" } } },
    legend: { position: "top", horizontalAlign: "right" },
};

const donutOptions: ApexOptions = {
    chart: { type: "donut", background: 'transparent', fontFamily: "inherit" },
    labels: ["Essential", "Premium", "Luxury"],
    colors: ["#94a3b8", "#6366f1", "#f59e0b"],
    plotOptions: {
        pie: {
            donut: {
                size: "75%",
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: "Total Subs",
                        formatter: (w: any) => {
                            const total = w?.globals?.seriesTotals?.reduce((a: number, b: number) => a + b, 0);
                            return total !== undefined ? total.toLocaleString() : "...";
                        },
                    },

                },
            },
        },
    },
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
};


// --- Components ---

const StatCard = ({ stat, index }: { stat: typeof KPI_STATS[0], index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg shadow-${stat.color.split('-')[1]}-200 dark:shadow-none`}>
                <stat.icon className="w-6 h-6" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${stat.isPositive ? "text-emerald-500" : "text-amber-500"}`}>
                {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.trend}
            </div>
        </div>
        <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">{stat.label}</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{stat.description}</p>
        </div>
    </motion.div>
);

export default function AnalyticsPage() {
    const [dateRange] = useState("Last 30 Days");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/admin/stats");
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching analytics stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const kpiStats = [
        {
            label: "Total Users",
            value: stats?.totalUsers?.toLocaleString() || "0",
            trend: "+12.5%",
            isPositive: true,
            icon: Users,
            color: "bg-blue-500",
            description: "Total registered accounts"
        },
        {
            label: "Active Users",
            value: (stats?.totalUsers ? Math.floor(stats.totalUsers * 0.2) : 28).toLocaleString(),
            trend: "+3.2%",
            isPositive: true,
            icon: UserCheck,
            color: "bg-emerald-500",
            description: "DAU: Daily Active Users"
        },
        {
            label: "Monthly Revenue",
            value: `$${(stats?.totalSubscriptions ? stats.totalSubscriptions * 89 : 42670).toLocaleString()}`,
            trend: "+18.4%",
            isPositive: true,
            icon: DollarSign,
            color: "bg-violet-500",
            description: "Subscription & One-time revenue"
        },
        {
            label: "Conversion Rate",
            value: "4.2%",
            trend: "-0.5%",
            isPositive: false,
            icon: Activity,
            color: "bg-amber-500",
            description: "Visitor to Premium conversion"
        },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[600px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Admin</span>
                    <ChevronRight size={14} />
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Platform Analytics</span>
                </nav>


                {/* Header & Global Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Platform Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Comprehensive insights into DeepSkyn network performance.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                {dateRange}
                                <ChevronDown className="w-4 h-4 opacity-50" />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all">
                            <Filter className="w-4 h-4 text-amber-500" />
                            More Filters
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.05] active:scale-[0.95] transition-all">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiStats.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat as any} index={i} />
                    ))}
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Growth & Revenue Section */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">User Growth Trends</h2>
                                    <p className="text-sm text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">Engagement vs New Acquisition</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> New</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Active</div>
                                </div>
                            </div>
                            <div className="h-[400px]">
                                <Chart
                                    options={lineChartOptions}
                                    series={stats?.userGrowthSeries || []}
                                    type="area"
                                    height="100%"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Subscriptions</h3>
                                <div className="h-[300px]">
                                    {(stats?.subscriptionDistribution?.reduce((a: number, b: number) => a + b, 0) || 0) > 0 ? (
                                        <Chart
                                            options={donutOptions}
                                            series={stats?.subscriptionDistribution}
                                            type="donut"
                                            height={300}
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 italic font-medium">
                                            No subscription data found
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="bg-indigo-900 dark:bg-indigo-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <div className="p-3 bg-white/10 w-fit rounded-2xl mb-6">
                                        <Zap className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white leading-tight">AI Success Insight</h3>
                                    <p className="text-indigo-200 mt-4 text-lg font-medium leading-relaxed">
                                        Personalized routine recommendations led to a <span className="text-white font-black underline">14.2% increase</span> in user retention this month.
                                    </p>
                                    <button className="mt-8 flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs hover:gap-4 transition-all group-hover:text-amber-400">
                                        Full AI Report <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* System Health */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-indigo-500" />
                                System Health
                            </h3>

                            <div className="space-y-6">
                                {[
                                    { label: "API Gateway", status: "Operational", color: "text-emerald-500", icon: Activity },
                                    { label: "AI Model Sync", status: "Operational", color: "text-emerald-500", icon: Zap },
                                    { label: "Database Latency", status: "32ms", color: "text-blue-500", icon: Activity },
                                    { label: "Worker Jobs", status: "Active (24)", color: "text-amber-500", icon: Activity },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl group hover:bg-white dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                                <item.icon className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smart Alerts */}
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-8">
                            <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" /> Critical Alerts (2)
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 rounded-[24px] shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">High Churn</span>
                                        <span className="text-[10px] text-gray-400 font-bold">2h ago</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Churn rate increased by 2.4% for 'Expert Plan' users in Germany.</p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-3 hover:underline">Investigate Case</button>
                                </div>

                                <div className="p-4 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 rounded-[24px] shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Payment Fail</span>
                                        <span className="text-[10px] text-gray-400 font-bold">4h ago</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Increased Stripe errors detected for EU transactions.</p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-3 hover:underline">Check Logs</button>
                                </div>
                            </div>
                        </div>

                        {/* Platform Engagement Table Card (Preview) */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Live Activity</h3>
                                <MoreVertical className="w-5 h-5 text-gray-300" />
                            </div>
                            <div className="space-y-4">
                                {[
                                    { user: "User #1293", action: "Completed Morning Routine", time: "Just now" },
                                    { user: "User #8821", action: "Upgraded to Pro", time: "3m ago" },
                                    { user: "User #4502", action: "Added New Product", time: "8m ago" },
                                ].map((act, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div>
                                            <span className="font-black text-indigo-600 block">{act.user}</span>
                                            <span className="font-medium text-gray-400 text-[10px]">{act.action}</span>
                                        </div>
                                        <span className="font-bold text-gray-300 italic">{act.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </AdminLayout>
    );
}


function MoreVertical(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    );
}
