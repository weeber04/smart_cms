// ConsultationTab.tsx - COMPLETE UPDATED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, ClipboardList, Activity, Pill, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent } from '../ui/tabs';
import { PrescriptionSubTab } from './PrescriptionSubTab';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from "sonner";
import { CompleteConsultationButton } from './CompleteConsultationButton';
import { HistoryDialog } from './HistoryDialog';

// Import new components
import { PatientQueuePanel } from './PatientQueuePanel';
import { PatientHeader } from './PatientHeader';
import { ConsultationForm } from './ConsultationForm';
import { AllergiesTab } from './AllergiesTab';
import { SummaryTab } from './SummaryTab';
import { ConsultationTabs } from './ConsultationTabs';


// Import types
import type { 
  ConsultationTabProps, 
  PatientVital, 
  PatientData, 
  AllergyFinding, 
  MedicalCondition, 
  PatientVisit,
  ConsultationFormData 
} from './types';

export function ConsultationTab({ doctorId, doctorProfile, todayAppointments, setTodayAppointments }: ConsultationTabProps) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'consultation' | 'vitals' | 'prescription' | 'allergies' | 'summary'>('consultation');
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<PatientData | null>(null);
  const [patientVitals, setPatientVitals] = useState<PatientVital[]>([]);
  const [patientAllergies, setPatientAllergies] = useState<AllergyFinding[]>([]);
  const [patientMedicalConditions, setPatientMedicalConditions] = useState<MedicalCondition[]>([]);
  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
  const [currentConsultationId, setCurrentConsultationId] = useState<number | null>(() => {
  // Try to get from localStorage on component mount
  const storedId = localStorage.getItem('currentConsultationId');
  return storedId ? parseInt(storedId) : null;
});
  const [consultationProgress, setConsultationProgress] = useState(0);
  const [quickNote, setQuickNote] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'vitals' | 'consultation' | 'allergy' | 'prescription' | null>(null);
  const [savingStates, setSavingStates] = useState({
    vitals: false,
    consultation: false,
    allergy: false
  });
  
  // Add these new states
  const [showVitalHistory, setShowVitalHistory] = useState(false);
  const [canCompleteConsultation, setCanCompleteConsultation] = useState(false);
  const [isCompletingConsultation, setIsCompletingConsultation] = useState(false);
  const [isConsultationSaved, setIsConsultationSaved] = useState(false);
  const [isEditingConsultation, setIsEditingConsultation] = useState(false);
  

  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  // Consultation form state
// In your ConsultationTab component, initialize the form with these fields:
const [consultationForm, setConsultationForm] = useState<ConsultationFormData>({
  chiefComplaint: '',
  duration: '',
  severity: 'moderate',
  historyOfPresentIllness: '',
  onset: '',
  progression: '',
  relievingFactors: '',
  aggravatingFactors: '',
  pastMedicalHistory: '',
  surgicalHistory: '',
  familyHistory: '',
  smoking: '',
  alcohol: '',
  occupation: '',
  generalReview: '',
  cardiovascularReview: '',
  respiratoryReview: '',
  gastrointestinalReview: '',
  neurologicalReview: '',
  generalAppearance: '',
  vitalSignsNotes: '',
  cardiovascularExam: '',
  respiratoryExam: '',
  abdominalExam: '',
  neurologicalExam: '',
  diagnosis: '',
  differentialDiagnosis: '',
  diagnosisCode: '',
  severityAssessment: 'moderate',
  treatmentPlan: '',
  medicationPlan: '',
  nonMedicationPlan: '',
  followUpInstructions: '',
  followUpDate: '',
  patientEducation: '',
  lifestyleAdvice: '',
  warningSigns: '',
  consultationNotes: '',
  disposition: '',
  referralNeeded: false,
  referralNotes: '',
  needsFollowUp: false,
  followUpTime: '',
  followUpPurpose: '',
  
  // Add these new fields:
  labTestsOrdered: false,
  referralGiven: false,
});
  
  // Vital signs state
  const [currentVitals, setCurrentVitals] = useState<PatientVital>({
    TakenBy: doctorId || 0,
    TakenAt: new Date().toISOString(),
    BloodPressure: '',
    Temperature: '',
    HeartRate: '',
    OxygenSaturation: '',
    RespiratoryRate: '',
    Height: '',
    Weight: '',
    BMI: '',
    PainLevel: '',
    Notes: ''
  });
  
  // Consultation steps
  const consultationSteps = [
    { id: 'chief-complaint', label: 'Chief Complaint', icon: '📝' },
    { id: 'history', label: 'History', icon: '📖' },
    { id: 'examination', label: 'Examination', icon: '👁️' },
    { id: 'diagnosis', label: 'Diagnosis', icon: '🔍' },
    { id: 'treatment', label: 'Treatment', icon: '💊' },
    { id: 'summary', label: 'Summary', icon: '✅' }
  ];
  
  const [activeStep, setActiveStep] = useState(0);
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  const [allergyForm, setAllergyForm] = useState({
    AllergyName: '',
    Reaction: '',
    Severity: 'mild',
    OnsetDate: new Date().toISOString().split('T')[0],
    Status: 'active',
    Notes: ''
  });
  
  const [calledPatients, setCalledPatients] = useState<any[]>([]);

  // Fetch patient details when selected
  useEffect(() => {
    if (selectedPatient && doctorId) {
      fetchPatientDetails(selectedPatient);
      fetchPatientVitals(selectedPatient);
      fetchPatientAllergies(selectedPatient);
      fetchPatientMedicalConditions(selectedPatient);
      fetchPatientVisits(selectedPatient);
      
      // Reset consultation state
      setActiveStep(0);
      setConsultationProgress(0);
      setCanCompleteConsultation(false);
      setIsConsultationSaved(false);
      setIsEditingConsultation(false);
      setCurrentConsultationId(null);
      
      // Reset forms
      setCurrentVitals({
        TakenBy: doctorId,
        TakenAt: new Date().toISOString(),
        BloodPressure: '',
        Temperature: '',
        HeartRate: '',
        OxygenSaturation: '',
        RespiratoryRate: '',
        Height: '',
        Weight: '',
        BMI: '',
        PainLevel: '',
        Notes: ''
      });
      
      resetConsultationForm();
    }
  }, [selectedPatient, doctorId]);

  // Fetch called patients
  useEffect(() => {
    if (doctorId) {
      fetchCalledPatients();
    }
  }, [doctorId]);

  // Fetch saved consultation if we have a consultationId
  useEffect(() => {
    if (currentConsultationId && selectedPatient) {
      fetchSavedConsultation(currentConsultationId);
    }
  }, [currentConsultationId]);

