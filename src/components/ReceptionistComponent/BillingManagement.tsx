// BillingManagement.tsx
import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, FileText, Search, Filter, Users, Calendar, RefreshCw, X, Eye, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';

interface BillingManagementProps {
  receptionistId: number | null;
  refreshData: () => void;
}

interface BillingRecord {
  BillID: number;
  PatientID: number;
  PatientName: string;
  AppointmentID: number | null;
  ConsultationID: number | null;
  TotalAmount: number;
  AmountDue: number;
  AmountPaid: number;
  InsuranceCoverage: number;
  PatientResponsibility: number;
  BillingDate: string;
  DueDate: string;
  Status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  PaymentMethod: string | null;
  PaymentDate: string | null;
  CreatedBy: number;
}

interface ServiceItem {
  ServiceID: number;
  ServiceName: string;
  Description: string;
  StandardFee: number;
  Category: string;
}

interface BillingItem {
  BillingItemID: number;
  BillID: number;
  ServiceID: number;
  ServiceName: string;
  Quantity: number;
  UnitPrice: number;
  TotalAmount: number;
  Description: string;
}

interface PatientToBill {
  VisitID: number;
  PatientID: number;
  PatientName: string;
  ICNo: string;
  VisitType: string;
  VisitStatus: string;
  ArrivalTime: string;
  ConsultationID: number | null;
  DoctorName: string | null;
  VisitNotes: string | null;
  HasPrescription?: number;
  Medications?: string;
  HasBilling?: number;
}

interface PrescriptionDetails {
  prescriptionId: number;
  itemCount: number;
  medications: string;
}

interface BillSummary {
  consultationFee: number;
  medicationCost: number;
  subtotal: number;
  insuranceCoverage: number;
  patientResponsibility: number;
}

