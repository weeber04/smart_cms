import { useState, useEffect } from 'react';
import { 
  Users, User, Clock, AlertTriangle, Activity, Siren, Bell, 
  Calendar, UserPlus, UserCheck, RefreshCw, Eye, EyeOff,
  Filter, Search, ChevronDown, ChevronUp, List, Grid
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface PatientQueueProps {
  doctorId: number | null;
  refreshData?: () => void;
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
  TriagePriority: 'critical' | 'high' | 'medium' | 'low' | string;
  assignmentStatus?: string;
  assignedDoctorName?: string;
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
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [showTriageLegend, setShowTriageLegend] = useState(true);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');

  const cn = (...classes: (string | boolean | undefined)[]) => 
    classes.filter(Boolean).join(' ');

  // Fetch appointments data - FIXED VERSION
  const fetchAppointments = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/doctor/appointments/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const appointmentsData = await response.json();
        console.log('Raw appointments data:', appointmentsData);
        
        // Filter out walk-in patients and only show actual appointments
        const transformedAppointments = appointmentsData
          .filter((appointment: any) => 
            appointment && 
            appointment.patientId && 
            // Make sure it's not a walk-in
            appointment.VisitType !== 'walk-in' &&
            // Optional: also filter by status if needed
            (!appointment.status || appointment.status !== 'checked-in')
          )
          .map((appointment: any, index: number) => ({
            VisitID: appointment.id || Date.now() + index,
            PatientID: appointment.patientId,
            PatientName: appointment.name,
            QueueNumber: appointment.QueueNumber || `APP-${appointment.id || index}`,
            QueuePosition: appointment.QueuePosition || 0,
            QueueStatus: 'waiting',
            VisitStatus: appointment.status || 'scheduled',
            VisitType: appointment.VisitType || 'follow-up',
            VisitNotes: appointment.type || appointment.Notes || appointment.VisitNotes || 'Appointment',
            ArrivalTime: appointment.AppointmentDateTime || appointment.ArrivalTime || new Date().toISOString(),
            CalledTime: null,
            DoctorID: doctorId,
            TriagePriority: appointment.TriagePriority || 'medium',
            assignedDoctorName: "You"
          }));
        
        console.log('Transformed appointments:', transformedAppointments);
        setAppointments(transformedAppointments);
      } else {
        console.error('Appointments fetch failed:', response.status, await response.text());
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };

  // Fetch queue stats
  const fetchQueueStats = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
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
        setPatientsWaiting(statsData.patientsWaiting || 0);
      }
    } catch (error) {
      console.error("Error fetching queue stats:", error);
    }
  };

  // Fetch queue data
  const fetchQueueData = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const queueResponse = await fetch(`http://localhost:3001/api/doctor/queue/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        console.log('Queue API Response:', queueData);
        setAssignedPatients(queueData.assignedPatients || []);
        setUnassignedPatients(queueData.unassignedPatients || []);
        
        const totalWaiting = (queueData.assignedPatients?.length || 0) + 
                            (queueData.unassignedPatients?.length || 0);
        setPatientsWaiting(totalWaiting);
      } else {
        console.error('Queue fetch failed:', queueResponse.status, await queueResponse.text());
      }
    } catch (error) {
      console.error("Error fetching queue data:", error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    if (!doctorId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      setRefreshing(true);
      
      // Fetch all data in parallel for better performance
      await Promise.all([
        fetchQueueData(),
        fetchAppointments(),
        fetchQueueStats()
      ]);
      
    } catch (error) {
      console.error("Error fetching data:", error);
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

  // Filter and sort patients based on active tab
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

  // Get patients for current active tab
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

  // Handle refresh while preserving tab state
  const handleRefresh = async () => {
    await fetchAllData();
    // If showDetails is true, expand all cards, otherwise collapse all
    if (showDetails) {
      setExpandedCards(currentPatients.map(p => p.VisitID));
    } else {
      setExpandedCards([]);
    }
  };

  // Handle patient actions
  const handleClaimPatient = async (visitId: number) => {
    if (!doctorId) return;
    
    setLoading(true);
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
        // Optimistic update
        const patientToClaim = unassignedPatients.find(p => p.VisitID === visitId);
        if (patientToClaim) {
          const updatedPatient = { ...patientToClaim, DoctorID: doctorId, assignedDoctorName: "You" };
          setUnassignedPatients(prev => prev.filter(p => p.VisitID !== visitId));
          setAssignedPatients(prev => [...prev, updatedPatient]);
        }
      } else {
        alert(result.error || 'Failed to claim patient');
      }
    } catch (error) {
      console.error("Claim patient error:", error);
      alert("Failed to claim patient. Please try again.");
    } finally {
      setLoading(false);
      fetchAllData();
    }
  };

  const handleCallPatient = async (visitId: number) => {
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/doctor/visit-patient", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visitId, doctorId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedPatientId(visitId);
        const updatePatientStatus = (patients: PatientVisit[]) =>
          patients.map(patient => 
            patient.VisitID === visitId 
              ? { 
                  ...patient, 
                  QueueStatus: 'in-progress' as const,
                  VisitStatus: 'in-consultation' as const,
                  CalledTime: new Date().toISOString()
                }
              : patient
          );
        
        setAssignedPatients(updatePatientStatus);
        setUnassignedPatients(updatePatientStatus);
      } else {
        alert(result.error || 'Failed to call patient');
      }
    } catch (error) {
      console.error("Call patient error:", error);
      alert("Failed to call patient. Please try again.");
    } finally {
      setLoading(false);
      fetchAllData();
    }
  };

  const handleCompleteVisit = async (visitId: number) => {
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/doctor/complete-visit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visitId, doctorId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedPatientId(null);
        setAssignedPatients(prev => prev.filter(p => p.VisitID !== visitId));
        setPatientsSeenToday(prev => prev + 1);
        setPatientsWaiting(prev => Math.max(0, prev - 1));
      } else {
        alert(result.error || 'Failed to complete visit');
      }
    } catch (error) {
      console.error("Complete visit error:", error);
      alert("Failed to complete visit. Please try again.");
    } finally {
      setLoading(false);
      fetchAllData();
    }
  };

  // Toggle card expansion
  const toggleCardExpansion = (visitId: number) => {
    setExpandedCards(prev =>
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  // Toggle all cards expansion based on showDetails
  const toggleAllCards = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    
    if (newShowDetails) {
      // Show all details - expand all cards
      setExpandedCards(currentPatients.map(p => p.VisitID));
    } else {
      // Hide all details - collapse all cards
      setExpandedCards([]);
    }
  };

  const calculateWaitTime = (arrivalTime: string) => {
    if (!arrivalTime) return 'Just arrived';
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just arrived';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'waiting': { label: 'Waiting', variant: 'outline' as const, className: '' },
      'in-progress': { label: 'In Consultation', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'in-consultation': { label: 'In Consultation', variant: 'default' as const, className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'checked-in': { label: 'Checked In', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'scheduled': { label: 'Scheduled', variant: 'default' as const, className: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
    };
    
    const conf = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const, className: '' };
    return <Badge variant={conf.variant} className={`text-xs ${conf.className}`}>{conf.label}</Badge>;
  };

  // Render patient card with different views
  const renderPatientCard = (patient: PatientVisit, isAssigned: boolean, isAppointment: boolean = false) => {
    const isInProgress = patient.QueueStatus === 'in-progress' || patient.VisitStatus === 'in-consultation';
    const isSelected = selectedPatientId === patient.VisitID;
    const isExpanded = showDetails || expandedCards.includes(patient.VisitID);
    const canCall = patient.QueueStatus === 'waiting' && patient.VisitStatus === 'checked-in';
    const canClaim = !isAssigned && patient.DoctorID === null && canCall && !isAppointment;

    if (viewMode === 'compact' && !isExpanded) {
      return (
        <div
          key={patient.VisitID}
          className={cn(
            "border rounded-lg p-3 hover:shadow-sm transition-all",
            isSelected ? 'border-blue-300 bg-blue-50/50' :
            isInProgress ? 'border-yellow-300 bg-yellow-50/50' :
            patient.TriagePriority === 'critical' ? 'border-red-200 bg-red-50/20' :
            patient.TriagePriority === 'high' ? 'border-orange-200 bg-orange-50/20' :
            'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isInProgress ? 'default' : 'outline'}
                className={cn(
                  isInProgress && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  "text-xs min-w-[40px] text-center"
                )}
              >
                #{patient.QueueNumber?.split('-').pop() || 'N/A'}
              </Badge>
              
              <div>
                <p className="text-sm font-medium text-gray-900">{patient.PatientName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTriageBadge(patient.TriagePriority)}
                  {isAppointment && (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                      <Calendar className="size-3 mr-1" />
                      Appt
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {patient.VisitType === 'walk-in' ? 'Walk-in' : 
                     patient.VisitType === 'follow-up' ? 'Follow-up' : 'First-time'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(isAppointment ? patient.VisitStatus : patient.QueueStatus)}
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="size-3" />
                {calculateWaitTime(patient.ArrivalTime)}
              </div>
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

    // List view or expanded view
    return (
      <div
        key={patient.VisitID}
        className={cn(
          "border rounded-lg transition-all hover:shadow-sm",
          isSelected ? 'border-blue-300 bg-blue-50/50' :
          isInProgress ? 'border-yellow-300 bg-yellow-50/50' :
          patient.TriagePriority === 'critical' ? 'border-red-200 bg-red-50/20' :
          patient.TriagePriority === 'high' ? 'border-orange-200 bg-orange-50/20' :
          'border-gray-200 hover:border-gray-300'
        )}
      >
        <div 
          className={cn("p-3 transition-colors", !showDetails && "cursor-pointer hover:bg-gray-50/50")}
          onClick={!showDetails ? () => toggleCardExpansion(patient.VisitID) : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isInProgress ? 'default' : 'outline'}
                className={cn(
                  isInProgress && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  "text-xs min-w-[40px] text-center"
                )}
              >
                #{patient.QueueNumber?.split('-').pop() || 'N/A'}
              </Badge>
              
              <div className="flex items-center gap-2">
                {getTriageBadge(patient.TriagePriority)}
                {isAppointment && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                    <Calendar className="size-3 mr-1" />
                    Appt
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900">{patient.PatientName}</p>
                <p className="text-xs text-gray-500">
                  {patient.VisitType === 'walk-in' ? 'Walk-in' : 
                   patient.VisitType === 'follow-up' ? 'Follow-up' : 'First-time'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(isAppointment ? patient.VisitStatus : patient.QueueStatus)}
                {!isAssigned && patient.DoctorID && !isAppointment && (
                  <Badge variant="outline" className="text-xs">
                    Assigned
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="size-3" />
                {calculateWaitTime(patient.ArrivalTime)}
              </div>
              
              {!showDetails && (
                isExpanded ? 
                  <ChevronUp className="size-4 text-gray-400" /> : 
                  <ChevronDown className="size-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded Details - only show if showDetails is true OR card is manually expanded */}
        {(showDetails || expandedCards.includes(patient.VisitID)) && (
          <div className="px-3 pb-3 border-t pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {patient.VisitNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">Reason for Visit:</p>
                    <p className="text-xs text-gray-600">{patient.VisitNotes}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {patient.CalledTime && (
                    <span className="flex items-center gap-1">
                      <Bell className="size-3" />
                      Called at: {new Date(patient.CalledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                
                {patient.assignedDoctorName && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <User className="size-3" />
                    {isAssigned ? 'Your Patient' : `Assigned to Dr. ${patient.assignedDoctorName}`}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {!isAppointment && (
                  <div className="text-xs text-gray-500">
                    Queue Position: <span className="font-medium">{patient.QueuePosition}</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {isAppointment ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimPatient(patient.VisitID);
                      }}
                      disabled={loading}
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs px-3"
                    >
                      Check In
                    </Button>
                  ) : isInProgress ? (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteVisit(patient.VisitID);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-xs px-3"
                      disabled={loading}
                    >
                      Complete Visit
                    </Button>
                  ) : canClaim ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimPatient(patient.VisitID);
                      }}
                      disabled={loading}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs px-3"
                    >
                      Claim Patient
                    </Button>
                  ) : canCall ? (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallPatient(patient.VisitID);
                      }}
                      disabled={loading || (selectedPatientId !== null && selectedPatientId !== patient.VisitID)}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-3"
                    >
                      {selectedPatientId === patient.VisitID ? 'Consulting...' : 'Call Patient'}
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled
                      className="opacity-50 text-xs px-3"
                    >
                      Not Available
                    </Button>
                  )}
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
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
          <p className="text-gray-600">Manage your patient flow efficiently</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
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
          
          {/* Toggle Details Button */}
          <Button
            variant={showDetails ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAllCards}
            className="flex items-center gap-2"
          >
            {showDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {/* Refresh Button - preserves tab state */}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Queue Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filter Bar */}
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

          {/* Tabs for different patient categories */}
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
                    const isAssigned = assignedPatients.some(p => p.VisitID === patient.VisitID);
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
                  {filteredAppointments.map(patient => renderPatientCard(patient, true, true))}
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

        {/* Statistics Sidebar - 1/3 width */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Stats */}
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

          {/* Triage Legend (Collapsible) */}
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

          {/* Quick Actions */}
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
                  setActiveTab('all');
                  setSearchQuery('');
                  setFilterPriority('all');
                  toggleAllCards();
                }}
              >
                <Users className="size-4 mr-2" />
                View All with Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}