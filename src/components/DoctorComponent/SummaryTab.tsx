// SummaryTab.tsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label'; 
import { 
  Download, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope,
  Activity,
  Pill,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { 
  PatientData, 
  PatientVital,
  AllergyFinding,
  MedicalCondition,
  PatientVisit
} from './types';

// Define props interface
interface SummaryTabProps {
  patientData: PatientData | null;
  vitals: PatientVital[];
  consultationForm: any;
  onBackToConsultation: () => void;
  prescriptions?: any[];
  allergies?: AllergyFinding[];
  medicalConditions?: MedicalCondition[];
  visits?: PatientVisit[];
  doctorProfile?: any;
  consultationId?: number | string | null;
}

interface ExtendedPatientData extends PatientData {
  Allergy?: 'Y' | 'N';
  allergies?: string[];
  allergyNotes?: string;
}

export function SummaryTab({ 
  patientData, 
  vitals = [], 
  consultationForm = {}, 
  onBackToConsultation,
  prescriptions = [],
  allergies = [],
  medicalConditions = [],
  visits = [],
  doctorProfile,
  consultationId
}: SummaryTabProps) {
  const [expandedSections, setExpandedSections] = useState({
    consultation: false,
    vitals: false,
    prescription: false,
    allergies: false,
    conditions: false,
    treatment: false
  });

  const [loadedPrescriptions, setLoadedPrescriptions] = useState<any[]>([]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleAllSections = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    setExpandedSections({
      consultation: !allExpanded,
      vitals: !allExpanded,
      prescription: !allExpanded,
      allergies: !allExpanded,
      conditions: !allExpanded,
      treatment: !allExpanded
    });
  };

  const safePatientData = patientData as ExtendedPatientData;
  const hasAllergies = safePatientData?.Allergy === 'Y' || 
                      (safePatientData?.allergies && safePatientData.allergies.length > 0) || 
                      allergies.length > 0;

  // Helper to get all medication items from prescriptions
  const getAllMedicationItems = () => {
    const allItems: any[] = [];
    
    // Use loadedPrescriptions if available, otherwise use prescriptions prop
    const prescriptionsToUse = loadedPrescriptions.length > 0 ? loadedPrescriptions : prescriptions;
    
    prescriptionsToUse.forEach((prescription: any) => {
      if (prescription.items && Array.isArray(prescription.items)) {
        prescription.items.forEach((item: any) => {
          if (item) {
            allItems.push({
              ...item,
              prescriptionId: prescription.PrescriptionID,
              prescriptionDate: prescription.PrescribedDate
            });
          }
        });
      }
    });
    
    return allItems;
  };

  const medicationItems = getAllMedicationItems();
  const hasMedications = medicationItems.length > 0;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Print Function
  const handlePrintSummary = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateSummaryHTML());
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleExportPDF = () => {
    handlePrintSummary();
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateSummaryHTML = () => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const latestVitals = vitals.length > 0 ? vitals[0] : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consultation Summary - ${safePatientData?.Name || 'Patient'}</title>
        <style>
          @media print {
            @page { margin: 20mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; }
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-title.vitals { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
          .section-title.prescriptions { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
          .section-title.allergies { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          .section-title.conditions { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          .section-title.treatment { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
          .section-title.lifestyle { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); }
          
          .info-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin: 10px 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .info-card.warning {
            border-left: 4px solid #ef4444;
            background: #fef2f2;
          }
          .info-card.success {
            border-left: 4px solid #10b981;
            background: #f0fdf4;
          }
          .info-card.info {
            border-left: 4px solid #3b82f6;
            background: #eff6ff;
          }
          
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 15px 0;
          }
          .vital-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .vital-value {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 5px 0;
          }
          .vital-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 14px;
          }
          .table th {
            background: #f3f4f6;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border: 1px solid #e5e7eb;
          }
          .table td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .table tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            margin: 2px;
          }
          .severity-mild { background: #dbeafe; color: #1e40af; }
          .severity-moderate { background: #fef3c7; color: #92400e; }
          .severity-severe { background: #fed7aa; color: #c2410c; }
          .severity-critical { background: #fecaca; color: #991b1b; }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
            min-width: 150px;
          }
          .info-value {
            color: #1f2937;
            flex: 1;
          }
          
          .print-only { display: block; }
          @media screen {
            .print-only { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #4f46e5; margin-bottom: 5px; font-size: 24px;">COMPREHENSIVE CONSULTATION SUMMARY</h1>
          <p style="color: #6b7280; margin-bottom: 10px;">Generated: ${today}</p>
          <div style="display: inline-block; padding: 6px 20px; background: #fef3c7; border-radius: 20px; font-weight: bold; color: #92400e;">
            ${consultationForm.severityAssessment?.toUpperCase() || consultationForm.severity?.toUpperCase() || 'MODERATE'} SEVERITY
          </div>
        </div>

        <!-- PATIENT INFO -->
        <div class="patient-info">
          <div>
            <h3 style="color: #4f46e5; margin-bottom: 10px; font-size: 16px;">Patient Information</h3>
            <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${safePatientData?.Name || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">IC Number:</span><span class="info-value">${safePatientData?.ICNo || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Age/Gender:</span><span class="info-value">${safePatientData?.age || 'N/A'} / ${safePatientData?.Gender || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Allergies:</span><span class="info-value">${hasAllergies ? 'PRESENT' : 'None documented'}</span></div>
          </div>
          <div>
            <h3 style="color: #4f46e5; margin-bottom: 10px; font-size: 16px;">Consultation Details</h3>
            <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${new Date().toLocaleDateString()}</span></div>
            <div class="info-row"><span class="info-label">Time:</span><span class="info-value">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
            <div class="info-row"><span class="info-label">Doctor:</span><span class="info-value">${doctorProfile?.name || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Disposition:</span><span class="info-value">${consultationForm.disposition || 'No disposition required'}</span></div>
          </div>
        </div>

        <!-- DIAGNOSIS -->
        <div class="section">
          <div class="section-title">Diagnosis & Assessment</div>
          <div class="info-card info">
            <div class="info-row">
              <span class="info-label">Primary Diagnosis:</span>
              <span class="info-value">${consultationForm.diagnosis || 'Not specified'}</span>
            </div>
            ${consultationForm.diagnosisCode ? `
            <div class="info-row">
              <span class="info-label">Diagnosis Code:</span>
              <span class="info-value">${consultationForm.diagnosisCode}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Severity:</span>
              <span class="info-value">
                <span class="badge severity-${consultationForm.severityAssessment?.toLowerCase() || 'moderate'}">
                  ${consultationForm.severityAssessment?.toUpperCase() || 'MODERATE'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- VITAL SIGNS -->
        ${latestVitals ? `
        <div class="section">
          <div class="section-title vitals">Vital Signs</div>
          <div class="vitals-grid">
            ${latestVitals.BloodPressure ? `
            <div class="vital-item">
              <div class="vital-value">${latestVitals.BloodPressure}</div>
              <div class="vital-label">Blood Pressure</div>
            </div>
            ` : ''}
            ${latestVitals.HeartRate ? `
            <div class="vital-item">
              <div class="vital-value">${latestVitals.HeartRate}</div>
              <div class="vital-label">Heart Rate</div>
            </div>
            ` : ''}
            ${latestVitals.Temperature ? `
            <div class="vital-item">
              <div class="vital-value">${latestVitals.Temperature}°C</div>
              <div class="vital-label">Temperature</div>
            </div>
            ` : ''}
            ${latestVitals.OxygenSaturation ? `
            <div class="vital-item">
              <div class="vital-value">${latestVitals.OxygenSaturation}%</div>
              <div class="vital-label">SpO₂</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- PRESCRIPTIONS -->
        ${hasMedications ? `
        <div class="section">
          <div class="section-title prescriptions">Prescribed Medications (${medicationItems.length})</div>
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Quantity</th>
                ${medicationItems.some(item => item.Instructions) ? '<th>Instructions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${medicationItems.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${item.DrugName || item.name || 'Medication'}</strong></td>
                  <td>${item.Dosage || 'N/A'}</td>
                  <td>${item.Frequency || 'N/A'}</td>
                  <td>${item.Duration || 'N/A'}</td>
                  <td>${item.Quantity || '1'}</td>
                  ${item.Instructions ? `<td>${item.Instructions}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : '<div class="info-card"><p>No medications prescribed.</p></div>'}

        <!-- ALLERGIES -->
        ${allergies.length > 0 ? `
        <div class="section">
          <div class="section-title allergies">Allergies</div>
          ${allergies.filter((a: any) => a.Status === 'active').map((allergy: any) => `
            <div class="info-card ${allergy.Severity === 'severe' ? 'warning' : 'info'}">
              <div class="info-row">
                <span class="info-label">Allergen:</span>
                <span class="info-value"><strong>${allergy.AllergyName || allergy.allergyName}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Reaction:</span>
                <span class="info-value">${allergy.Reaction || allergy.reaction || 'Not specified'}</span>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- MEDICAL CONDITIONS -->
        ${medicalConditions.length > 0 ? `
        <div class="section">
          <div class="section-title conditions">Medical Conditions</div>
          ${medicalConditions.map((condition: any) => `
            <div class="info-card info">
              <div class="info-row">
                <span class="info-label">Condition:</span>
                <span class="info-value"><strong>${condition.ConditionName || condition.conditionName}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Diagnosed:</span>
                <span class="info-value">${condition.DiagnosisDate ? formatDate(condition.DiagnosisDate) : 'Unknown'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${condition.Status || condition.status || 'Active'}</span>
              </div>
              ${condition.Notes ? `
              <div class="info-row">
                <span class="info-label">Notes:</span>
                <span class="info-value">${condition.Notes}</span>
              </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- TREATMENT PLAN -->
        ${consultationForm.treatmentPlan || consultationForm.medicationPlan || consultationForm.nonMedicationPlan ? `
        <div class="section">
          <div class="section-title treatment">Treatment Plan</div>
          ${consultationForm.treatmentPlan ? `
          <div class="info-card success">
            <div class="info-row">
              <span class="info-label">Overall Plan:</span>
              <span class="info-value">${consultationForm.treatmentPlan.replace(/\n/g, '<br>')}</span>
            </div>
          </div>
          ` : ''}
          ${consultationForm.medicationPlan ? `
          <div class="info-card info">
            <div class="info-row">
              <span class="info-label">Medication Plan:</span>
              <span class="info-value">${consultationForm.medicationPlan.replace(/\n/g, '<br>')}</span>
            </div>
          </div>
          ` : ''}
          ${consultationForm.nonMedicationPlan ? `
          <div class="info-card info">
            <div class="info-row">
              <span class="info-label">Non-Medication Plan:</span>
              <span class="info-value">${consultationForm.nonMedicationPlan.replace(/\n/g, '<br>')}</span>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- LIFESTYLE & FOLLOW-UP -->
        ${consultationForm.lifestyleAdvice || consultationForm.warningSigns || consultationForm.needsFollowUp ? `
        <div class="section">
          <div class="section-title lifestyle">Lifestyle & Follow-up</div>
          ${consultationForm.lifestyleAdvice ? `
          <div class="info-card success">
            <div class="info-row">
              <span class="info-label">Lifestyle Advice:</span>
              <span class="info-value">${consultationForm.lifestyleAdvice.replace(/\n/g, '<br>')}</span>
            </div>
          </div>
          ` : ''}
          ${consultationForm.warningSigns ? `
          <div class="info-card warning">
            <div class="info-row">
              <span class="info-label">Warning Signs:</span>
              <span class="info-value">${consultationForm.warningSigns.replace(/\n/g, '<br>')}</span>
            </div>
          </div>
          ` : ''}
          ${consultationForm.needsFollowUp ? `
          <div class="info-card info">
            <div class="info-row">
              <span class="info-label">Follow-up Required:</span>
              <span class="info-value">Yes</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${consultationForm.followUpDate || 'To be scheduled'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Purpose:</span>
              <span class="info-value">${consultationForm.followUpPurpose || 'Follow-up consultation'}</span>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- DISPOSITION -->
        <div class="section">
          <div class="section-title">Final Disposition</div>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Patient Disposition:</span>
              <span class="info-value">${consultationForm.disposition || 'No disposition required'}</span>
            </div>
            ${consultationForm.referralNeeded ? `
            <div class="info-row">
              <span class="info-label">Referral:</span>
              <span class="info-value">Required - ${consultationForm.referralNotes || 'No additional notes'}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="footer">
          <p>This document was electronically generated by the Medical Clinic System.</p>
          <p>Document ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | Printed: ${new Date().toLocaleString()}</p>
          <p style="font-size: 10px; margin-top: 10px;">
            <strong>Disclaimer:</strong> This is a medical document. Unauthorized access, use, or disclosure is prohibited.
          </p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          }
        </script>
      </body>
      </html>
    `;
  };

  const latestVitals = vitals.length > 0 ? vitals[0] : null;
  const hasRecentVitals = latestVitals && (
    latestVitals.BloodPressure || 
    latestVitals.HeartRate || 
    latestVitals.Temperature || 
    latestVitals.OxygenSaturation
  );

  useEffect(() => {
    console.log('Consultation ID from props:', consultationId);
    console.log('Consultation form:', consultationForm);
    
    // Handle null/undefined
    if (!consultationId && !consultationForm?.consultationId && !consultationForm?.ConsultationID) {
      console.log('No consultation ID available');
      return;
    }
    
    // Use prop if available, otherwise check form
    const effectiveConsultationId = consultationId?.toString() || 
                                   consultationForm?.consultationId?.toString() || 
                                   consultationForm?.ConsultationID?.toString();
    
    console.log('Effective consultation ID:', effectiveConsultationId);
    
    if (!effectiveConsultationId || effectiveConsultationId === 'null' || effectiveConsultationId === 'undefined') {
      console.log('Invalid consultation ID:', effectiveConsultationId);
      return;
    }
    
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3001/api/doctor/prescriptions/consultation/${effectiveConsultationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched prescriptions:', data);
          setLoadedPrescriptions(data);
        } else {
          console.error('Failed to fetch prescriptions:', response.status);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }
    };
    
    fetchPrescriptions();
  }, [consultationId, consultationForm]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultation Summary</h1>
          <p className="text-sm text-gray-600 mt-0.5">Complete patient consultation overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            className="h-8 text-xs"
          >
            {Object.values(expandedSections).every(Boolean) ? (
              <>
                <EyeOff className="size-3 mr-1" />
                Collapse All
              </>
            ) : (
              <>
                <Eye className="size-3 mr-1" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Patient Info Banner */}
      <Card className="border shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="size-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Patient</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {safePatientData?.Name || 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600">Consultation</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600">Diagnosis</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {consultationForm.diagnosis || 'Not specified'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <span className="text-xs font-medium text-gray-600">Allergies</span>
              </div>
              <p className={`text-sm font-semibold ${hasAllergies ? 'text-red-600' : 'text-green-600'}`}>
                {hasAllergies ? 'Present' : 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Section */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Stethoscope className="size-4" />
              Diagnosis & Assessment
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('consultation')}
              className="h-6 w-6 p-0"
            >
              {expandedSections.consultation ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {expandedSections.consultation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Primary Diagnosis</Label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {consultationForm.diagnosis || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Severity</Label>
                  <Badge className={`mt-1 ${getSeverityColor(consultationForm.severityAssessment || consultationForm.severity)}`}>
                    {consultationForm.severityAssessment?.toUpperCase() || consultationForm.severity?.toUpperCase() || 'MODERATE'}
                  </Badge>
                </div>
              </div>
              
              {consultationForm.differentialDiagnosis && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Differential Diagnosis</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {consultationForm.differentialDiagnosis}
                  </p>
                </div>
              )}
              
              {consultationForm.diagnosisCode && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Diagnosis Code</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {consultationForm.diagnosisCode}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vital Signs */}
      {hasRecentVitals && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="size-4" />
                Vital Signs
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('vitals')}
                className="h-6 w-6 p-0"
              >
                {expandedSections.vitals ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {expandedSections.vitals && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {latestVitals.BloodPressure && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{latestVitals.BloodPressure}</p>
                    <p className="text-xs text-gray-600">Blood Pressure</p>
                  </div>
                )}
                {latestVitals.HeartRate && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{latestVitals.HeartRate}</p>
                    <p className="text-xs text-gray-600">Heart Rate</p>
                  </div>
                )}
                {latestVitals.Temperature && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{latestVitals.Temperature}°C</p>
                    <p className="text-xs text-gray-600">Temperature</p>
                  </div>
                )}
                {latestVitals.OxygenSaturation && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{latestVitals.OxygenSaturation}%</p>
                    <p className="text-xs text-gray-600">SpO₂</p>
                  </div>
                )}
                {latestVitals.RespiratoryRate && (
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{latestVitals.RespiratoryRate}</p>
                    <p className="text-xs text-gray-600">Resp. Rate</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescriptions Section - FIXED */}
      {hasMedications ? (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Pill className="size-4" />
                Prescribed Medications ({medicationItems.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('prescription')}
                className="h-6 w-6 p-0"
              >
                {expandedSections.prescription ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {expandedSections.prescription && (
              <div className="space-y-3">
                {medicationItems.map((item: any, index: number) => (
                  <div key={`${item.prescriptionId || index}-${index}`} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.DrugName || item.name || `Medication ${index + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {item.Dosage && (
                            <span className="text-sm text-gray-600">
                              Dosage: {item.Dosage}
                            </span>
                          )}
                          {item.Frequency && (
                            <span className="text-sm text-gray-600">
                              Frequency: {item.Frequency}
                            </span>
                          )}
                          {item.Duration && (
                            <span className="text-sm text-gray-600">
                              Duration: {item.Duration}
                            </span>
                          )}
                          {item.Quantity && (
                            <span className="text-sm text-gray-600">
                              Qty: {item.Quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.Instructions && (
                      <p className="text-sm text-gray-600 mt-2">
                        Instructions: {item.Instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Pill className="size-4" />
              Prescribed Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Pill className="size-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No medications prescribed</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergies */}
      {allergies.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="size-4" />
                Allergies ({allergies.filter(a => a.Status === 'active').length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('allergies')}
                className="h-6 w-6 p-0"
              >
                {expandedSections.allergies ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {expandedSections.allergies && (
              <div className="space-y-2">
                {allergies
                  .filter((a: any) => a.Status === 'active')
                  .map((allergy: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {allergy.AllergyName || allergy.allergyName}
                        </p>
                        <Badge className={`${
                          allergy.Severity === 'severe' ? 'bg-red-100 text-red-800' :
                          allergy.Severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {allergy.Severity || 'mild'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Reaction: {allergy.Reaction || allergy.reaction}
                      </p>
                      {allergy.Notes && (
                        <p className="text-sm text-gray-600 mt-1">Notes: {allergy.Notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Treatment Plan */}
      {(consultationForm.treatmentPlan || consultationForm.medicationPlan || consultationForm.nonMedicationPlan) && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="size-4" />
                Treatment Plan
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('treatment')}
                className="h-6 w-6 p-0"
              >
                {expandedSections.treatment ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {expandedSections.treatment && (
              <div className="space-y-4">
                {consultationForm.treatmentPlan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Overall Treatment Plan</Label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">
                      {consultationForm.treatmentPlan}
                    </p>
                  </div>
                )}
                {consultationForm.medicationPlan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Medication Plan</Label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">
                      {consultationForm.medicationPlan}
                    </p>
                  </div>
                )}
                {consultationForm.nonMedicationPlan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Non-Medication Plan</Label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">
                      {consultationForm.nonMedicationPlan}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical Conditions */}
      {medicalConditions.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="size-4" />
                Medical Conditions ({medicalConditions.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('conditions')}
                className="h-6 w-6 p-0"
              >
                {expandedSections.conditions ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {expandedSections.conditions && (
              <div className="space-y-2">
                {medicalConditions.map((condition: any, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-medium text-gray-900">
                      {condition.ConditionName || condition.conditionName}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        Diagnosed: {condition.DiagnosisDate ? formatDate(condition.DiagnosisDate) : 'Unknown'}
                      </span>
                      <span className="text-sm text-gray-600">
                        Status: {condition.Status || condition.status}
                      </span>
                    </div>
                    {condition.Notes && (
                      <p className="text-sm text-gray-600 mt-1">Notes: {condition.Notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-4 bg-white p-4 border rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="h-9"
              onClick={handleExportPDF}
            >
              <Download className="size-4 mr-2" />
              Export as PDF
            </Button>
            <Button 
              variant="outline" 
              className="h-9"
              onClick={handlePrintSummary}
            >
              <Printer className="size-4 mr-2" />
              Print Preview
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="h-9"
              onClick={onBackToConsultation}
            >
              Back to Consultation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}