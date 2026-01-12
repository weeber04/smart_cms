// SummaryTab.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Printer, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  Heart, 
  Thermometer, 
  Activity, 
  Battery, 
  AlertCircle, 
  Clock, 
  Stethoscope,
  Pill,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import type { PatientData, PatientVital } from './types';

interface SummaryTabProps {
  patientData: PatientData | null;
  vitals: PatientVital[];
  consultationForm: any;
  onBackToConsultation: () => void;
}

interface ExtendedPatientData extends PatientData {
  Allergy?: 'Y' | 'N';
  allergies?: string[];
  allergyNotes?: string;
}

export function SummaryTab({ patientData, vitals, consultationForm, onBackToConsultation }: SummaryTabProps) {
  const [expandedSections, setExpandedSections] = useState({
    consultation: false,
    vitals: false,
    prescription: false,
    allergies: false
  });

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
      allergies: !allExpanded
    });
  };

  const safePatientData = patientData as ExtendedPatientData;
  const hasAllergies = safePatientData?.Allergy === 'Y' || (safePatientData?.allergies && safePatientData.allergies.length > 0);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'severe':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Simple Print Function
const handlePrintSummary = () => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(generateSummaryHTML());
    printWindow.document.close();
    printWindow.focus();
    // REMOVE this setTimeout - let the HTML handle printing
    // setTimeout(() => {
    //   printWindow.print();
    // }, 500);
  }
};

  const generateSummaryHTML = () => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consultation Summary - ${safePatientData?.Name || 'Patient'}</title>
        <style>
          @media print {
            @page { margin: 20mm; }
            body { font-family: Arial, sans-serif; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background: #4f46e5;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
          }
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .vital-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
          }
          .prescription-item {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
          }
          .allergy-warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin: 2px;
          }
          .severity-moderate { background: #fef3c7; color: #92400e; }
          .severity-severe { background: #ffedd5; color: #9a3412; }
          .severity-critical { background: #fee2e2; color: #991b1b; }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .table th, .table td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
          }
          .table th {
            background: #f3f4f6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #4f46e5; margin-bottom: 5px;">CONSULTATION SUMMARY</h1>
          <p style="color: #6b7280; margin-bottom: 10px;">Generated: ${today}</p>
          <div style="display: inline-block; padding: 6px 20px; background: #fef3c7; border-radius: 20px; font-weight: bold; color: #92400e;">
            ${consultationForm.severity?.toUpperCase() || 'MODERATE'} SEVERITY
          </div>
        </div>

        <div class="patient-info">
          <div>
            <strong>Patient:</strong><br>
            ${safePatientData?.Name || 'N/A'}<br>
            IC: ${safePatientData?.ICNo || 'N/A'}
          </div>
          <div>
            <strong>Consultation Date:</strong><br>
            ${new Date().toLocaleDateString()}<br>
            Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div>
            <strong>Diagnosis:</strong><br>
            ${consultationForm.diagnosis || 'Not specified'}
          </div>
          <div>
            <strong>Allergies:</strong><br>
            ${hasAllergies ? 'PRESENT' : 'None recorded'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Consultation Details</div>
          <p><strong>Primary Diagnosis:</strong> ${consultationForm.diagnosis || 'Not specified'}</p>
          ${consultationForm.diagnosisCode ? `<p><strong>Diagnosis Code:</strong> ${consultationForm.diagnosisCode}</p>` : ''}
          ${consultationForm.notes ? `<p><strong>Clinical Notes:</strong><br>${consultationForm.notes.replace(/\n/g, '<br>')}</p>` : ''}
          <p><strong>Severity:</strong> <span class="badge severity-${consultationForm.severity?.toLowerCase() || 'moderate'}">${consultationForm.severity?.toUpperCase() || 'MODERATE'}</span></p>
        </div>

        ${vitals.length > 0 ? `
        <div class="section">
          <div class="section-title">Vital Signs</div>
          <div class="vitals-grid">
            <div class="vital-card">
              <strong>Blood Pressure</strong><br>
              <span style="font-size: 18px; font-weight: bold;">${vitals[0]?.BloodPressureSystolic || '--'}/${vitals[0]?.BloodPressureDiastolic || '--'}</span><br>
              <small>mmHg</small>
            </div>
            <div class="vital-card">
              <strong>Heart Rate</strong><br>
              <span style="font-size: 18px; font-weight: bold;">${vitals[0]?.HeartRate || '--'}</span><br>
              <small>bpm</small>
            </div>
            <div class="vital-card">
              <strong>Temperature</strong><br>
              <span style="font-size: 18px; font-weight: bold;">${vitals[0]?.Temperature || '--'}</span><br>
              <small>°C</small>
            </div>
            <div class="vital-card">
              <strong>SpO₂</strong><br>
              <span style="font-size: 18px; font-weight: bold;">${vitals[0]?.OxygenSaturation || '--'}</span><br>
              <small>%</small>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Treatment Plan & Prescription</div>
          <p><strong>Treatment Plan:</strong><br>${consultationForm.treatmentPlan || 'No treatment plan specified'}</p>
          
          ${consultationForm.prescriptions?.length > 0 ? `
          <h4 style="margin: 20px 0 10px 0;">Prescribed Medications:</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${consultationForm.prescriptions.map((med: any) => `
                <tr>
                  <td>${med.name || 'N/A'}</td>
                  <td>${med.dosage || 'N/A'}</td>
                  <td>${med.frequency || 'N/A'}</td>
                  <td>${med.duration || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p>No medications prescribed.</p>'}
        </div>

        ${hasAllergies ? `
        <div class="section">
          <div class="section-title" style="background: #dc2626;">Allergies & Warnings</div>
          <div class="allergy-warning">
            <strong style="color: #dc2626;">⚠️ PATIENT HAS DOCUMENTED ALLERGIES</strong>
            ${safePatientData?.allergies?.length ? `
            <p><strong>Known Allergies:</strong><br>
            ${safePatientData.allergies.map((allergy: string) => `<span class="badge" style="background: #fecaca; color: #991b1b;">${allergy}</span>`).join(' ')}
            </p>
            ` : ''}
            ${safePatientData?.allergyNotes ? `<p><strong>Additional Notes:</strong><br>${safePatientData.allergyNotes}</p>` : ''}
          </div>
        </div>
        ` : ''}

        ${consultationForm.followUpDate ? `
        <div class="section">
          <div class="section-title" style="background: #7c3aed;">Follow-up Instructions</div>
          <p><strong>Next Appointment:</strong> ${new Date(consultationForm.followUpDate).toLocaleDateString()}${consultationForm.followUpTime ? ` at ${consultationForm.followUpTime}` : ''}</p>
          ${consultationForm.followUpInstructions ? `<p><strong>Instructions:</strong><br>${consultationForm.followUpInstructions}</p>` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>This document was electronically generated by the Medical Clinic System.</p>
          <p>Document ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | Printed: ${new Date().toLocaleString()}</p>
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

  // Simple PDF Export (uses print to save as PDF)
  const handleExportPDF = () => {
    handlePrintSummary();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header - Compact */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultation Summary</h1>
          <p className="text-sm text-gray-600 mt-0.5">Review patient consultation details</p>
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
          <span className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Consultation Report</h2>
              <p className="text-sm text-gray-600">Complete summary of today's consultation</p>
            </div>
          </div>
          <Badge className={`px-3 py-1.5 font-medium ${getSeverityColor(consultationForm.severity)}`}>
            {consultationForm.severity?.toUpperCase() || 'MODERATE'}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          {/* Patient Info Row - 4 items in one row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="size-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Patient</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{safePatientData?.Name || 'N/A'}</p>
            </div>
            
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600">Consultation</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600">Diagnosis</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{consultationForm.diagnosis || 'Not specified'}</p>
            </div>
            
            <div className="space-y-1 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <span className="text-xs font-medium text-gray-600">Allergies</span>
              </div>
              <p className={`text-sm font-semibold ${hasAllergies ? 'text-red-600' : 'text-green-600'}`}>
                {hasAllergies ? 'Present' : 'None'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* ... Keep all your existing collapsed section components here ... */}
            {/* (All the Card components from previous code remain exactly the same) */}
            {/* Just copy the entire collapsed sections part from the previous answer */}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Simple Print & Export */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 text-sm"
              onClick={handleExportPDF}
            >
              <Download className="size-4 mr-2" />
              Export as PDF
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onBackToConsultation}
              className="h-9 text-sm"
            >
              Back to Form
            </Button>
            <Button 
              size="sm"
              className="h-9 text-sm bg-blue-600 hover:bg-blue-700"
            >
              Finalize Consultation
            </Button>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Click "Print Summary" to open a printer-friendly version in a new window.
          </p>
        </div>
      </div>
    </div>
  );
}