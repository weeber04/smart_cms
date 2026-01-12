// src/components/DoctorComponent/PatientManagementTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  FileText, 
  Calendar, 
  Pill, 
  ChevronRight,
  Filter,
  Download,
  Mail,
  Phone,
  Stethoscope,
  Shield,
  ArrowUpRight,
  MoreVertical,
  ChevronLeft,
  Edit,
  Users,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { HistoryDialog } from './HistoryDialog';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Patient {
  PatientID: number;
  Name: string;
  ICNo: string;
  Gender: 'M' | 'F';
  DOB: string;
  Age?: number;
  PhoneNumber: string;
  Email: string;
  BloodType: string;
  LastVisit?: string;
  NextAppointment?: string;
  ChronicDisease: 'Y' | 'N';
  Allergy: 'Y' | 'N';
  InsuranceProvider?: string;
  InsurancePolicyNo?: string;
}

interface Consultation {
  ConsultationID: number;
  VisitID: number;
  StartTime: string;
  ChiefComplaint: string;
  Diagnosis: string;
  DiagnosisCode?: string;
  SeverityAssessment: string;
  DoctorName: string;
  VisitType: string;
}

interface Prescription {
  PrescriptionID: number;
  PrescribedDate: string;
  Status: string;
  DoctorName: string;
  Remarks?: string;
  items?: Array<{
    DrugName: string;
    Dosage: string;
    Frequency: string;
    Duration: string;
    Quantity: number;
  }>;
}

export function PatientManagementTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState({
    gender: 'all',
    hasAllergy: 'all',
    hasChronic: 'all'
  });
  
  // Stats data
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalPrescriptions: 0,
    totalAppointments: 0
  });

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [showConsultationDetail, setShowConsultationDetail] = useState(false);
const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
const [showPrescriptionDetail, setShowPrescriptionDetail] = useState(false);
const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/doctor/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Add age to each patient
        const patientsWithAge = data.map((patient: Patient) => ({
          ...patient,
          Age: calculateAge(patient.DOB)
        }));
        setPatients(patientsWithAge);
        setFilteredPatients(patientsWithAge);
        setStats(prev => ({ ...prev, totalPatients: data.length }));
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch aggregated stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch consultations count
      const consultationsRes = await fetch('http://localhost:3001/api/doctor/consultations/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (consultationsRes.ok) {
        const consultationsData = await consultationsRes.json();
        setStats(prev => ({ ...prev, totalConsultations: consultationsData.total || 0 }));
      }
      
      // Fetch prescriptions count
      const prescriptionsRes = await fetch('http://localhost:3001/api/doctor/prescriptions/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        setStats(prev => ({ ...prev, totalPrescriptions: prescriptionsData.total || 0 }));
      }
      
      // Fetch appointments count
      const appointmentsRes = await fetch('http://localhost:3001/api/doctor/appointments/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setStats(prev => ({ ...prev, totalAppointments: appointmentsData.total || 0 }));
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show toast for stats errors as they're not critical
    }
  };

// Update the handlers for viewing consultation and prescription details
const handleViewConsultationDetail = (consultation: Consultation) => {
  setShowPatientDialog(false); // Close the parent dialog first
  setSelectedConsultation(consultation);
  setShowConsultationDetail(true);
};

const handleViewPrescriptionDetail = (prescription: Prescription) => {
  setShowPatientDialog(false); // Close the parent dialog first
  setSelectedPrescription(prescription);
  setShowPrescriptionDetail(true);
};

