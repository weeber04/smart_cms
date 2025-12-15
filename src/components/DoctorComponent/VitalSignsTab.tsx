// VitalSignsTab.tsx - FULL UPDATED CODE
import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Droplet, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface VitalSign {
  VitalSignID: number;
  ConsultationID: number;
  TakenBy: number;
  TakenAt: string;
  BloodPressureSystolic: number;
  BloodPressureDiastolic: number;
  HeartRate: number;
  RespiratoryRate: number;
  Temperature: number;
  OxygenSaturation: number;
  Height: number;
  Weight: number;
  BMI: number;
  PainLevel: number;
  Notes: string;
  TakenByName?: string;
}

interface PatientData {
  PatientID: number;
  Name: string;
  VisitID?: number;
  ConsultationID?: number;
  QueueNumber?: string;
  DoctorID?: number;
  VisitStatus?: string;
  vitalSigns?: VitalSign[];
}

export function VitalSignsTab() {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientsData, setPatientsData] = useState<PatientData[]>([]);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [currentVitals, setCurrentVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    height: '',
    weight: '',
    bmi: '',
    painLevel: '',
    notes: ''
  });

  // Fetch patients assigned to the current doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Get current doctor ID from your auth context
        const doctorId = localStorage.getItem('doctorId') || '1';
        
        // First try the queue endpoint
        const response = await fetch(`http://localhost:3001/api/doctor/queue/${doctorId}`);
        const data = await response.json();
        
        if (data.success && data.queue) {
          setPatientsData(data.queue);
        } else if (data.success && data.assignedPatients) {
          // Try the other endpoint format
          setPatientsData(data.assignedPatients);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        
        // Fallback mock data for testing
        setPatientsData([
          {
            PatientID: 1,
            Name: "Test Patient",
            VisitID: 68,
            ConsultationID: 1,
            QueueNumber: "Q-251211-001"
          },
          {
            PatientID: 2,
            Name: "Muhd Aliff",
            QueueNumber: "Q-251211-002"
          }
        ]);
      }
    };
    
    fetchPatients();
  }, []);

  // Fetch vital signs when a patient is selected
  useEffect(() => {
    if (selectedPatient?.PatientID) {
      fetchPatientVitals(selectedPatient.PatientID);
    }
  }, [selectedPatient]);

  const fetchPatientVitals = async (patientId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/doctor/vitals/${patientId}`);
      const data = await response.json();
      
      if (selectedPatient) {
        setSelectedPatient({
          ...selectedPatient,
          vitalSigns: data
        });
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
      
      // Mock data for testing
      if (selectedPatient) {
        setSelectedPatient({
          ...selectedPatient,
          vitalSigns: [
            {
              VitalSignID: 1,
              ConsultationID: 1,
              TakenBy: 9,
              TakenAt: "2025-12-11T18:40:00.000Z",
              BloodPressureSystolic: 120,
              BloodPressureDiastolic: 80,
              HeartRate: 72,
              RespiratoryRate: 16,
              Temperature: 36.8,
              OxygenSaturation: 98,
              Height: 175,
              Weight: 70,
              BMI: 22.9,
              PainLevel: 3,
              Notes: "Patient feels better after medication",
              TakenByName: "Real Doctor"
            }
          ]
        });
      }
    }
  };

  // Calculate BMI if height and weight are provided
  const calculateBMI = () => {
    const height = parseFloat(currentVitals.height);
    const weight = parseFloat(currentVitals.weight);
    
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '';
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setCurrentVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle height and weight changes to auto-calculate BMI
  useEffect(() => {
    const height = parseFloat(currentVitals.height);
    const weight = parseFloat(currentVitals.weight);
    
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      handleInputChange('bmi', bmi.toFixed(1));
    }
  }, [currentVitals.height, currentVitals.weight]);

  const handleSaveVitals = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    
    // Check if patient has a consultation ID
    if (!selectedPatient.ConsultationID) {
      // Try to get consultation ID from visit
      if (selectedPatient.VisitID) {
        try {
          const response = await fetch(`http://localhost:3001/api/doctor/visit/${selectedPatient.VisitID}`);
          const data = await response.json();
          
          if (data.ConsultationID) {
            setSelectedPatient({
              ...selectedPatient,
              ConsultationID: data.ConsultationID
            });
          } else {
            alert('Please start a consultation for this patient first');
            return;
          }
        } catch (error) {
          alert('Unable to check consultation status. Please ensure patient has an active consultation.');
          return;
        }
      } else {
        alert('Please start a consultation for this patient first');
        return;
      }
    }
    
    // Get current doctor/user ID
    const doctorId = localStorage.getItem('userId') || '1';
    
    // Calculate BMI
    const bmi = calculateBMI();
    
    // Prepare vital signs data
    const vitalData = {
      consultationId: selectedPatient.ConsultationID,
      takenBy: doctorId,
      bloodPressureSystolic: currentVitals.bloodPressureSystolic ? parseInt(currentVitals.bloodPressureSystolic) : null,
      bloodPressureDiastolic: currentVitals.bloodPressureDiastolic ? parseInt(currentVitals.bloodPressureDiastolic) : null,
      heartRate: currentVitals.heartRate ? parseInt(currentVitals.heartRate) : null,
      respiratoryRate: currentVitals.respiratoryRate ? parseInt(currentVitals.respiratoryRate) : null,
      temperature: currentVitals.temperature ? parseFloat(currentVitals.temperature) : null,
      oxygenSaturation: currentVitals.oxygenSaturation ? parseFloat(currentVitals.oxygenSaturation) : null,
      height: currentVitals.height ? parseFloat(currentVitals.height) : null,
      weight: currentVitals.weight ? parseFloat(currentVitals.weight) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      painLevel: currentVitals.painLevel ? parseInt(currentVitals.painLevel) : null,
      notes: currentVitals.notes || ''
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/doctor/vitals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vitalData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setVitalsSaved(true);
        setTimeout(() => setVitalsSaved(false), 3000);
        
        // Reset form
        setCurrentVitals({
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          heartRate: '',
          respiratoryRate: '',
          temperature: '',
          oxygenSaturation: '',
          height: '',
          weight: '',
          bmi: '',
          painLevel: '',
          notes: ''
        });
        
        // Refresh vital signs data
        if (selectedPatient?.PatientID) {
          fetchPatientVitals(selectedPatient.PatientID);
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving vitals:', error);
      alert('Failed to save vital signs. Please check your connection.');
    }
  };

  // Format blood pressure for display
  const formatBloodPressure = (systolic: number, diastolic: number) => {
    if (systolic && diastolic) {
      return `${systolic}/${diastolic}`;
    }
    return '--/--';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients Under Care</CardTitle>
          <CardDescription>Patients assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patientsData.length > 0 ? (
              patientsData.map((patient) => (
                <div
                  key={patient.PatientID}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPatient?.PatientID === patient.PatientID
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{patient.Name}</p>
                      {patient.QueueNumber && (
                        <p className="text-xs text-gray-500">Queue: {patient.QueueNumber}</p>
                      )}
                      {patient.VisitID && (
                        <p className="text-xs text-gray-500">Visit ID: {patient.VisitID}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {patient.VisitStatus || 'In Queue'}
                    </Badge>
                  </div>
                  {patient.vitalSigns && patient.vitalSigns.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">
                        Last Vitals ({formatDate(patient.vitalSigns[0].TakenAt)})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-600">BP</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {formatBloodPressure(
                              patient.vitalSigns[0].BloodPressureSystolic,
                              patient.vitalSigns[0].BloodPressureDiastolic
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Temp</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {patient.vitalSigns[0].Temperature}°C
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Heart className="size-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No patients assigned</p>
                <p className="text-xs mt-1">Patients will appear here when assigned to you</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs Input */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Monitor Vital Signs
          </CardTitle>
          <CardDescription>
            {selectedPatient
              ? `Recording vitals for ${selectedPatient.Name}`
              : 'Select a patient to view and record vital signs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Blood Pressure - Systolic */}
                <div className="space-y-2">
                  <Label htmlFor="bloodPressureSystolic" className="flex items-center gap-2">
                    <Droplet className="size-4 text-red-500" />
                    Blood Pressure (Systolic)
                  </Label>
                  <Input
                    id="bloodPressureSystolic"
                    placeholder="120"
                    value={currentVitals.bloodPressureSystolic}
                    onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Top number (mmHg)</p>
                </div>

                {/* Blood Pressure - Diastolic */}
                <div className="space-y-2">
                  <Label htmlFor="bloodPressureDiastolic" className="text-gray-700">
                    Blood Pressure (Diastolic)
                  </Label>
                  <Input
                    id="bloodPressureDiastolic"
                    placeholder="80"
                    value={currentVitals.bloodPressureDiastolic}
                    onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Bottom number (mmHg)</p>
                </div>

                {/* Heart Rate */}
                <div className="space-y-2">
                  <Label htmlFor="heartRate" className="flex items-center gap-2">
                    <Heart className="size-4 text-pink-500" />
                    Heart Rate
                  </Label>
                  <Input
                    id="heartRate"
                    placeholder="72"
                    value={currentVitals.heartRate}
                    onChange={(e) => handleInputChange('heartRate', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Beats per minute</p>
                </div>

                {/* Respiratory Rate */}
                <div className="space-y-2">
                  <Label htmlFor="respiratoryRate" className="text-gray-700">
                    Respiratory Rate
                  </Label>
                  <Input
                    id="respiratoryRate"
                    placeholder="16"
                    value={currentVitals.respiratoryRate}
                    onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Breaths per minute</p>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="flex items-center gap-2">
                    <Thermometer className="size-4 text-orange-500" />
                    Temperature
                  </Label>
                  <Input
                    id="temperature"
                    placeholder="36.8"
                    value={currentVitals.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">°C</p>
                </div>

                {/* Oxygen Saturation */}
                <div className="space-y-2">
                  <Label htmlFor="oxygenSaturation" className="flex items-center gap-2">
                    <Wind className="size-4 text-blue-500" />
                    Oxygen Saturation
                  </Label>
                  <Input
                    id="oxygenSaturation"
                    placeholder="98"
                    value={currentVitals.oxygenSaturation}
                    onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Percentage (%)</p>
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-gray-700">
                    Height
                  </Label>
                  <Input
                    id="height"
                    placeholder="175"
                    value={currentVitals.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Centimeters (cm)</p>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-gray-700">
                    Weight
                  </Label>
                  <Input
                    id="weight"
                    placeholder="70"
                    value={currentVitals.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Kilograms (kg)</p>
                </div>

                {/* Pain Level */}
                <div className="space-y-2">
                  <Label htmlFor="painLevel" className="text-gray-700">
                    Pain Level
                  </Label>
                  <Input
                    id="painLevel"
                    placeholder="3"
                    type="number"
                    min="0"
                    max="10"
                    value={currentVitals.painLevel}
                    onChange={(e) => handleInputChange('painLevel', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Scale of 0-10</p>
                </div>

                {/* BMI (Auto-calculated) */}
                <div className="space-y-2">
                  <Label htmlFor="bmi" className="text-gray-700">
                    BMI
                  </Label>
                  <Input
                    id="bmi"
                    placeholder="Auto-calculated"
                    value={calculateBMI() || currentVitals.bmi}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Auto-calculated from height & weight</p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add observations, assessment, or follow-up instructions..."
                  rows={3}
                  value={currentVitals.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={handleSaveVitals}
                  disabled={!currentVitals.bloodPressureSystolic || !currentVitals.temperature}
                >
                  Save Vital Signs
                </Button>
                <Button variant="outline" onClick={() => {
                  if (selectedPatient?.PatientID) {
                    fetchPatientVitals(selectedPatient.PatientID);
                  }
                }}>
                  Refresh History
                </Button>
              </div>
              
              {/* Success Message */}
              {vitalsSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  ✓ Vital signs saved successfully!
                </div>
              )}

              {/* Vital History */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Vital Signs History</h3>
                <div className="space-y-3">
                  {selectedPatient.vitalSigns && selectedPatient.vitalSigns.length > 0 ? (
                    selectedPatient.vitalSigns.map((vital) => (
                      <div
                        key={vital.VitalSignID}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs text-gray-600">
                            Recorded: {formatDate(vital.TakenAt)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            By {vital.TakenByName || 'Doctor'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                          <div>
                            <p className="text-xs text-gray-600">Blood Pressure</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {formatBloodPressure(vital.BloodPressureSystolic, vital.BloodPressureDiastolic)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Temperature</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {vital.Temperature}°C
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Heart Rate</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {vital.HeartRate} bpm
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">SpO2</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {vital.OxygenSaturation}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Respiratory Rate</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {vital.RespiratoryRate} rpm
                            </p>
                          </div>
                          {vital.Height && (
                            <div>
                              <p className="text-xs text-gray-600">Height</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {vital.Height} cm
                              </p>
                            </div>
                          )}
                          {vital.Weight && (
                            <div>
                              <p className="text-xs text-gray-600">Weight</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {vital.Weight} kg
                              </p>
                            </div>
                          )}
                          {vital.BMI && (
                            <div>
                              <p className="text-xs text-gray-600">BMI</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {vital.BMI}
                              </p>
                            </div>
                          )}
                          {vital.PainLevel > 0 && (
                            <div>
                              <p className="text-xs text-gray-600">Pain Level</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {vital.PainLevel}/10
                              </p>
                            </div>
                          )}
                        </div>
                        {vital.Notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Notes:</p>
                            <p className="text-xs text-gray-800">{vital.Notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="size-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No vital signs recorded yet</p>
                      <p className="text-xs mt-1">Record vital signs above to see history</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Heart className="size-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Select a patient to view and record vital signs</p>
              <p className="text-xs mt-1">Patients are listed on the left panel</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}