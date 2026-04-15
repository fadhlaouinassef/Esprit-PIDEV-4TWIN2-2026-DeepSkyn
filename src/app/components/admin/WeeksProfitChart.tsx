
"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

type PropsType = {
    data: {
        sales: { x: string; y: number }[];
        revenue: { x: string; y: number }[];
    };
};

const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

export function WeeksProfitChart({ data }: PropsType) {
    const t = useTranslations();
    const options: ApexOptions = {
        colors: ["#5750F1", "#0ABEF9"],
        chart: {
            type: "bar",
            stacked: true,
            background: 'transparent',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },

        responsive: [
            {
                breakpoint: 1536,
                options: {
                    plotOptions: {
                        bar: {
                            borderRadius: 3,
                            columnWidth: "25%",
                        },
                    },
                },
            },
        ],
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 3,
                columnWidth: "25%",
                borderRadiusApplication: "end",
                borderRadiusWhenStacked: "last",
            },
        },
        dataLabels: {
            enabled: false,
        },

        grid: {
            strokeDashArray: 5,
            xaxis: {
                lines: {
                    show: false,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },

        xaxis: {
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        legend: {
            position: "top",
            horizontalAlign: "left",
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: "14px",
            markers: {
                size: 9,
                shape: "circle",
            },
        },
        fill: {
            opacity: 1,
        },
    };
    if (!data) return <div className="h-[370px] flex items-center justify-center text-sm italic text-gray-400">{t('components.weeksProfitChart.loadingData')}</div>;

    return (
        <div className="-ml-3.5 mt-3">
            <Chart
                options={options}
                series={[
                    {
                        name: t('components.weeksProfitChart.series.sales'),
                        data: data.sales || [],
                    },
                    {
                        name: t('components.weeksProfitChart.series.revenue'),
                        data: data.revenue || [],
                    },
                ]}
                type="bar"
                height={370}
            />
        </div>
    );

}
