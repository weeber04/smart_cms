import { Request, Response } from "express";
import { db } from "../db";

// Get receptionist profile
export const getReceptionistProfile = async (req: Request, res: Response) => {
  const { receptionistId } = req.params;
  
  try {
    const [receptionist]: any = await db.query(`
      SELECT UserID as userId, Name, Email, PhoneNum as phone, Role, Status
      FROM UserAccount 
      WHERE UserID = ? AND Role = 'receptionist'
    `, [receptionistId]);
    
    if (receptionist.length === 0) {
      return res.status(404).json({ error: "Receptionist not found" });
    }
    
    res.json(receptionist[0]);
  } catch (error) {
    console.error("Receptionist profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all appointments (today and future)
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID as id,
        a.AppointmentDateTime,
        p.Name as patientName,
        p.PatientID,
        u.Name as doctorName,
        dp.Specialization,
        a.Purpose,
        a.Status,
        a.QueueNumber,
        a.Notes,
        DATE_FORMAT(a.AppointmentDateTime, '%Y-%m-%d') as date,
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time,
        DATE_FORMAT(a.UpdatedAt, '%Y-%m-%d %H:%i:%s') as updatedAt
      FROM Appointment a
      JOIN Patient p ON a.PatientID = p.PatientID
      JOIN UserAccount u ON a.DoctorID = u.UserID
      LEFT JOIN DoctorProfile dp ON u.UserID = dp.DoctorID
      WHERE a.AppointmentDateTime >= CURDATE()
      ORDER BY a.AppointmentDateTime ASC
    `);
    
    res.json(appointments);
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get today's visits
// Get today's visits
export const getTodayVisits = async (req: Request, res: Response) => {
  try {
    const [visits]: any = await db.query(`
      SELECT 
        pv.VisitID,
        p.Name as patientName,
        p.PatientID,
        p.PhoneNumber,
        pv.VisitType,
        pv.VisitStatus,
        DATE_FORMAT(pv.ArrivalTime, '%h:%i %p') as arrivalTime,
        DATE_FORMAT(pv.CheckInTime, '%h:%i %p') as checkInTime,
        DATE_FORMAT(pv.ConsultationStartTime, '%h:%i %p') as consultationStartTime,
        DATE_FORMAT(pv.ConsultationEndTime, '%h:%i %p') as consultationEndTime,
        u.Name as doctorName,
        a.QueueNumber,
        pv.ReasonForVisit,
        pv.VisitNotes,
        CASE 
          WHEN pv.VisitType = 'first-time' THEN 'First Visit'
          WHEN pv.VisitType = 'follow-up' THEN 'Follow-up'
          ELSE 'Walk-in'
        END as visitTypeLabel,
        TIMESTAMPDIFF(MINUTE, COALESCE(pv.ArrivalTime, NOW()), NOW()) as waitMinutes,
        TIMESTAMPDIFF(MINUTE, pv.ConsultationStartTime, pv.ConsultationEndTime) as consultationDuration
      FROM patient_visit pv
      JOIN Patient p ON pv.PatientID = p.PatientID
      LEFT JOIN UserAccount u ON pv.DoctorID = u.UserID
      LEFT JOIN Appointment a ON pv.AppointmentID = a.AppointmentID
      WHERE DATE(COALESCE(pv.ArrivalTime, NOW())) = CURDATE()
        AND pv.VisitStatus IN ('arrived', 'checked-in', 'in-consultation')
      ORDER BY 
        CASE pv.VisitStatus
          WHEN 'in-consultation' THEN 1
          WHEN 'checked-in' THEN 2
          WHEN 'arrived' THEN 3
          ELSE 4
        END,
        COALESCE(pv.ArrivalTime, NOW())
    `);
    
    res.json(visits);
  } catch (error) {
    console.error("Get today visits error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get billing records
export const getBillingRecords = async (req: Request, res: Response) => {
  try {
    const [billing]: any = await db.query(`
      SELECT 
        b.BillID as id,
        p.Name as patient,
        u.Name as doctor,
        'Consultation' as service,
        b.TotalAmount as amount,
        b.Status as status,
        DATE(b.BillingDate) as date,
        b.AmountPaid,
        b.PatientResponsibility
      FROM Billing b
      JOIN Patient p ON b.PatientID = p.PatientID
      JOIN UserAccount u ON b.HandledBy = u.UserID
      WHERE b.Status != 'cancelled'
      ORDER BY b.BillingDate DESC
      LIMIT 10
    `);
    
    res.json(billing);
  } catch (error) {
    console.error("Billing records error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all doctors
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const [doctors]: any = await db.query(`
      SELECT 
        u.UserID as id, 
        u.Name, 
        dp.Specialization,
        dp.ClinicRoom
      FROM UserAccount u
      LEFT JOIN DoctorProfile dp ON u.UserID = dp.DoctorID
      WHERE u.Role = 'doctor' AND u.Status = 'Active'
      ORDER BY u.Name
    `);
    
    res.json(doctors);
  } catch (error) {
    console.error("Doctors error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Register new patient (first-time walk-in)
export const registerPatient = async (req: Request, res: Response) => {
  try {
    const { 
      name, icNo, gender, dob, phoneNumber, createdBy,
      email, bloodType, address,
      insuranceProvider, insurancePolicyNo,
      emergencyContactName, emergencyContactPhone,
      reasonForVisit, doctorId
    } = req.body;
    
    console.log("Registering patient:", { name, icNo, phoneNumber });
    
    // Validate required fields
    if (!name || !icNo || !gender || !dob || !phoneNumber || !createdBy) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["name", "icNo", "gender", "dob", "phoneNumber", "createdBy"]
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Check if IC number already exists
    const [existingPatient]: any = await db.query(
      "SELECT PatientID FROM Patient WHERE ICNo = ?",
      [icNo]
    );
    
    if (existingPatient.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        error: "Patient with this IC number already exists"
      });
    }
    
    // Register patient
    const [patient]: any = await db.query(`
      INSERT INTO Patient 
      (Name, ICNo, Gender, DOB, PhoneNumber, Email, Address, BloodType,
       InsuranceProvider, InsurancePolicyNo,
       EmergencyContactName, EmergencyContactPhone,
       CreatedBy, RegistrationDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name, icNo, gender.toUpperCase(), dob, phoneNumber, email || null,
      address || null, bloodType || null,
      insuranceProvider || null, insurancePolicyNo || null,
      emergencyContactName || null, emergencyContactPhone || null,
      createdBy
    ]);
    
    const patientId = patient.insertId;
    
    // Create first-time visit record
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (PatientID, DoctorID, VisitType, ArrivalTime, VisitStatus, ReasonForVisit)
      VALUES (?, ?, 'first-time', NOW(), 'arrived', ?)
    `, [patientId, doctorId || null, reasonForVisit || 'First consultation']);
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Patient registered successfully",
      patientId,
      visitId: visit.insertId
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Registration error:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        error: "Duplicate entry. Patient may already exist."
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Registration failed",
      details: error.message
    });
  }
};

// Search patient
export const searchPatient = async (req: Request, res: Response) => {
  const { search } = req.query;
  
  try {
    const [patients]: any = await db.query(`
      SELECT 
        PatientID as id, 
        Name, 
        ICNo, 
        PhoneNumber, 
        Email,
        Gender,
        DOB,
        BloodType
      FROM Patient 
      WHERE Name LIKE ? OR ICNo LIKE ? OR PhoneNumber LIKE ?
      ORDER BY Name
      LIMIT 20
    `, [`%${search}%`, `%${search}%`, `%${search}%`]);
    
    res.json(patients);
  } catch (error) {
    console.error("Patient search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Schedule appointment (for follow-up or new consultation)
export const scheduleAppointment = async (req: Request, res: Response) => {
  const { 
    patientId, 
    doctorId, 
    appointmentDateTime, 
    purpose, 
    notes, 
    createdBy,
    visitType = 'follow-up'
  } = req.body;
  
  console.log("Scheduling appointment:", req.body);
  
  try {
    // Validate input
    if (!patientId || !doctorId || !appointmentDateTime || !purpose || !createdBy) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Check patient exists
    const [patient]: any = await db.query(
      "SELECT PatientID, Name FROM Patient WHERE PatientID = ?",
      [patientId]
    );
    
    if (patient.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Patient not found" 
      });
    }
    
    // Check doctor exists
    const [doctor]: any = await db.query(`
      SELECT u.UserID, u.Name, dp.Specialization
      FROM UserAccount u
      LEFT JOIN DoctorProfile dp ON u.UserID = dp.DoctorID
      WHERE u.UserID = ? AND u.Role = 'doctor' AND u.Status = 'Active'
    `, [doctorId]);
    
    if (doctor.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Doctor not found or not active" 
      });
    }
    
    // Generate queue number
    const appointmentDate = new Date(appointmentDateTime).toISOString().split('T')[0];
    const [doctorQueue]: any = await db.query(`
      SELECT COUNT(*) as count 
      FROM Appointment 
      WHERE DoctorID = ? AND DATE(AppointmentDateTime) = ?
    `, [doctorId, appointmentDate]);
    
    const specializationCode = doctor[0].Specialization 
      ? doctor[0].Specialization.substring(0, 3).toUpperCase() 
      : 'DOC';
    const queueNumber = `${specializationCode}-${(doctorQueue[0].count + 1).toString().padStart(3, '0')}`;
    
    // Insert appointment
    const [appointment]: any = await db.query(`
      INSERT INTO Appointment 
      (AppointmentDateTime, Purpose, Status, PatientID, DoctorID, 
       CreatedBy, QueueNumber, Notes)
      VALUES (?, ?, 'scheduled', ?, ?, ?, ?, ?)
    `, [
      appointmentDateTime, 
      purpose, 
      patientId, 
      doctorId, 
      createdBy, 
      queueNumber,
      notes || ''
    ]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Appointment scheduled successfully",
      appointmentId: appointment.insertId,
      queueNumber,
      patientName: patient[0].Name,
      doctorName: doctor[0].Name,
      appointmentDateTime
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Schedule appointment error:", error);
    
    res.status(500).json({ 
      success: false,
      error: "Failed to schedule appointment",
      details: error.message
    });
  }
};

// Check-in existing patient (with or without appointment)
export const checkInPatient = async (req: Request, res: Response) => {
  const {
    patientId, 
    appointmentId, 
    reasonForVisit, 
    doctorId,
    visitType = 'walk-in'
  } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Check patient exists
    const [patient]: any = await db.query(
      "SELECT PatientID, Name FROM Patient WHERE PatientID = ?",
      [patientId]
    );
    
    if (patient.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Patient not found" 
      });
    }
    
    let linkedAppointmentId = null;
    let finalVisitType = visitType; // Create a new variable
    
    // If appointment ID provided, verify and update
    if (appointmentId) {
      const [appointment]: any = await db.query(`
        SELECT AppointmentID, Status 
        FROM Appointment 
        WHERE AppointmentID = ? AND PatientID = ?
      `, [appointmentId, patientId]);
      
      if (appointment.length > 0) {
        linkedAppointmentId = appointmentId;
        finalVisitType = 'follow-up'; // Use the new variable
        
        // Update appointment status
        await db.query(`
          UPDATE Appointment 
          SET Status = 'confirmed', UpdatedAt = NOW()
          WHERE AppointmentID = ?
        `, [appointmentId]);
      }
    }
    
    // Create visit record
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (AppointmentID, PatientID, DoctorID, VisitType, 
       ArrivalTime, VisitStatus, ReasonForVisit)
      VALUES (?, ?, ?, ?, NOW(), 'arrived', ?)
    `, [linkedAppointmentId, patientId, doctorId, finalVisitType, reasonForVisit]);
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Patient checked in successfully",
      visitId: visit.insertId,
      visitType: finalVisitType
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Check-in error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to check in patient"
    });
  }
};

