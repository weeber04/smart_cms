// components/doctor/PrescriptionSubTab.tsx - UPDATED
import { useState, useEffect } from 'react';
import { 
  Pill, Plus, Search, Trash2, Printer, 
  AlertCircle, CheckCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';

interface Drug {
  DrugID: number;
  DrugName: string;
  Category: string;
  UnitPrice: number;
  QuantityInStock: number;
  ExpiryDate: string;
}

interface PrescriptionItem {
  DrugID: number;
  DrugName: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Instructions: string;
  Quantity: number;
  UnitPrice: number;
  TotalAmount: number;
}

interface PrescriptionSubTabProps {
  selectedPatient: any;
  consultationData: any;
  prescriptionItems: PrescriptionItem[];
  onPrescriptionItemsChange: (items: PrescriptionItem[]) => void;
}

export function PrescriptionSubTab({ 
  selectedPatient, 
  consultationData,
  prescriptionItems,
  onPrescriptionItemsChange 
}: PrescriptionSubTabProps) {

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showConfirmPrint, setShowConfirmPrint] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllDrugs, setShowAllDrugs] = useState(false);
  
  const [newDrug, setNewDrug] = useState({
    DrugID: 0,
    Dosage: '',
    Frequency: 'once daily',
    Duration: '7 days',
    Instructions: '',
    Quantity: 1
  });

  useEffect(() => {
    if (selectedPatient) {
      fetchDrugs();
    }
  }, [selectedPatient]);

  // Add this useEffect to check localStorage
useEffect(() => {
  console.log('Checking localStorage for userId:');
  console.log('userId:', localStorage.getItem('userId'));
  console.log('userID:', localStorage.getItem('userID'));
  console.log('doctorId:', localStorage.getItem('doctorId'));
  
  // Check all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}: ${localStorage.getItem(key!)}`);
  }
}, []);

  const fetchDrugs = async (searchQuery = '') => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      
      // Build URL with search parameter
      const url = searchQuery 
        ? `http://localhost:3001/api/doctor/drugs/search?q=${encodeURIComponent(searchQuery)}`
        : 'http://localhost:3001/api/doctor/drugs';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const drugs = data.drugs || data;
        setDrugs(drugs);
      } else {
        toast.error('Failed to fetch drugs');
      }
    } catch (error) {
      console.error('Error fetching drugs:', error);
      toast.error('Error loading medications');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Clear selection when searching
    if (term && selectedDrug) {
      setSelectedDrug(null);
      setNewDrug(prev => ({ ...prev, DrugID: 0 }));
    }
    
    // Fetch drugs with search term
    fetchDrugs(term);
  };

  // Get filtered drugs based on search term
  const filteredDrugs = searchTerm 
    ? drugs.filter(drug =>
        drug.DrugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.Category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : drugs;

  // Show limited number of drugs when not searching
  const displayDrugs = searchTerm 
    ? filteredDrugs 
    : showAllDrugs 
      ? filteredDrugs.slice(0, 20) // Show 20 when expanded
      : filteredDrugs.slice(0, 5); // Show only 5 initially

  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setNewDrug(prev => ({
      ...prev,
      DrugID: drug.DrugID
    }));
    setSearchTerm(drug.DrugName); // Show selected drug in search box
  };

  const handleAddDrug = () => {
    if (!selectedDrug) {
      toast.error('Please select a medication');
      return;
    }
    
    if (!newDrug.Dosage.trim()) {
      toast.error('Please enter dosage');
      return;
    }
    
    if (selectedDrug.QuantityInStock < newDrug.Quantity) {
      toast.error(`Insufficient stock. Only ${selectedDrug.QuantityInStock} available.`);
      return;
    }
    
    const newItem: PrescriptionItem = {
      DrugID: selectedDrug.DrugID,
      DrugName: selectedDrug.DrugName,
      Dosage: newDrug.Dosage,
      Frequency: newDrug.Frequency,
      Duration: newDrug.Duration,
      Instructions: newDrug.Instructions,
      Quantity: newDrug.Quantity,
      UnitPrice: selectedDrug.UnitPrice,
      TotalAmount: selectedDrug.UnitPrice * newDrug.Quantity
    };
    
    onPrescriptionItemsChange([...prescriptionItems, newItem]);
    toast.success(`${selectedDrug.DrugName} added to prescription`);
    setShowAddDrug(false);
    resetNewDrugForm();
  };

  const removePrescriptionItem = (index: number) => {
    const item = prescriptionItems[index];
     onPrescriptionItemsChange(prescriptionItems.filter((_, i) => i !== index));
    toast.info(`${item.DrugName} removed from prescription`);
  };

  const resetNewDrugForm = () => {
    setNewDrug({
      DrugID: 0,
      Dosage: '',
      Frequency: 'once daily',
      Duration: '7 days',
      Instructions: '',
      Quantity: 1
    });
    setSelectedDrug(null);
    setSearchTerm('');
    setShowAllDrugs(false);
  };

