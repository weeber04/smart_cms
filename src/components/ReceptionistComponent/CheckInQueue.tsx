// CheckInQueue.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserPlus, Phone, Mail, Calendar, Search, Users, Send, X, 
  Stethoscope, RefreshCw, AlertTriangle, Activity, Siren, Clock 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { CalendarX, CalendarCheck } from 'lucide-react';


interface CheckInQueueProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
  waitingRoomList: any[];
}

interface AppointmentForReminder {
  AppointmentID: number;
  AppointmentDateTime: string;
  Purpose: string;
  Status: string;
  QueueNumber: string | null;
  PatientID: number;
  PatientName: string;
  PatientEmail: string | null;
  PatientPhone: string | null;
  PatientAccountID: number | null;
  DoctorName: string;
  DoctorSpecialization: string;
}

interface Patient {
  id: number;
  Name: string;
  ICNo: string;
  PhoneNumber: string;
  Email: string;
  Gender: string;
  DOB: string;
  BloodType: string;
  canRegister: boolean;
  queueInfo?: {
    queueNumber: string;
    queueStatus: string;
    visitStatus: string;
    arrivalTime: string;
  };
  queueStatusCategory?: string;
}

interface PatientForAccount {
  id: number;
  name: string;
  icNumber: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  insurance: string;
  hasAccount: boolean;
}

interface AppointmentForCancellation {
  AppointmentID: number;
  AppointmentDateTime: string;
  Purpose: string;
  Status: string;
  QueueNumber: string | null;
  PatientID: number;
  PatientName: string;
  PatientEmail: string | null;
  PatientPhone: string | null;
  DoctorName: string;
  DoctorSpecialization: string;
  CancellationReason?: string;
}

export function CheckInQueue({ receptionistId, doctors, refreshData }: CheckInQueueProps) {
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showSendReminder, setShowSendReminder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimeoutRef = useRef<number | null>(null);
  const [walkinFormData, setWalkinFormData] = useState({
    doctorId: '',
    reason: '',
    priority: 'low' // Default priority
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentForReminder[]>([]);
const [filteredAppointments, setFilteredAppointments] = useState<AppointmentForReminder[]>([]);
const [searchAppointmentTerm, setSearchAppointmentTerm] = useState('');
const [selectedAppointment, setSelectedAppointment] = useState<AppointmentForReminder | null>(null);
const [reminderMethod, setReminderMethod] = useState('sms');
const [reminderMessage, setReminderMessage] = useState('');
const [sendingReminder, setSendingReminder] = useState(false);
const [showCreateAccount, setShowCreateAccount] = useState(false);
const [patientForAccount, setPatientForAccount] = useState<any>(null);
const [accountFormData, setAccountFormData] = useState({
  icNumber: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
});
const [accountCreationStep, setAccountCreationStep] = useState(1); // 1: Search, 2: Verify, 3: Create
const [verifyingIC, setVerifyingIC] = useState(false);
const [creatingAccount, setCreatingAccount] = useState(false);
const [accountError, setAccountError] = useState<string | null>(null);

const [showCancelAppointment, setShowCancelAppointment] = useState(false);
const [upcomingAppointmentsForCancel, setUpcomingAppointmentsForCancel] = useState<AppointmentForCancellation[]>([]);
const [filteredCancellationAppointments, setFilteredCancellationAppointments] = useState<AppointmentForCancellation[]>([]);
const [searchCancellationTerm, setSearchCancellationTerm] = useState('');
const [selectedAppointmentForCancel, setSelectedAppointmentForCancel] = useState<AppointmentForCancellation | null>(null);
const [cancellationReason, setCancellationReason] = useState('');
const [cancellingAppointment, setCancellingAppointment] = useState(false);
const [showReschedule, setShowReschedule] = useState(false);
const [rescheduleDateTime, setRescheduleDateTime] = useState('');
const [reschedulingAppointment, setReschedulingAppointment] = useState(false);


  const resetWalkInForm = () => {
    console.log('Resetting form');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setCurrentPage(1);
    setWalkinFormData({
      doctorId: '',
      reason: '',
      priority: 'low'
    });
  };

  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentPage(1); // Reset page when search is cleared
      return;
    }

    console.log('Searching for:', searchQuery);
    setIsSearching(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new search
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/receptionist/search-patient?search=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const patients = await response.json();
        console.log('Search results with queue info:', patients);
        setSearchResults(patients);
      } else {
        const errorData = await response.json();
        console.error('Search API error:', errorData);
        setError(errorData.error || 'Search failed');
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search for patients. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when user stops typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchPatient();
      } else {
        setSearchResults([]);
        setCurrentPage(1);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleRegisterWalkIn = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    // Add more detailed check
    if (selectedPatient.queueInfo) {
      const status = selectedPatient.queueInfo.queueStatus?.toLowerCase();
      if (status && ['waiting', 'in-progress', 'checked-in'].includes(status)) {
        setError(`This patient is currently "${selectedPatient.queueInfo.queueStatus}" and cannot be added again`);
        return;
      }
    }

    if (!walkinFormData.reason.trim()) {
      setError('Please enter reason for visit');
      return;
    }

    if (!receptionistId) {
      setError('Receptionist ID is missing');
      return;
    }

    try {
      console.log('Registering walk-in:', {
        patientId: selectedPatient.id,
        doctorId: walkinFormData.doctorId,
        reason: walkinFormData.reason,
        priority: walkinFormData.priority,
        receptionistId
      });

      const response = await fetch('http://localhost:3001/api/receptionist/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: walkinFormData.doctorId || null,
          reason: walkinFormData.reason,
          priority: walkinFormData.priority,
          receptionistId: receptionistId
        })
      });

      const result = await response.json();
      console.log('Registration response:', result);

      if (response.ok && result.success) {
        setDialogTitle("Walk-in Registered");
        setDialogMessage(`Queue Number: ${result.queueNumber}\nPriority: ${walkinFormData.priority.toUpperCase()}\n${walkinFormData.doctorId ? `Doctor Assigned: Yes` : 'No doctor assigned'}`);
        setDialogOpen(true);

        resetWalkInForm();
        setShowWalkIn(false);
        refreshData();
      } else {
        setDialogTitle("Registration Failed");
        setDialogMessage(result.error || "Failed to register walk-in");
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Walk-in registration error:", error);
      setDialogTitle("Error");
      setDialogMessage("Failed to register walk-in. Please check console for details.");
      setDialogOpen(true);
    }
  };

  // Pagination handlers
  const handlePrevPage = useCallback(() => {
    console.log('Previous page clicked, current page:', currentPage);
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    const patientsPerPage = 3;
    const totalPages = Math.ceil(searchResults.length / patientsPerPage);
    console.log('Next page clicked, current page:', currentPage, 'total pages:', totalPages);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, searchResults.length]);

