
import { AdminLayout } from "@/app/ui/AdminLayout";
import { PaymentsOverviewChart } from "@/app/components/admin/PaymentsOverviewChart";
import { WeeksProfitChart } from "@/app/components/admin/WeeksProfitChart";
import { DonutChart } from "@/app/components/admin/DonutChart";
import { RegionLabels } from "@/app/components/admin/RegionLabels";

export default function AdminDashboard() {
    const donutData = [
        { name: "France", amount: 45000 },
        { name: "USA", amount: 35000 },
        { name: "Italy", amount: 15000 },
        { name: "Others", amount: 5000 },
    ];

    const paymentsData = {
        received: [
            { x: "Jan", y: 30 },
            { x: "Feb", y: 40 },
            { x: "Mar", y: 35 },
            { x: "Apr", y: 50 },
            { x: "May", y: 49 },
            { x: "Jun", y: 60 },
            { x: "Jul", y: 70 },
            { x: "Aug", y: 91 },
            { x: "Sep", y: 125 },
        ],
        due: [
            { x: "Jan", y: 20 },
            { x: "Feb", y: 30 },
            { x: "Mar", y: 25 },
            { x: "Apr", y: 40 },
            { x: "May", y: 39 },
            { x: "Jun", y: 50 },
            { x: "Jul", y: 60 },
            { x: "Aug", y: 81 },
            { x: "Sep", y: 105 },
        ],
    };

    const profitData = {
        sales: [
            { x: "Mon", y: 44 },
            { x: "Tue", y: 55 },
            { x: "Wed", y: 41 },
            { x: "Thu", y: 67 },
            { x: "Fri", y: 22 },
            { x: "Sat", y: 43 },
            { x: "Sun", y: 21 },
        ],
        revenue: [
            { x: "Mon", y: 13 },
            { x: "Tue", y: 23 },
            { x: "Wed", y: 20 },
            { x: "Thu", y: 8 },
            { x: "Fri", y: 13 },
            { x: "Sat", y: 27 },
            { x: "Sun", y: 33 },
        ],
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold mb-1">Dashboard Overview</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and monitor your business analytics.</p>
                </div>

                {/* First Row: 2/3 + 1/3 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 2/3 width - Payments Overview */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">Payments Overview</h2>
                        <PaymentsOverviewChart data={paymentsData} />
                    </div>

                    {/* 1/3 width - Weeks Profit */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">Weekly Profit</h2>
                        <WeeksProfitChart data={profitData} />
                    </div>
                </div>

                {/* Second Row: 1/3 + 2/3 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">Visitors by Country</h2>
                        <DonutChart data={donutData} />
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 px-10">
                        <RegionLabels />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
