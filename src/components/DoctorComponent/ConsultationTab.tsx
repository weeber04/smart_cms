// ConsultationTab.tsx - SIMPLIFIED MAIN FILE
import { useState, useEffect } from 'react';
import { Stethoscope, ClipboardList,Activity, Pill  } from 'lucide-react';
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
  const [currentConsultationId, setCurrentConsultationId] = useState<number | null>(null);
  const [consultationProgress, setConsultationProgress] = useState(0);
  const [quickNote, setQuickNote] = useState('');

  // Consultation form state
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
    });
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

// Call this when component mounts and when consultation is saved
useEffect(() => {
  if (doctorId) {
    fetchCalledPatients();
  }
}, [doctorId]);

  const handleSaveConsultation = async () => {
    if (!selectedPatient || !doctorId) {
      toast.error('Please select a patient first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create or get consultation
      const consultationData = {
        patientId: selectedPatient,
        doctorId: doctorId,
        chiefComplaint: consultationForm.chiefComplaint,
        historyOfPresentIllness: consultationForm.historyOfPresentIllness,
        pastMedicalHistory: consultationForm.pastMedicalHistory,
        socialHistory: JSON.stringify({
          smoking: consultationForm.smoking,
          alcohol: consultationForm.alcohol,
          occupation: consultationForm.occupation
        }),
        reviewOfSystems: JSON.stringify({
          general: consultationForm.generalReview,
          cardiovascular: consultationForm.cardiovascularReview,
          respiratory: consultationForm.respiratoryReview,
          gastrointestinal: consultationForm.gastrointestinalReview,
          neurological: consultationForm.neurologicalReview
        }),
        physicalExamFindings: JSON.stringify({
          generalAppearance: consultationForm.generalAppearance,
          cardiovascular: consultationForm.cardiovascularExam,
          respiratory: consultationForm.respiratoryExam,
          abdominal: consultationForm.abdominalExam,
          neurological: consultationForm.neurologicalExam
        }),
        diagnosis: consultationForm.diagnosis,
        differentialDiagnosis: consultationForm.differentialDiagnosis,
        diagnosisCode: consultationForm.diagnosisCode,
        treatmentPlan: consultationForm.treatmentPlan,
        medicationPlan: consultationForm.medicationPlan,
        nonMedicationPlan: consultationForm.nonMedicationPlan,
        patientEducation: consultationForm.patientEducation,
        lifestyleAdvice: consultationForm.lifestyleAdvice,
        warningSigns: consultationForm.warningSigns,
        consultationNotes: consultationForm.consultationNotes,
        followUpInstructions: consultationForm.followUpInstructions,
        followUpDate: consultationForm.followUpDate || null,
        disposition: consultationForm.disposition,
        referralNeeded: consultationForm.referralNeeded,
        referralNotes: consultationForm.referralNotes,
        severity: consultationForm.severityAssessment
      };

      const response = await fetch("http://localhost:3001/api/doctor/save-consultation-full", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consultationData)
      });

      const result = await response.json();

      if (response.ok) {
        if (result.consultationId) {
          setCurrentConsultationId(result.consultationId);
        }
        
        setConsultationProgress(100);
        
        toast.success('Consultation saved successfully!');
        
        // Refresh appointments
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
        
        // Auto-navigate to prescription tab
        setActiveSubTab('prescription');
      } else {
        toast.error(result.error || 'Failed to save consultation');
      }
    } catch (error) {
      console.error("Consultation save error:", error);
      toast.error("Failed to save consultation. Please try again.");
    }
  };

  const handleSaveAllergy = async (allergyData: any) => {
    if (!selectedPatient || !doctorId) {
      toast.error('Please select a patient first');
      return;
    }

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
        toast.success('Allergy recorded successfully!');
        fetchPatientAllergies(selectedPatient);
      } else {
        toast.error(result.error || 'Failed to save allergy');
      }
    } catch (error) {
      console.error("Allergy save error:", error);
      toast.error("Failed to save allergy. Please try again.");
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

    try {
      const token = localStorage.getItem('token');
      
      // Parse blood pressure
      const bpParts = currentVitals.BloodPressure.split('/');
      const systolic = bpParts[0]?.trim();
      const diastolic = bpParts[1]?.trim();

      // Get or create consultation for vital signs
      let consultationId = null;
      
      // Try to get active consultation
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

      // Prepare vital signs data
      const vitalData = {
        consultationId: consultationId,
        takenBy: doctorId,
        bloodPressureSystolic: systolic || null,
        bloodPressureDiastolic: diastolic || null,
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

      // Save vital signs
      const response = await fetch("http://localhost:3001/api/doctor/save-vital-signs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vitalData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Vital signs saved successfully!');
        
        // Refresh vitals list
        fetchPatientVitals(selectedPatient);
        
        // Reset form
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
        
        // Auto-progress to next step
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

  const handleFormChange = (field: string, value: any) => {
    setConsultationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Panel - Patient Queue */}
<PatientQueuePanel 
  todayAppointments={calledPatients}  // ← Changed from todayAppointments
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
            onViewHistory={() => {/* Implement history view */}}
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
                    onNavigateToVitals={() => setActiveSubTab('vitals')}
                  />
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
                        disabled={!currentVitals.BloodPressure || !currentVitals.Temperature || !currentVitals.HeartRate}
                      >
                        Save Vital Signs
                      </Button>
                    </div>
                  </div>
                  
                  {patientVitals.length > 0 && (
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Recent Vital Signs History</h3>
                      <div className="space-y-3">
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
                    </div>
                  )}
                </TabsContent>

                {/* PRESCRIPTION TAB */}

<TabsContent value="prescription" className="space-y-6">
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
</TabsContent>

                {/* ALLERGIES TAB */}
<TabsContent value="allergies" className="space-y-6">
  <AllergiesTab 
    allergies={patientAllergies}
    onSaveAllergy={handleSaveAllergy}
    onBackToConsultation={() => setActiveSubTab('consultation')}
    allergyForm={allergyForm} // Add this
    onAllergyFormChange={setAllergyForm} // Add this
  />
</TabsContent>

                {/* SUMMARY TAB */}
                <TabsContent value="summary" className="space-y-6">
                  <SummaryTab 
                    patientData={selectedPatientData}
                    vitals={patientVitals}
                    consultationForm={consultationForm}
                    onBackToConsultation={() => setActiveSubTab('consultation')}
                  />
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
        <Activity className="size-8 mx-auto mb-2 text-green-500" /> {/* Fixed */}
        <p className="text-xs">Vital Signs</p>
      </div>
      <div className="p-3 border rounded-lg">
        <Pill className="size-8 mx-auto mb-2 text-purple-500" /> {/* Fixed */}
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
    </div>
  );
}