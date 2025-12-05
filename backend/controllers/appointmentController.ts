// controllers/appointmentController.ts
import { Request, Response } from "express";
import { db } from "../db";

// ============ APPOINTMENT MANAGEMENT ============

// 1. Get today's appointments with visit status
export const getTodayAppointments = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [appointments]: any = await db.query(`
      SELECT 
        a.AppointmentID,
        a.AppointmentDateTime,
        a.Purpose,
        a.Status as appointmentStatus,
        a.QueueNumber as appointmentQueueNumber,
        a.Notes,
        a.DoctorID,
        p.PatientID,
        p.Name as patientName,
        p.PhoneNumber,
        p.ICNo,
        u.Name as doctorName,
        dp.Specialization,
        v.VisitID,
        v.VisitStatus,
        v.QueueNumber as visitQueueNumber,
        v.QueueStatus,
        v.CheckInTime,
        v.TriagePriority,
        v.CalledTime,
        v.CheckOutTime
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      LEFT JOIN doctorprofile dp ON a.DoctorID = dp.DoctorID
      LEFT JOIN useraccount u ON a.DoctorID = u.UserID
      LEFT JOIN patient_visit v ON a.AppointmentID = v.AppointmentID 
        AND v.VisitStatus NOT IN ('cancelled', 'no-show')
      WHERE DATE(a.AppointmentDateTime) = ?
        AND a.Status != 'cancelled'
      ORDER BY a.AppointmentDateTime ASC
    `, [today]);
    
    // Format response
    const formatted = appointments.map((apt: any) => ({
      ...apt,
      date: apt.AppointmentDateTime ? new Date(apt.AppointmentDateTime).toISOString().split('T')[0] : null,
      time: apt.AppointmentDateTime ? new Date(apt.AppointmentDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : null,
      QueueNumber: apt.visitQueueNumber || apt.appointmentQueueNumber,
      status: apt.VisitID ? apt.VisitStatus : apt.appointmentStatus
    }));
    
    res.json({
      success: true,
      appointments: formatted
    });
    
  } catch (error: any) {
    console.error("Get today appointments error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch today's appointments" 
    });
  }
};

// 2. Check-in appointment (creates patient_visit record)
export const checkInAppointment = async (req: Request, res: Response) => {
  const { appointmentId, receptionistId } = req.body;
  
  try {
    if (!appointmentId || !receptionistId) {
      return res.status(400).json({ 
        success: false,
        error: "Missing appointment ID or receptionist ID"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Get appointment details
    const [appointments]: any = await db.query(`
      SELECT 
        a.*, 
        p.Name as patientName,
        p.PatientID,
        u.Name as doctorName,
        a.DoctorID,
        a.Purpose,
        a.QueueNumber as appointmentQueueNumber
      FROM appointment a
      JOIN patient p ON a.PatientID = p.PatientID
      LEFT JOIN useraccount u ON a.DoctorID = u.UserID
      WHERE a.AppointmentID = ?
        AND a.Status != 'cancelled'
    `, [appointmentId]);
    
    if (appointments.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ 
        success: false,
        error: "Appointment not found or already cancelled" 
      });
    }
    
    const appointment = appointments[0];
    
    // Check if visit already exists and is active
    const [existingVisits]: any = await db.query(`
      SELECT * FROM patient_visit 
      WHERE AppointmentID = ? 
        AND VisitStatus NOT IN ('cancelled', 'no-show', 'completed')
    `, [appointmentId]);
    
    if (existingVisits.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        error: "Patient already checked in for this appointment" 
      });
    }
    
    // Generate queue number using YYMMDD format
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get the MAX queue number for today that matches Q-YYMMDD-XXX pattern
    const [maxQueue]: any = await db.query(`
      SELECT 
        MAX(
          CASE 
            WHEN QueueNumber LIKE 'Q-${dateStr}-%' 
            THEN CAST(SUBSTRING_INDEX(QueueNumber, '-', -1) AS UNSIGNED)
            ELSE 0
          END
        ) as maxNumber
      FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE()
    `, []);
    
    const lastNumber = maxQueue[0].maxNumber || 0;
    const count = lastNumber + 1;
    const queueNumber = `Q-${dateStr}-${count.toString().padStart(3, '0')}`;
    
    // Get next queue position
    const [maxPosition]: any = await db.query(
      'SELECT MAX(QueuePosition) as maxPos FROM patient_visit WHERE DATE(ArrivalTime) = CURDATE()',
      []
    );
    const queuePosition = (maxPosition[0].maxPos || 0) + 1;
    
    // Update appointment status to 'confirmed'
    await db.query(`
      UPDATE appointment 
      SET Status = 'confirmed',
          UpdatedAt = NOW()
      WHERE AppointmentID = ?
    `, [appointmentId]);
    
    // Create patient_visit record
    const [visit]: any = await db.query(`
      INSERT INTO patient_visit 
      (AppointmentID, PatientID, DoctorID, VisitType, ArrivalTime, CheckInTime, 
       VisitStatus, VisitNotes, QueueNumber, QueueStatus, QueuePosition, TriagePriority)
      VALUES (?, ?, ?, 'follow-up', NOW(), NOW(), 'checked-in', ?, ?, 'waiting', ?, 'low')
    `, [
      appointmentId,
      appointment.PatientID,
      appointment.DoctorID || null,
      appointment.Purpose || 'Appointment visit',
      queueNumber,
      queuePosition
    ]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Patient checked in successfully",
      visitId: visit.insertId,
      queueNumber,
      queuePosition,
      patientName: appointment.patientName
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Check-in appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to check in patient"
    });
  }
};

