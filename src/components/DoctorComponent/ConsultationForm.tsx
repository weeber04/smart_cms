// ConsultationForm.tsx - SIMPLE FIXED VERSION
import { useState, useEffect, memo, useMemo } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  CheckCircle, 
  Edit2,
  Eye,
  Save,
  X
} from 'lucide-react';
import type { ConsultationFormData } from './types';

interface ConsultationFormProps {
  formData: ConsultationFormData;
  onFormChange: (field: keyof ConsultationFormData, value: any) => void;
  activeStep: number;
  consultationSteps: Array<{ id: string; label: string; icon: string }>;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSaveConsultation: () => void;
  onUpdateConsultation?: () => void;
  onNavigateToVitals: () => void;
  isSaving?: boolean;
  doctorId?: number;
  isConsultationSaved?: boolean;
  consultationId?: number | null;
}

// =========== MEMOIZED INPUT COMPONENTS ===========

// Memoized Textarea input component
const MemoizedTextInput = memo(function MemoizedTextInput({
  field,
  value,
  placeholder,
  rows = 1,
  className = '',
  required = false,
  readOnly = false,
  onChange,
  onClick
}: {
  field: string;
  value: string;
  placeholder: string;
  rows?: number;
  className?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onClick?: () => void;
}) {
  return (
    <Textarea
      key={`textarea-${field}`}
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`${className} ${readOnly ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : ''}`}
      readOnly={readOnly}
      required={required}
      onClick={onClick}
      style={{ 
        direction: 'ltr',
        textAlign: 'left',
        cursor: readOnly ? 'pointer' : 'text'
      }}
    />
  );
});

// Memoized Input component
const MemoizedSimpleInput = memo(function MemoizedSimpleInput({
  field,
  value,
  placeholder,
  type = 'text',
  readOnly = false,
  onChange,
  onClick
}: {
  field: string;
  value: string;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onClick?: () => void;
}) {
  return (
    <Input
      key={`input-${field}`}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={readOnly ? 'bg-gray-50 border-gray-200 cursor-pointer' : ''}
      readOnly={readOnly}
      onClick={onClick}
      style={{ 
        direction: 'ltr',
        textAlign: 'left',
        cursor: readOnly ? 'pointer' : 'text'
      }}
    />
  );
});