useEffect(() => {
  if (showSendReminder) {
    fetchUpcomingAppointments(true); // Only patients with accounts
  }
}, [showSendReminder]);

  // Get priority badge component
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
            <Siren className="size-3 mr-1" />
            Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            <AlertTriangle className="size-3 mr-1" />
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
            <Activity className="size-3 mr-1" />
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  // Search Results Component
  const PatientSearchResults = () => {
    if (searchResults.length === 0 || isSearching || selectedPatient) {
      return null;
    }

    const patientsPerPage = 3;
    const totalPages = Math.ceil(searchResults.length / patientsPerPage);
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = searchResults.slice(indexOfFirstPatient, indexOfLastPatient);
    const showPagination = searchResults.length > patientsPerPage;

    console.log('PatientSearchResults render:', {
      searchResultsCount: searchResults.length,
      currentPage,
      totalPages,
      currentPatientsCount: currentPatients.length,
      showPagination
    });

    return (
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
        {/* Patient count header - FIXED POSITION */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-700">
          Found {searchResults.length} patient(s)
          {showPagination && (
            <span className="text-gray-500">
              {' '}• Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        
        {/* Scrollable patient list */}
        <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
          {currentPatients.map((patient) => {
            const getStatusBadge = () => {
              if (!patient.queueInfo) {
                return null;
              }
              
              switch (patient.queueInfo.queueStatus) {
                case 'waiting':
                  return (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      In Queue: {patient.queueInfo.queueNumber}
                    </Badge>
                  );
                case 'in-progress':
                  return (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      In Consultation: {patient.queueInfo.queueNumber}
                    </Badge>
                  );
                case 'completed':
                  return (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Completed Today
                    </Badge>
                  );
                case 'cancelled':
                  return (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      Cancelled Today
                    </Badge>
                  );
                default:
                  return null;
              }
            };

            const canSelectPatient = patient.canRegister;
            
            return (
              <div
                key={patient.id}
                className={`p-4 ${
                  canSelectPatient 
                    ? 'hover:bg-gray-50 cursor-pointer bg-white' 
                    : 'bg-gray-50 cursor-not-allowed opacity-80'
                } transition-colors`}
                onClick={() => {
                  if (canSelectPatient) {
                    console.log('Selecting patient:', patient);
                    setSelectedPatient(patient);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-gray-900 truncate">{patient.Name}</p>
                      {getStatusBadge()}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-[180px]">IC: {patient.ICNo}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]">Phone: {patient.PhoneNumber}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Gender: {patient.Gender}</span>
                    </div>
                    {patient.Email && (
                      <p className="text-sm text-gray-600 mb-2 truncate">Email: {patient.Email}</p>
                    )}
                    
                    {patient.queueInfo && (
                      <div className={`mt-2 p-3 rounded-md text-sm ${
                        patient.queueInfo.queueStatus === 'waiting' 
                          ? 'bg-blue-50 border border-blue-200' 
                          : patient.queueInfo.queueStatus === 'in-progress'
                          ? 'bg-purple-50 border border-purple-200'
                          : patient.queueInfo.queueStatus === 'completed'
                          ? 'bg-green-50 border border-green-200'
                          : patient.queueInfo.queueStatus === 'cancelled'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <p className={`font-medium truncate ${
                          patient.queueInfo.queueStatus === 'waiting' 
                            ? 'text-blue-800' 
                            : patient.queueInfo.queueStatus === 'in-progress'
                            ? 'text-purple-800'
                            : patient.queueInfo.queueStatus === 'completed'
                            ? 'text-green-800'
                            : patient.queueInfo.queueStatus === 'cancelled'
                            ? 'text-red-800'
                            : 'text-gray-800'
                        }`}>
                          {patient.queueInfo.queueStatus === 'waiting' && 'Already in queue today'}
                          {patient.queueInfo.queueStatus === 'in-progress' && 'Currently in consultation'}
                          {patient.queueInfo.queueStatus === 'completed' && 'Visit completed today'}
                          {patient.queueInfo.queueStatus === 'cancelled' && 'Visit cancelled today'}
                        </p>
                        {patient.queueInfo.queueNumber && (
                          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600 mt-1">
                            <span className="truncate">Queue: {patient.queueInfo.queueNumber}</span>
                            <span>•</span>
                            <span className="truncate">Status: {patient.queueInfo.visitStatus}</span>
                            <span>•</span>
                            <span className="truncate">Arrival: {new Date(patient.queueInfo.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        )}
                        <div className="text-xs mt-2 italic">
                          {!canSelectPatient ? (
                            <span className="text-amber-700">
                              {patient.queueInfo.queueStatus === 'waiting' && 'Already in queue - cannot add again'}
                              {patient.queueInfo.queueStatus === 'in-progress' && 'Currently in consultation - cannot add again'}
                            </span>
                          ) : (
                            <span className="text-green-700">
                              Can register for new visit
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {canSelectPatient ? (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Selecting patient via button:', patient);
                          setSelectedPatient(patient);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Select
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      >
                        {patient.queueInfo?.queueStatus === 'waiting' ? 'In Queue' : 
                         patient.queueInfo?.queueStatus === 'in-progress' ? 'In Consultation' : 
                         'Cannot Select'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls - FIXED AT BOTTOM OF RESULTS */}
        {showPagination && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="text-sm px-3"
            >
              ← Previous
            </Button>
            
            <div className="text-sm text-gray-700">
              <span className="font-medium">{currentPage}</span>
              <span className="text-gray-400"> / {totalPages}</span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="text-sm px-3"
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
  if (showSendReminder) {
    fetchUpcomingAppointments();
  }
}, [showSendReminder]);

const fetchUpcomingAppointments = async (showOnlyWithAccounts = false) => {
  try {
    const url = showOnlyWithAccounts 
      ? "http://localhost:3001/api/receptionist/upcoming-appointments?hasAccount=true"
      : "http://localhost:3001/api/receptionist/upcoming-appointments";
    
    console.log('Fetching appointments from:', url); // Add this log
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const data = await response.json();
    console.log('Received appointments:', data.length, 'items'); // Add this log
    setUpcomingAppointments(data);
    setFilteredAppointments(data);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    alert("Failed to load upcoming appointments");
  }
};

// Update the useEffect to fetch only patients with accounts initially:
useEffect(() => {
  if (showSendReminder) {
    fetchUpcomingAppointments(true); // Only show patients with accounts
  }
}, [showSendReminder]);
// Filter appointments when search term changes
useEffect(() => {
  if (!searchAppointmentTerm.trim()) {
    setFilteredAppointments(upcomingAppointments);
    return;
  }
  
  const filtered = upcomingAppointments.filter(appointment =>
    appointment.PatientName.toLowerCase().includes(searchAppointmentTerm.toLowerCase()) ||
    appointment.PatientPhone?.includes(searchAppointmentTerm) ||
    appointment.QueueNumber?.includes(searchAppointmentTerm) ||
    appointment.AppointmentID.toString().includes(searchAppointmentTerm)
  );
  
  setFilteredAppointments(filtered);
}, [searchAppointmentTerm, upcomingAppointments]);

// Format appointment date for display
const formatAppointmentDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString()
  };
};

// Handle sending reminder
const handleSendReminder = async () => {
  if (!selectedAppointment || !receptionistId || !selectedAppointment.PatientAccountID) {
    alert("Please select an appointment and ensure patient has an account");
    return;
  }

  if (!reminderMethod) {
    alert("Please select a reminder method");
    return;
  }

  setSendingReminder(true);
  try {
    const formattedDateTime = formatAppointmentDateTime(selectedAppointment.AppointmentDateTime);
    
    const reminderData = {
      appointmentId: selectedAppointment.AppointmentID,
      patientAccountId: selectedAppointment.PatientAccountID,
      patientName: selectedAppointment.PatientName,
      appointmentDateTime: selectedAppointment.AppointmentDateTime,
      doctorName: selectedAppointment.DoctorName,
      method: reminderMethod,
      message: reminderMessage || `Reminder: Appointment with Dr. ${selectedAppointment.DoctorName} on ${formattedDateTime.date} at ${formattedDateTime.time}`,
      receptionistId: receptionistId
    };

    const response = await fetch("http://localhost:3001/api/receptionist/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminderData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`Reminder sent successfully! Notification ID: ${result.notificationId}`);
      
      // Reset form
      setSelectedAppointment(null);
      setReminderMethod('sms');
      setReminderMessage('');
      setShowSendReminder(false);
      
      // Refresh appointments list
      fetchUpcomingAppointments();
    } else {
      alert(result.error || 'Failed to send reminder');
    }
  } catch (error) {
    console.error("Error sending reminder:", error);
    alert("Failed to send reminder");
  } finally {
    setSendingReminder(false);
  }
};

// Handle auto-fill message when appointment is selected
useEffect(() => {
  if (selectedAppointment) {
    const formattedDateTime = formatAppointmentDateTime(selectedAppointment.AppointmentDateTime);
    const defaultMessage = `Reminder: You have an appointment with Dr. ${selectedAppointment.DoctorName} ` +
      `(${selectedAppointment.DoctorSpecialization}) on ${formattedDateTime.date} at ${formattedDateTime.time}. ` +
      `Please arrive 15 minutes early. Queue number: ${selectedAppointment.QueueNumber || 'Will be assigned on arrival'}`;
    
    setReminderMessage(defaultMessage);
  }
}, [selectedAppointment]);

// Add this function to handle IC number verification
// Change this in handleVerifyICNumber function:
const handleVerifyICNumber = async (e?: React.FormEvent) => {
  if (e) {
    e.preventDefault(); // Prevent form submission
  }

  if (!accountFormData.icNumber.trim()) {
    
    setAccountError('Please enter IC number');
    return;
  }

  // Validate IC number format
  const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$|^[0-9]{12}$/;
  if (!icRegex.test(accountFormData.icNumber)) {
    setAccountError('Please enter a valid IC number format (e.g., 900101-01-1234 or 900101011234)');
    return;
  }

  setVerifyingIC(true);
  setAccountError(null);

  try {
    // FIRST: Check if there's already an account for this IC
    const checkAccountResponse = await fetch(
      `http://localhost:3001/api/receptionist/check-account/${accountFormData.icNumber}`
    );
    
    const accountCheck = await checkAccountResponse.json();
    
    if (accountCheck.hasAccount) {
      setAccountError('This patient already has a mobile account');
      return;
    }
    
    // SECOND: Find patient by IC number
    const response = await fetch(
      `http://localhost:3001/api/receptionist/find-patient-by-ic/${accountFormData.icNumber}`
    );
    
    const result = await response.json();

    if (response.ok && result.patient) {
      setPatientForAccount(result.patient);
      setAccountCreationStep(2); // Move to verification step
      
      // Pre-fill form with patient data
      setAccountFormData(prev => ({
        ...prev,
        email: result.patient.email || '',
        phone: result.patient.phone || '',
      }));
    } else {
      setAccountError(result.error || 'Patient not found. Please register patient first.');
    }
  } catch (error) {
    console.error('Verify IC error:', error);
    setAccountError('Failed to verify patient. Please try again.');
  } finally {
    setVerifyingIC(false);
  }
};
// Add this function to handle account creation
const handleCreatePatientAccount = async () => {
  // Validation
  if (!accountFormData.email.trim()) {
    setAccountError('Email is required');
    return;
  }

  if (!accountFormData.phone.trim()) {
    setAccountError('Phone number is required');
    return;
  }

  if (!accountFormData.password.trim()) {
    setAccountError('Password is required');
    return;
  }

  if (accountFormData.password.length < 6) {
    setAccountError('Password must be at least 6 characters');
    return;
  }

  if (accountFormData.password !== accountFormData.confirmPassword) {
    setAccountError('Passwords do not match');
    return;
  }

  if (!receptionistId) {
    setAccountError('Receptionist ID is missing');
    return;
  }

  setCreatingAccount(true);
  setAccountError(null);

  try {
    const response = await fetch('http://localhost:3001/api/receptionist/create-patient-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        icNumber: accountFormData.icNumber,
        email: accountFormData.email,
        phone: accountFormData.phone,
        password: accountFormData.password,
        receptionistId: receptionistId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Show success message
      setDialogTitle("Account Created Successfully");
      setDialogMessage(
        `Patient account created for ${result.patientName}!\n\n` +
        `Account ID: ${result.accountId}\n` +
        `Email: ${accountFormData.email}\n` +
        `Phone: ${accountFormData.phone}\n\n` +
        `The patient can now login to the mobile app.`
      );
      setDialogOpen(true);

      // Reset form
      resetAccountForm();
      setShowCreateAccount(false);
      
      // Refresh any relevant data
      if (showSendReminder) {
        fetchUpcomingAppointments();
      }
    } else {
      setAccountError(result.error || 'Failed to create account');
    }
  } catch (error) {
    console.error('Create account error:', error);
    setAccountError('Failed to create account. Please try again.');
  } finally {
    setCreatingAccount(false);
  }
};


// Add this function to reset the account form
const resetAccountForm = () => {
  setAccountFormData({
    icNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  setPatientForAccount(null);
  setAccountCreationStep(1);
  setAccountError(null);
};



useEffect(() => {
  if (showCancelAppointment) {
    fetchAppointmentsForCancellation();
  }
}, [showCancelAppointment]);

// Add this function to fetch appointments for cancellation
const fetchAppointmentsForCancellation = async () => {
  try {
    const response = await fetch("http://localhost:3001/api/receptionist/upcoming-appointments?status=upcoming");
    if (!response.ok) throw new Error('Failed to fetch appointments');
    
    const data = await response.json();
    setUpcomingAppointmentsForCancel(data);
    setFilteredCancellationAppointments(data);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    alert("Failed to load upcoming appointments");
  }
};

// Add this function to handle appointment cancellation
const handleCancelAppointment = async () => {
  if (!selectedAppointmentForCancel || !cancellationReason.trim()) {
    alert("Please select an appointment and provide a cancellation reason");
    return;
  }

  if (!receptionistId) {
    alert("Receptionist ID is missing");
    return;
  }

  const confirmCancel = window.confirm(
    `Are you sure you want to cancel this appointment?\n\n` +
    `Patient: ${selectedAppointmentForCancel.PatientName}\n` +
    `Appointment: ${formatAppointmentDateTime(selectedAppointmentForCancel.AppointmentDateTime).full}\n` +
    `Doctor: Dr. ${selectedAppointmentForCancel.DoctorName}`
  );

  if (!confirmCancel) return;

  setCancellingAppointment(true);

  try {
    const response = await fetch("http://localhost:3001/api/receptionist/cancel-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppointmentForCancel.AppointmentID,
        cancellationReason: cancellationReason,
        cancelledByReceptionistId: receptionistId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Show success message
      setDialogTitle("Appointment Cancelled");
      setDialogMessage(
        `Appointment successfully cancelled!\n\n` +
        `Patient: ${selectedAppointmentForCancel.PatientName}\n` +
        `Appointment ID: ${selectedAppointmentForCancel.AppointmentID}\n` +
        `Cancellation Reference: ${result.cancellationRef}\n\n` +
        `The patient has been notified of the cancellation.`
      );
      setDialogOpen(true);

      // Reset form
      setSelectedAppointmentForCancel(null);
      setCancellationReason('');
      setShowCancelAppointment(false);
      
      // Refresh appointments list
      fetchAppointmentsForCancellation();
      refreshData(); // Refresh waiting room list
    } else {
      alert(result.error || 'Failed to cancel appointment');
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Failed to cancel appointment. Please try again.");
  } finally {
    setCancellingAppointment(false);
  }
};

// Add this function to handle appointment rescheduling
const handleRescheduleAppointment = async () => {
  if (!selectedAppointmentForCancel || !rescheduleDateTime) {
    alert("Please select an appointment and choose a new date/time");
    return;
  }

  if (!receptionistId) {
    alert("Receptionist ID is missing");
    return;
  }

  const confirmReschedule = window.confirm(
    `Reschedule this appointment?\n\n` +
    `From: ${formatAppointmentDateTime(selectedAppointmentForCancel.AppointmentDateTime).full}\n` +
    `To: ${formatAppointmentDateTime(rescheduleDateTime).full}`
  );

  if (!confirmReschedule) return;

  setReschedulingAppointment(true);

  try {
    const response = await fetch("http://localhost:3001/api/receptionist/reschedule-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppointmentForCancel.AppointmentID,
        newDateTime: rescheduleDateTime,
        rescheduledByReceptionistId: receptionistId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Show success message
      setDialogTitle("Appointment Rescheduled");
      setDialogMessage(
        `Appointment successfully rescheduled!\n\n` +
        `Patient: ${selectedAppointmentForCancel.PatientName}\n` +
        `New Appointment: ${formatAppointmentDateTime(rescheduleDateTime).full}\n` +
        `Doctor: Dr. ${selectedAppointmentForCancel.DoctorName}\n\n` +
        `The patient has been notified of the change.`
      );
      setDialogOpen(true);

      // Reset form
      setSelectedAppointmentForCancel(null);
      setRescheduleDateTime('');
      setShowReschedule(false);
      setShowCancelAppointment(false);
      
      // Refresh appointments list
      fetchAppointmentsForCancellation();
      refreshData();
    } else {
      alert(result.error || 'Failed to reschedule appointment');
    }
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    alert("Failed to reschedule appointment. Please try again.");
  } finally {
    setReschedulingAppointment(false);
  }
};

// Update the filteredAppointments useEffect to hide other appointments when one is selected
useEffect(() => {
  if (!searchCancellationTerm.trim() && !selectedAppointmentForCancel) {
    setFilteredCancellationAppointments(upcomingAppointmentsForCancel);
    return;
  }
  
  let filtered = upcomingAppointmentsForCancel;
  
  // Apply search filter if there's a search term
  if (searchCancellationTerm.trim()) {
    filtered = filtered.filter(appointment =>
      appointment.PatientName.toLowerCase().includes(searchCancellationTerm.toLowerCase()) ||
      appointment.PatientPhone?.includes(searchCancellationTerm) ||
      appointment.QueueNumber?.includes(searchCancellationTerm) ||
      appointment.AppointmentID.toString().includes(searchCancellationTerm)
    );
  }
  
  // If an appointment is selected, ONLY show that appointment
  if (selectedAppointmentForCancel) {
    filtered = filtered.filter(
      appointment => appointment.AppointmentID === selectedAppointmentForCancel.AppointmentID
    );
  }
  
  setFilteredCancellationAppointments(filtered);
}, [searchCancellationTerm, selectedAppointmentForCancel, upcomingAppointmentsForCancel]);

//-----------------------------------


const CreateAccountDialog = () => {
  // Move the form states inside the dialog component to avoid re-rendering parent
  const [localAccountFormData, setLocalAccountFormData] = useState({
    icNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [localPatientForAccount, setLocalPatientForAccount] = useState<any>(null);
  const [localAccountCreationStep, setLocalAccountCreationStep] = useState(1);
  const [localVerifyingIC, setLocalVerifyingIC] = useState(false);
  const [localCreatingAccount, setLocalCreatingAccount] = useState(false);
  const [localAccountError, setLocalAccountError] = useState<string | null>(null);

  // Reset function for local state
  const resetLocalAccountForm = () => {
    setLocalAccountFormData({
      icNumber: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setLocalPatientForAccount(null);
    setLocalAccountCreationStep(1);
    setLocalAccountError(null);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    resetLocalAccountForm();
    setShowCreateAccount(false);
  };

  // Handle IC verification
  const handleVerifyICNumber = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!localAccountFormData.icNumber.trim()) {
      setLocalAccountError('Please enter IC number');
      return;
    }

    const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$|^[0-9]{12}$/;
    if (!icRegex.test(localAccountFormData.icNumber)) {
      setLocalAccountError('Please enter a valid IC number format (e.g., 900101-01-1234 or 900101011234)');
      return;
    }

    setLocalVerifyingIC(true);
    setLocalAccountError(null);

    try {
      // Check if there's already an account
      const checkAccountResponse = await fetch(
        `http://localhost:3001/api/receptionist/check-account/${localAccountFormData.icNumber}`
      );
      
      const accountCheck = await checkAccountResponse.json();
      
      if (accountCheck.hasAccount) {
        setLocalAccountError('This patient already has a mobile account');
        return;
      }
      
      // Find patient by IC number
      const response = await fetch(
        `http://localhost:3001/api/receptionist/find-patient-by-ic/${localAccountFormData.icNumber}`
      );
      
      const result = await response.json();

      if (response.ok && result.patient) {
        setLocalPatientForAccount(result.patient);
        setLocalAccountCreationStep(2);
        
        // Pre-fill form with patient data
        setLocalAccountFormData(prev => ({
          ...prev,
          email: result.patient.email || '',
          phone: result.patient.phone || '',
        }));
      } else {
        setLocalAccountError(result.error || 'Patient not found. Please register patient first.');
      }
    } catch (error) {
      console.error('Verify IC error:', error);
      setLocalAccountError('Failed to verify patient. Please try again.');
    } finally {
      setLocalVerifyingIC(false);
    }
  };

  // Handle account creation
  const handleCreatePatientAccount = async () => {
    // Validation
    if (!localAccountFormData.email.trim()) {
      setLocalAccountError('Email is required');
      return;
    }

    if (!localAccountFormData.phone.trim()) {
      setLocalAccountError('Phone number is required');
      return;
    }

    if (!localAccountFormData.password.trim()) {
      setLocalAccountError('Password is required');
      return;
    }

    if (localAccountFormData.password.length < 6) {
      setLocalAccountError('Password must be at least 6 characters');
      return;
    }

    if (localAccountFormData.password !== localAccountFormData.confirmPassword) {
      setLocalAccountError('Passwords do not match');
      return;
    }

    if (!receptionistId) {
      setLocalAccountError('Receptionist ID is missing');
      return;
    }

    setLocalCreatingAccount(true);
    setLocalAccountError(null);

    try {
      const response = await fetch('http://localhost:3001/api/receptionist/create-patient-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icNumber: localAccountFormData.icNumber,
          email: localAccountFormData.email,
          phone: localAccountFormData.phone,
          password: localAccountFormData.password,
          receptionistId: receptionistId
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        setDialogTitle("Account Created Successfully");
        setDialogMessage(
          `Patient account created for ${result.patientName}!\n\n` +
          `Account ID: ${result.accountId}\n` +
          `Email: ${localAccountFormData.email}\n` +
          `Phone: ${localAccountFormData.phone}\n\n` +
          `The patient can now login to the mobile app.`
        );
        setDialogOpen(true);

        // Reset and close
        resetLocalAccountForm();
        setShowCreateAccount(false);
        
        // Refresh any relevant data
        if (showSendReminder) {
          fetchUpcomingAppointments();
        }
      } else {
        setLocalAccountError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Create account error:', error);
      setLocalAccountError('Failed to create account. Please try again.');
    } finally {
      setLocalCreatingAccount(false);
    }
  };

  return (
    <Dialog open={showCreateAccount} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Patient Mobile Account</DialogTitle>
          <DialogDescription>
            Link patient data to mobile app account using IC number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Search by IC Number */}
          {localAccountCreationStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic-number">Patient IC Number *</Label>
                <Input
                  id="ic-number"
                  placeholder="e.g., 900101-01-1234"
                  value={localAccountFormData.icNumber}
                  onChange={(e) => setLocalAccountFormData({...localAccountFormData, icNumber: e.target.value})}
                  disabled={localVerifyingIC}
                />
                <p className="text-xs text-gray-500">
                  Enter the patient's IC number to verify their identity
                </p>
              </div>

              {localAccountError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{localAccountError}</p>
                </div>
              )}

              <Button 
                onClick={(e) => handleVerifyICNumber(e)}
                disabled={localVerifyingIC || !localAccountFormData.icNumber.trim()}
                className="w-full"
              >
                {localVerifyingIC ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="size-4 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Verify Patient Details */}
          {localAccountCreationStep === 2 && localPatientForAccount && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Patient Found ✓</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{localPatientForAccount.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IC Number:</span>
                    <span className="font-medium">{localPatientForAccount.icNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span>{localPatientForAccount.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span>{new Date(localPatientForAccount.dob).toLocaleDateString()}</span>
                  </div>
                  {localPatientForAccount.bloodType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blood Type:</span>
                      <span>{localPatientForAccount.bloodType}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email Address *</Label>
                  <Input
                    id="account-email"
                    type="email"
                    placeholder="patient@example.com"
                    value={localAccountFormData.email}
                    onChange={(e) => setLocalAccountFormData({...localAccountFormData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-phone">Phone Number *</Label>
                  <Input
                    id="account-phone"
                    type="tel"
                    placeholder="+6012-345-6789"
                    value={localAccountFormData.phone}
                    onChange={(e) => setLocalAccountFormData({...localAccountFormData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-password">Password *</Label>
                    <Input
                      id="account-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={localAccountFormData.password}
                      onChange={(e) => setLocalAccountFormData({...localAccountFormData, password: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm password"
                      value={localAccountFormData.confirmPassword}
                      onChange={(e) => setLocalAccountFormData({...localAccountFormData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>✓ Password must be at least 6 characters</p>
                  <p>✓ Patient will receive a welcome notification</p>
                  <p>✓ Account is linked to medical records</p>
                </div>

                {localAccountError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{localAccountError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleCreatePatientAccount}
                    disabled={localCreatingAccount}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {localCreatingAccount ? (
                      <>
                        <RefreshCw className="size-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLocalAccountCreationStep(1);
                      setLocalPatientForAccount(null);
                      setLocalAccountError(null);
                    }}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common reception tasks</CardDescription>
        </CardHeader>
        <CardContent>
<div className="grid grid-cols-2 gap-3">
  <Button 
    variant="outline" 
    className="h-20 flex flex-col gap-2" 
    onClick={() => setShowWalkIn(true)}
  >
    <UserPlus className="size-5" />
    <span className="text-sm">Walk-in Patient</span>
  </Button>
  <Button 
    variant="outline" 
    className="h-20 flex flex-col gap-2" 
    onClick={() => alert('Calling patient...')}
  >
    <Phone className="size-5" />
    <span className="text-sm">Call Patient</span>
  </Button>
  <Button 
    variant="outline" 
    className="h-20 flex flex-col gap-2" 
    onClick={() => setShowCreateAccount(true)}
  >
    <UserPlus className="size-5" />
    <span className="text-sm">Mobile Account</span>
  </Button>
  <Button 
    variant="outline" 
    className="h-20 flex flex-col gap-2" 
    onClick={() => setShowSendReminder(true)}
  >
    <Mail className="size-5" />
    <span className="text-sm">Send Reminder</span>
  </Button>
  <Button 
    variant="outline" 
    className="h-20 flex flex-col gap-2" 
    onClick={() => setShowCancelAppointment(true)}
  >
    <CalendarX className="size-5" />
    <span className="text-sm">Cancel/Reschedule</span>
  </Button>
</div>
        </CardContent>
      </Card>

      {/* Walk-in Patient Dialog - FIXED LAYOUT */}
      <Dialog 
  open={showWalkIn} 
  onOpenChange={(open) => {
    console.log('Dialog open state:', open);
    if (!open) {
      resetWalkInForm();
    }
    setShowWalkIn(open);
  }}
>
  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
      <DialogTitle>Register Walk-in Patient</DialogTitle>
      <DialogDescription>Search for existing patient or register new walk-in</DialogDescription>
    </DialogHeader>
    
    {/* Main scrollable content */}
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="space-y-4">
        {/* Fixed search section */}
        <div className="space-y-2">
          <Label htmlFor="patient-search">Search Patient</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                id="patient-search"
                placeholder="Search by name, IC number, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  console.log('Search query:', e.target.value);
                  setSearchQuery(e.target.value);
                }}
                className="pl-10"
                disabled={!!selectedPatient}
              />
            </div>
            <Button 
              onClick={handleSearchPatient}
              disabled={isSearching || !!selectedPatient}
              variant="outline"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Search for existing patient to add to queue
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-[400px] overflow-y-auto">
          <PatientSearchResults />
        </div>

            {/* No Results Message */}
            {searchQuery && searchResults.length === 0 && !isSearching && !selectedPatient && (
              <div className="text-center py-8 text-gray-500">
                <p>No patients found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">
                  Try searching with different terms or{' '}
                  <button 
                    className="text-orange-600 hover:text-orange-700 underline"
                    onClick={() => {
                      alert('Redirect to patient registration');
                    }}
                  >
                    register a new patient
                  </button>
                </p>
              </div>
            )}

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Selected Patient
                      </Badge>
                      <Users className="size-4 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">{selectedPatient.Name}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                      <div>
                        <span className="font-medium">IC Number:</span> {selectedPatient.ICNo}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {selectedPatient.PhoneNumber}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {selectedPatient.Gender}
                      </div>
                      <div>
                        <span className="font-medium">DOB:</span> {new Date(selectedPatient.DOB).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedPatient.BloodType && (
                      <div className="mt-2">
                        <span className="font-medium">Blood Type:</span> {selectedPatient.BloodType}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('Clearing selected patient');
                      setSelectedPatient(null);
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-2"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Visit Details Form */}
            {selectedPatient && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="walkin-reason">Reason for Visit *</Label>
                  <Textarea
                    id="walkin-reason"
                    placeholder="Brief description of symptoms or reason for visit..."
                    rows={2}
                    value={walkinFormData.reason}
                    onChange={(e) => setWalkinFormData({...walkinFormData, reason: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Triage Priority *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={walkinFormData.priority === 'critical' ? 'destructive' : 'outline'}
                      onClick={() => setWalkinFormData({...walkinFormData, priority: 'critical'})}
                      className="justify-start"
                    >
                      <Siren className="size-4 mr-2" />
                      Critical
                    </Button>
                    <Button
                      type="button"
                      variant={walkinFormData.priority === 'high' ? 'default' : 'outline'}
                      className={`justify-start ${walkinFormData.priority === 'high' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      onClick={() => setWalkinFormData({...walkinFormData, priority: 'high'})}
                    >
                      <AlertTriangle className="size-4 mr-2" />
                      High
                    </Button>
                    <Button
                      type="button"
                      variant={walkinFormData.priority === 'medium' ? 'default' : 'outline'}
                      className={`justify-start ${walkinFormData.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                      onClick={() => setWalkinFormData({...walkinFormData, priority: 'medium'})}
                    >
                      <Activity className="size-4 mr-2" />
                      Medium
                    </Button>
                    <Button
                      type="button"
                      variant={walkinFormData.priority === 'low' ? 'default' : 'outline'}
                      className={`justify-start ${walkinFormData.priority === 'low' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => setWalkinFormData({...walkinFormData, priority: 'low'})}
                    >
                      <Clock className="size-4 mr-2" />
                      Low (Default)
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-gray-500">
                      Selected: {getPriorityBadge(walkinFormData.priority)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-assignment">Assign Doctor (Optional)</Label>
                  <Select
                    value={walkinFormData.doctorId === '' ? "none" : walkinFormData.doctorId}
                    onValueChange={(value) => setWalkinFormData({
                      ...walkinFormData, 
                      doctorId: value === "none" ? "" : value
                    })}
                  >
                    <SelectTrigger id="doctor-assignment">
                      <SelectValue placeholder="Select a doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific doctor</SelectItem> {/* Changed here */}
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          Dr. {doctor.Name} - {doctor.Specialization || 'General Medicine'} ({doctor.ClinicRoom || 'No room'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    If no doctor is selected, any available doctor can see this patient
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={handleRegisterWalkIn}
                    disabled={!walkinFormData.reason.trim()}
                  >
                    Register & Add to Queue
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetWalkInForm();
                      setShowWalkIn(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              
            )}
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showSendReminder} onOpenChange={setShowSendReminder}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>Send Appointment Reminder</DialogTitle>
            <DialogDescription>
              Send reminders for upcoming appointments (next 48 hours)
            </DialogDescription>
          </DialogHeader>
          
          {/* Main scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search-appointment">Search Appointments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                <Input
                  id="search-appointment"
                  placeholder="Search by patient name, phone, or queue number..."
                  className="pl-10"
                  value={searchAppointmentTerm}
                  onChange={(e) => setSearchAppointmentTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Appointments List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Upcoming Appointments ({filteredAppointments.length})</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedAppointment 
                        ? `Selected: ${selectedAppointment.PatientName}` 
                        : 'Showing only patients with accounts'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedAppointment && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedAppointment(null);
                          setReminderMethod('sms');
                          setReminderMessage('');
                          fetchUpcomingAppointments(true);
                        }}
                        className="h-8 text-xs"
                      >
                        <X className="size-3 mr-1" />
                        Clear Selection
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchUpcomingAppointments(true)}
                      className="h-8 text-xs"
                    >
                      <RefreshCw className="size-3 mr-1" />
                      Refresh
                    </Button>
                    {!selectedAppointment && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUpcomingAppointments(false)}
                        className="h-8 text-xs"
                      >
                        <Users className="size-3 mr-1" />
                        Show All
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="size-12 mx-auto mb-2 text-gray-300" />
                    {selectedAppointment ? (
                      <p>No appointment selected</p>
                    ) : (
                      <>
                        <p>No upcoming appointments found</p>
                        <p className="text-sm mt-1">Appointments are shown for next 48 hours (patients with accounts only)</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAppointments.map((appointment) => {
                      const formatted = formatAppointmentDateTime(appointment.AppointmentDateTime);
                      const isSelected = selectedAppointment?.AppointmentID === appointment.AppointmentID;
                      
                      return (
                        <div
                          key={appointment.AppointmentID}
                          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          } ${
                            !appointment.PatientAccountID ? 'opacity-60 bg-gray-50' : ''
                          }`}
                          onClick={() => {
                            if (appointment.PatientAccountID) {
                              setSelectedAppointment(appointment);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{appointment.PatientName}</span>
                                {appointment.QueueNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    {appointment.QueueNumber}
                                  </Badge>
                                )}
                                {!appointment.PatientAccountID && (
                                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                    No Account
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="size-3" />
                                  <span>{formatted.date} at {formatted.time}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Stethoscope className="size-3" />
                                  <span>Dr. {appointment.DoctorName}</span>
                                </div>
                              </div>
                              {appointment.Purpose && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Purpose: {appointment.Purpose}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">
                                {appointment.PatientPhone || 'No phone'}
                              </div>
                              {!appointment.PatientAccountID && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                  No Patient Account
                                </Badge>
                              )}
                              {appointment.PatientAccountID && !isSelected && (
                                <div className="text-xs text-blue-600">Click to select</div>
                              )}
                            </div>
                          </div>
                          
                          {!appointment.PatientAccountID && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-700">
                              <p className="flex items-center gap-1">
                                <AlertTriangle className="size-3" />
                                This patient doesn't have an account. Ask them to create one at reception.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reminder Details (only shown when appointment is selected) */}
            {selectedAppointment && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium">Reminder Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="reminder-patient">Patient</Label>
                    <Input
                      id="reminder-patient"
                      value={selectedAppointment.PatientName}
                      disabled
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="reminder-datetime">Appointment Time</Label>
                    <Input
                      id="reminder-datetime"
                      value={formatAppointmentDateTime(selectedAppointment.AppointmentDateTime).full}
                      disabled
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-method">Send Via *</Label>
                  <Select value={reminderMethod} onValueChange={setReminderMethod}>
                    <SelectTrigger id="reminder-method">
                      <SelectValue placeholder="Choose method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS (to {selectedAppointment.PatientPhone || 'No phone number'})</SelectItem>
                      <SelectItem value="email">Email (to {selectedAppointment.PatientEmail || 'No email'})</SelectItem>
                      <SelectItem value="both">Both SMS & Email</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!selectedAppointment.PatientPhone && reminderMethod.includes('sms')) || 
                  (!selectedAppointment.PatientEmail && reminderMethod.includes('email')) ? (
                    <p className="text-xs text-red-600">
                      Patient is missing contact information for selected method
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-message">Message *</Label>
                  <Textarea
                    id="reminder-message"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={4}
                    placeholder="Customize your reminder message..."
                  />
                  <p className="text-xs text-gray-500">
                    Character count: {reminderMessage.length} (SMS limit: 160 characters)
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-orange-600 hover:bg-orange-700" 
                    onClick={handleSendReminder}
                    disabled={sendingReminder || !selectedAppointment.PatientAccountID}
                  >
                    {sendingReminder ? (
                      <>
                        <RefreshCw className="size-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4 mr-2" />
                        Send Reminder
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedAppointment(null);
                      setReminderMethod('sms');
                      setReminderMessage('');
                    }}
                  >
                    Clear Selection
                  </Button>
                  <Button variant="outline" onClick={() => setShowSendReminder(false)}>
                    Cancel
                  </Button>
                </div>
                
                {!selectedAppointment.PatientAccountID && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This patient doesn't have a patient account. Reminders can only be sent to patients with accounts.
                      Ask the patient to create an account at the reception.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{dialogMessage}</p>

          <DialogFooter className="mt-4">
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Cancel/Reschedule Appointment Dialog */}
<Dialog open={showCancelAppointment} onOpenChange={setShowCancelAppointment}>
  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
      <DialogTitle>Cancel/Reschedule Appointment</DialogTitle>
      <DialogDescription>
        Cancel or reschedule upcoming appointments
      </DialogDescription>
    </DialogHeader>
    
    {/* Main scrollable content */}
    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="search-cancel-appointment">Search Appointments</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <Input
            id="search-cancel-appointment"
            placeholder="Search by patient name, phone, or appointment ID..."
            className="pl-10"
            value={searchCancellationTerm}
            onChange={(e) => setSearchCancellationTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Upcoming Appointments ({filteredCancellationAppointments.length})</h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedAppointmentForCancel 
                  ? `Selected: ${selectedAppointmentForCancel.PatientName}` 
                  : 'Select an appointment to cancel or reschedule'}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedAppointmentForCancel && (
// In the Clear Selection button onClick handler
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => {
    setSelectedAppointmentForCancel(null);
    setCancellationReason('');
    setRescheduleDateTime('');
    setShowReschedule(false);
    setSearchCancellationTerm(''); // Also clear the search term
  }}
  className="h-8 text-xs"
>
  <X className="size-3 mr-1" />
  Clear Selection
</Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAppointmentsForCancellation}
                className="h-8 text-xs"
              >
                <RefreshCw className="size-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCancellationAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CalendarX className="size-12 mx-auto mb-2 text-gray-300" />
              {selectedAppointmentForCancel ? (
                <p>No appointment selected</p>
              ) : (
                <>
                  <p>No upcoming appointments found</p>
                  <p className="text-sm mt-1">Appointments are shown for next 7 days</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredCancellationAppointments.map((appointment) => {
                const formatted = formatAppointmentDateTime(appointment.AppointmentDateTime);
                const isSelected = selectedAppointmentForCancel?.AppointmentID === appointment.AppointmentID;
                const appointmentDate = new Date(appointment.AppointmentDateTime);
                const now = new Date();
                const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                
                return (
                  <div
                    key={appointment.AppointmentID}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedAppointmentForCancel(appointment)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{appointment.PatientName}</span>
                          {appointment.QueueNumber && (
                            <Badge variant="outline" className="text-xs">
                              Queue: {appointment.QueueNumber}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${
                            hoursUntilAppointment < 2 
                              ? 'bg-red-50 text-red-700 border-red-300' 
                              : hoursUntilAppointment < 24
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                              : 'bg-green-50 text-green-700 border-green-300'
                          }`}>
                            {hoursUntilAppointment < 2 
                              ? 'Within 2 hours' 
                              : hoursUntilAppointment < 24
                              ? 'Within 24 hours'
                              : `${Math.floor(hoursUntilAppointment / 24)} days`}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-3" />
                            <span>{formatted.date} at {formatted.time}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Stethoscope className="size-3" />
                            <span>Dr. {appointment.DoctorName} ({appointment.DoctorSpecialization})</span>
                          </div>
                        </div>
                        {appointment.Purpose && (
                          <div className="text-xs text-gray-500 mt-1">
                            Purpose: {appointment.Purpose}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">
                          ID: {appointment.AppointmentID}
                        </div>
                        {!isSelected && (
                          <div className="text-xs text-blue-600">Select to cancel/reschedule</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel/Reschedule Options (only shown when appointment is selected) */}
      {selectedAppointmentForCancel && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium">Appointment Actions</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cancel-patient">Patient</Label>
              <Input
                id="cancel-patient"
                value={selectedAppointmentForCancel.PatientName}
                disabled
                className="bg-white"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cancel-datetime">Appointment Time</Label>
              <Input
                id="cancel-datetime"
                value={formatAppointmentDateTime(selectedAppointmentForCancel.AppointmentDateTime).full}
                disabled
                className="bg-white"
              />
            </div>
          </div>

          {/* Reschedule Option */}
          {!showReschedule ? (
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full mb-3"
                onClick={() => setShowReschedule(true)}
              >
                <CalendarCheck className="size-4 mr-2" />
                Reschedule Instead of Cancel
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide reason for cancellation (e.g., patient request, doctor unavailable, etc.)..."
                />
                <p className="text-xs text-gray-500">
                  This reason will be recorded and may be shared with the patient.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700" 
                  onClick={handleCancelAppointment}
                  disabled={cancellingAppointment || !cancellationReason.trim()}
                >
                  {cancellingAppointment ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <CalendarX className="size-4 mr-2" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedAppointmentForCancel(null);
                    setCancellationReason('');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="reschedule-datetime">New Appointment Date & Time *</Label>
                <Input
                  id="reschedule-datetime"
                  type="datetime-local"
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="bg-white"
                />
                {rescheduleDateTime && (
                  <p className="text-sm text-gray-600">
                    New time: {formatAppointmentDateTime(rescheduleDateTime).full}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={handleRescheduleAppointment}
                  disabled={reschedulingAppointment || !rescheduleDateTime}
                >
                  {reschedulingAppointment ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="size-4 mr-2" />
                      Confirm Reschedule
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReschedule(false);
                    setRescheduleDateTime('');
                  }}
                >
                  Cancel Reschedule
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedAppointmentForCancel(null);
                    setCancellationReason('');
                    setRescheduleDateTime('');
                    setShowReschedule(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>

      <CreateAccountDialog />
    </div>

    
  );
}