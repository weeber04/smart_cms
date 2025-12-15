// PrescriptionTab.tsx - Complete Prescription Management
import { useState, useEffect } from 'react';
import { 
  Pill, Plus, Search, Trash2, Printer, 
  Calendar, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface Drug {
  DrugID: number;
  DrugName: string;
  Category: string;
  UnitPrice: number;
  QuantityInStock: number;
  ExpiryDate: string;
}

interface PrescriptionItem {
  ItemID?: number;
  DrugID: number;
  DrugName: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Instructions: string;
  Quantity: number;
  UnitPrice: number;
  TotalAmount: number;
}

interface PatientData {
  PatientID: number;
  Name: string;
  ICNo: string;
  DOB: string;
  age?: number;
  BloodType?: string;
  Allergies?: string[];
}

interface ConsultationData {
  ConsultationID: number;
  Diagnosis: string;
  TreatmentPlan: string;
}

export function PrescriptionTab() {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showConfirmPrint, setShowConfirmPrint] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);
  
  // New drug form state
  const [newDrug, setNewDrug] = useState({
    DrugID: 0,
    Dosage: '',
    Frequency: 'once daily',
    Duration: '7 days',
    Instructions: '',
    Quantity: 1
  });

  // Filtered drugs based on search
  const filteredDrugs = drugs.filter(drug =>
    drug.DrugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.Category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch patients assigned to doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const doctorId = localStorage.getItem('userId');
        
        const response = await fetch(`http://localhost:3001/api/doctor/patients?doctorId=${doctorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    
    fetchPatients();
  }, []);

  // Fetch drugs inventory
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/doctor/drugs', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDrugs(data);
        }
      } catch (error) {
        console.error('Error fetching drugs:', error);
      }
    };
    
    fetchDrugs();
  }, []);

  // Fetch consultation data when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const fetchConsultationData = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `http://localhost:3001/api/doctor/patient/${selectedPatient.PatientID}/latest-consultation`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            setConsultationData(data);
          }
        } catch (error) {
          console.error('Error fetching consultation:', error);
        }
      };
      
      fetchConsultationData();
      setPrescriptionItems([]); // Clear previous prescription
    }
  }, [selectedPatient]);

  const handleAddDrug = () => {
    const selectedDrug = drugs.find(drug => drug.DrugID === newDrug.DrugID);
    
    if (!selectedDrug) {
      alert('Please select a drug');
      return;
    }
    
    if (!newDrug.Dosage.trim()) {
      alert('Please enter dosage');
      return;
    }
    
    if (selectedDrug.QuantityInStock < newDrug.Quantity) {
      alert(`Insufficient stock. Only ${selectedDrug.QuantityInStock} available.`);
      return;
    }
    
    const newItem: PrescriptionItem = {
      DrugID: selectedDrug.DrugID,
      DrugName: selectedDrug.DrugName,
      Dosage: newDrug.Dosage,
      Frequency: newDrug.Frequency,
      Duration: newDrug.Duration,
      Instructions: newDrug.Instructions,
      Quantity: newDrug.Quantity,
      UnitPrice: selectedDrug.UnitPrice,
      TotalAmount: selectedDrug.UnitPrice * newDrug.Quantity
    };
    
    setPrescriptionItems([...prescriptionItems, newItem]);
    setShowAddDrug(false);
    resetNewDrugForm();
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const resetNewDrugForm = () => {
    setNewDrug({
      DrugID: 0,
      Dosage: '',
      Frequency: 'once daily',
      Duration: '7 days',
      Instructions: '',
      Quantity: 1
    });
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient || !consultationData) {
      alert('Please select a patient with an active consultation');
      return;
    }
    
    if (prescriptionItems.length === 0) {
      alert('Please add at least one medication to the prescription');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const doctorId = localStorage.getItem('userId');
      
      const prescriptionData = {
        patientId: selectedPatient.PatientID,
        doctorId: doctorId,
        consultationId: consultationData.ConsultationID,
        diagnosis: consultationData.Diagnosis,
        treatmentPlan: consultationData.TreatmentPlan,
        items: prescriptionItems
      };
      
      const response = await fetch('http://localhost:3001/api/doctor/prescription/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prescriptionData)
      });
      
      if (response.ok) {
        setPrescriptionSaved(true);
        setTimeout(() => setPrescriptionSaved(false), 3000);
        
        // Generate printable prescription
        handlePrintPrescription();
        
        // Clear prescription items
        setPrescriptionItems([]);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    }
  };

  const handlePrintPrescription = () => {
    if (!selectedPatient || !consultationData) return;
    
    const prescriptionContent = generatePrescriptionContent();
    
    // Create printable window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${selectedPatient.Name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .patient-info { margin-bottom: 30px; }
              .prescription-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .prescription-table th { background-color: #f5f5f5; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #333; }
              .signature { float: right; text-align: center; }
              .warning { color: #dc2626; margin-top: 30px; padding: 10px; background-color: #fef2f2; border: 1px solid #fecaca; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MEDICAL PRESCRIPTION</h1>
              <p>${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="patient-info">
              <h3>Patient Information</h3>
              <p><strong>Name:</strong> ${selectedPatient.Name}</p>
              <p><strong>IC Number:</strong> ${selectedPatient.ICNo}</p>
              <p><strong>Date of Birth:</strong> ${new Date(selectedPatient.DOB).toLocaleDateString()}</p>
              ${selectedPatient.BloodType ? `<p><strong>Blood Type:</strong> ${selectedPatient.BloodType}</p>` : ''}
              ${selectedPatient.Allergies && selectedPatient.Allergies.length > 0 
                ? `<p><strong>Allergies:</strong> ${selectedPatient.Allergies.join(', ')}</p>` 
                : ''}
            </div>
            
            <div>
              <h3>Diagnosis</h3>
              <p>${consultationData.Diagnosis || 'Not specified'}</p>
            </div>
            
            <h3>Medications</h3>
            <table class="prescription-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${prescriptionItems.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.DrugName}</td>
                    <td>${item.Dosage}</td>
                    <td>${item.Frequency}</td>
                    <td>${item.Duration}</td>
                    <td>${item.Instructions || '-'}</td>
                    <td>${item.Quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="warning">
              <h4>⚠️ Important Information</h4>
              <p>• Take medications as prescribed</p>
              <p>• Do not share medications with others</p>
              <p>• Store medications properly</p>
              <p>• Contact doctor if side effects occur</p>
            </div>
            
            <div class="footer">
              <div class="signature">
                <p>___________________________</p>
                <p><strong>Dr. [Doctor Name]</strong></p>
                <p>License No: [License Number]</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="clear"></div>
            </div>
            
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()">Print Prescription</button>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      setShowConfirmPrint(false);
    }
  };

  const generatePrescriptionContent = () => {
    // Generate content for print
    return '';
  };

  const calculateTotal = () => {
    return prescriptionItems.reduce((sum, item) => sum + item.TotalAmount, 0);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Patient Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="size-5" />
            Prescribe Medications
          </CardTitle>
          <CardDescription>Select a patient to prescribe medication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Patients</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by name or IC..."
                  className="pl-10"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {patients.filter(p => 
                p.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.ICNo.includes(searchTerm)
              ).map((patient) => (
                <div
                  key={patient.PatientID}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPatient?.PatientID === patient.PatientID
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{patient.Name}</p>
                      <p className="text-xs text-gray-500">{patient.ICNo}</p>
                    </div>
                    {patient.Allergies && patient.Allergies.length > 0 && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        Allergies
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="size-3" />
                    <span>DOB: {new Date(patient.DOB).toLocaleDateString()}</span>
                  </div>
                  {patient.BloodType && (
                    <div className="mt-1 text-xs text-gray-600">
                      Blood Type: {patient.BloodType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Management */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedPatient ? `Prescription for ${selectedPatient.Name}` : 'Prescription Management'}
          </CardTitle>
          <CardDescription>
            {selectedPatient 
              ? 'Add medications, set dosage, and create prescription'
              : 'Select a patient to create prescription'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Consultation Info */}
              {consultationData && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-gray-900 mb-2">Current Consultation</h3>
                  <p className="text-sm text-gray-700">
                    <strong>Diagnosis:</strong> {consultationData.Diagnosis || 'Not specified'}
                  </p>
                  {consultationData.TreatmentPlan && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Treatment Plan:</strong> {consultationData.TreatmentPlan}
                    </p>
                  )}
                </div>
              )}

              {/* Current Prescription Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Medications</h3>
                  <Button 
                    onClick={() => setShowAddDrug(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="size-4" />
                    Add Medication
                  </Button>
                </div>
                
                {prescriptionItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptionItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.DrugName}</TableCell>
                            <TableCell>{item.Dosage}</TableCell>
                            <TableCell>{item.Frequency}</TableCell>
                            <TableCell>{item.Duration}</TableCell>
                            <TableCell>{item.Instructions || '-'}</TableCell>
                            <TableCell>{item.Quantity}</TableCell>
                            <TableCell>RM{item.TotalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePrescriptionItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {prescriptionItems.length > 0 && (
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">Total Items: {prescriptionItems.length}</p>
                            <p className="text-sm text-gray-600">Total Quantity: {prescriptionItems.reduce((sum, item) => sum + item.Quantity, 0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              Total: RM{calculateTotal().toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Pill className="size-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">No medications added</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Medication" to start prescription</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button 
                  onClick={handleSavePrescription}
                  disabled={prescriptionItems.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="size-4 mr-2" />
                  Save & Print Prescription
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowConfirmPrint(true)}
                  disabled={prescriptionItems.length === 0}
                >
                  <Printer className="size-4 mr-2" />
                  Preview & Print
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setPrescriptionItems([]);
                    setSelectedPatient(null);
                  }}
                >
                  Clear All
                </Button>
              </div>
              
              {prescriptionSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  ✓ Prescription saved and printed successfully!
                </div>
              )}

              {/* Patient Allergy Warning */}
              {selectedPatient.Allergies && selectedPatient.Allergies.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">⚠️ Patient Allergies Alert</p>
                      <p className="text-sm text-red-700 mt-1">
                        This patient has recorded allergies: {selectedPatient.Allergies.join(', ')}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        Please verify medication compatibility before prescribing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Pill className="size-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Select a patient to create prescription</p>
              <p className="text-xs mt-1">Patients are listed on the left panel</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Drug Dialog */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>
              Search and add medication to prescription
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drug Search */}
            <div className="space-y-2">
              <Label>Search Medications</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by drug name or category..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Drug Selection */}
            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
              {filteredDrugs.length > 0 ? (
                <div className="divide-y">
                  {filteredDrugs.map((drug) => (
                    <div
                      key={drug.DrugID}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        newDrug.DrugID === drug.DrugID ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setNewDrug({ ...newDrug, DrugID: drug.DrugID })}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{drug.DrugName}</p>
                          <p className="text-sm text-gray-600">{drug.Category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">RM{drug.UnitPrice.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            Stock: {drug.QuantityInStock}
                          </p>
                          {drug.ExpiryDate && (
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(drug.ExpiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No medications found</p>
                </div>
              )}
            </div>

            {/* Dosage Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  placeholder="e.g., 500mg, 1 tablet"
                  value={newDrug.Dosage}
                  onChange={(e) => setNewDrug({ ...newDrug, Dosage: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newDrug.Frequency}
                  onValueChange={(value) => setNewDrug({ ...newDrug, Frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once daily">Once Daily</SelectItem>
                    <SelectItem value="twice daily">Twice Daily</SelectItem>
                    <SelectItem value="three times daily">Three Times Daily</SelectItem>
                    <SelectItem value="four times daily">Four Times Daily</SelectItem>
                    <SelectItem value="as needed">As Needed</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="every 6 hours">Every 6 Hours</SelectItem>
                    <SelectItem value="every 8 hours">Every 8 Hours</SelectItem>
                    <SelectItem value="every 12 hours">Every 12 Hours</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={newDrug.Duration}
                  onValueChange={(value) => setNewDrug({ ...newDrug, Duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3 days">3 Days</SelectItem>
                    <SelectItem value="5 days">5 Days</SelectItem>
                    <SelectItem value="7 days">7 Days</SelectItem>
                    <SelectItem value="10 days">10 Days</SelectItem>
                    <SelectItem value="14 days">14 Days</SelectItem>
                    <SelectItem value="1 month">1 Month</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="until finished">Until Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newDrug.Quantity}
                  onChange={(e) => setNewDrug({ ...newDrug, Quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Textarea
                placeholder="e.g., Take with food, Avoid alcohol, etc."
                rows={2}
                value={newDrug.Instructions}
                onChange={(e) => setNewDrug({ ...newDrug, Instructions: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button onClick={handleAddDrug}>
                Add to Prescription
              </Button>
              <Button variant="outline" onClick={() => setShowAddDrug(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Print Dialog */}
      <Dialog open={showConfirmPrint} onOpenChange={setShowConfirmPrint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Prescription</DialogTitle>
            <DialogDescription>
              Are you ready to print the prescription for {selectedPatient?.Name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Before printing, please verify:</p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• All medications are correctly prescribed</li>
                    <li>• Dosage and frequency are appropriate</li>
                    <li>• Patient allergies have been checked</li>
                    <li>• Instructions are clear for the patient</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {selectedPatient?.Allergies && selectedPatient.Allergies.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>⚠️ Allergy Alert:</strong> Patient has {selectedPatient.Allergies.length} recorded allergy(ies)
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handlePrintPrescription} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="size-4 mr-2" />
                Print Prescription
              </Button>
              <Button variant="outline" onClick={() => setShowConfirmPrint(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}