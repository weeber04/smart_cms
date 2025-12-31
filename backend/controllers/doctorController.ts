// controllers/doctorController.ts
import { Request, Response } from "express";
import { db } from "../db";
import { autoCreateMedicalHistoryFromConsultation } from './medicalHistoryController';

export const getDoctorProfile = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [doctor]: any = await db.query(`
      SELECT u.UserID, u.Name, u.Email, u.PhoneNum, u.Role,
             d.Specialization, d.LicenseNo, d.ClinicRoom
      FROM useraccount u
      LEFT JOIN doctorprofile d ON u.UserID = d.DoctorID
      WHERE u.UserID = ? AND u.Role = 'doctor'
    `, [doctorId]);
    
    if (doctor.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    res.json(doctor[0]);
  } catch (error) {
    console.error("Doctor profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get only scheduled appointments (not checked in yet)
export const getScheduledAppointments = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID as id,
        a.PatientID as patientId,
        p.Name as name, 
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        a.Status as status,
        a.Notes,
        a.AppointmentDateTime,
        'follow-up' as VisitType,
        'scheduled' as VisitStatus,
        'medium' as TriagePriority
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status = 'scheduled'
        AND NOT EXISTS (
          SELECT 1 FROM patient_visit pv 
          WHERE pv.PatientID = a.PatientID 
            AND DATE(pv.ArrivalTime) = CURDATE()
            AND pv.VisitStatus = 'checked-in'
        )
      ORDER BY a.AppointmentDateTime ASC
    `, [doctorId]);
    
    console.log('Scheduled appointments (not checked in):', appointments);
    
    res.json(appointments);
  } catch (error) {
    console.error("Scheduled appointments error:", error);
    res.status(500).json({ error: "Failed to fetch scheduled appointments" });
  }
};

// Get appointment info for a specific patient
export const getPatientAppointment = async (req: Request, res: Response) => {
  const { patientId, doctorId } = req.params;
  
  try {
    const [appointment]: any = await db.query(`
      SELECT 
        a.AppointmentID,
        a.AppointmentDateTime,
        a.Status,
        a.Purpose
      FROM appointment a
      WHERE a.PatientID = ? 
        AND a.DoctorID = ?
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled', 'confirmed', 'checked-in')
      ORDER BY a.AppointmentDateTime DESC
      LIMIT 1
    `, [patientId, doctorId]);
    
    if (appointment.length > 0) {
      res.json(appointment[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Patient appointment error:", error);
    res.json(null);
  }
};

// Enhanced queue endpoint with proper doctor assignment checks
export const getEnhancedPatientQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    // Get patients assigned to THIS SPECIFIC doctor
    const [assignedPatients]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        'assigned' as queueType,
        u.Name as assignedDoctorName,
        a.AppointmentDateTime
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      LEFT JOIN appointment a ON pv.AppointmentID = a.AppointmentID
      WHERE pv.DoctorID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled', 'no-show')
        AND pv.QueueStatus NOT IN ('completed', 'cancelled')
      ORDER BY 
        CASE pv.TriagePriority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pv.QueuePosition ASC
    `, [doctorId]);
    
    // Get unassigned patients (no doctor OR different doctor)
    const [unassignedPatients]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        'unassigned' as queueType,
        u.Name as assignedDoctorName,
        a.AppointmentDateTime
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      LEFT JOIN appointment a ON pv.AppointmentID = a.AppointmentID
      WHERE (pv.DoctorID IS NULL OR pv.DoctorID != ?)
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled', 'no-show')
        AND pv.QueueStatus NOT IN ('completed', 'cancelled')
      ORDER BY 
        CASE pv.TriagePriority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pv.QueuePosition ASC
    `, [doctorId]);
    
    console.log('Enhanced queue debug:', {
      doctorId,
      assignedCount: assignedPatients.length,
      unassignedCount: unassignedPatients.length,
      assignedDoctors: assignedPatients.map((p: any) => ({ 
        id: p.VisitID, 
        doctorId: p.DoctorID, 
        doctorName: p.assignedDoctorName 
      })),
      unassignedDoctors: unassignedPatients.map((p: any) => ({ 
        id: p.VisitID, 
        doctorId: p.DoctorID, 
        doctorName: p.assignedDoctorName 
      }))
    });
    
    res.json({
      success: true,
      assignedPatients,
      unassignedPatients,
      totalAssigned: assignedPatients.length,
      totalUnassigned: unassignedPatients.length
    });
    
  } catch (error) {
    console.error("Enhanced queue error:", error);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

/**
 * Get patients currently in consultation with this doctor
 */
export const getCalledPatients = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [calledPatients]: any = await db.query(`
      SELECT 
        pv.VisitID as id,
        pv.PatientID as patientId,
        p.Name as name,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age,
        p.Gender as gender,
        pv.ArrivalTime as time,
        pv.VisitStatus as status,
        pv.VisitType as type,
        pv.QueueNumber,
        c.ChiefComplaint as chiefComplaint,
        pv.DoctorID,
        CASE 
          WHEN pv.AppointmentID IS NOT NULL THEN 'appointment'
          ELSE 'walk-in'
        END as sourceType,
        pv.CalledTime
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN consultation c ON pv.VisitID = c.VisitID
      WHERE pv.DoctorID = ?
        AND pv.QueueStatus = 'in-progress'
        AND pv.VisitStatus = 'in-consultation'
        AND DATE(pv.ArrivalTime) = CURDATE()
      ORDER BY pv.CalledTime ASC
    `, [doctorId]);
    
    console.log('Called patients for doctor', doctorId, ':', calledPatients.length);
    
    res.json(calledPatients);
  } catch (error) {
    console.error("Called patients error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Fix the getTodayAppointments function
export const getTodayAppointments = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID as id,
        a.PatientID as patientId,
        p.Name as name, 
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        a.Status as status,
        a.Notes,
        'follow-up' as VisitType,  -- Default for appointments
        NULL as QueueNumber,  -- Appointments don't have queue numbers yet
        NULL as QueuePosition,
        'medium' as TriagePriority,  -- Default priority for appointments
        a.AppointmentDateTime
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled', 'confirmed', 'checked-in')
      ORDER BY a.AppointmentDateTime ASC
    `, [doctorId]);
    
    console.log('Appointments API Response:', appointments);
    
    res.json(appointments);
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Alternative: Get appointments that have corresponding patient_visit entries
export const getTodayAppointmentsWithVisits = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        pv.VisitID as id,
        pv.PatientID as patientId,
        p.Name as name, 
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        pv.VisitStatus as status,
        pv.VisitType,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.TriagePriority,
        pv.VisitNotes,
        a.AppointmentDateTime
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      LEFT JOIN patient_visit pv ON a.PatientID = pv.PatientID 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.DoctorID = a.DoctorID
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled', 'confirmed', 'checked-in')
      ORDER BY a.AppointmentDateTime ASC
    `, [doctorId]);
    
    console.log('Appointments with visits:', appointments);
    
    res.json(appointments);
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// If you want to show only scheduled appointments that haven't checked in yet:
export const getTodayScheduledAppointments = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID as id,
        a.PatientID as patientId,
        p.Name as name, 
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        a.Status as status,
        a.Notes,
        'follow-up' as VisitType,
        NULL as QueueNumber,
        NULL as QueuePosition,
        'medium' as TriagePriority,
        a.AppointmentDateTime
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      LEFT JOIN patient_visit pv ON a.PatientID = pv.PatientID 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.DoctorID = a.DoctorID
        AND pv.VisitStatus NOT IN ('completed', 'cancelled')
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled')  -- Only scheduled appointments
        AND pv.VisitID IS NULL  -- No patient_visit created yet (not checked in)
      ORDER BY a.AppointmentDateTime ASC
    `, [doctorId]);
    
    console.log('Scheduled appointments (not checked in):', appointments);
    
    res.json(appointments);
  } catch (error) {
    console.error("Scheduled appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get ALL patients in queue - both assigned to this doctor and unassigned
export const getPatientQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    // Get patients assigned to this doctor - BROADER QUERY
    const [assignedPatients]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        'assigned' as queueType,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE pv.DoctorID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled', 'no-show')
        AND pv.QueueStatus NOT IN ('completed', 'cancelled')
      ORDER BY pv.QueuePosition ASC
    `, [doctorId]);
    
    // Get unassigned patients - BROADER QUERY
    const [unassignedPatients]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        'unassigned' as queueType,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE (pv.DoctorID IS NULL OR pv.DoctorID != ?)
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled', 'no-show')
        AND pv.QueueStatus NOT IN ('completed', 'cancelled')
      ORDER BY 
        CASE pv.TriagePriority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pv.QueuePosition ASC
    `, [doctorId]);
    
    console.log('Queue debug:', {
      doctorId,
      assignedCount: assignedPatients.length,
      unassignedCount: unassignedPatients.length,
      assignedSample: assignedPatients.slice(0, 2),
      unassignedSample: unassignedPatients.slice(0, 2)
    });
    
    res.json({
      success: true,
      assignedPatients,
      unassignedPatients,
      totalAssigned: assignedPatients.length,
      totalUnassigned: unassignedPatients.length
    });
    
  } catch (error) {
    console.error("Queue error:", error);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

// Add this to your doctorController.ts
export const debugPatientQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    // Get ALL visits for today regardless of status
    const [allVisits]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE DATE(pv.ArrivalTime) = CURDATE()
      ORDER BY pv.ArrivalTime DESC
    `, []);
    
    res.json({
      success: true,
      allVisits,
      count: allVisits.length,
      currentTime: new Date().toISOString(),
      debugInfo: {
        doctorIdRequested: doctorId,
        statusesFound: allVisits.map((v: any) => ({
          VisitID: v.VisitID,
          QueueStatus: v.QueueStatus,
          VisitStatus: v.VisitStatus,
          DoctorID: v.DoctorID,
          PatientName: v.PatientName
        }))
      }
    });
    
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ 
      success: false,
      error: "Debug error" 
    });
  }
};

// Get patient queue for doctor dashboard (simpler version)
export const getDoctorDashboardQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    // Get all patients for this doctor (including those already assigned)
    const [queue]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        CASE 
          WHEN pv.DoctorID = ? THEN 'Your Patient'
          WHEN pv.DoctorID IS NULL THEN 'No Doctor Assigned'
          ELSE 'Assigned to Another Doctor'
        END as assignmentStatus,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus IN ('checked-in', 'in-consultation')
        AND pv.QueueStatus IN ('waiting', 'in-progress')
        AND (pv.DoctorID IS NULL OR pv.DoctorID = ?)
      ORDER BY 
        pv.DoctorID DESC, -- Show assigned patients first
        CASE pv.TriagePriority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pv.QueuePosition ASC
    `, [doctorId, doctorId]);
    
    res.json({
      success: true,
      queue
    });
    
  } catch (error) {
    console.error("Dashboard queue error:", error);
    res.status(500).json({ 
      success: false,
      error: "Server error" 
    });
  }
};