const resetConsultationForm = () => {
  setConsultationForm({
    chiefComplaint: '',
    duration: '',
    severity: 'moderate',
    historyOfPresentIllness: '',
    onset: '',
    progression: '',
    relievingFactors: '',
    aggravatingFactors: '',
    pastMedicalHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    smoking: 'none',
    alcohol: 'none',
    occupation: '',
    generalReview: '',
    cardiovascularReview: '',
    respiratoryReview: '',
    gastrointestinalReview: '',
    neurologicalReview: '',
    generalAppearance: '',
    vitalSignsNotes: '',
    cardiovascularExam: '',
    respiratoryExam: '',
    abdominalExam: '',
    neurologicalExam: '',
    diagnosis: '',
    differentialDiagnosis: '',
    diagnosisCode: '',
    severityAssessment: 'mild',
    treatmentPlan: '',
    medicationPlan: '',
    nonMedicationPlan: '',
    followUpInstructions: '',
    followUpDate: '',
    patientEducation: '',
    lifestyleAdvice: '',
    warningSigns: '',
    consultationNotes: '',
    disposition: 'discharge',
    referralNeeded: false,
    referralNotes: '',
    needsFollowUp: false,
    followUpTime: '',
    followUpPurpose: '',
    
    // ADD THESE TWO FIELDS:
    labTestsOrdered: false,
    referralGiven: false,
  });
};
  // NEW FUNCTION: Fetch saved consultation data
  const fetchSavedConsultation = async (consultationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/consultation/${consultationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const consultationData = await response.json();
        console.log('Fetched consultation data:', consultationData);
        
        // Update form with fetched data
// In the fetchSavedConsultation function, update the form setting:
setConsultationForm(prev => ({
  ...prev,
  // Map database fields to form fields
  chiefComplaint: consultationData.ChiefComplaint || '',
  historyOfPresentIllness: consultationData.HistoryOfPresentIllness || '',
  diagnosis: consultationData.Diagnosis || '',
  diagnosisCode: consultationData.DiagnosisCode || '',
  treatmentPlan: consultationData.TreatmentPlan || '',
  consultationNotes: consultationData.ConsultationNotes || '',
  followUpInstructions: consultationData.FollowUpInstructions || '',
  followUpDate: consultationData.FollowUpDate ? consultationData.FollowUpDate.split('T')[0] : '',
  severityAssessment: consultationData.SeverityAssessment || 'mild',
  needsFollowUp: consultationData.NeedsFollowUp || false,
  followUpTime: consultationData.FollowUpTime || '',
  followUpPurpose: consultationData.FollowUpPurpose || '',
  medicationPlan: consultationData.MedicationPlan || '',
  nonMedicationPlan: consultationData.NonMedicationPlan || '',
  patientEducation: consultationData.PatientEducation || '',
  lifestyleAdvice: consultationData.LifestyleAdvice || '',
  warningSigns: consultationData.WarningSigns || '',
  disposition: consultationData.Disposition || 'discharge',
  referralNeeded: consultationData.ReferralNeeded || false,
  referralNotes: consultationData.ReferralNotes || '',
  pastMedicalHistory: consultationData.PastMedicalHistory || '',
  familyHistory: consultationData.FamilyHistory || '',
  differentialDiagnosis: consultationData.DifferentialDiagnosis || '',
  
  // ADD THESE TWO FIELDS:
  labTestsOrdered: consultationData.LabTestsOrdered || false,
  referralGiven: consultationData.ReferralGiven || false,
}));
        
        // Parse physical exam findings if they exist
        if (consultationData.PhysicalExamFindings) {
          try {
            const examFindings = JSON.parse(consultationData.PhysicalExamFindings);
            setConsultationForm(prev => ({
              ...prev,
              generalAppearance: examFindings.generalAppearance || '',
              cardiovascularExam: examFindings.cardiovascular || '',
              respiratoryExam: examFindings.respiratory || '',
              abdominalExam: examFindings.abdominal || '',
              neurologicalExam: examFindings.neurological || ''
            }));
          } catch (e) {
            console.error('Error parsing physical exam findings:', e);
          }
        }
        
        setIsConsultationSaved(true);
        setIsEditingConsultation(false);
      }
    } catch (error) {
      console.error("Error fetching consultation:", error);
    }
  };

  const fetchPatientVitals = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/vitals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const vitalsData = await response.json();
        setPatientVitals(vitalsData);
      } else {
        console.warn('Failed to fetch patient vitals');
        setPatientVitals([]);
      }
    } catch (error) {
      console.error("Error fetching patient vitals:", error);
      setPatientVitals([]);
    }
  };

  const fetchPatientAllergies = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/allergies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const allergiesData = await response.json();
        setPatientAllergies(allergiesData);
      } else {
        console.warn('Failed to fetch patient allergies');
        setPatientAllergies([]);
      }
    } catch (error) {
      console.error("Error fetching patient allergies:", error);
      setPatientAllergies([]);
    }
  };

  const fetchPatientMedicalConditions = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/medical-conditions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const conditionsData = await response.json();
        setPatientMedicalConditions(conditionsData);
      } else {
        console.warn('Failed to fetch medical conditions');
        setPatientMedicalConditions([]);
      }
    } catch (error) {
      console.error("Error fetching medical conditions:", error);
      setPatientMedicalConditions([]);
    }
  };

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const patientData = await response.json();
        setSelectedPatientData(patientData);
      } else {
        console.warn('Failed to fetch patient details');
        setSelectedPatientData(null);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setSelectedPatientData(null);
    }
  };

  const fetchPatientVisits = async (patientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}/visits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const visitsData = await response.json();
        setPatientVisits(visitsData);
      } else {
        console.warn('Failed to fetch patient visits');
        setPatientVisits([]);
      }
    } catch (error) {
      console.error("Error fetching patient visits:", error);
      setPatientVisits([]);
    }
  };

  const fetchCalledPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/doctor/called-patients/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalledPatients(data);
      }
    } catch (error) {
      console.error('Error fetching called patients:', error);
      setCalledPatients([]);
    }
  };

  // UPDATED: handleSaveConsultation
