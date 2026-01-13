import { useState, useEffect } from 'react';
import { Search, Bell, LogOut, Pill, Package, AlertTriangle, Plus, PackagePlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { ProfileModal } from './ProfileModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

export function PharmacistPortal2({ onSignOut }: { onSignOut: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'expiry' | 'addStock'>('inventory');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showEditItem, setShowEditItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showReorder, setShowReorder] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // 🆕 NEW: Get the real logged-in user
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Try to read user data from storage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // 2. Safety: If no user is found (e.g. forced via test route), create a dummy fallback
      // This keeps your "Dev Mode" working without crashing
      setUser({
        id: 14, 
        name: 'Dev Pharmacist', 
        role: 'pharmacist' 
      });
    }
  }, []);

  // ... rest of your code ...  

  // ---------------------------------------------------------
  // 🆕 STATE: Real Inventory Data from Database
  // ---------------------------------------------------------
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingInventory, setLoadingInventory] = useState(true);

  // FETCH DATA ON LOAD
  useEffect(() => {
    fetchInventory();
  }, [activeTab]); 

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/drugs');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedData = data.map((drug: any) => {
           const stock = drug.QuantityInStock || 0;
           const minStock = drug.MinStockLevel || 10; 

           let status = 'good';
           if (stock === 0) status = 'critical';
           else if (stock <= minStock) status = 'low';

           return {
             id: drug.DrugID,
             name: drug.DrugName,
             stock: stock,
             minStock: minStock,
             status: status,
             location: drug.Location || 'Pharmacy', 
             category: drug.Category
           };
        });
        setInventoryItems(formattedData);
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Filter based on Search Query
  const filteredInventory = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate Low Stock Alerts for the Dashboard
  const lowStockItems = inventoryItems.filter(item => item.status === 'low' || item.status === 'critical');

  const pharmacistProfile = {
    // Use real name/ID, or fallback to 'Loading...' if state isn't ready
    name: user?.name || 'Loading...',
    id: user?.id || 0, 
    role: 'Pharmacist',
    department: 'Pharmacy',
    email: user?.email || 'pharmacy@clinic.com',
    // ... keep the rest static for now ...
    phone: '+1 (555) 678-9012',
    initials: user?.name ? user.name.substring(0, 2).toUpperCase() : 'PH',
    joinDate: 'March 2019',
    specialization: 'Clinical Pharmacy',
    certifications: ['Licensed Pharmacist', 'Immunization Certified', 'MTM Certified']
  };

  const expiringMeds = [
    { name: 'Aspirin 100mg', stock: 200, location: 'A-10', expiryDate: '2024-12-15', daysLeft: 29 },
    { name: 'Cough Syrup', stock: 45, location: 'B-08', expiryDate: '2024-11-30', daysLeft: 14 },
    { name: 'Vitamin C 500mg', stock: 150, location: 'C-05', expiryDate: '2025-01-10', daysLeft: 55 }
  ];

  // ---------------------------------------------------------
  // 🆕 STATE: Pending Prescriptions
  // ---------------------------------------------------------
  const [pendingRxList, setPendingRxList] = useState<any[]>([]);

  // Fetch on load
  useEffect(() => {
    fetchPendingRx();
  }, []);

 const fetchPendingRx = async () => {
    try {
      // 1. Get the token from storage (Standard practice)
      const token = localStorage.getItem('token'); 

      const response = await fetch('http://localhost:3001/api/pharmacist/pending-rx', {
        headers: {
            // 2. Send the token to prove we are logged in
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
         throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // 3. SAFETY CHECK: Only set data if it is actually a list (Array)
      if (Array.isArray(data)) {
        setPendingRxList(data);
      } else {
        console.error("Received invalid data format:", data);
        setPendingRxList([]); // Default to empty list to prevent crash
      }

    } catch (error) {
      console.error("Error loading RX:", error);
      setPendingRxList([]); // Safe fallback
    }
  };

  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);

  const handleDispenseConfirm = async () => {
    if (!selectedPrescription) return;

    try {
      const response = await fetch(`http://localhost:3001/api/pharmacist/dispense/${selectedPrescription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Dispensed by Pharmacist' }) // You can connect this to the notes input later
      });

      if (response.ok) {
        alert("✅ Medication Dispensed!");
        setShowDispense(false);
        fetchPendingRx(); // Refresh list to remove the item
        
        // Optional: Deduct stock from inventory here (advanced step)
        fetchInventory(); 
      }
    } catch (error) {
      alert("❌ Failed to dispense");
    }
  };

  // ---------------------------------------------------------
  // STATE: Registering Drug 
  // ---------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemData, setNewItemData] = useState({
    DrugName: '',
    BarcodeID: '',
    Category: '',
    UnitPrice: '',
    QuantityInStock: '',
    ExpiryDate: ''
  });

  // ---------------------------------------------------------
  // 🆕 STATE: Reordering Stock
  // ---------------------------------------------------------
  const [isReordering, setIsReordering] = useState(false);
  const [reorderFormData, setReorderFormData] = useState({
    quantity: '',
    supplier: '',
    urgency: 'medium', // Default value
    notes: ''
  });

  // Reset reorder form when a new item is selected
  useEffect(() => {
    if (selectedItem && showReorder) {
        setReorderFormData({
            quantity: (selectedItem.minStock * 2).toString(), // Default suggest 2x min stock
            supplier: '',
            // Auto-select urgency based on status
            urgency: selectedItem.status === 'critical' ? 'critical' : 'medium', 
            notes: ''
        });
    }
  }, [selectedItem, showReorder]);


  // ---------------------------------------------------------
  // STATE: Rapid Restock Mode
  // ---------------------------------------------------------
  const [showRestockMode, setShowRestockMode] = useState(false);
  const [restockInput, setRestockInput] = useState('');
  
  const [scanHistory, setScanHistory] = useState<Array<{
      barcode: string, 
      name: string, 
      count: number, 
      status: 'success' | 'error', 
      time: string
  }>>([]);

  const handleRestockScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = restockInput.trim();
      if (!barcode) return;

      try {
        const response = await fetch('http://localhost:3001/api/drug/restock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ BarcodeID: barcode }),
        });

        const data = await response.json();
        const timestamp = new Date().toLocaleTimeString();

        setScanHistory(prev => {
          const existingIndex = prev.findIndex(item => item.barcode === barcode);

          if (existingIndex !== -1) {
            const updatedHistory = [...prev];
            const existingItem = updatedHistory[existingIndex];
            updatedHistory.splice(existingIndex, 1);

            return [{
              ...existingItem,
              count: existingItem.count + 1,
              time: timestamp,
              status: response.ok ? 'success' : 'error'
            }, ...updatedHistory];

          } else {
            return [{
              barcode: barcode,
              name: response.ok ? data.drug.DrugName : `Unknown: ${barcode}`, 
              count: 1,
              status: response.ok ? 'success' : 'error', 
              time: timestamp
            }, ...prev];
          }
        });

        if (response.ok) {
            fetchInventory(); 
        }

      } catch (error) {
        console.error(error);
      }

      setRestockInput('');
    }
  };

  // ---------------------------------------------------------
  // 🆕 FUNCTION: Submit Reorder Request to Backend
  // ---------------------------------------------------------
  const handleSubmitReorder = async () => {
    if (!selectedItem || !reorderFormData.quantity || !reorderFormData.supplier) {
        alert("Please fill in quantity and supplier.");
        return;
    }

    setIsReordering(true);

    try {
        const response = await fetch('http://localhost:3001/api/admin/drug-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                drugId: selectedItem.id,
                quantity: parseInt(reorderFormData.quantity),
                urgency: reorderFormData.urgency, // Matches DB values: low, medium, high, critical
                supplier: reorderFormData.supplier,
                reason: reorderFormData.notes,
                requestedBy: user?.id || 14
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Reorder request submitted successfully!");
            setShowReorder(false);
            setReorderFormData({ quantity: '', supplier: '', urgency: 'medium', notes: '' });
        } else {
            throw new Error(data.error || "Failed to submit reorder");
        }

    } catch (error: any) {
        console.error("Reorder error:", error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        setIsReordering(false);
    }
  };


  const handleRegisterDrug = async () => {
    if (!newItemData.DrugName || !newItemData.BarcodeID) {
      alert('⚠️ Drug Name and Barcode are required!');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/drug/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItemData,
          UnitPrice: parseFloat(newItemData.UnitPrice) || 0,
          QuantityInStock: parseInt(newItemData.QuantityInStock) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + data.message);
        setShowAddItem(false);
        setNewItemData({
          DrugName: '',
          BarcodeID: '',
          Category: '',
          UnitPrice: '',
          QuantityInStock: '',
          ExpiryDate: ''
        });
        fetchInventory(); 
      } else {
        alert('❌ ' + (data.error || 'Failed to add drug'));
      }
    } catch (error) {
      console.error(error);
      alert('❌ Connection failed. Is the server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Pill className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">Pharmacist Portal</h1>
              <p className="text-sm text-gray-500">Inventory & Medication Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-purple-600 text-white">{pharmacistProfile.initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">{pharmacistProfile.name}</p>
                <p className="text-xs text-gray-500">{pharmacistProfile.role}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onSignOut}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">Pharmacy Dashboard</h2>
            <p className="text-sm text-gray-500">Manage medication inventory and prescriptions</p>
          </div>  

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="size-4 inline mr-2" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Pill className="size-4 inline mr-2" />
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('expiry')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'expiry'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="size-4 inline mr-2" />
              Expiry Tracking
            </button>
            
            <button
              onClick={() => setActiveTab('addStock')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'addStock'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <PackagePlus className="size-4 inline mr-2" />
              + Add Stock
            </button>

          </div>

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
              
              {/* LEFT SIDE: Inventory Management (Takes 2/3 width) */}
              <Card className="lg:col-span-2 h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Medication Inventory</CardTitle>
                      <CardDescription>Current stock levels</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative w-48"> 
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddItem(true)}>
                        <Plus className="size-4" />
                        <span className="ml-2 hidden sm:inline">Add</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredInventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="text-sm text-gray-900 font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.location}</Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-900">{item.stock}</p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.status === 'good' ? 'default' : 'secondary'}
                                className={
                                  item.status === 'good'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'low'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedItem(item);
                                setShowEditItem(true);
                              }}>
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* RIGHT SIDE: Pending Prescriptions (Takes 1/3 width) */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle>Pending RX</CardTitle>
                  <CardDescription>Queue to fulfill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* RIGHT SIDE: Pending Prescriptions (Takes 1/3 width) */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle>Pending RX</CardTitle>
                  <CardDescription>Queue to fulfill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRxList.length === 0 && <p className="text-gray-500 text-center py-4">No pending prescriptions.</p>}
                    
                    {pendingRxList.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{prescription.patient}</p>
                            <p className="text-xs text-gray-500">{prescription.doctor}</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            {prescription.status}
                          </Badge>
                        </div>
                        <div className="mb-3">
                            <p className="text-sm text-purple-700 font-medium">{prescription.medication}</p>
                            <p className="text-xs text-gray-500">
                                Qty: {prescription.quantity} • {prescription.dosage}
                            </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setShowDispense(true);
                          }}
                        >
                          Prepare
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <Card>
              <CardHeader>
                <CardTitle>Dispensing History</CardTitle>
                <CardDescription>Recently dispensed medications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dispensingHistory.map((record, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm text-gray-900">{record.patient}</p>
                            <Badge variant="outline" className="text-xs">{record.date}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">{record.medication}</p>
                          <p className="text-xs text-gray-500 mt-1">Quantity: {record.quantity} units</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedReceipt(record);
                            setShowReceipt(true);
                          }}>View Receipt</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'expiry' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-orange-500" />
                  Expiring Medications
                </CardTitle>
                <CardDescription>Medications expiring in the next 60 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringMeds.map((med, index) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg ${
                        med.daysLeft <= 14
                          ? 'border-red-200 bg-red-50'
                          : med.daysLeft <= 30
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 mb-1">{med.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Stock: {med.stock}</span>
                            <span>Location: {med.location}</span>
                          </div>
                        </div>
                        <Badge
                          variant="destructive"
                          className={
                            med.daysLeft <= 14
                              ? 'bg-red-600'
                              : med.daysLeft <= 30
                              ? 'bg-orange-600'
                              : 'bg-yellow-600'
                          }
                        >
                          {med.daysLeft} days
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Expires: {med.expiryDate}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Mark for Return</Button>
                        <Button size="sm" variant="outline">Discount Sale</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'addStock' && (
            <div className="max-w-4xl mx-auto pt-8">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* CARD 1: REGISTER NEW DRUG */}
                <Card className="hover:border-purple-400 transition-all cursor-pointer" onClick={() => setShowAddItem(true)}>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
                      <Plus className="size-8 text-purple-600" />
                    </div>
                    <CardTitle>Register New Drug</CardTitle>
                    <CardDescription>Add a completely new item to the database</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                      Open Registration Form
                    </Button>
                  </CardContent>
                </Card>

                {/* CARD 2: RAPID RESTOCK */}
                <Card className="hover:border-blue-400 transition-all cursor-pointer" onClick={() => setShowRestockMode(true)}>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-blue-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
                      <PackagePlus className="size-8 text-blue-600" />
                    </div>
                    <CardTitle>Restock Scanner</CardTitle>
                    <CardDescription>Scan items to quickly add stock (+1)</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                      Start Scanning Mode
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {/* Helper Text */}
              <div className="mt-8 text-center text-gray-500 bg-white p-6 rounded-lg border">
                <h3 className="font-semibold text-gray-700 mb-2">How it works</h3>
                <p className="text-sm">
                  <strong>Register New:</strong> Use this when you receive a new drug that isn't in the system yet.<br/>
                  <strong>Restock Scanner:</strong> Use this for daily refills. Just scan the box, and the system automatically adds +1 to the inventory.
                </p>
              </div>
            </div>
          )}

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="size-5" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Items requiring restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-orange-200 rounded-lg"
                    >
                      <p className="text-sm text-gray-900 mb-1">{item.name}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        Stock: {item.stock} / Min: {item.minStock}
                      </p>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => {
                        setSelectedItem(item);
                        setShowReorder(true);
                      }}>
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={pharmacistProfile}
      />

      {/* ========================================================= */}
      {/* ADD ITEM DIALOG                                           */}
      {/* ========================================================= */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>Scan the item to register it in the database</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            
            {/* DRUG NAME */}
            <div className="space-y-2">
              <Label htmlFor="med-name">Medication Name *</Label>
              <Input 
                id="med-name" 
                placeholder="e.g., Amoxicillin 500mg" 
                value={newItemData.DrugName}
                onChange={(e) => setNewItemData({...newItemData, DrugName: e.target.value})}
                autoFocus 
              />
            </div>

            {/* BARCODE INPUT (Ready for Physical Scanner) */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode ID *</Label>
              <Input 
                id="barcode" 
                placeholder="Click here and scan item..." 
                value={newItemData.BarcodeID}
                onChange={(e) => setNewItemData({...newItemData, BarcodeID: e.target.value})}
              />
            </div>

            {/* STOCK FIELDS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  placeholder="0" 
                  value={newItemData.QuantityInStock}
                  onChange={(e) => setNewItemData({...newItemData, QuantityInStock: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-stock">Min Stock Alert</Label>
                <Input id="min-stock" type="number" placeholder="10" />
              </div>
            </div>

            {/* CATEGORY SELECT */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setNewItemData({...newItemData, Category: value})}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                  <SelectItem value="Analgesic">Analgesic</SelectItem>
                  <SelectItem value="Antipyretic">Antipyretic</SelectItem>
                  <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                  <SelectItem value="Diabetes">Diabetes</SelectItem>
                  <SelectItem value="Respiratory">Respiratory</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PRICE & EXPIRY */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  type="date" 
                  value={newItemData.ExpiryDate}
                  onChange={(e) => setNewItemData({...newItemData, ExpiryDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">Unit Price ($)</Label>
                <Input 
                  id="unit-price" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={newItemData.UnitPrice}
                  onChange={(e) => setNewItemData({...newItemData, UnitPrice: e.target.value})}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-2">
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700" 
                onClick={handleRegisterDrug}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Add Medication'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispense Medication Dialog */}
      <Dialog open={showDispense} onOpenChange={setShowDispense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispense Medication</DialogTitle>
            <DialogDescription>
              {selectedPrescription && `Dispensing for ${selectedPrescription.patient}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient:</span>
                  <span className="text-gray-900">{selectedPrescription.patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Medication:</span>
                  <span className="text-gray-900">{selectedPrescription.medication}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="text-gray-900">{selectedPrescription.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prescribed by:</span>
                  <span className="text-gray-900">{selectedPrescription.doctor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">Batch Number</Label>
                <Input id="batch" placeholder="Enter batch number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispense-notes">Dispensing Notes</Label>
                <Textarea
                  id="dispense-notes"
                  placeholder="Special instructions for patient..."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleDispenseConfirm} 
                >
                  Confirm Dispensing
                </Button>
                <Button variant="outline" onClick={() => setShowDispense(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory Item</DialogTitle>
            <DialogDescription>{selectedItem && `Update stock for ${selectedItem.name}`}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="update-stock">Current Stock</Label>
                <Input id="update-stock" type="number" defaultValue={selectedItem.stock} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-stock">Add Stock</Label>
                <Input id="add-stock" type="number" placeholder="Enter quantity to add" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => {
                  alert('Stock updated successfully!');
                  setShowEditItem(false);
                }}>
                  Update Stock
                </Button>
                <Button variant="outline" onClick={() => setShowEditItem(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* 🆕 UPDATED: Reorder Dialog with Urgency Dropdown          */}
      {/* ========================================================= */}
      <Dialog open={showReorder} onOpenChange={setShowReorder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Medication</DialogTitle>
            <DialogDescription>{selectedItem && `Place reorder for ${selectedItem.name}`}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Medication:</span>
                  <span className="text-gray-900">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="text-gray-900">{selectedItem.stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Minimum Stock:</span>
                  <span className="text-gray-900">{selectedItem.minStock}</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="reorder-quantity">Reorder Quantity *</Label>
                <Input 
                    id="reorder-quantity" 
                    type="number" 
                    value={reorderFormData.quantity} 
                    onChange={(e) => setReorderFormData({...reorderFormData, quantity: e.target.value})}
                />
              </div>

              {/* 🆕 Urgency Dropdown (Matching DB Values) */}
              <div className="space-y-2">
                <Label htmlFor="reorder-urgency">Urgency *</Label>
                <Select 
                    value={reorderFormData.urgency} 
                    onValueChange={(value) => setReorderFormData({...reorderFormData, urgency: value})}
                >
                  <SelectTrigger id="reorder-urgency">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Input */}
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                    value={reorderFormData.supplier} 
                    onValueChange={(value) => setReorderFormData({...reorderFormData, supplier: value})}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MedPlus Pharmaceuticals">MedPlus Pharmaceuticals</SelectItem>
                    <SelectItem value="HealthSupply Inc.">HealthSupply Inc.</SelectItem>
                    <SelectItem value="Pharmacy Direct">Pharmacy Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="reorder-notes">Notes</Label>
                <Textarea 
                    id="reorder-notes" 
                    placeholder="Special instructions..." 
                    rows={2} 
                    value={reorderFormData.notes}
                    onChange={(e) => setReorderFormData({...reorderFormData, notes: e.target.value})}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={handleSubmitReorder}
                    disabled={isReordering}
                >
                  {isReordering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Place Reorder'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowReorder(false)} disabled={isReordering}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt View Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispensing Receipt</DialogTitle>
            <DialogDescription>Receipt details</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
                <div className="text-center mb-4 pb-4 border-b">
                  <h3 className="text-lg">HealthCare Clinic Pharmacy</h3>
                  <p className="text-sm text-gray-600">Receipt #: RX-{Math.floor(Math.random() * 10000)}</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Patient:</span>
                    <span className="text-gray-900">{selectedReceipt.patient}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medication:</span>
                    <span className="text-gray-900">{selectedReceipt.medication}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="text-gray-900">{selectedReceipt.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="text-gray-900">{selectedReceipt.date}</span>
                  </div>
                </div>
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-gray-600">Thank you for using our pharmacy services</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => {
                  alert('Printing receipt...');
                  setShowReceipt(false);
                }}>
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setShowReceipt(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* RAPID RESTOCK MODE DIALOG                                 */}
      {/* ========================================================= */}
      <Dialog open={showRestockMode} onOpenChange={setShowRestockMode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="size-6 text-blue-600" />
              Rapid Restock Mode
            </DialogTitle>
            <DialogDescription>
              Scan items one by one. The system will auto-save. Press Cancel to finish.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* SCANNER INPUT FIELD */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full">
                <Input 
                  autoFocus
                  placeholder="Scan barcode here..." 
                  className="h-16 text-lg text-center border-2 border-blue-200 focus:border-blue-500"
                  value={restockInput}
                  onChange={(e) => setRestockInput(e.target.value)}
                  onKeyDown={handleRestockScan}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-pulse">
                  📷 Ready to Scan
                </div>
              </div>
              <p className="text-xs text-gray-500">Ensure your scanner cursor is in the box above</p>
            </div>

            {/* LIVE SCAN HISTORY LOG */}
            <div className="bg-gray-50 rounded-lg p-4 border h-64 overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                 <h4 className="text-sm font-semibold text-gray-700">Session History</h4>
                 {scanHistory.length > 0 && (
                   <span className="text-xs text-gray-400 cursor-pointer hover:text-red-500" onClick={() => setScanHistory([])}>
                     Clear History
                   </span>
                 )}
              </div>

              {scanHistory.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No items scanned yet</div>
              ) : (
                <div className="space-y-2">
                  {scanHistory.map((log) => (
                    <div key={log.barcode} className={`flex justify-between items-center p-3 rounded border transition-all ${
                      log.status === 'success' ? 'bg-white border-green-200 shadow-sm' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-600 text-white font-bold text-sm shadow-sm">
                            +{log.count}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white font-bold text-lg shadow-sm">
                            !
                          </div>
                        )}
                        <div>
                            <p className={log.status === 'success' ? 'font-medium text-gray-800' : 'font-medium text-red-700'}>
                              {log.name}
                            </p>
                            {log.count > 1 && (
                                <p className="text-xs text-green-600 font-medium">
                                    Added {log.count} units total
                                </p>
                            )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => {
              setShowRestockMode(false);
              setScanHistory([]); 
            }}>
              Finish & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>    

    </div>
  );
}