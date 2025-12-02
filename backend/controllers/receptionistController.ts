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
    
    // Create visit record - FIXED: patient_visit table doesn't exist!
    // Check what table you actually have for visits
    try {
      // Try to insert into waitingroom table (based on your schema)
      if (doctorId) {
        // First create an appointment
        const [appointment]: any = await db.query(`
          INSERT INTO Appointment 
          (AppointmentDateTime, Purpose, Status, PatientID, DoctorID, CreatedBy, Priority)
          VALUES (NOW(), ?, 'scheduled', ?, ?, ?, 'normal')
        `, [reasonForVisit || 'First consultation', patientId, doctorId, createdBy]);
        
        // Then create waiting room entry
        await db.query(`
          INSERT INTO WaitingRoom 
          (AppointmentID, CheckInTime, Status, Priority)
          VALUES (?, NOW(), 'waiting', 'normal')
        `, [appointment.insertId]);
      }
      
      // OR create a walk-in record
      const [walkIn]: any = await db.query(`
        INSERT INTO WalkInPatient 
        (PatientName, PhoneNumber, ReasonForVisit, ArrivalTime, Status, CreatedBy)
        VALUES (?, ?, ?, NOW(), 'waiting', ?)
      `, [name, phoneNumber, reasonForVisit || 'First consultation', createdBy]);
      
    } catch (visitError) {
      console.log("Visit record creation skipped:", visitError.message);
      // Don't fail the whole registration if visit record fails
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
export const registerWalkIn = async (req, res) => {
  const { patientId, doctorId, reason, receptionistId } = req.body;

  try {
    // Validate inputs
    if (!patientId || !reason || !receptionistId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if patient exists
    const [patientCheck]: any = await db.query(
      'SELECT PatientID FROM Patient WHERE PatientID = ?',
      [patientId]
    );

    if (patientCheck.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // If doctor is specified, check if doctor exists
    if (doctorId) {
      const [doctorCheck]: any = await db.query(
        'SELECT UserID FROM useraccount WHERE UserID = ? AND Role = ?',
        [doctorId, 'doctor']
      );

      if (doctorCheck.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
    }

    // Get today's date for queue generation
    const today = new Date().toISOString().split('T')[0];
    
    // Generate queue number (format: Q-YYMMDD-XXX)
    const [dailyCount]: any = await db.query(
      'SELECT COUNT(*) as count FROM patient_visit WHERE DATE(ArrivalTime) = ?',
      [today]
    );
    
    const count = dailyCount[0].count + 1;
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const queueNumber = `Q-${dateStr}-${count.toString().padStart(3, '0')}`;
    
    // Get next queue position
    const [maxPosition]: any = await db.query(
      'SELECT MAX(QueuePosition) as maxPos FROM patient_visit WHERE DATE(ArrivalTime) = ?',
      [today]
    );
    const queuePosition = (maxPosition[0].maxPos || 0) + 1;

    // Insert into patient_visit
    const [result]: any = await db.query(
      `INSERT INTO patient_visit (
        PatientID, 
        DoctorID, 
        VisitType, 
        ArrivalTime, 
        CheckInTime,
        VisitStatus, 
        QueueStatus,
        ReasonForVisit, 
        QueueNumber,
        QueuePosition
      ) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?)`,
      [
        patientId,
        doctorId || null,
        'walk-in',
        'checked-in',
        'waiting',
        reason,
        queueNumber,
        queuePosition
      ]
    );

    // Also create an appointment record for the walk-in
    if (doctorId) {
      await db.query(
        `INSERT INTO appointment (
          AppointmentDateTime,
          Purpose,
          Status,
          PatientID,
          DoctorID,
          CreatedBy,
          QueueNumber
        ) VALUES (NOW(), ?, ?, ?, ?, ?, ?)`,
        [
          reason,
          'confirmed',
          patientId,
          doctorId,
          receptionistId,
          queueNumber
        ]
      );
    }

    res.json({
      success: true,
      visitId: result.insertId,
      queueNumber: queueNumber,
      queuePosition: queuePosition
    });

  } catch (error) {
    console.error('Walk-in registration error:', error);
    res.status(500).json({ error: 'Failed to register walk-in patient' });
  }
};

export const searchPatient = async (req, res) => {
  const { search } = req.query;
  
  try {
    // If search is empty or undefined, return empty array
    if (!search || search.trim() === '') {
      return res.json([]);
    }

    const searchTerm = `%${search}%`;
    
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
      WHERE Name LIKE ? OR ICNo LIKE ? OR PhoneNumber LIKE ?
      ORDER BY Name
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm]);
    
    res.json(patients);
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
    
    // Generate queue number
    const appointmentDate = new Date(appointmentDateTime).toISOString().split('T')[0];
    const [doctorQueue]: any = await db.query(`
      SELECT COUNT(*) as count 
      FROM Appointment 
      WHERE DoctorID = ? AND DATE(AppointmentDateTime) = ?
    `, [doctorId, appointmentDate]);
    
    const queueNumber = `Q${(doctorQueue[0].count + 1).toString().padStart(3, '0')}`;
    
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
        DATE_FORMAT(a.AppointmentDateTime, '%h:%i %p') as time
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

// ============ WAITING LIST / CHECK-IN ============
// controllers/receptionistController.ts - Update getTodayVisits function
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
        pv.ReasonForVisit,
        p.Name as patientName,
        u.Name as doctorName,
        pv.DoctorID,
        pv.PatientID,
        pv.VisitType,
        CONCAT('walk-in') as visitTypeLabel
      FROM patient_visit pv
      JOIN patient p ON pv.PatientID = p.PatientID
      LEFT JOIN useraccount u ON pv.DoctorID = u.UserID
      WHERE DATE(pv.ArrivalTime) = CURDATE()
        AND pv.QueueStatus NOT IN ('completed', 'cancelled')
      ORDER BY 
        CASE pv.QueueStatus 
          WHEN 'in-progress' THEN 1 
          WHEN 'waiting' THEN 2 
          ELSE 3 
        END,
        pv.QueuePosition
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
      UPDATE Appointment 
      SET Status = 'confirmed', CheckInTime = NOW()
      WHERE AppointmentID = ?
    `, [appointmentId]);
    
    if (appointment.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Appointment not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Patient checked in successfully"
    });
    
  } catch (error: any) {
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
    let updateQuery = '';
    
    switch (status) {
      case 'checked-in':
        updateQuery = `CheckInTime = NOW()`;
        break;
      case 'in-consultation':
        updateQuery = `ConsultationStartTime = NOW()`;
        break;
      case 'completed':
        updateQuery = `ConsultationEndTime = NOW()`;
        break;
    }
    
    if (updateQuery) {
      await db.query(`
        UPDATE patient_visit 
        SET ${updateQuery}, VisitStatus = ?
        WHERE VisitID = ?
      `, [status, visitId]);
    }
    
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
      SELECT TotalAmount, AmountPaid FROM Billing WHERE BillID = ?
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

// ============ DOCTOR MANAGEMENT ============
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

// ============ DASHBOARD & PROFILE ============
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