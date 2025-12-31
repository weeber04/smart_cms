// controllers/analyticsController.ts
import { Request, Response } from "express";
import { db } from "../db";

// Get analytics metrics
export const getAnalyticsMetrics = async (req: Request, res: Response) => {
  try {
    console.log("📈 Fetching analytics metrics...");
    
    // Get total patients
    const [patientsResult]: any = await db.query(
      "SELECT COUNT(*) as total FROM patient"
    );
    const totalPatients = patientsResult[0]?.total || 0;
    
    // Get total appointments (last 30 days)
    const [appointmentsResult]: any = await db.query(
      `SELECT COUNT(*) as total FROM appointment 
       WHERE AppointmentDateTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND Status NOT IN ('cancelled', 'no-show')`
    );
    const appointments = appointmentsResult[0]?.total || 0;
    
    // Get total revenue (last 30 days) - using billing table
    const [revenueResult]: any = await db.query(
      `SELECT COALESCE(SUM(TotalAmount), 0) as total FROM billing 
       WHERE BillingDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND Status = 'paid'`
    );
    const revenue = revenueResult[0]?.total || 0;
    
    // Get average wait time (from patient_visit)
    const [waitTimeResult]: any = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, CheckInTime, CalledTime)) as avgWait
       FROM patient_visit 
       WHERE CheckInTime IS NOT NULL 
       AND CalledTime IS NOT NULL
       AND ArrivalTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const avgWaitTime = Math.round(waitTimeResult[0]?.avgWait || 0);
    
    res.json({
      success: true,
      totalPatients,
      appointments,
      revenue: parseFloat(revenue),
      avgWaitTime
    });
    
  } catch (error: any) {
    console.error("❌ Analytics metrics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics metrics"
    });
  }
};

// Get monthly trends data
export const getMonthlyTrends = async (req: Request, res: Response) => {
  try {
    console.log("📊 Fetching monthly trends...");
    
    // Get patient registrations by month
    const [patientTrends]: any = await db.query(`
      SELECT 
        DATE_FORMAT(RegistrationDate, '%b') as month,
        COUNT(*) as patients,
        MONTH(RegistrationDate) as month_num,
        YEAR(RegistrationDate) as year
      FROM patient
      WHERE RegistrationDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(RegistrationDate), MONTH(RegistrationDate), DATE_FORMAT(RegistrationDate, '%b')
      ORDER BY YEAR(RegistrationDate) ASC, MONTH(RegistrationDate) ASC
      LIMIT 6
    `);
    
    // Get appointments by month
    const [appointmentTrends]: any = await db.query(`
      SELECT 
        DATE_FORMAT(AppointmentDateTime, '%b') as month,
        COUNT(*) as appointments,
        MONTH(AppointmentDateTime) as month_num,
        YEAR(AppointmentDateTime) as year
      FROM appointment
      WHERE AppointmentDateTime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND Status NOT IN ('cancelled', 'no-show')
      GROUP BY YEAR(AppointmentDateTime), MONTH(AppointmentDateTime), DATE_FORMAT(AppointmentDateTime, '%b')
      ORDER BY YEAR(AppointmentDateTime) ASC, MONTH(AppointmentDateTime) ASC
      LIMIT 6
    `);
    
    // Get revenue by month
    const [revenueTrends]: any = await db.query(`
      SELECT 
        DATE_FORMAT(BillingDate, '%b') as month,
        COALESCE(SUM(TotalAmount), 0) as revenue,
        MONTH(BillingDate) as month_num,
        YEAR(BillingDate) as year
      FROM billing
      WHERE BillingDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND Status = 'paid'
      GROUP BY YEAR(BillingDate), MONTH(BillingDate), DATE_FORMAT(BillingDate, '%b')
      ORDER BY YEAR(BillingDate) ASC, MONTH(BillingDate) ASC
      LIMIT 6
    `);
    
    // Create a map of month data
    const monthMap = new Map();
    
    // Process patient trends
    patientTrends.forEach((trend: any) => {
      const key = `${trend.year}-${trend.month_num}`;
      monthMap.set(key, {
        month: trend.month,
        patients: trend.patients,
        appointments: 0,
        revenue: 0
      });
    });
    
    // Process appointment trends
    appointmentTrends.forEach((trend: any) => {
      const key = `${trend.year}-${trend.month_num}`;
      if (monthMap.has(key)) {
        monthMap.get(key).appointments = trend.appointments;
      } else {
        monthMap.set(key, {
          month: trend.month,
          patients: 0,
          appointments: trend.appointments,
          revenue: 0
        });
      }
    });
    
    // Process revenue trends
    revenueTrends.forEach((trend: any) => {
      const key = `${trend.year}-${trend.month_num}`;
      if (monthMap.has(key)) {
        monthMap.get(key).revenue = parseFloat(trend.revenue);
      } else {
        monthMap.set(key, {
          month: trend.month,
          patients: 0,
          appointments: 0,
          revenue: parseFloat(trend.revenue)
        });
      }
    });
    
    // Convert map to array and sort by date
    const monthsData = Array.from(monthMap.values())
      .sort((a, b) => {
        const monthOrder = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });
    
    res.json(monthsData);
    
  } catch (error: any) {
    console.error("❌ Monthly trends error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch monthly trends",
      data: []
    });
  }
};