// Update visit status
// Update visit status
export const updateVisitStatus = async (req: Request, res: Response) => {
  const { visitId, status: newStatus } = req.body; // Rename to newStatus
  
  try {
    // Get current visit
    const [visit]: any = await db.query(`
      SELECT VisitStatus FROM patient_visit WHERE VisitID = ?
    `, [visitId]);
    
    if (visit.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Visit not found" 
      });
    }
    
    let updateQuery = '';
    
    switch (newStatus) {
      case 'checked-in':
        updateQuery = `CheckInTime = NOW()`;
        break;
      case 'in-consultation':
        updateQuery = `ConsultationStartTime = NOW()`;
        break;
      case 'completed':
        updateQuery = `ConsultationEndTime = NOW(),
                      ConsultationDuration = TIMESTAMPDIFF(MINUTE, ConsultationStartTime, NOW())`;
        break;
      case 'check-out':
        updateQuery = `CheckOutTime = NOW(),
                      TotalVisitDuration = TIMESTAMPDIFF(MINUTE, ArrivalTime, NOW())`;
        // For check-out, we'll update to 'completed' status
        await db.query(`
          UPDATE patient_visit 
          SET ${updateQuery}, VisitStatus = 'completed'
          WHERE VisitID = ?
        `, [visitId]);
        
        return res.json({
          success: true,
          message: "Patient checked out successfully",
          status: 'completed'
        });
      default:
        updateQuery = '';
    }
    
    if (updateQuery) {
      await db.query(`
        UPDATE patient_visit 
        SET ${updateQuery}, VisitStatus = ?
        WHERE VisitID = ?
      `, [newStatus, visitId]);
    } else {
      await db.query(`
        UPDATE patient_visit 
        SET VisitStatus = ?
        WHERE VisitID = ?
      `, [newStatus, visitId]);
    }
    
    res.json({
      success: true,
      message: `Visit status updated to ${newStatus}`,
      status: newStatus
    });
    
  } catch (error: any) {
    console.error("Update visit status error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update visit status"
    });
  }
};