export const getPatientDetails = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    console.log('Getting patient details for ID:', patientId);
    
    // Get basic patient info
    const [patient]: any = await db.query(`
      SELECT 
        p.PatientID, 
        p.Name, 
        p.Gender,
        p.DOB,
        p.BloodType,
        p.PhoneNumber,
        p.Email,
        p.Address,
        p.ICNo,
        p.InsuranceProvider,
        p.InsurancePolicyNo,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age
      FROM patient p
      WHERE p.PatientID = ?
    `, [patientId]);
    
    console.log('Patient query result:', patient);
    
    if (patient.length === 0) {
      console.log('Patient not found in database');
      return res.status(404).json({ error: "Patient not found" });
    }
    
    const patientData = {
      ...patient[0]
    };
    
    // Try to get allergies (this might fail if table doesn't exist or has no data)
    try {
      const [allergies]: any = await db.query(`
        SELECT AllergyName as allergy, Severity
        FROM patientallergy 
        WHERE PatientID = ?
      `, [patientId]);
      patientData.allergies = allergies;
    } catch (allergyError) {
      console.warn('Could not fetch allergies:', allergyError);
      patientData.allergies = [];
    }
    
    // Try to get current medications
    try {
      const [medications]: any = await db.query(`
        SELECT MedicationName as name, Dosage as dosage, Frequency as frequency, Status
        FROM patientmedication 
        WHERE PatientID = ? AND Status = 'active'
      `, [patientId]);
      patientData.currentMedications = medications;
    } catch (medError) {
      console.warn('Could not fetch medications:', medError);
      patientData.currentMedications = [];
    }
    
    // Try to get medical conditions
    try {
      const [conditions]: any = await db.query(`
        SELECT ConditionName as condition, DiagnosedDate as diagnosed, Status as status
        FROM medicalcondition 
        WHERE PatientID = ?
      `, [patientId]);
      patientData.medicalHistory = conditions;
    } catch (conditionError) {
      console.warn('Could not fetch conditions:', conditionError);
      patientData.medicalHistory = [];
    }
    
    // Try to get recent visits
    try {
      const [visits]: any = await db.query(`
        SELECT 
          pv.VisitID,
          pv.ArrivalTime as VisitDate,
          pv.VisitType,
          pv.VisitNotes,
          pv.VisitStatus,
          u.Name as doctor_name
        FROM patient_visit pv
        LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
        WHERE pv.PatientID = ?
        ORDER BY pv.ArrivalTime DESC
        LIMIT 5
      `, [patientId]);
      patientData.recentVisits = visits;
    } catch (visitError) {
      console.warn('Could not fetch visits:', visitError);
      patientData.recentVisits = [];
    }
    
    console.log('Final patient data to send:', patientData);
    res.json(patientData);
  } catch (error) {
    console.error("Patient details error:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const saveConsultation = async (req: Request, res: Response) => {
  const { visitId, doctorId, patientId, symptoms, diagnosis, treatmentPlan, notes, followUpInstructions } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Check if consultation already exists for this visit
    const [existingConsultation]: any = await db.query(`
      SELECT ConsultationID FROM consultation WHERE VisitID = ?
    `, [visitId]);
    
    let consultationId;
    
    if (existingConsultation.length > 0) {
      // Update existing consultation
      consultationId = existingConsultation[0].ConsultationID;
      await db.query(`
        UPDATE consultation 
        SET 
          ChiefComplaint = ?,
          Diagnosis = ?,
          TreatmentPlan = ?,
          ConsultationNotes = ?,
          FollowUpInstructions = ?,
          UpdatedAt = NOW()
        WHERE VisitID = ?
      `, [symptoms, diagnosis, treatmentPlan, notes, followUpInstructions, visitId]);
    } else {
      // Create new consultation record
      const [consultation]: any = await db.query(`
        INSERT INTO consultation 
        (VisitID, DoctorID, ChiefComplaint, Diagnosis, TreatmentPlan, ConsultationNotes, FollowUpInstructions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [visitId, doctorId, symptoms, diagnosis, treatmentPlan, notes, followUpInstructions]);
      
      consultationId = consultation.insertId;
    }
    
    // Update patient_visit to mark as completed
    await db.query(`
      UPDATE patient_visit 
      SET 
        QueueStatus = 'completed',
        VisitStatus = 'completed',
        CheckOutTime = NOW()
      WHERE VisitID = ?
    `, [visitId]);
    
    // Update appointment status if exists
    await db.query(`
      UPDATE appointment 
      SET Status = 'completed' 
      WHERE AppointmentID IN (
        SELECT AppointmentID FROM patient_visit WHERE VisitID = ?
      )
    `, [visitId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      message: "Consultation saved successfully",
      consultationId: consultationId 
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Consultation save error:", error);
    res.status(500).json({ error: "Failed to save consultation" });
  }
};

// Doctor calls a patient (assigns them to doctor and starts consultation)
export const visitPatient = async (req: Request, res: Response) => {
  const { visitId, doctorId } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // 1. FIRST: Check if doctor already has an active consultation
    const [activeConsultations]: any = await db.query(`
      SELECT VisitID, PatientID, QueueStatus, VisitStatus, CalledTime
      FROM patient_visit 
      WHERE DoctorID = ?
        AND QueueStatus = 'in-progress'
        AND VisitStatus = 'in-consultation'
        AND DATE(CalledTime) = CURDATE()
      LIMIT 1
    `, [doctorId]);
    
    if (activeConsultations.length > 0) {
      const activePatient = activeConsultations[0];
      
      // If trying to call the same patient, just return success
      if (activePatient.VisitID === visitId) {
        await db.query('ROLLBACK');
        return res.json({
          success: true,
          message: "Patient is already in consultation",
          patient: activePatient
        });
      }
      
      // If trying to call a different patient, reject
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: `You already have an active consultation. Please complete consultation with patient #${activePatient.PatientID} first.`
      });
    }
    
    // 2. Then check if patient already has a doctor assigned
    const [currentVisit]: any = await db.query(`
      SELECT DoctorID, QueueStatus, VisitStatus 
      FROM patient_visit 
      WHERE VisitID = ?
    `, [visitId]);
    
    if (currentVisit.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: "Visit not found" 
      });
    }
    
    const currentDoctorId = currentVisit[0].DoctorID;
    const currentQueueStatus = currentVisit[0].QueueStatus;
    const currentVisitStatus = currentVisit[0].VisitStatus;
    
    // Check if patient is already in consultation with another doctor
    if (currentDoctorId && currentDoctorId !== doctorId && 
        (currentQueueStatus === 'in-progress' || currentVisitStatus === 'in-consultation')) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Patient is already in consultation with another doctor" 
      });
    }
    
    
    // Update patient_visit to mark as in-consultation and assign to this doctor
    const [updateResult]: any = await db.query(`
      UPDATE patient_visit 
      SET 
        QueueStatus = 'in-progress',
        VisitStatus = 'in-consultation',
        CalledTime = NOW(),
        DoctorID = ?
      WHERE VisitID = ? 
        AND QueueStatus = 'waiting'
        AND VisitStatus = 'checked-in'
    `, [doctorId, visitId]);
    
    if (updateResult.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Patient not found or not in waiting status" 
      });
    }
    
    // If this is from an appointment, update appointment status
    const [visitData]: any = await db.query(`
      SELECT AppointmentID FROM patient_visit WHERE VisitID = ?
    `, [visitId]);
    
    if (visitData[0]?.AppointmentID) {
      await db.query(`
        UPDATE appointment 
        SET Status = 'confirmed' 
        WHERE AppointmentID = ?
      `, [visitData[0].AppointmentID]);
    }
    
    await db.query('COMMIT');
    
    // Get updated patient data
    const [updatedPatient]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE pv.VisitID = ?
    `, [visitId]);
    
    res.json({
      success: true,
      message: "Patient called successfully",
      patient: updatedPatient[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Visit patient error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to call patient" 
    });
  }
};

// Add to your doctorController.ts
export const getActiveConsultation = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [activePatient]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.PatientID,
        p.Name as PatientName,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.QueueStatus,
        pv.VisitStatus,
        pv.VisitType,
        pv.VisitNotes,
        pv.ArrivalTime,
        pv.CalledTime,
        pv.DoctorID,
        pv.TriagePriority,
        u.Name as assignedDoctorName
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE pv.DoctorID = ?
        AND pv.QueueStatus = 'in-progress'
        AND pv.VisitStatus = 'in-consultation'
        AND DATE(pv.CalledTime) = CURDATE()
      LIMIT 1
    `, [doctorId]);
    
    if (activePatient.length > 0) {
      res.json({
        success: true,
        patient: activePatient[0]
      });
    } else {
      res.json({
        success: false,
        message: 'No active consultation'
      });
    }
  } catch (error) {
    console.error('Error fetching active consultation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch active consultation' 
    });
  }
};

