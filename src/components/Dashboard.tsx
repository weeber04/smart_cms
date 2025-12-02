import { useState } from 'react';
import { Activity, Users, Calendar, DollarSign, UserPlus, Settings, LogOut, BarChart3, Menu, Bell, Search, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { RegisterUserSection } from './RegisterUserSection';
import { ManageUserSection } from './ManageUserSection';
import { AnalyticsSection } from './AnalyticsSection';

type Section = 'overview' | 'register' | 'manage' | 'analytics';

export function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stats = [
    {
      title: 'Total Patients',
      value: '2,847',
      change: '+12.5%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Appointments Today',
      value: '42',
      change: '+8.2%',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Active Staff',
      value: '156',
      change: '+3.1%',
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenue (Month)',
      value: '$48,392',
      change: '+15.3%',
      icon: DollarSign,
      color: 'bg-orange-500'
    }
  ];

  const recentActivities = [
    { action: 'New patient registered', user: 'Dr. Sarah Johnson', time: '5 mins ago', type: 'success' },
    { action: 'Appointment scheduled', user: 'Dr. Michael Chen', time: '12 mins ago', type: 'info' },
    { action: 'Staff member updated', user: 'Admin', time: '23 mins ago', type: 'warning' },
    { action: 'Report generated', user: 'System', time: '1 hour ago', type: 'info' },
    { action: 'New admin registered', user: 'Dr. Emily White', time: '2 hours ago', type: 'success' }
  ];

  const upcomingAppointments = [
    { patient: 'John Smith', doctor: 'Dr. Johnson', time: '10:00 AM', department: 'Cardiology' },
    { patient: 'Emma Davis', doctor: 'Dr. Chen', time: '11:30 AM', department: 'Pediatrics' },
    { patient: 'Robert Wilson', doctor: 'Dr. Brown', time: '2:00 PM', department: 'Surgery' },
    { patient: 'Lisa Anderson', doctor: 'Dr. White', time: '3:30 PM', department: 'Radiology' }
  ];

  const navigationItems = [
    { id: 'overview' as Section, label: 'Overview', icon: BarChart3 },
    { id: 'register' as Section, label: 'Register User', icon: UserPlus },
    { id: 'manage' as Section, label: 'Manage Users', icon: Users },
    { id: 'analytics' as Section, label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="size-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm text-gray-900 truncate">HealthCare Clinic</h1>
                <p className="text-xs text-gray-500 truncate">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="size-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="size-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Collapse</span>}
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="size-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search patients, appointments, staff..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@clinic.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-gray-900 mb-1">Dashboard Overview</h2>
                <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.title}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">{stat.title}</p>
                            <p className="text-2xl text-gray-900">{stat.value}</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="size-3 text-green-600" />
                              <span className="text-xs text-green-600">{stat.change}</span>
                            </div>
                          </div>
                          <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                            <Icon className="size-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest actions in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'success' ? 'bg-green-500' :
                            activity.type === 'warning' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">{activity.user}</p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-400">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>Today's scheduled appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="size-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-900">{appointment.patient}</p>
                              <p className="text-xs text-gray-500">{appointment.doctor} • {appointment.department}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" />
                            {appointment.time}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveSection('register')}
                    >
                      <UserPlus className="size-6" />
                      <span>Register New User</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Calendar className="size-6" />
                      <span>Schedule Appointment</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveSection('analytics')}
                    >
                      <BarChart3 className="size-6" />
                      <span>View Reports</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Settings className="size-6" />
                      <span>System Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'register' && <RegisterUserSection />}
          {activeSection === 'manage' && <ManageUserSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
        </main>
      </div>
    </div>
  );
}