// Also update the handlers for the "Close" buttons in detail dialogs to go back
// Add a function to handle going back to the patient dialog
const handleBackToPatientDialog = () => {
  setShowConsultationDetail(false);
  setShowPrescriptionDetail(false);
  setShowPatientDialog(true); // Re-open the parent dialog
};

  // Fetch patient consultations
  const fetchPatientConsultations = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/consultations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientConsultations(data);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  // Fetch patient prescriptions
  const fetchPatientPrescriptions = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatientPrescriptions(data);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientConsultations(patient.PatientID);
    fetchPatientPrescriptions(patient.PatientID);
    setShowPatientDialog(true);
  };

  // Clear patient selection
  const handleClearSelection = () => {
    setSelectedPatient(null);
    setPatientConsultations([]);
    setPatientPrescriptions([]);
    setShowPatientDialog(false);
  };

  // Search and filter patients
  useEffect(() => {
    let result = patients;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(patient =>
        patient.Name.toLowerCase().includes(query) ||
        patient.ICNo.includes(query) ||
        patient.PhoneNumber.includes(query) ||
        patient.Email.toLowerCase().includes(query)
      );
    }

    // Apply gender filter
    if (filters.gender !== 'all') {
      result = result.filter(patient => patient.Gender === filters.gender);
    }

    // Apply allergy filter
    if (filters.hasAllergy !== 'all') {
      result = result.filter(patient => 
        filters.hasAllergy === 'yes' ? patient.Allergy === 'Y' : patient.Allergy === 'N'
      );
    }

    // Apply chronic disease filter
    if (filters.hasChronic !== 'all') {
      result = result.filter(patient => 
        filters.hasChronic === 'yes' ? patient.ChronicDisease === 'Y' : patient.ChronicDisease === 'N'
      );
    }

    setFilteredPatients(result);
  }, [searchQuery, patients, filters]);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      await fetchPatients();
      await fetchStats();
    };
    
    fetchData();
  }, []);

  // Render patient list - Compact and clean
  const renderPatientList = () => (
    <div className="space-y-2">
      {filteredPatients.map((patient) => (
        <div 
          key={patient.PatientID} 
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
          onClick={() => handleSelectPatient(patient)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-8 flex-shrink-0">
              <AvatarFallback className={`text-xs ${
                patient.Gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
              }`}>
                {patient.Name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 text-sm truncate">{patient.Name}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {patient.Gender === 'M' ? 'M' : 'F'}, {patient.Age}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 truncate">
                <span className="truncate">IC: {patient.ICNo}</span>
                <span className="text-gray-300">•</span>
                <span className="truncate">{patient.PhoneNumber}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-400 flex-shrink-0" />
        </div>
      ))}
    </div>
  );

  // Render patient grid - Compact and clean
  const renderPatientGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {filteredPatients.map((patient) => (
        <Card 
          key={patient.PatientID}
          className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
          onClick={() => handleSelectPatient(patient)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Avatar className="size-10">
                <AvatarFallback className={`text-sm ${
                  patient.Gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                }`}>
                  {patient.Name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => handleSelectPatient(patient)}>
                    <FileText className="size-3 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPatient(patient);
                    setShowHistoryDialog(true);
                  }}>
                    <Calendar className="size-3 mr-2" />
                    View History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2">
              <CardTitle className="text-sm font-semibold">{patient.Name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">
                  {patient.Gender === 'M' ? 'M' : 'F'}, {patient.Age}
                </Badge>
                <span className="text-xs text-gray-500 truncate">IC: {patient.ICNo}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium truncate max-w-[100px]">{patient.PhoneNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium truncate max-w-[100px]">{patient.Email || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Search and Filter Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
              <Input
                placeholder="Search patients by name, IC, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
              className="h-9"
            >
              List View
            </Button>
            <Button
              variant={activeView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('grid')}
              className="h-9"
            >
              Grid View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="size-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter Patients</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Gender</label>
                    <select
                      className="w-full p-2 text-sm border rounded"
                      value={filters.gender}
                      onChange={(e) => setFilters({...filters, gender: e.target.value})}
                    >
                      <option value="all">All Genders</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Allergies</label>
                    <select
                      className="w-full p-2 text-sm border rounded"
                      value={filters.hasAllergy}
                      onChange={(e) => setFilters({...filters, hasAllergy: e.target.value})}
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Allergies</option>
                      <option value="no">No Allergies</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Chronic Disease</label>
                    <select
                      className="w-full p-2 text-sm border rounded"
                      value={filters.hasChronic}
                      onChange={(e) => setFilters({...filters, hasChronic: e.target.value})}
                    >
                      <option value="all">All</option>
                      <option value="yes">Has Chronic Disease</option>
                      <option value="no">No Chronic Disease</option>
                    </select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalPatients}</p>
                  <p className="text-xs text-blue-600 mt-1">Under your care</p>
                </div>
                <Users className="size-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 font-medium mb-1">Consultations</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalConsultations}</p>
                  <p className="text-xs text-purple-600 mt-1">All-time sessions</p>
                </div>
                <FileText className="size-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-700 font-medium mb-1">Prescriptions</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.totalPrescriptions}</p>
                  <p className="text-xs text-indigo-600 mt-1">Medications issued</p>
                </div>
                <Pill className="size-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-700 font-medium mb-1">Upcoming Appointments</p>
                  <p className="text-2xl font-bold text-cyan-900">{stats.totalAppointments}</p>
                  <p className="text-xs text-cyan-600 mt-1">Scheduled visits</p>
                </div>
                <Calendar className="size-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Full Width Patient List */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Patients ({filteredPatients.length})</CardTitle>
              <CardDescription className="text-sm">
                {loading ? 'Loading patients...' : `Found ${filteredPatients.length} patients matching your criteria`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-600">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <User className="size-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-700">No Patients Found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ gender: 'all', hasAllergy: 'all', hasChronic: 'all' });
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              {activeView === 'list' ? (
                renderPatientList()
              ) : (
                renderPatientGrid()
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>


{showPatientDialog && selectedPatient && (
  <div className="fixed inset-0 z-50"> {/* Keep this as z-50 */}
    <div 
      className="absolute inset-0 bg-black/50" 
      onClick={() => setShowPatientDialog(false)}
    />
    
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative z-50 w-full max-w-[1400px] h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* Dialog Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-50 to-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className={`text-lg ${
                  selectedPatient.Gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                }`}>
                  {selectedPatient.Name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPatient.Name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-sm">
                    {selectedPatient.Gender === 'M' ? 'Male' : 'Female'}, {selectedPatient.Age} years
                  </Badge>
                  <span className="text-sm text-gray-600">IC: {selectedPatient.ICNo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="h-9"
              >
                <FileText className="size-4 mr-2" />
                Full History
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPatientDialog(false)}
                className="h-9 w-9"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="shrink-0 px-6 pt-4 pb-2 bg-white border-b">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1">
              <TabsTrigger 
                value="overview" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                <User className="size-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="consultations" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                <Stethoscope className="size-4 mr-2" />
                Consultations
                {patientConsultations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {patientConsultations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="prescriptions" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                <Pill className="size-4 mr-2" />
                Prescriptions
                {patientPrescriptions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {patientPrescriptions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="overview" className="space-y-6 mt-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Date of Birth</label>
                            <p className="text-sm font-medium">
                              {format(new Date(selectedPatient.DOB), 'MMMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Blood Type</label>
                            <Badge variant="default" className="text-sm">
                              {selectedPatient.BloodType || 'Not Recorded'}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Chronic Disease</label>
                            <p className={`text-sm font-medium ${selectedPatient.ChronicDisease === 'Y' ? 'text-red-600' : 'text-green-600'}`}>
                              {selectedPatient.ChronicDisease === 'Y' ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Allergies</label>
                            <p className={`text-sm font-medium ${selectedPatient.Allergy === 'Y' ? 'text-amber-600' : 'text-green-600'}`}>
                              {selectedPatient.Allergy === 'Y' ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                          <p className="text-sm font-medium">{selectedPatient.PhoneNumber}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                          <p className="text-sm font-medium truncate">{selectedPatient.Email || 'Not Provided'}</p>
                        </div>
                        {selectedPatient.InsuranceProvider && (
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Insurance</label>
                            <div className="flex items-center gap-2">
                              <Shield className="size-4 text-gray-400" />
                              <span className="text-sm font-medium">{selectedPatient.InsuranceProvider}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Medical Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Medical Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-700 mb-1">{patientConsultations.length}</div>
                        <div className="text-xs font-medium text-blue-600">Total Consultations</div>
                        {patientConsultations.length > 0 && (
                          <div className="text-xs text-blue-500 mt-1">
                            Last: {format(new Date(patientConsultations[0].StartTime), 'MMM dd')}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-700 mb-1">{patientPrescriptions.length}</div>
                        <div className="text-xs font-medium text-purple-600">Total Prescriptions</div>
                        {patientPrescriptions.length > 0 && (
                          <div className="text-xs text-purple-500 mt-1">
                            Last: {format(new Date(patientPrescriptions[0].PrescribedDate), 'MMM dd')}
                          </div>
                        )}
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-xl font-bold text-amber-700 mb-1">
                          {selectedPatient.LastVisit ? format(new Date(selectedPatient.LastVisit), 'MMM dd') : 'Never'}
                        </div>
                        <div className="text-xs font-medium text-amber-600">Last Visit</div>
                        {selectedPatient.NextAppointment && (
                          <div className="text-xs text-amber-500 mt-1">
                            Next: {format(new Date(selectedPatient.NextAppointment), 'MMM dd')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="consultations" className="space-y-4 mt-4">
                {patientConsultations.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="size-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No Consultations Found</h3>
                    <p className="text-gray-500 text-sm">This patient has no recorded consultations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientConsultations.map((consultation) => (
                      <Card key={consultation.ConsultationID}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    {consultation.ChiefComplaint || 'No chief complaint recorded'}
                                  </h4>
                                  <Badge variant={
                                    consultation.SeverityAssessment === 'severe' ? 'destructive' :
                                    consultation.SeverityAssessment === 'moderate' ? 'outline' : 'secondary'
                                  } className="text-xs">
                                    {consultation.SeverityAssessment || 'moderate'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Diagnosis:</span> {consultation.Diagnosis || 'No diagnosis recorded'}
                                </p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {format(new Date(consultation.StartTime), 'MMM dd, yyyy')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="size-3" />
                                    Dr. {consultation.DoctorName}
                                  </span>
                                  {consultation.VisitType && (
                                    <Badge variant="outline" className="text-xs">
                                      {consultation.VisitType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
<Button 
  variant="ghost" 
  size="sm" 
  className="h-8 w-8 p-0"
  onClick={() => handleViewConsultationDetail(consultation)}
>
  <ArrowUpRight className="size-4" />
</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4 mt-4">
                {patientPrescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Pill className="size-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No Prescriptions Found</h3>
                    <p className="text-gray-500 text-sm">This patient has no recorded prescriptions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientPrescriptions.map((prescription) => (
                      <Card key={prescription.PrescriptionID}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    Prescription #{prescription.PrescriptionID}
                                  </h4>
                                  <Badge variant={
                                    prescription.Status === 'active' ? 'default' :
                                    prescription.Status === 'completed' ? 'secondary' : 'outline'
                                  } className="text-xs">
                                    {prescription.Status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Prescribed by:</span> Dr. {prescription.DoctorName}
                                </p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {format(new Date(prescription.PrescribedDate), 'MMM dd, yyyy')}
                                  </span>
                                  {prescription.Remarks && (
                                    <span className="flex items-center gap-1">
                                      <FileText className="size-3" />
                                      {prescription.Remarks.length > 50 ? prescription.Remarks.substring(0, 50) + '...' : prescription.Remarks}
                                    </span>
                                  )}
                                </div>
                                
                                {prescription.items && prescription.items.length > 0 && (
                                  <div className="mt-3 border-t pt-3">
                                    <h5 className="text-xs font-medium text-gray-700 mb-2">Medications ({prescription.items.length})</h5>
                                    <div className="space-y-2">
                                      {prescription.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                                          <div>
                                            <span className="font-medium">{item.DrugName}</span>
                                            <div className="text-gray-500 mt-0.5">
                                              {item.Dosage} • {item.Frequency} • {item.Duration}
                                            </div>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            Qty: {item.Quantity}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
<Button 
  variant="ghost" 
  size="sm" 
  className="h-8 w-8 p-0"
  onClick={() => handleViewPrescriptionDetail(prescription)}
>
  <ArrowUpRight className="size-4" />
</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  </div>
)}

      {/* History Dialog */}
      {selectedPatient && (
        <HistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          patientId={selectedPatient.PatientID}
          patientData={selectedPatient}
        />
      )}

      {/* Consultation Detail Dialog */}
{showConsultationDetail && selectedConsultation && (
  <div className="fixed inset-0 z-[100]"> {/* Increased from z-[60] to z-[100] */}
    <div 
      className="absolute inset-0 bg-black/50" 
      onClick={() => setShowConsultationDetail(false)}
    />
    
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative z-[110] w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-50 to-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Consultation Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(selectedConsultation.StartTime), 'MMMM dd, yyyy')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConsultationDetail(false)}
              className="h-9 w-9"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Chief Complaint */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Chief Complaint</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900">
                  {selectedConsultation.ChiefComplaint || 'No chief complaint recorded'}
                </p>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Diagnosis</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-900">
                  {selectedConsultation.Diagnosis || 'No diagnosis recorded'}
                </p>
                {selectedConsultation.DiagnosisCode && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Code: {selectedConsultation.DiagnosisCode}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Visit Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date & Time</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedConsultation.StartTime), 'PPpp')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Visit Type</label>
                    <Badge variant="outline" className="text-sm">
                      {selectedConsultation.VisitType || 'Regular'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Severity</label>
                    <Badge variant={
                      selectedConsultation.SeverityAssessment === 'severe' ? 'destructive' :
                      selectedConsultation.SeverityAssessment === 'moderate' ? 'outline' : 'secondary'
                    } className="text-sm capitalize">
                      {selectedConsultation.SeverityAssessment || 'moderate'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Doctor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Doctor</label>
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-gray-400" />
                      <p className="text-sm font-medium">Dr. {selectedConsultation.DoctorName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Visit ID</label>
                    <p className="text-sm font-medium">#{selectedConsultation.VisitID}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Consultation ID</label>
                    <p className="text-sm font-medium">#{selectedConsultation.ConsultationID}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Notes (if any) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  For more detailed clinical notes and examination findings, please refer to the patient's complete medical record.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConsultationDetail(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Prescription Detail Dialog */}
{showPrescriptionDetail && selectedPrescription && (
  <div className="fixed inset-0 z-[100]"> {/* Increased from z-[60] to z-[100] */}
    <div 
      className="absolute inset-0 bg-black/50" 
      onClick={() => setShowPrescriptionDetail(false)}
    />
    
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="relative z-[110] w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-50 to-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Prescription Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Prescription #{selectedPrescription.PrescriptionID}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPrescriptionDetail(false)}
              className="h-9 w-9"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Prescription Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prescription Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prescribed Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-gray-400" />
                      <p className="text-sm font-medium">
                        {format(new Date(selectedPrescription.PrescribedDate), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Status</label>
                    <Badge variant={
                      selectedPrescription.Status === 'active' ? 'default' :
                      selectedPrescription.Status === 'completed' ? 'secondary' : 'outline'
                    } className="text-sm capitalize">
                      {selectedPrescription.Status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prescribed By</label>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="size-4 text-gray-400" />
                    <p className="text-sm font-medium">Dr. {selectedPrescription.DoctorName}</p>
                  </div>
                </div>

                {selectedPrescription.Remarks && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Doctor's Remarks</label>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedPrescription.Remarks}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            {selectedPrescription.items && selectedPrescription.items.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Medications ({selectedPrescription.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPrescription.items.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.DrugName}</h4>
                            <p className="text-xs text-gray-500 mt-1">Item #{index + 1}</p>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            Qty: {item.Quantity}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Dosage</label>
                            <p className="font-medium">{item.Dosage}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                            <p className="font-medium">{item.Frequency}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Duration</label>
                            <p className="font-medium">{item.Duration}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Instructions</h5>
                          <p className="text-sm text-gray-600">
                            Take {item.Dosage} of {item.DrugName} {item.Frequency} for {item.Duration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescription Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prescription Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Prescription ID: #{selectedPrescription.PrescriptionID}</p>
                  <p>• Total Medications: {selectedPrescription.items?.length || 0}</p>
                  <p>• Status: {selectedPrescription.Status}</p>
                  <p>• Prescribing Doctor: Dr. {selectedPrescription.DoctorName}</p>
                  {selectedPrescription.Remarks && (
                    <p>• Remarks: {selectedPrescription.Remarks}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

{/* Consultation Detail Dialog - Update the footer */}
<div className="shrink-0 border-t px-6 py-4 flex justify-end gap-3">
  <Button
    variant="outline"
    size="sm"
    onClick={handleBackToPatientDialog}
  >
    <ChevronLeft className="size-4 mr-2" />
    Back to Patient
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowConsultationDetail(false)}
  >
    Close
  </Button>
</div>

{/* Prescription Detail Dialog - Update the footer */}
<div className="shrink-0 border-t px-6 py-4 flex justify-end gap-3">
  <Button
    variant="outline"
    size="sm"
    onClick={handleBackToPatientDialog}
  >
    <ChevronLeft className="size-4 mr-2" />
    Back to Patient
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowPrescriptionDetail(false)}
  >
    Close
  </Button>
</div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}