import { useState, useEffect } from 'react';
import { Activity, Search, Bell, LogOut, Stethoscope, FileText, Calendar, Users, ClipboardList, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { NotificationPanel } from './NotificationPanel';
import { ProfileModal } from './ProfileModal';
import { PatientDetailsModal } from './PatientDetailsModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function DoctorPortal({ onSignOut }: { onSignOut: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showAssignNurse, setShowAssignNurse] = useState(false);
  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false);
  const [showOrderTests, setShowOrderTests] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultation' | 'queue' | 'prescriptions'>('consultation');
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showViewRecord, setShowViewRecord] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // State for real data - initialize as null
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null); // Changed to null
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [patientQueue, setPatientQueue] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null); // Changed to null
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  // Fetch doctor data on component mount
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get doctor ID from localStorage (set during login)
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('No user data found');
        }

        const user = JSON.parse(storedUser);
        setDoctorId(user.userId);

        console.log('Fetching data for doctor ID:', user.userId);

        // Fetch doctor profile
        const profileRes = await fetch(`http://localhost:3001/api/doctor/profile/${user.userId}`);
        
        if (!profileRes.ok) {
          throw new Error(`Failed to fetch doctor profile: ${profileRes.status}`);
        }
        
        const profileData = await profileRes.json();
        setDoctorProfile(profileData); // Set the raw API data directly

        // Fetch appointments
        const appointmentsRes = await fetch(`http://localhost:3001/api/doctor/appointments/${user.userId}`);
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setTodayAppointments(appointmentsData);
        } else {
          console.warn('No appointments data available');
          setTodayAppointments([]);
        }

        // Fetch queue
        const queueRes = await fetch(`http://localhost:3001/api/doctor/queue/${user.userId}`);
        
        if (queueRes.ok) {
          const queueData = await queueRes.json();
          setPatientQueue(queueData);
        } else {
          console.warn('No queue data available');
          setPatientQueue([]);
        }

        // Fetch prescriptions
        const prescriptionsRes = await fetch(`http://localhost:3001/api/doctor/prescriptions/${user.userId}`);
        
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

    fetchDoctorData();
  }, []);

  // Fetch patient details when selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}`);
      if (response.ok) {
        const patientData = await response.json();
        setSelectedPatientData(patientData);
      } else {
        console.warn('Failed to fetch patient details');
        setSelectedPatientData(null);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setSelectedPatientData(null);
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedPatient || !doctorId) {
      alert('Please select a patient first');
      return;
    }

    try {
      const consultationData = {
        appointmentId: selectedPatient,
        doctorId: doctorId,
        patientId: selectedPatient,
        symptoms: (document.getElementById('symptoms') as HTMLTextAreaElement)?.value || '',
        diagnosis: (document.getElementById('diagnosis') as HTMLTextAreaElement)?.value || '',
        treatment: (document.getElementById('prescription') as HTMLTextAreaElement)?.value || '',
        notes: (document.getElementById('notes') as HTMLTextAreaElement)?.value || ''
      };

      const response = await fetch("http://localhost:3001/api/doctor/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultationData)
      });

      const result = await response.json();

      if (response.ok) {
        setConsultationSaved(true);
        setTimeout(() => setConsultationSaved(false), 3000);
        
        // Clear form
        ['symptoms', 'diagnosis', 'prescription', 'notes'].forEach(id => {
          const element = document.getElementById(id) as HTMLTextAreaElement;
          if (element) element.value = '';
        });
        
        // Refresh appointments list
        const appointmentsRes = await fetch(`http://localhost:3001/api/doctor/appointments/${doctorId}`);
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setTodayAppointments(appointmentsData);
        }
      } else {
        alert(result.error || 'Failed to save consultation');
      }
    } catch (error) {
      console.error("Consultation save error:", error);
      alert("Failed to save consultation. Please try again.");
    }
  };

  const handlePrintPrescription = () => {
    setShowPrintPreview(true);
  };

  const handleCallPatient = (patientId: number) => {
    const patient = patientQueue.find(p => p.id === patientId);
    alert(`Calling patient: ${patient?.name}`);
  };

  const handleScheduleFollowUp = async (followUpData: any) => {
    if (!doctorId || !selectedPatient) return;

    try {
      const response = await fetch("http://localhost:3001/api/doctor/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...followUpData,
          patientId: selectedPatient,
          doctorId: doctorId,
          createdBy: doctorId
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Follow-up scheduled successfully!');
        setShowScheduleFollowUp(false);
      } else {
        alert(result.error || 'Failed to schedule follow-up');
      }
    } catch (error) {
      console.error("Follow-up error:", error);
      alert("Failed to schedule follow-up");
    }
  };

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
          <Button variant="outline" onClick={onSignOut} className="ml-2">
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
                  <LogOut className="size-4 mr-2 " />
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

          {/* Tab Navigation */}
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
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="size-4 inline mr-2" />
              Prescriptions
            </button>
          </div>

          {activeTab === 'consultation' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Today's Appointments */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="size-5" />
                    Today's Appointments
                  </CardTitle>
                  <CardDescription>{todayAppointments.length} patients scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedPatient === appointment.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPatient(appointment.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm text-gray-900">{appointment.name}</p>
                            <p className="text-xs text-gray-500">{appointment.time}</p>
                          </div>
                          <Badge
                            variant={
                              appointment.status === 'in-progress'
                                ? 'default'
                                : appointment.status === 'waiting'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              appointment.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'waiting'
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{appointment.type}</p>
                      </div>
                    ))}
                    {todayAppointments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                        <p>No appointments scheduled for today</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Consultation Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="size-5" />
                    Patient Consultation
                  </CardTitle>
                  <CardDescription>
                    {selectedPatient
                      ? `Recording consultation for ${todayAppointments.find(a => a.id === selectedPatient)?.name}`
                      : 'Select a patient to begin consultation'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Patient Name</Label>
                          <Input
                            value={todayAppointments.find(a => a.id === selectedPatient)?.name || ''}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Visit Type</Label>
                          <Input
                            value={todayAppointments.find(a => a.id === selectedPatient)?.type || ''}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="symptoms">Chief Complaint / Symptoms</Label>
                        <Textarea
                          id="symptoms"
                          placeholder="Describe patient's symptoms..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                          id="diagnosis"
                          placeholder="Enter diagnosis..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prescription">Prescription / Treatment Plan</Label>
                        <Textarea
                          id="prescription"
                          placeholder="Medication, dosage, and treatment instructions..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Doctor's Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional notes..."
                          rows={2}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveConsultation}>
                          Save Consultation
                        </Button>
                        <Button variant="outline" onClick={handlePrintPrescription}>
                          Print Prescription
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowPatientDetails(true);
                        }}>
                          <User className="size-4 mr-2" />
                          View Full Record
                        </Button>
                        <Button variant="outline" onClick={() => setShowScheduleFollowUp(true)}>
                          <Calendar className="size-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                        <Button variant="outline" onClick={() => setShowAssignNurse(true)}>
                          <Users className="size-4 mr-2" />
                          Assign to Nurse
                        </Button>
                        <Button variant="outline" onClick={() => setShowOrderTests(true)}>
                          <FileText className="size-4 mr-2" />
                          Order Lab Tests
                        </Button>
                        <Button variant="outline" onClick={() => setShowReferral(true)}>
                          <Users className="size-4 mr-2" />
                          Create Referral
                        </Button>
                      </div>
                      {consultationSaved && (
                        <div className="mt-3 text-sm text-green-500">
                          Consultation saved successfully!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Stethoscope className="size-12 mx-auto mb-3 text-gray-400" />
                      <p>Select a patient from today's appointments to begin consultation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5" />
                    Patient Queue
                  </CardTitle>
                  <CardDescription>Patients waiting to see you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patientQueue.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline">{patient.number}</Badge>
                            <p className="text-sm text-gray-900">{patient.name}</p>
                          </div>
                          <p className="text-xs text-gray-500">Waiting: {patient.waitTime}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.priority === 'urgent' && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          <Button size="sm" onClick={() => handleCallPatient(patient.id)}>Call Patient</Button>
                        </div>
                      </div>
                    ))}
                    {patientQueue.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="size-12 mx-auto mb-3 text-gray-400" />
                        <p>No patients in queue</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Queue Statistics</CardTitle>
                  <CardDescription>Today's patient flow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-700">Patients Seen Today</span>
                      <span className="text-2xl text-blue-600">
                        {todayAppointments.filter(a => a.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm text-gray-700">In Queue</span>
                      <span className="text-2xl text-orange-600">{patientQueue.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">Average Wait Time</span>
                      <span className="text-2xl text-green-600">
                        {patientQueue.length > 0 ? '15m' : '0m'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Recent Prescriptions
                </CardTitle>
                <CardDescription>Prescriptions issued by you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPrescriptions.map((prescription, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-sm text-gray-900">{prescription.patient}</p>
                            <Badge variant="outline" className="text-xs">{prescription.date}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">{prescription.medication}</p>
                          <p className="text-xs text-gray-500 mt-1">Dosage: {prescription.dosage}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedPrescription(prescription);
                            setShowPrescriptionView(true);
                          }}>View</Button>
                          <Button variant="ghost" size="sm" onClick={handlePrintPrescription}>Reprint</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentPrescriptions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="size-12 mx-auto mb-3 text-gray-400" />
                      <p>No recent prescriptions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Recent Medical Records
              </CardTitle>
              <CardDescription>Recently accessed patient records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentRecords.map((record, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm text-gray-900">{record.patient}</p>
                          <Badge variant="outline" className="text-xs">
                            {record.date}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Treatment:</span> {record.treatment}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowViewRecord(true)}>
                        View Full Record
                      </Button>
                    </div>
                  </div>
                ))}
                {recentRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="size-12 mx-auto mb-3 text-gray-400" />
                    <p>No recent medical records</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Profile Modal */}
      {/* Profile Modal - Pass the real data */}
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
          joinDate: '2024', // You can add this to your database
          specialization: doctorProfile?.Specialization || 'General Medicine',
          certifications: []
        }}
      />

      <PatientDetailsModal
        open={showPatientDetails}
        onOpenChange={setShowPatientDetails}
        patient={selectedPatientData}
      />

      {/* Assign to Nurse Dialog */}
      <Dialog open={showAssignNurse} onOpenChange={setShowAssignNurse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Patient to Nurse</DialogTitle>
            <DialogDescription>
              Assign {todayAppointments.find(a => a.id === selectedPatient)?.name} to a nurse for care
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nurse">Select Nurse</Label>
              <Select>
                <SelectTrigger id="nurse">
                  <SelectValue placeholder="Choose a nurse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emily">Emily White - General Care</SelectItem>
                  <SelectItem value="maria">Maria Garcia - ICU</SelectItem>
                  <SelectItem value="james">James Wilson - Cardiology</SelectItem>
                  <SelectItem value="sarah">Sarah Brown - Pediatrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Care Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Special instructions for nursing care..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Assign Patient
              </Button>
              <Button variant="outline" onClick={() => setShowAssignNurse(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleFollowUp} onOpenChange={setShowScheduleFollowUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Appointment</DialogTitle>
            <DialogDescription>
              Schedule a follow-up for {todayAppointments.find(a => a.id === selectedPatient)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followup-date">Date</Label>
                <Input id="followup-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followup-time">Time</Label>
                <Input id="followup-time" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-type">Appointment Type</Label>
              <Select>
                <SelectTrigger id="followup-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Regular Check-up</SelectItem>
                  <SelectItem value="test-results">Test Results Review</SelectItem>
                  <SelectItem value="treatment">Treatment Follow-up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-notes">Notes</Label>
              <Textarea
                id="followup-notes"
                placeholder="Reason for follow-up, tests needed, etc..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                const date = (document.getElementById('followup-date') as HTMLInputElement)?.value;
                const time = (document.getElementById('followup-time') as HTMLInputElement)?.value;
                const type = (document.getElementById('followup-type') as HTMLSelectElement)?.value;
                const notes = (document.getElementById('followup-notes') as HTMLTextAreaElement)?.value;
                
                if (date && time && type) {
                  handleScheduleFollowUp({ date, time, type, notes });
                } else {
                  alert('Please fill in all required fields');
                }
              }}>
                Schedule Appointment
              </Button>
              <Button variant="outline" onClick={() => setShowScheduleFollowUp(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Lab Tests Dialog */}
      <Dialog open={showOrderTests} onOpenChange={setShowOrderTests}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Laboratory Tests</DialogTitle>
            <DialogDescription>
              Order lab tests for {todayAppointments.find(a => a.id === selectedPatient)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Select Tests</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="cbc" className="rounded" />
                  <label htmlFor="cbc" className="text-sm">Complete Blood Count (CBC)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="glucose" className="rounded" />
                  <label htmlFor="glucose" className="text-sm">Blood Glucose</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="lipid" className="rounded" />
                  <label htmlFor="lipid" className="text-sm">Lipid Panel</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="liver" className="rounded" />
                  <label htmlFor="liver" className="text-sm">Liver Function Test</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="kidney" className="rounded" />
                  <label htmlFor="kidney" className="text-sm">Kidney Function Test</label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-instructions">Special Instructions</Label>
              <Textarea
                id="test-instructions"
                placeholder="Fasting required, urgent, etc..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Order Tests
              </Button>
              <Button variant="outline" onClick={() => setShowOrderTests(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Referral Dialog */}
      <Dialog open={showReferral} onOpenChange={setShowReferral}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral</DialogTitle>
            <DialogDescription>
              Refer {todayAppointments.find(a => a.id === selectedPatient)?.name} to a specialist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select>
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="gastro">Gastroenterology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Referral</Label>
              <Textarea
                id="reason"
                placeholder="Clinical findings and reason for referral..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Create Referral
              </Button>
              <Button variant="outline" onClick={() => setShowReferral(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Prescription</DialogTitle>
            <DialogDescription>Prescription preview</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
              <div className="text-center mb-4 pb-4 border-b">
                <h3 className="text-lg">HealthCare Clinic</h3>
                <p className="text-sm text-gray-600">123 Medical Center Dr, Suite 100</p>
                <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
              </div>
              <div className="mb-4">
                <p className="text-sm"><span className="font-medium">Patient:</span> {todayAppointments.find(a => a.id === selectedPatient)?.name}</p>
                <p className="text-sm"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Doctor:</span> {doctorProfile.name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Rx</p>
                <p className="text-sm mb-2">Medication details will be printed here</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{doctorProfile.name}, MD</p>
                <p className="text-sm text-gray-600">License #: 12345</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                alert('Printing prescription...');
                setShowPrintPreview(false);
              }}>
                Print
              </Button>
              <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription View Dialog */}
      <Dialog open={showPrescriptionView} onOpenChange={setShowPrescriptionView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              {selectedPrescription && `Prescription for ${selectedPrescription.patient}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient:</span>
                  <span className="text-gray-900">{selectedPrescription.patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Medication:</span>
                  <span className="text-gray-900">{selectedPrescription.medication}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dosage:</span>
                  <span className="text-gray-900">{selectedPrescription.dosage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{selectedPrescription.date}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowPrescriptionView(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                onSignOut();
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