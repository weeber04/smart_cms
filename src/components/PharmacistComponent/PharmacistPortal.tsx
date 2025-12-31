import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Bell, LogOut, Pill, Package, 
  AlertTriangle, Plus, RefreshCcw, User as UserIcon, Loader2,
  Barcode, ArrowDownCircle, PackagePlus, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationPanel } from '../NotificationPanel';
import { ProfileModal } from '../ProfileModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface Prescription {
  id: number;
  ItemID: number;
  patient: string;
  doctor: string;
  medication: string;
  quantity: number;
  status: string;
}

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  location: string;
  status: 'good' | 'low' | 'critical';
}

// Added interfaces for new UI features
interface ExpiringMed {
  name: string;
  stock: number;
  location: string;
  expiryDate: string;
  daysLeft: number;
}

export function PharmacistPortal({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'expiry'>('inventory');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showEditItem, setShowEditItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showReorder, setShowReorder] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  // --- EXISTING STATE FROM OLD COMPONENT ---
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [scanMode, setScanMode] = useState<'dispense' | 'restock'>('dispense');
  const [expiringMeds, setExpiringMeds] = useState<ExpiringMed[]>([]);
  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);

  // --- EXISTING BACKEND FUNCTIONS FROM OLD COMPONENT ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error("No token found in localStorage");
        Swal.fire({ icon: 'error', title: 'Session Expired', text: 'Please login again.' });
        return;
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch inventory
      const invRes = await fetch('http://localhost:3001/api/pharmacist/inventory', { headers });
      if (!invRes.ok) throw new Error("Failed to fetch inventory");

      const invData = await invRes.json();
      const mappedInventory: InventoryItem[] = Array.isArray(invData)
        ? invData.map((item: any) => ({
            id: item.DrugID,
            name: item.DrugName,
            stock: item.QuantityInStock,
            minStock: item.MinStockLevel,
            location: item.Location || "Storage",
            status:
              item.QuantityInStock <= item.MinStockLevel * 0.2
                ? "critical"
                : item.QuantityInStock <= item.MinStockLevel
                ? "low"
                : "good",
          }))
        : [];

      setInventory(mappedInventory);

      // Fetch pending prescriptions
      const presRes = await fetch('http://localhost:3001/api/pharmacist/prescriptions/pending', { headers });
      if (!presRes.ok) throw new Error("Failed to fetch prescriptions");

      const presData = await presRes.json();
      setPendingPrescriptions(Array.isArray(presData) ? presData : []);

      // TODO: Add API calls for expiring meds and dispensing history when backend is ready
      // For now, use mock data or empty arrays
      setExpiringMeds([]);
      setDispensingHistory([]);

    } catch (error) {
      console.error("Sync error:", error);
      Swal.fire({ icon: 'error', title: 'Sync Error', text: 'Failed to sync data' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // BARCODE SCANNER FUNCTIONALITY (from old component)
  const handleBarcodeScan = async () => {
    if (!scannedCode.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Input', text: 'Please scan a barcode first.' });
      return;
    }

    Swal.fire({
      title: 'Processing...',
      didOpen: () => Swal.showLoading()
    });

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (scanMode === 'dispense') {
        const response = await axios.post('http://localhost:3001/api/scan', 
          { barcode: scannedCode, mode: 'dispense' }, 
          config
        );

        if (response.data.status === 'success') {
          setInventory(prev => prev.map(item => 
            item.name === response.data.drug 
              ? { ...item, stock: response.data.remaining, status: response.data.remaining <= item.minStock ? 'low' : item.status }
              : item
          ));

          Swal.fire({
            icon: 'success',
            title: 'Dispensed!',
            html: `<span style="font-size: 1.1em"><b>${response.data.drug}</b></span><br/>Remaining: <b>${response.data.remaining}</b>`,
            timer: 1500,
            showConfirmButton: false
          });
        }
      } else {
        const response = await axios.post('http://localhost:3001/api/scan', 
          { barcode: scannedCode, mode: 'check' }, 
          config
        );

        if (response.data.status === 'success') {
          Swal.close();
          const drug = response.data.drug;
          setRestockItem({
            id: drug.id,
            name: drug.name,
            stock: drug.stock,
            minStock: 10,
            location: drug.location,
            status: 'good'
          });
          setShowRestockDialog(true);
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Item not found or scan failed"
      });
    } finally {
      setIsProcessing(false);
      setScannedCode('');
    }
  };

  const handleRestockConfirm = async () => {
    if (!restockItem || !restockQty) return;
    
    Swal.fire({ title: 'Updating Stock...', didOpen: () => Swal.showLoading() });
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/restock',
        { drug_id: restockItem.id, quantity: parseInt(restockQty) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setShowRestockDialog(false);
        setRestockQty('');
        fetchData();
        
        Swal.fire({
          icon: 'success',
          title: 'Stock Added!',
          text: `Successfully added ${restockQty} units.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: "Restock failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeScan();
    }
  };

  const handleConfirmDispense = async () => {
    if (!selectedPrescription) return;
    
    Swal.fire({ title: 'Dispensing...', didOpen: () => Swal.showLoading() });
    
    setIsProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/pharmacist/dispense/${selectedPrescription.ItemID}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.ok) {
        setShowDispense(false);
        fetchData();
        
        Swal.fire({
          icon: 'success',
          title: 'Order Completed',
          text: 'Prescription has been dispensed.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Connection Error', text: "Could not connect to database." });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.status === 'low' || item.status === 'critical');

  if (isLoading && inventory.length === 0) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-600 size-10" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Updated with old component's header style */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Pill className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">Clinic CMS</h1>
              <p className="text-sm text-gray-500">Pharmacy Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPanel role="pharmacist" />
            <div className="flex items-center gap-3">
              <Avatar 
                className="cursor-pointer border-2 border-purple-50 hover:border-purple-200 transition-colors"
                onClick={() => setShowProfile(true)}
              >
                <AvatarFallback className="bg-purple-600 text-white">
                  {user?.name?.charAt(0) || <UserIcon className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">{user?.name || 'Pharmacist'}</p>
                <p className="text-xs text-gray-500">Authorized Pharmacist</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onSignOut} className="text-gray-400 hover:text-red-600">
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* BARCODE SCANNER SECTION - From old component */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Quick Scan Inventory</h2>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Barcode className="size-4" />
                    <span className="font-semibold">IoT Scanner</span>
                    <span className="text-emerald-500 font-bold">• Ready to scan inventory</span>
                  </p>
                </div>
                
                <div className="h-px bg-gray-200"></div>
                
                <div>
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={scanMode === 'dispense' ? 'default' : 'outline'}
                      className={`flex-1 h-10 ${scanMode === 'dispense' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-300 text-gray-700'}`}
                      onClick={() => setScanMode('dispense')}
                    >
                      <ArrowDownCircle className="size-4 mr-2" />
                      Dispense Mode
                    </Button>
                    <Button
                      variant={scanMode === 'restock' ? 'default' : 'outline'}
                      className={`flex-1 h-10 ${scanMode === 'restock' ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-300 text-gray-700'}`}
                      onClick={() => setScanMode('restock')}
                    >
                      <PackagePlus className="size-4 mr-2" />
                      Restock Mode
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder={scanMode === 'dispense' ? "Scan barcode to dispense medication..." : "Scan barcode to restock medication..."}
                      className="h-12 text-lg font-medium pl-4 flex-1"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      autoFocus
                    />
                    <Button 
                      onClick={handleBarcodeScan} 
                      className="h-12 px-6 bg-purple-600 hover:bg-purple-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Scanning...' : 'Scan'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation - From new UI */}
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
          </div>

          {activeTab === 'inventory' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Inventory Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Medication Inventory</CardTitle>
                      <CardDescription>Current stock levels</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          placeholder="Search medication..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button size="icon" onClick={fetchData} variant="outline" className="h-10 w-10">
                        <RefreshCcw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-bold text-gray-700">Drug Name</TableHead>
                          <TableHead className="font-bold text-gray-700">Location</TableHead>
                          <TableHead className="font-bold text-gray-700">Stock</TableHead>
                          <TableHead className="font-bold text-gray-700">Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-bold text-gray-900">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">{item.location}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-gray-600">
                              {item.stock} Units
                              <p className="text-xs text-gray-500">Min: {item.minStock}</p>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.status === 'good' ? 'bg-emerald-100 text-emerald-700' : 
                                item.status === 'low' ? 'bg-amber-100 text-amber-700' : 
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedItem(item);
                                setShowReorder(true);
                              }}>
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Prescriptions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Prescriptions</CardTitle>
                  <CardDescription>Prescriptions to fulfill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingPrescriptions.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <CheckCircle className="size-12 text-gray-200 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-bold">No Pending Prescriptions</h3>
                        <p className="text-gray-400 text-sm">Waiting for doctors to submit new orders.</p>
                      </div>
                    ) : (
                      pendingPrescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="p-3 border border-gray-200 rounded-lg hover:border-purple-200 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{prescription.patient}</p>
                              <p className="text-xs text-gray-500">Dr. {prescription.doctor}</p>
                            </div>
                            <Badge className="bg-orange-50 text-orange-600 border-none text-[10px]">
                              RX PENDING
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{prescription.medication}</p>
                          <p className="text-xs text-gray-500 mb-3">Qty: {prescription.quantity} units</p>
                          <Button
                            size="sm"
                            className="w-full bg-gray-900 hover:bg-purple-600 text-xs font-medium"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setShowDispense(true);
                            }}
                          >
                            Process Dispensing
                          </Button>
                        </div>
                      ))
                    )}
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
                {dispensingHistory.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No dispensing history available.</p>
                    <p className="text-sm text-gray-400 mt-1">History will appear here after dispensing medications.</p>
                  </div>
                ) : (
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
                )}
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
                {expiringMeds.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertTriangle className="size-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No expiring medications found.</p>
                    <p className="text-sm text-gray-400 mt-1">Expiring medications will appear here.</p>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          )}

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && activeTab === 'inventory' && (
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
        profile={{
          name: user?.name || 'Authorized User',
          role: user?.role || 'Pharmacist',
          email: user?.email || 'pharmacy@clinic.com',
          department: 'Pharmacy',
          phone: '+1 (555) 000-0000',
          initials: user?.name?.charAt(0) || 'P',
          joinDate: '2025',
          specialization: 'Clinical Pharmacy',
          certifications: ['Licensed Pharmacist']
        }}
      />

      {/* EXISTING DIALOGS FROM OLD COMPONENT */}
      <Dialog open={showDispense} onOpenChange={setShowDispense}>
        <DialogContent className="sm:max-w-[420px] border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-black text-gray-900">Confirm Order</DialogTitle>
            <DialogDescription className="text-gray-500">Verify medication against the physical supply.</DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6 py-4">
              <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Patient</span> 
                  <span className="font-bold text-gray-900">{selectedPrescription.patient}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Medication</span> 
                  <span className="font-bold text-gray-900">{selectedPrescription.medication}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Quantity</span> 
                  <span className="font-bold text-purple-600 text-lg">{selectedPrescription.quantity} Units</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Prescribed by</span> 
                  <span className="font-bold text-gray-900">Dr. {selectedPrescription.doctor}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Batch Number (Optional)</Label>
                <Input id="batch" placeholder="Enter batch number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispense-notes">Dispensing Notes (Optional)</Label>
                <Textarea
                  id="dispense-notes"
                  placeholder="Special instructions for patient..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 font-bold shadow-lg shadow-purple-100" 
                  onClick={handleConfirmDispense} 
                  disabled={isProcessing}
                >
                  {isProcessing ? "Updating Database..." : "Confirm Dispensed"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 font-bold text-gray-500 border-gray-200" 
                  onClick={() => setShowDispense(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- ADDED RESTOCK DIALOG (from old component) --- */}
      <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
        <DialogContent className="sm:max-w-[420px] border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-black text-gray-900">Update Inventory</DialogTitle>
            <DialogDescription className="text-gray-500">Restock item from scanner input.</DialogDescription>
          </DialogHeader>
          
          {restockItem && (
            <div className="space-y-6 py-4">
              <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Item</span> 
                  <span className="font-bold text-gray-900">{restockItem.name}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Current Stock</span> 
                  <span className="font-bold text-gray-900">{restockItem.stock} Units</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restockQty" className="text-xs font-bold uppercase text-gray-500">Quantity to Add</Label>
                <Input
                  id="restockQty"
                  type="number"
                  placeholder="Enter quantity"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="h-12 font-bold text-lg"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 font-bold shadow-lg shadow-purple-100" 
                  onClick={handleRestockConfirm} 
                  disabled={isProcessing || !restockQty}
                >
                  {isProcessing ? "Updating..." : "Add Stock"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 font-bold text-gray-500 border-gray-200" 
                  onClick={() => setShowRestockDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW UI DIALOGS (placeholder functionality) */}
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
              <div className="space-y-2">
                <Label htmlFor="reorder-quantity">Reorder Quantity</Label>
                <Input id="reorder-quantity" type="number" defaultValue={selectedItem.minStock * 2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medplus">MedPlus Pharmaceuticals</SelectItem>
                    <SelectItem value="healthsupply">HealthSupply Inc.</SelectItem>
                    <SelectItem value="pharmacy-direct">Pharmacy Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder-notes">Notes</Label>
                <Textarea id="reorder-notes" placeholder="Urgency, special instructions..." rows={2} />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => {
                  Swal.fire({
                    icon: 'success',
                    title: 'Reorder Placed',
                    text: `Reorder for ${selectedItem.name} has been placed.`,
                    timer: 1500,
                    showConfirmButton: false
                  });
                  setShowReorder(false);
                }}>
                  Place Reorder
                </Button>
                <Button variant="outline" onClick={() => setShowReorder(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt View Dialog (placeholder) */}
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
                  Swal.fire({
                    icon: 'info',
                    title: 'Printing',
                    text: 'Receipt sent to printer.',
                    timer: 1500,
                    showConfirmButton: false
                  });
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
    </div>
  );
}