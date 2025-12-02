// AppointmentSchedule.tsx
import { useState } from 'react';
import { Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface AppointmentScheduleProps {
  receptionistId: number | null;
  doctors: any[];
  todayAppointments: any[];
  refreshData: () => void;
}

export function AppointmentSchedule({ receptionistId, doctors, todayAppointments, refreshData }: AppointmentScheduleProps) {
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

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

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Schedule Form */}
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

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</CardDescription>
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

      {/* Success Modal */}
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