'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  Calendar,
  ChevronLeft,
  Truck,
  Award
} from 'lucide-react';

interface EarningRecord {
  id: string;
  jobId: string;
  job: {
    client: string;
    route: string;
    status: string;
  };
  amount: number;
  breakdown: {
    base: number;
    distanceBonus: number;
    timeBonus: number;
    nightShiftBonus: number;
  };
  status: string;
  earnedAt: string;
  paidAt?: string;
}

interface Stats {
  jobs: {
    completed: number;
    total: number;
    completionRate: number;
  };
  earnings: {
    total: number;
    average: number;
    breakdown: {
      base: number;
      distanceBonus: number;
      timeBonus: number;
      nightShiftBonus: number;
    };
  };
  distance: {
    total: number;
    average: number;
  };
  performance: {
    avgCompletionTime: number;
  };
}

export default function DriverEarningsPage() {
  const [earningsHistory, setEarningsHistory] = useState<EarningRecord[]>([]);
  const [dailyStats, setDailyStats] = useState<Stats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<Stats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<Stats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (!token) {
      router.push('/driver-v2/login');
      return;
    }

    fetchEarningsData();
  }, [router]);

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('driverToken');

      // Fetch earnings history
      const historyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/driver-stats/my-earnings?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setEarningsHistory(data);
      }

      // Fetch stats for different periods
      const periods = ['daily', 'weekly', 'monthly'];
      for (const period of periods) {
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/driver-stats/my-stats?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          switch (period) {
            case 'daily':
              setDailyStats(data);
              break;
            case 'weekly':
              setWeeklyStats(data);
              break;
            case 'monthly':
              setMonthlyStats(data);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'APPROVED':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getCurrentStats = () => {
    switch (selectedPeriod) {
      case 'daily':
        return dailyStats;
      case 'weekly':
        return weeklyStats;
      case 'monthly':
        return monthlyStats;
      default:
        return dailyStats;
    }
  };

  const stats = getCurrentStats();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/driver-v2/dashboard')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">My Earnings</h1>
        </div>
      </div>

      {/* Stats Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>

          {stats && (
            <TabsContent value={selectedPeriod} className="space-y-4 mt-4">
              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-green-100 text-sm">Total Earnings</p>
                      <p className="text-3xl font-bold mt-1">
                        {formatCurrency(stats.earnings.total)}
                      </p>
                      <p className="text-green-100 text-xs mt-2">
                        {stats.jobs.completed} jobs completed
                      </p>
                    </div>
                    <div className="bg-green-400/20 p-3 rounded-full">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-gray-500">Jobs Done</p>
                    </div>
                    <p className="text-xl font-bold mt-1">{stats.jobs.completed}</p>
                    <p className="text-xs text-gray-400">
                      {stats.jobs.completionRate.toFixed(0)}% success
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-gray-500">Avg/Job</p>
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(stats.earnings.average)}
                    </p>
                    <p className="text-xs text-gray-400">Per delivery</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-600" />
                      <p className="text-xs text-gray-500">Distance</p>
                    </div>
                    <p className="text-xl font-bold mt-1">{stats.distance.total.toFixed(0)} km</p>
                    <p className="text-xs text-gray-400">Traveled</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <p className="text-xs text-gray-500">Avg Time</p>
                    </div>
                    <p className="text-xl font-bold mt-1">{stats.performance.avgCompletionTime} min</p>
                    <p className="text-xs text-gray-400">Per job</p>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Earnings</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.breakdown.base)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance Bonus</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.breakdown.distanceBonus)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Bonus</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.breakdown.timeBonus)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Night Shift</span>
                    <span className="font-medium">{formatCurrency(stats.earnings.breakdown.nightShiftBonus)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{formatCurrency(stats.earnings.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Recent Earnings */}
      <div className="px-4 mt-6">
        <h3 className="font-semibold text-sm mb-3">Recent Earnings</h3>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        ) : earningsHistory.length > 0 ? (
          <div className="space-y-2">
            {earningsHistory.map((earning) => (
              <Card key={earning.id}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{earning.job.client}</p>
                        <Badge variant={getStatusColor(earning.status)} className="text-xs">
                          {earning.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{earning.job.route}</p>
                      <p className="text-xs text-gray-400">{formatDate(earning.earnedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(earning.amount)}</p>
                      <p className="text-xs text-gray-500">#{earning.jobId.slice(0, 8)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No earnings yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete jobs to start earning</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-3 gap-0">
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
            onClick={() => router.push('/driver-v2/dashboard')}
          >
            <Truck className="h-5 w-5" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
            onClick={() => router.push('/driver-v2/jobs')}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Jobs</span>
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1 text-blue-600"
            onClick={() => router.push('/driver-v2/earnings')}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Earnings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}