// AppointmentSchedule.tsx - FIXED SCROLLING VERSION
import { useState, useEffect, useRef } from 'react';
import { Calendar, Search, CheckCircle, Clock, AlertCircle, X, Pencil, Clock4, User, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

interface AppointmentScheduleProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
}

// const TIME_SLOTS = [
//   '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
//   '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
//   '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
//   '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
//   '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
//   '23:00'
// ];

// Time slots for dropdown (30-minute intervals)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

export function AppointmentSchedule({ receptionistId, doctors, refreshData }: AppointmentScheduleProps) {
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Time states
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(30);
  
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

  // New states for availability
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // In your AppointmentSchedule.tsx, add:
useEffect(() => {
  const now = new Date();
  console.log('Frontend current date:', now.toString());
  console.log('Frontend local date:', now.toLocaleDateString());
  console.log('Frontend UTC date:', now.toISOString().split('T')[0]);
  
  fetchTodayAppointments();
}, []);

  // Calculate end time when start time or duration changes
  useEffect(() => {
    if (startTime) {
      const calculateEndTime = () => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        const formattedEndTime = 
          `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        
        setEndTime(formattedEndTime);
      };
      
      calculateEndTime();
    }
  }, [startTime, duration]);

  // Fetch doctor availability when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchDoctorAvailability();
    } else {
      setAvailableSlots(TIME_SLOTS);
      setBookedSlots([]);
    }
  }, [selectedDoctorId, selectedDate]);

  // Fetch today's appointments on component mount
  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  // Check if a time slot is in the past
  const isPastTime = (time: string) => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // If selected date is today, check if time is past
    if (selectedDate === today) {
      if (!currentTime) return false;
      
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const [slotHours, slotMinutes] = time.split(':').map(Number);
      
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      
      // Add buffer of 15 minutes (allows booking slots that start within the next 15 minutes)
      const bufferMinutes = 15;
      
      return slotTotalMinutes < (currentTotalMinutes - bufferMinutes);
    }
    
    return false;
  };

  // Check if a time slot is available (not booked and not past)
  const isSlotAvailable = (time: string) => {
    if (!selectedDoctorId || !selectedDate) return true;
    
    // Check if time is in the past (only for today's date)
    if (isPastTime(time)) {
      return false;
    }
    
    return availableSlots.includes(time);
  };

  // Get filtered time slots based on current time
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return TIME_SLOTS;
    
    const today = new Date().toISOString().split('T')[0];
    
    // If not today, show all slots
    if (selectedDate !== today) {
      return TIME_SLOTS;
    }
    
    // If today, filter out past times with buffer
    if (!currentTime) return TIME_SLOTS;
    
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const bufferMinutes = 15; // Buffer to allow booking slots starting soon
    
    return TIME_SLOTS.filter(time => {
      const [slotHours, slotMinutes] = time.split(':').map(Number);
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      
      return slotTotalMinutes >= (currentTotalMinutes - bufferMinutes);
    });
  };

const fetchTodayAppointments = async () => {
  setIsLoading(true);
  try {
    console.log('=== FRONTEND FETCHING APPOINTMENTS ===');
    console.log('Frontend time:', new Date().toString());
    
    const response = await fetch('http://localhost:3001/api/appointments/today');
    const result = await response.json();
    
    console.log('=== API RESPONSE ===');
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    console.log('Date info from server:', result.dateInfo);
    console.log('Total appointments returned:', result.appointments?.length);
    
    if (result.success) {
      setTodayAppointments(result.appointments || []);
      
      // Log details of each appointment
      if (result.appointments && result.appointments.length > 0) {
        console.log('Appointment details:');
        result.appointments.forEach((apt: any, index: number) => {
          console.log(`[${index}] ID: ${apt.AppointmentID}, Patient: ${apt.patientName}, 
            Date: ${apt.date}, Time: ${apt.time}-${apt.endTime}, 
            Doctor: ${apt.doctorName}, Has Visit: ${!!apt.VisitID}`);
        });
      }
    } else {
      console.error('Failed to fetch appointments:', result.error);
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
  } finally {
    setIsLoading(false);
  }
};
  const fetchDoctorAvailability = async () => {
    if (!selectedDoctorId || !selectedDate) return;
    
    setLoadingAvailability(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/appointments/doctor-availability?doctorId=${selectedDoctorId}&date=${selectedDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const processedBookedSlots = data.bookedSlots?.map((slot: any) => ({
            ...slot,
            start: slot.start ? formatTime(slot.start) : '--:--',
            end: slot.end ? formatTime(slot.end) : '--:--'
          })) || [];
          
          setAvailableSlots(data.availableSlots || []);
          setBookedSlots(processedBookedSlots);
        }
      } else {
        console.error('Failed to fetch availability:', response.status);
      }
    } catch (error) {
      console.error("Fetch availability error:", error);
      setAvailableSlots(TIME_SLOTS);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '--:--';
    
    const time = timeString.split(':');
    if (time.length >= 2) {
      return `${time[0]}:${time[1]}`;
    }
    return timeString;
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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setStartTime('');
    setEndTime('');
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setStartTime('');
    setEndTime('');
  };

  const getSlotStatus = (time: string) => {
    const bookedSlot = bookedSlots.find(slot => {
      if (slot.start && slot.end) {
        const startTime = new Date(`1970-01-01T${slot.start}`);
        const endTime = new Date(`1970-01-01T${slot.end}`);
        const checkTime = new Date(`1970-01-01T${time}`);
        return checkTime >= startTime && checkTime < endTime;
      }
      return false;
    });
    
    if (isPastTime(time)) {
      return 'Past time (unavailable)';
    }
    
    return bookedSlot ? `Booked (${bookedSlot.status})` : 'Available';
  };

  const isTimeRangeAvailable = (start: string, end: string) => {
    if (!selectedDoctorId || !selectedDate || !start || !end) return true;
    
    // Check if start time is in the past
    if (isPastTime(start)) {
      return false;
    }
    
    const startTimeObj = new Date(`1970-01-01T${start}`);
    const endTimeObj = new Date(`1970-01-01T${end}`);
    
    const hasConflict = bookedSlots.some(slot => {
      if (slot.start && slot.end) {
        const slotStart = new Date(`1970-01-01T${slot.start}`);
        const slotEnd = new Date(`1970-01-01T${slot.end}`);
        
        return (
          (startTimeObj >= slotStart && startTimeObj < slotEnd) ||
          (endTimeObj > slotStart && endTimeObj <= slotEnd) ||
          (startTimeObj <= slotStart && endTimeObj >= slotEnd)
        );
      }
      return false;
    });
    
    return !hasConflict;
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

    if (!isTimeRangeAvailable(startTime, endTime)) {
      alert("This time slot is already booked or unavailable. Please choose a different time.");
      return;
    }

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const date = formData.get('date');
      const startTime = formData.get('startTime');
      const endTime = formData.get('endTime');
      const reason = formData.get('reason');
      const notes = formData.get('notes') || '';
      const appointmentDuration = formData.get('duration');
      
      if (!date || !startTime || !endTime || !reason) {
        alert("Please fill in all required fields: date, start time, end time, and reason");
        return;
      }
      
      const appointmentDateTime = `${date}T${startTime}:00`;
      
      const appointmentData = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDateTime: appointmentDateTime,
        startTime: startTime,
        endTime: endTime,
        purpose: reason,
        notes: notes,
        createdBy: receptionistId
      };

      const response = await fetch("http://localhost:3001/api/appointments/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setAppointmentSuccess(true);
        
        (e.target as HTMLFormElement).reset();
        setSelectedPatientId(null);
        setPatientSearch('');
        setSelectedPatientName('');
        setSelectedDoctorId('');
        setSelectedDate('');
        setStartTime('');
        setEndTime('');
        setDuration(30);
        setAvailableSlots(TIME_SLOTS);
        setBookedSlots([]);
        
        fetchTodayAppointments();
        refreshData();
        
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
        
        fetchTodayAppointments();
        refreshData();
        
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

    if (status === 'checked-in' || status === 'waiting' || status === 'in-consultation') {
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          {appointment.QueueNumber ? `Queue: ${appointment.QueueNumber}` : 'In System'}
        </Badge>
      );
    }

    if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
      return (
        <Badge variant="outline" className="text-xs">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }

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

  const renderAppointmentTime = (appointment: any) => {
    if (appointment.startTime && appointment.endTime) {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {appointment.startTime} - {appointment.endTime}
          </span>
          {appointment.duration && (
            <span className="text-xs text-gray-500">
              Duration: {appointment.duration} min
            </span>
          )}
        </div>
      );
    }
    
    return (
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
    );
  };

  // Custom Time Slot Selector Component for better scrolling control
  const TimeSlotSelector = () => (
    <Select 
      required 
      name="startTime"
      value={startTime}
      onValueChange={setStartTime}
      disabled={!selectedDoctorId || !selectedDate}
    >
      <SelectTrigger id="startTime" className={!isSlotAvailable(startTime) && startTime ? 'border-red-300 bg-red-50' : ''}>
        <SelectValue placeholder="Select start time">
          {startTime && (
            <>
              <Clock4 className="size-4 mr-2 inline" />
              {startTime}
              {!isSlotAvailable(startTime) && (
                <span className="ml-2 text-xs text-red-600">
                  {isPastTime(startTime) ? '(Past time)' : '(Not Available)'}
                </span>
              )}
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="p-0">
        <div className="px-2 py-1.5 text-xs text-gray-500 border-b sticky top-0 bg-white z-10">
          {selectedDoctorId && selectedDate ? (
            <div className="flex justify-between items-center">
              <span>Available time slots for {selectedDate}</span>
              {currentTime && selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="text-blue-600 font-medium">
                  Current time: {currentTime}
                </span>
              )}
            </div>
          ) : (
            <span>Select doctor and date first</span>
          )}
        </div>
        
        {/* Scrollable container for time slots */}
        <div className="max-h-[300px] overflow-y-auto">
          {getFilteredTimeSlots().map((time) => {
            const available = isSlotAvailable(time);
            const pastTime = isPastTime(time);
            const status = getSlotStatus(time);
            
            const bookingAppointment = bookedSlots.find(slot => {
              if (slot.start && slot.end) {
                const startTime = new Date(`1970-01-01T${slot.start}:00`);
                const endTime = new Date(`1970-01-01T${slot.end}:00`);
                const checkTime = new Date(`1970-01-01T${time}:00`);
                return checkTime >= startTime && checkTime < endTime;
              }
              return false;
            });
            
            let unavailableReason = '';
            if (!available) {
              if (pastTime) {
                unavailableReason = 'Past time (unavailable)';
              } else if (bookingAppointment) {
                unavailableReason = `Booked by ${bookingAppointment.patientName}`;
              } else {
                unavailableReason = 'Not available';
              }
            }
            
            return (
              <SelectItem 
                key={time} 
                value={time}
                disabled={!available}
                className={`
                  ${!available ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${time === startTime ? 'bg-blue-50' : ''}
                  ${pastTime ? 'line-through' : ''}
                `}
              >
                <div className="flex items-center justify-between w-full py-1">
                  <div className="flex flex-col">
                    <span>{time}</span>
                    {!available && (
                      <span className="text-xs text-gray-500">
                        {unavailableReason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {!available ? (
                      <>
                        {pastTime ? (
                          <>
                            <Clock className="size-3 text-gray-500 mr-1" />
                            <span className="text-xs text-gray-600">Past</span>
                          </>
                        ) : (
                          <>
                            <X className="size-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">Booked</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">Available</span>
                      </>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </div>
      </SelectContent>
    </Select>
  );

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
              
              {selectedPatientId && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm text-green-800">
                    Selected: <span className="font-semibold">{selectedPatientName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Selector */}
            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor *</Label>
              <Select 
                required 
                name="doctor"
                value={selectedDoctorId}
                onValueChange={handleDoctorChange}
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
                      <div className="flex items-center">
                        <User className="size-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">{doctor.Name}</div>
                          <div className="text-xs text-gray-500">{doctor.Specialization || 'General'}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input 
                  id="date" 
                  name="date"
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              
              {/* Duration Selector */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min) *</Label>
                <Select 
                  required
                  name="duration"
                  value={String(duration)}
                  onValueChange={(value) => setDuration(Number(value))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Time Selector - Using custom component */}
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                {loadingAvailability ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    <span className="text-sm text-gray-500">Checking availability...</span>
                  </div>
                ) : (
                  <TimeSlotSelector />
                )}
                
                {!selectedDoctorId && (
                  <p className="text-xs text-gray-500">Select a doctor to see available time slots</p>
                )}
                {selectedDoctorId && !selectedDate && (
                  <p className="text-xs text-gray-500">Select a date to see available time slots</p>
                )}
                
                {startTime && !isSlotAvailable(startTime) && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <AlertCircle className="size-4 inline mr-1 text-red-500" />
                    <span className="text-red-600 font-medium">
                      {isPastTime(startTime) ? 'This time is in the past' : 'This time slot is not available'}
                    </span>
                    <p className="text-red-500 text-xs mt-1">{getSlotStatus(startTime)}</p>
                  </div>
                )}
              </div>
              
              {/* End Time Input */}
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input 
                  id="endTime" 
                  name="endTime"
                  type="time" 
                  required 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime}
                  className={!isTimeRangeAvailable(startTime, endTime) ? 'border-red-300 bg-red-50' : ''}
                  step="300"
                />
                {startTime && !endTime && (
                  <p className="text-xs text-gray-500">Calculated based on duration</p>
                )}
                {endTime && !isTimeRangeAvailable(startTime, endTime) && (
                  <p className="text-xs text-red-600">
                    {isPastTime(startTime) ? 'Cannot book past times' : 'This time range conflicts with existing appointments'}
                  </p>
                )}
              </div>
            </div>

            {/* Show doctor's schedule for the day */}
            {selectedDoctorId && selectedDate && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScheduleExpanded(!scheduleExpanded)}
                      className="p-1 h-7"
                    >
                      {scheduleExpanded ? (
                        <ChevronUp className="size-4 mr-1" />
                      ) : (
                        <ChevronDown className="size-4 mr-1" />
                      )}
                      <h4 className="text-sm font-medium">Doctor's Schedule for {selectedDate}</h4>
                    </Button>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {bookedSlots.length} booked
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={fetchDoctorAvailability}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      title="Refresh availability"
                    >
                      <RefreshCw className="size-3 mr-1" />
                      Refresh
                    </button>
                  </div>
                </div>
                
                {scheduleExpanded && (
                  <ScrollArea className="h-64">
                    <div className="pr-4">
                      {bookedSlots.length > 0 ? (
                        <div className="space-y-3 mt-2">
                          <div className="text-xs font-medium text-gray-700">Booked Appointments:</div>
                          <div className="space-y-2">
                            {bookedSlots.map((slot, index) => {
                              let durationMinutes = 30;
                              if (slot.start && slot.end) {
                                try {
                                  const startParts = slot.start.split(':').map(Number);
                                  const endParts = slot.end.split(':').map(Number);
                                  
                                  if (startParts.length >= 2 && endParts.length >= 2) {
                                    const startMinutes = startParts[0] * 60 + startParts[1];
                                    const endMinutes = endParts[0] * 60 + endParts[1];
                                    durationMinutes = endMinutes - startMinutes;
                                  }
                                } catch (error) {
                                  console.error('Error calculating duration:', error);
                                  durationMinutes = 30;
                                }
                              }
                              
                              return (
                                <div 
                                  key={index}
                                  className="p-3 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {slot.start} - {slot.end}
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({durationMinutes} min)
                                        </span>
                                      </div>
                                      <div className="text-sm font-semibold text-gray-900 mt-1">
                                        {slot.patientName}
                                      </div>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`
                                        text-xs
                                        ${slot.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                        ${slot.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        ${slot.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                                        ${slot.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                      `}
                                    >
                                      {slot.status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-2">
                                    <div className="font-medium mb-1">Purpose:</div>
                                    <div className="text-gray-500">{slot.purpose || 'No purpose specified'}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Calendar className="size-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No appointments booked for {selectedDate}</p>
                          <p className="text-xs text-gray-500 mt-1">All time slots are available</p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                            <div className="font-bold text-green-700">{availableSlots.length}</div>
                            <div className="text-green-600">Available</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                            <div className="font-bold text-red-700">{bookedSlots.length}</div>
                            <div className="text-red-600">Booked</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="font-bold text-blue-700">{TIME_SLOTS.length}</div>
                            <div className="text-blue-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

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
              disabled={!selectedPatientId || !startTime || !endTime || !isTimeRangeAvailable(startTime, endTime)}
            >
              <Calendar className="size-4 mr-2" />
              Schedule Appointment
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column: Today's Appointments */}
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0">
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
        <CardContent className="flex-1 overflow-hidden p-0">
          {checkInSuccess && (
            <div className="m-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="size-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">{checkInMessage}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading appointments...</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="size-12 mx-auto mb-3 text-gray-300" />
                      <p>No appointments scheduled for today</p>
                      <p className="text-sm mt-2">Schedule new appointments above</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time Slot</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayAppointments.map((appointment) => (
                          <TableRow key={appointment.AppointmentID}>
                            <TableCell>
                              {renderAppointmentTime(appointment)}
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
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </ScrollArea>
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