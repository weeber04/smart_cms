// src/services/medicalHistoryService.ts

/**
 * Auto-create medical history entries from consultation data
 */
export async function createMedicalHistoryFromConsultation(
  patientId: number,
  consultationId: number,
  doctorId: number,
  formData: any,
  token: string
): Promise<number> {
  const medicalHistoryEntries = [];

  // 1. DIAGNOSIS/CONDITION (Primary)
  if (formData.diagnosis?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'condition',
      RecordName: formData.diagnosis,
      Description: `Primary diagnosis: ${formData.diagnosis}\nDiagnosis code: ${formData.diagnosisCode || 'Not specified'}\nSeverity: ${formData.severityAssessment || 'Not specified'}`,
      Status: 'active',
      StartDate: new Date().toISOString().split('T')[0],
      Severity: formData.severityAssessment || 'moderate',
      Notes: formData.consultationNotes || '',
      CreatedBy: doctorId
    });
  }

  // 2. CHIEF COMPLAINT (as symptom history)
  if (formData.chiefComplaint?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'other',
      RecordName: 'Chief Complaint',
      Description: formData.chiefComplaint,
      Status: 'resolved',
      StartDate: new Date().toISOString().split('T')[0],
      EndDate: new Date().toISOString().split('T')[0],
      Severity: formData.severity || 'moderate',
      Notes: `Documented during consultation. Duration: ${formData.duration || 'Not specified'}`,
      CreatedBy: doctorId
    });
  }

  // 3. DIFFERENTIAL DIAGNOSIS
  if (formData.differentialDiagnosis?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'condition',
      RecordName: 'Differential Diagnoses',
      Description: formData.differentialDiagnosis,
      Status: 'resolved', // Marked as resolved since primary diagnosis was made
      Notes: 'Considered during differential diagnosis',
      CreatedBy: doctorId
    });
  }

  // 4. PAST MEDICAL HISTORY (documented during this visit)
  if (formData.pastMedicalHistory?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'condition',
      RecordName: 'Documented Medical History',
      Description: formData.pastMedicalHistory,
      Status: 'chronic',
      Notes: 'Patient-reported past medical history documented during consultation',
      CreatedBy: doctorId
    });
  }

  // 5. LIFESTYLE FACTORS
  if (formData.smoking || formData.alcohol || formData.occupation) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'other',
      RecordName: 'Social/Lifestyle History',
      Description: `Smoking: ${formData.smoking || 'None'}\nAlcohol: ${formData.alcohol || 'None'}\nOccupation: ${formData.occupation || 'Not specified'}`,
      Status: 'active',
      Notes: 'Social and lifestyle factors documented',
      CreatedBy: doctorId
    });
  }

  // 6. TREATMENT PLAN
  if (formData.treatmentPlan?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'procedure',
      RecordName: 'Treatment Plan',
      Description: formData.treatmentPlan,
      Status: 'active',
      StartDate: new Date().toISOString().split('T')[0],
      Notes: formData.medicationPlan || formData.nonMedicationPlan || '',
      CreatedBy: doctorId
    });
  }

  // 7. REFERRAL (if needed)
  if (formData.referralNeeded) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'procedure',
      RecordName: 'Medical Referral',
      Description: formData.referralNotes || 'Patient requires specialist referral',
      Status: 'pending',
      StartDate: new Date().toISOString().split('T')[0],
      Notes: formData.referralNotes || '',
      CreatedBy: doctorId
    });
  }

  // 8. PATIENT EDUCATION / LIFESTYLE ADVICE
  if (formData.patientEducation?.trim() || formData.lifestyleAdvice?.trim()) {
    medicalHistoryEntries.push({
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'other',
      RecordName: 'Patient Education',
      Description: `${formData.patientEducation || ''}\n${formData.lifestyleAdvice || ''}`,
      Status: 'active',
      Notes: 'Education and advice provided to patient',
      CreatedBy: doctorId
    });
  }

  // Save all medical history entries to the database
  let savedCount = 0;
  
  for (const entry of medicalHistoryEntries) {
    try {
      const response = await fetch('http://localhost:3001/api/medical-history/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entry)
      });

      if (response.ok) {
        savedCount++;
      } else {
        console.error('Failed to save medical history entry:', await response.text());
      }
    } catch (error) {
      console.error('Error saving medical history entry:', error);
    }
  }

  return savedCount;
}

/**
 * Save individual medical history entry for allergies
 */
export async function saveAllergyToMedicalHistory(
  patientId: number,
  consultationId: number,
  doctorId: number,
  allergyData: any,
  token: string
): Promise<boolean> {
  try {
    const historyEntry = {
      PatientID: patientId,
      ConsultationID: consultationId,
      RecordType: 'allergy',
      RecordName: allergyData.AllergyName,
      Description: `Reaction: ${allergyData.Reaction || 'Not specified'}\nSeverity: ${allergyData.Severity || 'Not specified'}`,
      Status: allergyData.Status || 'active',
      StartDate: allergyData.OnsetDate || new Date().toISOString().split('T')[0],
      Severity: allergyData.Severity || 'mild',
      Reaction: allergyData.Reaction || '',
      Notes: allergyData.Notes || '',
      CreatedBy: doctorId
    };

    const response = await fetch('http://localhost:3001/api/medical-history/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(historyEntry)
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving allergy to medical history:', error);
    return false;
  }
}

/**
 * Save prescription to medical history
 */
export async function savePrescriptionToMedicalHistory(
  patientId: number,
  consultationId: number,
  doctorId: number,
  prescriptionData: any,
  token: string
): Promise<number> {
  let savedCount = 0;
  
  // If prescription has items array
  if (prescriptionData.items && Array.isArray(prescriptionData.items)) {
    for (const item of prescriptionData.items) {
      try {
        const historyEntry = {
          PatientID: patientId,
          ConsultationID: consultationId,
          RecordType: 'medication',
          RecordName: item.DrugName || item.medicationName || 'Medication',
          Description: `${item.Dosage || item.dosage || ''} ${item.Frequency || item.frequency || ''} ${item.Duration ? `for ${item.Duration}` : ''}`,
          Status: 'active',
          StartDate: new Date().toISOString().split('T')[0],
          Dosage: item.Dosage || item.dosage || '',
          Frequency: item.Frequency || item.frequency || '',
          PrescribedBy: doctorId,
          Notes: prescriptionData.remarks || prescriptionData.notes || ''
        };

        const response = await fetch('http://localhost:3001/api/medical-history/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(historyEntry)
        });

        if (response.ok) {
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving prescription item to medical history:', error);
      }
    }
  }

  return savedCount;
}