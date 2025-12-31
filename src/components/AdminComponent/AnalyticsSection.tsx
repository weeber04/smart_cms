import { useState, useEffect } from 'react'; // Add useState and useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define interfaces for analytics data
interface MonthlyData {
  month: string;
  patients: number;
  appointments: number;
  revenue: number;
}

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface WeeklyAppointment {
  day: string;
  count: number;
}

interface AnalyticsData {
  totalPatients: number;
  appointments: number;
  revenue: number;
  avgWaitTime: number;
  monthlyData: MonthlyData[];
  departmentData: DepartmentData[];
  weeklyAppointments: WeeklyAppointment[];
}

export function AnalyticsSection() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPatients: 0,
    appointments: 0,
    revenue: 0,
    avgWaitTime: 0,
    monthlyData: [],
    departmentData: [],
    weeklyAppointments: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data
      const metricsResponse = await fetch('http://localhost:3001/api/analytics/metrics');
      const monthlyResponse = await fetch('http://localhost:3001/api/analytics/monthly-trends');
      const weeklyResponse = await fetch('http://localhost:3001/api/analytics/weekly-appointments');
      const departmentResponse = await fetch('http://localhost:3001/api/analytics/department-distribution');
      const revenueResponse = await fetch('http://localhost:3001/api/analytics/revenue-trend');
      
      const metricsData = metricsResponse.ok ? await metricsResponse.json() : {};
      const monthlyData = monthlyResponse.ok ? await monthlyResponse.json() : [];
      const weeklyData = weeklyResponse.ok ? await weeklyResponse.json() : [];
      const departmentData = departmentResponse.ok ? await departmentResponse.json() : [];
      const revenueData = revenueResponse.ok ? await revenueResponse.json() : [];
      
      // Process department data - add colors
      const processedDepartmentData = departmentData.map((dept: any, index: number) => ({
        name: dept.name,
        value: dept.value,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]
      }));
      
      // Process revenue data - convert to RM
      const processedRevenueData = revenueData.map((item: any) => ({
        ...item,
        revenue: item.revenue // Already in RM from backend
      }));
      
      setAnalyticsData({
        totalPatients: metricsData.totalPatients || 0,
        appointments: metricsData.appointments || 0,
        revenue: metricsData.revenue || 0,
        avgWaitTime: metricsData.avgWaitTime || 0,
        monthlyData: monthlyData || [],
        departmentData: processedDepartmentData,
        weeklyAppointments: weeklyData || []
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to static data if API fails
      setAnalyticsData({
        totalPatients: 2847,
        appointments: 2660,
        revenue: 293000,
        avgWaitTime: 18,
        monthlyData: [
          { month: 'Jan', patients: 245, appointments: 389, revenue: 42000 },
          { month: 'Feb', patients: 278, appointments: 412, revenue: 45000 },
          { month: 'Mar', patients: 312, appointments: 456, revenue: 48000 },
          { month: 'Apr', patients: 289, appointments: 423, revenue: 46000 },
          { month: 'May', patients: 334, appointments: 478, revenue: 51000 },
          { month: 'Jun', patients: 356, appointments: 502, revenue: 53000 }
        ],
        departmentData: [
          { name: 'Cardiology', value: 235, color: '#3b82f6' },
          { name: 'Pediatrics', value: 198, color: '#10b981' },
          { name: 'Surgery', value: 156, color: '#f59e0b' },
          { name: 'Emergency', value: 223, color: '#ef4444' },
          { name: 'Radiology', value: 134, color: '#8b5cf6' },
          { name: 'Laboratory', value: 167, color: '#06b6d4' }
        ],
        weeklyAppointments: [
          { day: 'Mon', count: 42 },
          { day: 'Tue', count: 38 },
          { day: 'Wed', count: 45 },
          { day: 'Thu', count: 52 },
          { day: 'Fri', count: 48 },
          { day: 'Sat', count: 28 },
          { day: 'Sun', count: 15 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Format revenue to RM with thousand separators
  const formatRevenue = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900 mb-1">Analytics & Reports</h2>
        <p className="text-sm text-gray-500">Comprehensive insights into clinic performance</p>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl text-gray-900 mt-2">{analyticsData.totalPatients.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12.5% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="size-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-2xl text-gray-900 mt-2">{analyticsData.appointments.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">↑ 8.2% from last month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="size-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl text-gray-900 mt-2">{formatRevenue(analyticsData.revenue)}</p>
                  <p className="text-xs text-green-600 mt-1">↑ 15.3% from last month</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="size-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Wait Time</p>
                  <p className="text-2xl text-gray-900 mt-2">{analyticsData.avgWaitTime} min</p>
                  <p className="text-xs text-green-600 mt-1">↓ 5.2% from last month</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="size-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Patient registrations and appointments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Count']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="patients" 
                    name="Patients" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    name="Appointments" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Appointments</CardTitle>
              <CardDescription>Appointment distribution by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.weeklyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Appointments']}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Appointments" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Patient visits by department</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {analyticsData.departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        value, 
                        `${props.payload.name}: ${((props.payload.percent || 0) * 100).toFixed(1)}%`
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-500">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue in RM</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`RM ${value}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue (RM)" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}