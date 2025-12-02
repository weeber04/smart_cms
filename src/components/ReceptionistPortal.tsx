// ReceptionistPortal.tsx - FIXED VERSION (Original design)
import { useRef } from 'react';
import { useState, useEffect } from 'react';
import { Bell, LogOut, ClipboardList, UserPlus, Calendar, Users, Phone, Mail, User, DollarSign, CreditCard, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { NotificationPanel } from './NotificationPanel';
import { ProfileModal } from './ProfileModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';

export function ReceptionistPortal({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<'register' | 'appointments' | 'billing' | 'check-in'>('register');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showSendReminder, setShowSendReminder] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // State for real data
  const [receptionistId, setReceptionistId] = useState<number | null>(null);
  const [receptionistProfile, setReceptionistProfile] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [waitingRoomList, setWaitingRoomList] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Patient search states
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');

  useEffect(() => {
    const fetchReceptionistData = async () => {
      try {
        setLoading(true);
        
        // Get receptionist ID from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setReceptionistId(user.userId);
          
          // Fetch receptionist profile
          const profileRes = await fetch(`http://localhost:3001/api/receptionist/profile/${user.userId}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setReceptionistProfile(profileData);
          }
          
          // Fetch appointments
          const appointmentsRes = await fetch(`http://localhost:3001/api/receptionist/appointments`);
          if (appointmentsRes.ok) {
            const appointmentsData = await appointmentsRes.json();
            setTodayAppointments(appointmentsData);
          }
          
          // Fetch waiting room
          const waitingRoomRes = await fetch(`http://localhost:3001/api/receptionist/today-visits`);
          if (waitingRoomRes.ok) {
            const waitingRoomData = await waitingRoomRes.json();
            setWaitingRoomList(waitingRoomData);
          }
          
          // Fetch billing records
          const billingRes = await fetch(`http://localhost:3001/api/receptionist/billing`);
          if (billingRes.ok) {
            const billingData = await billingRes.json();
            setBillingRecords(billingData);
          }
          
          // Fetch doctors
          const doctorsRes = await fetch(`http://localhost:3001/api/receptionist/doctors`);
          if (doctorsRes.ok) {
            const doctorsData = await doctorsRes.json();
            setDoctors(doctorsData);
          }
        }
      } catch (error) {
        console.error("Error fetching receptionist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionistData();
  }, []);

  // Patient search
  const handlePatientSearch = async (searchTerm: string) => {
    setPatientSearch(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/receptionist/search-patient?search=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Patient search error:", error);
    }
  };

  const selectPatient = (patient: any) => {
    setPatientSearch(patient.Name);
    setSelectedPatientId(patient.id);
    setSelectedPatientName(patient.Name);
    setSearchResults([]);
  };

  // Register new patient
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receptionistId) {
      alert("Receptionist ID not found");
      return;
    }

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      const patientData = {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
        icNo: formData.get('icNo'),
        gender: formData.get('gender'),
        dob: formData.get('dob'),
        phoneNumber: formData.get('phone'),
        createdBy: receptionistId,
        email: formData.get('email') || null,
        bloodType: formData.get('bloodType') || null,
        address: formData.get('address') || null,
        insuranceProvider: formData.get('insuranceProvider') || null,
        insurancePolicyNo: formData.get('insurancePolicyNo') || null,
        emergencyContactName: formData.get('emergencyContactName') || null,
        emergencyContactPhone: formData.get('emergencyContactPhone') || null,
        reasonForVisit: formData.get('reasonForVisit') || 'First consultation',
        doctorId: formData.get('doctor') || null
      };

      const response = await fetch("http://localhost:3001/api/receptionist/register-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setRegistrationSuccess(true);
        
        // Reset form
        const form = e.target as HTMLFormElement;
        form.reset();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRegistrationSuccess(false);
        }, 3000);
        
      } else {
        alert(result.error || 'Failed to register patient');
      }
      
    } catch (error) {
      console.error("❌ Registration error:", error);
      alert("Failed to register patient. Check console for details.");
    }
  };

  // Schedule appointment
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receptionistId) return;
    
    if (!selectedPatientId) {
      alert("Please search and select a patient first");
      return;
    }
    
    if (!selectedDoctorId) {
      alert("Please select a doctor");
      return;
    }

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const date = formData.get('date');
      const time = formData.get('time');
      const reason = formData.get('reason');
      const notes = formData.get('notes') || '';
      
      if (!date || !time || !reason) {
        alert("Please fill in all required fields: date, time, and reason");
        return;
      }
      
      const appointmentDateTime = `${date}T${time}:00`;
      
      const appointmentData = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDateTime: appointmentDateTime,
        purpose: reason,
        notes: notes,
        createdBy: receptionistId
      };

      const response = await fetch("http://localhost:3001/api/receptionist/schedule-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setAppointmentSuccess(true);
        
        // Reset form and selections
        (e.target as HTMLFormElement).reset();
        setSelectedPatientId(null);
        setPatientSearch('');
        setSelectedPatientName('');
        setSelectedDoctorId('');
        
        // Refresh appointments
        const appointmentsRes = await fetch(`http://localhost:3001/api/receptionist/appointments`);
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setTodayAppointments(appointmentsData);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setAppointmentSuccess(false), 3000);
        
      } else {
        alert(result.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error("❌ Appointment scheduling error:", error);
      alert("Network error. Please check console for details.");
    }
  };

  // Check-in patient
  const handleCheckIn = async (appointmentId: number) => {
    try {
      const response = await fetch("http://localhost:3001/api/receptionist/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId })
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh waiting room
        const waitingRoomRes = await fetch(`http://localhost:3001/api/receptionist/today-visits`);
        if (waitingRoomRes.ok) {
          const waitingRoomData = await waitingRoomRes.json();
          setWaitingRoomList(waitingRoomData);
        }
      } else {
        alert(result.error || 'Failed to check in patient');
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in patient");
    }
  };

  // Update visit status
  const handleUpdateVisitStatus = async (visitId: number, status: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/receptionist/update-visit-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, status })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        // Refresh waiting room
        const waitingRoomRes = await fetch(`http://localhost:3001/api/receptionist/today-visits`);
        if (waitingRoomRes.ok) {
          const waitingRoomData = await waitingRoomRes.json();
          setWaitingRoomList(waitingRoomData);
        }
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update status");
    }
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedBilling || !receptionistId) return;

    try {
      const amountInput = document.getElementById('amount-received') as HTMLInputElement;
      const paymentMethodSelect = document.getElementById('payment-method') as HTMLSelectElement;
      const notesTextarea = document.getElementById('payment-notes') as HTMLTextAreaElement;
      
      if (!amountInput?.value || !paymentMethodSelect?.value) {
        alert("Please fill in all required fields");
        return;
      }

      const paymentData = {
        billId: selectedBilling.id,
        amountPaid: amountInput.value,
        paymentMethod: paymentMethodSelect.value,
        notes: notesTextarea?.value || '',
        processedBy: receptionistId
      };

      const response = await fetch("http://localhost:3001/api/receptionist/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowBillingDialog(false);
        alert('Payment processed successfully!');
        
        // Refresh billing records
        const billingRes = await fetch(`http://localhost:3001/api/receptionist/billing`);
        if (billingRes.ok) {
          const billingData = await billingRes.json();
          setBillingRecords(billingData);
        }
      } else {
        alert(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Failed to process payment");
    }
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

  // Calculate initials
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
            <NotificationPanel role="receptionist" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
              <Avatar>
                <AvatarFallback className="bg-orange-600 text-white">
                  {receptionistInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">{receptionistProfile?.Name || 'Receptionist'}</p>
                <p className="text-xs text-gray-500">Receptionist</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={onSignOut}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400 transition-colors"
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
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="size-4 inline mr-2" />
              Register Patient
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'appointments'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="size-4 inline mr-2" />
              Schedule Appointment
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'billing'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="size-4 inline mr-2" />
              Billing
            </button>
            <button
              onClick={() => setActiveTab('check-in')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'check-in'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="size-4 inline mr-2" />
              Check-In Queue
            </button>
          </div>

          {/* Register Patient Form */}
          {activeTab === 'register' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="size-5" />
                  New Patient Registration
                </CardTitle>
                <CardDescription>Register a new patient with complete information</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Success Message */}
                {registrationSuccess && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <UserPlus className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">✅ Patient Registered!</h3>
                        <p className="text-sm opacity-90">Patient has been registered successfully.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form ref={formRef} onSubmit={handleRegisterPatient} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input id="firstName" name="firstName" placeholder="John" className="pl-10" required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" placeholder="Smith" required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icNo">IC/Passport Number *</Label>
                      <Input 
                        id="icNo" 
                        name="icNo"
                        placeholder="e.g., 900101010101" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select name="gender" required>
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input 
                        id="dob" 
                        name="dob"
                        type="date" 
                        required 
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                          id="phone" 
                          name="phone"
                          type="tel" 
                          placeholder="+1 (555) 000-0000" 
                          className="pl-10" 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasonForVisit">Reason for Visit</Label>
                    <Textarea 
                      id="reasonForVisit" 
                      name="reasonForVisit"
                      placeholder="Brief description of symptoms or reason for visit..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor">Assign to Doctor (Optional)</Label>
                    <Select name="doctor">
                      <SelectTrigger id="doctor">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.Name} - {doctor.Specialization || 'General'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      <UserPlus className="size-4 mr-2" />
                      Register Patient
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        if (formRef.current) {
                          formRef.current.reset();
                        }
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Schedule Appointment */}
          {activeTab === 'appointments' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="size-5" />
                    Schedule New Appointment
                  </CardTitle>
                  <CardDescription>Book an appointment for a patient</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* APPOINTMENT SUCCESS MESSAGE */}
                  {appointmentSuccess && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl shadow-xl">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">✅ Appointment Scheduled!</h3>
                          <p className="text-sm opacity-90">Appointment has been added to the schedule.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleScheduleAppointment} className="space-y-4">
                    {/* Patient Search */}
                    <div className="space-y-2 relative">
                      <Label htmlFor="patient-search">Patient Search *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                          id="patient-search" 
                          placeholder="Search patient by name, IC number, or phone"
                          value={patientSearch}
                          onChange={(e) => handlePatientSearch(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((patient) => (
                            <div
                              key={patient.id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => selectPatient(patient)}
                            >
                              <div className="font-medium">{patient.Name}</div>
                              <div className="text-sm text-gray-500">
                                IC: {patient.ICNo} | Phone: {patient.PhoneNumber}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Selected Patient Display */}
                      {selectedPatientId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="text-sm text-green-800">
                            Selected: <span className="font-semibold">{selectedPatientName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor">Doctor *</Label>
                      <Select 
                        required 
                        name="doctor"
                        value={selectedDoctorId}
                        onValueChange={setSelectedDoctorId}
                      >
                        <SelectTrigger id="doctor">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor: any) => (
                            <SelectItem 
                              key={doctor.id} 
                              value={String(doctor.id)}
                            >
                              {doctor.Name} - {doctor.Specialization || 'General'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input 
                          id="date" 
                          name="date"
                          type="date" 
                          required 
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Input 
                          id="time" 
                          name="time"
                          type="time" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Visit *</Label>
                      <Input 
                        id="reason" 
                        name="reason"
                        placeholder="E.g., Regular check-up, Follow-up, Symptoms..." 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea 
                        id="notes" 
                        name="notes"
                        placeholder="Any special instructions or information..."
                        rows={2}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={!selectedPatientId}
                    >
                      <Calendar className="size-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayAppointments
                          .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
                          .slice(0, 5)
                          .map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell className="text-sm">{appointment.time}</TableCell>
                              <TableCell className="text-sm">{appointment.patientName}</TableCell>
                              <TableCell className="text-sm">{appointment.doctorName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                                  className={
                                    appointment.status === 'confirmed'
                                      ? 'bg-green-100 text-green-800'
                                      : appointment.status === 'scheduled'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {appointment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing Section */}
          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="size-5" />
                  Billing Management
                </CardTitle>
                <CardDescription>Process payments for consultations and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">{record.patient}</TableCell>
                          <TableCell className="text-sm">{record.date}</TableCell>
                          <TableCell className="text-sm">{record.service}</TableCell>
                          <TableCell className="text-sm">${record.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={record.status === 'paid' ? 'default' : 'secondary'}
                              className={
                                record.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'partial'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={record.status === 'paid' ? 'outline' : 'default'}
                              onClick={() => {
                                setSelectedBilling(record);
                                setShowBillingDialog(true);
                              }}
                            >
                              {record.status === 'paid' ? 'Receipt' : 'Process'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-In Queue */}
          {activeTab === 'check-in' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Visits</CardTitle>
                  <CardDescription>Patients in waiting area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {waitingRoomList.map((visit) => (
                      <div key={visit.VisitID} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 mb-1">{visit.patientName}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>Type: {visit.visitTypeLabel}</span>
                              <span>Arrived: {visit.arrivalTime || 'Not yet'}</span>
                              {visit.doctorName && <span>Doctor: {visit.doctorName}</span>}
                            </div>
                            {visit.ReasonForVisit && (
                              <p className="text-xs text-gray-600 mt-1">Reason: {visit.ReasonForVisit}</p>
                            )}
                          </div>
                          <Badge
                            className={
                              visit.VisitStatus === 'in-consultation'
                                ? 'bg-purple-100 text-purple-800'
                                : visit.VisitStatus === 'checked-in'
                                ? 'bg-green-100 text-green-800'
                                : visit.VisitStatus === 'arrived'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {visit.VisitStatus}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {visit.VisitStatus === 'arrived' && (
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => handleUpdateVisitStatus(visit.VisitID, 'checked-in')}
                            >
                              Check In
                            </Button>
                          )}
                          {visit.VisitStatus === 'checked-in' && (
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => handleUpdateVisitStatus(visit.VisitID, 'in-consultation')}
                            >
                              Start Consultation
                            </Button>
                          )}
                          {visit.VisitStatus === 'in-consultation' && (
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => handleUpdateVisitStatus(visit.VisitID, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {waitingRoomList.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="size-12 mx-auto mb-3 text-gray-300" />
                        <p>No patients in waiting area</p>
                        <p className="text-sm mt-2">Patients will appear here once they check in</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common reception tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowWalkIn(true)}>
                      <UserPlus className="size-5" />
                      <span className="text-sm">Walk-in Patient</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => alert('Calling patient...')}>
                      <Phone className="size-5" />
                      <span className="text-sm">Call Patient</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowSendReminder(true)}>
                      <Mail className="size-5" />
                      <span className="text-sm">Send Reminder</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => alert('Cancel appointment functionality')}>
                      <Calendar className="size-5" />
                      <span className="text-sm">Cancel Apt</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={receptionistProfile}
      />

      {/* Billing Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {selectedBilling && `Process payment for ${selectedBilling.patient}`}
            </DialogDescription>
          </DialogHeader>
          {selectedBilling && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient:</span>
                  <span className="text-gray-900">{selectedBilling.patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{selectedBilling.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{selectedBilling.service}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-lg text-gray-900">${selectedBilling.amount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-received">Amount Received ($)</Label>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={selectedBilling.amount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Payment notes, insurance details, etc..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleProcessPayment}
                >
                  <CreditCard className="size-4 mr-2" />
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Walk-in Patient Dialog */}
      <Dialog open={showWalkIn} onOpenChange={setShowWalkIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Walk-in Patient</DialogTitle>
            <DialogDescription>Quick registration for walk-in patients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walkin-name">Patient Name</Label>
              <Input id="walkin-name" placeholder="Enter patient name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkin-phone">Phone Number</Label>
              <Input id="walkin-phone" type="tel" placeholder="+1 (555) 000-0000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkin-reason">Reason for Visit</Label>
              <Textarea id="walkin-reason" placeholder="Brief description..." rows={2} />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={() => {
                alert('Walk-in patient registered successfully!');
                setShowWalkIn(false);
              }}>
                Register & Add to Queue
              </Button>
              <Button variant="outline" onClick={() => setShowWalkIn(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showSendReminder} onOpenChange={setShowSendReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Appointment Reminder</DialogTitle>
            <DialogDescription>Send reminder to patients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-patient">Select Patient</Label>
              <Select>
                <SelectTrigger id="reminder-patient">
                  <SelectValue placeholder="Choose patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith - 09:00 AM</SelectItem>
                  <SelectItem value="emma">Emma Davis - 09:30 AM</SelectItem>
                  <SelectItem value="robert">Robert Wilson - 10:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-method">Send Via</Label>
              <Select>
                <SelectTrigger id="reminder-method">
                  <SelectValue placeholder="Choose method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="both">Both SMS & Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-message">Message</Label>
              <Textarea
                id="reminder-message"
                defaultValue="This is a reminder for your appointment at HealthCare Clinic tomorrow."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={() => {
                alert('Reminder sent successfully!');
                setShowSendReminder(false);
              }}>
                Send Reminder
              </Button>
              <Button variant="outline" onClick={() => setShowSendReminder(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modals */}
      {/* Registration Success Modal */}
      <Dialog open={registrationSuccess} onOpenChange={setRegistrationSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Patient Registered!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Patient has been successfully registered in the system.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700 w-full"
              onClick={() => setRegistrationSuccess(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Success Modal */}
      <Dialog open={appointmentSuccess} onOpenChange={setAppointmentSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-600">
                Appointment Scheduled!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                The appointment has been successfully scheduled.
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-6 bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() => setAppointmentSuccess(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}