// Doctor claims an unassigned patient
export const claimPatient = async (req: Request, res: Response) => {
  const { visitId, doctorId } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Check if patient is unassigned or assigned to another doctor
    const [currentVisit]: any = await db.query(`
      SELECT DoctorID, QueueStatus, VisitStatus 
      FROM patient_visit 
      WHERE VisitID = ?
    `, [visitId]);
    
    if (currentVisit.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: "Visit not found" 
      });
    }
    
    const currentDoctorId = currentVisit[0].DoctorID;
    
    // If patient already has this doctor, just call them
    if (currentDoctorId === doctorId) {
      await db.query('ROLLBACK');
      // Call the existing visitPatient function
      return visitPatient(req, res);
    }
    
    // If patient has another doctor, cannot claim
    if (currentDoctorId && currentDoctorId !== doctorId) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Patient is already assigned to another doctor" 
      });
    }
    
    // Assign patient to this doctor (but don't start consultation yet)
    const [updateResult]: any = await db.query(`
      UPDATE patient_visit 
      SET 
        DoctorID = ?
      WHERE VisitID = ? 
        AND DoctorID IS NULL
        AND QueueStatus = 'waiting'
        AND VisitStatus = 'checked-in'
    `, [doctorId, visitId]);
    
    if (updateResult.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Cannot claim patient. Patient may already have a doctor or is not in waiting status." 
      });
    }
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: "Patient claimed successfully. You can now call them when ready."
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Claim patient error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to claim patient" 
    });
  }
};

export const completeVisit = async (req: Request, res: Response) => {
  const { visitId, doctorId } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Update patient_visit to mark as completed
    const [updateResult]: any = await db.query(`
      UPDATE patient_visit 
      SET 
        QueueStatus = 'completed',
        VisitStatus = 'completed',
        CheckOutTime = NOW()
      WHERE VisitID = ? AND DoctorID = ?
    `, [visitId, doctorId]);
    
    if (updateResult.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Visit not found or not authorized" 
      });
    }
    
    // Update appointment status if exists
    const [visitData]: any = await db.query(`
      SELECT AppointmentID FROM patient_visit WHERE VisitID = ?
    `, [visitId]);
    
    if (visitData[0]?.AppointmentID) {
      await db.query(`
        UPDATE appointment 
        SET Status = 'completed' 
        WHERE AppointmentID = ?
      `, [visitData[0].AppointmentID]);
    }
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: "Visit completed successfully"
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Complete visit error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to complete visit" 
    });
  }
};

export const getQueueStats = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Count patients seen today by this doctor
    const [seenTodayResult]: any = await db.query(`
      SELECT COUNT(*) as count
      FROM patient_visit 
      WHERE DoctorID = ? 
        AND DATE(ArrivalTime) = ?
        AND VisitStatus = 'completed'
    `, [doctorId, today]);
    
    // Count patients currently waiting for this doctor
    const [waitingResult]: any = await db.query(`
      SELECT COUNT(*) as count
      FROM patient_visit 
      WHERE DoctorID = ? 
        AND DATE(ArrivalTime) = ?
        AND VisitStatus IN ('checked-in', 'in-consultation')
        AND QueueStatus IN ('waiting', 'in-progress')
    `, [doctorId, today]);
    
    res.json({
      success: true,
      patientsSeenToday: seenTodayResult[0]?.count || 0,
      patientsWaiting: waitingResult[0]?.count || 0
    });
    
  } catch (error) {
    console.error("Get queue stats error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch queue statistics" 
    });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  const { consultationId, doctorId, patientId, medications, remarks } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Create prescription
    const [prescription]: any = await db.query(`
      INSERT INTO prescription 
      (PrescribedDate, Remarks, DoctorID, PatientID, ConsultationID)
      VALUES (CURDATE(), ?, ?, ?, ?)
    `, [remarks, doctorId, patientId, consultationId]);
    
    // Add prescription items
    for (const med of medications) {
      await db.query(`
        INSERT INTO prescriptionitem 
        (Dosage, Frequency, Duration, PrescriptionID, DrugID)
        VALUES (?, ?, ?, ?, ?)
      `, [med.dosage, med.frequency, med.duration, prescription.insertId, med.drugId]);
    }
    
    // Set prescription status to pending
    await db.query(`
      INSERT INTO prescriptionstatus 
      (PrescriptionID, Status, UpdatedBy)
      VALUES (?, 'pending', ?)
    `, [prescription.insertId, doctorId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      message: "Prescription created successfully",
      prescriptionId: prescription.insertId 
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Prescription error:", error);
    res.status(500).json({ error: "Failed to create prescription" });
  }
};

