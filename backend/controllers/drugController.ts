// backend/controllers/drugController.ts
import { Request, Response } from "express";
import { db } from "../db";

// Get all drugs with optional search
export const getDrugs = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        DrugID,
        DrugName,
        Category,
        UnitPrice,
        QuantityInStock,
        ExpiryDate,
        Location,
        Supplier,
        BatchNumber,
        MinStockLevel,
        IsActive
      FROM drug 
      WHERE IsActive = 1
    `;
    
    const params: any[] = [];
    
    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (
        DrugName LIKE ? OR 
        Category LIKE ? OR 
        Location LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` ORDER BY DrugName ASC LIMIT 100`;
    
    const [rows] = await db.query(query, params);
    
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch medications',
      details: error.message 
    });
  }
};

// Get drug by ID
export const getDrugById = async (req: Request, res: Response) => {
  try {
    const drugId = req.params.id;
    
    const query = `
      SELECT 
        DrugID,
        DrugName,
        Category,
        UnitPrice,
        QuantityInStock,
        ExpiryDate,
        Location,
        Supplier,
        BatchNumber,
        MinStockLevel,
        IsActive
      FROM drug 
      WHERE DrugID = ? AND IsActive = 1
    `;
    
    const [rows] = await db.query(query, [drugId]);
    
    if (Array.isArray(rows) && rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Drug not found' });
    }
  } catch (error: any) {
    console.error('Error fetching drug:', error);
    res.status(500).json({ 
      error: 'Failed to fetch drug details',
      details: error.message 
    });
  }
};

// Search drugs with advanced filters
export const searchDrugs = async (req: Request, res: Response) => {
  try {
    const { 
      q, // search query
      category,
      minStock,
      maxStock,
      expiresWithin,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    let query = `
      SELECT 
        DrugID,
        DrugName,
        Category,
        UnitPrice,
        QuantityInStock,
        ExpiryDate,
        Location,
        Supplier,
        BatchNumber,
        MinStockLevel,
        IsActive,
        CASE 
          WHEN QuantityInStock <= MinStockLevel * 0.2 THEN 'critical'
          WHEN QuantityInStock <= MinStockLevel * 0.5 THEN 'low'
          ELSE 'adequate'
        END as StockStatus,
        DATEDIFF(ExpiryDate, CURDATE()) as DaysUntilExpiry
      FROM drug 
      WHERE IsActive = 1
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Search by name or category
    if (q && typeof q === 'string' && q.trim() !== '') {
      conditions.push(`(DrugName LIKE ? OR Category LIKE ? OR Supplier LIKE ?)`);
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Filter by category
    if (category && typeof category === 'string') {
      conditions.push(`Category = ?`);
      params.push(category);
    }
    
    // Filter by minimum stock
    if (minStock && !isNaN(Number(minStock))) {
      conditions.push(`QuantityInStock >= ?`);
      params.push(Number(minStock));
    }
    
    // Filter by maximum stock
    if (maxStock && !isNaN(Number(maxStock))) {
      conditions.push(`QuantityInStock <= ?`);
      params.push(Number(maxStock));
    }
    
    // Filter by expiration date
    if (expiresWithin && !isNaN(Number(expiresWithin))) {
      conditions.push(`ExpiryDate IS NOT NULL AND DATEDIFF(ExpiryDate, CURDATE()) <= ?`);
      params.push(Number(expiresWithin));
    }
    
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }
    
    // Sorting
    let orderBy = 'ORDER BY ';
    switch (sortBy) {
      case 'name':
        orderBy += 'DrugName';
        break;
      case 'category':
        orderBy += 'Category, DrugName';
        break;
      case 'stock':
        orderBy += 'QuantityInStock';
        break;
      case 'expiry':
        orderBy += 'ExpiryDate';
        break;
      default:
        orderBy += 'DrugName';
    }
    
    orderBy += ` ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    query += ` ${orderBy} LIMIT 200`;
    
    const [rows] = await db.query(query, params);
    
    // Get distinct categories for filter suggestions
    const [categories] = await db.query(`
      SELECT DISTINCT Category 
      FROM drug 
      WHERE Category IS NOT NULL AND Category != '' 
      ORDER BY Category
    `);
    
    res.json({
      drugs: rows,
      filters: {
        categories,
        total: Array.isArray(rows) ? rows.length : 0
      }
    });
  } catch (error: any) {
    console.error('Error searching drugs:', error);
    res.status(500).json({ 
      error: 'Failed to search medications',
      details: error.message 
    });
  }
};

// Get drug categories
export const getDrugCategories = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT Category 
      FROM drug 
      WHERE Category IS NOT NULL AND Category != '' AND IsActive = 1
      ORDER BY Category
    `;
    
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
};

