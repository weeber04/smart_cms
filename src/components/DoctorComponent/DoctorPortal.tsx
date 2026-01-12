import { useState, useEffect } from 'react';
import { Activity, Search, Bell, LogOut, Stethoscope, FileText, Calendar, Users, ClipboardList, User, Heart, Pill } from 'lucide-react'; // ADDED Pill icon
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { NotificationPanel } from '../NotificationPanel';
import { ProfileModal } from '../ProfileModal';
import { PatientDetailsModal } from '../PatientDetailsModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ConsultationTab } from './ConsultationTab';
import { PatientQueue } from './PatientQueue';
import { RecentMedicalRecords } from './RecentMedicalRecords';
import { useAuth } from '../../contexts/AuthContext'; 
// ADD THIS IMPORT:
import { PrescriptionTab } from './PrescriptionTab'; // This is the full prescription management tab
import { PatientManagementTab } from './PatientManagementTab';

export function DoctorPortal() {
  // UPDATE activeTab to include 'prescription-mgmt'
  const [activeTab, setActiveTab] = useState<'consultation' | 'queue' | 'patient-mgmt' | 'vitals'>('consultation');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { user, logout } = useAuth();

  // Fetch doctor data on component mount
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          throw new Error('No user data found');
        }

        setDoctorId(user.userId);

        // Fetch doctor profile
        const profileRes = await fetch(`http://localhost:3001/api/doctor/profile/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!profileRes.ok) {
          throw new Error(`Failed to fetch doctor profile: ${profileRes.status}`);
        }
        
        const profileData = await profileRes.json();
        setDoctorProfile(profileData);

        // Fetch appointments
        const appointmentsRes = await fetch(`http://localhost:3001/api/doctor/appointments/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setTodayAppointments(appointmentsData);
        } else {
          console.warn('No appointments data available');
          setTodayAppointments([]);
        }

        // Fetch prescriptions (recent ones for sidebar)
        const prescriptionsRes = await fetch(`http://localhost:3001/api/doctor/prescriptions/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (prescriptionsRes.ok) {
          const prescriptionsData = await prescriptionsRes.json();
          setRecentPrescriptions(prescriptionsData);
        } else {
          console.warn('No prescriptions data available');
          setRecentPrescriptions([]);
        }

      } catch (error) {
        console.error("Error fetching doctor data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load data from server');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Doctor Portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="size-8 text-red-600" />
          </div>
          <h2 className="text-xl text-gray-900 mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
          <Button variant="outline" onClick={logout} className="ml-2">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Calculate initials from real doctor name
  const doctorInitials = doctorProfile?.Name 
    ? doctorProfile.Name.split(' ').map((n: string) => n[0]).join('') 
    : 'DR';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">Doctor Portal</h1>
              <p className="text-sm text-gray-500">Consultation & Medical Records</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPanel role="doctor" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {doctorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">{doctorProfile?.Name || 'Doctor'}</p>
                <p className="text-xs text-gray-500">{doctorProfile?.Specialization || 'General Medicine'}</p>
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
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">
              Welcome, {doctorProfile?.Name || 'Doctor'}
            </h2>
            <p className="text-sm text-gray-500">
              Today's Schedule - {new Date().toLocaleDateString()}
            </p>
          </div>
      
<div className="flex gap-2 border-b">
  <button
    onClick={() => setActiveTab('consultation')}
    className={`px-4 py-2 border-b-2 transition-colors ${
      activeTab === 'consultation'
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    <ClipboardList className="size-4 inline mr-2" />
    Consultation
  </button>
  <button
    onClick={() => setActiveTab('queue')}
    className={`px-4 py-2 border-b-2 transition-colors ${
      activeTab === 'queue'
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    <Users className="size-4 inline mr-2" />
    Patient Queue
  </button>
<button
  onClick={() => setActiveTab('patient-mgmt')}
  className={`px-4 py-2 border-b-2 transition-colors ${
    activeTab === 'patient-mgmt'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-600 hover:text-gray-900'
  }`}
>
  <Users className="size-4 inline mr-2" />
  Patient Management
</button>

</div>

{activeTab === 'consultation' && (
  <ConsultationTab 
    doctorId={doctorId}
    doctorProfile={doctorProfile}
    todayAppointments={todayAppointments}
    setTodayAppointments={setTodayAppointments}
  />
)}

{activeTab === 'queue' && (
  <PatientQueue 
    doctorId={doctorId}
    refreshData={() => {
      window.location.reload();
    }}
  />
)}

{activeTab === 'patient-mgmt' && ( // ADDED this new tab
  <PatientManagementTab />
)}

          {/* This is the sidebar component - keep it */}
          <RecentMedicalRecords />
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={{
          name: doctorProfile?.Name || 'Doctor',
          role: 'Doctor',
          department: doctorProfile?.Specialization || 'General Medicine',
          email: doctorProfile?.Email || '',
          phone: doctorProfile?.PhoneNum || '',
          initials: doctorInitials,
          joinDate: '2024',
          specialization: doctorProfile?.Specialization || 'General Medicine',
          certifications: []
        }}
      />

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the Doctor Portal?
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
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
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