export const getRecentPrescriptions = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [prescriptions]: any = await db.query(`
      SELECT 
        p.PrescriptionID, 
        pat.Name as patient, 
        d.DrugName as medication, 
        pi.Dosage, 
        pi.Frequency as dosage,
        p.PrescribedDate as date,
        ps.Status as prescriptionStatus
      FROM prescription p
      JOIN patient pat ON p.PatientID = pat.PatientID
      JOIN prescriptionitem pi ON p.PrescriptionID = pi.PrescriptionID
      JOIN drug d ON pi.DrugID = d.DrugID
      JOIN prescriptionstatus ps ON p.PrescriptionID = ps.PrescriptionID
      WHERE p.DoctorID = ?
      ORDER BY p.PrescribedDate DESC
      LIMIT 10
    `, [doctorId]);
    
    res.json(prescriptions);
  } catch (error) {
    console.error("Prescriptions error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const scheduleFollowUp = async (req: Request, res: Response) => {
  const { patientId, doctorId, date, time, type, notes, createdBy } = req.body;
  
  try {
    const appointmentDateTime = `${date} ${time}`;
    
    const [appointment]: any = await db.query(`
      INSERT INTO appointment 
      (AppointmentDateTime, Purpose, Status, PatientID, DoctorID, CreatedBy, Notes)
      VALUES (?, ?, 'scheduled', ?, ?, ?, ?)
    `, [appointmentDateTime, type, patientId, doctorId, createdBy, notes]);
    
    res.json({ 
      message: "Follow-up scheduled successfully",
      appointmentId: appointment.insertId 
    });
  } catch (error) {
    console.error("Follow-up error:", error);
    res.status(500).json({ error: "Failed to schedule follow-up" });
  }
};

// Add these new functions to doctorController.ts

// Get patient vital signs
export const getPatientVitals = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [vitals]: any = await db.query(`
      SELECT 
        v.VitalSignID,
        v.ConsultationID,
        v.TakenBy,
        v.TakenAt,
        v.BloodPressureSystolic,
        v.BloodPressureDiastolic,
        v.HeartRate,
        v.RespiratoryRate,
        v.Temperature,
        v.OxygenSaturation,
        v.Height,
        v.Weight,
        v.BMI,
        v.PainLevel,
        v.Notes,
        u.Name as TakenByName
      FROM vital_signs v
      LEFT JOIN useraccount u ON v.TakenBy = u.UserID
      WHERE v.ConsultationID IN (
        SELECT c.ConsultationID 
        FROM consultation c
        JOIN patient_visit pv ON c.VisitID = pv.VisitID
        WHERE pv.PatientID = ?
      )
      ORDER BY v.TakenAt DESC
      LIMIT 10
    `, [patientId]);
    
    res.json(vitals);
  } catch (error) {
    console.error("Vitals fetch error:", error);
    res.status(500).json({ error: "Failed to fetch vital signs" });
  }
};

// Create consultation for a patient
export const createConsultation = async (req: Request, res: Response) => {
  const { patientId, doctorId, visitType = 'consultation', symptoms } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Create patient_visit
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
      VALUES (?, ?, ?, NOW(), NOW(), 'in-consultation', 'in-progress', ?)
    `, [patientId, doctorId, visitType, symptoms || 'New consultation']);
    
    // Create consultation record
    const [consultation]: any = await db.query(`
      INSERT INTO consultation 
      (VisitID, DoctorID, StartTime, ChiefComplaint)
      VALUES (?, ?, NOW(), ?)
    `, [visit.insertId, doctorId, symptoms || '']);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Consultation created successfully",
      consultationId: consultation.insertId,
      visitId: visit.insertId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Create consultation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create consultation" 
    });
  }
};

// Save consultation details
export const saveConsultationDetails = async (req: Request, res: Response) => {
  const { consultationId, chiefComplaint, diagnosis, treatmentPlan, consultationNotes, doctorId } = req.body;
  
  try {
    // Update consultation record
    const [updateResult]: any = await db.query(`
      UPDATE consultation 
      SET 
        ChiefComplaint = ?,
        Diagnosis = ?,
        TreatmentPlan = ?,
        ConsultationNotes = ?,
        EndTime = NOW(),
        UpdatedAt = NOW()
      WHERE ConsultationID = ? AND DoctorID = ?
    `, [chiefComplaint, diagnosis, treatmentPlan, consultationNotes, consultationId, doctorId]);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Consultation not found or not authorized" 
      });
    }
    
    // Update patient_visit status
    const [consultationData]: any = await db.query(`
      SELECT VisitID FROM consultation WHERE ConsultationID = ?
    `, [consultationId]);
    
    if (consultationData[0]?.VisitID) {
      await db.query(`
        UPDATE patient_visit 
        SET 
          VisitStatus = 'completed',
          QueueStatus = 'completed',
          CheckOutTime = NOW()
        WHERE VisitID = ?
      `, [consultationData[0].VisitID]);
    }
    
    res.json({ 
      success: true,
      message: "Consultation details saved successfully"
    });
  } catch (error) {
    console.error("Save consultation details error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save consultation details" 
    });
  }
};

// Create consultation specifically for vital signs
export const createConsultationForVitals = async (req: Request, res: Response) => {
  const { patientId, doctorId, visitType = 'walk-in', notes = 'Vital signs recording' } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Create patient_visit
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
      VALUES (?, ?, ?, NOW(), NOW(), 'checked-in', 'waiting', ?)
    `, [patientId, doctorId, visitType, notes]);
    
    // Create consultation record
    const [consultation]: any = await db.query(`
      INSERT INTO consultation 
      (VisitID, DoctorID, StartTime, ChiefComplaint)
      VALUES (?, ?, NOW(), ?)
    `, [visit.insertId, doctorId, 'Vital signs recording']);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Consultation created for vital signs",
      consultationId: consultation.insertId,
      visitId: visit.insertId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Create consultation for vitals error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create consultation" 
    });
  }
};

// Save vital signs with proper data mapping
export const saveVitalSigns = async (req: Request, res: Response) => {
  const {
    consultationId,
    takenBy,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    heartRate,
    respiratoryRate,
    temperature,
    oxygenSaturation,
    height,
    weight,
    bmi,
    painLevel,
    notes
  } = req.body;
  
  try {
    // Check if consultation exists
    const [consultationCheck]: any = await db.query(`
      SELECT ConsultationID FROM consultation WHERE ConsultationID = ?
    `, [consultationId]);
    
    if (consultationCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Consultation not found" 
      });
    }
    
    // Insert vital signs
    const [result]: any = await db.query(`
      INSERT INTO vital_signs 
      (ConsultationID, TakenBy, TakenAt, BloodPressureSystolic, BloodPressureDiastolic, 
       HeartRate, RespiratoryRate, Temperature, OxygenSaturation, Height, Weight, BMI, PainLevel, Notes)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      consultationId,
      takenBy,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      respiratoryRate,
      temperature,
      oxygenSaturation,
      height,
      weight,
      bmi,
      painLevel,
      notes
    ]);
    
    res.json({ 
      success: true,
      message: "Vital signs saved successfully",
      vitalSignId: result.insertId
    });
  } catch (error) {
    console.error("Save vital signs error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save vital signs" 
    });
  }
};

// Get active visit for patient
export const getActiveVisit = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [activeVisit]: any = await db.query(`
      SELECT 
        pv.VisitID,
        c.ConsultationID
      FROM patient_visit pv
      LEFT JOIN consultation c ON pv.VisitID = c.VisitID
      WHERE pv.PatientID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled', 'no-show')
      ORDER BY pv.ArrivalTime DESC
      LIMIT 1
    `, [patientId]);
    
    res.json(activeVisit[0] || {});
  } catch (error) {
    console.error("Active visit error:", error);
    res.status(500).json({ error: "Failed to get active visit" });
  }
};

// Create visit for vital signs recording
export const createVisitForVitals = async (req: Request, res: Response) => {
  const { patientId, doctorId, visitType = 'walk-in', visitNotes = 'Vital signs recording' } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Create patient_visit
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
      VALUES (?, ?, ?, NOW(), NOW(), 'checked-in', 'waiting', ?)
    `, [patientId, doctorId, visitType, visitNotes]);
    
    // Create consultation
    const [consultation]: any = await db.query(`
      INSERT INTO consultation (VisitID, DoctorID)
      VALUES (?, ?)
    `, [visit.insertId, doctorId]);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Visit created for vital signs recording",
      visitId: visit.insertId,
      consultationId: consultation.insertId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Create visit error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create visit" 
    });
  }
};

// Get patient allergies
export const getPatientAllergies = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [allergies]: any = await db.query(`
      SELECT 
        af.AllergyFindingID,
        af.ConsultationID,
        af.AllergyName,
        af.Reaction,
        af.Severity,
        af.OnsetDate,
        af.Status,
        af.Notes,
        DATE_FORMAT(af.OnsetDate, '%Y-%m-%d') as OnsetDate
      FROM allergy_findings af
      JOIN consultation c ON af.ConsultationID = c.ConsultationID
      WHERE c.VisitID IN (
        SELECT VisitID FROM patient_visit WHERE PatientID = ?
      )
      ORDER BY af.OnsetDate DESC
    `, [patientId]);
    
    res.json(allergies);
  } catch (error) {
    console.error("Allergies fetch error:", error);
    res.status(500).json({ error: "Failed to fetch allergies" });
  }
};

