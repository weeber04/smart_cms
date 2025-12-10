// VitalSignsTab.tsx
import { useState } from 'react';
import { Activity, Heart, Thermometer, Droplet, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface PatientData {
  id: number;
  name: string;
  room: string;
  condition: string;
  lastVitals?: {
    bp: string;
    temp: string;
    pulse: string;
    spo2: string;
    date: string;
  };
  vitalsHistory?: Array<{
    bp: string;
    temp: string;
    pulse: string;
    spo2: string;
    date: string;
    notes?: string;
  }>;
}

export function VitalSignsTab() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [patientsData, setPatientsData] = useState<PatientData[]>([]);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [currentVitals, setCurrentVitals] = useState({
    bp: '',
    temp: '',
    pulse: '',
    spo2: '',
    notes: ''
  });

  // This will be populated from API data
  const todayPatients = patientsData;

  const handleSaveVitals = () => {
    if (!selectedPatient) return;
    
    setVitalsSaved(true);
    setTimeout(() => setVitalsSaved(false), 3000);
    
    // Here you would call your API to save vitals
    console.log('Saving vitals for patient:', selectedPatient, currentVitals);
  };

  const handleInputChange = (field: string, value: string) => {
    setCurrentVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch patient data (you'll implement this with useEffect)
  // useEffect(() => {
  //   const fetchPatientData = async () => {
  //     try {
  //       const response = await fetch('http://localhost:3001/api/doctor/patients');
  //       const data = await response.json();
  //       setPatientsData(data);
  //     } catch (error) {
  //       console.error('Error fetching patient data:', error);
  //     }
  //   };
  //   fetchPatientData();
  // }, []);

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
            {todayPatients.length > 0 ? (
              todayPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPatient === patient.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-500">Room {patient.room}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        patient.condition === 'Stable'
                          ? 'bg-green-100 text-green-800'
                          : patient.condition === 'Monitoring'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {patient.condition}
                    </Badge>
                  </div>
                  {patient.lastVitals && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Last Vitals ({patient.lastVitals.date})</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-600">BP</p>
                          <p className="text-sm text-gray-900">{patient.lastVitals.bp}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Temp</p>
                          <p className="text-sm text-gray-900">{patient.lastVitals.temp}</p>
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
            {selectedPatient && patientsData.find(p => p.id === selectedPatient)
              ? `Viewing vitals for ${patientsData.find(p => p.id === selectedPatient)?.name}`
              : 'Select a patient to view and record vital signs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient && patientsData.find(p => p.id === selectedPatient) ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bp" className="flex items-center gap-2">
                    <Droplet className="size-4 text-red-500" />
                    Blood Pressure
                  </Label>
                  <Input
                    id="bp"
                    placeholder="120/80"
                    value={currentVitals.bp}
                    onChange={(e) => handleInputChange('bp', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temp" className="flex items-center gap-2">
                    <Thermometer className="size-4 text-orange-500" />
                    Temperature
                  </Label>
                  <Input
                    id="temp"
                    placeholder="98.6°F"
                    value={currentVitals.temp}
                    onChange={(e) => handleInputChange('temp', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pulse" className="flex items-center gap-2">
                    <Heart className="size-4 text-pink-500" />
                    Pulse Rate
                  </Label>
                  <Input
                    id="pulse"
                    placeholder="72 bpm"
                    value={currentVitals.pulse}
                    onChange={(e) => handleInputChange('pulse', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spo2" className="flex items-center gap-2">
                    <Wind className="size-4 text-blue-500" />
                    SpO2 Level
                  </Label>
                  <Input
                    id="spo2"
                    placeholder="98%"
                    value={currentVitals.spo2}
                    onChange={(e) => handleInputChange('spo2', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Doctor's Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add observations, assessment, or follow-up instructions..."
                  rows={3}
                  value={currentVitals.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={handleSaveVitals}
                  disabled={!currentVitals.bp || !currentVitals.temp}
                >
                  Save Vital Signs & Notes
                </Button>
                <Button variant="outline">
                  View Full Medical History
                </Button>
              </div>
              
              {vitalsSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  Vital signs and notes saved successfully!
                </div>
              )}

              {/* Vital History */}
              <div className="pt-6 border-t">
                <h3 className="text-sm text-gray-900 mb-3">Recent Vital Signs History</h3>
                <div className="space-y-3">
                  {patientsData.find(p => p.id === selectedPatient)?.vitalsHistory?.map((vital, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-600">{vital.date}</p>
                        <Badge variant="outline" className="text-xs">
                          Recorded
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-gray-600">BP</p>
                          <p className="text-sm text-gray-900">{vital.bp}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Temp</p>
                          <p className="text-sm text-gray-900">{vital.temp}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Pulse</p>
                          <p className="text-sm text-gray-900">{vital.pulse}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">SpO2</p>
                          <p className="text-sm text-gray-900">{vital.spo2}</p>
                        </div>
                      </div>
                      {vital.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Notes:</p>
                          <p className="text-xs text-gray-800">{vital.notes}</p>
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="size-8 mx-auto mb-2 text-gray-400" />
                      <p>No vital signs history available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Heart className="size-12 mx-auto mb-3 text-gray-400" />
              <p>Select a patient to view and record vital signs</p>
              <p className="text-sm mt-1">Patient data will be loaded from the database</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}