// Memoized Select component
const MemoizedSelectInput = memo(function MemoizedSelectInput({
  field,
  value,
  options,
  placeholder,
  readOnly = false,
  disabled = false,
  onChange
}: {
  field: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  if (readOnly) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[40px]">
        {options.find((opt) => opt.value === value)?.label || 
         value || 
         <span className="text-gray-400 italic">Not specified</span>}
      </div>
    );
  }
  
  return (
    <Select 
      key={`select-${field}`}
      value={value || ''}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

// Memoized Date Input component
const MemoizedDateInput = memo(function MemoizedDateInput({
  field,
  value,
  min,
  readOnly = false,
  disabled = false,
  onChange
}: {
  field: string;
  value: string;
  min?: string;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  if (readOnly) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[40px]">
        {value || <span className="text-gray-400 italic">Not specified</span>}
      </div>
    );
  }
  
  return (
    <Input
      key={`date-${field}`}
      type="date"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      min={min}
      disabled={disabled}
    />
  );
});

// Memoized Checkbox component
const MemoizedCheckboxInput = memo(function MemoizedCheckboxInput({
  field,
  checked,
  label,
  readOnly = false,
  disabled = false,
  onChange
}: {
  field: string;
  checked: boolean;
  label: string;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  if (readOnly) {
    return (
      <div className="p-2">
        {checked ? '✓ Yes' : '✗ No'}
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={field}
        checked={checked || false}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="rounded border-gray-300"
      />
      <Label htmlFor={field}>{label}</Label>
    </div>
  );
});

// =========== MAIN COMPONENT ===========

export function ConsultationForm({
  formData,
  onFormChange,
  activeStep,
  consultationSteps,
  onPrevStep,
  onNextStep,
  onSaveConsultation,
  onUpdateConsultation,
  onNavigateToVitals,
  isSaving = false,
  doctorId,
  isConsultationSaved = false,
  consultationId = null
}: ConsultationFormProps) {
  
  // Set initial mode based on whether consultation is saved
  const [isViewMode, setIsViewMode] = useState(isConsultationSaved);
  const [isEditMode, setIsEditMode] = useState(!isConsultationSaved);
  const isReadOnly = isViewMode && !isEditMode;

  // Update modes when isConsultationSaved changes
  useEffect(() => {
    if (isConsultationSaved) {
      setIsViewMode(true);
      setIsEditMode(false);
    } else {
      setIsViewMode(false);
      setIsEditMode(true);
    }
  }, [isConsultationSaved]);

  // Toggle to edit mode
  const handleEditClick = () => {
    setIsEditMode(true);
    setIsViewMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsViewMode(true);
  };

  // Handle update consultation
  const handleUpdateClick = async () => {
    if (onUpdateConsultation) {
      await onUpdateConsultation();
    }
  };

  // Field renderer helper
  const renderField = (
    label: string,
    fieldName: keyof ConsultationFormData,
    renderInput: () => React.ReactNode,
    colSpan: number = 1
  ) => (
    <div className={`space-y-2 ${colSpan > 1 ? `md:col-span-${colSpan}` : ''}`}>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {renderInput()}
    </div>
  );

  // Mode indicator
  const ModeIndicator = () => {
    if (isConsultationSaved) {
      return (
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Edit2 className="size-3 mr-1" />
              Edit Mode
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Eye className="size-3 mr-1" />
              View Mode
            </Badge>
          )}
          {consultationId && (
            <Badge variant="outline" className="text-xs">
              ID: {consultationId}
            </Badge>
          )}
        </div>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        New Consultation
      </Badge>
    );
  };

  // For view mode, show all data at once
  if (isViewMode && !isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Saved Consultation Details
          </h3>
          <ModeIndicator />
        </div>
        
        <div className="space-y-6">
          {/* Chief Complaint Section */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">Chief Complaint</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Main Complaint', 'chiefComplaint', () => 
                <MemoizedTextInput
                  field="chiefComplaint"
                  value={formData.chiefComplaint || ''}
                  placeholder="Describe the primary reason for visit..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Duration', 'duration', () => 
                <MemoizedSimpleInput
                  field="duration"
                  value={formData.duration || ''}
                  placeholder="e.g., 3 days, 2 weeks"
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Severity', 'severity', () => 
                <MemoizedSelectInput
                  field="severity"
                  value={formData.severity || ''}
                  options={[
                    { value: 'mild', label: 'Mild' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'severe', label: 'Severe' }
                  ]}
                  placeholder="Select severity"
                  readOnly={true}
                />
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">History</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('History of Present Illness', 'historyOfPresentIllness', () => 
                <MemoizedTextInput
                  field="historyOfPresentIllness"
                  value={formData.historyOfPresentIllness || ''}
                  placeholder="Detailed description..."
                  rows={3}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Past Medical History', 'pastMedicalHistory', () => 
                <MemoizedTextInput
                  field="pastMedicalHistory"
                  value={formData.pastMedicalHistory || ''}
                  placeholder="Chronic conditions..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Family History', 'familyHistory', () => 
                <MemoizedTextInput
                  field="familyHistory"
                  value={formData.familyHistory || ''}
                  placeholder="Family medical history..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
          </div>

          {/* Examination Section */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">Physical Examination</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('General Appearance', 'generalAppearance', () => 
                <MemoizedTextInput
                  field="generalAppearance"
                  value={formData.generalAppearance || ''}
                  placeholder="Patient's general appearance..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Cardiovascular Exam', 'cardiovascularExam', () => 
                <MemoizedTextInput
                  field="cardiovascularExam"
                  value={formData.cardiovascularExam || ''}
                  placeholder="Heart sounds, murmurs..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Respiratory Exam', 'respiratoryExam', () => 
                <MemoizedTextInput
                  field="respiratoryExam"
                  value={formData.respiratoryExam || ''}
                  placeholder="Lung sounds..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Abdominal Exam', 'abdominalExam', () => 
                <MemoizedTextInput
                  field="abdominalExam"
                  value={formData.abdominalExam || ''}
                  placeholder="Bowel sounds..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Neurological Exam', 'neurologicalExam', () => 
                <MemoizedTextInput
                  field="neurologicalExam"
                  value={formData.neurologicalExam || ''}
                  placeholder="Cranial nerves..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">Diagnosis</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Primary Diagnosis', 'diagnosis', () => 
                <MemoizedTextInput
                  field="diagnosis"
                  value={formData.diagnosis || ''}
                  placeholder="Enter primary diagnosis..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Differential Diagnosis', 'differentialDiagnosis', () => 
                <MemoizedTextInput
                  field="differentialDiagnosis"
                  value={formData.differentialDiagnosis || ''}
                  placeholder="Alternative diagnoses..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Severity Assessment', 'severityAssessment', () => 
                <MemoizedSelectInput
                  field="severityAssessment"
                  value={formData.severityAssessment || ''}
                  options={[
                    { value: 'mild', label: 'Mild' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'severe', label: 'Severe' }
                  ]}
                  placeholder="Select severity"
                  readOnly={true}
                />
              )}
            </div>
          </div>

          {/* Treatment Plan Section */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">Treatment Plan</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Treatment Plan', 'treatmentPlan', () => 
                <MemoizedTextInput
                  field="treatmentPlan"
                  value={formData.treatmentPlan || ''}
                  placeholder="Overall treatment plan..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Medication Plan', 'medicationPlan', () => 
                <MemoizedTextInput
                  field="medicationPlan"
                  value={formData.medicationPlan || ''}
                  placeholder="Medications prescribed..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Non-Medication Plan', 'nonMedicationPlan', () => 
                <MemoizedTextInput
                  field="nonMedicationPlan"
                  value={formData.nonMedicationPlan || ''}
                  placeholder="Lifestyle changes..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Patient Education', 'patientEducation', () => 
                <MemoizedTextInput
                  field="patientEducation"
                  value={formData.patientEducation || ''}
                  placeholder="Education provided..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
          </div>

          {/* Follow-up Section */}
          {formData.needsFollowUp && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-gray-900 border-b pb-2">Follow-up Appointment</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {renderField('Date', 'followUpDate', () => 
                  <MemoizedDateInput
                    field="followUpDate"
                    value={formData.followUpDate || ''}
                    min={new Date().toISOString().split('T')[0]}
                    readOnly={true}
                  />
                )}
                {renderField('Time', 'followUpTime', () => 
                  <MemoizedSimpleInput
                    field="followUpTime"
                    value={formData.followUpTime || ''}
                    placeholder="e.g., 14:30"
                    readOnly={true}
                    onClick={isConsultationSaved ? handleEditClick : undefined}
                  />
                )}
                {renderField('Purpose', 'followUpPurpose', () => 
                  <MemoizedTextInput
                    field="followUpPurpose"
                    value={formData.followUpPurpose || ''}
                    placeholder="Follow-up purpose..."
                    rows={1}
                    readOnly={true}
                    onClick={isConsultationSaved ? handleEditClick : undefined}
                  />
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4 p-4 bg-white border rounded-lg">
            <h4 className="font-medium text-gray-900 border-b pb-2">Additional Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Consultation Notes', 'consultationNotes', () => 
                <MemoizedTextInput
                  field="consultationNotes"
                  value={formData.consultationNotes || ''}
                  placeholder="Overall consultation notes..."
                  rows={3}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Lifestyle Advice', 'lifestyleAdvice', () => 
                <MemoizedTextInput
                  field="lifestyleAdvice"
                  value={formData.lifestyleAdvice || ''}
                  placeholder="Lifestyle recommendations..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}

                            {formData.referralNeeded && (
                <div className="md:col-span-2">
                  {renderField('Referral Notes', 'referralNotes', () => 
                    <MemoizedTextInput
                      field="referralNotes"
                      value={formData.referralNotes || ''}
                      placeholder="Details of referral..."
                      rows={2}
                      readOnly={true}
                      onClick={isConsultationSaved ? handleEditClick : undefined}
                    />
                  )}
                </div>
              )}
              {renderField('Warning Signs', 'warningSigns', () => 
                <MemoizedTextInput
                  field="warningSigns"
                  value={formData.warningSigns || ''}
                  placeholder="Red flag symptoms..."
                  rows={2}
                  readOnly={true}
                  onClick={isConsultationSaved ? handleEditClick : undefined}
                />
              )}
{renderField('Disposition', 'disposition', () => 
  <MemoizedSelectInput
    field="disposition"
    value={formData.disposition || 'No disposition'}  // Default to 'No disposition'
    options={[
      { value: 'No disposition', label: 'No disposition required' },
      { value: 'admit', label: 'Admit to Hospital' },
      { value: 'referral', label: 'Refer to Specialist' },
      { value: 'observation', label: 'Observation' }
    ]}
    placeholder="Select disposition"
    readOnly={isReadOnly}
    disabled={isReadOnly}
    onChange={(value) => onFormChange('disposition', value)}
  />
)}

            </div>
          </div>
        </div>

        {/* Action Buttons for View Mode */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleEditClick}
            className="flex items-center gap-2"
          >
            <Edit2 className="size-4" />
            Edit Consultation
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onNavigateToVitals}
            className="flex items-center gap-2"
          >
            <Activity className="size-4" />
            Record Vitals
          </Button>
        </div>
      </div>
    );
  }

  // Original step-by-step form for edit mode
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Chief Complaint
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chief Complaint</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">Step 1 of 6</Badge>
                <ModeIndicator />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Main Complaint *', 'chiefComplaint', () => 
                <MemoizedTextInput
                  field="chiefComplaint"
                  value={formData.chiefComplaint || ''}
                  placeholder="Describe the primary reason for visit..."
                  rows={2}
                  required={true}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('chiefComplaint', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Duration', 'duration', () => 
                <MemoizedSimpleInput
                  field="duration"
                  value={formData.duration || ''}
                  placeholder="e.g., 3 days, 2 weeks"
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('duration', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
            
            {renderField('Severity', 'severity', () => 
              <MemoizedSelectInput
                field="severity"
                value={formData.severity || ''}
                options={[
                  { value: 'mild', label: 'Mild' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'severe', label: 'Severe' }
                ]}
                placeholder="Select severity"
                readOnly={isReadOnly}
                disabled={isReadOnly}
                onChange={(value) => onFormChange('severity', value)}
              />
            )}
          </div>
        );

      case 1: // History
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">History</h3>
              <Badge className="bg-blue-100 text-blue-800">Step 2 of 6</Badge>
            </div>
            
            {renderField('History of Present Illness', 'historyOfPresentIllness', () => 
              <MemoizedTextInput
                field="historyOfPresentIllness"
                value={formData.historyOfPresentIllness || ''}
                placeholder="Detailed description including onset, course, associated symptoms..."
                rows={3}
                readOnly={isReadOnly}
                onChange={(value) => onFormChange('historyOfPresentIllness', value)}
                onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
              />
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderField('Past Medical History', 'pastMedicalHistory', () => 
                <MemoizedTextInput
                  field="pastMedicalHistory"
                  value={formData.pastMedicalHistory || ''}
                  placeholder="Chronic conditions, surgeries, hospitalizations..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('pastMedicalHistory', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Family History', 'familyHistory', () => 
                <MemoizedTextInput
                  field="familyHistory"
                  value={formData.familyHistory || ''}
                  placeholder="Family medical history..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('familyHistory', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {renderField('Smoking', 'smoking', () => 
                <MemoizedSelectInput
                  field="smoking"
                  value={formData.smoking || ''}
                  options={[
                    { value: 'none', label: 'Non-smoker' },
                    { value: 'former', label: 'Former smoker' },
                    { value: 'current', label: 'Current smoker' }
                  ]}
                  placeholder="Select"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  onChange={(value) => onFormChange('smoking', value)}
                />
              )}
              {renderField('Alcohol', 'alcohol', () => 
                <MemoizedSelectInput
                  field="alcohol"
                  value={formData.alcohol || ''}
                  options={[
                    { value: 'none', label: 'Non-drinker' },
                    { value: 'occasional', label: 'Occasional' },
                    { value: 'regular', label: 'Regular' }
                  ]}
                  placeholder="Select"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  onChange={(value) => onFormChange('alcohol', value)}
                />
              )}
              {renderField('Occupation', 'occupation', () => 
                <MemoizedSimpleInput
                  field="occupation"
                  value={formData.occupation || ''}
                  placeholder="Occupation..."
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('occupation', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
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
              {renderField('General Appearance', 'generalAppearance', () => 
                <MemoizedTextInput
                  field="generalAppearance"
                  value={formData.generalAppearance || ''}
                  placeholder="Patient's general appearance, level of distress..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('generalAppearance', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Cardiovascular Exam', 'cardiovascularExam', () => 
                <MemoizedTextInput
                  field="cardiovascularExam"
                  value={formData.cardiovascularExam || ''}
                  placeholder="Heart sounds, murmurs, pulses..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('cardiovascularExam', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Respiratory Exam', 'respiratoryExam', () => 
                <MemoizedTextInput
                  field="respiratoryExam"
                  value={formData.respiratoryExam || ''}
                  placeholder="Lung sounds, breathing pattern..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('respiratoryExam', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Abdominal Exam', 'abdominalExam', () => 
                <MemoizedTextInput
                  field="abdominalExam"
                  value={formData.abdominalExam || ''}
                  placeholder="Bowel sounds, tenderness, masses..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('abdominalExam', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
            
            {renderField('Neurological Exam', 'neurologicalExam', () => 
              <MemoizedTextInput
                field="neurologicalExam"
                value={formData.neurologicalExam || ''}
                placeholder="Cranial nerves, motor/sensory function, reflexes..."
                rows={2}
                readOnly={isReadOnly}
                onChange={(value) => onFormChange('neurologicalExam', value)}
                onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
              />
            )}
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
              {renderField('Primary Diagnosis *', 'diagnosis', () => 
                <MemoizedTextInput
                  field="diagnosis"
                  value={formData.diagnosis || ''}
                  placeholder="Enter primary diagnosis..."
                  rows={2}
                  required={true}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('diagnosis', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}

                          {renderField('Differential Diagnosis', 'differentialDiagnosis', () => 
              <MemoizedTextInput
                field="differentialDiagnosis"
                value={formData.differentialDiagnosis || ''}
                placeholder="Alternative diagnoses considered..."
                rows={2}
                readOnly={isReadOnly}
                onChange={(value) => onFormChange('differentialDiagnosis', value)}
                onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
              />
            )}
            </div>
            
            
            {renderField('Severity Assessment', 'severityAssessment', () => 
              <MemoizedSelectInput
                field="severityAssessment"
                value={formData.severityAssessment || ''}
                options={[
                  { value: 'mild', label: 'Mild' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'severe', label: 'Severe' }
                ]}
                placeholder="Select severity"
                readOnly={isReadOnly}
                disabled={isReadOnly}
                onChange={(value) => onFormChange('severityAssessment', value)}
              />
            )}
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
              {renderField('Treatment Plan', 'treatmentPlan', () => 
                <MemoizedTextInput
                  field="treatmentPlan"
                  value={formData.treatmentPlan || ''}
                  placeholder="Overall treatment plan..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('treatmentPlan', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Medication Plan', 'medicationPlan', () => 
                <MemoizedTextInput
                  field="medicationPlan"
                  value={formData.medicationPlan || ''}
                  placeholder="Medications prescribed..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('medicationPlan', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Non-Medication Plan', 'nonMedicationPlan', () => 
                <MemoizedTextInput
                  field="nonMedicationPlan"
                  value={formData.nonMedicationPlan || ''}
                  placeholder="Lifestyle changes, therapy, etc..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('nonMedicationPlan', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
              {renderField('Patient Education', 'patientEducation', () => 
                <MemoizedTextInput
                  field="patientEducation"
                  value={formData.patientEducation || ''}
                  placeholder="Education provided to patient..."
                  rows={2}
                  readOnly={isReadOnly}
                  onChange={(value) => onFormChange('patientEducation', value)}
                  onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                />
              )}
            </div>
            {/* Follow-up Section */}
            <div className="space-y-3 pt-3 border-t">
              {renderField('', 'needsFollowUp', () => 
                <MemoizedCheckboxInput
                  field="needsFollowUp"
                  checked={formData.needsFollowUp || false}
                  label="Schedule Follow-up Appointment"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  onChange={(checked) => onFormChange('needsFollowUp', checked)}
                />
              )}
              
              {formData.needsFollowUp && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {renderField('Follow-up Date', 'followUpDate', () => 
                    <MemoizedDateInput
                      field="followUpDate"
                      value={formData.followUpDate || ''}
                      min={new Date().toISOString().split('T')[0]}
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
                      onChange={(value) => onFormChange('followUpDate', value)}
                    />
                  )}
                  
                  {renderField('Follow-up Purpose', 'followUpPurpose', () => 
                    <MemoizedSimpleInput
                      field="followUpPurpose"
                      value={formData.followUpPurpose || ''}
                      placeholder="e.g., Monitor progress, Check lab results..."
                      readOnly={isReadOnly}
                      onChange={(value) => onFormChange('followUpPurpose', value)}
                      onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                    />
                  )}
                  
                  <div className="md:col-span-2">
                    {renderField('Follow-up Time', 'followUpTime', () => 
                      <MemoizedSimpleInput
                        field="followUpTime"
                        value={formData.followUpTime || ''}
                        placeholder="e.g., 14:30"
                        readOnly={isReadOnly}
                        onChange={(value) => onFormChange('followUpTime', value)}
                        onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                      />
                    )}
                  </div>
                </div>
              )}
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
                {renderField('Consultation Notes', 'consultationNotes', () => 
                  <MemoizedTextInput
                    field="consultationNotes"
                    value={formData.consultationNotes || ''}
                    placeholder="Overall consultation notes..."
                    rows={3}
                    readOnly={isReadOnly}
                    onChange={(value) => onFormChange('consultationNotes', value)}
                    onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                  />
                )}
{renderField('Disposition', 'disposition', () => 
  <MemoizedSelectInput
    field="disposition"
    value={formData.disposition || 'No disposition'}  // Default to 'No disposition'
    options={[
      { value: 'No disposition', label: 'No disposition required' },
      { value: 'admit', label: 'Admit to Hospital' },
      { value: 'referral', label: 'Refer to Specialist' },
      { value: 'observation', label: 'Observation' }
    ]}
    placeholder="Select disposition"
    readOnly={isReadOnly}
    disabled={isReadOnly}
    onChange={(value) => onFormChange('disposition', value)}
  />
)}
              </div> 
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderField('Lifestyle Advice', 'lifestyleAdvice', () => 
                  <MemoizedTextInput
                    field="lifestyleAdvice"
                    value={formData.lifestyleAdvice || ''}
                    placeholder="Diet, exercise, other lifestyle recommendations..."
                    rows={2}
                    readOnly={isReadOnly}
                    onChange={(value) => onFormChange('lifestyleAdvice', value)}
                    onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                  />
                )}
                
                {renderField('Warning Signs', 'warningSigns', () => 
                  <MemoizedTextInput
                    field="warningSigns"
                    value={formData.warningSigns || ''}
                    placeholder="Red flag symptoms to watch for..."
                    rows={2}
                    readOnly={isReadOnly}
                    onChange={(value) => onFormChange('warningSigns', value)}
                    onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                  />
                )}
              </div>

                                              <div className="space-y-2">
                {renderField('', 'referralNeeded', () => 
                  <MemoizedCheckboxInput
                    field="referralNeeded"
                    checked={formData.referralNeeded || false}
                    label="Referral Needed"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                    onChange={(checked) => onFormChange('referralNeeded', checked)}
                  />
                )}
              </div>

                            {formData.referralNeeded && (
                <div className="space-y-4">
                  {renderField('Referral Notes', 'referralNotes', () => 
                    <MemoizedTextInput
                      field="referralNotes"
                      value={formData.referralNotes || ''}
                      placeholder="Details of referral needed..."
                      rows={2}
                      readOnly={isReadOnly}
                      onChange={(value) => onFormChange('referralNotes', value)}
                      onClick={isReadOnly && isConsultationSaved ? handleEditClick : undefined}
                    />
                  )}

                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Badge className="bg-green-100 text-green-800 mb-4">Consultation Complete</Badge>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Steps Completed</h3>
            <p className="text-gray-600">Click "Save Consultation" to save all information.</p>
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
          <Button 
            variant="outline" 
            onClick={onPrevStep} 
            disabled={activeStep === 0 || isSaving}
          >
            <ChevronLeft className="size-4 mr-2" />
            Previous
          </Button>
          <Button 
            variant="outline" 
            onClick={onNextStep} 
            disabled={activeStep === consultationSteps.length - 1 || isSaving}
          >
            Next
            <ChevronRight className="size-4 ml-2" />
          </Button>
          
          {/* Cancel Edit button */}
          {isEditMode && isConsultationSaved && (
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className="flex items-center gap-2"
            >
              <X className="size-4" />
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          {!isViewMode && (
            <Button 
              variant="outline" 
              onClick={onNavigateToVitals}
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              <Activity className="size-4" />
              Record Vitals
            </Button>
          )}
          
          {/* Save/Update button */}
          {!isConsultationSaved && (
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
                  Save Consultation
                </>
              )}
            </Button>
          )}
          
          {isEditMode && isConsultationSaved && onUpdateConsultation && (
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleUpdateClick}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Update Consultation
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}