// Get weekly appointments
export const getWeeklyAppointments = async (req: Request, res: Response) => {
  try {
    console.log("📅 Fetching weekly appointments...");
    
    const [weekly]: any = await db.query(`
      SELECT 
        DAYNAME(AppointmentDateTime) as day,
        COUNT(*) as count
      FROM appointment
      WHERE AppointmentDateTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND Status NOT IN ('cancelled', 'no-show')
      GROUP BY DAYOFWEEK(AppointmentDateTime), DAYNAME(AppointmentDateTime)
      ORDER BY DAYOFWEEK(AppointmentDateTime)
    `);
    
    // Define order of days
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create map with all days initialized to 0
    const result = dayOrder.map(day => {
      const found = weekly.find((w: any) => w.day === day);
      return {
        day: day.substring(0, 3),
        count: found ? found.count : 0
      };
    });
    
    res.json(result);
    
  } catch (error: any) {
    console.error("❌ Weekly appointments error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch weekly appointments",
      data: []
    });
  }
};

// Get department distribution
export const getDepartmentDistribution = async (req: Request, res: Response) => {
  try {
    console.log("🏥 Fetching department distribution...");
    
    const [departments]: any = await db.query(`
      SELECT 
        COALESCE(dp.Specialization, 'General Medicine') as name,
        COUNT(DISTINCT pv.PatientID) as value
      FROM patient_visit pv
      LEFT JOIN appointment a ON pv.AppointmentID = a.AppointmentID
      LEFT JOIN doctorprofile dp ON a.DoctorID = dp.DoctorID
      WHERE pv.ArrivalTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY dp.Specialization
      ORDER BY value DESC
      LIMIT 6
    `);
    
    // If we have data, format it
    if (departments.length > 0) {
      res.json(departments);
    } else {
      // Try alternative query for doctor appointments
      const [altDepartments]: any = await db.query(`
        SELECT 
          COALESCE(dp.Specialization, 'General Medicine') as name,
          COUNT(*) as value
        FROM appointment a
        LEFT JOIN doctorprofile dp ON a.DoctorID = dp.DoctorID
        WHERE a.AppointmentDateTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND a.Status NOT IN ('cancelled', 'no-show')
        GROUP BY dp.Specialization
        ORDER BY value DESC
        LIMIT 6
      `);
      
      res.json(altDepartments);
    }
    
  } catch (error: any) {
    console.error("❌ Department distribution error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch department distribution",
      data: []
    });
  }
};

