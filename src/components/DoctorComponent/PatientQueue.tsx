import { useState, useEffect } from 'react';
import { 
  Users, User, Clock, AlertTriangle, Activity, Siren, Bell, 
  Calendar, UserPlus, UserCheck, RefreshCw, Eye, EyeOff,
  Filter, Search, ChevronDown, ChevronUp, List, Grid, CheckCircle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PatientQueueProps {
  doctorId: number | null;
  refreshData?: () => void;
  onStartConsultation?: (patientId: number, patientData: any) => void; // ← ADD THIS
  onNavigateToConsultation?: (patientId: number) => void; // ← OR THIS
}

interface PatientVisit {
  VisitID: number;
  PatientID: number;
  PatientName: string;
  QueueNumber: string;
  QueuePosition: number;
  QueueStatus: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  VisitStatus: 'scheduled' | 'checked-in' | 'in-consultation' | 'waiting-for-results' | 'ready-for-checkout' | 'completed' | 'cancelled' | 'no-show';
  VisitType: 'first-time' | 'follow-up' | 'walk-in';
  VisitNotes: string;
  ArrivalTime: string;
  CalledTime: string | null;
  DoctorID: number | null;
  AssignedDoctorID: number | null;
  TriagePriority: 'critical' | 'high' | 'medium' | 'low' | string;
  assignmentStatus?: string;
  assignedDoctorName?: string;
  AppointmentDateTime?: string;
  AppointmentTime?: string;
  OriginalAppointmentTime?: string;
  isAppointment?: boolean;
  hasAppointment?: boolean;
  appointmentId?: number;
  isAssignedToCurrentDoctor?: boolean;
}

export function PatientQueue({ doctorId, refreshData }: PatientQueueProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientsSeenToday, setPatientsSeenToday] = useState<number>(0);
  const [patientsWaiting, setPatientsWaiting] = useState<number>(0);
  const [assignedPatients, setAssignedPatients] = useState<PatientVisit[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<PatientVisit[]>([]);
  const [appointments, setAppointments] = useState<PatientVisit[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showTriageLegend, setShowTriageLegend] = useState(true);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  const [currentlyCalledPatient, setCurrentlyCalledPatient] = useState<number | null>(null);
  const [calledPatientData, setCalledPatientData] = useState<any>(null);
  const navigate = useNavigate();
  const [currentConsultationId, setCurrentConsultationId] = useState<number | null>(null);

    const filteredUnassignedPatients = unassignedPatients.filter(patient => {
    const matchesSearch = patient.PatientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.QueueNumber.includes(searchQuery) ||
                         patient.VisitNotes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || patient.TriagePriority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const filteredAssignedPatients = assignedPatients.filter(patient => {
    const matchesSearch = patient.PatientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.QueueNumber.includes(searchQuery) ||
                         patient.VisitNotes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || patient.TriagePriority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.PatientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.VisitNotes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || appointment.TriagePriority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const cn = (...classes: (string | boolean | undefined)[]) => 
    classes.filter(Boolean).join(' ');

  const fetchAppointments = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/doctor/scheduled-appointments/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const appointmentsData = await response.json();
        
        const transformedAppointments = appointmentsData
          .filter((appointment: any) => appointment && appointment.patientId)
          .map((appointment: any) => ({
            VisitID: appointment.id,
            PatientID: appointment.patientId,
            PatientName: appointment.name,
            QueueNumber: `APP-${String(appointment.id).padStart(3, '0')}`,
            QueuePosition: 0,
            QueueStatus: 'waiting' as const,
            VisitStatus: 'scheduled' as const,
            VisitType: appointment.VisitType || 'follow-up',
            VisitNotes: appointment.type || appointment.Notes || 'Appointment',
            ArrivalTime: appointment.AppointmentDateTime,
            AppointmentDateTime: appointment.AppointmentDateTime,
            AppointmentTime: appointment.time || formatTime(appointment.AppointmentDateTime),
            OriginalAppointmentTime: appointment.AppointmentDateTime,
            CalledTime: null,
            DoctorID: null, // Appointments not assigned yet
            AssignedDoctorID: null,
            TriagePriority: appointment.TriagePriority || 'medium',
            assignedDoctorName: "Scheduled",
            isAppointment: true,
            hasAppointment: true,
            appointmentId: appointment.id,
            isAssignedToCurrentDoctor: false
          }));
        
        setAppointments(transformedAppointments);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Appointments fetch failed:', response.status, errorText);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };

  const formatTime = (dateTime: string) => {
    if (!dateTime) return '';
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateTime: string) => {
    if (!dateTime) return '';
    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const fetchQueueData = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      // Use the enhanced queue endpoint that properly checks doctor assignments
      const queueResponse = await fetch(`http://localhost:3001/api/doctor/queue-enhanced/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        
        if (queueData.success) {
          console.log('Queue data received:', {
            doctorId,
            assignedCount: queueData.assignedPatients?.length || 0,
            unassignedCount: queueData.unassignedPatients?.length || 0
          });

          // Transform patients to include proper assignment info
          const transformPatients = (patients: any[], isAssigned: boolean) => {
            return patients.map((patient: any) => ({
              ...patient,
              isAssignedToCurrentDoctor: isAssigned,
              AssignedDoctorID: patient.DoctorID,
              hasAppointment: patient.AppointmentDateTime ? true : false,
              OriginalAppointmentTime: patient.AppointmentDateTime,
              AppointmentTime: patient.AppointmentDateTime ? formatTime(patient.AppointmentDateTime) : undefined,
              AppointmentDateTime: patient.AppointmentDateTime
            }));
          };

          const assignedTransformed = transformPatients(queueData.assignedPatients || [], true);
          const unassignedTransformed = transformPatients(queueData.unassignedPatients || [], false);
          
          setAssignedPatients(assignedTransformed);
          setUnassignedPatients(unassignedTransformed);
          
          const totalWaiting = assignedTransformed.length + unassignedTransformed.length;
          setPatientsWaiting(totalWaiting);
          setError(null);
        } else {
          setError(queueData.error || 'Failed to fetch queue data');
        }
      } else {
        const errorText = await queueResponse.text();
        console.error('Queue fetch failed:', queueResponse.status, errorText);
        setError('Failed to fetch queue data');
        // Fallback to original endpoint
        await fetchQueueDataFallback();
      }
    } catch (error) {
      console.error("Error fetching queue data:", error);
      setError('Network error fetching queue data');
      await fetchQueueDataFallback();
    }
  };

  const fetchQueueDataFallback = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/queue/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const queueData = await response.json();
        
        if (queueData.success) {
          // Filter manually in frontend
          const assigned = (queueData.assignedPatients || []).filter((patient: any) => 
            patient.DoctorID == doctorId
          );
          
          const unassigned = (queueData.unassignedPatients || []).filter((patient: any) => 
            !patient.DoctorID || patient.DoctorID != doctorId
          );
          
          setAssignedPatients(assigned);
          setUnassignedPatients(unassigned);
          
          const totalWaiting = assigned.length + unassigned.length;
          setPatientsWaiting(totalWaiting);
        }
      }
    } catch (error) {
      console.error("Fallback queue fetch error:", error);
    }
  };

  const fetchQueueStats = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/doctor/queue-stats/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const statsData = await response.json();
        setPatientsSeenToday(statsData.patientsSeenToday || 0);
      }
    } catch (error) {
      console.error("Error fetching queue stats:", error);
    }
  };

  const fetchAllData = async () => {
    if (!doctorId) return;
    
    try {
      setError(null);
      setRefreshing(true);
      
      await Promise.all([
        fetchQueueData(),
        fetchAppointments(),
        fetchQueueStats()
      ]);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

// Add this useEffect after your other useEffect hooks
useEffect(() => {
  const checkActiveConsultation = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/active-consultation/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.patient) {
          setCurrentlyCalledPatient(data.patient.VisitID);
          setCalledPatientData(data.patient);
          toast.info(`Resuming consultation with ${data.patient.PatientName}`);
        }
      }
    } catch (error) {
      console.error('Error checking active consultation:', error);
    }
  };
  
  if (doctorId) {
    checkActiveConsultation();
  }
}, [doctorId]);

  const getCurrentPatients = () => {
    switch (activeTab) {
      case 'mine':
        return filteredAssignedPatients;
      case 'appointments':
        return filteredAppointments;
      case 'available':
        return filteredUnassignedPatients;
      case 'all':
      default:
        return [...filteredUnassignedPatients, ...filteredAssignedPatients, ...filteredAppointments];
    }
  };

  const currentPatients = getCurrentPatients();

const handleRefresh = async () => {
  await fetchAllData();
  if (showDetails) {
    setExpandedCards(currentPatients.map(p => p.VisitID));
  } else {
    setExpandedCards([]);
  }
  toast.success('Queue data refreshed');
};

const handleClaimPatient = async (visitId: number) => {
  if (!doctorId) return;
  
  setLoading(true);
  setError(null);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3001/api/doctor/claim-patient", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ visitId, doctorId })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Find and move patient from unassigned to assigned
      const patientToClaim = unassignedPatients.find(p => p.VisitID === visitId);
      if (patientToClaim) {
        const updatedPatient = { 
          ...patientToClaim, 
          DoctorID: doctorId, 
          AssignedDoctorID: doctorId,
          assignedDoctorName: "You",
          isAssignedToCurrentDoctor: true
        };
        setUnassignedPatients(prev => prev.filter(p => p.VisitID !== visitId));
        setAssignedPatients(prev => [...prev, updatedPatient]);
      }
      await fetchAllData(); // Refresh all data
      toast.success('Patient claimed successfully!');
    } else {
      const errorMsg = result.error || 'Failed to claim patient';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  } catch (error) {
    console.error("Claim patient error:", error);
    const errorMsg = "Failed to claim patient. Please try again.";
    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
};

const handleCallPatient = async (visitId: number) => {
  if (!doctorId) {
    console.error('No doctor ID found');
    return;
  }
  
  // Prevent calling if another patient is already in consultation
  if (currentlyCalledPatient && currentlyCalledPatient !== visitId) {
    toast.error(`Please complete consultation with patient ${calledPatientData?.PatientName || 'currently in consultation'} first`);
    return;
  }
  
  console.log('=== CALLING PATIENT ===');
  console.log('Visit ID:', visitId);
  console.log('Doctor ID:', doctorId);
  
  setLoading(true);
  setError(null);
  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Present' : 'Missing');
    
    const response = await fetch("http://localhost:3001/api/doctor/visit-patient", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ visitId, doctorId })
    });

    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response result:', result);

    if (response.ok && result.success) {
      // Set currently called patient
      setCurrentlyCalledPatient(visitId);
      setCalledPatientData(result.patient);
      
      setSelectedPatientId(visitId);
      
      // ============================================
      // NEW: Store consultationId in state or localStorage
      // ============================================
      if (result.consultationId) {
        console.log('Got consultation ID from backend:', result.consultationId);
        
        // Store it in state
        setCurrentConsultationId(result.consultationId);
        
        // Also store it in localStorage for persistence
        localStorage.setItem(`consultation_${visitId}`, result.consultationId.toString());
        
        // Store in a global consultation storage as well
        localStorage.setItem('currentConsultationId', result.consultationId.toString());
        
        console.log('Stored consultation ID in localStorage');
        
        // If you have a global state for current consultation
        // setCurrentConsultation({ id: result.consultationId, visitId });
      }
      
      // Update patient status locally
      const updatePatientStatus = (patients: PatientVisit[]) =>
        patients.map(patient => 
          patient.VisitID === visitId && patient.isAssignedToCurrentDoctor
            ? { 
                ...patient, 
                QueueStatus: 'in-progress' as const,
                VisitStatus: 'in-consultation' as const,
                CalledTime: new Date().toISOString()
              }
            : patient
        );
      
      setAssignedPatients(updatePatientStatus);
      await fetchAllData(); // Refresh data
      
      toast.success(`Started consultation with ${result.patient?.PatientName || 'patient'}`);
    } else {
      console.error('Error from backend:', result.error);
      setError(result.error || 'Failed to call patient');
      toast.error(result.error || 'Failed to call patient');
    }
  } catch (error) {
    console.error("Call patient error:", error);
    setError("Failed to call patient. Please try again.");
    toast.error("Failed to call patient. Please try again.");
  } finally {
    setLoading(false);
  }
};

// const handleCompleteVisit = async (visitId: number) => {
//   if (!doctorId) return;
  
//   setLoading(true);
//   setError(null);
//   try {
//     const token = localStorage.getItem('token');
//     const response = await fetch("http://localhost:3001/api/doctor/complete-visit", {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json",
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify({ visitId, doctorId })
//     });

//     const result = await response.json();

//     if (response.ok && result.success) {
//       // Clear currently called patient
//       setCurrentlyCalledPatient(null);
//       setCalledPatientData(null);
//       setSelectedPatientId(null);
      
//       // Remove from assigned patients
//       setAssignedPatients(prev => prev.filter(p => p.VisitID !== visitId));
//       setPatientsSeenToday(prev => prev + 1);
//       setPatientsWaiting(prev => Math.max(0, prev - 1));
      
//       await fetchAllData(); // Refresh data
      
//       toast.success('Consultation completed successfully');
//     } else {
//       setError(result.error || 'Failed to complete visit');
//     }
//   } catch (error) {
//     console.error("Complete visit error:", error);
//     setError("Failed to complete visit. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// };

  const toggleCardExpansion = (visitId: number) => {
    setExpandedCards(prev =>
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  const toggleAllCards = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    
    if (newShowDetails) {
      setExpandedCards(currentPatients.map(p => p.VisitID));
    } else {
      setExpandedCards([]);
    }
  };

  const calculateDisplayTime = (patient: PatientVisit) => {
    if (patient.isAppointment) {
      return patient.AppointmentTime || formatTime(patient.ArrivalTime) || 'Scheduled';
    } else {
      if (!patient.ArrivalTime) return 'Just arrived';
      
      try {
        const arrival = new Date(patient.ArrivalTime);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just arrived';
        if (diffMinutes < 60) return `${diffMinutes}m`;
        
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
      } catch {
        return 'Just arrived';
      }
    }
  };

  const getTriageBadge = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || '';
    const config = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <Siren className="size-3 mr-1" /> },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: <AlertTriangle className="size-3 mr-1" /> },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <Activity className="size-3 mr-1" /> },
      low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: null }
    };
    
    const conf = config[priorityLower as keyof typeof config] || {};
    return conf.bg ? (
      <Badge className={`${conf.bg} ${conf.text} ${conf.border} text-xs flex items-center`}>
        {conf.icon}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    ) : null;
  };

  const renderPatientCard = (patient: PatientVisit, isAssignedToCurrentDoctor: boolean, isAppointment: boolean = false) => {
    const isInProgress = patient.QueueStatus === 'in-progress' || patient.VisitStatus === 'in-consultation';
    const isSelected = selectedPatientId === patient.VisitID;
    const isExpanded = showDetails || expandedCards.includes(patient.VisitID);
    const canCall = patient.QueueStatus === 'waiting' && patient.VisitStatus === 'checked-in';
    const canClaim = !isAssignedToCurrentDoctor && patient.DoctorID === null && canCall && !isAppointment;
    const isCheckedIn = !isAppointment && patient.VisitStatus === 'checked-in';
    const hasAppointment = patient.hasAppointment || patient.AppointmentDateTime;
    const isAssignedToOtherDoctor = patient.DoctorID && patient.DoctorID !== doctorId;
    const isAssignedToMe = patient.DoctorID === doctorId && patient.isAssignedToCurrentDoctor;

    const getStatusText = () => {
      if (isAppointment) return 'Scheduled';
      if (patient.VisitStatus === 'checked-in') return 'Checked In';
      if (patient.VisitStatus === 'in-consultation') return 'In Consultation';
      return patient.VisitStatus || 'Waiting';
    };

    const getStatusBadge = () => {
      const text = getStatusText();
      let className = "text-xs";
      
      if (isAppointment) {
        className += ' border-indigo-300 text-indigo-700 bg-indigo-50';
      } else if (isAssignedToOtherDoctor) {
        className += ' border-gray-300 text-gray-700 bg-gray-100';
      } else if (isCheckedIn) {
        className += ' bg-green-100 text-green-800 border-green-200';
      } else if (isInProgress) {
        className += ' bg-yellow-100 text-yellow-800 border-yellow-200';
      } else if (patient.VisitStatus === 'in-consultation') {
        className += ' bg-purple-100 text-purple-800 border-purple-200';
      }
      
      return <Badge variant={isAppointment ? "outline" : "default"} className={className}>{text}</Badge>;
    };

const getButtonConfig = () => {
  // If patient is assigned to another doctor, disable all actions
  if (isAssignedToOtherDoctor) {
    return {
      text: `With Dr. ${patient.assignedDoctorName || 'Another Doctor'}`,
      variant: 'outline' as const,
      className: 'border-gray-300 text-gray-500 bg-gray-50',
      disabled: true,
      onClick: null,
      icon: <User className="size-3 mr-1" />
    };
  }
  
  // Check if doctor is busy with another patient
  if (currentlyCalledPatient && currentlyCalledPatient !== patient.VisitID) {
    return {
      text: 'Doctor Busy',
      variant: 'outline' as const,
      className: 'border-gray-300 text-gray-500 bg-gray-50',
      disabled: true,
      onClick: null,
      icon: <Clock className="size-3 mr-1" />
    };
  }
      
  if (isAppointment) {
    return {
      text: 'Scheduled',
      variant: 'outline' as const,
      className: 'border-indigo-300 text-indigo-700 bg-indigo-50',
      disabled: true,
      onClick: null,
      icon: <Calendar className="size-3 mr-1" />
    };
  }
  
      
if (isInProgress && isAssignedToMe) {
  return {
    text: 'In Consultation',
    variant: 'outline' as const,
    className: 'border-purple-300 text-purple-700 bg-purple-50',
    disabled: true,
    onClick: null,
    icon: <User className="size-3 mr-1" />
  };
}
      
      if (canClaim && !isAssignedToOtherDoctor) {
        return {
          text: 'Claim Patient',
          variant: 'outline' as const,
          className: 'border-orange-300 text-orange-700 hover:bg-orange-50',
          disabled: loading,
          onClick: handleClaimPatient,
          icon: <UserPlus className="size-3 mr-1" />
        };
      }
      
      if (canCall && isAssignedToMe) {
        return {
          text: selectedPatientId === patient.VisitID ? 'Consulting...' : 'Call Patient',
          variant: 'default' as const,
          className: 'bg-blue-600 hover:bg-blue-700',
          disabled: loading || (selectedPatientId !== null && selectedPatientId !== patient.VisitID),
          onClick: handleCallPatient,
          icon: <Bell className="size-3 mr-1" />
        };
      }
      
      return {
        text: getStatusText(),
        variant: 'outline' as const,
        className: 'opacity-50',
        disabled: true,
        onClick: null,
        icon: null
      };
    };

    const buttonConfig = getButtonConfig();

    if (viewMode === 'compact' && !isExpanded) {
      return (
        <div
          key={patient.VisitID}
          className={cn(
            "border rounded-lg p-3 hover:shadow-sm transition-all",
            isSelected ? 'border-blue-300 bg-blue-50/50' :
            isInProgress ? 'border-yellow-300 bg-yellow-50/50' :
            isAssignedToOtherDoctor ? 'border-gray-200 bg-gray-50/30' :
            patient.TriagePriority === 'critical' ? 'border-red-200 bg-red-50/20' :
            patient.TriagePriority === 'high' ? 'border-orange-200 bg-orange-50/20' :
            isAppointment ? 'border-indigo-200 bg-indigo-50/20' :
            hasAppointment ? 'border-blue-200 bg-blue-50/10' :
            'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isAppointment ? "outline" : isInProgress ? "default" : "outline"}
                className={cn(
                  isInProgress && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  isAssignedToOtherDoctor ? 'bg-gray-100 text-gray-700 border-gray-300' : undefined,
                  isAppointment && 'border-indigo-300 text-indigo-700 bg-indigo-50',
                  hasAppointment && !isAppointment && 'border-blue-300 text-blue-700 bg-blue-50',
                  "text-xs min-w-[40px] text-center"
                )}
              >
                {isAppointment ? (
                  <>
                    <Calendar className="size-3 mr-1 inline" />
                    Appt
                  </>
                ) : (
                  `#${patient.QueueNumber?.split('-').pop() || 'N/A'}`
                )}
              </Badge>
              
              <div>
                <p className="text-sm font-medium text-gray-900">{patient.PatientName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {!isAppointment && getTriageBadge(patient.TriagePriority)}
                  <span className="text-xs text-gray-500">
                    {patient.VisitType === 'walk-in' ? 'Walk-in' : 
                     patient.VisitType === 'follow-up' ? 'Follow-up' : 'First-time'}
                  </span>
                  {hasAppointment && !isAppointment && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTime(patient.OriginalAppointmentTime || patient.AppointmentDateTime || '')}
                    </span>
                  )}
                  {isAssignedToOtherDoctor && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="size-3" />
                      {patient.assignedDoctorName || 'Another Doctor'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {!isAssignedToOtherDoctor && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="size-3" />
                  {calculateDisplayTime(patient)}
                </div>
              )}
              {showDetails ? null : (
                <ChevronDown 
                  className="size-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardExpansion(patient.VisitID);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={patient.VisitID}
        className={cn(
          "border rounded-lg transition-all hover:shadow-sm",
          isSelected ? 'border-blue-300 bg-blue-50/50' :
          isInProgress ? 'border-yellow-300 bg-yellow-50/50' :
          isAssignedToOtherDoctor ? 'border-gray-200 bg-gray-50/30' :
          patient.TriagePriority === 'critical' ? 'border-red-200 bg-red-50/20' :
          patient.TriagePriority === 'high' ? 'border-orange-200 bg-orange-50/20' :
          isAppointment ? 'border-indigo-200 bg-indigo-50/20' :
          hasAppointment ? 'border-blue-200 bg-blue-50/10' :
          'border-gray-200 hover:border-gray-300'
        )}
      >
        <div 
          className={cn("p-3 transition-colors", !showDetails && "cursor-pointer hover:bg-gray-50/50")}
          onClick={!showDetails ? () => toggleCardExpansion(patient.VisitID) : undefined}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <Badge 
                variant={isAppointment ? "outline" : isInProgress ? "default" : "outline"}
                className={cn(
                  isInProgress && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  isAssignedToOtherDoctor ? 'bg-gray-100 text-gray-700 border-gray-300' : undefined,
                  isAppointment && 'border-indigo-300 text-indigo-700 bg-indigo-50',
                  hasAppointment && !isAppointment && 'border-blue-300 text-blue-700 bg-blue-50',
                  "text-xs h-8 px-3 flex items-center"
                )}
              >
                {isAppointment ? (
                  <>
                    <Calendar className="size-3 mr-1" />
                    Appointment
                  </>
                ) : (
                  `#${patient.QueueNumber?.split('-').pop() || 'N/A'}`
                )}
              </Badge>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{patient.PatientName}</p>
                  {!isAppointment && getTriageBadge(patient.TriagePriority)}
                  {isAssignedToOtherDoctor && (
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                      <User className="size-3 mr-1" />
                      {patient.assignedDoctorName || 'Another Doctor'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {patient.VisitType === 'walk-in' ? 'Walk-in' : 
                     patient.VisitType === 'follow-up' ? 'Follow-up' : 'First-time'}
                  </span>
                  {hasAppointment && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Clock className="size-3" />
                      {isAppointment ? calculateDisplayTime(patient) : formatTime(patient.OriginalAppointmentTime || patient.AppointmentDateTime || '')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3">
              {getStatusBadge()}
              
              {!isAssignedToOtherDoctor && (!hasAppointment || isAppointment) && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="size-3" />
                  {calculateDisplayTime(patient)}
                </div>
              )}
              
              {!showDetails && (
                isExpanded ? 
                  <ChevronUp className="size-4 text-gray-400" /> : 
                  <ChevronDown className="size-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {(showDetails || expandedCards.includes(patient.VisitID)) && (
          <div className="px-4 pb-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {patient.VisitNotes && patient.VisitNotes.trim() !== '' && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Reason for Visit:</p>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{patient.VisitNotes}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {patient.CalledTime && (
                    <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                      <Bell className="size-3" />
                      Called: {new Date(patient.CalledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  
                  {patient.assignedDoctorName && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      <User className="size-3" />
                      {isAssignedToCurrentDoctor ? 'Your Patient' : `Dr. ${patient.assignedDoctorName}`}
                    </span>
                  )}
                  
                  {!isAppointment && patient.QueuePosition && patient.QueuePosition > 0 && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                      Position: <span className="font-medium">{patient.QueuePosition}</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col justify-between gap-3">
                {hasAppointment && (
                  <div className="text-xs text-gray-500">
                    <div className="font-medium mb-1">Appointment Details:</div>
                    <div className="space-y-1 bg-indigo-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3" />
                        <span>Scheduled for: {formatTime(patient.OriginalAppointmentTime || patient.AppointmentDateTime || '')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-3" />
                        <span>{formatDate(patient.OriginalAppointmentTime || patient.AppointmentDateTime || '')}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {patient.ArrivalTime && !isAppointment && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Arrived:</span> {formatTime(patient.ArrivalTime)}
                    {hasAppointment && (
                      <div className="mt-1 text-blue-600 flex items-center gap-1">
                        <CheckCircle className="size-3" />
                        Checked in for appointment
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={buttonConfig.variant}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (buttonConfig.onClick) {
                        buttonConfig.onClick(patient.VisitID);
                      }
                    }}
                    disabled={buttonConfig.disabled}
                    className={cn("text-xs px-4 flex items-center", buttonConfig.className)}
                  >
                    {buttonConfig.icon}
                    {buttonConfig.text}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
          <p className="text-gray-600">Manage your patient flow efficiently</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="rounded-none border-0 h-9 px-3"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-0 h-9 px-3"
            >
              <Grid className="size-4" />
            </Button>
          </div>
          
          <Button
            variant={showDetails ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAllCards}
            className="flex items-center gap-2"
          >
            {showDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
  <Alert variant="destructive">
    <XCircle className="size-4" />
    <AlertDescription>{error}</AlertDescription>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setError(null)}
      className="ml-auto"
    >
      Dismiss
    </Button>
  </Alert>
)}

{/* ADD THIS SECTION - Currently Called Patient Banner */}
{currentlyCalledPatient && calledPatientData && (
  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
          <User className="size-5" />
        </div>
        <div>
          <h3 className="font-medium text-blue-900">Currently in Consultation</h3>
          <p className="text-sm text-blue-700">
            Patient: {calledPatientData.PatientName} • Queue: {calledPatientData.QueueNumber}
          </p>
          <p className="text-xs text-blue-600">
            Started: {calledPatientData.CalledTime ? new Date(calledPatientData.CalledTime).toLocaleTimeString() : 'Now'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
{/* <Button
  variant="outline"
  size="sm"
  className="border-blue-300 text-blue-700 hover:bg-blue-100"
  onClick={() => {
    // Navigate to doctor consultation page
    navigate('/doctor/consultation', {
      state: {
        patientId: currentlyCalledPatient,
        patientData: calledPatientData,
        doctorId: doctorId
      }
    });
  }}
>
  Go to Consultation
</Button> */}
  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
    <User className="size-3 mr-1" />
    In Consultation
  </Badge>
</div>
    </div>
  </div>
)}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder="Search patients by name, queue number, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gray-500" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="size-4" />
                All
                <Badge variant="secondary" className="ml-1">
                  {filteredUnassignedPatients.length + filteredAssignedPatients.length + filteredAppointments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="mine" className="flex items-center gap-2">
                <UserCheck className="size-4" />
                My Patients
                <Badge variant="secondary" className="ml-1">{filteredAssignedPatients.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <UserPlus className="size-4" />
                Available
                <Badge variant="secondary" className="ml-1">{filteredUnassignedPatients.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="size-4" />
                Appointments
                <Badge variant="secondary" className="ml-1">{filteredAppointments.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {currentPatients.length > 0 ? (
                <div className="space-y-2">
                  {currentPatients.map(patient => {
                    const isAssigned = assignedPatients.some(p => p.VisitID === patient.VisitID && p.isAssignedToCurrentDoctor);
                    const isAppointment = appointments.some(p => p.VisitID === patient.VisitID);
                    return renderPatientCard(patient, isAssigned, isAppointment);
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <Users className="size-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">No patients found</p>
                  <p className="text-sm mt-1">Try changing your search or filter criteria</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mine" className="space-y-2">
              {filteredAssignedPatients.length > 0 ? (
                <div className="space-y-2">
                  {filteredAssignedPatients.map(patient => renderPatientCard(patient, true))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <UserCheck className="size-12 mx-auto mb-3 text-gray-400" />
                  <p>No patients assigned to you</p>
                  <p className="text-sm mt-1">Claim patients from the Available section</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-2">
              {filteredUnassignedPatients.length > 0 ? (
                <div className="space-y-2">
                  {filteredUnassignedPatients.map(patient => renderPatientCard(patient, false))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <UserPlus className="size-12 mx-auto mb-3 text-gray-400" />
                  <p>No available patients to claim</p>
                  <p className="text-sm mt-1">New patients will appear here when they check in</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-2">
              {filteredAppointments.length > 0 ? (
                <div className="space-y-2">
                  {filteredAppointments.map(patient => renderPatientCard(patient, false, true))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{patientsSeenToday}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{patientsWaiting}</div>
                  <div className="text-xs text-gray-600">Waiting</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{filteredAssignedPatients.length}</div>
                  <div className="text-xs text-gray-600">My Patients</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{filteredUnassignedPatients.length}</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowTriageLegend(!showTriageLegend)}
              >
                <CardTitle className="text-lg">Triage Priority</CardTitle>
                {showTriageLegend ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CardHeader>
            {showTriageLegend && (
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-red-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Critical</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {currentPatients.filter(p => p.TriagePriority === 'critical').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-orange-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">High</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    {currentPatients.filter(p => p.TriagePriority === 'high').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Medium</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {currentPatients.filter(p => p.TriagePriority === 'medium').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Low</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {currentPatients.filter(p => p.TriagePriority === 'low').length}
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setActiveTab('mine')}
              >
                <UserCheck className="size-4 mr-2" />
                View My Patients
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => {
                  setActiveTab('available');
                  setFilterPriority('critical');
                }}
              >
                <AlertTriangle className="size-4 mr-2" />
                View Critical Patients
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => {
                  setActiveTab('appointments');
                  setFilterPriority('all');
                }}
              >
                <Calendar className="size-4 mr-2" />
                View Appointments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}