// ConsultationForm.tsx - FIXED VERSION
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Activity, CheckCircle } from 'lucide-react';

interface ConsultationFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  activeStep: number;
  consultationSteps: Array<{ id: string; label: string; icon: string }>;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSaveConsultation: () => void;
  onNavigateToVitals: () => void;
  isSaving?: boolean; // ADD THIS LINE
}

export function ConsultationForm({
  formData,
  onFormChange,
  activeStep,
  consultationSteps,
  onPrevStep,
  onNextStep,
  onSaveConsultation,
  onNavigateToVitals,
  isSaving = false // ADD THIS LINE WITH DEFAULT VALUE
}: ConsultationFormProps) {
  
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Chief Complaint
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chief Complaint</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 1 of 6</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Main Complaint *</Label>
                <Textarea
                  placeholder="Describe the primary reason for visit..."
                  rows={2}
                  value={formData.chiefComplaint}
                  onChange={(e) => onFormChange('chiefComplaint', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  placeholder="e.g., 3 days, 2 weeks"
                  value={formData.duration}
                  onChange={(e) => onFormChange('duration', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select 
                value={formData.severity}
                onValueChange={(value) => onFormChange('severity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1: // History
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">History</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 2 of 6</Badge>
            </div>
            
            <div className="space-y-2">
              <Label>History of Present Illness</Label>
              <Textarea
                placeholder="Detailed description including onset, course, associated symptoms..."
                rows={3}
                value={formData.historyOfPresentIllness}
                onChange={(e) => onFormChange('historyOfPresentIllness', e.target.value)}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Past Medical History</Label>
                <Textarea
                  placeholder="Chronic conditions, surgeries, hospitalizations..."
                  rows={2}
                  value={formData.pastMedicalHistory}
                  onChange={(e) => onFormChange('pastMedicalHistory', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Family History</Label>
                <Textarea
                  placeholder="Family medical history..."
                  rows={2}
                  value={formData.familyHistory}
                  onChange={(e) => onFormChange('familyHistory', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Smoking</Label>
                <Select 
                  value={formData.smoking}
                  onValueChange={(value) => onFormChange('smoking', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non-smoker</SelectItem>
                    <SelectItem value="former">Former smoker</SelectItem>
                    <SelectItem value="current">Current smoker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select 
                  value={formData.alcohol}
                  onValueChange={(value) => onFormChange('alcohol', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non-drinker</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  placeholder="Occupation..."
                  value={formData.occupation}
                  onChange={(e) => onFormChange('occupation', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2: // Examination
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Physical Examination</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 3 of 6</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>General Appearance</Label>
                <Textarea
                  placeholder="Patient's general appearance, level of distress..."
                  rows={2}
                  value={formData.generalAppearance}
                  onChange={(e) => onFormChange('generalAppearance', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cardiovascular Exam</Label>
                <Textarea
                  placeholder="Heart sounds, murmurs, pulses..."
                  rows={2}
                  value={formData.cardiovascularExam}
                  onChange={(e) => onFormChange('cardiovascularExam', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Respiratory Exam</Label>
                <Textarea
                  placeholder="Lung sounds, breathing pattern..."
                  rows={2}
                  value={formData.respiratoryExam}
                  onChange={(e) => onFormChange('respiratoryExam', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Abdominal Exam</Label>
                <Textarea
                  placeholder="Bowel sounds, tenderness, masses..."
                  rows={2}
                  value={formData.abdominalExam}
                  onChange={(e) => onFormChange('abdominalExam', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Neurological Exam</Label>
              <Textarea
                placeholder="Cranial nerves, motor/sensory function, reflexes..."
                rows={2}
                value={formData.neurologicalExam}
                onChange={(e) => onFormChange('neurologicalExam', e.target.value)}
              />
            </div>
          </div>
        );

      case 3: // Diagnosis
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Diagnosis</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 4 of 6</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Diagnosis *</Label>
                <Textarea
                  placeholder="Enter primary diagnosis..."
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => onFormChange('diagnosis', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Diagnosis Code (ICD-10)</Label>
                <Input
                  placeholder="e.g., J06.9"
                  value={formData.diagnosisCode}
                  onChange={(e) => onFormChange('diagnosisCode', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Differential Diagnosis</Label>
              <Textarea
                placeholder="Alternative diagnoses considered..."
                rows={2}
                value={formData.differentialDiagnosis}
                onChange={(e) => onFormChange('differentialDiagnosis', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Severity Assessment</Label>
              <Select 
                value={formData.severityAssessment}
                onValueChange={(value) => onFormChange('severityAssessment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4: // Treatment Plan
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Treatment Plan</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 5 of 6</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Treatment Plan</Label>
                <Textarea
                  placeholder="Overall treatment plan..."
                  rows={2}
                  value={formData.treatmentPlan}
                  onChange={(e) => onFormChange('treatmentPlan', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Medication Plan</Label>
                <Textarea
                  placeholder="Medications prescribed..."
                  rows={2}
                  value={formData.medicationPlan}
                  onChange={(e) => onFormChange('medicationPlan', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Non-Medication Plan</Label>
                <Textarea
                  placeholder="Lifestyle changes, therapy, etc..."
                  rows={2}
                  value={formData.nonMedicationPlan}
                  onChange={(e) => onFormChange('nonMedicationPlan', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Patient Education</Label>
                <Textarea
                  placeholder="Education provided to patient..."
                  rows={2}
                  value={formData.patientEducation}
                  onChange={(e) => onFormChange('patientEducation', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => onFormChange('followUpDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Follow-up Instructions</Label>
                <Textarea
                  placeholder="Instructions for follow-up..."
                  rows={2}
                  value={formData.followUpInstructions}
                  onChange={(e) => onFormChange('followUpInstructions', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 5: // Summary
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Consultation Summary</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 6 of 6</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Consultation Notes</Label>
                  <Textarea
                    placeholder="Overall consultation notes..."
                    rows={3}
                    value={formData.consultationNotes}
                    onChange={(e) => onFormChange('consultationNotes', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disposition</Label>
                  <Select 
                    value={formData.disposition}
                    onValueChange={(value) => onFormChange('disposition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discharge">Discharge</SelectItem>
                      <SelectItem value="admit">Admit to Hospital</SelectItem>
                      <SelectItem value="referral">Refer to Specialist</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="referralNeeded"
                    checked={formData.referralNeeded}
                    onChange={(e) => onFormChange('referralNeeded', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="referralNeeded">Referral Needed</Label>
                </div>
              </div>
              
              {formData.referralNeeded && (
                <div className="space-y-2">
                  <Label>Referral Notes</Label>
                  <Textarea
                    placeholder="Details of referral needed..."
                    rows={2}
                    value={formData.referralNotes}
                    onChange={(e) => onFormChange('referralNotes', e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Lifestyle Advice</Label>
                <Textarea
                  placeholder="Diet, exercise, other lifestyle recommendations..."
                  rows={2}
                  value={formData.lifestyleAdvice}
                  onChange={(e) => onFormChange('lifestyleAdvice', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Warning Signs</Label>
                <Textarea
                  placeholder="Red flag symptoms to watch for..."
                  rows={2}
                  value={formData.warningSigns}
                  onChange={(e) => onFormChange('warningSigns', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Badge className="bg-green-100 text-green-800 mb-4">Consultation Complete</Badge>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Steps Completed</h3>
            <p className="text-gray-600">Click "Complete Consultation" to save all information.</p>
          </div>
        );
    }
  };

  return (
    <>
      <ScrollArea className="h-[calc(100vh-500px)]">
        {renderStepContent()}
        
        {activeStep < consultationSteps.length - 1 && activeStep !== 0 && (
          <Separator className="my-6" />
        )}
      </ScrollArea>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrevStep} disabled={activeStep === 0}>
            <ChevronLeft className="size-4 mr-2" />
            Previous
          </Button>
          <Button variant="outline" onClick={onNextStep} disabled={activeStep === consultationSteps.length - 1}>
            Next
            <ChevronRight className="size-4 ml-2" />
          </Button>
        </div>
        

<div className="flex gap-3">
  <Button 
    variant="outline" 
    onClick={onNavigateToVitals}
    className="flex items-center gap-2"
  >
    <Activity className="size-4" />
    Record Vitals
  </Button>
  <Button 
    className="bg-blue-600 hover:bg-blue-700" 
    onClick={onSaveConsultation}
    disabled={isSaving}
  >
    {isSaving ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      </>
    ) : (
      <>
        <CheckCircle className="size-4 mr-2" />
        Save Consultation {/* Changed from "Complete Consultation" */}
      </>
    )}
  </Button>
</div>
      </div>
    </>
  );
}