// Process payment
export const processPayment = async (req: Request, res: Response) => {
  const { 
    billId, 
    amountPaid, 
    paymentMethod, 
    notes, 
    processedBy 
  } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Get current billing info
    const [billing]: any = await db.query(`
      SELECT TotalAmount, AmountPaid, Status FROM Billing WHERE BillID = ?
    `, [billId]);
    
    if (billing.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Bill not found" 
      });
    }
    
    const totalAmount = parseFloat(billing[0].TotalAmount);
    const currentPaid = parseFloat(billing[0].AmountPaid || 0);
    const newPaid = currentPaid + parseFloat(amountPaid);
    
    // Determine new status
    let newStatus = 'pending';
    if (newPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partial';
    }
    
    // Update billing
    await db.query(`
      UPDATE Billing 
      SET Status = ?, AmountPaid = ?, PaymentDate = CURDATE()
      WHERE BillID = ?
    `, [newStatus, newPaid, billId]);
    
    // Create payment record
    await db.query(`
      INSERT INTO Payment 
      (BillID, AmountPaid, PaymentMethod, PaymentDate, ProcessedBy, Notes)
      VALUES (?, ?, ?, CURDATE(), ?, ?)
    `, [billId, amountPaid, paymentMethod, processedBy, notes]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Payment processed successfully",
      newStatus,
      amountPaid: newPaid
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Payment processing error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to process payment" 
    });
  }
};