// Save allergy finding
export const saveAllergyFinding = async (req: Request, res: Response) => {
  const { patientId, doctorId, allergyName, reaction, severity, onsetDate, status, notes } = req.body;
  
  try {
    // Get active consultation for this patient
    const [activeConsultation]: any = await db.query(`
      SELECT c.ConsultationID 
      FROM consultation c
      JOIN patient_visit pv ON c.VisitID = pv.VisitID
      WHERE pv.PatientID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus NOT IN ('completed', 'cancelled')
      ORDER BY pv.ArrivalTime DESC
      LIMIT 1
    `, [patientId]);
    
    if (activeConsultation.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No active consultation found. Please start a consultation first." 
      });
    }
    
    const consultationId = activeConsultation[0].ConsultationID;
    
    // Save allergy finding
    const [result]: any = await db.query(`
      INSERT INTO allergy_findings 
      (ConsultationID, AllergyName, Reaction, Severity, OnsetDate, Status, Notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [consultationId, allergyName, reaction, severity, onsetDate, status, notes]);
    
    res.json({ 
      success: true,
      message: "Allergy finding saved successfully",
      allergyFindingId: result.insertId
    });
  } catch (error) {
    console.error("Save allergy error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save allergy finding" 
    });
  }
};

// Get patient medical conditions
export const getPatientMedicalConditions = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [conditions]: any = await db.query(`
      SELECT 
        mc.ConditionID,
        mc.PatientID,
        mc.ConditionName,
        mc.DiagnosedDate,
        mc.Status,
        mc.Notes,
        DATE_FORMAT(mc.DiagnosedDate, '%Y-%m-%d') as DiagnosedDate
      FROM medicalcondition mc
      WHERE mc.PatientID = ?
      ORDER BY mc.DiagnosedDate DESC
    `, [patientId]);
    
    res.json(conditions);
  } catch (error) {
    console.error("Medical conditions fetch error:", error);
    res.status(500).json({ error: "Failed to fetch medical conditions" });
  }
};

// Save medical condition
export const saveMedicalCondition = async (req: Request, res: Response) => {
  const { patientId, conditionName, diagnosedDate, status, notes } = req.body;
  
  try {
    const [result]: any = await db.query(`
      INSERT INTO medicalcondition 
      (PatientID, ConditionName, DiagnosedDate, Status, Notes)
      VALUES (?, ?, ?, ?, ?)
    `, [patientId, conditionName, diagnosedDate, status, notes]);
    
    res.json({ 
      success: true,
      message: "Medical condition saved successfully",
      conditionId: result.insertId
    });
  } catch (error) {
    console.error("Save medical condition error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save medical condition" 
    });
  }
};

// Get patient visits history
export const getPatientVisits = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [visits]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.VisitType,
        pv.ArrivalTime,
        pv.VisitStatus,
        pv.VisitNotes,
        u.Name as DoctorName
      FROM patient_visit pv
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE pv.PatientID = ?
      ORDER BY pv.ArrivalTime DESC
      LIMIT 20
    `, [patientId]);
    
    res.json(visits);
  } catch (error) {
    console.error("Visits fetch error:", error);
    res.status(500).json({ error: "Failed to fetch patient visits" });
  }
};

// Save full consultation with all fields
export const saveConsultationFull = async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    chiefComplaint,
    historyOfPresentIllness,
    physicalExamFindings,
    diagnosis,
    diagnosisCode,
    treatmentPlan,
    consultationNotes,
    followUpInstructions,
    followUpDate,
    pastMedicalHistory,
    socialHistory,
    reviewOfSystems,
    medicationPlan,
    nonMedicationPlan,
    patientEducation,
    lifestyleAdvice,
    warningSigns,
    disposition,
    referralNeeded,
    referralNotes,
    severity,
    duration,
    severityAssessment,
    differentialDiagnosis,
    familyHistory,
    smoking,
    alcohol,
    occupation
  } = req.body;
  
  // Declare medicalHistoryEntries here so it's accessible in the response
  let medicalHistoryEntries: any[] = [];
  
  try {
    await db.query('START TRANSACTION');
    
    // Get or create patient_visit
    const [activeVisit]: any = await db.query(`
      SELECT VisitID FROM patient_visit 
      WHERE PatientID = ? 
        AND DATE(ArrivalTime) = CURDATE()
        AND VisitStatus NOT IN ('completed', 'cancelled')
      ORDER BY ArrivalTime DESC
      LIMIT 1
    `, [patientId]);
    
    let visitId;
    
    if (activeVisit.length === 0) {
      // Create new visit
      const [visit]: any = await db.query(`
        INSERT INTO patient_visit 
        (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
        VALUES (?, ?, 'consultation', NOW(), NOW(), 'in-consultation', 'in-progress', ?)
      `, [patientId, doctorId, chiefComplaint]);
      
      visitId = visit.insertId;
    } else {
      visitId = activeVisit[0].VisitID;
    }
    
    // Get or create consultation
    const [existingConsultation]: any = await db.query(`
      SELECT ConsultationID FROM consultation WHERE VisitID = ?
    `, [visitId]);
    
    let consultationId;
    
    if (existingConsultation.length === 0) {
      // Create new consultation
      const [consultation]: any = await db.query(`
        INSERT INTO consultation 
        (VisitID, DoctorID, StartTime, ChiefComplaint, HistoryOfPresentIllness, 
         PhysicalExamFindings, Diagnosis, DiagnosisCode, TreatmentPlan, 
         ConsultationNotes, FollowUpInstructions, FollowUpDate)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        visitId, doctorId, chiefComplaint, historyOfPresentIllness,
        physicalExamFindings, diagnosis, diagnosisCode, treatmentPlan,
        consultationNotes, followUpInstructions, followUpDate || null
      ]);
      
      consultationId = consultation.insertId;
    } else {
      // Update existing consultation
      consultationId = existingConsultation[0].ConsultationID;
      await db.query(`
        UPDATE consultation 
        SET 
          ChiefComplaint = ?,
          HistoryOfPresentIllness = ?,
          PhysicalExamFindings = ?,
          Diagnosis = ?,
          DiagnosisCode = ?,
          TreatmentPlan = ?,
          ConsultationNotes = ?,
          FollowUpInstructions = ?,
          FollowUpDate = ?,
          EndTime = NOW(),
          UpdatedAt = NOW()
        WHERE ConsultationID = ?
      `, [
        chiefComplaint, historyOfPresentIllness, physicalExamFindings,
        diagnosis, diagnosisCode, treatmentPlan, consultationNotes,
        followUpInstructions, followUpDate || null, consultationId
      ]);
    }
    
    // ==============================
    // AUTO-CREATE MEDICAL HISTORY ENTRIES
    // ==============================
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      medicalHistoryEntries = []; // Initialize the array

      // 1. DIAGNOSIS/CONDITION
      if (diagnosis?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'condition',
          RecordName: diagnosis,
          Description: `Primary diagnosis: ${diagnosis}\nCode: ${diagnosisCode || 'N/A'}\nSeverity: ${severityAssessment || severity || 'moderate'}`,
          Status: 'active',
          StartDate: currentDate,
          Severity: severityAssessment || severity || 'moderate',
          Notes: consultationNotes,
          CreatedBy: parseInt(doctorId)
        });
      }

      // 2. CHIEF COMPLAINT (as symptom history)
      if (chiefComplaint?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'other',
          RecordName: 'Chief Complaint',
          Description: chiefComplaint,
          Status: 'resolved',
          StartDate: currentDate,
          EndDate: currentDate,
          Severity: severity || 'moderate',
          Notes: `Duration: ${duration || 'N/A'}`,
          CreatedBy: parseInt(doctorId)
        });
      }

      // 3. DIFFERENTIAL DIAGNOSIS
      if (differentialDiagnosis?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'condition',
          RecordName: 'Differential Diagnoses',
          Description: differentialDiagnosis,
          Status: 'resolved',
          Notes: 'Considered during diagnosis',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 4. PAST MEDICAL HISTORY (if documented)
      if (pastMedicalHistory?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'condition',
          RecordName: 'Documented Medical History',
          Description: pastMedicalHistory,
          Status: 'chronic',
          Notes: 'Patient-reported past medical history',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 5. FAMILY HISTORY
      if (familyHistory?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'other',
          RecordName: 'Family History',
          Description: familyHistory,
          Status: 'historical',
          Notes: 'Family medical history',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 6. LIFESTYLE FACTORS
      if (smoking || alcohol || occupation) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'other',
          RecordName: 'Social/Lifestyle History',
          Description: `Smoking: ${smoking || 'None'}\nAlcohol: ${alcohol || 'None'}\nOccupation: ${occupation || 'Not specified'}`,
          Status: 'active',
          Notes: 'Social and lifestyle factors',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 7. TREATMENT PLAN
      if (treatmentPlan?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'procedure',
          RecordName: 'Treatment Plan',
          Description: treatmentPlan,
          Status: 'active',
          StartDate: currentDate,
          Notes: medicationPlan || nonMedicationPlan || '',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 8. REFERRAL (if needed)
      if (referralNeeded) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'procedure',
          RecordName: 'Medical Referral',
          Description: referralNotes || 'Patient requires specialist referral',
          Status: 'pending',
          StartDate: currentDate,
          Notes: referralNotes || '',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 9. PATIENT EDUCATION
      if (patientEducation?.trim() || lifestyleAdvice?.trim()) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'other',
          RecordName: 'Patient Education',
          Description: `${patientEducation || ''}\n${lifestyleAdvice || ''}`,
          Status: 'active',
          Notes: 'Education and advice provided',
          CreatedBy: parseInt(doctorId)
        });
      }

      // 10. DISPOSITION
      if (disposition) {
        medicalHistoryEntries.push({
          PatientID: parseInt(patientId),
          ConsultationID: consultationId,
          VisitID: visitId,
          RecordType: 'procedure',
          RecordName: 'Disposition',
          Description: `Patient disposition: ${disposition}`,
          Status: 'completed',
          StartDate: currentDate,
          Notes: consultationNotes,
          CreatedBy: parseInt(doctorId)
        });
      }

      // Save all medical history entries
      for (const entry of medicalHistoryEntries) {
        await db.query(`
          INSERT INTO medical_history 
          (PatientID, ConsultationID, VisitID, RecordType, RecordName, 
           Description, Status, StartDate, EndDate, Severity, Reaction, 
           Dosage, Frequency, PrescribedBy, Notes, CreatedBy, CreatedAt, UpdatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          entry.PatientID,
          entry.ConsultationID,
          entry.VisitID || null,
          entry.RecordType,
          entry.RecordName,
          entry.Description || null,
          entry.Status || 'active',
          entry.StartDate || null,
          entry.EndDate || null,
          entry.Severity || null,
          entry.Reaction || null,
          entry.Dosage || null,
          entry.Frequency || null,
          entry.PrescribedBy || null,
          entry.Notes || null,
          entry.CreatedBy
        ]);
      }

      console.log(`Auto-created ${medicalHistoryEntries.length} medical history entries`);
      
    } catch (historyError) {
      console.error('Error creating medical history entries:', historyError);
      // Don't fail the whole consultation if medical history fails
    }
    // ==============================
    // END MEDICAL HISTORY CREATION
    // ==============================
    
    // Update visit status to completed
    await db.query(`
      UPDATE patient_visit 
      SET 
        VisitStatus = 'completed',
        QueueStatus = 'completed',
        CheckOutTime = NOW()
      WHERE VisitID = ?
    `, [visitId]);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Consultation saved successfully",
      consultationId: consultationId,
      visitId: visitId,
      entriesCreated: medicalHistoryEntries.length // Now accessible
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Save consultation full error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save consultation" 
    });
  }
};

