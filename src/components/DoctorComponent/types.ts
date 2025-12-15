// types.ts
export type PatientVital = {
  VitalSignID?: number;
  ConsultationID?: number;
  TakenBy: number;
  TakenAt: string;
  BloodPressureSystolic?: string;
  BloodPressureDiastolic?: string;
  BloodPressure?: string;
  HeartRate?: string;
  RespiratoryRate?: string;
  Temperature?: string;
  OxygenSaturation?: string;
  Height?: string;
  Weight?: string;
  BMI?: string;
  PainLevel?: string;
  Notes?: string;
};

export type PatientData = {
  PatientID: number;
  Name: string;
  ICNo: string;
  Gender: string;
  DOB: string;
  age?: number;
  BloodType?: string;
  PhoneNumber?: string;
  Email?: string;
  Address?: string;
  InsuranceProvider?: string;
  InsurancePolicyNo?: string;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
};

export type AllergyFinding = {
  AllergyFindingID?: number;
  ConsultationID?: number;
  AllergyName: string;
  Reaction: string;
  Severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  OnsetDate: string;
  Status: 'active' | 'resolved' | 'unknown';
  Notes?: string;
};

export type MedicalCondition = {
  ConditionID?: number;
  PatientID: number;
  ConditionName: string;
  DiagnosedDate: string;
  Status: 'active' | 'resolved' | 'chronic';
  Notes?: string;
};

export type PatientVisit = {
  VisitID: number;
  VisitType: 'first-time' | 'follow-up' | 'walk-in';
  ArrivalTime: string;
  VisitStatus: string;
  VisitNotes?: string;
  DoctorName?: string;
};

export type ConsultationFormData = {
  chiefComplaint: string;
  duration: string;
  severity: string;
  historyOfPresentIllness: string;
  onset: string;
  progression: string;
  relievingFactors: string;
  aggravatingFactors: string;
  pastMedicalHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  smoking: string;
  alcohol: string;
  occupation: string;
  generalReview: string;
  cardiovascularReview: string;
  respiratoryReview: string;
  gastrointestinalReview: string;
  neurologicalReview: string;
  generalAppearance: string;
  vitalSignsNotes: string;
  cardiovascularExam: string;
  respiratoryExam: string;
  abdominalExam: string;
  neurologicalExam: string;
  diagnosis: string;
  differentialDiagnosis: string;
  diagnosisCode: string;
  severityAssessment: string;
  treatmentPlan: string;
  medicationPlan: string;
  nonMedicationPlan: string;
  followUpInstructions: string;
  followUpDate: string;
  patientEducation: string;
  lifestyleAdvice: string;
  warningSigns: string;
  consultationNotes: string;
  disposition: string;
  referralNeeded: boolean;
  referralNotes: string;
};

export type ConsultationTabProps = {
  doctorId: number | null;
  doctorProfile: any;
  todayAppointments: any[];
  setTodayAppointments: (appointments: any[]) => void;
};

export type AllergyFormData = {
  AllergyName: string;
  Reaction: string;
  Severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  OnsetDate: string;
  Status: 'active' | 'resolved' | 'unknown';
  Notes: string;
};

export type MedicalConditionFormData = {
  ConditionName: string;
  DiagnosedDate: string;
  Status: 'active' | 'resolved' | 'chronic';
  Notes: string;
};

export type ConsultationStep = {
  id: string;
  label: string;
  icon: string;
};