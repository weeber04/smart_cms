import { useState, useEffect } from 'react';
import { Users, User, Clock, AlertTriangle, Activity, Siren, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

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
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientsSeenToday, setPatientsSeenToday] = useState<number>(0);
  const [patientsWaiting, setPatientsWaiting] = useState<number>(0);
  const [assignedPatients, setAssignedPatients] = useState<PatientVisit[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<PatientVisit[]>([]);
// Add this function at the top of PatientQueue.tsx, after the imports
const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

  // Fetch queue data
  useEffect(() => {
  // In the fetchQueueData function:
const fetchQueueData = async () => {
  if (!doctorId) return;
  
  try {
    setLoading(true);
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    // Fetch patient queue (both assigned and unassigned)
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
    } else {
      console.error('Queue fetch failed:', queueResponse.status, await queueResponse.text());
    }
  } catch (error) {
    console.error("Error fetching queue data:", error);
  } finally {
    setLoading(false);
  }
};

    fetchQueueData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, [doctorId]);

  // Handle claiming an unassigned patient
// Update handleClaimPatient
const handleClaimPatient = async (visitId: number) => {
  if (!doctorId) {
    alert('Doctor not authenticated');
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3001/api/doctor/claim-patient", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        visitId,
        doctorId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert('Patient claimed successfully! You can now call them.');
      if (refreshData) refreshData();
    } else {
      alert(result.error || 'Failed to claim patient');
    }
  } catch (error) {
    console.error("Claim patient error:", error);
    alert("Failed to claim patient. Please try again.");
  } finally {
    setLoading(false);
  }
};

// Update handleCallPatient
const handleCallPatient = async (visitId: number) => {
  if (!doctorId) {
    alert('Doctor not authenticated');
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3001/api/doctor/visit-patient", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        visitId,
        doctorId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setSelectedPatientId(visitId);
      alert('Patient called successfully! Patient status updated to in-consultation.');
      if (refreshData) refreshData();
    } else {
      alert(result.error || 'Failed to call patient');
    }
  } catch (error) {
    console.error("Call patient error:", error);
    alert("Failed to call patient. Please try again.");
  } finally {
    setLoading(false);
  }
};

