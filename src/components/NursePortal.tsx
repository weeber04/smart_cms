import { useState } from 'react';
import { Bell, LogOut, Heart, Activity, Thermometer, Droplet, Wind, FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { NotificationPanel } from './NotificationPanel';
import { ProfileModal } from './ProfileModal';
import { PatientDetailsModal } from './PatientDetailsModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function NursePortal({ onSignOut }: { onSignOut: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'medication' | 'rounds'>('vitals');
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const handleSaveVitals = () => {
    setVitalsSaved(true);
    setTimeout(() => setVitalsSaved(false), 3000);
  };

  const handleMarkAsGiven = (index: number) => {
    const updated = [...medicationScheduleList];
    updated[index].status = 'given';
    setMedicationScheduleList(updated);
  };

  const handleAddMedSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // Add new medication schedule
    alert('Medication schedule added successfully!');
    setShowAddMedSchedule(false);
  };

  const handleAddRound = (e: React.FormEvent) => {
    e.preventDefault();
    // Add new nursing round
    alert('Nursing round added successfully!');
    setShowAddRound(false);
  };

  const handleSaveHandover = () => {
    setHandoverSaved(true);
    setTimeout(() => setHandoverSaved(false), 3000);
  };

  const [showAddMedSchedule, setShowAddMedSchedule] = useState(false);
  const [showAddRound, setShowAddRound] = useState(false);
  const [handoverSaved, setHandoverSaved] = useState(false);
  const [nursingRoundsList, setNursingRoundsList] = useState([
    { time: '08:00 AM', task: 'Vital signs check', patients: 4, completed: 2 },
    { time: '10:00 AM', task: 'Medication round', patients: 4, completed: 1 },
    { time: '02:00 PM', task: 'Patient rounds', patients: 4, completed: 0 }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
              <Heart className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">Nurse Portal</h1>
              <p className="text-sm text-gray-500">Vital Signs & Medical Records</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPanel role="nurse" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
              <Avatar>
                <AvatarFallback className="bg-pink-600 text-white">EN</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">Emily White</p>
                <p className="text-xs text-gray-500">Registered Nurse</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onSignOut}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">Patient Care Dashboard</h2>
            <p className="text-sm text-gray-500">Monitor and record patient vital signs</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'vitals'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="size-4 inline mr-2" />
              Vital Signs
            </button>
            <button
              onClick={() => setActiveTab('medication')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'medication'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart className="size-4 inline mr-2" />
              Medication
            </button>
          </div>

          {activeTab === 'vitals' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Patients</CardTitle>
                  <CardDescription>4 patients under care</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedPatient === patient.id
                            ? 'border-pink-500 bg-pink-50'
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
                            variant={patient.condition === 'Hypertension' ? 'default' : 'secondary'}
                            className={
                              patient.condition === 'Hypertension'
                                ? 'bg-green-100 text-green-800'
                                : patient.condition === 'Post-surgery'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {patient.condition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs Input */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="size-5" />
                    Record Vital Signs
                  </CardTitle>
                  <CardDescription>
                    {selectedPatient
                      ? `Recording vitals for ${patientsData[selectedPatient]?.name}`
                      : 'Select a patient to record vital signs'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bp" className="flex items-center gap-2">
                            <Droplet className="size-4 text-red-500" />
                            Blood Pressure
                          </Label>
                          <Input
                            id="bp"
                            placeholder="120/80"
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
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Nursing Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Observations, patient condition, or concerns..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleSaveVitals}>
                          Save Vital Signs
                        </Button>
                        <Button variant="outline" onClick={() => {
                          if (selectedPatient) {
                            setShowPatientDetails(true);
                          }
                        }}>
                          View Full Record
                        </Button>
                      </div>
                      {vitalsSaved && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                          Vital signs saved successfully!
                        </div>
                      )}

                      {/* Vital History */}
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm text-gray-900 mb-3">Recent Vital Signs</h3>
                        <div className="space-y-2">
                          {vitalHistory.map((vital, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <p className="text-xs text-gray-500 mb-2">{vital.date}</p>
                              <div className="grid grid-cols-4 gap-3">
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
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="size-12 mx-auto mb-3 text-gray-400" />
                      <p>Select a patient to record vital signs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'medication' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medication Administration Schedule</CardTitle>
                    <CardDescription>Medications prescribed by doctors - Administer as scheduled</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medicationScheduleList.map((med, index) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg ${
                        med.status === 'given'
                          ? 'border-green-200 bg-green-50'
                          : med.status === 'pending'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm text-gray-900">{med.patient}</p>
                            <Badge variant="outline">{med.time}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">{med.medication}</p>
                          <p className="text-xs text-gray-500 mt-1">Prescribed by: {med.prescribedBy}</p>
                        </div>
                        <Badge
                          className={
                            med.status === 'given'
                              ? 'bg-green-100 text-green-800'
                              : med.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {med.status}
                        </Badge>
                      </div>
                      {med.status !== 'given' && (
                        <Button size="sm" className="w-full mt-2 bg-pink-600 hover:bg-pink-700" onClick={() => handleMarkAsGiven(index)}>
                          Mark as Given
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === ('rounds' as any) && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Today's Nursing Rounds</CardTitle>
                      <CardDescription>Scheduled tasks and patient rounds</CardDescription>
                    </div>
                    <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowAddRound(true)}>
                      <Plus className="size-4 mr-2" />
                      Add Round
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {nursingRoundsList.map((round, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Badge variant="outline">{round.time}</Badge>
                              <p className="text-sm text-gray-900">{round.task}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {round.completed}/{round.patients} patients completed
                            </p>
                          </div>
                          <div className="w-16 h-16">
                            <svg className="transform -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className="stroke-gray-200"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className="stroke-pink-600"
                                strokeWidth="3"
                                strokeDasharray={`${(round.completed / round.patients) * 100}, 100`}
                              />
                            </svg>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Handover Notes</CardTitle>
                  <CardDescription>Important notes for next shift</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter handover notes for the next shift..."
                    rows={5}
                  />
                  <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700" onClick={handleSaveHandover}>
                    Save Handover Notes
                  </Button>
                  {handoverSaved && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                      Handover notes saved successfully!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl text-gray-900 mt-2">4</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="size-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stable</p>
                    <p className="text-2xl text-gray-900 mt-2">2</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="size-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monitoring</p>
                    <p className="text-2xl text-gray-900 mt-2">1</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical</p>
                    <p className="text-2xl text-gray-900 mt-2">1</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="size-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={nurseProfile}
      />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        open={showPatientDetails}
        onOpenChange={setShowPatientDetails}
        patient={selectedPatient ? patientsData[selectedPatient] : patientsData[1]}
      />
    </div>
  );
}