const handleSavePrescription = async () => {
  if (!selectedPatient || !consultationData) {
    toast.error('Please select a patient with an active consultation');
    return;
  }
  
  if (prescriptionItems.length === 0) {
    toast.error('Please add at least one medication to the prescription');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('PatientId:', selectedPatient.PatientID);
    console.log('ConsultationId:', consultationData.ConsultationID);
    console.log('Items:', prescriptionItems);
    
    // Transform data to match backend schema
    const transformedItems = prescriptionItems.map(item => ({
      DrugID: item.DrugID,
      DrugName: item.DrugName,
      Dosage: item.Dosage,
      Frequency: item.Frequency,
      Duration: item.Duration,
      Instructions: item.Instructions,
      Quantity: item.Quantity,
      UnitPrice: item.UnitPrice
    }));
    
    // DO NOT send doctorId - backend gets it from token
    const prescriptionData = {
      patientId: selectedPatient.PatientID,
      consultationId: consultationData.ConsultationID,
      items: transformedItems,
      remarks: consultationData.TreatmentPlan || ''
    };
    
    console.log('Sending prescription data (no doctorId):', JSON.stringify(prescriptionData, null, 2));
    
    // Show loading toast
    const toastId = toast.loading('Saving prescription...');
    
    const response = await fetch('http://localhost:3001/api/doctor/prescription/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(prescriptionData)
    });
    
    const result = await response.json();
    
    // Dismiss loading toast
    toast.dismiss(toastId);
    
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      setPrescriptionSaved(true);
      setTimeout(() => setPrescriptionSaved(false), 3000);
      
      // Show success message
      toast.success(
        <div>
          <div className="font-medium">Prescription Saved Successfully!</div>
          <div className="text-sm opacity-90">Prescription ID: {result.prescriptionId}</div>
          <div className="text-xs opacity-70">{result.itemsCount} medication(s) added</div>
        </div>
      );
      
      // Ask about printing
      setTimeout(() => {
        if (window.confirm('Would you like to print the prescription?')) {
          handlePrintPrescription();
        }
      }, 500);
      
      // Clear prescription items using the prop function
      onPrescriptionItemsChange([]);
    } else {
      console.error('Prescription save error:', result);
      toast.error(result.error || 'Failed to save prescription');
    }
  } catch (error) {
    console.error('Error saving prescription:', error);
    toast.error('Failed to save prescription. Please try again.');
  }
};

  const handlePrintPrescription = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrescriptionHTML());
      printWindow.document.close();
      setShowConfirmPrint(false);
    }
  };

  const generatePrescriptionHTML = () => {
    return `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.Name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .patient-info { margin-bottom: 30px; }
            .prescription-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .prescription-table th { background-color: #f5f5f5; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #333; }
            .signature { float: right; text-align: center; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MEDICAL PRESCRIPTION</h1>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${selectedPatient.Name}</p>
            <p><strong>IC Number:</strong> ${selectedPatient.ICNo}</p>
            <p><strong>Date of Birth:</strong> ${new Date(selectedPatient.DOB).toLocaleDateString()}</p>
          </div>
          
          <div class="patient-info">
            <h3>Diagnosis</h3>
            <p>${consultationData?.Diagnosis || 'Not specified'}</p>
          </div>
          
          <h3>Medications</h3>
          <table class="prescription-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${prescriptionItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.DrugName}</td>
                  <td>${item.Dosage}</td>
                  <td>${item.Frequency}</td>
                  <td>${item.Duration}</td>
                  <td>${item.Instructions || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <div class="signature">
              <p>___________________________</p>
              <p><strong>Doctor's Signature</strong></p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
  };

  if (!selectedPatient) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Pill className="size-12 mx-auto mb-3 text-gray-400" />
        <p>Select a patient to manage prescriptions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagnosis Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">Current Diagnosis</h3>
            <p className="text-sm text-gray-700 mt-1">
              {consultationData?.Diagnosis || 'No diagnosis recorded'}
            </p>
          </div>
          {consultationData?.ConsultationID && (
            <Badge className="bg-green-100 text-green-800">
              Consultation Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Add Medication Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prescribed Medications</h3>
          <p className="text-sm text-gray-600">Add medications for {selectedPatient.Name}</p>
        </div>
        <Button 
          onClick={() => {
            setShowAddDrug(true);
            fetchDrugs(); // Refresh drug list when opening dialog
          }} 
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Medication
        </Button>
      </div>

      {/* Prescription Items Table */}
      {prescriptionItems.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Instructions</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptionItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.DrugName}</TableCell>
                  <TableCell>{item.Dosage}</TableCell>
                  <TableCell>{item.Frequency}</TableCell>
                  <TableCell>{item.Duration}</TableCell>
                  <TableCell>{item.Instructions || '-'}</TableCell>
                  <TableCell>{item.Quantity}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrescriptionItem(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Pill className="size-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No medications added</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Medication" to prescribe</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
{/* In your Action Buttons section */}
<Button 
  onClick={handleSavePrescription}
  disabled={prescriptionItems.length === 0 || prescriptionSaved}
  className="bg-blue-600 hover:bg-blue-700"
>
  <CheckCircle className="size-4 mr-2" />
  {prescriptionSaved ? 'Saving...' : 'Save Prescription'}
</Button>

<Button 
  variant="outline"
  onClick={handlePrintPrescription}
  disabled={prescriptionItems.length === 0}
>
  <Printer className="size-4 mr-2" />
  Print Only
</Button>
      </div>
      
{prescriptionSaved && (
  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
    <CheckCircle className="size-4" />
    Prescription saved successfully!
  </div>
)}

      {/* Add Drug Dialog - UPDATED WITH SCROLLABLE AND LIMITED VIEW */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>Search and add medication to prescription</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-hidden">
            {/* Drug Search */}
            <div className="space-y-2">
              <Label>Search Medications</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Type to search medications..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDrug(null);
                      fetchDrugs(); // Fetch all drugs when clearing search
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Selected Drug Info */}
            {selectedDrug && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">{selectedDrug.DrugName}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-blue-700 mt-1">
                      <span>Category: {selectedDrug.Category}</span>
                      <span>• Stock: {selectedDrug.QuantityInStock}</span>
                      {selectedDrug.ExpiryDate && (
                        <span>• Expires: {new Date(selectedDrug.ExpiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Selected
                  </Badge>
                </div>
              </div>
            )}

            {/* Drug Selection List - NOW SCROLLABLE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Available Medications</Label>
                <span className="text-sm text-gray-500">
                  {!searchTerm && filteredDrugs.length > 5 && (
                    `Showing ${displayDrugs.length} of ${filteredDrugs.length}`
                  )}
                </span>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>Loading medications...</p>
                  </div>
                ) : displayDrugs.length > 0 ? (
                  <>
                    <div 
                      className="max-h-[200px] overflow-y-auto" 
                      style={{ 
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}
                    >
                      <div className="divide-y">
                        {displayDrugs.map((drug) => (
                          <div
                            key={drug.DrugID}
                            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedDrug?.DrugID === drug.DrugID 
                                ? 'bg-blue-50 border-l-4 border-blue-500' 
                                : ''
                            }`}
                            onClick={() => handleSelectDrug(drug)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{drug.DrugName}</p>
                                <p className="text-sm text-gray-600">{drug.Category}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-medium text-gray-900">
                                  Stock: <span className={drug.QuantityInStock < 10 ? "text-red-600" : "text-green-600"}>
                                    {drug.QuantityInStock}
                                  </span>
                                </p>
                                {drug.ExpiryDate && new Date(drug.ExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                  <p className="text-xs text-amber-600">
                                    Expires soon
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Show More/Less Toggle */}
                    {!searchTerm && filteredDrugs.length > 5 && (
                      <div className="border-t border-gray-200 p-2 bg-gray-50">
                        <button
                          onClick={() => setShowAllDrugs(!showAllDrugs)}
                          className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showAllDrugs ? (
                            <>
                              <ChevronUp className="size-4" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-4" />
                              Show More ({filteredDrugs.length - 5} more)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>No medications found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dosage Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosage *</Label>
                <Input
                  placeholder="e.g., 500mg, 1 tablet"
                  value={newDrug.Dosage}
                  onChange={(e) => setNewDrug({ ...newDrug, Dosage: e.target.value })}
                  disabled={!selectedDrug}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newDrug.Frequency}
                  onValueChange={(value) => setNewDrug({ ...newDrug, Frequency: value })}
                  disabled={!selectedDrug}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once daily">Once Daily</SelectItem>
                    <SelectItem value="twice daily">Twice Daily</SelectItem>
                    <SelectItem value="three times daily">Three Times Daily</SelectItem>
                    <SelectItem value="four times daily">Four Times Daily</SelectItem>
                    <SelectItem value="as needed">As Needed</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="every 6 hours">Every 6 Hours</SelectItem>
                    <SelectItem value="every 8 hours">Every 8 Hours</SelectItem>
                    <SelectItem value="every 12 hours">Every 12 Hours</SelectItem>
                    <SelectItem value="bedtime">At Bedtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={newDrug.Duration}
                  onValueChange={(value) => setNewDrug({ ...newDrug, Duration: value })}
                  disabled={!selectedDrug}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 day">1 Day</SelectItem>
                    <SelectItem value="3 days">3 Days</SelectItem>
                    <SelectItem value="5 days">5 Days</SelectItem>
                    <SelectItem value="7 days">7 Days</SelectItem>
                    <SelectItem value="10 days">10 Days</SelectItem>
                    <SelectItem value="14 days">14 Days</SelectItem>
                    <SelectItem value="30 days">30 Days</SelectItem>
                    <SelectItem value="until finished">Until Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedDrug?.QuantityInStock || 1}
                  value={newDrug.Quantity}
                  onChange={(e) => setNewDrug({ ...newDrug, Quantity: parseInt(e.target.value) || 1 })}
                  disabled={!selectedDrug}
                />
                {selectedDrug && (
                  <p className="text-xs text-gray-500">
                    Max available: {selectedDrug.QuantityInStock}
                  </p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Textarea
                placeholder="e.g., Take with food, Avoid alcohol, etc."
                rows={2}
                value={newDrug.Instructions}
                onChange={(e) => setNewDrug({ ...newDrug, Instructions: e.target.value })}
                disabled={!selectedDrug}
              />
            </div>

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button 
                onClick={handleAddDrug}
                disabled={!selectedDrug || !newDrug.Dosage.trim()}
                className="min-w-[150px]"
              >
                <Plus className="size-4 mr-2" />
                Add to Prescription
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDrug(false);
                  resetNewDrugForm();
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Print Dialog */}
      <Dialog open={showConfirmPrint} onOpenChange={setShowConfirmPrint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Prescription</DialogTitle>
            <DialogDescription>
              Print prescription for {selectedPatient?.Name}?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button onClick={handlePrintPrescription} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="size-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={() => setShowConfirmPrint(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}