// Get revenue trend
export const getRevenueTrend = async (req: Request, res: Response) => {
  try {
    console.log("💰 Fetching revenue trend...");
    
    const [revenue]: any = await db.query(`
      SELECT 
        DATE_FORMAT(BillingDate, '%b') as month,
        COALESCE(SUM(TotalAmount), 0) as revenue,
        MONTH(BillingDate) as month_num,
        YEAR(BillingDate) as year
      FROM billing
      WHERE BillingDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND Status = 'paid'
      GROUP BY YEAR(BillingDate), MONTH(BillingDate), DATE_FORMAT(BillingDate, '%b')
      ORDER BY YEAR(BillingDate) ASC, MONTH(BillingDate) ASC
      LIMIT 6
    `);
    
    // Format the response
    const formattedRevenue = revenue.map((item: any) => ({
      month: item.month,
      revenue: parseFloat(item.revenue)
    }));
    
    res.json(formattedRevenue);
    
  } catch (error: any) {
    console.error("❌ Revenue trend error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue trend",
      data: []
    });
  }
};

// Get doctor performance metrics
export const getDoctorPerformance = async (req: Request, res: Response) => {
  try {
    console.log("👨‍⚕️ Fetching doctor performance...");
    
    const [performance]: any = await db.query(`
      SELECT 
        u.Name as doctorName,
        dp.Specialization,
        COUNT(DISTINCT a.AppointmentID) as appointments,
        COUNT(DISTINCT c.ConsultationID) as consultations,
        COALESCE(AVG(TIMESTAMPDIFF(MINUTE, pv.CheckInTime, pv.CheckOutTime)), 0) as avgConsultationTime
      FROM useraccount u
      INNER JOIN doctorprofile dp ON u.UserID = dp.DoctorID
      LEFT JOIN appointment a ON u.UserID = a.DoctorID 
        AND a.AppointmentDateTime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND a.Status NOT IN ('cancelled', 'no-show')
      LEFT JOIN patient_visit pv ON a.AppointmentID = pv.AppointmentID
      LEFT JOIN consultation c ON pv.VisitID = c.VisitID
      WHERE u.Role = 'doctor'
      GROUP BY u.UserID, u.Name, dp.Specialization
      ORDER BY appointments DESC
      LIMIT 10
    `);
    
    res.json(performance);
    
  } catch (error: any) {
    console.error("❌ Doctor performance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch doctor performance",
      data: []
    });
  }
};

// Get patient demographics
export const getPatientDemographics = async (req: Request, res: Response) => {
  try {
    console.log("👥 Fetching patient demographics...");
    
    // Age groups
    const [ageGroups]: any = await db.query(`
      SELECT 
        CASE
          WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) < 18 THEN '0-17'
          WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
          WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 31 AND 50 THEN '31-50'
          WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) > 50 THEN '51+'
          ELSE 'Unknown'
        END as ageGroup,
        COUNT(*) as count
      FROM patient
      WHERE DOB IS NOT NULL
      GROUP BY ageGroup
      ORDER BY 
        CASE ageGroup
          WHEN '0-17' THEN 1
          WHEN '18-30' THEN 2
          WHEN '31-50' THEN 3
          WHEN '51+' THEN 4
          ELSE 5
        END
    `);
    
    // Gender distribution
    const [genderDistribution]: any = await db.query(`
      SELECT 
        Gender,
        COUNT(*) as count
      FROM patient
      WHERE Gender IN ('M', 'F')
      GROUP BY Gender
    `);
    
    // Blood type distribution
    const [bloodTypeDistribution]: any = await db.query(`
      SELECT 
        COALESCE(BloodType, 'Unknown') as bloodType,
        COUNT(*) as count
      FROM patient
      GROUP BY BloodType
      ORDER BY count DESC
    `);
    
    res.json({
      ageGroups,
      genderDistribution,
      bloodTypeDistribution
    });
    
  } catch (error: any) {
    console.error("❌ Patient demographics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient demographics",
      data: {}
    });
  }
};