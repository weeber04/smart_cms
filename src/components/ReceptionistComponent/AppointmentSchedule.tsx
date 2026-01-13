// AppointmentSchedule.tsx - UNIFIED FORM VERSION
import { useState, useEffect } from 'react';
import { Calendar, Search, CheckCircle, Clock, AlertCircle, X, User, RefreshCw, ChevronDown, ChevronUp, Clock4, Save, Edit, CalendarDays, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface AppointmentScheduleProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
}

// Time slots for dropdown (30-minute intervals)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

export function AppointmentSchedule({ receptionistId, doctors, refreshData }: AppointmentScheduleProps) {
  const [mode, setMode] = useState<'new' | 'manage'>('new'); // 'new' or 'manage'
  
  // === SEARCH STATES ===
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [appointmentSearchResults, setAppointmentSearchResults] = useState<any[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [isSearchingAppointments, setIsSearchingAppointments] = useState(false);
  
  // === FORM STATES ===
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Form data - shared for both new and edit
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    appointmentId: '',
    doctorId: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 30,
    reason: '',
    notes: '',
    status: 'scheduled'
  });
  
  // === UI STATES ===
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  
  // === APPOINTMENTS LIST STATES ===
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<'today' | 'upcoming' | 'past' | 'all'>('upcoming');
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  // === ACTION STATES ===
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState<number | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCancelAppointment, setSelectedCancelAppointment] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update current time every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load all appointments
  useEffect(() => {
    fetchAllAppointments();
  }, [appointmentFilter]);

  // Calculate end time when start time or duration changes
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      setEndTime(formattedEndTime);
      setFormData(prev => ({ ...prev, endTime: formattedEndTime }));
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

  // Filter appointments based on selected filter
  useEffect(() => {
    const now = new Date();
    let filtered = [...allAppointments];

    switch (appointmentFilter) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filtered = filtered.filter(apt => 
          new Date(apt.AppointmentDateTime).toISOString().split('T')[0] === today
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => 
          new Date(apt.AppointmentDateTime) >= now &&
          apt.Status !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(apt => 
          new Date(apt.AppointmentDateTime) < now &&
          apt.Status !== 'cancelled'
        );
        break;
      case 'all':
        // Show all, no filter
        break;
    }

    setFilteredAppointments(filtered);
  }, [allAppointments, appointmentFilter]);

  const fetchAllAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const response = await fetch('http://localhost:3001/api/appointments/all');
      const result = await response.json();
      
      if (result.success) {
        setAllAppointments(result.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoadingAppointments(false);
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
    if (time.length >= 2) return `${time[0]}:${time[1]}`;
    return timeString;
  };

  const formatAppointmentDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
  };

  // === PATIENT SEARCH ===
  const handlePatientSearch = async (searchTerm: string) => {
    setPatientSearch(searchTerm);
    if (searchTerm.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    
    setIsSearchingPatients(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/receptionist/search-patient?search=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPatientSearchResults(data);
      }
    } catch (error) {
      console.error("Patient search error:", error);
    } finally {
      setIsSearchingPatients(false);
    }
  };

const selectPatient = (patient: any) => {
  setSelectedPatient(patient);
  setPatientSearch(patient.Name);
  setPatientSearchResults([]); // Clear the results dropdown
  setFormData(prev => ({
    ...prev,
    patientId: patient.id,
    patientName: patient.Name
  }));
};

  // === APPOINTMENT SEARCH (for manage mode) ===
