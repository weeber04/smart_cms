// controllers/receptionistController.ts
import { Request, Response } from "express";
import { db } from "../db";

// ============ PATIENT MANAGEMENT ============
export const registerPatient = async (req: Request, res: Response) => {
  try {
    const { 
      name, icNo, gender, dob, phoneNumber, createdBy,
      email, bloodType, address,
      insuranceProvider, insurancePolicyNo,
      emergencyContactName, emergencyContactPhone,
      reasonForVisit, doctorId,
      // NEW FIELDS from frontend
      addressLine1, addressLine2, city, state, zipCode, country,
      chronicDisease, allergy
    } = req.body;
    
    console.log("Received patient data:", req.body);
    
    if (!name || !icNo || !gender || !dob || !phoneNumber || !createdBy) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: name, IC, gender, DOB, phone, createdBy"
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Check duplicate IC
    const [existing]: any = await db.query(
      "SELECT PatientID FROM Patient WHERE ICNo = ?",
      [icNo]
    );
    
    if (existing.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ 
        success: false,
        error: "Patient with this IC number already exists"
      });
    }
    
    // Build address from components if separate address fields are provided
    let finalAddress = address;
    if (!finalAddress && addressLine1) {
      finalAddress = [
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country
      ].filter(Boolean).join(', ');
    }
    
    // Insert patient with ALL fields from database schema
    const [patient]: any = await db.query(`
      INSERT INTO Patient 
      (Name, ICNo, Gender, DOB, PhoneNumber, Email, Address, BloodType,
       InsuranceProvider, InsurancePolicyNo,
       EmergencyContactName, EmergencyContactPhone,
       CreatedBy, RegistrationDate,
       AddressLine1, AddressLine2, City, State, ZipCode, Country,
       ChronicDisease, Allergy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      icNo, 
      gender.toUpperCase(), 
      dob, 
      phoneNumber, 
      email || null,
      finalAddress || null, 
      bloodType || null,
      insuranceProvider || null, 
      insurancePolicyNo || null,
      emergencyContactName || null, 
      emergencyContactPhone || null,
      createdBy,
      // New fields
      addressLine1 || null,
      addressLine2 || null,
      city || null,
      state || null,
      zipCode || null,
      country || 'USA',
      chronicDisease || 'N',
      allergy || 'N'
    ]);
    
    const patientId = patient.insertId;
    console.log(`Patient inserted with ID: ${patientId}`);
    
    // If there's a doctor and reason for visit, create an appointment and visit
    if (doctorId && reasonForVisit) {
      // Create an appointment first
      const [appointment]: any = await db.query(`
        INSERT INTO appointment 
        (AppointmentDateTime, Purpose, Status, PatientID, DoctorID, CreatedBy, QueueNumber)
        VALUES (NOW(), ?, 'scheduled', ?, ?, ?, ?)
      `, [reasonForVisit, patientId, doctorId, createdBy, 'TEMP']);
      
      const appointmentId = appointment.insertId;
      
      // Generate proper queue number
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      // Get max appointment number for today
      const [maxAppointment]: any = await db.query(`
        SELECT 
          CASE 
            WHEN QueueNumber LIKE 'Q-${dateStr}-%' 
            THEN MAX(CAST(SUBSTRING_INDEX(QueueNumber, '-', -1) AS UNSIGNED))
            ELSE 0
          END as maxNumber
        FROM appointment 
        WHERE DATE(AppointmentDateTime) = CURDATE()
      `, []);
      
      const lastNumber = maxAppointment[0].maxNumber || 0;
      const count = lastNumber + 1;
      const queueNumber = `Q-${dateStr}-${count.toString().padStart(3, '0')}`;
      
      // Update appointment with correct queue number
      await db.query(`
        UPDATE appointment 
        SET QueueNumber = ?
        WHERE AppointmentID = ?
      `, [queueNumber, appointmentId]);
      
      // Create patient visit
      const [visit]: any = await db.query(`
        INSERT INTO patient_visit 
        (AppointmentID, PatientID, DoctorID, VisitType, ArrivalTime, 
         CheckInTime, VisitStatus, QueueStatus, QueueNumber, QueuePosition, TriagePriority)
        VALUES (?, ?, ?, 'first-time', NOW(), NOW(), 'checked-in', 'waiting', ?, 1, 'low')
      `, [appointmentId, patientId, doctorId, queueNumber]);
      
      console.log(`Created appointment ${appointmentId} and visit ${visit.insertId} for new patient`);
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Patient registered successfully",
      patientId,
      patientName: name
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("❌ Registration error:", error);
    
    // Log the SQL error details
    if (error.sql) {
      console.error("SQL Error:", error.sql);
      console.error("SQL Message:", error.sqlMessage);
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        error: "Duplicate entry. Patient may already exist."
      });
    }
    
    // Check for missing column errors
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ 
        success: false,
        error: `Database field error: ${error.sqlMessage}. Check your database schema.`
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Registration failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In your receptionist controller (receptionistController.js)
export const registerWalkIn = async (req: Request, res: Response) => {
  const { patientId, doctorId, reason, receptionistId, priority  } = req.body;

  try {
    if (!patientId || !reason || !receptionistId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if patient exists
    const [patientCheck]: any = await db.query(
      'SELECT PatientID FROM Patient WHERE PatientID = ?',
      [patientId]
    );

    if (patientCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Patient not found' 
      });
    }

    // Check if patient already has an ACTIVE visit today
    const today = new Date().toISOString().split('T')[0];
    const [activeVisits]: any = await db.query(`
      SELECT VisitID FROM patient_visit 
      WHERE PatientID = ? 
        AND DATE(ArrivalTime) = ?
        AND QueueStatus IN ('waiting', 'in-progress')
        AND VisitStatus IN ('checked-in', 'in-consultation', 'waiting-for-results', 'ready-for-checkout')
    `, [patientId, today]);

    if (activeVisits.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Patient already has an active visit today and cannot be added again' 
      });
    }

    // If doctor is specified, check if doctor exists
    if (doctorId) {
      const [doctorCheck]: any = await db.query(
        'SELECT UserID FROM useraccount WHERE UserID = ? AND Role = ?',
        [doctorId, 'doctor']
      );

      if (doctorCheck.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Doctor not found' 
        });
      }
    }

    // Get date in local timezone (YYMMDD format)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`; // YYMMDD
    
    console.log('Date calculation:', {
      now: now.toISOString(),
      year,
      month,
      day,
      dateStr
    });

    // Get the MAX queue number for today that matches Q-YYMMDD-XXX pattern from patient_visit
    // Just get the maximum number from today's visits
    const [maxNumberResult]: any = await db.query(`
      SELECT MAX(CAST(SUBSTRING_INDEX(QueueNumber, '-', -1) AS UNSIGNED)) as maxNumber
      FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE()
      AND QueueNumber LIKE 'Q-${dateStr}-%'
    `, []);

    const lastNumber = maxNumberResult[0].maxNumber || 0;
    const count = lastNumber + 1;
    const queueNumber = `Q-${dateStr}-${count.toString().padStart(3, '0')}`;

    console.log('Queue number generation:', {
      dateStr,
      lastNumber,
      count,
      queueNumber
    });
    
    // Get next queue position
    const [maxPosition]: any = await db.query(
      'SELECT MAX(QueuePosition) as maxPos FROM patient_visit WHERE DATE(ArrivalTime) = CURDATE()',
      []
    );
    const queuePosition = (maxPosition[0].maxPos || 0) + 1;

    console.log('Queue position:', queuePosition);

    // Insert into patient_visit (CORRECTED: No ReasonForVisit column, use VisitNotes)
    // In your receptionistController.ts - registerWalkIn function
// Add priority parameter to the SQL query:
// CORRECTED VERSION:
    const [result]: any = await db.query(
      `INSERT INTO patient_visit (
        PatientID, 
        DoctorID, 
        VisitType, 
        ArrivalTime, 
        CheckInTime,
        VisitStatus, 
        QueueStatus,
        VisitNotes, 
        QueueNumber,
        QueuePosition,
        TriagePriority
      ) VALUES (?, ?, 'walk-in', NOW(), NOW(), 'checked-in', 'waiting', ?, ?, ?, ?)`,
      [
        patientId,
        doctorId || null,
        reason,
        queueNumber,
        queuePosition,
        priority || 'low'
      ]
    );

    res.json({
      success: true,
      visitId: result.insertId,
      queueNumber: queueNumber,
      queuePosition: queuePosition
    });

  } catch (error: any) {
    console.error('Walk-in registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register walk-in patient',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const cancelVisit = async (req: Request, res: Response) => {
  const { visitId, reason, cancelledBy } = req.body;

  try {
    const [result]: any = await db.query(
      `UPDATE patient_visit 
       SET 
         VisitStatus = 'cancelled',
         QueueStatus = 'cancelled',
         VisitNotes = CONCAT(COALESCE(VisitNotes, ''), '\nCancelled by ${cancelledBy}: ${reason}')
       WHERE VisitID = ?`,
      [visitId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel visit error:", error);
    res.status(500).json({ error: "Failed to cancel visit" });
  }
};

export const markNoShow = async (req: Request, res: Response) => {
  const { visitId } = req.body;

  try {
    const [result]: any = await db.query(
      `UPDATE patient_visit 
       SET 
         VisitStatus = 'no-show',
         QueueStatus = 'cancelled',
         VisitNotes = CONCAT(COALESCE(VisitNotes, ''), '\nMarked as No Show')
       WHERE VisitID = ?`,
      [visitId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("No show error:", error);
    res.status(500).json({ error: "Failed to mark as no show" });
  }
};

export const searchPatient = async (req: Request, res: Response) => {
  const { search } = req.query;
  
  try {
    console.log('=== SEARCH PATIENT DEBUG v3 ===');
    console.log('Search term:', search);
    
    if (!search || (typeof search === 'string' && search.trim() === '')) {
      return res.json([]);
    }

    const searchTerm = `%${search}%`;
    
    // FIXED: Use local date for comparison
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    console.log('Today (local):', today);
    console.log('Current time:', now.toISOString());
    
    // SIMPLE VERSION: Get patients first, then check visits
    const [patients]: any = await db.query(`
      SELECT 
        PatientID as id, 
        Name, 
        ICNo, 
        PhoneNumber, 
        Email,
        Gender,
        DATE_FORMAT(DOB, '%Y-%m-%d') as DOB,
        BloodType
      FROM Patient 
      WHERE (Name LIKE ? OR ICNo LIKE ? OR PhoneNumber LIKE ?)
      ORDER BY Name
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm]);
    
    console.log(`Found ${patients.length} patients matching search`);
    
    // Check visits for each patient
    const patientsWithVisits = await Promise.all(
      patients.map(async (patient: any) => {
        // Get the LATEST visit for this patient today
        const [visits]: any = await db.query(`
          SELECT 
            VisitID,
            VisitStatus,
            QueueStatus,
            QueueNumber,
            ArrivalTime
          FROM patient_visit 
          WHERE PatientID = ? 
            AND DATE(ArrivalTime) = ?
          ORDER BY VisitID DESC
          LIMIT 1
        `, [patient.id, today]);
        
        const hasVisit = visits.length > 0;
        const visit = hasVisit ? visits[0] : null;
        
        // DEBUG: Log raw data
        console.log(`\nPatient: ${patient.Name} (ID: ${patient.id})`);
        console.log('Has visit today?', hasVisit);
        if (visit) {
          console.log('Latest VisitID:', visit.VisitID);
          console.log('QueueStatus:', visit.QueueStatus);
          console.log('QueueNumber:', visit.QueueNumber);
          console.log('VisitStatus:', visit.VisitStatus);
          console.log('ArrivalTime:', visit.ArrivalTime);
        }
        
        // Determine if active - FIXED: Use both VisitStatus and QueueStatus
        let hasActiveVisit = false;
        if (visit) {
          const queueStatus = visit.QueueStatus ? visit.QueueStatus.trim().toLowerCase() : '';
          const visitStatus = visit.VisitStatus ? visit.VisitStatus.trim().toLowerCase() : '';
          
          console.log('QueueStatus (trimmed, lower):', queueStatus);
          console.log('VisitStatus (trimmed, lower):', visitStatus);
          
          // Active if not completed, cancelled, or no-show
          const completedStatuses = ['completed', 'cancelled', 'no-show'];
          hasActiveVisit = !completedStatuses.includes(queueStatus) && 
                          !completedStatuses.includes(visitStatus);
          console.log('Is active status?', hasActiveVisit);
        }
        
        const canRegister = !hasActiveVisit;
        console.log('Can register?', canRegister);
        
        return {
          ...patient,
          canRegister: canRegister,
          queueInfo: visit ? {
            queueNumber: visit.QueueNumber,
            queueStatus: visit.QueueStatus,
            visitStatus: visit.VisitStatus,
            arrivalTime: visit.ArrivalTime
          } : null,
          queueStatusCategory: !visit ? 'no-visit-today' :
                              hasActiveVisit ? 'active-visit' : 
                              'completed-or-cancelled'
        };
      })
    );
    
    console.log('\n=== FINAL RESULTS ===');
    patientsWithVisits.forEach((p, i) => {
      console.log(`${i + 1}. ${p.Name}: canRegister=${p.canRegister}, queueStatus=${p.queueInfo?.queueStatus || 'none'}, queueNumber=${p.queueInfo?.queueNumber || 'none'}`);
    });
    
    res.json(patientsWithVisits);
    
  } catch (error) {
    console.error("Patient search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

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
      LEFT JOIN appointment a ON p.PatientID = a.PatientID
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

// ============ APPOINTMENT MANAGEMENT ============
export const scheduleAppointment = async (req: Request, res: Response) => {
  const { 
    patientId, 
    doctorId, 
    appointmentDateTime, 
    purpose, 
    notes, 
    createdBy
  } = req.body;
  
  try {
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
    
    // Generate queue number using YYMMDD format
    const now = new Date(appointmentDateTime);
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get max appointment number for that date
    const appointmentDate = new Date(appointmentDateTime).toISOString().split('T')[0];
    const [maxAppointment]: any = await db.query(`
      SELECT 
        CASE 
          WHEN QueueNumber LIKE 'Q-${dateStr}-%' 
          THEN MAX(CAST(SUBSTRING_INDEX(QueueNumber, '-', -1) AS UNSIGNED))
          ELSE 0
        END as maxNumber
      FROM appointment 
      WHERE DATE(AppointmentDateTime) = ?
    `, [appointmentDate]);
    
    const lastNumber = maxAppointment[0].maxNumber || 0;
    const count = lastNumber + 1;
    const queueNumber = `Q-${dateStr}-${count.toString().padStart(3, '0')}`;
    
    // Insert appointment
    const [appointment]: any = await db.query(`
      INSERT INTO appointment 
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
    
    const appointmentId = appointment.insertId;
    
    // Also create a patient_visit record for the appointment
    await db.query(`
      INSERT INTO patient_visit 
      (AppointmentID, PatientID, DoctorID, VisitType, 
       VisitStatus, QueueStatus, QueueNumber, TriagePriority)
      VALUES (?, ?, ?, 'follow-up', 'scheduled', 'waiting', ?, 'low')
    `, [appointmentId, patientId, doctorId, queueNumber]);
    
    await db.query("COMMIT");
    
    res.json({ 
      success: true,
      message: "Appointment scheduled successfully",
      appointmentId,
      queueNumber,
      patientName: patient[0].Name
    });
    
  } catch (error: any) {
    await db.query("ROLLBACK");
    console.error("Schedule appointment error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to schedule appointment"
    });
  }
};

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
        pv.VisitStatus as visitStatus
      FROM appointment a
      JOIN Patient p ON a.PatientID = p.PatientID
      JOIN useraccount u ON a.DoctorID = u.UserID
      LEFT JOIN doctorprofile dp ON u.UserID = dp.DoctorID
      LEFT JOIN patient_visit pv ON a.AppointmentID = pv.AppointmentID
      WHERE a.AppointmentDateTime >= CURDATE()
      ORDER BY a.AppointmentDateTime ASC
    `);
    
    res.json(appointments);
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const { appointmentId, reason } = req.body;
  
  try {
    await db.query("START TRANSACTION");
    
    // Cancel appointment
    await db.query(`
      UPDATE appointment 
      SET Status = 'cancelled', Notes = CONCAT(COALESCE(Notes, ''), '\nCancelled: ', ?)
      WHERE AppointmentID = ?
    `, [reason || 'No reason provided', appointmentId]);
    
    // Also update any related visits
    await db.query(`
      UPDATE patient_visit 
      SET 
        VisitStatus = 'cancelled',
        QueueStatus = 'cancelled',
        VisitNotes = CONCAT(COALESCE(VisitNotes, ''), '\nAppointment cancelled')
      WHERE AppointmentID = ?
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

// ============ WAITING LIST / CHECK-IN ============
export const getTodayVisits = async (req: Request, res: Response) => {
  try {
    const [visits]: any = await db.query(`
      SELECT 
        pv.VisitID,
        pv.QueueNumber,
        pv.QueuePosition,
        pv.VisitStatus,
        pv.QueueStatus,
        pv.ArrivalTime,
        pv.CheckInTime,
        pv.VisitNotes,
        p.Name as patientName,
        p.PhoneNumber,
        u.Name as doctorName,
        pv.DoctorID,
        pv.PatientID,
        pv.VisitType,
        pv.TriagePriority,
        CASE 
          WHEN pv.VisitType = 'walk-in' THEN 'Walk-in'
          WHEN pv.VisitType = 'first-time' THEN 'First Visit'
          WHEN pv.VisitType = 'follow-up' THEN 'Follow-up'
          ELSE pv.VisitType
        END as visitTypeLabel
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE DATE(pv.ArrivalTime) = CURDATE()
        AND pv.QueueStatus NOT IN ('cancelled')
        AND pv.VisitStatus NOT IN ('cancelled', 'no-show')
      ORDER BY 
        CASE pv.QueueStatus 
          WHEN 'in-progress' THEN 1 
          WHEN 'waiting' THEN 2 
          ELSE 3
        END,
        CASE pv.TriagePriority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pv.QueuePosition,
        pv.ArrivalTime
    `);
    
    res.json(visits);
  } catch (error) {
    console.error("Fetch today visits error:", error);
    res.status(500).json({ error: "Failed to fetch today's visits" });
  }
};

export const checkInPatient = async (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  
  try {
    const [appointment]: any = await db.query(`
      SELECT a.*, pv.VisitID 
      FROM appointment a
      LEFT JOIN patient_visit pv ON a.AppointmentID = pv.AppointmentID
      WHERE a.AppointmentID = ?
    `, [appointmentId]);
    
    if (appointment.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Appointment not found" 
      });
    }
    
    await db.query("START TRANSACTION");
    
    // Update appointment status
    await db.query(`
      UPDATE appointment 
      SET Status = 'confirmed'
      WHERE AppointmentID = ?
    `, [appointmentId]);
    
    // Update or create visit record
    const appt = appointment[0];
    if (appt.VisitID) {
      // Update existing visit
      await db.query(`
        UPDATE patient_visit 
        SET 
          CheckInTime = NOW(),
          VisitStatus = 'checked-in',
          QueueStatus = 'waiting'
        WHERE VisitID = ?
      `, [appt.VisitID]);
    } else {
      // Create new visit record
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      // Get queue position
      const [maxPosition]: any = await db.query(
        'SELECT MAX(QueuePosition) as maxPos FROM patient_visit WHERE DATE(ArrivalTime) = CURDATE()',
        []
      );
      const queuePosition = (maxPosition[0].maxPos || 0) + 1;
      
      await db.query(`
        INSERT INTO patient_visit 
        (AppointmentID, PatientID, DoctorID, VisitType, ArrivalTime, 
         CheckInTime, VisitStatus, QueueStatus, QueueNumber, QueuePosition, TriagePriority)
        VALUES (?, ?, ?, 'follow-up', NOW(), NOW(), 'checked-in', 'waiting', ?, ?, 'low')
      `, [appointmentId, appt.PatientID, appt.DoctorID, appt.QueueNumber, queuePosition]);
    }
    
    await db.query("COMMIT");
    
    res.json({
      success: true,
      message: "Patient checked in successfully"
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

export const updateVisitStatus = async (req: Request, res: Response) => {
  const { visitId, status } = req.body;
  
  try {
    // Update both VisitStatus and QueueStatus based on the new status
    let visitStatus = status;
    let queueStatus = 'waiting';
    
    switch (status) {
      case 'checked-in':
        queueStatus = 'waiting';
        break;
      case 'in-consultation':
        queueStatus = 'in-progress';
        break;
      case 'completed':
        queueStatus = 'completed';
        // Also set checkout time
        await db.query(`
          UPDATE patient_visit 
          SET CheckOutTime = NOW()
          WHERE VisitID = ?
        `, [visitId]);
        break;
    }
    
    await db.query(`
      UPDATE patient_visit 
      SET VisitStatus = ?, QueueStatus = ?
      WHERE VisitID = ?
    `, [visitStatus, queueStatus, visitId]);
    
    res.json({
      success: true,
      message: `Visit status updated to ${status}`
    });
    
  } catch (error: any) {
    console.error("Update visit status error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update visit status"
    });
  }
};

// ============ BILLING MANAGEMENT ============
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
      FROM billing b
      JOIN Patient p ON b.PatientID = p.PatientID
      JOIN useraccount u ON b.HandledBy = u.UserID
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
    
    const [billing]: any = await db.query(`
      SELECT TotalAmount, AmountPaid FROM billing WHERE BillID = ?
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
      UPDATE billing 
      SET Status = ?, AmountPaid = ?, PaymentDate = CURDATE()
      WHERE BillID = ?
    `, [newStatus, newPaid, billId]);
    
    // Create payment record
    await db.query(`
      INSERT INTO payment 
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

// ============ DOCTOR MANAGEMENT ============
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const [doctors]: any = await db.query(`
      SELECT 
        u.UserID as id, 
        u.Name, 
        dp.Specialization,
        dp.ClinicRoom
      FROM useraccount u
      LEFT JOIN doctorprofile dp ON u.UserID = dp.DoctorID
      WHERE u.Role = 'doctor' AND u.Status = 'Active'
      ORDER BY u.Name
    `);
    
    res.json(doctors);
  } catch (error) {
    console.error("Doctors error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ DASHBOARD & PROFILE ============
export const getReceptionistProfile = async (req: Request, res: Response) => {
  const { receptionistId } = req.params;
  
  try {
    const [receptionist]: any = await db.query(`
      SELECT UserID as userId, Name, Email, PhoneNum as phone, Role, Status
      FROM useraccount 
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

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [todayAppointments]: any = await db.query(`
      SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN Status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN Status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
      FROM appointment 
      WHERE DATE(AppointmentDateTime) = CURDATE()
    `);
    
    const [todayVisits]: any = await db.query(`
      SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN VisitStatus = 'checked-in' THEN 1 ELSE 0 END) as checkedIn,
        SUM(CASE WHEN VisitStatus = 'in-consultation' THEN 1 ELSE 0 END) as inConsultation
      FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE()
        AND VisitStatus NOT IN ('cancelled', 'no-show')
    `);
    
    const [waitingPatients]: any = await db.query(`
      SELECT COUNT(*) as count FROM patient_visit 
      WHERE DATE(ArrivalTime) = CURDATE() 
        AND QueueStatus = 'waiting'
        AND VisitStatus = 'checked-in'
    `);
    
    const [pendingPayments]: any = await db.query(`
      SELECT COUNT(*) as count FROM billing 
      WHERE Status IN ('pending', 'partial')
        AND BillingDate = CURDATE()
    `);
    
    res.json({
      success: true,
      stats: {
        todayAppointments: todayAppointments[0].count,
        scheduledAppointments: todayAppointments[0].scheduled,
        confirmedAppointments: todayAppointments[0].confirmed,
        todayVisits: todayVisits[0].count,
        checkedInPatients: todayVisits[0].checkedIn,
        inConsultationPatients: todayVisits[0].inConsultation,
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

// receptionistController.ts
export const callPatientToBilling = async (req: Request, res: Response) => {
  const { visitId } = req.body;

  if (!visitId) {
    return res.status(400).json({ 
      success: false,
      error: "Missing visitId" 
    });
  }

  try {
    await db.query('START TRANSACTION');
    
    // Update QueueStatus from 'waiting' to 'in-progress'
    const [result]: any = await db.query(`
      UPDATE patient_visit 
      SET 
        QueueStatus = 'in-progress',
        CalledTime = NOW(),
        UpdatedAt = NOW()
      WHERE VisitID = ? 
        AND VisitStatus = 'to-be-billed'
        AND QueueStatus = 'waiting'
    `, [visitId]);

    if (result.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: "Visit not found or not in correct status" 
      });
    }

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Patient called to billing",
      visitId: visitId,
      newQueueStatus: 'in-progress'
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Call patient to billing error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to call patient to billing"
    });
  }
};

// receptionistController.ts
export const goToBilling = async (req: Request, res: Response) => {
  const { visitId } = req.body;

  if (!visitId) {
    return res.status(400).json({ 
      success: false,
      error: "Missing visitId" 
    });
  }

  try {
    await db.query('START TRANSACTION');
    
    // Update VisitStatus to something like 'payment-processing' or keep as 'to-be-billed'
    const [result]: any = await db.query(`
      UPDATE patient_visit 
      SET 
        VisitStatus = 'in-payment',  // You might want to add this to your ENUM
        UpdatedAt = NOW()
      WHERE VisitID = ? 
        AND VisitStatus = 'to-be-billed'
        AND QueueStatus = 'in-progress'
    `, [visitId]);

    if (result.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: "Visit not found or not in correct status" 
      });
    }

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Patient at billing counter",
      visitId: visitId,
      newVisitStatus: 'in-payment'
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Go to billing error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update billing status"
    });
  }
};