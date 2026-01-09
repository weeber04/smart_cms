// HistoryDialog.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'; // Removed unused TabsContent
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  Calendar, 
  Stethoscope, 
  Pill, 
  User, 
  Clock, 
  FileText,
  ChevronRight,
  Thermometer,
  Heart,
  Activity,
  UserCheck,
  AlertCircle,
  Info,
  FileCheck,
  Clipboard,
  ClipboardCheck,
  Syringe,
  AlertTriangle,
  Shield,
  Hash,
  Phone,
  Mail,
  MapPin,
  Droplets,
  Scale,
  CalendarDays,
  X,
  Clock3,
  Package,
  Pill as PillIcon,
  Eye,
  Brain,
  ShieldAlert,
  Dumbbell,
  BookOpen,
  Lightbulb,
  Droplet,
  Wind,
  Weight,
  Ruler
} from 'lucide-react';
import { toast } from 'sonner';

// Type definitions - UPDATED
interface Visit {
  VisitID: number;
  AppointmentID?: number;
  PatientID: number;
  DoctorID?: number;
  VisitType: 'first-time' | 'follow-up' | 'walk-in' | string;
  ArrivalTime: string;
  CheckInTime?: string;
  CheckOutTime?: string;
  VisitStatus: string;
  VisitNotes?: string;
  QueueNumber?: string;
  TriagePriority?: string;
  DoctorName?: string;
  ConsultationID?: number;
  Purpose?: string;
}

interface VitalSigns {
  Temperature?: number;
  BloodPressureSystolic?: number;
  BloodPressureDiastolic?: number;
  HeartRate?: number;
  RespiratoryRate?: number;
  OxygenSaturation?: number;
  Height?: number;
  Weight?: number;
  BMI?: number;
  PainLevel?: number;
  TakenAt?: string;
}

interface Consultation {
  ConsultationID: number;
  StartTime?: string;
  EndTime?: string;
  ChiefComplaint?: string;
  HistoryOfPresentIllness?: string;
  PhysicalExamFindings?: string;
  Diagnosis?: string;
  DiagnosisCode?: string;
  TreatmentPlan?: string;
  ConsultationNotes?: string;
  SeverityAssessment?: string;
  FollowUpDate?: string;
  FollowUpInstructions?: string;
  MedicationPlan?: string;
  NonMedicationPlan?: string;
  PatientEducation?: string;
  LifestyleAdvice?: string;
  WarningSigns?: string;
  Disposition?: string;
  ReferralNotes?: string;
  PastMedicalHistory?: string;
  FamilyHistory?: string;
  DifferentialDiagnosis?: string;
  CreatedAt?: string;
  DoctorName?: string;
  VisitID?: number;
  VisitType?: string;
  // Vital signs
  Temperature?: number;
  BloodPressureSystolic?: number;
  BloodPressureDiastolic?: number;
  HeartRate?: number;
  RespiratoryRate?: number;
  OxygenSaturation?: number;
  Height?: number;
  Weight?: number;
  BMI?: number;
  PainLevel?: number;
  VitalSignsTakenAt?: string;
  // Additional consultation fields
  NeedsFollowUp?: number;
  FollowUpTime?: string;
  FollowUpPurpose?: string;
  ReferralNeeded?: number;
  // Multiple vital signs
  allVitalSigns?: VitalSigns[];
}

interface PrescriptionItem {
  ItemID: number;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Quantity: number;
  Status: string;
  DrugName: string;
  Category: string;
}

interface Prescription {
  PrescriptionID: number;
  PrescribedDate: string;
  Remarks?: string;
  Status?: string;
  DoctorName?: string;
  ConsultationID?: number;
  Diagnosis?: string;
  items?: PrescriptionItem[];
}

interface Allergy {
  AllergyFindingID: number;
  AllergyName: string;
  Reaction?: string;
  Severity?: string;
  OnsetDate?: string;
  Status?: string;
  Notes?: string;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number | null;
  patientData: any;
}

export function HistoryDialog({ open, onOpenChange, patientId, patientData }: HistoryDialogProps) {
  const [activeTab, setActiveTab] = useState('patient');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);

  useEffect(() => {
    if (open && patientId) {
      fetchPatientHistory();
    }
  }, [open, patientId]);

