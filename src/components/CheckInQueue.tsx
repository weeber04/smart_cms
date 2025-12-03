// CheckInQueue.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Phone, Mail, Calendar, Search, Users, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
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
  canRegister: boolean;
  queueInfo?: {
    queueNumber: string;
    queueStatus: string;
    visitStatus: string;
    arrivalTime: string;
  };
  queueStatusCategory?: string;
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
    reason: ''
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  const resetWalkInForm = () => {
    console.log('Resetting form');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setCurrentPage(1);
    setWalkinFormData({
      doctorId: '',
      reason: ''
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
        setDialogTitle("Walk-in Registered");
        setDialogMessage(`Queue Number: ${result.queueNumber}`);
        setDialogOpen(true);

        resetWalkInForm();
        setShowWalkIn(false);
        refreshData();
      } else {
        setDialogTitle("Registration Failed");
        setDialogMessage(result.error || "Failed to register walk-in");
        setDialogOpen(true);
      }
    }
      catch (error) {
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Register Walk-in Patient</DialogTitle>
            <DialogDescription>Search for existing patient or register new walk-in</DialogDescription>
          </DialogHeader>
          
          {/* Fixed search section - WON'T SCROLL */}
          <div className="space-y-2 flex-shrink-0">
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

          {/* SCROLLABLE CONTENT AREA */}
          <div className="flex-1 overflow-y-auto mt-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
            <PatientSearchResults />

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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-700 mt-2">{dialogMessage}</p>

          <DialogFooter className="mt-4">
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}