// Get patient appointment history
export const getPatientAppointments = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID,
        a.AppointmentDateTime,
        a.Purpose,
        a.Status,
        a.QueueNumber,
        a.Notes,
        u.Name as doctorName,
        dp.Specialization,
        DATE_FORMAT(a.AppointmentDateTime, '%Y-%m-%d') as date,
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time
      FROM Appointment a
      JOIN UserAccount u ON a.DoctorID = u.UserID
      LEFT JOIN DoctorProfile dp ON u.UserID = dp.DoctorID
      WHERE a.PatientID = ?
      ORDER BY a.AppointmentDateTime DESC
    `, [patientId]);
    
    res.json(appointments);
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  const { appointmentId, reason } = req.body;
  
  try {
    await db.query(`
      UPDATE Appointment 
      SET Status = 'cancelled', Notes = CONCAT(COALESCE(Notes, ''), ' Cancelled: ', ?)
      WHERE AppointmentID = ?
    `, [reason || 'No reason provided', appointmentId]);
    
    res.json({
      success: true,
      message: "Appointment cancelled successfully"
    });
  } catch (error: any) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to cancel appointment"
    });
  }
};

// Schedule follow-up from current visit
export const scheduleFollowUp = async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    appointmentDateTime,
    purpose,
    notes,
    createdBy,
    currentVisitId
  } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // First schedule the appointment using the main function
    const appointmentData = {
      patientId,
      doctorId,
      appointmentDateTime,
      purpose,
      notes,
      createdBy,
      visitType: 'follow-up'
    };
    
    const appointmentResult = await scheduleAppointmentInternal(appointmentData);
    
    if (!appointmentResult.success) {
      await db.query("ROLLBACK");
      return res.status(400).json(appointmentResult);
    }
    
    // Link to current visit if provided
    if (currentVisitId) {
      await db.query(`
        UPDATE patient_visit 
        SET NextAppointmentID = ?
        WHERE VisitID = ?
      `, [appointmentResult.appointmentId, currentVisitId]);
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Follow-up appointment scheduled",
      appointmentId: appointmentResult.appointmentId,
      queueNumber: appointmentResult.queueNumber
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Schedule follow-up error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to schedule follow-up"
    });
  }
};

// Helper function for internal appointment scheduling
const scheduleAppointmentInternal = async (data: any) => {
  const { patientId, doctorId, appointmentDateTime, purpose, notes, createdBy } = data;
  
  try {
    // Generate queue number
    const appointmentDate = new Date(appointmentDateTime).toISOString().split('T')[0];
    const [doctorQueue]: any = await db.query(`
      SELECT COUNT(*) as count 
      FROM Appointment 
      WHERE DoctorID = ? AND DATE(AppointmentDateTime) = ?
    `, [doctorId, appointmentDate]);
    
    const [doctor]: any = await db.query(`
      SELECT Specialization FROM DoctorProfile WHERE DoctorID = ?
    `, [doctorId]);
    
    const specializationCode = doctor[0]?.Specialization 
      ? doctor[0].Specialization.substring(0, 3).toUpperCase() 
      : 'DOC';
    const queueNumber = `${specializationCode}-${(doctorQueue[0].count + 1).toString().padStart(3, '0')}`;
    
    // Insert appointment
    const [appointment]: any = await db.query(`
      INSERT INTO Appointment 
      (AppointmentDateTime, Purpose, Status, PatientID, DoctorID, 
       CreatedBy, QueueNumber, Notes)
      VALUES (?, ?, 'scheduled', ?, ?, ?, ?, ?)
    `, [
      appointmentDateTime, 
      purpose, 
      patientId, 
      doctorId, 
      createdBy, 
      queueNumber,
      notes || ''
    ]);
    
    return {
      success: true,
      appointmentId: appointment.insertId,
      queueNumber
    };
  } catch (error: any) {
    console.error("Internal schedule error:", error);
    return {
      success: false,
      error: "Failed to schedule appointment internally"
    };
  }
};

// Get patient details
export const getPatientDetails = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const [patient]: any = await db.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT a.AppointmentID) as totalAppointments,
        COUNT(DISTINCT pv.VisitID) as totalVisits,
        DATE_FORMAT(MAX(pv.ArrivalTime), '%Y-%m-%d') as lastVisitDate
      FROM Patient p
      LEFT JOIN Appointment a ON p.PatientID = a.PatientID
      LEFT JOIN patient_visit pv ON p.PatientID = pv.PatientID
      WHERE p.PatientID = ?
      GROUP BY p.PatientID
    `, [patientId]);
    
    if (patient.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient[0]);
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update appointment
export const updateAppointment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const { 
    appointmentDateTime, 
    purpose, 
    notes, 
    doctorId,
    status 
  } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    
    if (appointmentDateTime) {
      updates.push("AppointmentDateTime = ?");
      values.push(appointmentDateTime);
    }
    
    if (purpose) {
      updates.push("Purpose = ?");
      values.push(purpose);
    }
    
    if (notes !== undefined) {
      updates.push("Notes = ?");
      values.push(notes);
    }
    
    if (doctorId) {
      updates.push("DoctorID = ?");
      values.push(doctorId);
    }
    
    if (status) {
      updates.push("Status = ?");
      values.push(status);
    }
    
    // Always update UpdatedAt
    updates.push("UpdatedAt = NOW()");
    
    if (updates.length === 1) { // Only UpdatedAt
      await db.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        error: "No fields to update" 
      });
    }
    
    values.push(appointmentId);
    
    const [result]: any = await db.query(`
      UPDATE Appointment 
      SET ${updates.join(', ')}
      WHERE AppointmentID = ?
    `, values);
    
    if (result.affectedRows === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Appointment not found" 
      });
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Appointment updated successfully"
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Update appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update appointment"
    });
  }
};