const extractConsultationsData = (data: any): Consultation[] => {
  console.log('extractConsultationsData input:', data);
  
  // If data is already an array
  if (Array.isArray(data)) {
    console.log('Direct array found:', data.length, 'items');
    
    // Check if this is an array with a single object containing numeric keys
    if (data.length === 1 && data[0] && typeof data[0] === 'object') {
      const firstItem = data[0];
      
      // Check if this object has numeric keys (like 0, 1, 2, 3)
      const numericKeys = Object.keys(firstItem).filter(key => 
        !isNaN(parseInt(key)) && firstItem[key] && typeof firstItem[key] === 'object'
      );
      
      if (numericKeys.length > 0) {
        console.log('Found object with numeric keys, extracting values...');
        // Extract all the numeric key values into an array
        const extractedArray = numericKeys.map(key => firstItem[key]);
        console.log('Extracted consultations:', extractedArray.length);
        return extractedArray;
      }
      
      // Check if there's an array property in this object
      const arrayProps = Object.keys(firstItem).filter(key => Array.isArray(firstItem[key]));
      if (arrayProps.length > 0) {
        console.log(`Found array in property "${arrayProps[0]}"`);
        return firstItem[arrayProps[0]];
      }
    }
    
    // Otherwise return the array as-is
    return data;
  }
  
  // If data is an object, look for consultations array
  if (data && typeof data === 'object') {
    // Try common keys that might contain the array
    const possibleKeys = ['consultations', 'data', 'results', 'items', 'Consultations'];
    
    for (const key of possibleKeys) {
      if (Array.isArray(data[key])) {
        console.log(`Found array in key "${key}":`, data[key].length, 'items');
        return data[key];
      }
    }
    
    // Check for numeric keys
    const numericKeys = Object.keys(data).filter(key => 
      !isNaN(parseInt(key)) && data[key] && typeof data[key] === 'object'
    );
    
    if (numericKeys.length > 0) {
      console.log('Found object with numeric keys, extracting values...');
      const extractedArray = numericKeys.map(key => data[key]);
      console.log('Extracted consultations:', extractedArray.length);
      return extractedArray;
    }
    
    // If no array found in common keys, check all object values
    const arrayValues = Object.values(data).filter(value => Array.isArray(value));
    if (arrayValues.length > 0) {
      console.log('Found array in object values:', arrayValues[0].length, 'items');
      return arrayValues[0] as Consultation[];
    }
  }
  
  console.log('No valid consultations data found, returning empty array');
  return [];
};

