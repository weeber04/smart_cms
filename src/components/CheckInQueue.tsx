// CheckInQueue.tsx
import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Phone, Mail, Calendar, Search, Users, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';

interface CheckInQueueProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
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
}

export function CheckInQueue({ receptionistId, doctors, refreshData }: CheckInQueueProps) {
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showSendReminder, setShowSendReminder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [walkinFormData, setWalkinFormData] = useState({
    doctorId: '',
    reason: ''
  });

  // Debug: Log state changes
  useEffect(() => {
    console.log('Selected Patient:', selectedPatient);
  }, [selectedPatient]);

  const handleSearchPatient = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', searchQuery);
      const response = await fetch(
        `http://localhost:3001/api/receptionist/search-patient?search=${encodeURIComponent(searchQuery.trim())}`
      );
      
      console.log('Search response status:', response.status);
      
      if (response.ok) {
        const patients = await response.json();
        console.log('Search results:', patients);
        setSearchResults(patients);
      } else {
        console.error('Search failed with status:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Auto-search when user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchPatient();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearchPatient]);

  const handleRegisterWalkIn = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    if (!walkinFormData.reason.trim()) {
      alert('Please enter reason for visit');
      return;
    }

    if (!receptionistId) {
      alert('Receptionist ID not found. Please log in again.');
      return;
    }

    try {
      console.log('Registering walk-in:', {
        patientId: selectedPatient.id,
        doctorId: walkinFormData.doctorId,
        reason: walkinFormData.reason,
        receptionistId
      });

      const response = await fetch('http://localhost:3001/api/receptionist/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: walkinFormData.doctorId || null,
          reason: walkinFormData.reason,
          receptionistId: receptionistId
        })
      });

      const result = await response.json();
      console.log('Registration response:', result);

      if (response.ok && result.success) {
        alert(`Walk-in registered successfully!\nQueue Number: ${result.queueNumber}`);
        resetWalkInForm();
        setShowWalkIn(false);
        refreshData();
      } else {
        alert(result.error || 'Failed to register walk-in');
      }
    } catch (error) {
      console.error("Walk-in registration error:", error);
      alert("Failed to register walk-in. Please check console for details.");
    }
  };

  const resetWalkInForm = () => {
    console.log('Resetting form');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setWalkinFormData({
      doctorId: '',
      reason: ''
    });
  };

  // Add error boundary wrapper
  const PatientSearchResults = () => {
    if (searchResults.length === 0 || isSearching || selectedPatient) {
      return null;
    }

    return (
      <div className="border rounded-lg max-h-60 overflow-y-auto">
        {searchResults.map((patient) => (
          <div
            key={patient.id}
            className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              console.log('Selecting patient:', patient);
              setSelectedPatient(patient);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{patient.Name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">IC: {patient.ICNo}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">Phone: {patient.PhoneNumber}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">Gender: {patient.Gender}</span>
                </div>
                {patient.Email && (
                  <p className="text-sm text-gray-600 mt-1">Email: {patient.Email}</p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Selecting patient via button:', patient);
                  setSelectedPatient(patient);
                }}
                className="ml-2"
              >
                Select
              </Button>
            </div>
          </div>
        ))}
      </div>
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
              onClick={() => setShowSendReminder(true)}
            >
              <Mail className="size-5" />
              <span className="text-sm">Send Reminder</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2" 
              onClick={() => alert('Cancel appointment functionality')}
            >
              <Calendar className="size-5" />
              <span className="text-sm">Cancel Apt</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Walk-in Patient Dialog */}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Walk-in Patient</DialogTitle>
            <DialogDescription>Search for existing patient or register new walk-in</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Patient Search Section */}
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

            {/* Search Results */}
            <PatientSearchResults />

            {/* Loading Indicator */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            )}

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
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
              <>
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
                  <Label htmlFor="walkin-doctor">Assign Doctor (Optional)</Label>
                  <Select
                    value={walkinFormData.doctorId}
                    onValueChange={(value) => setWalkinFormData({...walkinFormData, doctorId: value})}
                  >
                    <SelectTrigger id="walkin-doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific doctor (General Queue)</SelectItem>
                      {doctors.map((doctor: any) => (
                        <SelectItem key={doctor.UserID} value={String(doctor.UserID)}>
                          Dr. {doctor.Name} - {doctor.Specialization || 'General Medicine'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </>
            )}

            {/* No Results Message */}
            {searchQuery && searchResults.length === 0 && !isSearching && !selectedPatient && (
              <div className="text-center py-8 text-gray-500">
                <p>No patients found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">
                  Try searching with different terms or{' '}
                  <button 
                    className="text-orange-600 hover:text-orange-700 underline"
                    onClick={() => {
                      // You could add a link to the patient registration page here
                      alert('Redirect to patient registration');
                    }}
                  >
                    register a new patient
                  </button>
                </p>
              </div>
            )}
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
              <Button 
                className="flex-1 bg-orange-600 hover:bg-orange-700" 
                onClick={() => {
                  alert('Reminder sent successfully!');
                  setShowSendReminder(false);
                }}
              >
                Send Reminder
              </Button>
              <Button variant="outline" onClick={() => setShowSendReminder(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}