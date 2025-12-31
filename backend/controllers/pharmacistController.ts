import { Request, Response } from "express";
import { db } from "../db";

export const getDrugs = async (req: Request, res: Response) => {
  try {
    const [drugs]: any = await db.query("SELECT * FROM drug WHERE IsActive = 1");
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * FIXED: Fetch prescriptions with Aliases for the Pharmacy Queue
 * Logic: Joins patient and doctor names to avoid blank cards
 */
export const getPendingPrescriptions = async (req: Request, res: Response) => {
  try {
    const [list]: any = await db.query(`
      SELECT 
        p.PrescriptionID AS id,
        pi.ItemID,
        pat.Name AS patient,
        u.Name AS doctor,
        d.DrugName AS medication,
        pi.Quantity AS quantity,
        pi.Status AS status
      FROM prescriptionitem pi
      JOIN drug d ON pi.DrugID = d.DrugID
      JOIN prescription p ON pi.PrescriptionID = p.PrescriptionID
      JOIN patient pat ON p.PatientID = pat.PatientID
      JOIN useraccount u ON p.DoctorID = u.UserID
      WHERE pi.Status = 'Pending'
    `);
    res.json(list);
  } catch (error) {
    console.error("Queue Fetch Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const dispenseMedication = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  try {
    await db.query("START TRANSACTION");
    await db.query("UPDATE prescriptionitem SET Status = 'Dispensed' WHERE ItemID = ?", [itemId]);
    await db.query(`
      UPDATE drug d 
      JOIN prescriptionitem pi ON d.DrugID = pi.DrugID 
      SET d.QuantityInStock = d.QuantityInStock - pi.Quantity 
      WHERE pi.ItemID = ?
    `, [itemId]);
    await db.query("COMMIT");
    res.json({ success: true });
  } catch (error) {
    await db.query("ROLLBACK");
    res.status(500).json({ success: false });
  }
};