// Check drug stock availability
export const checkDrugStock = async (req: Request, res: Response) => {
  try {
    const drugId = req.params.id;
    const { quantity = 1 } = req.query;
    
    const query = `
      SELECT 
        DrugID,
        DrugName,
        QuantityInStock,
        UnitPrice,
        MinStockLevel,
        CASE 
          WHEN QuantityInStock >= ? THEN 'available'
          WHEN QuantityInStock > 0 THEN 'low-stock'
          ELSE 'out-of-stock'
        END as Availability
      FROM drug 
      WHERE DrugID = ? AND IsActive = 1
    `;
    
    const [rows] = await db.query(query, [quantity, drugId]);
    
    if (Array.isArray(rows) && rows.length > 0) {
      const drug = rows[0] as any;
      res.json({
        available: drug.QuantityInStock >= Number(quantity),
        availableQuantity: drug.QuantityInStock,
        requestedQuantity: Number(quantity),
        unitPrice: drug.UnitPrice,
        totalPrice: drug.UnitPrice * Number(quantity),
        availability: drug.Availability,
        message: drug.QuantityInStock >= Number(quantity) 
          ? `Stock available (${drug.QuantityInStock} units)`
          : `Only ${drug.QuantityInStock} units available`
      });
    } else {
      res.status(404).json({ 
        available: false, 
        message: 'Drug not found or inactive' 
      });
    }
  } catch (error: any) {
    console.error('Error checking stock:', error);
    res.status(500).json({ 
      error: 'Failed to check stock',
      details: error.message 
    });
  }
};

// Save prescription
export const savePrescription = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, consultationId, items } = req.body;
    
    if (!patientId || !doctorId || !consultationId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert prescription
      const [prescriptionResult] = await connection.query(
        `INSERT INTO prescription (PrescribedDate, DoctorID, PatientID, ConsultationID, VisitID) 
         VALUES (CURDATE(), ?, ?, ?, 
           (SELECT VisitID FROM consultation WHERE ConsultationID = ? LIMIT 1))`,
        [doctorId, patientId, consultationId, consultationId]
      );
      
      const prescriptionId = (prescriptionResult as any).insertId;
      
      // Insert prescription items
      for (const item of items) {
        await connection.query(
          `INSERT INTO prescriptionitem (PrescriptionID, DrugID, Dosage, Frequency, Duration, Quantity) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [prescriptionId, item.DrugID, item.Dosage, item.Frequency, item.Duration, item.Quantity || 1]
        );
        
        // Update drug stock
        await connection.query(
          `UPDATE drug SET QuantityInStock = QuantityInStock - ? WHERE DrugID = ?`,
          [item.Quantity || 1, item.DrugID]
        );
      }
      
      await connection.commit();
      
      res.json({ 
        success: true, 
        prescriptionId,
        message: 'Prescription saved successfully' 
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error: any) {
    console.error('Error saving prescription:', error);
    res.status(500).json({ 
      error: 'Failed to save prescription',
      details: error.message 
    });
  }
};

// Get patient prescriptions
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    
    const query = `
      SELECT 
        p.PrescriptionID,
        p.PrescribedDate,
        p.ConsultationID,
        d.Name as DoctorName,
        pi.DrugID,
        drug.DrugName,
        pi.Dosage,
        pi.Frequency,
        pi.Duration,
        pi.Quantity,
        c.Diagnosis
      FROM prescription p
      JOIN useraccount d ON p.DoctorID = d.UserID
      JOIN prescriptionitem pi ON p.PrescriptionID = pi.PrescriptionID
      JOIN drug ON pi.DrugID = drug.DrugID
      LEFT JOIN consultation c ON p.ConsultationID = c.ConsultationID
      WHERE p.PatientID = ?
      ORDER BY p.PrescribedDate DESC
    `;
    
    const [rows] = await db.query(query, [patientId]);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

