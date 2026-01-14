import { useState, useEffect } from 'react'; // Add useEffect
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Users, Calendar, DollarSign, UserPlus, Settings, LogOut, BarChart3, Menu, Bell, Search, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { RegisterUserSection } from './RegisterUserSection';
import { ManageUserSection } from './ManageUserSection';
import { AnalyticsSection } from './AnalyticsSection';
import { Pill } from 'lucide-react';
import { DrugRequestsSection } from './DrugRequestsSection';
import { SettingsSection } from './SettingsSection';

type Section = 'overview' | 'register' | 'manage' | 'analytics' | 'drug-requests' | 'settings';

// Add interfaces for data types
interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  activeStaff: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

interface UpcomingAppointment {
  patient: string;
  doctor: string;
  time: string;
  department: string;
}

export function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  
  // Dashboard data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    appointmentsToday: 0,
    activeStaff: 0,
    monthlyRevenue: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  
  const { user, logout } = useAuth();

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (activeSection === 'overview') {
      fetchDashboardData();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:3001/api/dashboard/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      
      // Fetch recent activities
      const activitiesResponse = await fetch('http://localhost:3001/api/dashboard/recent-activities');
      const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : [];
      
      // Fetch upcoming appointments
      const appointmentsResponse = await fetch('http://localhost:3001/api/dashboard/upcoming-appointments');
      const appointmentsData = appointmentsResponse.ok ? await appointmentsResponse.json() : [];
      
      setDashboardStats({
        totalPatients: statsData.totalPatients || 0,
        appointmentsToday: statsData.appointmentsToday || 0,
        activeStaff: statsData.activeStaff || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0
      });
      
      setRecentActivities(activitiesData);
      setUpcomingAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to static data if API fails
      setRecentActivities([
        { action: 'New patient registered', user: 'Dr. Sarah Johnson', time: '5 mins ago', type: 'success' },
        { action: 'Appointment scheduled', user: 'Dr. Michael Chen', time: '12 mins ago', type: 'info' },
        { action: 'Staff member updated', user: 'Admin', time: '23 mins ago', type: 'warning' },
        { action: 'Report generated', user: 'System', time: '1 hour ago', type: 'info' },
        { action: 'New admin registered', user: 'Dr. Emily White', time: '2 hours ago', type: 'success' }
      ]);
      setUpcomingAppointments([
        { patient: 'John Smith', doctor: 'Dr. Johnson', time: '10:00 AM', department: 'Cardiology' },
        { patient: 'Emma Davis', doctor: 'Dr. Chen', time: '11:30 AM', department: 'Pediatrics' },
        { patient: 'Robert Wilson', doctor: 'Dr. Brown', time: '2:00 PM', department: 'Surgery' },
        { patient: 'Lisa Anderson', doctor: 'Dr. White', time: '3:30 PM', department: 'Radiology' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Update stats array to use real data
  const stats = [
    {
      title: 'Total Patients',
      value: dashboardStats.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Appointments Today',
      value: dashboardStats.appointmentsToday.toString(),
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Active Staff',
      value: dashboardStats.activeStaff.toString(),
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenue (Month)',
      value: `RM ${dashboardStats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-orange-500'
    }
  ];

  const navigationItems = [
    { id: 'overview' as Section, label: 'Overview', icon: BarChart3 },
    { id: 'register' as Section, label: 'Register User', icon: UserPlus },
    { id: 'manage' as Section, label: 'Manage Users', icon: Users },
    { id: 'drug-requests' as Section, label: 'Drug Requests', icon: Pill },
    { id: 'analytics' as Section, label: 'Analytics', icon: TrendingUp },
    { id: 'settings' as Section, label: 'Settings', icon: Settings }
  ];

  const handleSignOut = () => {
    setShowLogoutConfirm(false);
    logout();
  };

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
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="size-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - No changes needed here */}
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

              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-900">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@clinic.com'}</p>
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
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.title}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                           <div className="space-y-2">
                              <p className="text-sm text-gray-600">{stat.title}</p>
                              <p className="text-2xl text-gray-900">{stat.value}</p>
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
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-12 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
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
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Activities */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>Latest actions in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivities.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            No recent activities
                          </div>
                        ) : (
                          recentActivities.map((activity, index) => (
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
                          ))
                        )}
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
                        {upcomingAppointments.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            No appointments today
                          </div>
                        ) : (
                          upcomingAppointments.map((appointment, index) => (
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
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeSection === 'register' && <RegisterUserSection />}
          {activeSection === 'manage' && <ManageUserSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
          {activeSection === 'drug-requests' && <DrugRequestsSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the Admin Portal?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSignOut}
            >
              <LogOut className="size-4 mr-2" />
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}