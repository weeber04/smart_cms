import { useState, useEffect } from 'react';
import { Stethoscope, ClipboardList, Calendar, Users, FileText, User } from 'lucide-react';
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

export function ConsultationTab({ doctorId, doctorProfile, todayAppointments, setTodayAppointments }: ConsultationTabProps) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [showAssignNurse, setShowAssignNurse] = useState(false);
  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false);
  const [showOrderTests, setShowOrderTests] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  // Fetch patient details when selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/doctor/patient/${patientId}`);
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

      const response = await fetch("http://localhost:3001/api/doctor/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultationData)
      });

      const result = await response.json();

      if (response.ok) {
        setConsultationSaved(true);
        setTimeout(() => setConsultationSaved(false), 3000);
        
        // Clear form
        ['symptoms', 'diagnosis', 'prescription', 'notes'].forEach(id => {
          const element = document.getElementById(id) as HTMLTextAreaElement;
          if (element) element.value = '';
        });
        
        // Refresh appointments list
        const appointmentsRes = await fetch(`http://localhost:3001/api/doctor/appointments/${doctorId}`);
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

  const handlePrintPrescription = () => {
    setShowPrintPreview(true);
  };

  const handleScheduleFollowUp = async (followUpData: any) => {
    if (!doctorId || !selectedPatient) return;

    try {
      const response = await fetch("http://localhost:3001/api/doctor/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Today's Appointments */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Today's Appointments
          </CardTitle>
          <CardDescription>{todayAppointments.length} patients scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedPatient === appointment.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPatient(appointment.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-900">{appointment.name}</p>
                    <p className="text-xs text-gray-500">{appointment.time}</p>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'in-progress'
                        ? 'default'
                        : appointment.status === 'waiting'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={
                      appointment.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'waiting'
                        ? 'bg-orange-100 text-orange-800'
                        : ''
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{appointment.type}</p>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="size-12 mx-auto mb-3 text-gray-400" />
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consultation Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Patient Consultation
          </CardTitle>
          <CardDescription>
            {selectedPatient
              ? `Recording consultation for ${todayAppointments.find(a => a.id === selectedPatient)?.name}`
              : 'Select a patient to begin consultation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Name</Label>
                  <Input
                    value={todayAppointments.find(a => a.id === selectedPatient)?.name || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <Input
                    value={todayAppointments.find(a => a.id === selectedPatient)?.type || ''}
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
                <Button variant="outline" onClick={() => {
                  setShowPatientDetails(true);
                }}>
                  <User className="size-4 mr-2" />
                  View Full Record
                </Button>
                <Button variant="outline" onClick={() => setShowScheduleFollowUp(true)}>
                  <Calendar className="size-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button variant="outline" onClick={() => setShowAssignNurse(true)}>
                  <Users className="size-4 mr-2" />
                  Assign to Nurse
                </Button>
                <Button variant="outline" onClick={() => setShowOrderTests(true)}>
                  <FileText className="size-4 mr-2" />
                  Order Lab Tests
                </Button>
                <Button variant="outline" onClick={() => setShowReferral(true)}>
                  <Users className="size-4 mr-2" />
                  Create Referral
                </Button>
              </div>
              {consultationSaved && (
                <div className="mt-3 text-sm text-green-500">
                  Consultation saved successfully!
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Stethoscope className="size-12 mx-auto mb-3 text-gray-400" />
              <p>Select a patient from today's appointments to begin consultation</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PatientDetailsModal
        open={showPatientDetails}
        onOpenChange={setShowPatientDetails}
        patient={selectedPatientData}
      />

      {/* Assign to Nurse Dialog */}
      <Dialog open={showAssignNurse} onOpenChange={setShowAssignNurse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Patient to Nurse</DialogTitle>
            <DialogDescription>
              Assign {todayAppointments.find(a => a.id === selectedPatient)?.name} to a nurse for care
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nurse">Select Nurse</Label>
              <Select>
                <SelectTrigger id="nurse">
                  <SelectValue placeholder="Choose a nurse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emily">Emily White - General Care</SelectItem>
                  <SelectItem value="maria">Maria Garcia - ICU</SelectItem>
                  <SelectItem value="james">James Wilson - Cardiology</SelectItem>
                  <SelectItem value="sarah">Sarah Brown - Pediatrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Care Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Special instructions for nursing care..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Assign Patient
              </Button>
              <Button variant="outline" onClick={() => setShowAssignNurse(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleFollowUp} onOpenChange={setShowScheduleFollowUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Appointment</DialogTitle>
            <DialogDescription>
              Schedule a follow-up for {todayAppointments.find(a => a.id === selectedPatient)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followup-date">Date</Label>
                <Input id="followup-date" type="date" />
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
              Order lab tests for {todayAppointments.find(a => a.id === selectedPatient)?.name}
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

      {/* Create Referral Dialog */}
      <Dialog open={showReferral} onOpenChange={setShowReferral}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral</DialogTitle>
            <DialogDescription>
              Refer {todayAppointments.find(a => a.id === selectedPatient)?.name} to a specialist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Select>
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="gastro">Gastroenterology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Referral</Label>
              <Textarea
                id="reason"
                placeholder="Clinical findings and reason for referral..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                Create Referral
              </Button>
              <Button variant="outline" onClick={() => setShowReferral(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Prescription</DialogTitle>
            <DialogDescription>Prescription preview</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
              <div className="text-center mb-4 pb-4 border-b">
                <h3 className="text-lg">HealthCare Clinic</h3>
                <p className="text-sm text-gray-600">123 Medical Center Dr, Suite 100</p>
                <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
              </div>
              <div className="mb-4">
                <p className="text-sm"><span className="font-medium">Patient:</span> {todayAppointments.find(a => a.id === selectedPatient)?.name}</p>
                <p className="text-sm"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Doctor:</span> {doctorProfile?.Name}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Rx</p>
                <p className="text-sm mb-2">Medication details will be printed here</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{doctorProfile?.Name}, MD</p>
                <p className="text-sm text-gray-600">License #: 12345</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                alert('Printing prescription...');
                setShowPrintPreview(false);
              }}>
                Print
              </Button>
              <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}