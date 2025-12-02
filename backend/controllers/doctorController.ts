import { Request, Response } from "express";
import { db } from "../db";

export const getDoctorProfile = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [doctor]: any = await db.query(`
      SELECT u.UserID, u.Name, u.Email, u.PhoneNum, u.Role,
             d.Specialization, d.LicenseNo, d.ClinicRoom
      FROM UserAccount u
      LEFT JOIN DoctorProfile d ON u.UserID = d.DoctorID
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

export const getTodayAppointments = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT a.AppointmentID as id, p.Name as name, 
             DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
             a.Purpose as type,
             a.Status as status
      FROM Appointment a
      JOIN Patient p ON a.PatientID = p.PatientID
      WHERE a.DoctorID = ? 
      AND DATE(a.AppointmentDateTime) = CURDATE()
      AND a.Status IN ('scheduled', 'checked-in', 'in-progress')
      ORDER BY a.AppointmentDateTime
    `, [doctorId]);
    
    res.json(appointments);
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPatientQueue = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  
  try {
    const [queue]: any = await db.query(`
      SELECT a.AppointmentID as id, p.Name as name,
             CONCAT('A', LPAD(a.AppointmentID, 3, '0')) as number,
             TIMESTAMPDIFF(MINUTE, a.CheckInTime, NOW()) as waitTime,
             a.Priority as priority
      FROM Appointment a
      JOIN Patient p ON a.PatientID = p.PatientID
      WHERE a.DoctorID = ? 
      AND DATE(a.AppointmentDateTime) = CURDATE()
      AND a.Status = 'checked-in'
      ORDER BY a.CheckInTime
    `, [doctorId]);
    
    // Format wait time
    const formattedQueue = queue.map((item: any) => ({
      ...item,
      waitTime: `${item.waitTime || 0} min`
    }));
    
    res.json(formattedQueue);
  } catch (error) {
    console.error("Queue error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPatientDetails = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    // Get basic patient info
    const [patient]: any = await db.query(`
      SELECT p.*, 
             TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) as age
      FROM Patient p
      WHERE p.PatientID = ?
    `, [patientId]);
    
    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    // Get allergies
    const [allergies]: any = await db.query(`
      SELECT AllergyName as allergy
      FROM PatientAllergy 
      WHERE PatientID = ?
    `, [patientId]);
    
    // Get current medications
    const [medications]: any = await db.query(`
      SELECT MedicationName as name, Dosage as dosage, Frequency as frequency
      FROM PatientMedication 
      WHERE PatientID = ? AND Status = 'active'
    `, [patientId]);
    
    // Get medical conditions
    const [conditions]: any = await db.query(`
      SELECT ConditionName as condition, DiagnosedDate as diagnosed, Status as status
      FROM MedicalCondition 
      WHERE PatientID = ?
    `, [patientId]);
    
    // Get recent visits
    const [visits]: any = await db.query(`
      SELECT c.ConsultationDateTime as date, d.Name as doctor, c.Diagnosis as reason
      FROM Consultation c
      JOIN UserAccount d ON c.DoctorID = d.UserID
      WHERE c.PatientID = ?
      ORDER BY c.ConsultationDateTime DESC
      LIMIT 5
    `, [patientId]);
    
    const patientData = {
      ...patient[0],
      allergies: allergies.map((a: any) => a.allergy),
      medicalHistory: conditions,
      currentMedications: medications,
      recentVisits: visits
    };
    
    res.json(patientData);
  } catch (error) {
    console.error("Patient details error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const saveConsultation = async (req: Request, res: Response) => {
  const { appointmentId, doctorId, patientId, symptoms, diagnosis, treatment, notes } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Create consultation record
    const [consultation]: any = await db.query(`
      INSERT INTO Consultation 
      (ConsultationDateTime, Symptoms, Diagnosis, Notes, AppointmentID, DoctorID, PatientID)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?)
    `, [symptoms, diagnosis, notes, appointmentId, doctorId, patientId]);
    
    // Update appointment status
    await db.query(`
      UPDATE Appointment SET Status = 'completed' WHERE AppointmentID = ?
    `, [appointmentId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      message: "Consultation saved successfully",
      consultationId: consultation.insertId 
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Consultation save error:", error);
    res.status(500).json({ error: "Failed to save consultation" });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  const { consultationId, doctorId, patientId, medications, remarks } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Create prescription
    const [prescription]: any = await db.query(`
      INSERT INTO Prescription 
      (PrescribedDate, Remarks, DoctorID, PatientID, ConsultationID)
      VALUES (CURDATE(), ?, ?, ?, ?)
    `, [remarks, doctorId, patientId, consultationId]);
    
    // Add prescription items
    for (const med of medications) {
      await db.query(`
        INSERT INTO PrescriptionItem 
        (Dosage, Frequency, Duration, PrescriptionID, DrugID)
        VALUES (?, ?, ?, ?, ?)
      `, [med.dosage, med.frequency, med.duration, prescription.insertId, med.drugId]);
    }
    
    // Set prescription status to pending
    await db.query(`
      INSERT INTO PrescriptionStatus 
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
      SELECT p.PrescriptionID, pat.Name as patient, 
             d.DrugName as medication, pi.Dosage, pi.Frequency as dosage,
             p.PrescribedDate as date
      FROM Prescription p
      JOIN Patient pat ON p.PatientID = pat.PatientID
      JOIN PrescriptionItem pi ON p.PrescriptionID = pi.PrescriptionID
      JOIN Drug d ON pi.DrugID = d.DrugID
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
      INSERT INTO Appointment 
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