export function BillingManagement({ receptionistId, refreshData }: BillingManagementProps) {
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateForPatient, setShowCreateForPatient] = useState(false);
  const [showBillDetailsDialog, setShowBillDetailsDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientToBill | null>(null);
  const [selectedPatientBillDetails, setSelectedPatientBillDetails] = useState<PatientToBill | null>(null);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [patientsToBill, setPatientsToBill] = useState<PatientToBill[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientToBill[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BillingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [prescriptionDetails, setPrescriptionDetails] = useState<PrescriptionDetails | null>(null);
  const [consultationFee, setConsultationFee] = useState<number>(150.00);
  const [insuranceCoverage, setInsuranceCoverage] = useState<number>(0);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);
  const [patientBillingInfo, setPatientBillingInfo] = useState<any>(null);

  // Load data
  useEffect(() => {
    fetchBillingData();
    fetchServices();
    fetchPatientsToBill();
  }, []);

  // Filter records when search or status changes
  useEffect(() => {
    let filtered = billingRecords;
    
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.PatientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.BillID.toString().includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.Status === statusFilter);
    }
    
    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, billingRecords]);

  // Filter patients to show only those with "to-be-billed" status
  useEffect(() => {
    const filtered = patientsToBill.filter(patient => 
      patient.VisitStatus === 'to-be-billed'
    );
    setFilteredPatients(filtered);
  }, [patientsToBill]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/receptionist/billing");
      if (!response.ok) throw new Error('Failed to fetch billing data');
      
      const data = await response.json();
      setBillingRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error("Error fetching billing data:", error);
      alert("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsToBill = async () => {
    try {
      setLoadingPatients(true);
      const response = await fetch("http://localhost:3001/api/receptionist/patients-to-bill");
      if (!response.ok) throw new Error('Failed to fetch patients to bill');
      
      const data = await response.json();
      setPatientsToBill(data);
    } catch (error) {
      console.error("Error fetching patients to bill:", error);
      alert("Failed to load patients to bill");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPrescriptionDetails = async (consultationId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/receptionist/prescription-details/${consultationId}`);
      if (!response.ok) throw new Error('Failed to fetch prescription details');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching prescription details:", error);
      return null;
    }
  };

  const fetchMedicationCost = async (consultationId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/receptionist/medication-cost/${consultationId}`);
      if (!response.ok) throw new Error('Failed to fetch medication cost');
      
      const data = await response.json();
      return data.totalCost || 0;
    } catch (error) {
      console.error("Error fetching medication cost:", error);
      return 0;
    }
  };

  const fetchPatientBillingInfo = async (patientId: number, consultationId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/receptionist/patient-billing-info/${patientId}/${consultationId}`);
      if (!response.ok) throw new Error('Failed to fetch patient billing info');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching patient billing info:", error);
      return null;
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/receptionist/services");
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      setServices(data);
      
      // Set consultation fee from services (ServiceID 1 should be consultation)
      const consultationService = data.find((service: ServiceItem) => 
        service.ServiceID === 1 || service.ServiceName.toLowerCase().includes('consultation')
      );
      if (consultationService) {
        setConsultationFee(consultationService.StandardFee);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchBillingItems = async (billId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/receptionist/billing-items/${billId}`);
      if (!response.ok) throw new Error('Failed to fetch billing items');
      
      const data = await response.json();
      setBillingItems(data);
    } catch (error) {
      console.error("Error fetching billing items:", error);
    }
  };

  const handleShowBillDetails = async (patient: PatientToBill) => {
    if (!patient.ConsultationID) {
      alert("No consultation found for this patient");
      return;
    }

    setSelectedPatientBillDetails(patient);
    
    // Fetch prescription details
    const prescriptionDetails = await fetchPrescriptionDetails(patient.ConsultationID);
    setPrescriptionDetails(prescriptionDetails);
    
    // Fetch medication cost
    const medicationCost = await fetchMedicationCost(patient.ConsultationID);
    
    // Calculate bill summary
    const summary: BillSummary = {
      consultationFee,
      medicationCost,
      subtotal: consultationFee + medicationCost,
      insuranceCoverage: 0, // Default to 0, can be updated
      patientResponsibility: consultationFee + medicationCost
    };
    
    setBillSummary(summary);
    setShowBillDetailsDialog(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedBilling || !receptionistId) return;

    try {
      const amountInput = document.getElementById('amount-received') as HTMLInputElement;
      const paymentMethodSelect = document.getElementById('payment-method') as HTMLSelectElement;
      const notesTextarea = document.getElementById('payment-notes') as HTMLTextAreaElement;
      
      if (!amountInput?.value || !paymentMethodSelect?.value) {
        alert("Please fill in all required fields");
        return;
      }

      const amountPaid = parseFloat(amountInput.value);
      
      if (amountPaid <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      const paymentData = {
        billId: selectedBilling.BillID,
        amountPaid: amountPaid,
        paymentMethod: paymentMethodSelect.value,
        receptionistId: receptionistId,
        notes: notesTextarea?.value || '',
      };

      const response = await fetch("http://localhost:3001/api/receptionist/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowBillingDialog(false);
        alert('Payment processed successfully!');
        fetchBillingData();
        fetchPatientsToBill();
        refreshData();
      } else {
        alert(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Failed to process payment");
    }
  };

  const handleCreateBillForPatient = async (patient: PatientToBill) => {
    if (!patient.ConsultationID) {
      alert("Cannot create bill for patient without consultation. Please ensure the patient has completed a consultation first.");
      return;
    }

    // Check if billing already exists
    if (patient.HasBilling && patient.HasBilling > 0) {
      alert("Billing already exists for this patient's consultation.");
      return;
    }

    // Fetch prescription details
    const prescriptionDetails = await fetchPrescriptionDetails(patient.ConsultationID);
    const medicationCost = await fetchMedicationCost(patient.ConsultationID);
    
    setSelectedPatient(patient);
    setPrescriptionDetails(prescriptionDetails);
    
    // Calculate bill summary
    const summary: BillSummary = {
      consultationFee,
      medicationCost,
      subtotal: consultationFee + medicationCost,
      insuranceCoverage: 0, // Default to 0
      patientResponsibility: consultationFee + medicationCost
    };
    
    setBillSummary(summary);
    setShowCreateForPatient(true);
  };

  const handleCreateBillingForPatient = async () => {
    if (!selectedPatient || !receptionistId || !selectedPatient.ConsultationID) {
      alert("Missing required information");
      return;
    }

    if (!billSummary) {
      alert("Bill summary not calculated");
      return;
    }

    const billingData = {
      consultationId: selectedPatient.ConsultationID,
      patientId: selectedPatient.PatientID,
      receptionistId: receptionistId,
      insuranceCoverage: billSummary.insuranceCoverage,
      consultationFee: billSummary.consultationFee,
      medicationTotal: billSummary.medicationCost
    };

    try {
      const response = await fetch("http://localhost:3001/api/receptionist/create-billing-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowCreateForPatient(false);
        setSelectedPatient(null);
        setBillSummary(null);
        setInsuranceCoverage(0);
        
        alert('Billing created successfully!');
        
        // Refresh data
        fetchBillingData();
        fetchPatientsToBill();
        refreshData();
      } else {
        alert(result.error || 'Failed to create billing');
      }
    } catch (error) {
      console.error("Billing creation error:", error);
      alert("Failed to create billing");
    }
  };

  const handleCreateManualBilling = async () => {
    if (!receptionistId) {
      alert("Receptionist ID is required");
      return;
    }

    const patientId = parseInt((document.getElementById('manual-patient-id') as HTMLInputElement)?.value || '0');
    const consultationId = parseInt((document.getElementById('manual-consultation-id') as HTMLInputElement)?.value || '0');
    const manualInsuranceCoverage = parseFloat((document.getElementById('manual-insurance-coverage') as HTMLInputElement)?.value || '0');

    if (!patientId || patientId <= 0 || !consultationId || consultationId <= 0) {
      alert("Valid Patient ID and Consultation ID are required");
      return;
    }

    // Fetch medication cost for this consultation
    const medicationCost = await fetchMedicationCost(consultationId);
    const subtotal = consultationFee + medicationCost;
    const patientResponsibility = subtotal - manualInsuranceCoverage;

    const billingData = {
      consultationId: consultationId,
      patientId: patientId,
      receptionistId: receptionistId,
      insuranceCoverage: manualInsuranceCoverage,
      consultationFee: consultationFee,
      medicationTotal: medicationCost
    };

    try {
      const response = await fetch("http://localhost:3001/api/receptionist/create-billing-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowCreateDialog(false);
        alert('Billing created successfully!');
        
        // Refresh data
        fetchBillingData();
        fetchPatientsToBill();
        refreshData();
      } else {
        alert(result.error || 'Failed to create billing');
      }
    } catch (error) {
      console.error("Billing creation error:", error);
      alert("Failed to create billing");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case 'to-be-billed': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-consultation': return 'bg-blue-100 text-blue-800';
      case 'checked-in': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Patients to Bill Section - Only ONE table showing "to-be-billed" patients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Patients to Bill ({filteredPatients.length})
              </CardTitle>
              <CardDescription>
                Patients with visits marked as "TO-BE-BILLED" status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchPatientsToBill()}
                disabled={loadingPatients}
              >
                <RefreshCw className={`size-4 mr-2 ${loadingPatients ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPatients ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Loading patients to bill...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients with "to-be-billed" status found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>IC No</TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Prescription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.VisitID}>
                      <TableCell className="font-medium">{patient.PatientName}</TableCell>
                      <TableCell>{patient.ICNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.VisitType.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(patient.ArrivalTime), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {patient.DoctorName || 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        {patient.HasPrescription ? (
                          <Badge variant="outline" className="bg-blue-50">
                            Prescribed ({patient.Medications?.split(',').slice(0, 2).join(', ')})
                          </Badge>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getVisitStatusColor(patient.VisitStatus)}>
                          {patient.VisitStatus.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowBillDetails(patient)}
                          >
                            <Eye className="size-4 mr-1" />
                            Bill Details
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Dialog - Shows when "Bill Details" button is clicked */}
      <Dialog open={showBillDetailsDialog} onOpenChange={setShowBillDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
            <DialogDescription>
              {selectedPatientBillDetails && `Billing information for ${selectedPatientBillDetails.PatientName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatientBillDetails && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="size-4" />
                  Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Patient Name:</span>
                    <span className="ml-2 font-medium">{selectedPatientBillDetails.PatientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">IC No:</span>
                    <span className="ml-2 font-medium">{selectedPatientBillDetails.ICNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="ml-2 font-medium">{selectedPatientBillDetails.PatientID}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Visit ID:</span>
                    <span className="ml-2 font-medium">#{selectedPatientBillDetails.VisitID}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Visit Type:</span>
                    <span className="ml-2">{selectedPatientBillDetails.VisitType.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Arrival Time:</span>
                    <span className="ml-2">
                      {format(new Date(selectedPatientBillDetails.ArrivalTime), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <span className="ml-2">{selectedPatientBillDetails.DoctorName || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="secondary" className={getVisitStatusColor(selectedPatientBillDetails.VisitStatus)}>
                      {selectedPatientBillDetails.VisitStatus.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {selectedPatientBillDetails.VisitNotes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="ml-2 text-sm text-gray-700">{selectedPatientBillDetails.VisitNotes}</p>
                  </div>
                )}
              </div>

              {/* Consultation Information */}
              {selectedPatientBillDetails.ConsultationID && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="size-4" />
                    Consultation Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Consultation ID:</span>
                      <span className="ml-2 font-medium">#{selectedPatientBillDetails.ConsultationID}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Has Prescription:</span>
                      <span className="ml-2">
                        {selectedPatientBillDetails.HasPrescription ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Information */}
              {prescriptionDetails && (
                <div className="p-4 bg-green-50 rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Receipt className="size-4" />
                    Prescription Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Prescription ID:</span>
                      <span className="ml-2 font-medium">#{prescriptionDetails.prescriptionId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Number of Items:</span>
                      <span className="ml-2 font-medium">{prescriptionDetails.itemCount}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Medications:</span>
                    <p className="ml-2 text-sm text-gray-700">{prescriptionDetails.medications}</p>
                  </div>
                </div>
              )}

              {/* Billing Summary */}
              {billSummary && (
                <div className="p-4 bg-purple-50 rounded-lg space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="size-4" />
                    Estimated Bill Summary
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Consultation Fee:</span>
                      <span className="font-medium">${billSummary.consultationFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medication Cost:</span>
                      <span className="font-medium">${billSummary.medicationCost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>${billSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Insurance Coverage:</span>
                      <span>-${billSummary.insuranceCoverage.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Estimated Patient Responsibility:</span>
                      <span className="text-blue-600">
                        ${billSummary.patientResponsibility.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-4">
                    <p>Note: This is an estimated bill. Final amount may vary based on actual services rendered and insurance coverage.</p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBillDetailsDialog(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowBillDetailsDialog(false);
                    if (selectedPatientBillDetails) {
                      handleCreateBillForPatient(selectedPatientBillDetails);
                    }
                  }}
                  disabled={!selectedPatientBillDetails.ConsultationID || 
                           (selectedPatientBillDetails.HasBilling && selectedPatientBillDetails.HasBilling > 0)}
                >
                  <FileText className="size-4 mr-2" />
                  Create Bill Now
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Bill for Patient Dialog */}
      {selectedPatient && showCreateForPatient && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Create Bill for {selectedPatient.PatientName}</CardTitle>
                <CardDescription>
                  Visit #{selectedPatient.VisitID} | IC: {selectedPatient.ICNo}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setPrescriptionDetails(null);
                  setBillSummary(null);
                  setInsuranceCoverage(0);
                  setShowCreateForPatient(false);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Visit ID:</span>
                    <span className="ml-2 font-medium">#{selectedPatient.VisitID}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="ml-2 font-medium">{selectedPatient.PatientID}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Visit Type:</span>
                    <span className="ml-2">{selectedPatient.VisitType.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Arrival Time:</span>
                    <span className="ml-2">
                      {format(new Date(selectedPatient.ArrivalTime), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Consultation:</span>
                    <span className="ml-2">
                      {selectedPatient.ConsultationID ? `#${selectedPatient.ConsultationID}` : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <span className="ml-2">{selectedPatient.DoctorName || 'Not assigned'}</span>
                  </div>
                </div>
                {selectedPatient.VisitNotes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="ml-2 text-sm text-gray-700">{selectedPatient.VisitNotes}</p>
                  </div>
                )}
              </div>

              {/* Prescription Information */}
              {prescriptionDetails && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="font-medium">Prescription Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Prescription ID:</span>
                      <span className="ml-2 font-medium">#{prescriptionDetails.prescriptionId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Number of Items:</span>
                      <span className="ml-2 font-medium">{prescriptionDetails.itemCount}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Medications:</span>
                    <p className="ml-2 text-sm text-gray-700">{prescriptionDetails.medications}</p>
                  </div>
                </div>
              )}

              {/* Billing Calculation */}
              {billSummary && (
                <div className="space-y-4">
                  <h4 className="font-medium">Billing Calculation</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consultation-fee">Consultation Fee ($)</Label>
                      <Input
                        id="consultation-fee"
                        type="number"
                        step="0.01"
                        value={billSummary.consultationFee}
                        onChange={(e) => {
                          const newFee = parseFloat(e.target.value) || 0;
                          setBillSummary({
                            ...billSummary,
                            consultationFee: newFee,
                            subtotal: newFee + billSummary.medicationCost,
                            patientResponsibility: newFee + billSummary.medicationCost - billSummary.insuranceCoverage
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance-coverage">Insurance Coverage ($)</Label>
                      <Input
                        id="insurance-coverage"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={billSummary.insuranceCoverage}
                        onChange={(e) => {
                          const newCoverage = parseFloat(e.target.value) || 0;
                          setBillSummary({
                            ...billSummary,
                            insuranceCoverage: newCoverage,
                            patientResponsibility: billSummary.subtotal - newCoverage
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Consultation Fee:</span>
                        <span>${billSummary.consultationFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medication Cost:</span>
                        <span>${billSummary.medicationCost.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium text-lg">
                        <span>Subtotal:</span>
                        <span>${billSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Insurance Coverage:</span>
                        <span>-${billSummary.insuranceCoverage.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-xl">
                        <span>Patient Responsibility:</span>
                        <span className="text-blue-600">
                          ${billSummary.patientResponsibility.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setSelectedPatient(null);
                  setPrescriptionDetails(null);
                  setBillSummary(null);
                  setInsuranceCoverage(0);
                  setShowCreateForPatient(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBillingForPatient}
                  disabled={!selectedPatient.ConsultationID}
                >
                  <FileText className="size-4 mr-2" />
                  Create Bill
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Details Dialog (For existing bills) */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Billing Details</DialogTitle>
            <DialogDescription>
              {selectedBilling && `Bill #${selectedBilling.BillID} for ${selectedBilling.PatientName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBilling && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Bill Details</TabsTrigger>
                <TabsTrigger value="payment">Process Payment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                {/* Bill Summary */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Bill ID:</span>
                      <span className="ml-2 text-gray-900 font-medium">#{selectedBilling.BillID}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Patient:</span>
                      <span className="ml-2 text-gray-900 font-medium">{selectedBilling.PatientName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Billing Date:</span>
                      <span className="ml-2 text-gray-900">{format(new Date(selectedBilling.BillingDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <span className="ml-2 text-gray-900">{format(new Date(selectedBilling.DueDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="secondary" className={getStatusColor(selectedBilling.Status)}>
                        {selectedBilling.Status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bill Items */}
                {billingItems.length > 0 ? (
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Bill Items</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingItems.map((item) => (
                          <TableRow key={item.BillingItemID}>
                            <TableCell>{item.Description || item.ServiceName}</TableCell>
                            <TableCell className="text-right">{item.Quantity}</TableCell>
                            <TableCell className="text-right">${item.UnitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${item.TotalAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No items found for this bill
                  </div>
                )}

                {/* Totals */}
                <div className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedBilling.TotalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance Coverage:</span>
                      <span className="text-green-600">-${selectedBilling.InsuranceCoverage.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Patient Responsibility:</span>
                      <span>${selectedBilling.PatientResponsibility.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span>${selectedBilling.AmountPaid.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-xl">
                      <span>Balance Due:</span>
                      <span className={selectedBilling.AmountDue > 0 ? "text-red-600" : "text-green-600"}>
                        ${selectedBilling.AmountDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-gray-900">${selectedBilling.TotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance Coverage:</span>
                    <span className="text-green-600">${selectedBilling.InsuranceCoverage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient Responsibility:</span>
                    <span className="text-gray-900">${selectedBilling.PatientResponsibility.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="text-gray-900">${selectedBilling.AmountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span className="text-gray-900">Balance Due:</span>
                    <span className="text-red-600">${selectedBilling.AmountDue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method *</Label>
                  <Select>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount-received">Amount Received ($) *</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={selectedBilling.AmountDue}
                    min="0.01"
                    max={selectedBilling.AmountDue}
                  />
                  <p className="text-sm text-gray-500">
                    Maximum amount: ${selectedBilling.AmountDue.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-notes">Notes</Label>
                  <Textarea
                    id="payment-notes"
                    placeholder="Payment notes, insurance details, etc..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcessPayment}>
                    <CreditCard className="size-4 mr-2" />
                    Process Payment
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}