const handleSaveConsultation = async () => {
  if (!selectedPatient || !doctorId) {
    toast.error('Please select a patient first');
    return;
  }

  console.log('=== FRONTEND: Starting save consultation ===');
  console.log('Patient ID:', selectedPatient);
  console.log('Doctor ID:', doctorId);
  
  setSavingStates(prev => ({ ...prev, consultation: true }));
  
  try {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    // Prepare consultation data - NO consultationId needed!
    const consultationData = {
      patientId: selectedPatient,
      doctorId: doctorId,
      chiefComplaint: consultationForm.chiefComplaint || "",
      historyOfPresentIllness: consultationForm.historyOfPresentIllness || "",
      diagnosis: consultationForm.diagnosis || "",
      diagnosisCode: consultationForm.diagnosisCode || "",
      treatmentPlan: consultationForm.treatmentPlan || "",
      consultationNotes: consultationForm.consultationNotes || "",
      followUpInstructions: consultationForm.followUpInstructions || "",
      followUpDate: consultationForm.followUpDate || null,
      physicalExamFindings: JSON.stringify({
        generalAppearance: consultationForm.generalAppearance || "",
        cardiovascular: consultationForm.cardiovascularExam || "",
        respiratory: consultationForm.respiratoryExam || "",
        abdominal: consultationForm.abdominalExam || "",
        neurological: consultationForm.neurologicalExam || ""
      }),
      severityAssessment: consultationForm.severityAssessment || "moderate",
      needsFollowUp: consultationForm.needsFollowUp || false,
      followUpTime: consultationForm.followUpTime || "",
      followUpPurpose: consultationForm.followUpPurpose || "",
      medicationPlan: consultationForm.medicationPlan || "",
      nonMedicationPlan: consultationForm.nonMedicationPlan || "",
      patientEducation: consultationForm.patientEducation || "",
      lifestyleAdvice: consultationForm.lifestyleAdvice || "",
      warningSigns: consultationForm.warningSigns || "",
      disposition: consultationForm.disposition || "",
      referralNeeded: consultationForm.referralNeeded || false,
      referralNotes: consultationForm.referralNotes || "",
      pastMedicalHistory: consultationForm.pastMedicalHistory || "",
      familyHistory: consultationForm.familyHistory || "",
      differentialDiagnosis: consultationForm.differentialDiagnosis || "",
      labTestsOrdered: consultationForm.labTestsOrdered || false,
      referralGiven: consultationForm.referralGiven || false
    };

    console.log('Sending request to backend with data:', consultationData);
    console.log('Endpoint: http://localhost:3001/api/doctor/save-consultation-form');

    const response = await fetch("http://localhost:3001/api/doctor/save-consultation-form", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(consultationData)
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const result = await response.json();
    console.log('Response result:', result);

    if (response.ok) {
      console.log('Save successful! Consultation ID:', result.consultationId);
      
      if (result.consultationId) {
        setCurrentConsultationId(result.consultationId);
        setCanCompleteConsultation(true);
        setIsConsultationSaved(true);
        setIsEditingConsultation(false);
        
        // Fetch the saved data to populate form
        fetchSavedConsultation(result.consultationId);
      }
      
      // If follow-up is needed, schedule the appointment
      if (consultationForm.needsFollowUp && consultationForm.followUpDate && consultationForm.followUpTime) {
        await createFollowUpAppointment(consultationForm.followUpDate, consultationForm.followUpTime, result.consultationId);
      }
      
      setSuccessMessage('Consultation form has been successfully saved.');
      setSuccessType('consultation');
      setShowSuccessDialog(true);
      setConsultationProgress(80);
      
      toast.success('Consultation saved successfully!');
      
    } else {
      console.error('Server error details:', result);
      toast.error(result.error || 'Failed to save consultation form');
    }
  } catch (error: any) {
    console.error("Network or client error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    toast.error("Failed to save consultation form. Please try again.");
  } finally {
    setSavingStates(prev => ({ ...prev, consultation: false }));
  }
};

  // NEW FUNCTION: handleUpdateConsultation
const handleUpdateConsultation = async () => {
  if (!currentConsultationId || !selectedPatient || !doctorId) {
    toast.error('No consultation to update');
    return;
  }

  setSavingStates(prev => ({ ...prev, consultation: true }));
  
  try {
    const token = localStorage.getItem('token');
    
    const updateData = {
      consultationId: currentConsultationId,
      patientId: selectedPatient,
      doctorId: doctorId,
      chiefComplaint: consultationForm.chiefComplaint || "",
      historyOfPresentIllness: consultationForm.historyOfPresentIllness || "",
      diagnosis: consultationForm.diagnosis || "",
      diagnosisCode: consultationForm.diagnosisCode || "",
      treatmentPlan: consultationForm.treatmentPlan || "",
      consultationNotes: consultationForm.consultationNotes || "",
      followUpInstructions: consultationForm.followUpInstructions || "",
      followUpDate: consultationForm.followUpDate || null,
      physicalExamFindings: JSON.stringify({
        generalAppearance: consultationForm.generalAppearance || "",
        cardiovascular: consultationForm.cardiovascularExam || "",
        respiratory: consultationForm.respiratoryExam || "",
        abdominal: consultationForm.abdominalExam || "",
        neurological: consultationForm.neurologicalExam || ""
      }),
      severityAssessment: consultationForm.severityAssessment || "moderate",
      needsFollowUp: consultationForm.needsFollowUp || false,
      followUpTime: consultationForm.followUpTime || "",
      followUpPurpose: consultationForm.followUpPurpose || "",
      medicationPlan: consultationForm.medicationPlan || "",
      nonMedicationPlan: consultationForm.nonMedicationPlan || "",
      patientEducation: consultationForm.patientEducation || "",
      lifestyleAdvice: consultationForm.lifestyleAdvice || "",
      warningSigns: consultationForm.warningSigns || "",
      disposition: consultationForm.disposition || "",
      referralNeeded: consultationForm.referralNeeded || false,
      referralNotes: consultationForm.referralNotes || "",
      pastMedicalHistory: consultationForm.pastMedicalHistory || "",
      familyHistory: consultationForm.familyHistory || "",
      differentialDiagnosis: consultationForm.differentialDiagnosis || "",
      labTestsOrdered: consultationForm.labTestsOrdered || false,
      referralGiven: consultationForm.referralGiven || false
    };

    console.log('Updating consultation with:', updateData);

    const response = await fetch("http://localhost:3001/api/doctor/update-consultation", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    console.log('Update response:', result);

    if (response.ok) {
      toast.success('Consultation updated successfully');
      setIsConsultationSaved(true);
      setIsEditingConsultation(false);
      
      // Update follow-up appointment if needed
      if (consultationForm.needsFollowUp && consultationForm.followUpDate && consultationForm.followUpTime) {
        await updateFollowUpAppointment(consultationForm.followUpDate, consultationForm.followUpTime);
      }
      
      // Show success dialog
      setSuccessMessage('Consultation has been successfully updated.');
      setSuccessType('consultation');
      setShowSuccessDialog(true);
      
      // Refresh the consultation data
      fetchSavedConsultation(currentConsultationId);
    } else {
      toast.error(result.error || 'Failed to update consultation');
    }
  } catch (error) {
    console.error("Update consultation error:", error);
    toast.error("Failed to update consultation. Please try again.");
  } finally {
    setSavingStates(prev => ({ ...prev, consultation: false }));
  }
};

  // NEW FUNCTION: handleEditConsultation (for the button)
  const handleEditConsultation = () => {
    setIsEditingConsultation(true);
    setIsConsultationSaved(false);
    setActiveStep(0); // Reset to first step for editing
  };

  // Helper function to create follow-up appointment
  const createFollowUpAppointment = async (followUpDate: string, followUpTime: string, consultationId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const [hours, minutes] = followUpTime.split(':').map(Number);
      const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      
      const totalMinutes = hours * 60 + minutes + 30;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
      
      const response = await fetch("http://localhost:3001/api/doctor/schedule-follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: doctorId,
          consultationId: consultationId,
          appointmentDateTime: `${followUpDate} ${startTime.split(':')[0]}:00:00`,
          startTime: startTime,
          endTime: endTime,
          purpose: consultationForm.followUpPurpose || "Follow-up consultation",
          notes: consultationForm.followUpInstructions || "Follow-up appointment scheduled by doctor",
          createdBy: doctorId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Follow-up appointment created successfully:', result);
        toast.success(`Follow-up scheduled for ${followUpDate} at ${followUpTime}`);
      } else {
        console.warn('Follow-up scheduling failed:', result);
        toast.warning('Consultation saved but follow-up scheduling failed');
      }
    } catch (error) {
      console.warn('Failed to create follow-up appointment:', error);
      toast.warning('Consultation saved but follow-up scheduling failed');
    }
  };

  const updateFollowUpAppointment = async (followUpDate: string, followUpTime: string) => {
    // Implement if you have API for updating appointments
    console.log('Update follow-up appointment logic would go here');
  };

  const handleCompleteConsultation = async () => {
    if (!currentConsultationId || !selectedPatient || !doctorId) {
      toast.error('No active consultation found');
      return;
    }

    setIsCompletingConsultation(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch("http://localhost:3001/api/doctor/complete-consultation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultationId: currentConsultationId,
          patientId: selectedPatient,
          doctorId: doctorId
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Consultation completed successfully');
        setConsultationProgress(100);
        
        // Reset states
        setSelectedPatient(null);
        setCurrentConsultationId(null);
        setCanCompleteConsultation(false);
        setIsConsultationSaved(false);
        setIsEditingConsultation(false);
        resetConsultationForm();
        setActiveStep(0);
        
        // Refresh appointments and called patients
        const appointmentsRes = await fetch(`http://localhost:3001/api/doctor/appointments/${doctorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          setTodayAppointments(appointmentsData);
        }
        
        fetchCalledPatients();
      } else {
        toast.error(result.error || 'Failed to complete consultation');
      }
    } catch (error) {
      console.error("Complete consultation error:", error);
      toast.error("Failed to complete consultation. Please try again.");
    } finally {
      setIsCompletingConsultation(false);
    }
  };

  const handleSaveAllergy = async (allergyData: any) => {
    if (!selectedPatient || !doctorId) {
      toast.error('Please select a patient first');
      return;
    }

    setSavingStates(prev => ({ ...prev, allergy: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      const allergyDataToSend = {
        patientId: selectedPatient,
        doctorId: doctorId,
        allergyName: allergyData.AllergyName,
        reaction: allergyData.Reaction,
        severity: allergyData.Severity,
        onsetDate: allergyData.OnsetDate,
        status: allergyData.Status,
        notes: allergyData.Notes
      };

      const response = await fetch("http://localhost:3001/api/doctor/save-allergy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(allergyDataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(`Allergy to "${allergyData.AllergyName}" has been recorded in the patient's medical history.`);
        setSuccessType('allergy');
        setShowSuccessDialog(true);
        
        fetchPatientAllergies(selectedPatient);
        
        setAllergyForm({
          AllergyName: '',
          Reaction: '',
          Severity: 'mild',
          OnsetDate: new Date().toISOString().split('T')[0],
          Status: 'active',
          Notes: ''
        });
      } else {
        toast.error(result.error || 'Failed to save allergy');
      }
    } catch (error) {
      console.error("Allergy save error:", error);
      toast.error("Failed to save allergy. Please try again.");
    } finally {
      setSavingStates(prev => ({ ...prev, allergy: false }));
    }
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient || !doctorId || !selectedPatientData) {
      toast.error('Please select a patient first');
      return;
    }

    if (!currentVitals.BloodPressure || !currentVitals.Temperature || !currentVitals.HeartRate) {
      toast.error('Please fill in at least Blood Pressure, Temperature, and Heart Rate');
      return;
    }

    setSavingStates(prev => ({ ...prev, vitals: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      const bpParts = currentVitals.BloodPressure.split('/');
      const systolic = bpParts[0]?.trim();
      const diastolic = bpParts[1]?.trim();

      let consultationId = null;
      
      const activeVisitRes = await fetch(`http://localhost:3001/api/doctor/patient/${selectedPatient}/active-consultation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activeVisitRes.ok) {
        const visitData = await activeVisitRes.json();
        consultationId = visitData.ConsultationID;
      }

      const vitalData = {
        consultationId: consultationId,
        patientId: selectedPatient,
        takenBy: doctorId,
        bloodPressureSystolic: systolic || null,
        bloodPressureDiastolic: diastolic || null,
        bloodPressure: currentVitals.BloodPressure,
        heartRate: currentVitals.HeartRate || null,
        respiratoryRate: currentVitals.RespiratoryRate || null,
        temperature: currentVitals.Temperature || null,
        oxygenSaturation: currentVitals.OxygenSaturation || null,
        height: currentVitals.Height || null,
        weight: currentVitals.Weight || null,
        bmi: currentVitals.BMI || null,
        painLevel: currentVitals.PainLevel || null,
        notes: currentVitals.Notes || ''
      };

      const response = await fetch("http://localhost:3001/api/doctor/save-vital-signs-consultation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vitalData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Vital signs have been successfully recorded and saved to the patient\'s medical record.');
        setSuccessType('vitals');
        setShowSuccessDialog(true);
        
        fetchPatientVitals(selectedPatient);
        
        setCurrentVitals({
          TakenBy: doctorId,
          TakenAt: new Date().toISOString(),
          BloodPressure: '',
          Temperature: '',
          HeartRate: '',
          OxygenSaturation: '',
          RespiratoryRate: '',
          Height: '',
          Weight: '',
          BMI: '',
          PainLevel: '',
          Notes: ''
        });
        
        if (consultationProgress < 40) {
          setConsultationProgress(40);
          setActiveStep(2);
        }
      } else {
        toast.error(result.error || 'Failed to save vital signs');
      }
    } catch (error) {
      console.error("Vitals save error:", error);
      toast.error("Failed to save vital signs. Please try again.");
    } finally {
      setSavingStates(prev => ({ ...prev, vitals: false }));
    }
  };

  const handleInputChange = (field: keyof PatientVital, value: string) => {
    const newVitals = { ...currentVitals, [field]: value };
    
    if (field === 'Height' || field === 'Weight') {
      const height = field === 'Height' ? parseFloat(value) : parseFloat(newVitals.Height || '0');
      const weight = field === 'Weight' ? parseFloat(value) : parseFloat(newVitals.Weight || '0');
      
      if (height > 0 && weight > 0) {
        const heightMeters = height / 100;
        const bmi = (weight / (heightMeters * heightMeters)).toFixed(1);
        newVitals.BMI = bmi;
      } else {
        newVitals.BMI = '';
      }
    }
    
    setCurrentVitals(newVitals);
  };

  const handleQuickNoteSave = () => {
    if (quickNote.trim()) {
      setConsultationForm({
        ...consultationForm,
        consultationNotes: consultationForm.consultationNotes 
          ? `${consultationForm.consultationNotes}\n\nQuick Note: ${quickNote}`
          : `Quick Note: ${quickNote}`
      });
      setQuickNote('');
      setShowQuickNotes(false);
      toast.success('Quick note added to consultation');
    }
  };

  const nextStep = () => {
    if (activeStep < consultationSteps.length - 1) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);
      setConsultationProgress(Math.round((newStep / (consultationSteps.length - 1)) * 100));
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      const newStep = activeStep - 1;
      setActiveStep(newStep);
      setConsultationProgress(Math.round((newStep / (consultationSteps.length - 1)) * 100));
    }
  };

// In ConsultationTab.tsx, wrap handleFormChange with useCallback:
const handleFormChange = useCallback((field: keyof ConsultationFormData, value: any) => {
  setConsultationForm(prev => ({
    ...prev,
    [field]: value
  }));
}, []);

  const formatVitalForDisplay = (vital: PatientVital) => {
    return {
      id: vital.VitalSignID,
      date: new Date(vital.TakenAt).toLocaleString(),
      bp: vital.BloodPressureSystolic && vital.BloodPressureDiastolic 
        ? `${vital.BloodPressureSystolic}/${vital.BloodPressureDiastolic}`
        : 'N/A',
      temp: vital.Temperature ? `${vital.Temperature}°C` : 'N/A',
      pulse: vital.HeartRate ? `${vital.HeartRate} bpm` : 'N/A',
      spo2: vital.OxygenSaturation ? `${vital.OxygenSaturation}%` : 'N/A',
      respiratory: vital.RespiratoryRate ? `${vital.RespiratoryRate} bpm` : 'N/A',
      height: vital.Height ? `${vital.Height} cm` : 'N/A',
      weight: vital.Weight ? `${vital.Weight} kg` : 'N/A',
      bmi: vital.BMI || 'N/A',
      pain: vital.PainLevel ? `Level ${vital.PainLevel}/10` : 'N/A',
      notes: vital.Notes
    };
  };



  const SuccessDialog = () => {
    const getDialogContent = () => {
      switch (successType) {
        case 'vitals':
          return {
            icon: <Activity className="h-12 w-12 text-green-600" />,
            title: "Vital Signs Recorded",
            message: "Patient vitals have been saved to their medical record.",
            bgColor: "bg-green-100",
            textColor: "text-green-800"
          };
        case 'consultation':
          return {
            icon: <Stethoscope className="h-12 w-12 text-blue-600" />,
            title: isConsultationSaved ? "Consultation Updated" : "Consultation Saved",
            message: isConsultationSaved 
              ? "Consultation has been updated successfully." 
              : "Consultation has been saved and patient is ready for prescriptions.",
            bgColor: "bg-blue-100",
            textColor: "text-blue-800"
          };
        case 'allergy':
          return {
            icon: <AlertCircle className="h-12 w-12 text-amber-600" />,
            title: "Allergy Recorded",
            message: "Allergy information has been added to patient's medical history.",
            bgColor: "bg-amber-100",
            textColor: "text-amber-800"
          };
        default:
          return {
            icon: <CheckCircle className="h-12 w-12 text-green-600" />,
            title: "Success!",
            message: successMessage || "Operation completed successfully.",
            bgColor: "bg-green-100",
            textColor: "text-green-800"
          };
      }
    };

    const content = getDialogContent();

    return (
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <div className={`w-20 h-20 ${content.bgColor} rounded-full flex items-center justify-center mb-4`}>
              {content.icon}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h3>
            <p className="text-gray-600 mb-6">{content.message}</p>
            
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                if (successType === 'vitals') {
                  setActiveSubTab('consultation');
                } else if (successType === 'consultation') {
                  setActiveSubTab('prescription');
                }
              }}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  useEffect(() => {
  console.log('Prescription items updated:', prescriptionItems);
}, [prescriptionItems]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Panel - Patient Queue */}
      <PatientQueuePanel 
        todayAppointments={calledPatients}
        selectedPatient={selectedPatient}
        onSelectPatient={setSelectedPatient}
      />

      {/* Main Consultation Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Patient Header Banner */}
        {selectedPatient && selectedPatientData && (
<PatientHeader 
  patientData={selectedPatientData}
  allergiesCount={patientAllergies.filter(a => a.Status === 'active').length}
  onViewHistory={() => {
    console.log('Setting showHistoryDialog to true');
    setShowHistoryDialog(true);
  }}
  onAddQuickNote={() => setShowQuickNotes(true)}
/>
        )}

        {/* Main Content Tabs */}
        {selectedPatient && selectedPatientData ? (
          <Card>
            <ConsultationTabs 
              activeSubTab={activeSubTab}
              onTabChange={(value: string) => setActiveSubTab(value as any)}
            />
            
            <CardContent>
              <Tabs value={activeSubTab} onValueChange={(value: string) => setActiveSubTab(value as any)}>
                {/* CONSULTATION TAB */}
                <TabsContent value="consultation" className="space-y-6">
<ConsultationForm 
  formData={consultationForm}
  onFormChange={handleFormChange}
  activeStep={activeStep}
  consultationSteps={consultationSteps}
  onPrevStep={prevStep}
  onNextStep={nextStep}
  onSaveConsultation={handleSaveConsultation}
  onUpdateConsultation={handleUpdateConsultation} // Make sure this is passed
  onNavigateToVitals={() => setActiveSubTab('vitals')}
  isSaving={savingStates.consultation}
  doctorId={doctorId}
  isConsultationSaved={isConsultationSaved && !isEditingConsultation}
  consultationId={currentConsultationId}
/>
                  
                  {/* Add Edit Button when consultation is saved but not in edit mode */}
                  {isConsultationSaved && !isEditingConsultation && (
                    <div className="flex justify-between items-center pt-4 border-t">

                      
                      <CompleteConsultationButton
                        consultationId={currentConsultationId}
                        patientId={selectedPatient}
                        doctorId={doctorId}
                        isCompleting={isCompletingConsultation}
                        onComplete={handleCompleteConsultation}
                        canComplete={canCompleteConsultation}
                      />
                    </div>
                  )}
                  
                  {/* Complete Button when not saved or in edit mode */}
                  {(!isConsultationSaved || isEditingConsultation) && (
                    <div className="flex justify-end pt-4 border-t">
                      <CompleteConsultationButton
                        consultationId={currentConsultationId}
                        patientId={selectedPatient}
                        doctorId={doctorId}
                        isCompleting={isCompletingConsultation}
                        onComplete={handleCompleteConsultation}
                        canComplete={canCompleteConsultation}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* VITALS TAB */}
                <TabsContent value="vitals" className="space-y-6">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Blood Pressure
                      </Label>
                      <Input
                        placeholder="120/80"
                        value={currentVitals.BloodPressure}
                        onChange={(e) => handleInputChange('BloodPressure', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">systolic/diastolic mmHg</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Temperature
                      </Label>
                      <Input
                        placeholder="37.0"
                        value={currentVitals.Temperature}
                        onChange={(e) => handleInputChange('Temperature', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">°C</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Heart Rate
                      </Label>
                      <Input
                        placeholder="72"
                        value={currentVitals.HeartRate}
                        onChange={(e) => handleInputChange('HeartRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        SpO₂ Level
                      </Label>
                      <Input
                        placeholder="98"
                        value={currentVitals.OxygenSaturation}
                        onChange={(e) => handleInputChange('OxygenSaturation', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Respiratory Rate</Label>
                      <Input
                        placeholder="16"
                        value={currentVitals.RespiratoryRate}
                        onChange={(e) => handleInputChange('RespiratoryRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">breaths/min</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Pain Level (0-10)</Label>
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        max="10"
                        value={currentVitals.PainLevel}
                        onChange={(e) => handleInputChange('PainLevel', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input
                        placeholder="170"
                        value={currentVitals.Height}
                        onChange={(e) => handleInputChange('Height', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        placeholder="70"
                        value={currentVitals.Weight}
                        onChange={(e) => handleInputChange('Weight', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>BMI</Label>
                      <Input
                        placeholder="Auto-calculated"
                        value={currentVitals.BMI}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes on Vital Signs</Label>
                    <Textarea
                      placeholder="Observations about vital signs, patient response, concerns..."
                      rows={3}
                      value={currentVitals.Notes}
                      onChange={(e) => handleInputChange('Notes', e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveSubTab('consultation')}
                    >
                      Back to Consultation
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setCurrentVitals({
                            TakenBy: doctorId || 0,
                            TakenAt: new Date().toISOString(),
                            BloodPressure: '',
                            Temperature: '',
                            HeartRate: '',
                            OxygenSaturation: '',
                            RespiratoryRate: '',
                            Height: '',
                            Weight: '',
                            BMI: '',
                            PainLevel: '',
                            Notes: ''
                          });
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700" 
                        onClick={handleSaveVitals}
                        disabled={!currentVitals.BloodPressure || !currentVitals.Temperature || !currentVitals.HeartRate || savingStates.vitals}
                      >
                        {savingStates.vitals ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Vital Signs'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {patientVitals.length > 0 && (
                    <div className="pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Vital Signs History</h3>
                        <button
                          onClick={() => setShowVitalHistory(!showVitalHistory)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showVitalHistory ? 'Hide History' : 'Show History'}
                          <svg
                            className={`w-4 h-4 transition-transform ${showVitalHistory ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {showVitalHistory && (
                        <div className="space-y-3 animate-fadeIn">
                          {patientVitals.slice(0, 3).map((vital, index) => {
                            const formattedVital = formatVitalForDisplay(vital);
                            return (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{formattedVital.date}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      Recorded
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">BP</p>
                                      <p className="text-lg font-semibold text-gray-900">{formattedVital.bp}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Temp</p>
                                      <p className="text-lg font-semibold text-gray-900">{formattedVital.temp}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">HR</p>
                                      <p className="text-lg font-semibold text-gray-900">{formattedVital.pulse}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">SpO₂</p>
                                      <p className="text-lg font-semibold text-gray-900">{formattedVital.spo2}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Resp.</p>
                                      <p className="text-lg font-semibold text-gray-900">{formattedVital.respiratory}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Complete Button at bottom of Vitals Tab */}
                  <div className="flex justify-end pt-4 border-t">
                    <CompleteConsultationButton
                      consultationId={currentConsultationId}
                      patientId={selectedPatient}
                      doctorId={doctorId}
                      isCompleting={isCompletingConsultation}
                      onComplete={handleCompleteConsultation}
                      canComplete={canCompleteConsultation}
                    />
                  </div>
                </TabsContent>

                {/* PRESCRIPTION TAB */}

<TabsContent value="prescription" className="space-y-6">
  {currentConsultationId ? (
    <PrescriptionSubTab 
      selectedPatient={selectedPatientData}
      consultationData={{
        ConsultationID: currentConsultationId,
        Diagnosis: consultationForm.diagnosis,
        TreatmentPlan: consultationForm.treatmentPlan
      }}
      prescriptionItems={prescriptionItems}
      onPrescriptionItemsChange={setPrescriptionItems}
    />
  ) : (
    <div className="text-center py-12">
      <Pill className="size-16 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium">No Active Consultation</p>
      <p className="text-sm mt-2">Please start a consultation first</p>
      <Button 
        onClick={() => setActiveSubTab('consultation')}
        className="mt-4"
      >
        Go to Consultation
      </Button>
    </div>
  )}
  
  {/* Complete Button at bottom of Prescription Tab */}
  <div className="flex justify-end pt-4 border-t">
    <CompleteConsultationButton
      consultationId={currentConsultationId}
      patientId={selectedPatient}
      doctorId={doctorId}
      isCompleting={isCompletingConsultation}
      onComplete={handleCompleteConsultation}
      canComplete={canCompleteConsultation}
    />
  </div>
</TabsContent>

                {/* ALLERGIES TAB */}
                <TabsContent value="allergies" className="space-y-6">
                  <AllergiesTab 
                    allergies={patientAllergies}
                    onSaveAllergy={handleSaveAllergy}
                    onBackToConsultation={() => setActiveSubTab('consultation')}
                    allergyForm={allergyForm}
                    onAllergyFormChange={setAllergyForm}
                    isSaving={savingStates.allergy}
                  />
                  
                  {/* Complete Button at bottom of Allergies Tab */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveSubTab('consultation')}
                    >
                      Back to Consultation
                    </Button>
                    
                    <CompleteConsultationButton
                      consultationId={currentConsultationId}
                      patientId={selectedPatient}
                      doctorId={doctorId}
                      isCompleting={isCompletingConsultation}
                      onComplete={handleCompleteConsultation}
                      canComplete={canCompleteConsultation}
                    />
                  </div>
                </TabsContent>

                {/* SUMMARY TAB */}
{/* SUMMARY TAB */}
<TabsContent value="summary" className="space-y-6">
  <SummaryTab 
    patientData={selectedPatientData}
    vitals={patientVitals}
    consultationForm={consultationForm}
    consultationId={currentConsultationId}
    
    // ADD THESE NEW PROPS:
    prescriptions={prescriptionItems}  // Add prescription data
    allergies={patientAllergies}        // Add allergy data
    medicalConditions={patientMedicalConditions}  // Add medical conditions
    visits={patientVisits}              // Add visit history

    
    
    onBackToConsultation={() => setActiveSubTab('consultation')}
  />
  
  {/* Complete Button at bottom of Summary Tab */}
  <div className="flex justify-between items-center pt-4 border-t">
    <Button 
      variant="outline" 
      onClick={() => setActiveSubTab('consultation')}
    >
      Back to Consultation
    </Button>
    
    <div className="flex gap-3">
      <Button 
        variant="outline"
        onClick={() => setActiveSubTab('prescription')}
      >
        Go to Prescription
      </Button>
      <CompleteConsultationButton
        consultationId={currentConsultationId}
        patientId={selectedPatient}
        doctorId={doctorId}
        isCompleting={isCompletingConsultation}
        onComplete={handleCompleteConsultation}
        canComplete={canCompleteConsultation}
      />
    </div>
  </div>
</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Stethoscope className="size-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Patient Selected</p>
                <p className="text-sm mt-2">Select a patient from the queue to begin consultation</p>
                <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="p-3 border rounded-lg">
                    <ClipboardList className="size-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-xs">Consultation</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Activity className="size-8 mx-auto mb-2 text-green-500" />
                    <p className="text-xs">Vital Signs</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Pill className="size-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-xs">Prescription</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Notes Dialog */}
      <Dialog open={showQuickNotes} onOpenChange={setShowQuickNotes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Clinical Note</DialogTitle>
            <DialogDescription>
              Add a quick note for {selectedPatientData?.Name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your clinical note..."
              rows={4}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleQuickNoteSave}>Add Note</Button>
              <Button variant="outline" onClick={() => setShowQuickNotes(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog />

        {showHistoryDialog && (
  <HistoryDialog
    open={showHistoryDialog}
    onOpenChange={setShowHistoryDialog}
    patientId={selectedPatient}
    patientData={selectedPatientData}
  />
)}
    </div>
  );
}