// Add these to doctorController.ts

// Get detailed patient information for consultation tab
export const getPatientForConsultation = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    console.log('Getting patient for consultation ID:', patientId);
    
    const [patient]: any = await db.query(`
      SELECT 
        p.PatientID,
        p.Name,
        p.ICNo,
        p.Gender,
        p.DOB,
        p.BloodType,
        p.PhoneNumber,
        p.Email,
        p.Address,
        p.InsuranceProvider,
        p.InsurancePolicyNo,
        p.EmergencyContactName,
        p.EmergencyContactPhone,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age
      FROM patient p
      WHERE p.PatientID = ?
    `, [patientId]);
    
    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient[0]);
  } catch (error) {
    console.error("Patient for consultation error:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
};

// Save vital signs with consultation creation if needed
export const saveVitalSignsWithConsultation = async (req: Request, res: Response) => {
  const {
    consultationId,
    takenBy,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodPressure,
    heartRate,
    respiratoryRate,
    temperature,
    oxygenSaturation,
    height,
    weight,
    bmi,
    painLevel,
    notes,
    patientId
  } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    let finalConsultationId = consultationId;
    
    // If no consultationId provided, create one
    if (!finalConsultationId && patientId && takenBy) {
      // Check for existing consultation today
      const [existingConsultation]: any = await db.query(`
        SELECT c.ConsultationID 
        FROM consultation c
        JOIN patient_visit pv ON c.VisitID = pv.VisitID
        WHERE pv.PatientID = ? 
          AND DATE(pv.ArrivalTime) = CURDATE()
          AND pv.VisitStatus NOT IN ('completed', 'cancelled')
        ORDER BY pv.ArrivalTime DESC
        LIMIT 1
      `, [patientId]);
      
      if (existingConsultation.length === 0) {
        // Create new visit and consultation
        const [visit]: any = await db.query(`
          INSERT INTO patient_visit 
          (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
          VALUES (?, ?, 'walk-in', NOW(), NOW(), 'checked-in', 'waiting', 'Vital signs recording')
        `, [patientId, takenBy]);
        
        const [consultation]: any = await db.query(`
          INSERT INTO consultation (VisitID, DoctorID, StartTime)
          VALUES (?, ?, NOW())
        `, [visit.insertId, takenBy]);
        
        finalConsultationId = consultation.insertId;
      } else {
        finalConsultationId = existingConsultation[0].ConsultationID;
      }
    }
    
    // Parse blood pressure if provided as string "120/80"
    let bpSystolic = bloodPressureSystolic;
    let bpDiastolic = bloodPressureDiastolic;
    
    if (bloodPressure && bloodPressure.includes('/')) {
      const parts = bloodPressure.split('/');
      bpSystolic = parts[0]?.trim();
      bpDiastolic = parts[1]?.trim();
    }
    
    // Save vital signs
    const [result]: any = await db.query(`
      INSERT INTO vital_signs 
      (ConsultationID, TakenBy, TakenAt, BloodPressureSystolic, BloodPressureDiastolic, 
       HeartRate, RespiratoryRate, Temperature, OxygenSaturation, Height, Weight, BMI, PainLevel, Notes)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalConsultationId,
      takenBy,
      bpSystolic,
      bpDiastolic,
      heartRate,
      respiratoryRate,
      temperature,
      oxygenSaturation,
      height,
      weight,
      bmi,
      painLevel,
      notes
    ]);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Vital signs saved successfully",
      vitalSignId: result.insertId,
      consultationId: finalConsultationId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Save vital signs with consultation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save vital signs" 
    });
  }
};

// Save comprehensive consultation (matches frontend form)
export const saveComprehensiveConsultation = async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    chiefComplaint,
    historyOfPresentIllness,
    pastMedicalHistory,
    socialHistory,
    reviewOfSystems,
    physicalExamFindings,
    diagnosis,
    differentialDiagnosis,
    diagnosisCode,
    treatmentPlan,
    medicationPlan,
    nonMedicationPlan,
    patientEducation,
    lifestyleAdvice,
    warningSigns,
    consultationNotes,
    followUpInstructions,
    followUpDate,
    disposition,
    referralNeeded,
    referralNotes,
    severity
  } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Get or create patient visit
    const [activeVisit]: any = await db.query(`
      SELECT VisitID FROM patient_visit 
      WHERE PatientID = ? 
        AND DATE(ArrivalTime) = CURDATE()
        AND VisitStatus NOT IN ('completed', 'cancelled')
      ORDER BY ArrivalTime DESC
      LIMIT 1
    `, [patientId]);
    
    let visitId;
    
    if (activeVisit.length === 0) {
      // Create new visit
      const [visit]: any = await db.query(`
        INSERT INTO patient_visit 
        (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
        VALUES (?, ?, 'consultation', NOW(), NOW(), 'in-consultation', 'in-progress', ?)
      `, [patientId, doctorId, chiefComplaint || 'New consultation']);
      
      visitId = visit.insertId;
    } else {
      visitId = activeVisit[0].VisitID;
    }
    
    // Parse JSON fields if they are strings
    let socialHistoryParsed = socialHistory;
    let reviewOfSystemsParsed = reviewOfSystems;
    let physicalExamFindingsParsed = physicalExamFindings;
    
    try {
      if (typeof socialHistory === 'string') socialHistoryParsed = JSON.parse(socialHistory);
      if (typeof reviewOfSystems === 'string') reviewOfSystemsParsed = JSON.parse(reviewOfSystems);
      if (typeof physicalExamFindings === 'string') physicalExamFindingsParsed = JSON.parse(physicalExamFindings);
    } catch (parseError) {
      console.warn('Failed to parse JSON fields, storing as-is');
    }
    
    // Get or create consultation
    const [existingConsultation]: any = await db.query(`
      SELECT ConsultationID FROM consultation WHERE VisitID = ?
    `, [visitId]);
    
    let consultationId;
    
    if (existingConsultation.length === 0) {
      // Create new comprehensive consultation
      const [consultation]: any = await db.query(`
        INSERT INTO consultation 
        (VisitID, DoctorID, StartTime, ChiefComplaint, HistoryOfPresentIllness, 
         PhysicalExamFindings, Diagnosis, DiagnosisCode, TreatmentPlan, 
         ConsultationNotes, FollowUpInstructions, FollowUpDate)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        visitId, 
        doctorId, 
        chiefComplaint,
        historyOfPresentIllness,
        JSON.stringify(physicalExamFindingsParsed),
        diagnosis,
        diagnosisCode,
        treatmentPlan,
        consultationNotes,
        followUpInstructions,
        followUpDate || null
      ]);
      
      consultationId = consultation.insertId;
    } else {
      // Update existing consultation
      consultationId = existingConsultation[0].ConsultationID;
      await db.query(`
        UPDATE consultation 
        SET 
          ChiefComplaint = ?,
          HistoryOfPresentIllness = ?,
          PhysicalExamFindings = ?,
          Diagnosis = ?,
          DiagnosisCode = ?,
          TreatmentPlan = ?,
          ConsultationNotes = ?,
          FollowUpInstructions = ?,
          FollowUpDate = ?,
          EndTime = NOW(),
          UpdatedAt = NOW()
        WHERE ConsultationID = ?
      `, [
        chiefComplaint,
        historyOfPresentIllness,
        JSON.stringify(physicalExamFindingsParsed),
        diagnosis,
        diagnosisCode,
        treatmentPlan,
        consultationNotes,
        followUpInstructions,
        followUpDate || null,
        consultationId
      ]);
    }
    
    // Save additional data to medical_history table
    if (pastMedicalHistory) {
      await db.query(`
        INSERT INTO medical_history 
        (PatientID, ConsultationID, RecordType, RecordName, Description, Status, CreatedBy)
        VALUES (?, ?, 'condition', 'Past Medical History', ?, 'historical', ?)
      `, [patientId, consultationId, pastMedicalHistory, doctorId]);
    }
    
    if (medicationPlan) {
      await db.query(`
        INSERT INTO medical_history 
        (PatientID, ConsultationID, RecordType, RecordName, Description, Status, CreatedBy)
        VALUES (?, ?, 'medication', 'Medication Plan', ?, 'active', ?)
      `, [patientId, consultationId, medicationPlan, doctorId]);
    }
    
    if (patientEducation) {
      await db.query(`
        INSERT INTO medical_history 
        (PatientID, ConsultationID, RecordType, RecordName, Description, Status, CreatedBy)
        VALUES (?, ?, 'other', 'Patient Education', ?, 'active', ?)
      `, [patientId, consultationId, patientEducation, doctorId]);
    }
    
    // Update visit status
    await db.query(`
      UPDATE patient_visit 
      SET 
        VisitStatus = 'completed',
        QueueStatus = 'completed',
        CheckOutTime = NOW()
      WHERE VisitID = ?
    `, [visitId]);
    
    // Update appointment status if exists
    await db.query(`
      UPDATE appointment 
      SET Status = 'completed' 
      WHERE AppointmentID IN (
        SELECT AppointmentID FROM patient_visit WHERE VisitID = ?
      )
    `, [visitId]);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Consultation saved successfully",
      consultationId: consultationId,
      visitId: visitId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Save comprehensive consultation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to save consultation" 
    });
  }
};

