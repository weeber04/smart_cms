// BillingManagement.tsx
import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, FileText, Search, CheckCircle, Clipboard, Stethoscope, Filter, Users, Calendar, RefreshCw, X, Eye, Receipt } from 'lucide-react';
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

interface ConsultationDetails {
  ConsultationID: number;
  DoctorID: number;
  DoctorName: string;
  StartTime: string;
  EndTime: string | null;
  ChiefComplaint: string | null;
  HistoryOfPresentIllness: string | null;
  PhysicalExamFindings: string | null;
  Diagnosis: string | null;
  DiagnosisCode: string | null;
  TreatmentPlan: string | null;
  LabTestsOrdered: boolean;
  ReferralGiven: boolean;
  FollowUpDate: string | null;
  FollowUpInstructions: string | null;
  ConsultationNotes: string | null;
  SeverityAssessment: string | null;
  MedicationPlan: string | null;
  PastMedicalHistory: string | null;
  FamilyHistory: string | null;
  Disposition: string | null;
}

interface MedicationItem {
  medicationId: number;
  medicationName: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

interface PrescriptionDetails {
  prescriptionId: number;
  itemCount: number;
  medications: string;
  medicationItems?: MedicationItem[]; // Add this
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
  // State declarations should be INSIDE the function component
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
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
  
  // Add consultationDetails state here:
  const [consultationDetails, setConsultationDetails] = useState<ConsultationDetails | null>(null);
  
  
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
  
  try {
    // Fetch all details in parallel
    const [prescriptionResponse, consultationResponse, billingResponse] = await Promise.all([
      fetch(`http://localhost:3001/api/receptionist/prescription-details/${patient.ConsultationID}`),
      fetch(`http://localhost:3001/api/receptionist/consultation-details/${patient.ConsultationID}`),
      fetch(`http://localhost:3001/api/receptionist/medication-cost/${patient.ConsultationID}`),
    ]);

    const prescriptionData = prescriptionResponse.ok ? await prescriptionResponse.json() : null;
    const consultationData = consultationResponse.ok ? await consultationResponse.json() : null;
    
    // Handle billing response
    let medicationCost = 0;
    if (billingResponse.ok) {
      const billingData = await billingResponse.json();
      medicationCost = Number(billingData.totalCost) || 0;
    }
    
    // Use the consultationFee from state (ensure it's a number)
    const consultationFeeValue = Number(consultationFee) || 150.00; // Fallback to 150 if not a number
    const subtotal = consultationFeeValue + medicationCost;
    const patientResponsibility = subtotal;
    
    const billSummary: BillSummary = {
      consultationFee: consultationFeeValue, // Ensure this is a number
      medicationCost,
      subtotal,
      insuranceCoverage: 0,
      patientResponsibility: subtotal
    };
    
    setBillSummary(billSummary);
    setPrescriptionDetails(prescriptionData);
    setConsultationDetails(consultationData);
    setMedicationItems([]); // Reset medication items since API is failing
    setShowBillDetailsDialog(true);
  } catch (error) {
    console.error("Error fetching details:", error);
    alert("Failed to load details");
  }
};

// Also fix the medicationCost in handleCreateBillForPatient
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
  const medicationCostData = await fetchMedicationCost(patient.ConsultationID);
  
  // Ensure medicationCost is a number
  const medicationCost = Number(medicationCostData) || 0;
  
  setSelectedPatient(patient);
  setPrescriptionDetails(prescriptionDetails);
  
  const summary: BillSummary = {
    consultationFee,
    medicationCost, // This should now be a number
    subtotal: consultationFee + medicationCost,
    insuranceCoverage: 0, // Set to 0 if keeping the interface
    patientResponsibility: consultationFee + medicationCost
  };
  
  setBillSummary(summary);
  setShowCreateForPatient(true);
}

// Update the fetchMedicationCost function to ensure it returns a number
const fetchMedicationCost = async (consultationId: number) => {
  try {
    const response = await fetch(`http://localhost:3001/api/receptionist/medication-cost/${consultationId}`);
    if (!response.ok) throw new Error('Failed to fetch medication cost');
    
    const data = await response.json();
    // Ensure we return a number
    return Number(data.totalCost) || 0;
  } catch (error) {
    console.error("Error fetching medication cost:", error);
    return 0;
  }
};

