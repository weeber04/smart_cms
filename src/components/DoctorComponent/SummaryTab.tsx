// SummaryTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Printer, Download, FileText } from 'lucide-react';
import type { PatientData, PatientVital } from './types';

interface SummaryTabProps {
  patientData: PatientData | null;
  vitals: PatientVital[];
  consultationForm: any;
  onBackToConsultation: () => void;
}

export function SummaryTab({ patientData, vitals, consultationForm, onBackToConsultation }: SummaryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Consultation Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Patient Info Summary */}
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-medium">{patientData?.Name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Diagnosis</p>
              <p className="font-medium">{consultationForm.diagnosis || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Severity</p>
              <p className="font-medium capitalize">{consultationForm.severity}</p>
            </div>
          </div>
          
          {/* Vitals Summary */}
          {vitals.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Latest Vital Signs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <p className="text-xl font-semibold text-blue-700">
                    {vitals[0]?.BloodPressureSystolic}/{vitals[0]?.BloodPressureDiastolic}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-xl font-semibold text-green-700">
                    {vitals[0]?.Temperature}°C
                  </p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <p className="text-xl font-semibold text-pink-700">
                    {vitals[0]?.HeartRate} bpm
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">SpO₂</p>
                  <p className="text-xl font-semibold text-purple-700">
                    {vitals[0]?.OxygenSaturation}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Treatment Summary */}
          <div>
            <h4 className="font-semibold mb-3">Treatment Plan</h4>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-gray-800">{consultationForm.treatmentPlan || 'No treatment plan specified'}</p>
            </div>
          </div>
          
          {/* Follow-up Summary */}
          {consultationForm.followUpDate && (
            <div>
              <h4 className="font-semibold mb-3">Follow-up</h4>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium">Scheduled: {new Date(consultationForm.followUpDate).toLocaleDateString()}</p>
                <p className="text-sm mt-2">{consultationForm.followUpInstructions}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="size-4" />
            Print Summary
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="size-4" />
            Export as PDF
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 ml-auto"
            onClick={onBackToConsultation}
          >
            Back to Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}