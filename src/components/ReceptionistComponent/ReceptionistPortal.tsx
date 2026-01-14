// ReceptionistPortal.tsx - REFACTORED VERSION WITH LOGOUT CONFIRMATION
import { useState, useEffect } from 'react';
import { Bell, LogOut, ClipboardList, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { NotificationPanel } from '../NotificationPanel';
import { ProfileModal } from '../ProfileModal';
import { RegisterPatient } from './RegisterPatient';
import { AppointmentSchedule } from './AppointmentSchedule';
import { BillingManagement } from './BillingManagement';
import { Dashboard } from './DashboardReceptionist';
import { CheckInQueue } from './CheckInQueue';
import { WaitingList } from './WaitingList';

export function ReceptionistPortal() {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'appointments' | 'billing'>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Add this state
  
  // Shared data state
  const [receptionistId, setReceptionistId] = useState<number | null>(null);
  const [receptionistProfile, setReceptionistProfile] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [waitingRoomList, setWaitingRoomList] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNavigateToBilling = (visitData: {
  visitId: number;
  patientId: number;
  patientName: string;
}) => {
  // Set active tab to billing
  setActiveTab('billing');
  
  // You can also set selected patient data in BillingManagement
  // This requires modifying BillingManagement to accept initial data
  console.log('Navigating to billing with:', visitData);
};


  // Get receptionistId from AuthContext user if available
  useEffect(() => {
    if (user?.userId) {
      setReceptionistId(user.userId);
    }
  }, [user]);

  useEffect(() => {
    const fetchReceptionistData = async () => {
      try {
        setLoading(true);
        
        // Get receptionistId from AuthContext or localStorage
        let receptionistIdToUse = receptionistId;
        if (!receptionistIdToUse) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            receptionistIdToUse = userData.userId;
            setReceptionistId(userData.userId);
          }
        }
        
        if (!receptionistIdToUse) {
          console.error('No receptionist ID found');
          return;
        }
        
        // Fetch all data in parallel
        const [profileRes, appointmentsRes, waitingRoomRes, billingRes, doctorsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/receptionist/profile/${receptionistIdToUse}`),
          fetch(`http://localhost:3001/api/receptionist/appointments`),
          fetch(`http://localhost:3001/api/receptionist/today-visits`),
          fetch(`http://localhost:3001/api/receptionist/billing`),
          fetch(`http://localhost:3001/api/receptionist/doctors`)
        ]);

        if (profileRes.ok) setReceptionistProfile(await profileRes.json());
        if (appointmentsRes.ok) setTodayAppointments(await appointmentsRes.json());
        if (waitingRoomRes.ok) setWaitingRoomList(await waitingRoomRes.json());
        if (billingRes.ok) setBillingRecords(await billingRes.json());
        if (doctorsRes.ok) setDoctors(await doctorsRes.json());
      } catch (error) {
        console.error("Error fetching receptionist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionistData();
  }, [receptionistId]);

  // Function to refresh specific data
  const refreshData = async (dataType: 'appointments' | 'waiting' | 'billing') => {
    try {
      switch(dataType) {
        case 'appointments':
          const appointmentsRes = await fetch(`http://localhost:3001/api/receptionist/appointments`);
          if (appointmentsRes.ok) setTodayAppointments(await appointmentsRes.json());
          break;
        case 'waiting':
          const waitingRoomRes = await fetch(`http://localhost:3001/api/receptionist/today-visits`);
          if (waitingRoomRes.ok) setWaitingRoomList(await waitingRoomRes.json());
          break;
        case 'billing':
          const billingRes = await fetch(`http://localhost:3001/api/receptionist/billing`);
          if (billingRes.ok) setBillingRecords(await billingRes.json());
          break;
      }
    } catch (error) {
      console.error(`Error refreshing ${dataType}:`, error);
    }
  };

  const handleSignOut = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Receptionist Portal...</p>
        </div>
      </div>
    );
  }

  const receptionistInitials = receptionistProfile?.Name 
    ? receptionistProfile.Name.split(' ').map((n: string) => n[0]).join('') 
    : 'RC';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">Receptionist Portal</h1>
              <p className="text-sm text-gray-500">Patient Registration & Appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
              <Avatar>
                <AvatarFallback className="bg-orange-600 text-white">
                  {receptionistInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">{receptionistProfile?.Name || user?.name || 'Receptionist'}</p>
                <p className="text-xs text-gray-500">Receptionist</p>
              </div>
            </div>
            <Button 
              variant="destructive"
              onClick={() => setShowLogoutConfirm(true)}
              className="hover:bg-red-700 transition-colors"
            >
              <LogOut className="size-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">Front Desk Management</h2>
            <p className="text-sm text-gray-500">Register patients and schedule appointments</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Appointments</p>
                    <p className="text-2xl text-gray-900 mt-2">{todayAppointments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Checked In</p>
                    <p className="text-2xl text-gray-900 mt-2">
                      {todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'checked-in').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="size-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Waiting</p>
                    <p className="text-2xl text-gray-900 mt-2">
                      {waitingRoomList.filter(v => v.VisitStatus === 'arrived' || v.VisitStatus === 'checked-in').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="size-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-2xl text-gray-900 mt-2">
                      {todayAppointments.filter(a => a.status === 'scheduled').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="size-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
              { id: 'register', label: 'Register Patient', icon: 'UserPlus' },
              { id: 'appointments', label: 'Appointments', icon: 'Calendar' },
              { id: 'billing', label: 'Billing', icon: 'DollarSign' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
<Dashboard
  receptionistId={receptionistId}
  doctors={doctors}
  waitingRoomList={waitingRoomList}
  todayAppointments={todayAppointments}
  refreshData={() => refreshData('waiting')}
  onNavigateToBilling={handleNavigateToBilling}
/>
          )}
          {activeTab === 'register' && (
            <RegisterPatient
              receptionistId={receptionistId}
              doctors={doctors}
              refreshData={() => refreshData('waiting')}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentSchedule
              receptionistId={receptionistId}
              doctors={doctors}
              refreshData={() => refreshData('appointments')}
            />
          )}

          {activeTab === 'billing' && (
            <BillingManagement
              receptionistId={receptionistId}
              
              refreshData={() => refreshData('billing')}
            />
          )}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={receptionistProfile}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the Receptionist Portal?
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