// 3. Mark appointment as late/no-show
export const markAppointmentLate = async (req: Request, res: Response) => {
  const { appointmentId, reason } = req.body;
  
  try {
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false,
        error: "Missing appointment ID"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Update appointment status to 'no-show'
    await db.query(`
      UPDATE appointment 
      SET Status = 'cancelled',
          UpdatedAt = NOW(),
          Notes = CONCAT(COALESCE(Notes, ''), '\nMarked as no-show: ${reason || 'Patient did not arrive'}')
      WHERE AppointmentID = ?
    `, [appointmentId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Appointment marked as no-show"
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Mark appointment late error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to mark appointment as no-show"
    });
  }
};

// 4. Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  const { appointmentId, reason, cancelledBy } = req.body;
  
  try {
    if (!appointmentId || !reason) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Update appointment status
    await db.query(`
      UPDATE appointment 
      SET Status = 'cancelled', 
          UpdatedAt = NOW(),
          Notes = CONCAT(COALESCE(Notes, ''), '\nCancelled by ${cancelledBy}: ${reason}')
      WHERE AppointmentID = ?
    `, [appointmentId]);
    
    // Also cancel any associated active visit
    await db.query(`
      UPDATE patient_visit 
      SET VisitStatus = 'cancelled',
          QueueStatus = 'cancelled',
          VisitNotes = CONCAT(COALESCE(VisitNotes, ''), '\nCancelled with appointment')
      WHERE AppointmentID = ? 
        AND VisitStatus NOT IN ('completed', 'cancelled')
    `, [appointmentId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Appointment cancelled successfully"
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Cancel appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to cancel appointment"
    });
  }
};

// 5. Reschedule appointment
export const rescheduleAppointment = async (req: Request, res: Response) => {
  const { appointmentId, newDateTime, reason, rescheduledBy } = req.body;
  
  try {
    if (!appointmentId || !newDateTime) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Update appointment
    await db.query(`
      UPDATE appointment 
      SET AppointmentDateTime = ?,
          Status = 'scheduled',
          UpdatedAt = NOW(),
          Notes = CONCAT(COALESCE(Notes, ''), '\nRescheduled by ${rescheduledBy}: ${reason || ''}')
      WHERE AppointmentID = ?
    `, [newDateTime, appointmentId]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Appointment rescheduled successfully"
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Reschedule appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to reschedule appointment"
    });
  }
};