import { useState, useEffect } from 'react';
import { Stethoscope, ClipboardList, Calendar, FileText, User, Activity, Heart, Thermometer, Droplet, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { PatientDetailsModal } from '../PatientDetailsModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ConsultationTabProps {
  doctorId: number | null;
  doctorProfile: any;
  todayAppointments: any[];
  setTodayAppointments: (appointments: any[]) => void;
}

interface PatientVital {
  VitalSignID?: number;
  ConsultationID?: number;
  TakenBy: number;
  TakenAt: string;
  BloodPressureSystolic?: string;
  BloodPressureDiastolic?: string;
  BloodPressure?: string;
  HeartRate?: string;
  RespiratoryRate?: string;
  Temperature?: string;
  OxygenSaturation?: string;
  Height?: string;
  Weight?: string;
  BMI?: string;
  PainLevel?: string;
  Notes?: string;
}

interface PatientData {
  PatientID: number;
  Name: string;
  age?: number;
  Gender: string;
  BloodType?: string;
}

export function ConsultationTab({ doctorId, doctorProfile, todayAppointments, setTodayAppointments }: ConsultationTabProps) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'consultation' | 'vitals'>('consultation');
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false);
  const [showOrderTests, setShowOrderTests] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<PatientData | null>(null);
  const [patientVitals, setPatientVitals] = useState<PatientVital[]>([]);
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

  // Fetch patient details when selected
  useEffect(() => {
    if (selectedPatient && doctorId) {
      fetchPatientDetails(selectedPatient);
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
    }
  }, [selectedPatient, doctorId]);

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

  const handleSaveConsultation = async () => {
    if (!selectedPatient || !doctorId) {
      alert('Please select a patient first');
      return;
    }

    try {
      const consultationData = {
        appointmentId: selectedPatient,
        doctorId: doctorId,
        patientId: selectedPatient,
        symptoms: (document.getElementById('symptoms') as HTMLTextAreaElement)?.value || '',
        diagnosis: (document.getElementById('diagnosis') as HTMLTextAreaElement)?.value || '',
        treatment: (document.getElementById('prescription') as HTMLTextAreaElement)?.value || '',
        notes: (document.getElementById('notes') as HTMLTextAreaElement)?.value || ''
      };

      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/doctor/consultation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consultationData)
      });

      const result = await response.json();

      if (response.ok) {
        setConsultationSaved(true);
        setTimeout(() => setConsultationSaved(false), 3000);
        
        ['symptoms', 'diagnosis', 'prescription', 'notes'].forEach(id => {
          const element = document.getElementById(id) as HTMLTextAreaElement;
          if (element) element.value = '';
        });
        
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
      } else {
        alert(result.error || 'Failed to save consultation');
      }
    } catch (error) {
      console.error("Consultation save error:", error);
      alert("Failed to save consultation. Please try again.");
    }
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient || !doctorId || !selectedPatientData) {
      alert('Please select a patient first');
      return;
    }

    if (!currentVitals.BloodPressure || !currentVitals.Temperature || !currentVitals.HeartRate) {
      alert('Please fill in at least Blood Pressure, Temperature, and Heart Rate');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const visitResponse = await fetch(`http://localhost:3001/api/doctor/patient/${selectedPatient}/active-visit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let consultationId = null;
      
      if (visitResponse.ok) {
        const visitData = await visitResponse.json();
        consultationId = visitData.ConsultationID;
      } else {
        const createVisitData = {
          patientId: selectedPatient,
          doctorId: doctorId,
          visitType: 'walk-in',
          visitNotes: 'Vital signs recording'
        };

        const visitCreateRes = await fetch("http://localhost:3001/api/doctor/create-visit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(createVisitData)
        });

        if (visitCreateRes.ok) {
          const visitResult = await visitCreateRes.json();
          consultationId = visitResult.ConsultationID;
        }
      }

      const bpParts = currentVitals.BloodPressure.split('/');
      const vitalData = {
        patientId: selectedPatient,
        doctorId: doctorId,
        consultationId: consultationId,
        bloodPressureSystolic: bpParts[0]?.trim(),
        bloodPressureDiastolic: bpParts[1]?.trim(),
        temperature: currentVitals.Temperature,
        heartRate: currentVitals.HeartRate,
        oxygenSaturation: currentVitals.OxygenSaturation,
        respiratoryRate: currentVitals.RespiratoryRate,
        height: currentVitals.Height,
        weight: currentVitals.Weight,
        bmi: currentVitals.BMI,
        painLevel: currentVitals.PainLevel,
        notes: currentVitals.Notes
      };

      const response = await fetch("http://localhost:3001/api/doctor/vital-signs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vitalData)
      });

      const result = await response.json();

      if (response.ok) {
        setVitalsSaved(true);
        setTimeout(() => setVitalsSaved(false), 3000);
        
        fetchPatientVitals(selectedPatient);
        
        setCurrentVitals(prev => ({
          ...prev,
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
        }));
      } else {
        alert(result.error || 'Failed to save vital signs');
      }
    } catch (error) {
      console.error("Vitals save error:", error);
      alert("Failed to save vital signs. Please try again.");
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

  const handlePrintPrescription = () => {
    setShowPrintPreview(true);
  };

  const handleScheduleFollowUp = async (followUpData: any) => {
    if (!doctorId || !selectedPatient) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/doctor/follow-up", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...followUpData,
          patientId: selectedPatient,
          doctorId: doctorId,
          createdBy: doctorId
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Follow-up scheduled successfully!');
        setShowScheduleFollowUp(false);
      } else {
        alert(result.error || 'Failed to schedule follow-up');
      }
    } catch (error) {
      console.error("Follow-up error:", error);
      alert("Failed to schedule follow-up");
    }
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
      {/* Patient List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Today's Patients
          </CardTitle>
          <CardDescription>{todayAppointments.length} patients scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedPatient === appointment.patientId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedPatient(appointment.patientId);
                  setActiveSubTab('consultation');
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-900">{appointment.name}</p>
                    <p className="text-xs text-gray-500">{appointment.time}</p>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'in-consultation'
                        ? 'default'
                        : appointment.status === 'checked-in'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={
                      appointment.status === 'in-consultation'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'checked-in'
                        ? 'bg-green-100 text-green-800'
                        : ''
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{appointment.type}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {appointment.VisitType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {appointment.TriagePriority}
                  </Badge>
                </div>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                <p>No patients scheduled for today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Sub-tabs */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeSubTab === 'consultation' ? (
                  <>
                    <ClipboardList className="size-5" />
                    Patient Consultation
                  </>
                ) : (
                  <>
                    <Activity className="size-5" />
                    Vital Signs
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {selectedPatient && selectedPatientData
                  ? `${selectedPatientData.Name} - ${activeSubTab === 'consultation' ? 'Consultation' : 'Vital Signs Monitoring'}`
                  : 'Select a patient to begin'}
              </CardDescription>
            </div>
            
            {selectedPatient && (
              <div className="flex gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setActiveSubTab('consultation')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    activeSubTab === 'consultation'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Consultation
                </button>
                <button
                  onClick={() => setActiveSubTab('vitals')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    activeSubTab === 'vitals'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Vital Signs
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {selectedPatient && selectedPatientData ? (
            <div className="space-y-4">
              {/* Patient Info Banner */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{selectedPatientData.Name}</p>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs text-gray-600">Age: {selectedPatientData.age || 'N/A'}</p>
                      <p className="text-xs text-gray-600">Gender: {selectedPatientData.Gender === 'M' ? 'Male' : 'Female'}</p>
                      <p className="text-xs text-gray-600">Blood Type: {selectedPatientData.BloodType || 'N/A'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {todayAppointments.find(a => a.patientId === selectedPatient)?.VisitType || 'Regular'}
                  </Badge>
                </div>
              </div>

              {activeSubTab === 'consultation' ? (
                /* Consultation Form */
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input
                        value={selectedPatientData.Name}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Visit Type</Label>
                      <Input
                        value={todayAppointments.find(a => a.patientId === selectedPatient)?.type || 'Consultation'}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Chief Complaint / Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Describe patient's symptoms..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Enter diagnosis..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prescription">Prescription / Treatment Plan</Label>
                    <Textarea
                      id="prescription"
                      placeholder="Medication, dosage, and treatment instructions..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Doctor's Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveConsultation}>
                      Save Consultation
                    </Button>
                    <Button variant="outline" onClick={handlePrintPrescription}>
                      Print Prescription
                    </Button>
                    <Button variant="outline" onClick={() => setShowPatientDetails(true)}>
                      <User className="size-4 mr-2" />
                      View Full Record
                    </Button>
                    <Button variant="outline" onClick={() => setShowScheduleFollowUp(true)}>
                      <Calendar className="size-4 mr-2" />
                      Schedule Follow-up
                    </Button>
                    <Button variant="outline" onClick={() => setShowOrderTests(true)}>
                      <FileText className="size-4 mr-2" />
                      Order Lab Tests
                    </Button>
                  </div>
                  {consultationSaved && (
                    <div className="mt-3 text-sm text-green-500">
                      Consultation saved successfully!
                    </div>
                  )}
                </div>
              ) : (
                /* Vital Signs Form */
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bp" className="flex items-center gap-2">
                        <Droplet className="size-4 text-red-500" />
                        Blood Pressure
                      </Label>
                      <Input
                        id="bp"
                        placeholder="120/80"
                        value={currentVitals.BloodPressure}
                        onChange={(e) => handleInputChange('BloodPressure', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Format: systolic/diastolic</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temp" className="flex items-center gap-2">
                        <Thermometer className="size-4 text-orange-500" />
                        Temperature
                      </Label>
                      <Input
                        id="temp"
                        placeholder="37.0"
                        value={currentVitals.Temperature}
                        onChange={(e) => handleInputChange('Temperature', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">°C</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pulse" className="flex items-center gap-2">
                        <Heart className="size-4 text-pink-500" />
                        Heart Rate
                      </Label>
                      <Input
                        id="pulse"
                        placeholder="72"
                        value={currentVitals.HeartRate}
                        onChange={(e) => handleInputChange('HeartRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">bpm</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spo2" className="flex items-center gap-2">
                        <Wind className="size-4 text-blue-500" />
                        SpO2 Level
                      </Label>
                      <Input
                        id="spo2"
                        placeholder="98"
                        value={currentVitals.OxygenSaturation}
                        onChange={(e) => handleInputChange('OxygenSaturation', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">%</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="respiratory">Respiratory Rate</Label>
                      <Input
                        id="respiratory"
                        placeholder="16"
                        value={currentVitals.RespiratoryRate}
                        onChange={(e) => handleInputChange('RespiratoryRate', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">breaths/min</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pain">Pain Level (0-10)</Label>
                      <Input
                        id="pain"
                        placeholder="0"
                        type="number"
                        min="0"
                        max="10"
                        value={currentVitals.PainLevel}
                        onChange={(e) => handleInputChange('PainLevel', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        placeholder="170"
                        value={currentVitals.Height}
                        onChange={(e) => handleInputChange('Height', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        placeholder="70"
                        value={currentVitals.Weight}
                        onChange={(e) => handleInputChange('Weight', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bmi">BMI</Label>
                      <Input
                        id="bmi"
                        placeholder="24.2"
                        value={currentVitals.BMI}
                        disabled
                      />
                      <p className="text-xs text-gray-500">Auto-calculated</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vital-notes">Notes on Vital Signs</Label>
                    <Textarea
                      id="vital-notes"
                      placeholder="Observations about vital signs, patient response, concerns..."
                      rows={3}
                      value={currentVitals.Notes}
                      onChange={(e) => handleInputChange('Notes', e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700" 
                      onClick={handleSaveVitals}
                      disabled={!currentVitals.BloodPressure || !currentVitals.Temperature || !currentVitals.HeartRate}
                    >
                      Save Vital Signs
                    </Button>
                    <Button variant="outline" onClick={() => setActiveSubTab('consultation')}>
                      Go to Consultation
                    </Button>
                    <Button variant="outline" onClick={() => setShowPatientDetails(true)}>
                      View Patient History
                    </Button>
                  </div>
                  
                  {vitalsSaved && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                      Vital signs saved successfully!
                    </div>
                  )}

                  {/* Recent Vital Signs History */}
                  {patientVitals.length > 0 && (
                    <div className="pt-6 border-t">
                      <h3 className="text-sm text-gray-900 mb-3">Recent Vital Signs History</h3>
                      <div className="space-y-3">
                        {patientVitals.map((vital, index) => {
                          const formattedVital = formatVitalForDisplay(vital);
                          return (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-xs text-gray-600">{formattedVital.date}</p>
                                <Badge variant="outline" className="text-xs">
                                  Recorded
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
                                <div>
                                  <p className="text-xs text-gray-600">BP</p>
                                  <p className="text-sm text-gray-900">{formattedVital.bp}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Temp</p>
                                  <p className="text-sm text-gray-900">{formattedVital.temp}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">HR</p>
                                  <p className="text-sm text-gray-900">{formattedVital.pulse}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">SpO2</p>
                                  <p className="text-sm text-gray-900">{formattedVital.spo2}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Resp.</p>
                                  <p className="text-sm text-gray-900">{formattedVital.respiratory}</p>
                                </div>
                              </div>
                              {formattedVital.notes && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mb-1">Notes:</p>
                                  <p className="text-xs text-gray-800">{formattedVital.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Stethoscope className="size-12 mx-auto mb-3 text-gray-400" />
              <p>Select a patient from today's appointments to begin</p>
              <p className="text-sm mt-1">You can switch between Consultation and Vital Signs tabs</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        open={showPatientDetails}
        onOpenChange={setShowPatientDetails}
        patient={selectedPatientData}
      />

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleFollowUp} onOpenChange={setShowScheduleFollowUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Appointment</DialogTitle>
            <DialogDescription>
              Schedule a follow-up for {selectedPatientData?.Name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followup-date">Date</Label>
                <Input 
                  id="followup-date" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followup-time">Time</Label>
                <Input id="followup-time" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-type">Appointment Type</Label>
              <Select>
                <SelectTrigger id="followup-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Regular Check-up</SelectItem>
                  <SelectItem value="test-results">Test Results Review</SelectItem>
                  <SelectItem value="treatment">Treatment Follow-up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-notes">Notes</Label>
              <Textarea
                id="followup-notes"
                placeholder="Reason for follow-up, tests needed, etc..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                const date = (document.getElementById('followup-date') as HTMLInputElement)?.value;
                const time = (document.getElementById('followup-time') as HTMLInputElement)?.value;
                const type = (document.getElementById('followup-type') as HTMLSelectElement)?.value;
                const notes = (document.getElementById('followup-notes') as HTMLTextAreaElement)?.value;
                
                if (date && time && type) {
                  handleScheduleFollowUp({ date, time, type, notes });
                } else {
                  alert('Please fill in all required fields');
                }
              }}>
                Schedule Appointment
              </Button>
              <Button variant="outline" onClick={() => setShowScheduleFollowUp(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Lab Tests Dialog */}
      <Dialog open={showOrderTests} onOpenChange={setShowOrderTests}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Laboratory Tests</DialogTitle>
            <DialogDescription>
              Order lab tests for {selectedPatientData?.Name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Select Tests</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="cbc" className="rounded" />
                  <label htmlFor="cbc" className="text-sm">Complete Blood Count (CBC)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="glucose" className="rounded" />
                  <label htmlFor="glucose" className="text-sm">Blood Glucose</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="lipid" className="rounded" />
                  <label htmlFor="lipid" className="text-sm">Lipid Panel</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="liver" className="rounded" />
                  <label htmlFor="liver" className="text-sm">Liver Function Test</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="kidney" className="rounded" />
                  <label htmlFor="kidney" className="text-sm">Kidney Function Test</label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-instructions">Special Instructions</Label>
              <Textarea
                id="test-instructions"
                placeholder="Fasting required, urgent, etc..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Order Tests
              </Button>
              <Button variant="outline" onClick={() => setShowOrderTests(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}