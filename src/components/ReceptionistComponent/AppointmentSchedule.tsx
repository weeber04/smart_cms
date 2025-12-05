// AppointmentSchedule.tsx - SIMPLIFIED VERSION
import { useState, useEffect } from 'react';
import { Calendar, Search, CheckCircle, Clock, AlertCircle, X, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface AppointmentScheduleProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
}

export function AppointmentSchedule({ receptionistId, doctors, refreshData }: AppointmentScheduleProps) {
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // State for appointments
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for actions
  const [isCheckingIn, setIsCheckingIn] = useState<number | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  
  // State for dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showLateDialog, setShowLateDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [lateReason, setLateReason] = useState('');

  // Fetch today's appointments on component mount
  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/appointments/today');
      const result = await response.json();
      
      if (result.success) {
        setTodayAppointments(result.appointments || []);
      } else {
        console.error('Failed to fetch appointments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        
        // Refresh appointments list
        fetchTodayAppointments();
        refreshData(); // Refresh dashboard stats
        
        setTimeout(() => setAppointmentSuccess(false), 3000);
        
      } else {
        alert(result.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error("❌ Appointment scheduling error:", error);
      alert("Network error. Please check console for details.");
    }
  };

  const handleCheckIn = async (appointment: any) => {
    if (!receptionistId) {
      alert('Receptionist ID not found');
      return;
    }

    if (!confirm(`Check in ${appointment.patientName} for appointment?`)) {
      return;
    }

    setIsCheckingIn(appointment.AppointmentID);

    try {
      const response = await fetch("http://localhost:3001/api/appointments/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.AppointmentID,
          receptionistId: receptionistId
        })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setCheckInMessage(`Patient checked in. Queue Number: ${result.queueNumber}`);
        setCheckInSuccess(true);
        
        // Refresh data
        fetchTodayAppointments();
        refreshData();
        
        // Auto close success message after 3 seconds
        setTimeout(() => {
          setCheckInSuccess(false);
          setCheckInMessage('');
        }, 3000);
      } else {
        alert(result.error || 'Failed to check in patient');
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in patient. Please try again.");
    } finally {
      setIsCheckingIn(null);
    }
  };

  const handleMarkLate = async () => {
    if (!selectedAppointment || !lateReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/appointments/mark-late", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.AppointmentID,
          reason: lateReason
        })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setShowLateDialog(false);
        setLateReason('');
        setSelectedAppointment(null);
        
        // Refresh data
        fetchTodayAppointments();
        refreshData();
        
        alert('Appointment marked as no-show');
      } else {
        alert(result.error || 'Failed to mark as no-show');
      }
    } catch (error) {
      console.error("Mark late error:", error);
      alert("Failed to mark appointment as no-show");
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.AppointmentID,
          reason: cancelReason,
          cancelledBy: 'receptionist'
        })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setShowCancelDialog(false);
        setCancelReason('');
        setSelectedAppointment(null);
        
        // Refresh data
        fetchTodayAppointments();
        refreshData();
        
        alert('Appointment cancelled successfully');
      } else {
        alert(result.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error("Cancel appointment error:", error);
      alert("Failed to cancel appointment");
    }
  };

  const getStatusBadge = (appointment: any) => {
    const status = appointment.VisitID ? appointment.VisitStatus : appointment.appointmentStatus;
    
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="size-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'checked-in':
      case 'waiting':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="size-3 mr-1" />
            Checked In
          </Badge>
        );
      case 'in-consultation':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            In Consultation
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      case 'no-show':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            No Show
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  const getActionButtons = (appointment: any) => {
    const status = appointment.VisitID ? appointment.VisitStatus : appointment.appointmentStatus;
    const now = new Date();
    const appointmentTime = new Date(appointment.AppointmentDateTime);
    const isPastAppointment = appointmentTime < now;

    // If already checked in or in consultation
    if (status === 'checked-in' || status === 'waiting' || status === 'in-consultation') {
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          {appointment.QueueNumber ? `Queue: ${appointment.QueueNumber}` : 'In System'}
        </Badge>
      );
    }

    // If completed or cancelled
    if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
      return (
        <Badge variant="outline" className="text-xs">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }

    // If scheduled appointment (can check in)
    if (status === 'scheduled') {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => handleCheckIn(appointment)}
            disabled={isCheckingIn === appointment.AppointmentID}
            className="h-8 bg-green-600 hover:bg-green-700"
          >
            {isCheckingIn === appointment.AppointmentID ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle className="size-3 mr-1" />
                Check In
              </>
            )}
          </Button>
          
          {isPastAppointment && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowLateDialog(true);
              }}
              className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <AlertCircle className="size-3 mr-1" />
              No Show
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => {
              setSelectedAppointment(appointment);
              setShowCancelDialog(true);
            }}
            className="h-8"
          >
            <X className="size-3 mr-1" />
            Cancel
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Schedule New Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Schedule New Appointment
          </CardTitle>
          <CardDescription>Book an appointment for a patient</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Right Column: Today's Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <span className="ml-2 text-gray-600">
                  • {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
                </span>
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchTodayAppointments}
              className="h-9"
            >
              ↻ Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {checkInSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="size-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">{checkInMessage}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading appointments...</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        <Calendar className="size-12 mx-auto mb-3 text-gray-300" />
                        <p>No appointments scheduled for today</p>
                        <p className="text-sm mt-2">Schedule new appointments above</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayAppointments.map((appointment) => (
                      <TableRow key={appointment.AppointmentID}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {appointment.time || 'No time set'}
                            </span>
                            {appointment.VisitID && (
                              <span className="text-xs text-gray-500">
                                Checked in: {new Date(appointment.CheckInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {appointment.patientName}
                          {appointment.QueueNumber && (
                            <div className="text-xs text-gray-500 mt-1">
                              Queue: {appointment.QueueNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {appointment.doctorName || 'No doctor assigned'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment)}
                        </TableCell>
                        <TableCell>
                          {getActionButtons(appointment)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="e.g., Patient requested to reschedule, emergency, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
                setSelectedAppointment(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as No-Show Dialog */}
      <Dialog open={showLateDialog} onOpenChange={setShowLateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as No-Show</DialogTitle>
            <DialogDescription>
              Mark this appointment as "No Show" - patient did not arrive.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="late-reason">Reason (optional)</Label>
              <Textarea
                id="late-reason"
                placeholder="e.g., Patient didn't show up, no contact, etc."
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLateDialog(false);
                setLateReason('');
                setSelectedAppointment(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleMarkLate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Mark as No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal for Scheduling */}
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