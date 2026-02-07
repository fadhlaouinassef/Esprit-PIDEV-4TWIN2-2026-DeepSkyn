"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { compactFormat } from "@/lib/format-number";

const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface User {
    name: string;
    visitors: number;
    revenues: number;
    sales: number;
    conversion: number;
}

interface UserChartsProps {
    users: User[];
}

export function UserCharts({ users }: UserChartsProps) {
    const visitorOptions: ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        colors: ["#5750F1"],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: "40%",
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: users.map(u => u.name),
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val) => compactFormat(val),
            },
        },
        grid: {
            strokeDashArray: 5,
        },
    };

    const revenueOptions: ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: "inherit",
        },
        colors: ["#5750F1", "#0ABEF9", "#FFA70B", "#259AE6", "#F095EE"],
        labels: users.map(u => u.name),
        dataLabels: { enabled: false },
        legend: {
            position: "bottom",
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "70%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total Revenue",
                            formatter: () => {
                                const total = users.reduce((acc, curr) => acc + curr.revenues, 0);
                                return `$${compactFormat(total)}`;
                            },
                        },
                    },
                },
            },
        },
    };

    const visitorSeries = [
        {
            name: "Visitors",
            data: users.map(u => u.visitors),
        },
    ];

    const revenueSeries = users.map(u => u.revenues);

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Visitors by User</h3>
                <div className="h-[300px]">
                    <Chart
                        options={visitorOptions}
                        series={visitorSeries}
                        type="bar"
                        height="100%"
                    />
                </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Revenue Distribution</h3>
                <div className="h-[300px] flex items-center justify-center">
                    <Chart
                        options={revenueOptions}
                        series={revenueSeries}
                        type="donut"
                        height="100%"
                    />
                </div>
            </div>
        </div>
    );
}