const handleAppointmentSearch = async (searchTerm: string) => {
  setAppointmentSearch(searchTerm);
  if (searchTerm.length < 2) {
    setAppointmentSearchResults([]);
    return;
  }
  
  setIsSearchingAppointments(true);
  try {
    const response = await fetch(
      `http://localhost:3001/api/appointments/search?q=${encodeURIComponent(searchTerm)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setAppointmentSearchResults(data.appointments || []);
      } else {
        console.error("Search error:", data.error);
        setAppointmentSearchResults([]);
      }
    } else {
      console.error("Search failed with status:", response.status);
      setAppointmentSearchResults([]);
    }
  } catch (error) {
    console.error("Appointment search error:", error);
    setAppointmentSearchResults([]);
  } finally {
    setIsSearchingAppointments(false);
  }
};

const selectAppointment = (appointment: any) => {
  setSelectedAppointment(appointment);
  setAppointmentSearch(`${appointment.PatientName} - ${formatAppointmentDateTime(appointment.AppointmentDateTime).full}`);
  setAppointmentSearchResults([]); // Clear the results dropdown
  
  setTimeout(() => {
    setAppointmentSearchResults([]);
  }, 0);
    
  // Populate form with appointment data
  const appointmentDate = new Date(appointment.AppointmentDateTime);
  const formattedDate = appointmentDate.toISOString().split('T')[0];
  const formattedStartTime = appointmentDate.toTimeString().slice(0, 5);
    
  // Calculate duration
  let duration = 30; // default
  if (appointment.EndTime) {
    const start = new Date(`1970-01-01T${formattedStartTime}`);
    const end = new Date(`1970-01-01T${appointment.EndTime}`);
    duration = (end.getTime() - start.getTime()) / (1000 * 60);
  }
    
  setFormData({
    patientId: appointment.PatientID,
    patientName: appointment.PatientName,
    appointmentId: appointment.AppointmentID,
    doctorId: appointment.DoctorID?.toString() || '',
    date: formattedDate,
    startTime: formattedStartTime,
    endTime: appointment.EndTime || '',
    duration: duration,
    reason: appointment.Purpose || '',
    notes: appointment.Notes || '',
    status: appointment.Status || 'scheduled'
  });
    
  // Update UI states
  setSelectedDate(formattedDate);
  setSelectedDoctorId(appointment.DoctorID?.toString() || '');
  setStartTime(formattedStartTime);
  setDuration(duration);
};

  // === FORM VALIDATION ===
  const isPastTime = (time: string) => {
    if (!selectedDate) return false;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (selectedDate === today) {
      if (!currentTime) return false;
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const [slotHours, slotMinutes] = time.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      const bufferMinutes = 15;
      return slotTotalMinutes < (currentTotalMinutes - bufferMinutes);
    }
    
    return false;
  };

  const isSlotAvailable = (time: string) => {
    if (!selectedDoctorId || !selectedDate) return true;
    if (isPastTime(time)) return false;
    return availableSlots.includes(time);
  };

  const getFilteredTimeSlots = () => {
    if (!selectedDate) return TIME_SLOTS;
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedDate !== today) return TIME_SLOTS;
    if (!currentTime) return TIME_SLOTS;
    
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const bufferMinutes = 15;
    
    return TIME_SLOTS.filter(time => {
      const [slotHours, slotMinutes] = time.split(':').map(Number);
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      return slotTotalMinutes >= (currentTotalMinutes - bufferMinutes);
    });
  };

  const isTimeRangeAvailable = (start: string, end: string) => {
    if (!selectedDoctorId || !selectedDate || !start || !end) return true;
    if (isPastTime(start)) return false;
    
    const startTimeObj = new Date(`1970-01-01T${start}`);
    const endTimeObj = new Date(`1970-01-01T${end}`);
    
    const hasConflict = bookedSlots.some(slot => {
      if (slot.start && slot.end && slot.appointmentId !== formData.appointmentId) {
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

  // === FORM SUBMISSION ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receptionistId) {
      alert("Receptionist ID is missing");
      return;
    }

    if (mode === 'new' && !formData.patientId) {
      alert("Please select a patient first");
      return;
    }

    if (mode === 'manage' && !formData.appointmentId) {
      alert("Please select an appointment to manage");
      return;
    }

    if (!formData.doctorId || !formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    if (!isTimeRangeAvailable(formData.startTime, formData.endTime)) {
      alert("This time slot is already booked or unavailable. Please choose a different time.");
      return;
    }

    setIsSaving(true);

    try {
      const appointmentDateTime = `${formData.date}T${formData.startTime}:00`;
      
      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDateTime: appointmentDateTime,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.reason,
        notes: formData.notes,
        createdBy: receptionistId,
        status: formData.status
      };

      let url = "http://localhost:3001/api/appointments/schedule";
      let method = "POST";

      if (mode === 'manage' && formData.appointmentId) {
        url = `http://localhost:3001/api/appointments/update/${formData.appointmentId}`;
        method = "PUT";
        (appointmentData as any).appointmentId = formData.appointmentId;
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setSuccessMessage(
          mode === 'new' 
            ? "Appointment scheduled successfully!" 
            : "Appointment updated successfully!"
        );
        setShowSuccessDialog(true);
        
        // Reset form
        resetForm();
        
        // Refresh data
        fetchAllAppointments();
        refreshData();
      } else {
        alert(result.error || `Failed to ${mode === 'new' ? 'schedule' : 'update'} appointment`);
      }
    } catch (error) {
      console.error("Appointment error:", error);
      alert("Network error. Please check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      patientName: '',
      appointmentId: '',
      doctorId: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: 30,
      reason: '',
      notes: '',
      status: 'scheduled'
    });
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setPatientSearch('');
    setAppointmentSearch('');
    setSelectedDate('');
    setSelectedDoctorId('');
    setStartTime('');
    setEndTime('');
    setDuration(30);
    setAvailableSlots(TIME_SLOTS);
    setBookedSlots([]);
  };

  // === APPOINTMENT ACTIONS ===
  const handleCheckIn = async (appointment: any) => {
    if (!receptionistId) {
      alert('Receptionist ID not found');
      return;
    }

    if (!confirm(`Check in ${appointment.PatientName} for appointment?`)) {
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
        
        fetchAllAppointments();
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

  const handleCancelAppointment = async () => {
    if (!selectedCancelAppointment || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    if (!receptionistId) {
      alert('Receptionist ID is missing');
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedCancelAppointment.AppointmentID,
          reason: cancelReason,
          cancelledBy: receptionistId
        })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setShowCancelDialog(false);
        setCancelReason('');
        setSelectedCancelAppointment(null);
        
        fetchAllAppointments();
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

  const getStatusBadge = (status: string) => {
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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, date }));
    setStartTime('');
    setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setFormData(prev => ({ ...prev, doctorId }));
    setStartTime('');
    setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    setFormData(prev => ({ ...prev, startTime: time }));
  };

  const handleDurationChange = (value: string) => {
    const duration = parseInt(value);
    setDuration(duration);
    setFormData(prev => ({ ...prev, duration }));
  };

  // Time Slot Selector Component
  const TimeSlotSelector = () => (
    <Select 
      required 
      value={startTime}
      onValueChange={handleStartTimeChange}
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
        
        <div className="max-h-[300px] overflow-y-auto">
          {getFilteredTimeSlots().map((time) => {
            const available = isSlotAvailable(time);
            const pastTime = isPastTime(time);
            
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
                  <span>{time}</span>
                  {!available ? (
                    pastTime ? (
                      <span className="text-xs text-gray-600">Past</span>
                    ) : (
                      <span className="text-xs text-red-600">Booked</span>
                    )
                  ) : (
                    <span className="text-xs text-green-600">Available</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </div>
      </SelectContent>
    </Select>
  );

  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(7);

// Add these constants after filteredAppointments useEffect
const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

useEffect(() => {
  setCurrentPage(1);
}, [appointmentFilter, filteredAppointments.length]);

const PaginationControls = () => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white">
    <div className="text-sm text-gray-500 whitespace-nowrap">
      Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of{" "}
      {filteredAppointments.length} appointments
    </div>
    
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronLeft className="size-4" />
        </Button>
        
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 min-w-8 px-2 ${
                  currentPage === pageNum 
                    ? "bg-orange-600 hover:bg-orange-700" 
                    : ""
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-gray-400 mx-1">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                className="h-8 min-w-8 px-2"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <div className="sm:hidden text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  </div>
);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Appointment Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                {mode === 'new' ? 'Schedule New Appointment' : 'Manage Appointment'}
              </CardTitle>
              <CardDescription>
                {mode === 'new' 
                  ? 'Book a new appointment for a patient' 
                  : 'Edit an existing appointment'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
<Button
  type="button"
  variant={mode === 'new' ? 'default' : 'outline'}
  onClick={() => {
    setMode('new');
    resetForm();
    // Clear all search states
    setPatientSearch('');
    setPatientSearchResults([]);
    setAppointmentSearch('');
    setAppointmentSearchResults([]);
  }}
  className={mode === 'new' ? 'bg-orange-600 hover:bg-orange-700' : ''}
>
  New
</Button>
<Button
  type="button"
  variant={mode === 'manage' ? 'default' : 'outline'}
  onClick={() => {
    setMode('manage');
    resetForm();
    // Clear all search states
    setPatientSearch('');
    setPatientSearchResults([]);
    setAppointmentSearch('');
    setAppointmentSearchResults([]);
  }}
  className={mode === 'manage' ? 'bg-blue-600 hover:bg-blue-700' : ''}
>
  Manage
</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search Field - Changes based on mode */}
<div className="space-y-2 relative">
  <Label htmlFor="search-field">
    {mode === 'new' ? 'Patient Search *' : 'Appointment Search *'}
  </Label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
    <Input 
      id="search-field" 
      placeholder={
        mode === 'new' 
          ? "Search patient by name, IC number, or phone"
          : "Search appointment by patient name, appointment ID, or date"
      }
      value={mode === 'new' ? patientSearch : appointmentSearch}
      onChange={(e) => 
        mode === 'new' 
          ? handlePatientSearch(e.target.value)
          : handleAppointmentSearch(e.target.value)
      }
      className="pl-10"
      required
    />
  </div>
  
  {/* Loading state */}
  {(mode === 'new' ? isSearchingPatients : isSearchingAppointments) && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="px-4 py-3 text-gray-500 text-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto mb-2"></div>
        Searching...
      </div>
    </div>
  )}
  
  {/* Search Results Dropdown */}
  {!isSearchingPatients && !isSearchingAppointments && (
    mode === 'new' 
      ? (patientSearchResults.length > 0 && !selectedPatient && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {patientSearchResults.map((patient) => (
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
        ))
      : (appointmentSearchResults.length > 0 && !selectedAppointment && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {appointmentSearchResults.map((appointment) => {
              const formatted = formatAppointmentDateTime(appointment.AppointmentDateTime);
              return (
                <div
                  key={appointment.AppointmentID}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => selectAppointment(appointment)}
                >
                  <div className="font-medium">{appointment.PatientName}</div>
                  <div className="text-sm text-gray-500">
                    {formatted.date} at {formatted.time} • Dr. {appointment.DoctorName || 'Not assigned'}
                  </div>
                  {appointment.Purpose && (
                    <div className="text-xs text-gray-400 mt-1">
                      {appointment.Purpose.substring(0, 50)}{appointment.Purpose.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
  )}
  
  {/* No results message - Only show when no patient/appointment is selected */}
  {(mode === 'new' ? patientSearch : appointmentSearch).length >= 2 && 
   !(mode === 'new' ? isSearchingPatients : isSearchingAppointments) &&
   (mode === 'new' ? patientSearchResults : appointmentSearchResults).length === 0 &&
   !(mode === 'new' ? selectedPatient : selectedAppointment) && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="px-4 py-3 text-gray-500 text-center">
        No results found for "{mode === 'new' ? patientSearch : appointmentSearch}"
      </div>
    </div>
  )}
  
  {/* Selected Patient Indicator */}
  {mode === 'new' && selectedPatient && (
    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
      <div className="text-sm text-green-800 flex items-center justify-between">
        <span>
          Selected Patient: <span className="font-semibold">{selectedPatient.Name}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setSelectedPatient(null);
            setPatientSearch('');
            setPatientSearchResults([]); // Clear results
            setFormData(prev => ({ ...prev, patientId: '', patientName: '' }));
          }}
          className="text-red-600 hover:text-red-800"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )}
  
  {/* Selected Appointment Indicator */}
  {mode === 'manage' && selectedAppointment && (
    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
      <div className="text-sm text-blue-800 flex items-center justify-between">
        <span>
          Selected Appointment: <span className="font-semibold">{selectedAppointment.PatientName}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setSelectedAppointment(null);
            setAppointmentSearch('');
            setAppointmentSearchResults([]); // Clear results
            resetForm();
          }}
          className="text-red-600 hover:text-red-800"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )}
</div>

            {/* Display selected patient info in manage mode */}
            {mode === 'manage' && formData.patientName && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Patient</div>
                    <div className="font-medium">{formData.patientName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Appointment ID</div>
                    <div className="font-medium">{formData.appointmentId}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor *</Label>
              <Select 
                required 
                value={formData.doctorId}
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
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min) *</Label>
                <Select 
                  required
                  value={String(formData.duration)}
                  onValueChange={handleDurationChange}
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
              {/* Start Time */}
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
                
                {startTime && !isSlotAvailable(startTime) && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <AlertCircle className="size-4 inline mr-1 text-red-500" />
                    <span className="text-red-600 font-medium">
                      {isPastTime(startTime) ? 'This time is in the past' : 'This time slot is not available'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  required 
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setFormData(prev => ({ ...prev, endTime: e.target.value }));
                  }}
                  disabled={!startTime}
                  className={!isTimeRangeAvailable(startTime, endTime) ? 'border-red-300 bg-red-50' : ''}
                  step="300"
                />
                {endTime && !isTimeRangeAvailable(startTime, endTime) && (
                  <p className="text-xs text-red-600">
                    {isPastTime(startTime) ? 'Cannot book past times' : 'This time range conflicts with existing appointments'}
                  </p>
                )}
              </div>
            </div>

            {/* Status (only in manage mode) */}
            {mode === 'manage' && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Textarea 
                id="reason" 
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="E.g., Regular check-up, Follow-up, Symptoms..." 
                required 
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions or information..."
                rows={2}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={isSaving || !formData.doctorId || !formData.date || !formData.startTime || !formData.endTime || !isTimeRangeAvailable(formData.startTime, formData.endTime)}
              style={{
                backgroundColor: mode === 'new' ? '#ea580c' : '#2563eb',
                hoverColor: mode === 'new' ? '#c2410c' : '#1d4ed8'
              }}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'new' ? 'Scheduling...' : 'Updating...'}
                </>
              ) : (
                <>
                  {mode === 'new' ? (
                    <>
                      <Calendar className="size-5 mr-2" />
                      Schedule Appointment
                    </>
                  ) : (
                    <>
                      <Save className="size-5 mr-2" />
                      Update Appointment
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right Column: All Appointments */}
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>
                View and manage all appointments
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAllAppointments}
              className="h-9"
            >
              <RefreshCw className="size-3 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant={appointmentFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAppointmentFilter('today')}
              className="h-8 text-xs"
            >
              Today
            </Button>
            <Button
              type="button"
              variant={appointmentFilter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAppointmentFilter('upcoming')}
              className="h-8 text-xs"
            >
              Upcoming
            </Button>
            <Button
              type="button"
              variant={appointmentFilter === 'past' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAppointmentFilter('past')}
              className="h-8 text-xs"
            >
              Past
            </Button>
            <Button
              type="button"
              variant={appointmentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAppointmentFilter('all')}
              className="h-8 text-xs"
            >
              All
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

  {isLoadingAppointments ? (
    <div className="flex items-center justify-center h-full">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading appointments...</p>
      </div>
    </div>
  ) : (
    <div className="h-full flex flex-col">
      {/* Scrollable table area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="size-12 mx-auto mb-3 text-gray-300" />
                <p>No appointments found</p>
                <p className="text-sm mt-2">Try changing the filter or schedule a new appointment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAppointments.map((appointment) => {
                      const formatted = formatAppointmentDateTime(appointment.AppointmentDateTime);
                      const appointmentDate = new Date(appointment.AppointmentDateTime);
                      const now = new Date();
                      const isPast = appointmentDate < now;
                      
                      return (
                        <TableRow key={appointment.AppointmentID}>
                          <TableCell>
                            <div className="font-medium">
                              {formatted.date}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatted.time}
                              {appointment.EndTime && (
                                <> - {appointment.EndTime}</>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {appointment.PatientName}
                            {appointment.QueueNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                Queue: {appointment.QueueNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {appointment.DoctorName || 'No doctor assigned'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(appointment.Status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {appointment.Status === 'scheduled' && !isPast && (
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
                                      ...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="size-3 mr-1" />
                                      Check In
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {appointment.Status === 'scheduled' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    selectAppointment(appointment);
                                    setMode('manage');
                                  }}
                                  className="h-8"
                                >
                                  <Edit className="size-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                              
                              {appointment.Status === 'scheduled' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedCancelAppointment(appointment);
                                    setShowCancelDialog(true);
                                  }}
                                  className="h-8"
                                >
                                  <X className="size-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Fixed pagination section at the bottom (outside the scroll area) */}
      {filteredAppointments.length > itemsPerPage && (
        <div className="border-t bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of{" "}
              {filteredAppointments.length} appointments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="size-4" />
              </Button>
              
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 min-w-8 px-2 ${
                        currentPage === pageNum 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : ""
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-400 mx-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 min-w-8 px-2"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
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
                setSelectedCancelAppointment(null);
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Success!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {successMessage}
              </DialogDescription>
            </DialogHeader>
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700 w-full"
              onClick={() => setShowSuccessDialog(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}