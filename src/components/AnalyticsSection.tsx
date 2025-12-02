import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsSection() {
  const monthlyData = [
    { month: 'Jan', patients: 245, appointments: 389, revenue: 42000 },
    { month: 'Feb', patients: 278, appointments: 412, revenue: 45000 },
    { month: 'Mar', patients: 312, appointments: 456, revenue: 48000 },
    { month: 'Apr', patients: 289, appointments: 423, revenue: 46000 },
    { month: 'May', patients: 334, appointments: 478, revenue: 51000 },
    { month: 'Jun', patients: 356, appointments: 502, revenue: 53000 }
  ];

  const departmentData = [
    { name: 'Cardiology', value: 235, color: '#3b82f6' },
    { name: 'Pediatrics', value: 198, color: '#10b981' },
    { name: 'Surgery', value: 156, color: '#f59e0b' },
    { name: 'Emergency', value: 223, color: '#ef4444' },
    { name: 'Radiology', value: 134, color: '#8b5cf6' },
    { name: 'Laboratory', value: 167, color: '#06b6d4' }
  ];

  const weeklyAppointments = [
    { day: 'Mon', count: 42 },
    { day: 'Tue', count: 38 },
    { day: 'Wed', count: 45 },
    { day: 'Thu', count: 52 },
    { day: 'Fri', count: 48 },
    { day: 'Sat', count: 28 },
    { day: 'Sun', count: 15 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900 mb-1">Analytics & Reports</h2>
        <p className="text-sm text-gray-500">Comprehensive insights into clinic performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl text-gray-900 mt-2">2,847</p>
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
                <p className="text-2xl text-gray-900 mt-2">2,660</p>
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
                <p className="text-2xl text-gray-900 mt-2">$293K</p>
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
                <p className="text-2xl text-gray-900 mt-2">18 min</p>
                <p className="text-xs text-green-600 mt-1">↓ 5.2% from last month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Patient registrations and appointments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={2} />
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
              <BarChart data={weeklyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Patient visits by department</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