// Update the handleCreateBillingForPatient function
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
    consultationFee: billSummary.consultationFee,
    medicationTotal: billSummary.medicationCost,
    // Removed insuranceCoverage
    totalAmount: billSummary.subtotal,
    patientResponsibility: billSummary.patientResponsibility
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

const handleMarkAsCompleted = async () => {
  if (!selectedPatientBillDetails?.ConsultationID) return;
  
  if (!confirm(`Mark consultation #${selectedPatientBillDetails.ConsultationID} as completed and create bill?`)) {
    return;
  }

  const paymentMethod = prompt('Enter payment method (cash, credit, debit, insurance, etc.):', 'cash');
  
  if (!paymentMethod) {
    alert('Payment method is required');
    return;
  }

  try {
    // First fetch medication cost
    const medicationResponse = await fetch(`http://localhost:3001/api/receptionist/medication-cost/${selectedPatientBillDetails.ConsultationID}`);
    const medicationData = medicationResponse.ok ? await medicationResponse.json() : { totalCost: 0 };
    
    const response = await fetch(`http://localhost:3001/api/receptionist/create-billing-consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: selectedPatientBillDetails.ConsultationID,
        patientId: selectedPatientBillDetails.PatientID,
        receptionistId: receptionistId,
        consultationFee: consultationFee,
        medicationTotal: medicationData.totalCost || 0,
        insuranceCoverage: 0,
        paymentMethod: paymentMethod
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setShowBillDetailsDialog(false);
      alert(`Bill created and marked as ${result.status} successfully! Bill ID: ${result.billId}`);
      
      // Refresh data
      fetchBillingData();
      fetchPatientsToBill();
      refreshData();
    } else {
      if (result.code === 'FK_CONSTRAINT_ERROR') {
        alert(`Database error: ${result.details}\n\nPlease contact your system administrator to fix this.`);
      } else {
        alert(result.error || 'Failed to create billing');
      }
    }
  } catch (error) {
    console.error("Error marking as completed:", error);
    alert("Failed to mark as completed");
  }
};

// Update the print bill HTML to remove insurance and add medication properly
const handlePrintBill = () => {
  if (!selectedPatientBillDetails || !billSummary) return;
  
  // Create medication details table for print
  const medicationDetailsHTML = medicationItems.length > 0 ? `
    <div class="section-title">Medication Details</div>
    <div class="info-card">
      <table class="bill-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th style="text-align: right;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${medicationItems.map(item => `
            <tr>
              <td>${item.medicationName}</td>
              <td>${item.dosage || 'N/A'}</td>
              <td style="text-align: right;">${item.quantity}</td>
              <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: right;">$${item.totalCost.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4"><strong>Total Medication Cost</strong></td>
            <td style="text-align: right;"><strong>$${billSummary.medicationCost.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : '';
  
  // Check if there are medications
  const hasMedications = (billSummary?.medicationCost || 0) > 0;
  const hasPrescription = prescriptionDetails && prescriptionDetails.itemCount > 0;
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow pop-ups to print the bill');
    return;
  }
  
  // Create comprehensive print content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Bill - ${selectedPatientBillDetails.PatientName}</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 40px; 
          font-size: 12px;
          color: #333;
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #4f46e5; 
          padding-bottom: 15px; 
        }
        .hospital-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #4f46e5;
          margin-bottom: 5px;
        }
        .address { 
          font-size: 11px; 
          color: #666; 
          line-height: 1.3;
        }
        .invoice-number {
          font-size: 16px;
          color: #4f46e5;
          font-weight: bold;
          margin: 10px 0;
        }
        .print-date {
          color: #6b7280;
          font-size: 10px;
        }
        
        /* Sections */
        .section-title { 
          font-size: 14px; 
          font-weight: bold; 
          margin: 20px 0 10px 0; 
          border-bottom: 2px solid #e5e7eb; 
          padding-bottom: 5px;
          color: #374151;
        }
        .info-card { 
          margin-bottom: 15px; 
          background: #f9fafb;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #e5e7eb;
        }
        
        /* Bill Table */
        .bill-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0; 
          font-size: 11px;
        }
        .bill-table th, .bill-table td { 
          border: 1px solid #d1d5db; 
          padding: 8px; 
          text-align: left; 
        }
        .bill-table th { 
          background-color: #f3f4f6; 
          font-weight: bold;
          color: #374151;
        }
        .bill-table td {
          background-color: #ffffff;
        }
        .total-row { 
          font-weight: bold; 
          background-color: #f8fafc; 
          border-top: 2px solid #d1d5db;
        }
        
        /* Totals */
        .total-amount {
          font-size: 16px;
          color: #059669;
          font-weight: bold;
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 10px; 
          color: #6b7280; 
          border-top: 1px solid #e5e7eb; 
          padding-top: 15px; 
        }
        .payment-info {
          margin: 15px 0;
          padding: 12px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 5px;
        }
        .payment-info h4 {
          color: #0369a1;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        @media print {
          body { 
            margin: 15px;
            padding: 0;
          }
          .no-print { 
            display: none; 
          }
        }
        
        .print-controls {
          margin: 20px 0;
          text-align: center;
          padding: 15px;
          background: #f9fafb;
          border-radius: 5px;
        }
        .print-btn {
          padding: 8px 20px;
          background: #4f46e5;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
          margin: 0 5px;
        }
        .close-btn {
          padding: 8px 20px;
          background: #6b7280;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        
        /* Prescription section */
        .prescription-items {
          margin-top: 10px;
        }
        .prescription-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dashed #e5e7eb;
        }
        .prescription-item:last-child {
          border-bottom: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-name">Smart CMS Hospital</div>
        <div class="address">
          123 Medical Street, Healthcare City, 12345<br>
          Phone: (123) 456-7890 | Email: info@smartcmshospital.com
        </div>
        <div class="invoice-number">
          INVOICE #${selectedPatientBillDetails.ConsultationID || 'TEMP'}
        </div>
        <div class="print-date">
          Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>
      
      <div class="section-title">Patient Information</div>
      <div class="info-card">
        <table style="width: 100%;">
          <tr>
            <td style="width: 30%; font-weight: bold;">Patient Name:</td>
            <td>${selectedPatientBillDetails.PatientName}</td>
            <td style="width: 30%; font-weight: bold;">IC Number:</td>
            <td>${selectedPatientBillDetails.ICNo}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Visit Type:</td>
            <td>${selectedPatientBillDetails.VisitType.replace('-', ' ').toUpperCase()}</td>
            <td style="font-weight: bold;">Arrival Time:</td>
            <td>${format(new Date(selectedPatientBillDetails.ArrivalTime), 'MMM dd, yyyy HH:mm')}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Doctor:</td>
            <td colspan="3">${selectedPatientBillDetails.DoctorName || 'Not specified'}</td>
          </tr>
        </table>
      </div>
      
      ${
        consultationDetails ? `
        <div class="section-title">Consultation Details</div>
        <div class="info-card">
          <table style="width: 100%;">
            <tr>
              <td style="width: 30%; font-weight: bold;">Doctor:</td>
              <td>${consultationDetails.DoctorName || 'Not specified'}</td>
              <td style="width: 30%; font-weight: bold;">Consultation Time:</td>
              <td>${format(new Date(consultationDetails.StartTime), 'MMM dd, yyyy HH:mm')}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Diagnosis:</td>
              <td colspan="3">${consultationDetails.Diagnosis || 'No diagnosis recorded'}</td>
            </tr>
            ${
              consultationDetails.TreatmentPlan ? `
              <tr>
                <td style="font-weight: bold;">Treatment Plan:</td>
                <td colspan="3">${consultationDetails.TreatmentPlan}</td>
              </tr>
              ` : ''
            }
          </table>
        </div>
        ` : ''
      }
      
      ${
        (prescriptionDetails && prescriptionDetails.itemCount > 0) ? `
        <div class="section-title">Prescription Details</div>
        <div class="info-card">
          <div style="font-weight: bold; margin-bottom: 8px;">
            Medications Prescribed (${prescriptionDetails.itemCount} items):
          </div>
          <div class="prescription-items">
            ${prescriptionDetails.medications.split(',').map(med => `
              <div class="prescription-item">
                <span>${med.trim()}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''
      }
      
      <div class="section-title">Bill Summary</div>
      <div class="info-card">
        <table class="bill-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
  <tr>
    <td>Doctor Consultation Fee</td>
    <td style="text-align: right;">RM${billSummary?.consultationFee?.toFixed(2) || '0.00'}</td>
  </tr>
  ${
    hasMedications ? `
    <tr>
      <td>Medication/Prescription Cost</td>
      <td style="text-align: right;">RM${billSummary?.medicationCost?.toFixed(2) || '0.00'}</td>
    </tr>
    ` : ''
  }
  <tr class="total-row">
    <td><strong>TOTAL AMOUNT DUE</strong></td>
    <td style="text-align: right;" class="total-amount">
      <strong>RM${billSummary?.patientResponsibility?.toFixed(2) || '0.00'}</strong>
    </td>
  </tr>
</tbody>
        </table>
      </div>
      
      <div class="payment-info">
        <h4>Payment Information</h4>
        <table style="width: 100%;">
          <tr>
            <td style="width: 40%; font-weight: bold;">Payment Status:</td>
            <td><strong style="color: #dc2626;">PENDING PAYMENT</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Due Date:</td>
            <td><strong>${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM dd, yyyy')}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Payment Methods:</td>
            <td>Cash, Credit Card, Debit Card</td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Smart CMS Hospital. We value your health and trust.</p>
        <p>For billing inquiries: billing@smartcmshospital.com | Phone: (123) 456-7890 ext. 2</p>
        <p>This is a computer-generated document. No signature required.</p>
      </div>
      
      <div class="no-print print-controls">
        <button onclick="window.print()" class="print-btn">
          🖨️ Print Bill
        </button>
        <button onclick="window.close()" class="close-btn">
          ✕ Close Window
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.print();
  }, 500);
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

{/* Compact Bill Details Dialog with Fixed Scroll */}
{showBillDetailsDialog && selectedPatientBillDetails && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
      onClick={() => setShowBillDetailsDialog(false)}
    />
    
    {/* Main Container - Proper modal positioning */}
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 my-8">
        {/* Header - Fixed */}
        <div className="shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-200">
                <FileText className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bill Details</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {selectedPatientBillDetails.PatientName}
                  </Badge>
                  <span className="text-xs text-gray-600">IC: {selectedPatientBillDetails.ICNo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintBill}
                disabled={!selectedPatientBillDetails}
                className="h-8 text-xs px-3"
              >
                <FileText className="size-3.5 mr-1.5" />
                Print Bill
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBillDetailsDialog(false)}
                className="h-8 w-8"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="bill-summary" className="h-full">
            <div className="sticky top-0 z-10 bg-white px-5 pt-3 border-b">
              <TabsList className="w-full h-9">
                <TabsTrigger value="bill-summary" className="flex-1 text-xs">
                  Bill Summary
                </TabsTrigger>
                <TabsTrigger value="patient-info" className="flex-1 text-xs">
                  Patient Info
                </TabsTrigger>
                <TabsTrigger value="consultation" className="flex-1 text-xs">
                  Consultation
                </TabsTrigger>
              </TabsList>
            </div>
            
{/* Bill Summary Tab */}
<TabsContent value="bill-summary" className="h-full p-5 space-y-4 m-0">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    {/* Left Column - Patient Info & Medication Details */}
    <div className="lg:col-span-2 space-y-4">
      {/* Patient Info Card */}
      <Card className="border border-gray-300">
        <CardHeader className="py-3 px-4 border-b bg-gray-50">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="size-3.5" />
            Patient Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-medium">Patient Name</div>
              <div className="font-medium text-sm p-2 bg-white rounded border border-gray-200">
                {selectedPatientBillDetails.PatientName}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-medium">IC Number</div>
              <div className="font-medium text-sm p-2 bg-white rounded border border-gray-200">
                {selectedPatientBillDetails.ICNo}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-medium">Visit Type</div>
              <div className="p-2">
                <Badge variant="outline" className="text-xs px-3 py-1 border border-gray-300">
                  {selectedPatientBillDetails.VisitType.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-medium">Doctor</div>
              <div className="font-medium text-sm p-2 bg-white rounded border border-gray-200">
                {selectedPatientBillDetails.DoctorName || 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medication Details Card */}
      {(billSummary?.medicationCost || 0) > 0 && (
        <Card className="border border-gray-300">
          <CardHeader className="py-3 px-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Receipt className="size-3.5" />
                Medication Details
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                Total: RM{(billSummary?.medicationCost || 0).toFixed(2)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* If we have actual medication items from API */}
              {medicationItems.length > 0 ? (
                <>
                  {medicationItems.map((item, index) => (
                    <div key={item.medicationId || index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {item.medicationName}
                          </div>
                          {item.dosage && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Dosage:</span> {item.dosage}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-sm text-gray-900">
                            RM{item.totalCost.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.quantity} × RM{item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Item #{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                /* Fallback: Show parsed medications from prescription details */
                prescriptionDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">
                        Medications Prescribed ({prescriptionDetails.itemCount} items)
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-gray-700 mb-2">
                        {prescriptionDetails.medications.split(',').map((med, index) => (
                          <div key={index} className="py-1 border-b border-blue-100 last:border-b-0">
                            <div className="flex items-start">
                              <div className="size-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                              <span>{med.trim()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-blue-600 mt-2">
                        Total medication cost: RM{(billSummary?.medicationCost || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Right Column - Bill Summary */}
    <div>
      <Card className="border border-gray-300 sticky top-20">
        <CardHeader className="py-3 px-4 border-b bg-indigo-50">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <DollarSign className="size-3.5" />
            Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Bill Breakdown */}
          <div className="space-y-3">
            <div className="space-y-2">
              {/* In your Bill Summary Tab - add safety checks */}
<div className="flex justify-between items-center text-sm py-1">
  <span className="text-gray-600">Consultation Fee:</span>
  <span className="font-semibold text-gray-900">
    RM{(Number(billSummary?.consultationFee) || 0).toFixed(2)}
  </span>
</div>

{/* Medication Cost with safety check */}
{(Number(billSummary?.medicationCost) || 0) > 0 && (
  <div className="flex justify-between items-center text-sm py-1">
    <span className="text-gray-600">Medication Cost:</span>
    <span className="font-semibold text-gray-900">
      RM{(Number(billSummary?.medicationCost) || 0).toFixed(2)}
    </span>
  </div>
)}

{/* Subtotal with safety check */}
<div className="flex justify-between items-center font-semibold text-sm py-1">
  <span className="text-gray-700">Subtotal:</span>
  <span className="text-gray-900">
    RM{(Number(billSummary?.subtotal) || 0).toFixed(2)}
  </span>
</div>

{/* Total Amount Due with safety check */}
<div className="flex justify-between items-center font-bold text-base bg-indigo-50 p-3 rounded-lg mt-3 border border-indigo-200">
  <span className="text-indigo-800">Total Amount Due:</span>
  <span className="text-indigo-900">
    RM{(Number(billSummary?.patientResponsibility) || 0).toFixed(2)}
  </span>
</div>
              
              {/* Medication Cost Summary with details */}
              {(billSummary?.medicationCost || 0) > 0 && (
                <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Medication Cost:</span>
                    <span className="font-bold text-blue-700">
                      RM{(billSummary?.medicationCost || 0).toFixed(2)}
                    </span>
                  </div>
                  {prescriptionDetails && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="font-medium mb-1">Includes:</div>
                      {prescriptionDetails.medications.split(',').slice(0, 3).map((med, index) => (
                        <div key={index} className="flex justify-between py-0.5">
                          <span className="truncate max-w-[120px] text-gray-700">
                            {med.trim()}
                          </span>
                          <span className="text-gray-600">
                            {/* Show estimated cost or leave blank */}
                            {medicationItems[index] ? `RM${medicationItems[index].totalCost.toFixed(2)}` : ''}
                          </span>
                        </div>
                      ))}
                      {prescriptionDetails.itemCount > 3 && (
                        <div className="text-gray-500 italic text-xs mt-1">
                          +{prescriptionDetails.itemCount - 3} more medication(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center font-semibold text-sm py-1">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-gray-900">
                RM{billSummary?.subtotal?.toFixed(2) || '0.00'}
              </span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center font-bold text-base bg-indigo-50 p-3 rounded-lg mt-3 border border-indigo-200">
              <span className="text-indigo-800">Total Amount Due:</span>
              <span className="text-indigo-900">
                RM{billSummary?.patientResponsibility?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Payment Due Info */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-1">Payment Information</div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Status:</span>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                PENDING PAYMENT
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Payment due within 30 days of billing date
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleMarkAsCompleted}
              disabled={!selectedPatientBillDetails?.ConsultationID || 
                       !!selectedPatientBillDetails?.HasBilling}
              className={`w-full h-9 text-sm font-medium rounded-md flex items-center justify-center
                ${!selectedPatientBillDetails?.ConsultationID || 
                  !!selectedPatientBillDetails?.HasBilling
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                  : 'bg-green-600 hover:bg-green-700 text-white border border-green-700'
                }`}
            >
              <CheckCircle className="size-4 mr-2" />
              {selectedPatientBillDetails?.HasBilling && selectedPatientBillDetails?.HasBilling > 0 
                ? 'Bill Already Created' 
                : 'Create Bill & Mark Completed'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowBillDetailsDialog(false)}
              className="w-full h-8 text-sm border border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePrintBill}
              className="w-full h-8 text-sm border border-gray-300 hover:bg-gray-50"
            >
              <FileText className="size-3.5 mr-1.5" />
              Print Bill Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</TabsContent>

            {/* Patient Info Tab */}
            <TabsContent value="patient-info" className="h-full p-5 space-y-4 m-0">
              <Card className="border border-gray-300">
                <CardHeader className="py-3 px-4 border-b bg-blue-50">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <Users className="size-3.5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Patient Name</div>
                        <div className="text-sm font-semibold p-3 bg-white rounded-lg border border-gray-300 shadow-sm">
                          {selectedPatientBillDetails.PatientName}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">IC Number</div>
                        <div className="text-sm font-medium p-3 bg-gray-50 rounded-lg border border-gray-300">
                          {selectedPatientBillDetails.ICNo}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Visit Type</div>
                        <div className="p-2 bg-white rounded-lg border border-gray-300">
                          <Badge variant="outline" className="text-xs px-3 py-1.5 border border-gray-400">
                            {selectedPatientBillDetails.VisitType.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Arrival Time</div>
                        <div className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-300">
                          {format(new Date(selectedPatientBillDetails.ArrivalTime), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Doctor</div>
                        <div className="text-sm font-medium p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {selectedPatientBillDetails.DoctorName || 'Not assigned'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visit Notes */}
                  {selectedPatientBillDetails.VisitNotes && (
                    <div className="mt-6 pt-4 border-t border-gray-300">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Visit Notes</div>
                        <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-300">
                          {selectedPatientBillDetails.VisitNotes}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Combined Consultation & Prescription Tab */}
            <TabsContent value="consultation" className="h-full p-5 space-y-4 m-0">
              {consultationDetails ? (
                <div className="space-y-5">
                  {/* Consultation Header - More Spacing */}
                  <Card className="border border-gray-300">
                    <CardHeader className="py-3 px-4 border-b bg-teal-50">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                        <FileText className="size-3.5" />
                        Consultation Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left Column - Better Spacing */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Doctor</div>
                            <div className="text-sm p-3 bg-white rounded-lg border border-gray-300">
                              {consultationDetails.DoctorName || 'Not specified'}
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Consultation Time</div>
                            <div className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-300">
                              {format(new Date(consultationDetails.StartTime), 'MMM dd, yyyy HH:mm')}
                              {consultationDetails.EndTime && ` to ${format(new Date(consultationDetails.EndTime), 'HH:mm')}`}
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Severity</div>
                            <div className="p-2 bg-white rounded-lg border border-gray-300">
                              <Badge variant="outline" className={
                                consultationDetails.SeverityAssessment === 'critical' ? 'bg-red-100 text-red-800 border-red-300 text-xs px-3 py-1.5' :
                                consultationDetails.SeverityAssessment === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300 text-xs px-3 py-1.5' :
                                consultationDetails.SeverityAssessment === 'moderate' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 text-xs px-3 py-1.5' :
                                'bg-green-100 text-green-800 border-green-300 text-xs px-3 py-1.5'
                              }>
                                {consultationDetails.SeverityAssessment?.toUpperCase() || 'NOT SPECIFIED'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Column - Better Spacing */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Diagnosis</div>
                            <div className="text-sm p-3 bg-white rounded-lg border border-blue-200">
                              {consultationDetails.Diagnosis || 'No diagnosis recorded'}
                              {consultationDetails.DiagnosisCode && (
                                <span className="text-xs text-gray-600 ml-1">({consultationDetails.DiagnosisCode})</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Follow-up Date</div>
                            <div className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-300">
                              {consultationDetails.FollowUpDate 
                                ? format(new Date(consultationDetails.FollowUpDate), 'MMM dd, yyyy')
                                : 'No follow-up scheduled'
                              }
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 font-medium">Lab Tests</div>
                            <div className="p-2 bg-white rounded-lg border border-gray-300">
                              <Badge variant="outline" 
                                className={consultationDetails.LabTestsOrdered 
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 text-xs px-3 py-1.5' 
                                  : 'text-gray-600 border-gray-300 text-xs px-3 py-1.5'
                                }>
                                {consultationDetails.LabTestsOrdered ? 'YES' : 'NO'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Examination & Treatment - Single Column Now */}
                  <Card className="border border-gray-300">
                    <CardHeader className="py-3 px-4 border-b bg-green-50">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <Stethoscope className="size-3.5" />
                        Examination & Treatment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Physical Exam Findings */}
                      {consultationDetails.PhysicalExamFindings && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-gray-500 font-medium">Physical Exam Findings</div>
                          <div className="text-sm p-3 bg-green-50 rounded-lg border border-green-300">
                            {typeof consultationDetails.PhysicalExamFindings === 'object' 
                              ? JSON.stringify(consultationDetails.PhysicalExamFindings, null, 2)
                              : consultationDetails.PhysicalExamFindings}
                          </div>
                        </div>
                      )}
                      
                      {/* Treatment Plan */}
                      {consultationDetails.TreatmentPlan && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-gray-500 font-medium">Treatment Plan</div>
                          <div className="text-sm p-3 bg-white rounded-lg border border-green-300">
                            {consultationDetails.TreatmentPlan}
                          </div>
                        </div>
                      )}
                      
                      {/* Consultation Notes */}
                      {consultationDetails.ConsultationNotes && (
                        <div className="space-y-1.5">
                          <div className="text-xs text-gray-500 font-medium">Doctor's Notes</div>
                          <div className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-300">
                            {consultationDetails.ConsultationNotes}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Prescription Section - Integrated */}
                  {prescriptionDetails ? (
                    <Card className="border border-gray-300">
                      <CardHeader className="py-3 px-4 border-b bg-purple-50">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                          <Receipt className="size-3.5" />
                          Prescription
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-gray-500 font-medium">Medications Prescribed</div>
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300 px-3 py-1">
                            {prescriptionDetails.itemCount} items
                          </Badge>
                        </div>
                        <div className="text-sm p-3 bg-purple-50 rounded-lg border border-purple-300">
                          {prescriptionDetails.medications}
                        </div>
                      </CardContent>
                    </Card>
                  ) : consultationDetails.MedicationPlan && (
                    <Card className="border border-gray-300">
                      <CardHeader className="py-3 px-4 border-b bg-purple-50">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                          <Receipt className="size-3.5" />
                          Medication Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="text-sm p-3 bg-purple-50 rounded-lg border border-purple-300">
                          {consultationDetails.MedicationPlan}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="size-10 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">No Consultation Details</h3>
                  <p className="text-xs text-gray-500">Consultation details not found for this visit.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  </div>
)}

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