// In your doctor controller file - ADD THIS NEW FUNCTION
export const saveConsultationForm = async (req: Request, res: Response) => {
  console.log('=== SAVE CONSULTATION FORM START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Define variables in outer scope
  let visitId: number;
  let consultationId: number;
  let existingConsultation: any[] = [];
  
  try {
    const {
      patientId,
      doctorId,
      chiefComplaint,
      historyOfPresentIllness,
      diagnosis,
      diagnosisCode,
      treatmentPlan,
      consultationNotes,
      followUpInstructions,
      followUpDate,
      pastMedicalHistory,
      socialHistory,
      reviewOfSystems,
      physicalExamFindings,
      medicationPlan,
      nonMedicationPlan,
      patientEducation,
      lifestyleAdvice,
      warningSigns,
      disposition,
      referralNeeded,
      referralNotes,
      severity,
      duration,
      severityAssessment,
      differentialDiagnosis,
      familyHistory
    } = req.body;
    
    // Validate required fields
    if (!patientId || !doctorId) {
      console.error('Missing required fields: patientId or doctorId');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId and doctorId are required'
      });
    }

    // Convert to numbers for safety
    const patientIdNum = parseInt(patientId);
    const doctorIdNum = parseInt(doctorId);
    
    console.log('Starting transaction...');
    await db.query('START TRANSACTION');

    // ======================
    // 1. FIND OR CREATE VISIT
    // ======================
    console.log('1. Finding or creating visit for patient:', patientIdNum);
    
    try {
      const [activeVisit]: any = await db.query(`
        SELECT VisitID FROM patient_visit 
        WHERE PatientID = ? 
          AND DATE(ArrivalTime) = CURDATE()
          AND VisitStatus NOT IN ('completed', 'cancelled')
        ORDER BY ArrivalTime DESC
        LIMIT 1
      `, [patientIdNum]);

      console.log('Active visit query result:', activeVisit);

      if (activeVisit.length === 0) {
        console.log('No active visit found. Creating new visit...');
        const [visit]: any = await db.query(`
          INSERT INTO patient_visit 
          (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
          VALUES (?, ?, 'consultation', NOW(), NOW(), 'in-consultation', 'in-progress', ?)
        `, [patientIdNum, doctorIdNum, chiefComplaint || 'Consultation']);
        
        visitId = visit.insertId;
        console.log('New visit created with ID:', visitId);
      } else {
        visitId = activeVisit[0].VisitID;
        console.log('Using existing visit ID:', visitId);
        
        // Update visit status
        console.log('Updating visit status...');
        await db.query(`
          UPDATE patient_visit 
          SET 
            VisitStatus = 'in-consultation',
            QueueStatus = 'in-progress',
            DoctorID = ?,
            UpdatedAt = NOW()
          WHERE VisitID = ?
        `, [doctorIdNum, visitId]);
      }
    } catch (visitError: any) {
      console.error('Error in visit handling:', visitError);
      throw new Error(`Visit handling failed: ${visitError.message}`);
    }

    // ======================
    // 2. PARSE JSON DATA
    // ======================
    console.log('2. Parsing JSON data...');
    
    let parsedPhysicalExamFindings = {};
    try {
      if (physicalExamFindings) {
        if (typeof physicalExamFindings === 'string') {
          parsedPhysicalExamFindings = JSON.parse(physicalExamFindings);
          console.log('Parsed physical exam findings:', parsedPhysicalExamFindings);
        } else if (typeof physicalExamFindings === 'object') {
          parsedPhysicalExamFindings = physicalExamFindings;
        }
      }
    } catch (parseError) {
      console.warn('Warning: Could not parse physicalExamFindings, using empty object');
      parsedPhysicalExamFindings = {};
    }

    // ======================
    // 3. CREATE/UPDATE CONSULTATION
    // ======================
    console.log('3. Creating/updating consultation...');
    
    try {
      // Check if consultation already exists for this visit
      const [consultationCheck]: any = await db.query(`
        SELECT ConsultationID FROM consultation WHERE VisitID = ?
      `, [visitId]);

      console.log('Existing consultation check:', consultationCheck);
      
      // Store in outer variable
      existingConsultation = consultationCheck;

      if (existingConsultation.length === 0) {
        console.log('Creating new consultation...');
        const [consultation]: any = await db.query(`
          INSERT INTO consultation 
          (VisitID, DoctorID, StartTime, ChiefComplaint, HistoryOfPresentIllness, 
           PhysicalExamFindings, Diagnosis, DiagnosisCode, TreatmentPlan, 
           ConsultationNotes, FollowUpInstructions, FollowUpDate)
          VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          visitId, 
          doctorIdNum, 
          chiefComplaint || '', 
          historyOfPresentIllness || '',
          JSON.stringify(parsedPhysicalExamFindings),
          diagnosis || '', 
          diagnosisCode || '', 
          treatmentPlan || '',
          consultationNotes || '', 
          followUpInstructions || '', 
          followUpDate || null
        ]);
        
        consultationId = consultation.insertId;
        console.log('New consultation created with ID:', consultationId);
      } else {
        consultationId = existingConsultation[0].ConsultationID;
        console.log('Updating existing consultation ID:', consultationId);
        
        await db.query(`
          UPDATE consultation 
          SET 
            ChiefComplaint = ?,
            HistoryOfPresentIllness = ?,
            PhysicalExamFindings = ?,
            Diagnosis = ?,
            DiagnosisCode = ?,
            TreatmentPlan = ?,
            ConsultationNotes = ?,
            FollowUpInstructions = ?,
            FollowUpDate = ?,
            UpdatedAt = NOW()
          WHERE ConsultationID = ?
        `, [
          chiefComplaint || '', 
          historyOfPresentIllness || '',
          JSON.stringify(parsedPhysicalExamFindings),
          diagnosis || '', 
          diagnosisCode || '', 
          treatmentPlan || '', 
          consultationNotes || '',
          followUpInstructions || '', 
          followUpDate || null, 
          consultationId
        ]);
        console.log('Consultation updated successfully');
      }
    } catch (consultationError: any) {
      console.error('Error in consultation handling:', consultationError);
      throw new Error(`Consultation handling failed: ${consultationError.message}`);
    }

    // ======================
    // 4. CREATE MEDICAL HISTORY (OPTIONAL)
    // ======================
    console.log('4. Creating medical history entries...');
    
    try {
      if (diagnosis?.trim()) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Check if entry already exists
        const [existing]: any = await db.query(`
          SELECT HistoryID FROM medical_history 
          WHERE PatientID = ? AND ConsultationID = ? AND RecordName = ?
        `, [patientIdNum, consultationId, diagnosis]);

        if (existing.length === 0) {
          console.log('Creating new medical history entry for diagnosis:', diagnosis);
          
          await db.query(`
            INSERT INTO medical_history 
            (PatientID, ConsultationID, VisitID, RecordType, RecordName, 
             Description, Status, StartDate, Severity, Notes, CreatedBy, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            patientIdNum,
            consultationId,
            visitId || null,
            'condition',
            diagnosis,
            `Primary diagnosis: ${diagnosis}\nCode: ${diagnosisCode || 'N/A'}`,
            'active',
            currentDate,
            severityAssessment || severity || 'moderate',
            consultationNotes || null,
            doctorIdNum
          ]);
          
          console.log('Medical history entry created successfully');
        } else {
          console.log('Medical history entry already exists');
        }
      } else {
        console.log('No diagnosis provided, skipping medical history');
      }
    } catch (historyError: any) {
      console.warn('Warning: Failed to create medical history entry:', historyError);
      // Don't fail the transaction for medical history errors
    }

    // ======================
    // 5. COMMIT TRANSACTION
    // ======================
    console.log('5. Committing transaction...');
    await db.query('COMMIT');

    console.log('=== SAVE CONSULTATION FORM SUCCESS ===');
    
    res.json({ 
      success: true,
      message: "Consultation form saved successfully",
      consultationId: consultationId,
      visitId: visitId,
      isNew: existingConsultation.length === 0
    });
    
  } catch (error: any) {
    console.error('=== SAVE CONSULTATION FORM ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    try {
      await db.query('ROLLBACK');
      console.log('Transaction rolled back');
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }

    // Provide detailed error response
    res.status(500).json({ 
      success: false,
      error: "Failed to save consultation form",
      message: error.message,
      sqlMessage: error.sqlMessage || 'No SQL error',
      code: error.code,
      errno: error.errno
    });
  }
};

