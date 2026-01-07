'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { useGetTicketsQuery, useGetTicketCountQuery } from '@/store/services/ticketApi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateRange = () => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  return { startDate: dateString, endDate: dateString };
};

export default function DashboardPage() {
  const { data: ticketsData, isLoading: ticketsLoading } = useGetTicketsQuery({
    limit: 10,
    offset: 0,
  });
  const { data: countData, isLoading: countLoading } = useGetTicketCountQuery();

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!ticketsData?.data) {
      return {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
      };
    }

    const tickets = ticketsData.data;
    const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

    return {
      totalTickets: countData?.data.count || 0,
      openTickets,
      resolvedTickets,
    };
  }, [ticketsData, countData]);

  const isLoading = ticketsLoading || countLoading;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!ticketsData?.data) {
      return { labels: [], statuses: [], categoryLabels: [], categoryCounts: [] };
    }

    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const statusCounts = statuses.map(
      (status) => ticketsData.data.filter((t) => t.status === status).length
    );

    const categories: { [key: string]: number } = {};
    ticketsData.data.forEach((ticket) => {
      categories[ticket.category] = (categories[ticket.category] || 0) + 1;
    });

    return {
      labels: statuses,
      statuses: statusCounts,
      categoryLabels: Object.keys(categories),
      categoryCounts: Object.values(categories),
    };
  }, [ticketsData]);

  // Bar chart configuration for ticket status
  const lineChartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Tickets by Status',
        data: chartData.statuses,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Bar chart configuration for ticket categories
  const barChartConfig = {
    labels: chartData.categoryLabels,
    datasets: [
      {
        label: 'Tickets by Category',
        data: chartData.categoryCounts,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const stats = [
    {
      title: 'Total Tickets',
      value: summary.totalTickets.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Open Tickets',
      value: summary.openTickets.toLocaleString(),
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Resolved',
      value: summary.resolvedTickets.toLocaleString(),
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
          Real-time ticket and OCR scanning statistics
        </p>
      </div>

      {/* Stats Cards - Reduced to 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-1.5 sm:p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-2 sm:py-4">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white truncate">
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Line Chart */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Total Amount Trend (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="h-48 sm:h-64 lg:h-80">
                <Line
                  data={lineChartConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          boxWidth: 12,
                          padding: 8,
                          font: {
                            size: 11,
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: {
                            size: 10,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 10,
                          },
                          maxRotation: 45,
                          minRotation: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Scanned Tickets Count (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="h-48 sm:h-64 lg:h-80">
                <Bar
                  data={barChartConfig}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          boxWidth: 12,
                          padding: 8,
                          font: {
                            size: 11,
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: {
                            size: 10,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 10,
                          },
                          maxRotation: 45,
                          minRotation: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Section */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : ticketsData?.data && ticketsData.data.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {ticketsData.data.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                      {ticket.subject.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-[10px] sm:text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0 hidden xs:block sm:block">
                      {ticket.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                No tickets found
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
