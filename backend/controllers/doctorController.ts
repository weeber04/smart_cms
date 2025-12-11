// controllers/doctorController.ts
import { Request, Response } from "express";
import { db } from "../db";

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
    
    // First check if patient already has a doctor assigned
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

// Save vital signs
export const saveVitalSigns = async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    consultationId,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    temperature,
    heartRate,
    oxygenSaturation,
    respiratoryRate,
    height,
    weight,
    bmi,
    painLevel,
    notes
  } = req.body;
  
  try {
    // If no consultationId is provided, we need to get or create one
    let finalConsultationId = consultationId;
    
    if (!finalConsultationId) {
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
        // Create a new patient_visit and consultation
        const [newVisit]: any = await db.query(`
          INSERT INTO patient_visit 
          (PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, VisitStatus, QueueStatus, VisitNotes)
          VALUES (?, ?, 'walk-in', NOW(), NOW(), 'checked-in', 'waiting', 'Vital signs recording')
        `, [patientId, doctorId]);
        
        const [newConsultation]: any = await db.query(`
          INSERT INTO consultation (VisitID, DoctorID)
          VALUES (?, ?)
        `, [newVisit.insertId, doctorId]);
        
        finalConsultationId = newConsultation.insertId;
      } else {
        finalConsultationId = activeConsultation[0].ConsultationID;
      }
    }
    
    // Save vital signs
    const [result]: any = await db.query(`
      INSERT INTO vital_signs 
      (ConsultationID, TakenBy, TakenAt, BloodPressureSystolic, BloodPressureDiastolic, 
       Temperature, HeartRate, OxygenSaturation, RespiratoryRate, Height, Weight, BMI, PainLevel, Notes)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalConsultationId,
      doctorId,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      temperature,
      heartRate,
      oxygenSaturation,
      respiratoryRate,
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
    console.error("Save vitals error:", error);
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