// KEEP THE OLD FUNCTION BUT RENAME IT for completing consultation later
export const completeConsultation = async (req: Request, res: Response) => {
  const { consultationId, visitId, patientId, doctorId } = req.body;
  
  try {
    await db.query('START TRANSACTION');
    
    // Update consultation with EndTime
    await db.query(`
      UPDATE consultation 
      SET 
        EndTime = NOW(),
        UpdatedAt = NOW()
      WHERE ConsultationID = ?
    `, [consultationId]);
    
    // Update visit status to completed
    await db.query(`
      UPDATE patient_visit 
      SET 
        VisitStatus = 'completed',
        QueueStatus = 'completed',
        CheckOutTime = NOW(),
        UpdatedAt = NOW()
      WHERE VisitID = ?
    `, [visitId]);
    
    await db.query('COMMIT');
    
    res.json({ 
      success: true,
      message: "Consultation completed successfully",
      consultationId: consultationId,
      visitId: visitId
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Complete consultation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to complete consultation" 
    });
  }
};

// Get all appointments including those with visits (for consultation tab)
export const getAllTodayAppointments = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID as id,
        a.PatientID as patientId,
        p.Name as name,
        p.Gender as gender,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age,
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        COALESCE(pv.VisitStatus, a.Status) as status,
        pv.VisitNotes as chiefComplaint,
        COALESCE(pv.VisitType, a.Purpose) as VisitType,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.TriagePriority,
        a.AppointmentDateTime,
        a.Notes
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      LEFT JOIN patient_visit pv ON a.PatientID = pv.PatientID 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.DoctorID = a.DoctorID
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled', 'confirmed')
      ORDER BY a.AppointmentDateTime ASC
    `, [doctorId]);
    
    // Add walk-in patients
    const [walkIns]: any = await db.query(`
      SELECT 
        pv.VisitID as id,
        pv.PatientID as patientId,
        p.Name as name,
        p.Gender as gender,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age,
        DATE_FORMAT(pv.ArrivalTime, '%h:%i %p') as time,
        'walk-in' as type,
        pv.VisitStatus as status,
        pv.VisitNotes as chiefComplaint,
        pv.VisitType,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.TriagePriority,
        pv.ArrivalTime as AppointmentDateTime,
        NULL as Notes
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      WHERE pv.DoctorID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitType = 'walk-in'
        AND pv.VisitStatus NOT IN ('completed', 'cancelled')
      ORDER BY pv.ArrivalTime ASC
    `, [doctorId]);
    
    const allPatients = [...appointments, ...walkIns];
    
    // Sort by time
    allPatients.sort((a, b) => 
      new Date(a.AppointmentDateTime).getTime() - new Date(b.AppointmentDateTime).getTime()
    );
    
    res.json(allPatients);
  } catch (error) {
    console.error("All appointments error:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

// Get appointment queue for consultation tab
export const getConsultationQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [queue]: any = await db.query(`
      SELECT 
        pv.VisitID as id,
        pv.PatientID as patientId,
        p.Name as name,
        p.Gender as gender,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age,
        DATE_FORMAT(pv.ArrivalTime, '%h:%i %p') as time,
        pv.VisitType as type,
        pv.VisitStatus as status,
        pv.VisitNotes as chiefComplaint,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.TriagePriority,
        pv.ArrivalTime as AppointmentDateTime,
        'walk-in' as source
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      WHERE pv.DoctorID = ? 
        AND DATE(pv.ArrivalTime) = CURDATE()
        AND pv.VisitStatus IN ('checked-in', 'in-consultation')
        AND pv.QueueStatus IN ('waiting', 'in-progress')
      UNION
      SELECT 
        a.AppointmentID as id,
        a.PatientID as patientId,
        p.Name as name,
        p.Gender as gender,
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age,
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        a.Purpose as type,
        a.Status as status,
        a.Notes as chiefComplaint,
        NULL as QueueNumber,
        NULL as QueuePosition,
        'medium' as TriagePriority,
        a.AppointmentDateTime,
        'appointment' as source
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      WHERE a.DoctorID = ? 
        AND DATE(a.AppointmentDateTime) = CURDATE()
        AND a.Status IN ('scheduled', 'confirmed')
        AND NOT EXISTS (
          SELECT 1 FROM patient_visit pv 
          WHERE pv.PatientID = a.PatientID 
            AND DATE(pv.ArrivalTime) = CURDATE()
            AND pv.DoctorID = a.DoctorID
        )
      ORDER BY AppointmentDateTime ASC
    `, [doctorId, doctorId]);
    
    res.json(queue);
  } catch (error) {
    console.error("Consultation queue error:", error);
    res.status(500).json({ error: "Failed to fetch consultation queue" });
  }
};