const fetchPatientHistory = async () => {
  if (!patientId) return;

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    
    console.log('Fetching history for patient ID:', patientId);
    
    // Fetch all data in parallel
    const [visitsRes, consultationsRes, prescriptionsRes, allergiesRes] = await Promise.all([
      fetch(`http://localhost:3001/api/doctor/patient/${patientId}/visitsD`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`http://localhost:3001/api/doctor/patient/${patientId}/consultationsD`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`http://localhost:3001/api/doctor/patient/${patientId}/prescriptionsD`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`http://localhost:3001/api/doctor/patient/${patientId}/allergiesD`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    console.log('All responses received');

    // Process visits
    if (visitsRes.ok) {
      const visitsData = await visitsRes.json();
      console.log('Visits raw data:', visitsData);
      console.log('Visits data type:', typeof visitsData);
      const processedVisits = extractArrayData(visitsData);
      console.log('Processed visits count:', processedVisits.length);
      setVisits(processedVisits.sort((a, b) => 
        new Date(b.ArrivalTime || 0).getTime() - new Date(a.ArrivalTime || 0).getTime()
      ));
    } else {
      console.log('Visits response not OK:', await visitsRes.text());
    }

    // Process consultations - WITH DEBUGGING
    if (consultationsRes.ok) {
      console.log('Consultations response OK');
      const consultationsData = await consultationsRes.json();
      console.log('Consultations raw data:', consultationsData);
      console.log('Consultations data type:', typeof consultationsData);
      console.log('Is array?', Array.isArray(consultationsData));
      
      if (Array.isArray(consultationsData)) {
        console.log('Consultations array length:', consultationsData.length);
        console.log('First consultation item:', consultationsData[0]);
      }
      
      // Use the specialized extraction function
      const processedConsultations = extractConsultationsData(consultationsData);
      console.log('Processed consultations:', processedConsultations);
      console.log('Processed consultations count:', processedConsultations.length);
      
      if (processedConsultations.length > 0) {
        console.log('First processed consultation:', processedConsultations[0]);
      }
      
      setConsultations(processedConsultations.sort((a, b) => {
        const dateA = a.StartTime || a.CreatedAt || '';
        const dateB = b.StartTime || b.CreatedAt || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }));
    } else {
      console.log('Consultations response not OK:', await consultationsRes.text());
      console.log('Consultations status:', consultationsRes.status);
    }

    // In fetchPatientHistory function, update the prescriptions section:
// Process prescriptions with specialized extraction
if (prescriptionsRes.ok) {
  console.log('Prescriptions response OK');
  const prescriptionsData = await prescriptionsRes.json();
  console.log('Prescriptions raw data:', prescriptionsData);
  console.log('Prescriptions data type:', typeof prescriptionsData);
  console.log('Is array?', Array.isArray(prescriptionsData));
  
  // Add detailed logging
  if (Array.isArray(prescriptionsData)) {
    console.log('Prescriptions array length:', prescriptionsData.length);
    if (prescriptionsData.length > 0) {
      console.log('First prescription item:', prescriptionsData[0]);
      console.log('Keys of first item:', Object.keys(prescriptionsData[0]));
      
      // Check if items exist
      if (prescriptionsData[0].items) {
        console.log('Items property found, type:', typeof prescriptionsData[0].items);
        console.log('First item in items array:', prescriptionsData[0].items[0]);
      }
    }
  }
  
  const processedPrescriptions = extractPrescriptionsData(prescriptionsData);
  console.log('Processed prescriptions count:', processedPrescriptions.length);
  
  // Log the processed structure
  if (processedPrescriptions.length > 0) {
    console.log('First processed prescription structure:', processedPrescriptions[0]);
    console.log('Has items property?', 'items' in processedPrescriptions[0]);
    console.log('Items value:', processedPrescriptions[0].items);
  }
  
  setPrescriptions(processedPrescriptions.sort((a, b) => 
    new Date(b.PrescribedDate || 0).getTime() - new Date(a.PrescribedDate || 0).getTime()
  ));
} else {
  console.log('Prescriptions response not OK:', await prescriptionsRes.text());
  console.log('Prescriptions status:', prescriptionsRes.status);
}

  } catch (error) {
    console.error('Error fetching patient history:', error);
    toast.error('Failed to load patient history');
  } finally {
    setLoading(false);
  }
};

const getPrescriptionData = (prescription: Prescription) => {
  const data = prescription as any; // Cast to any for flexible access
  return {
    id: prescription.PrescriptionID || data.id,
    date: prescription.PrescribedDate || data.Date || data.createdAt,
    doctorName: prescription.DoctorName || data.doctorName,
    status: prescription.Status || data.status,
    items: prescription.items || data.Items || data.medications || []
  };
};

const extractPrescriptionsData = (data: any): any[] => {
  console.log('=== EXTRACTING PRESCRIPTIONS DATA ===');
  console.log('Input data:', data);
  console.log('Type:', typeof data);
  console.log('Is array?', Array.isArray(data));
  
  if (Array.isArray(data)) {
    console.log('Array length:', data.length);
    
    if (data.length > 0) {
      console.log('First element:', data[0]);
      console.log('Type of first element:', typeof data[0]);
      console.log('Is first element array?', Array.isArray(data[0]));
      console.log('Keys in first element:', Object.keys(data[0]));
      
      // Check if it's the structure we expect
      if (data[0].PrescriptionID) {
        console.log('Looks like a prescription object');
        console.log('Has items?', 'items' in data[0]);
        if (data[0].items) {
          console.log('Items in first prescription:', data[0].items);
          console.log('Items type:', typeof data[0].items);
          console.log('Items is array?', Array.isArray(data[0].items));
        }
      }
    }
  }
  
  try {
    // If data is already an array
    if (Array.isArray(data)) {
      console.log('Data is array, length:', data.length);
      
      // If it's an array of prescriptions (should have PrescriptionID)
      if (data.length > 0 && data[0] && typeof data[0] === 'object') {
        // Check if it's already in the correct format
        if (data[0].PrescriptionID) {
          console.log('Direct prescriptions array found:', data.length, 'items');
          return data;
        }
        
        // Check if it's an array of arrays
        if (Array.isArray(data[0])) {
          console.log('Array of arrays found, returning first array');
          return data[0];
        }
        
        // Check for nested structure with items
        console.log('Examining array structure...');
        
        // Try to extract prescriptions from complex structure
        const extracted: any[] = [];
        
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          
          if (item && typeof item === 'object') {
            // If this looks like a prescription object
            if (item.PrescriptionID || item.id) {
              extracted.push(item);
            } 
            // Check if it's an object containing prescriptions (like {0: {...}, 1: {...}})
            else {
              const objectKeys = Object.keys(item);
              const prescriptionKeys = objectKeys.filter(key => 
                item[key] && 
                typeof item[key] === 'object' && 
                (item[key].PrescriptionID || item[key].id)
              );
              
              if (prescriptionKeys.length > 0) {
                prescriptionKeys.forEach(key => {
                  extracted.push(item[key]);
                });
              }
            }
          }
        }
        
        if (extracted.length > 0) {
          console.log('Extracted prescriptions from complex structure:', extracted.length);
          return extracted;
        }
        
        // Last resort: return the array as-is
        console.log('Returning array as-is');
        return data;
      }
      
      // Return empty array if no data
      return [];
    }
    
    // If data is an object
    if (data && typeof data === 'object') {
      console.log('Data is object, checking for prescription arrays...');
      
      // Try common keys that might contain the array
      const possibleKeys = ['prescriptions', 'data', 'results', 'items', 'Prescriptions'];
      
      for (const key of possibleKeys) {
        if (Array.isArray(data[key])) {
          console.log(`Found array in key "${key}":`, data[key].length, 'items');
          return data[key];
        }
      }
      
      // Check for numeric keys pattern (like {0: {...}, 1: {...}})
      const numericKeys = Object.keys(data).filter(key => 
        !isNaN(parseInt(key)) && data[key] && typeof data[key] === 'object'
      );
      
      if (numericKeys.length > 0) {
        console.log('Found numeric keys, extracting values...');
        const extractedArray = numericKeys.map(key => data[key]);
        console.log('Extracted prescriptions:', extractedArray.length);
        return extractedArray;
      }
      
      // If no array found, try to extract from values
      const allValues = Object.values(data);
      const arrayValues = allValues.filter(value => Array.isArray(value));
      
      if (arrayValues.length > 0) {
        console.log('Found array in object values:', arrayValues[0].length, 'items');
        return arrayValues[0];
      }
    }
    
    console.log('No valid prescriptions data found, returning empty array');
    return [];
    
  } catch (error) {
    console.error('Error extracting prescriptions data:', error);
    return [];
  }
};

const extractArrayData = (data: any): any[] => {
  console.log('extractArrayData input:', data);
  
  // If data is already an array
  if (Array.isArray(data)) {
    // Check if it's an array of arrays (nested)
    if (data.length > 0 && Array.isArray(data[0])) {
      console.log('Array of arrays found, returning first array:', data[0]);
      return data[0];
    }
    
    // Check for single object with numeric keys pattern
    if (data.length === 1 && data[0] && typeof data[0] === 'object') {
      const firstItem = data[0];
      const numericKeys = Object.keys(firstItem).filter(key => 
        !isNaN(parseInt(key)) && firstItem[key] && typeof firstItem[key] === 'object'
      );
      
      if (numericKeys.length > 0) {
        console.log('Found numeric keys in single object, extracting array');
        return numericKeys.map(key => firstItem[key]);
      }
    }
    
    console.log('Regular array found:', data);
    return data;
  } 
  // If data is an object
  else if (data && typeof data === 'object') {
    // Try to find any array property
    const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
    
    if (arrayKeys.length > 0) {
      console.log(`Object with array property found. Keys: ${arrayKeys}, returning:`, data[arrayKeys[0]]);
      return data[arrayKeys[0]];
    }
    
    // Check for numeric keys
    const numericKeys = Object.keys(data).filter(key => 
      !isNaN(parseInt(key)) && data[key] && typeof data[key] === 'object'
    );
    
    if (numericKeys.length > 0) {
      console.log('Object with numeric keys found, extracting values');
      return numericKeys.map(key => data[key]);
    }
    
    // If no array property, return object values as array
    const values = Object.values(data);
    console.log('Object without array property, returning values:', values);
    return values;
  }
  
  console.log('Not array or object, returning empty array');
  return [];
};

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') {
      return 'Not recorded';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date error';
    }
  };

  const formatSimpleDate = (dateString: string | undefined) => {
    if (!dateString || dateString === '0000-00-00') {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getAge = (dob: string) => {
    if (!dob || dob === '0000-00-00') return 'N/A';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const patientAge = patientData?.DOB ? getAge(patientData.DOB) : 'N/A';

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('completed') || statusLower === 'completed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <UserCheck className="size-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (statusLower.includes('pending') || statusLower === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock3 className="size-3 mr-1" />
          Pending
        </Badge>
      );
    }
    
    if (statusLower.includes('active') || statusLower === 'active') {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          <Activity className="size-3 mr-1" />
          Active
        </Badge>
      );
    }
    
    if (statusLower.includes('cancelled')) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="size-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityLower = severity?.toLowerCase() || '';
    
    if (severityLower === 'severe' || severityLower === 'life-threatening') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertCircle className="size-3 mr-1" />
          {severity}
        </Badge>
      );
    }
    
    if (severityLower === 'moderate') {
      return (
        <Badge variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <AlertCircle className="size-3 mr-1" />
          Moderate
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Info className="size-3 mr-1" />
        {severity || 'Mild'}
      </Badge>
    );
  };

  const parsePhysicalExamFindings = (findings: string) => {
    if (!findings) return null;
    
    try {
      if (findings.includes('{') || findings.includes('[')) {
        return JSON.parse(findings);
      }
      return findings;
    } catch (error) {
      return findings;
    }
  };

  const renderPatientInfo = () => (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="size-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-base font-semibold text-gray-900">{patientData?.Name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">IC Number</p>
              <p className="text-base font-semibold text-gray-900">{patientData?.ICNo || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Age</p>
              <p className="text-base font-semibold text-gray-900">{patientAge} years</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-base font-semibold text-gray-900">
                {patientData?.Gender === 'M' ? 'Male' : patientData?.Gender === 'F' ? 'Female' : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-base font-semibold text-gray-900">
                {formatSimpleDate(patientData?.DOB)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Blood Type</p>
              <p className="text-base font-semibold text-gray-900">{patientData?.BloodType || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Phone className="size-5 text-blue-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-base font-semibold text-gray-900">{patientData?.PhoneNumber || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-base font-semibold text-gray-900">{patientData?.Email || 'N/A'}</p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-base text-gray-900">
                {patientData?.Address || 'No address recorded'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="size-5 text-blue-600" />
            Medical Summary
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Allergies Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-500" />
                  Allergies
                </h4>
                <Badge variant="outline">{allergies.length}</Badge>
              </div>
              {allergies.length > 0 ? (
                <div className="space-y-2">
                  {allergies.slice(0, 3).map((allergy, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium text-gray-900">{allergy.AllergyName}</span>
                      {allergy.Severity && getSeverityBadge(allergy.Severity)}
                    </div>
                  ))}
                  {allergies.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{allergies.length - 3} more allergies
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No allergies recorded</p>
              )}
            </div>

            {/* Recent Visits Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="size-4 text-blue-500" />
                  Recent Visits
                </h4>
                <Badge variant="outline">{visits.length}</Badge>
              </div>
              {visits.length > 0 ? (
                <div className="space-y-2">
                  {visits.slice(0, 3).map((visit) => (
                    <div key={visit.VisitID} className="p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {formatSimpleDate(visit.ArrivalTime)}
                        </span>
                        {getStatusBadge(visit.VisitStatus)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{visit.DoctorName || 'No doctor assigned'}</p>
                    </div>
                  ))}
                  {visits.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{visits.length - 3} more visits
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No visits recorded</p>
              )}
            </div>

            {/* Active Prescriptions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Pill className="size-4 text-purple-500" />
                  Prescriptions
                </h4>
                <Badge variant="outline">
                  {prescriptions.length}
                </Badge>
              </div>
              {prescriptions.length > 0 ? (
                <div className="space-y-2">
                  {prescriptions.slice(0, 3).map((prescription) => (
                    <div key={prescription.PrescriptionID} className="p-2 bg-purple-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {formatSimpleDate(prescription.PrescribedDate)}
                        </span>
                        {getStatusBadge(prescription.Status || 'active')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {prescription.DoctorName || 'No doctor specified'}
                      </p>
                    </div>
                  ))}
                  {prescriptions.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{prescriptions.length - 3} more prescriptions
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No prescriptions recorded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVisits = () => (
    <div className="space-y-4">
      {visits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Visits Found</h3>
            <p className="text-gray-500 mt-2">This patient has no recorded visits.</p>
          </CardContent>
        </Card>
      ) : (
        visits.map((visit) => (
          <Card key={visit.VisitID} className={`border ${expandedVisit === visit.VisitID ? 'border-blue-300' : 'border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-semibold text-gray-900">
                        {formatDate(visit.ArrivalTime)}
                      </h4>
                      {getStatusBadge(visit.VisitStatus)}
                      <Badge variant="outline" className="capitalize">
                        {visit.VisitType?.replace('-', ' ') || 'Visit'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {visit.DoctorName && (
                        <span className="flex items-center gap-1">
                          <User className="size-4" />
                          Dr. {visit.DoctorName}
                        </span>
                      )}
                      {visit.QueueNumber && (
                        <span className="flex items-center gap-1">
                          <Hash className="size-4" />
                          Queue: {visit.QueueNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedVisit(expandedVisit === visit.VisitID ? null : visit.VisitID)}
                  className="h-8"
                >
                  {expandedVisit === visit.VisitID ? 'Hide Details' : 'View Details'}
                  <ChevronRight className={`ml-1 size-4 transition-transform ${
                    expandedVisit === visit.VisitID ? 'rotate-90' : ''
                  }`} />
                </Button>
              </div>

              {/* Quick Info - Only show essential information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500 mb-1">Visit Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {visit.VisitType?.replace('-', ' ') || 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${
                      visit.TriagePriority === 'critical' ? 'bg-red-500' :
                      visit.TriagePriority === 'high' ? 'bg-orange-500' :
                      visit.TriagePriority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {visit.TriagePriority || 'Standard'}
                    </p>
                  </div>
                </div>
              </div>

              {expandedVisit === visit.VisitID && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Only show purpose if it exists */}
                  {visit.Purpose && visit.Purpose.trim() && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Purpose of Visit</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{visit.Purpose}</p>
                    </div>
                  )}
                  
                  {/* Only show notes if they exist */}
                  {visit.VisitNotes && visit.VisitNotes.trim() && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
                      <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">{visit.VisitNotes}</p>
                    </div>
                  )}
                  
                  {/* Don't show Check-out data if it's not completed */}
                  {visit.VisitStatus === 'completed' && visit.CheckOutTime && (
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1">Visit Completed</p>
                      <p className="text-sm text-green-700">Check-out: {formatDate(visit.CheckOutTime)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderConsultations = () => {
    const renderConsultationDetail = (title: string, value: any, icon?: React.ReactNode) => {
      if (!value || value === '' || value === 'null' || value === 'N/A' || value === '0') return null;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <p className="text-sm font-medium text-gray-700">{title}</p>
          </div>
          {typeof value === 'string' && (value.includes('{') || value.includes('[')) ? (
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-900 whitespace-pre-wrap">
              {JSON.stringify(JSON.parse(value), null, 2)}
            </div>
          ) : (
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{value}</p>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="size-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No Consultations Found</h3>
              <p className="text-gray-500 mt-2">This patient has no recorded consultations.</p>
            </CardContent>
          </Card>
        ) : (
          consultations.map((consultation) => {
            const physicalExamFindings = consultation.PhysicalExamFindings ? 
              parsePhysicalExamFindings(consultation.PhysicalExamFindings) : 
              null;
            
            return (
              <Card key={consultation.ConsultationID} className={`border ${expandedConsultation === consultation.ConsultationID ? 'border-green-300' : 'border-gray-200'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Stethoscope className="size-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-base font-semibold text-gray-900">
                            {formatDate(consultation.StartTime || consultation.CreatedAt)}
                          </h4>
                          {consultation.SeverityAssessment && getSeverityBadge(consultation.SeverityAssessment)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {consultation.DoctorName && (
                            <span className="flex items-center gap-1">
                              <User className="size-4" />
                              Dr. {consultation.DoctorName}
                            </span>
                          )}
                          {consultation.VisitType && (
                            <Badge variant="outline" className="capitalize">
                              {(consultation.VisitType as string).replace(/-/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedConsultation(expandedConsultation === consultation.ConsultationID ? null : consultation.ConsultationID)}
                      className="h-8"
                    >
                      {expandedConsultation === consultation.ConsultationID ? 'Hide Details' : 'View Details'}
                      <ChevronRight className={`ml-1 size-4 transition-transform ${
                        expandedConsultation === consultation.ConsultationID ? 'rotate-90' : ''
                      }`} />
                    </Button>
                  </div>

                  {/* Quick Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {consultation.Diagnosis && (
                      <div className="p-3 bg-amber-50 rounded border border-amber-200">
                        <p className="text-xs text-amber-600 font-medium mb-1">Diagnosis</p>
                        <p className="font-medium text-gray-900">{consultation.Diagnosis}</p>
                        {consultation.DiagnosisCode && consultation.DiagnosisCode !== 'N/A' && (
                          <p className="text-xs text-amber-700 mt-1">Code: {consultation.DiagnosisCode}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Blood Pressure - FIXED with null checks */}
                    {consultation.BloodPressureSystolic && consultation.BloodPressureDiastolic && 
                     consultation.BloodPressureSystolic > 0 && consultation.BloodPressureDiastolic > 0 && (
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">Blood Pressure</p>
                        <p className="text-base font-semibold text-gray-900">
                          {consultation.BloodPressureSystolic}/{consultation.BloodPressureDiastolic} mmHg
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {consultation.BloodPressureSystolic < 90 ? 'Low' : 
                           consultation.BloodPressureSystolic > 140 ? 'High' : 
                           consultation.BloodPressureDiastolic > 90 ? 'High' : 'Normal'}
                        </p>
                      </div>
                    )}
                    
                    {/* Follow-up Status */}
                    {consultation.FollowUpDate && (
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-1">Follow-up</p>
                        <p className="font-medium text-gray-900">
                          {formatSimpleDate(consultation.FollowUpDate)}
                        </p>
                        {consultation.FollowUpPurpose && (
                          <p className="text-xs text-green-700 mt-1 truncate">{consultation.FollowUpPurpose}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {expandedConsultation === consultation.ConsultationID && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                      {/* Chief Complaint Section */}
                      {consultation.ChiefComplaint && consultation.ChiefComplaint.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <AlertCircle className="size-4 text-amber-500" />
                            Chief Complaint
                          </h5>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {consultation.ChiefComplaint}
                          </p>
                        </div>
                      )}

                      {/* History of Present Illness */}
                      {consultation.HistoryOfPresentIllness && consultation.HistoryOfPresentIllness.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">History of Present Illness</h5>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.HistoryOfPresentIllness}
                          </p>
                        </div>
                      )}

                      {/* Vital Signs Details */}
{(consultation.Temperature || consultation.BloodPressureSystolic || consultation.HeartRate) ? (
  <div className="space-y-3">
    <h5 className="font-medium text-gray-900 flex items-center gap-2">
      <Activity className="size-4 text-blue-500" />
      Vital Signs
      {consultation.VitalSignsTakenAt && (
        <span className="text-xs text-gray-500 font-normal">
          (Taken: {formatDate(consultation.VitalSignsTakenAt)})
        </span>
      )}
    </h5>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {consultation.Temperature && consultation.Temperature > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Temperature</p>
          <p className="text-base font-semibold text-gray-900">{consultation.Temperature}°C</p>
        </div>
      )}
      {consultation.BloodPressureSystolic && consultation.BloodPressureDiastolic && 
       consultation.BloodPressureSystolic > 0 && consultation.BloodPressureDiastolic > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Blood Pressure</p>
          <p className="text-base font-semibold text-gray-900">
            {consultation.BloodPressureSystolic}/{consultation.BloodPressureDiastolic} mmHg
          </p>
        </div>
      )}
      {consultation.HeartRate && consultation.HeartRate > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Heart Rate</p>
          <p className="text-base font-semibold text-gray-900">{consultation.HeartRate} bpm</p>
        </div>
      )}
      {consultation.RespiratoryRate && consultation.RespiratoryRate > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Respiratory Rate</p>
          <p className="text-base font-semibold text-gray-900">{consultation.RespiratoryRate} /min</p>
        </div>
      )}
      {consultation.OxygenSaturation && consultation.OxygenSaturation > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">O₂ Saturation</p>
          <p className="text-base font-semibold text-gray-900">{consultation.OxygenSaturation}%</p>
        </div>
      )}
      {consultation.Height && consultation.Height > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Height</p>
          <p className="text-base font-semibold text-gray-900">{consultation.Height} cm</p>
        </div>
      )}
      {consultation.Weight && consultation.Weight > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">Weight</p>
          <p className="text-base font-semibold text-gray-900">{consultation.Weight} kg</p>
        </div>
      )}
      {consultation.BMI && consultation.BMI > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-blue-600 font-medium">BMI</p>
          <p className="text-base font-semibold text-gray-900">{consultation.BMI}</p>
        </div>
      )}
    </div>
    
    {/* Show multiple vital signs if available */}
    {consultation.allVitalSigns && consultation.allVitalSigns.length > 1 && (
      <div className="mt-3 p-3 bg-gray-50 rounded border">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Multiple Vital Signs Records ({consultation.allVitalSigns.length})
        </p>
        <div className="space-y-2">
          {consultation.allVitalSigns.slice(1).map((vitals: VitalSigns, index: number) => (
            <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
              <div className="grid grid-cols-4 gap-2">
                {vitals.Temperature && (
                  <span>Temp: {vitals.Temperature}°C</span>
                )}
                {vitals.BloodPressureSystolic && vitals.BloodPressureDiastolic && (
                  <span>BP: {vitals.BloodPressureSystolic}/{vitals.BloodPressureDiastolic}</span>
                )}
                {vitals.HeartRate && (
                  <span>HR: {vitals.HeartRate} bpm</span>
                )}
                {vitals.TakenAt && (
                  <span className="col-span-4 text-gray-500">
                    Time: {formatDate(vitals.TakenAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
) : null}

                      {/* Physical Exam Findings */}
                      {physicalExamFindings && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Physical Examination Findings</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {typeof physicalExamFindings === 'object' ? 
                              JSON.stringify(physicalExamFindings, null, 2) : 
                              physicalExamFindings
                            }
                          </div>
                        </div>
                      )}

                      {/* Treatment Plan */}
                      {consultation.TreatmentPlan && consultation.TreatmentPlan.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <ClipboardCheck className="size-4 text-green-500" />
                            Treatment Plan
                          </h5>
                          <div className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200 whitespace-pre-wrap">
                            {consultation.TreatmentPlan}
                          </div>
                        </div>
                      )}

                      {/* Medication Plan */}
                      {consultation.MedicationPlan && consultation.MedicationPlan.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <Pill className="size-4 text-purple-500" />
                            Medication Plan
                          </h5>
                          <div className="text-sm text-gray-900 bg-purple-50 p-3 rounded border border-purple-200 whitespace-pre-wrap">
                            {consultation.MedicationPlan}
                          </div>
                        </div>
                      )}

                      {/* Non-Medication Plan */}
                      {consultation.NonMedicationPlan && consultation.NonMedicationPlan.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Non-Medication Plan</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                            {consultation.NonMedicationPlan}
                          </div>
                        </div>
                      )}

                      {/* Patient Education */}
                      {consultation.PatientEducation && consultation.PatientEducation.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <BookOpen className="size-4 text-blue-500" />
                            Patient Education
                          </h5>
                          <div className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200 whitespace-pre-wrap">
                            {consultation.PatientEducation}
                          </div>
                        </div>
                      )}

                      {/* Lifestyle Advice */}
                      {consultation.LifestyleAdvice && consultation.LifestyleAdvice.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <Dumbbell className="size-4 text-green-500" />
                            Lifestyle Advice
                          </h5>
                          <div className="text-sm text-gray-900 bg-green-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.LifestyleAdvice}
                          </div>
                        </div>
                      )}

                      {/* Warning Signs */}
                      {consultation.WarningSigns && consultation.WarningSigns.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2 text-red-600">
                            <AlertTriangle className="size-4" />
                            Warning Signs
                          </h5>
                          <div className="text-sm text-gray-900 bg-red-50 p-3 rounded border border-red-200">
                            {consultation.WarningSigns}
                          </div>
                        </div>
                      )}

                      {/* Past Medical History */}
                      {consultation.PastMedicalHistory && consultation.PastMedicalHistory.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Past Medical History</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.PastMedicalHistory}
                          </div>
                        </div>
                      )}

                      {/* Family History */}
                      {consultation.FamilyHistory && consultation.FamilyHistory.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Family History</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.FamilyHistory}
                          </div>
                        </div>
                      )}

                      {/* Differential Diagnosis */}
                      {consultation.DifferentialDiagnosis && consultation.DifferentialDiagnosis.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Differential Diagnosis</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.DifferentialDiagnosis}
                          </div>
                        </div>
                      )}

                      {/* Disposition */}
                      {consultation.Disposition && consultation.Disposition.trim() && consultation.Disposition !== 'discharge' && (
                        <div className="p-3 bg-amber-50 rounded border border-amber-200">
                          <p className="text-sm font-medium text-amber-800 mb-1">Disposition</p>
                          <p className="text-sm font-semibold text-amber-900 capitalize">{consultation.Disposition}</p>
                        </div>
                      )}

                      {/* Consultation Notes */}
                      {consultation.ConsultationNotes && consultation.ConsultationNotes.trim() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Doctor's Notes</h5>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {consultation.ConsultationNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  };

const renderPrescriptions = () => {
  console.log('=== RENDERING PRESCRIPTIONS DEBUG ===');
  console.log('Total prescriptions count:', prescriptions.length);
  
  // Detailed logging of each prescription
  prescriptions.forEach((prescription, index) => {
    console.log(`\n=== Prescription ${index} ===`);
    console.log('Full prescription object:', prescription);
    console.log('Keys in prescription:', Object.keys(prescription));
    
    // Check for items property
    const prescriptionAny = prescription as any;
    console.log('Has items property?', 'items' in prescriptionAny);
    console.log('Items value:', prescriptionAny.items);
    console.log('Items type:', typeof prescriptionAny.items);
    
    // Check all possible item property names
    const possibleItemKeys = ['items', 'Items', 'medications', 'Medications', 'prescriptionItems', 'PrescriptionItems'];
    possibleItemKeys.forEach(key => {
      if (key in prescriptionAny) {
        console.log(`Found key "${key}":`, prescriptionAny[key]);
        console.log(`Type of "${key}":`, typeof prescriptionAny[key]);
        console.log(`Is array? "${key}":`, Array.isArray(prescriptionAny[key]));
        if (Array.isArray(prescriptionAny[key]) && prescriptionAny[key].length > 0) {
          console.log(`First item in "${key}":`, prescriptionAny[key][0]);
          console.log(`Keys in first item:`, Object.keys(prescriptionAny[key][0]));
        }
      }
    });
  });
  
  return (
    <div className="space-y-4">
      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="size-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Prescriptions Found</h3>
            <p className="text-gray-500 mt-2">This patient has no recorded prescriptions.</p>
          </CardContent>
        </Card>
      ) : (
        prescriptions.map((prescription, index) => {
          const prescriptionAny = prescription as any;
          
          // Try to find items in various possible property names
          let itemsArray: any[] = [];
          const possibleKeys = ['items', 'Items', 'medications', 'Medications', 'prescriptionItems', 'PrescriptionItems'];
          
          for (const key of possibleKeys) {
            if (prescriptionAny[key] && Array.isArray(prescriptionAny[key])) {
              itemsArray = prescriptionAny[key];
              console.log(`Found items in key "${key}" for prescription ${index}:`, itemsArray);
              break;
            }
          }
          
          // If no items found, log the prescription structure for debugging
          if (itemsArray.length === 0) {
            console.log(`No items found for prescription ${index}. Full object:`, prescription);
            // Check if the prescription itself might be an array of items
            if (Array.isArray(prescription)) {
              console.log(`Prescription ${index} IS an array, treating as items`);
              itemsArray = prescription;
            }
          }
          
          const hasItems = itemsArray.length > 0;
          
          return (
            <Card key={prescription.PrescriptionID || index} 
                  className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Pill className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        Prescribed on {formatDate(prescription.PrescribedDate)}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600">
                          by Dr. {prescription.DoctorName || 'Unknown Doctor'}
                        </span>
                        {getStatusBadge(prescription.Status || 'active')}
                      </div>
                    </div>
                  </div>
                </div>

                {prescription.Remarks && prescription.Remarks.trim() && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-1">Doctor's Remarks</p>
                    <p className="text-sm text-blue-700">{prescription.Remarks}</p>
                  </div>
                )}

                {prescription.Diagnosis && (
                  <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-1">Associated Diagnosis</p>
                    <p className="text-sm text-amber-700">{prescription.Diagnosis}</p>
                  </div>
                )}

                {/* Prescription Items */}
                {hasItems ? (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">
                      Medications ({itemsArray.length})
                    </h5>
                    <div className="space-y-3">
                      {itemsArray.map((item: any, itemIndex: number) => {
                        console.log(`Processing item ${itemIndex} for prescription ${index}:`, item);
                        
                        // Extract with multiple fallbacks
                        const drugName = item.DrugName || item.drugName || item.Name || item.name || 
                                        item.Medication || item.medication || 'Unknown Medication';
                        const category = item.Category || item.category || item.Type || item.type || '';
                        const dosage = item.Dosage || item.dosage || item.strength || item.Strength || '';
                        const frequency = item.Frequency || item.frequency || item.schedule || item.Schedule || '';
                        const duration = item.Duration || item.duration || item.period || item.Period || '';
                        const quantity = item.Quantity || item.quantity || item.amount || item.Amount || '';
                        const itemStatus = item.Status || item.status || 'active';
                        
                        console.log(`Extracted values for item ${itemIndex}:`, {
                          drugName, category, dosage, frequency, duration, quantity, itemStatus
                        });
                        
                        return (
                          <div key={itemIndex} className="p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded border">
                                  <Pill className="size-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{drugName}</p>
                                  {category && (
                                    <p className="text-xs text-gray-500">{category}</p>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(itemStatus)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">Dosage</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {dosage || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Frequency</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {frequency || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {duration || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Quantity</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {quantity || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
                    <Package className="size-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No medications in this prescription</p>
                    {/* Debug info */}
                    <div className="mt-2 text-xs text-gray-400">
                      Prescription ID: {prescription.PrescriptionID}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

  const renderAllergies = () => (
    <div className="space-y-4">
      {allergies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="size-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Allergies Found</h3>
            <p className="text-gray-500 mt-2">This patient has no recorded allergies.</p>
          </CardContent>
        </Card>
      ) : (
        allergies.map((allergy, index) => (
          <Card key={allergy.AllergyFindingID || index} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    allergy.Severity === 'severe' || allergy.Severity === 'life-threatening' 
                      ? 'bg-red-50' 
                      : 'bg-amber-50'
                  }`}>
                    <AlertTriangle className={`size-5 ${
                      allergy.Severity === 'severe' || allergy.Severity === 'life-threatening' 
                        ? 'text-red-600' 
                        : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{allergy.AllergyName}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      {allergy.Severity && getSeverityBadge(allergy.Severity)}
                      {allergy.OnsetDate && (
                        <span className="text-sm text-gray-600">
                          Onset: {formatSimpleDate(allergy.OnsetDate)}
                        </span>
                      )}
                      {getStatusBadge(allergy.Status || 'active')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Reaction</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {allergy.Reaction || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded capitalize">
                    {allergy.Status || 'Active'}
                  </p>
                </div>
              </div>

              {allergy.Notes && allergy.Notes.trim() && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Additional Notes</p>
                  <p className="text-sm text-blue-700">{allergy.Notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative z-50 w-full h-full max-w-[1600px] max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Dialog Header */}
          <div className="shrink-0 bg-gradient-to-r from-blue-50 to-gray-50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border">
                  <FileText className="size-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Patient Medical History</h2>
                  <p className="text-sm text-gray-600">Comprehensive medical records</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {patientAge} years • {patientData?.Gender === 'M' ? 'Male' : 'Female'}
                  </p>
                  <p className="text-xs text-gray-500">
                    DOB: {formatSimpleDate(patientData?.DOB)}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 rounded-lg hover:bg-gray-200"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="shrink-0 px-6 pt-4 pb-2 bg-white border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1">
                <TabsTrigger 
                  value="patient" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  <User className="size-4 mr-2" />
                  Patient Info
                </TabsTrigger>
                <TabsTrigger 
                  value="visits" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  <Calendar className="size-4 mr-2" />
                  Visits
                  {visits.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                      {visits.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="consultations" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  <Stethoscope className="size-4 mr-2" />
                  Consultations
                  {consultations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                      {consultations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="prescriptions" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  <Pill className="size-4 mr-2" />
                  Prescriptions
                  {prescriptions.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                      {prescriptions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="allergies" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  <AlertTriangle className="size-4 mr-2" />
                  Allergies
                  {allergies.length > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                      {allergies.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* SCROLLABLE CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                  <p className="text-gray-600">Loading patient history...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'patient' && renderPatientInfo()}
                {activeTab === 'visits' && renderVisits()}
                {activeTab === 'consultations' && renderConsultations()}
                {activeTab === 'prescriptions' && renderPrescriptions()}
                {activeTab === 'allergies' && renderAllergies()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}