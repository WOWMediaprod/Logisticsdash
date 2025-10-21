'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  MapPin,
  Clock,
  ChevronLeft,
  Truck,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Job {
  id: string;
  status: string;
  priority: string;
  client: {
    name: string;
    phone?: string;
  };
  route: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  vehicle?: {
    registrationNo: string;
    type: string;
  };
  pickupTs: string;
  deliveryTs?: string;
  completedAt?: string;
  createdAt: string;
}

export default function DriverJobsPage() {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [cancelledJobs, setCancelledJobs] = useState<Job[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (!token) {
      router.push('/driver-v2/login');
      return;
    }

    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const driverId = localStorage.getItem('driverId');
      const token = localStorage.getItem('driverToken');

      // Fetch current job
      const currentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/driver/${driverId}/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (currentResponse.ok) {
        const data = await currentResponse.json();
        setActiveJob(data);
      }

      // Fetch all jobs for history
      const allJobsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/driver/${driverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (allJobsResponse.ok) {
        const jobs = await allJobsResponse.json();

        // Filter completed and cancelled jobs
        setCompletedJobs(jobs.filter((job: Job) => job.status === 'COMPLETED'));
        setCancelledJobs(jobs.filter((job: Job) => job.status === 'CANCELLED'));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'IN_TRANSIT':
      case 'AT_PICKUP':
      case 'LOADED':
      case 'AT_DELIVERY':
        return <Truck className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'IN_TRANSIT':
      case 'AT_PICKUP':
      case 'LOADED':
      case 'AT_DELIVERY':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const JobCard = ({ job }: { job: Job }) => (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getStatusIcon(job.status)}
              <div>
                <p className="font-medium text-sm">{job.client.name}</p>
                <p className="text-xs text-gray-500">#{job.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getStatusColor(job.status)} className="text-xs">
                {job.status}
              </Badge>
              {job.priority === 'URGENT' && (
                <Badge variant="destructive" className="text-xs ml-1">
                  Urgent
                </Badge>
              )}
            </div>
          </div>

          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">From</p>
                <p className="text-xs font-medium">{job.route.origin}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">To</p>
                <p className="text-xs font-medium">{job.route.destination}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatDate(job.pickupTs)}
            </div>
            <div className="text-xs text-gray-500">
              {job.route.kmEstimate} km
            </div>
          </div>

          {job.vehicle && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Truck className="h-3 w-3" />
              {job.vehicle.type} - {job.vehicle.registrationNo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
          <h1 className="ml-2 text-lg font-semibold">My Jobs</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active {activeJob && '(1)'}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : activeJob ? (
              <div className="space-y-3">
                <JobCard job={activeJob} />

                <Button
                  onClick={() => router.push('/driver-v2/dashboard')}
                  className="w-full"
                  size="lg"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Go to Tracking
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active job</p>
                  <p className="text-sm text-gray-400 mt-1">
                    New jobs will appear here when assigned
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-2">
            {completedJobs.length > 0 ? (
              completedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No completed jobs yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Completed jobs will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4 space-y-2">
            {cancelledJobs.length > 0 ? (
              cancelledJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No cancelled jobs</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Cancelled jobs will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
            className="rounded-none h-14 flex flex-col gap-1 text-blue-600"
            onClick={() => router.push('/driver-v2/jobs')}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Jobs</span>
          </Button>
          <Button
            variant="ghost"
            className="rounded-none h-14 flex flex-col gap-1"
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