// Mark patient arrival (separate from check-in)
export const markPatientArrival = async (req: Request, res: Response) => {
  const { visitId } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    const [visit]: any = await db.query(`
      UPDATE patient_visit 
      SET ArrivalTime = NOW(), VisitStatus = 'arrived'
      WHERE VisitID = ?
    `, [visitId]);
    
    if (visit.affectedRows === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Visit not found" 
      });
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Patient arrival marked successfully",
      arrivalTime: new Date().toISOString()
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Mark arrival error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to mark arrival"
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [todayAppointments]: any = await db.query(`
      SELECT COUNT(*) as count FROM Appointment 
      WHERE DATE(AppointmentDateTime) = CURDATE() 
      AND Status IN ('scheduled', 'confirmed')
    `);
    
    const [todayVisits]: any = await db.query(`
      SELECT COUNT(*) as count FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE()
    `);
    
    const [waitingPatients]: any = await db.query(`
      SELECT COUNT(*) as count FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE() 
      AND VisitStatus IN ('arrived', 'checked-in')
    `);
    
    const [pendingPayments]: any = await db.query(`
      SELECT COUNT(*) as count FROM Billing 
      WHERE Status IN ('pending', 'partial')
      AND BillingDate = CURDATE()
    `);
    
    res.json({
      success: true,
      stats: {
        todayAppointments: todayAppointments[0].count,
        todayVisits: todayVisits[0].count,
        waitingPatients: waitingPatients[0].count,
        pendingPayments: pendingPayments[0].count
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to load dashboard stats" 
    });
  }
};