// Update handleCompleteVisit
const handleCompleteVisit = async (visitId: number) => {
  if (!doctorId) {
    alert('Doctor not authenticated');
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:3001/api/doctor/complete-visit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        visitId,
        doctorId
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setSelectedPatientId(null);
      alert('Visit completed successfully!');
      if (refreshData) refreshData();
    } else {
      alert(result.error || 'Failed to complete visit');
    }
  } catch (error) {
    console.error("Complete visit error:", error);
    alert("Failed to complete visit. Please try again.");
  } finally {
    setLoading(false);
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
    
    switch (priorityLower) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="text-xs">Waiting</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">In Consultation</Badge>;
      case 'in-consultation':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">In Consultation</Badge>;
      case 'checked-in':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Checked In</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // Calculate average wait time
  const calculateAverageWaitTime = () => {
    const allWaitingPatients = [...assignedPatients, ...unassignedPatients].filter(
      patient => patient.QueueStatus === 'waiting' || patient.QueueStatus === 'in-progress'
    );
    
    if (allWaitingPatients.length === 0) return '0m';
    
    const now = new Date();
    const totalWaitTime = allWaitingPatients.reduce((total, patient) => {
      const arrival = new Date(patient.ArrivalTime);
      return total + (now.getTime() - arrival.getTime());
    }, 0);
    
    const averageMinutes = Math.floor((totalWaitTime / allWaitingPatients.length) / (1000 * 60));
    return `${averageMinutes}m`;
  };

  // Render patient card
  const renderPatientCard = (patient: PatientVisit, isAssigned: boolean) => {
    const isInProgress = patient.QueueStatus === 'in-progress' || patient.VisitStatus === 'in-consultation';
    const isSelected = selectedPatientId === patient.VisitID;
    const canCall = patient.QueueStatus === 'waiting' && patient.VisitStatus === 'checked-in';
    const canClaim = !isAssigned && patient.DoctorID === null && canCall;

    return (
      <div
        key={patient.VisitID}
        className={cn(
          "p-4 border rounded-lg transition-colors",
          isSelected ? 'bg-blue-50 border-blue-300' :
          isInProgress ? 'bg-yellow-50 border-yellow-300' :
          patient.TriagePriority === 'critical' ? 'border-red-200 bg-red-50/30' :
          patient.TriagePriority === 'high' ? 'border-orange-200 bg-orange-50/30' :
          'border-gray-200 hover:border-gray-300'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isInProgress ? 'default' : 'outline'}
                  className={cn(
                    isInProgress ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : '',
                    "text-xs font-medium"
                  )}
                >
                  #{patient.QueueNumber?.split('-').pop() || 'N/A'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Pos: {patient.QueuePosition}
                </Badge>
                {getTriageBadge(patient.TriagePriority)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{patient.PatientName}</p>
                <p className="text-xs text-gray-500">
                  {patient.VisitType === 'walk-in' ? 'Walk-in' : 
                   patient.VisitType === 'follow-up' ? 'Follow-up' : 'First-time'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1 mb-3">
              {patient.VisitNotes && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Reason:</span> {patient.VisitNotes}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Waiting: {calculateWaitTime(patient.ArrivalTime)}
                </span>
                {patient.CalledTime && (
                  <span className="flex items-center gap-1">
                    <Bell className="size-3" />
                    Called: {new Date(patient.CalledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              {patient.assignedDoctorName && (
                <p className="text-xs text-blue-600">
                  <User className="size-3 inline mr-1" />
                  {isAssigned ? 'Your Patient' : `Assigned to Dr. ${patient.assignedDoctorName}`}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusBadge(patient.QueueStatus)}
              {!isAssigned && patient.DoctorID && (
                <Badge variant="outline" className="text-xs">
                  Already assigned
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-2">
            {isInProgress ? (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => handleCompleteVisit(patient.VisitID)}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                Complete Visit
              </Button>
            ) : canClaim ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleClaimPatient(patient.VisitID)}
                disabled={loading}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Claim Patient
              </Button>
            ) : canCall ? (
              <Button 
                size="sm" 
                onClick={() => handleCallPatient(patient.VisitID)}
                disabled={loading || (selectedPatientId !== null && selectedPatientId !== patient.VisitID)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedPatientId === patient.VisitID ? 'Consulting...' : 'Call Patient'}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                disabled
                className="opacity-50"
              >
                Not Available
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalWaitingPatients = assignedPatients.length + unassignedPatients.length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Patient Queue
          </CardTitle>
          <CardDescription>
            {totalWaitingPatients} patient(s) in queue • {assignedPatients.length} assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading queue data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Assigned Patients Section */}
              {assignedPatients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Patients</h3>
                  <div className="space-y-3">
                    {assignedPatients.map(patient => renderPatientCard(patient, true))}
                  </div>
                </div>
              )}

              {/* Unassigned Patients Section */}
              {unassignedPatients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Available Patients</h3>
                  <div className="space-y-3">
                    {unassignedPatients.map(patient => renderPatientCard(patient, false))}
                  </div>
                </div>
              )}

              {/* No Patients Message */}
              {totalWaitingPatients === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="size-12 mx-auto mb-3 text-gray-400" />
                  <p>No patients in queue</p>
                  <p className="text-sm mt-1">Patients will appear here when they check in</p>
                </div>
              )}
            </div>
          )}
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
              <div>
                <span className="text-sm text-gray-700">Patients Seen Today</span>
                <p className="text-xs text-gray-500">Completed consultations</p>
              </div>
              <span className="text-2xl text-blue-600">{patientsSeenToday}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-700">Currently Waiting</span>
                <p className="text-xs text-gray-500">In queue or consultation</p>
              </div>
              <span className="text-2xl text-orange-600">{patientsWaiting}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-700">Average Wait Time</span>
                <p className="text-xs text-gray-500">For waiting patients</p>
              </div>
              <span className="text-2xl text-green-600">{calculateAverageWaitTime()}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm text-gray-900 mb-2">Queue Status Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <span className="text-gray-600">Waiting - Ready to be called</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-gray-600">In Progress - Currently in consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-600">In Consultation - With doctor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Completed - Consultation finished</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm text-gray-900 mb-2">Triage Priority Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Critical - Highest priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">High - Urgent attention needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Medium - Standard priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Low - Routine/Routine</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}