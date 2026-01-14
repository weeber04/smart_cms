import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { 
  Search, Bell, LogOut, Pill, Package, AlertTriangle, Plus, PackagePlus, 
  Loader2, RefreshCw, ScanLine, CheckCircle2, ArrowUpDown, ChevronLeft, 
  ChevronRight, History, DollarSign, Trash2, AlertOctagon, ChevronDown, Calendar, Hash
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { ProfileModal } from '../ProfileModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

export function PharmacistPortal({ onSignOut }: { onSignOut: () => void }) {
  // =========================
  // 1. STATE MANAGEMENT
  // =========================
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'expiry' | 'addStock'>('inventory');
  
  // Batch Inspector State
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Data States
  const [user, setUser] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [pendingRxList, setPendingRxList] = useState<any[]>([]);
  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  
  // --- PAGINATION STATES ---
  // Inventory (Existing)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 
  
  // Dispensing History (UPDATED LIMIT)
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 13; 

  // Expiry Tracking (UPDATED LIMIT)
  const [expiryPage, setExpiryPage] = useState(1);
  const expiryPerPage = 10; 

  // Sorting
  const [sortOption, setSortOption] = useState('name-asc');

  // Dialog Visibility
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [showRestockMode, setShowRestockMode] = useState(false);
  const [showDispenseScanner, setShowDispenseScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDisposeDialog, setShowDisposeDialog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); 
  
  // Selected Data
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPrescriptionGroup, setSelectedPrescriptionGroup] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Loaders
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Scanner States
  const [scanInput, setScanInput] = useState('');
  const [scannedItems, setScannedItems] = useState<number[]>([]); 
  const [restockInput, setRestockInput] = useState('');
  const [scanHistory, setScanHistory] = useState<Array<{ barcode: string, name: string, count: number, status: 'success' | 'error', time: string }>>([]);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [newItemData, setNewItemData] = useState({
    DrugName: '', BarcodeID: '', Category: '', UnitPrice: '', QuantityInStock: '', MinStockLevel: '', ExpiryDate: ''
  });
  
  const [reorderFormData, setReorderFormData] = useState({
    quantity: '', supplier: '', urgency: 'medium', notes: ''
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // 📋 Full List of Drug Categories (Matches Database ENUM)
  const drugCategories = [
    "Analgesic/Antipyretic", "NSAID", "Antiplatelet/Analgesic", "Antibiotic", "Statin", 
    "ACE Inhibitor", "Beta Blocker", "Calcium Channel Blocker", "Antidiabetic", "Sulfonylurea", 
    "Insulin", "Bronchodilator", "Leukotriene Receptor Antagonist", "Antihistamine", 
    "Proton Pump Inhibitor", "H2 Blocker", "Antidiarrheal", "SSRI", "Benzodiazepine", 
    "Antipsychotic", "Emergency Drug", "Opioid Antagonist", "Topical Steroid", 
    "Topical Antibiotic", "Vitamin Supplement", "Macrolide Antibiotic", "Fluoroquinolone", 
    "Opioid Analgesic", "Anticonvulsant/Analgesic", "Anticoagulant", "Antiplatelet", 
    "Antiemetic", "Corticosteroid", "DPP-4 Inhibitor", "Diuretic", "Antifungal", 
    "Acne Treatment", "Antibiotic (Pediatric)", "Analgesic (Pediatric)", "Sedative", 
    "General", "Supplement", "Antiviral", "Antimalarial", "Anesthetic", "Muscle Relaxant", 
    "Immunosuppressant", "Chemotherapy", "Hormone Replacement", "Contraceptive", "Laxative", 
    "Decongestant", "Expectorant", "Vaccine", "Antiseptic", "Barbiturate", "Stimulant", 
    "Bisphosphonate", "Ophthalmic Agent", "Otic Agent", "Nasal Preparation"
  ].sort(); // Sorts them A-Z automatically

  // =========================
  // 2. EFFECTS
  // =========================

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser({ id: 14, name: 'Dev Pharmacist', role: 'pharmacist', email: 'pharmacy@clinic.com' });
  }, []);

  useEffect(() => { 
      fetchInventory(); 
      if (activeTab === 'expiry') fetchExpiringDrugs();
  }, [activeTab]);

  useEffect(() => { 
    fetchPendingRx(); 
    fetchDispensingHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedItem && showReorder) {
      setReorderFormData({
        quantity: (selectedItem.minStock * 2).toString(),
        supplier: '',
        urgency: selectedItem.status === 'critical' ? 'critical' : 'medium',
        notes: ''
      });
    }
  }, [selectedItem, showReorder]);

  // =========================
  // 3. API FETCHING
  // =========================

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/drugs');
      const data = await response.json();
      if (Array.isArray(data)) {
        const formattedData = data.map((drug: any) => {
           const stock = Number(drug.QuantityInStock) || 0;
           const minStock = Number(drug.MinStockLevel) || 10;
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
    } catch (error) { console.error(error); } 
    finally { setLoadingInventory(false); }
  };

  const handleSignOut = () => {
    onSignOut(); 
  };

  const fetchPendingRx = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/pharmacist/pending-rx', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setPendingRxList(data);
      else setPendingRxList([]);
    } catch (error) {
      console.error("Error loading RX:", error);
      setPendingRxList([]);
    }
  };

  const fetchDispensingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/pharmacist/dispensing-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setDispensingHistory(data);
      }
    } catch (error) { console.error(error); }
  };

  const fetchExpiringDrugs = async () => {
      try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3001/api/pharmacist/expiring', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (Array.isArray(data)) setExpiringItems(data);
      } catch (error) { console.error(error); }
  };

  const toggleRow = async (drugId: number) => {
    if (expandedRowId === drugId) {
        setExpandedRowId(null);
        return;
    }
    
    setExpandedRowId(drugId);
    setLoadingBatches(true);
    setBatchDetails([]);

    try {
        const response = await fetch(`http://localhost:3001/api/drug/${drugId}/batches`);
        if (response.ok) {
            const data = await response.json();
            setBatchDetails(data);
        } else {
            setBatchDetails([]); 
        }
    } catch (error) {
        console.error("Failed to fetch batches", error);
    } finally {
        setLoadingBatches(false);
    }
  };

  // =========================
  // 4. HANDLERS
  // =========================

  const handleDisposeItem = async () => {
      if (!selectedItem) return;
      try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3001/api/pharmacist/dispose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                  drugId: selectedItem.id,
                  batchId: selectedItem.batchId,
                  quantity: selectedItem.stock, 
                  reason: 'Expired'
              })
          });
          
          if (response.ok) {
              alert(`✅ Successfully disposed ${selectedItem.stock} units of ${selectedItem.name}`);
              setShowDisposeDialog(false);
              fetchExpiringDrugs(); 
              fetchInventory();     
          } else {
              alert("❌ Failed to dispose item");
          }
      } catch (error) { console.error(error); }
  };

  const handleDispenseScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = scanInput.trim();
      if (!barcode || !selectedPrescriptionGroup) return;

      const match = selectedPrescriptionGroup.items?.find((item: any) => {
        const itemBarcode = String(item.barcode).trim();
        const scanned = String(barcode).trim();
        return itemBarcode === scanned && (item.quantity - (item.dispensedCount || 0)) > 0;
      });

      if (match) {
        try {
           const token = localStorage.getItem('token');
           const response = await fetch('http://localhost:3001/api/pharmacist/scan-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ itemId: match.itemId, barcode: barcode })
           });

           if (response.ok) {
               const updatedItems = selectedPrescriptionGroup.items.map((i: any) => {
                   if (i.itemId === match.itemId) return { ...i, dispensedCount: (i.dispensedCount || 0) + 1 };
                   return i;
               });
               setSelectedPrescriptionGroup({ ...selectedPrescriptionGroup, items: updatedItems });
               setScanInput('');
               fetchInventory();
               fetchPendingRx();
           } else {
               const err = await response.json();
               alert(`❌ Error: ${err.error}`);
           }
        } catch (err) { console.error(err); }
      } else {
          alert("⚠️ Invalid Barcode or Item already filled!");
      }
      setScanInput('');
    }
  };

  const handleRegisterDrug = async () => {
    if (!newItemData.DrugName || !newItemData.BarcodeID) return alert('⚠️ Name & Barcode required!');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/drug/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...newItemData,
          UnitPrice: parseFloat(newItemData.UnitPrice) || 0,
          QuantityInStock: parseInt(newItemData.QuantityInStock) || 0,
          MinStockLevel: parseInt(newItemData.MinStockLevel) || 10,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('✅ Added!');
        setShowAddItem(false);
        setNewItemData({ DrugName: '', BarcodeID: '', Category: '', UnitPrice: '', QuantityInStock: '', MinStockLevel: '', ExpiryDate: '' });
        fetchInventory();
      } else { alert('❌ ' + data.error); }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleSubmitReorder = async () => {
    setIsReordering(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/drug-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          drugId: selectedItem.id,
          quantity: parseInt(reorderFormData.quantity),
          urgency: reorderFormData.urgency,
          supplier: reorderFormData.supplier,
          reason: reorderFormData.notes,
          requestedBy: user?.id || 14
        }),
      });
      if (response.ok) {
        alert("✅ Request sent!");
        setShowReorder(false);
      }
    } catch (error) { console.error(error); } 
    finally { setIsReordering(false); }
  };

  const handleRestockScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = restockInput.trim();
      if (!barcode) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/drug/restock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ BarcodeID: barcode }),
        });
        const data = await response.json();
        const timestamp = new Date().toLocaleTimeString();
        
        setScanHistory(prev => {
           const existingItemIndex = prev.findIndex(item => item.barcode === barcode);
           if (existingItemIndex !== -1) {
               const updatedItem = {
                   ...prev[existingItemIndex],
                   count: prev[existingItemIndex].count + 1,
                   time: timestamp,
                   status: response.ok ? 'success' : 'error'
               };
               const newHistory = prev.filter((_, idx) => idx !== existingItemIndex);
               return [updatedItem as any, ...newHistory];
           } else {
               const newItem = {
                   barcode,
                   name: response.ok ? data.drug?.DrugName : `Unknown (${barcode})`,
                   count: 1,
                   status: response.ok ? 'success' : 'error',
                   time: timestamp
               };
               return [newItem, ...prev] as any;
           }
        });
        if (response.ok) fetchInventory();
      } catch (error) { console.error(error); }
      setRestockInput('');
    }
  };

  // =========================
  // 5. HELPER DATA & PAGINATION
  // =========================
  
  // Inventory Helper
  const filteredInventory = inventoryItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'stock-asc') return a.stock - b.stock;
    return 0;
  });
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const paginatedInventory = sortedInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const lowStockItems = inventoryItems.filter(item => item.status === 'low' || item.status === 'critical');

  // ⚡ Expiry Pagination Logic
  const totalExpiryPages = Math.ceil(expiringItems.length / expiryPerPage);
  const paginatedExpiryItems = expiringItems.slice((expiryPage - 1) * expiryPerPage, expiryPage * expiryPerPage);

  // ⚡ Dispensing History Pagination Logic
  const totalHistoryPages = Math.ceil(dispensingHistory.length / historyPerPage);
  const paginatedHistory = dispensingHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);
  
  const pharmacistProfile = {
    name: user?.name || 'Loading...',
    id: user?.id || 0,
    role: 'Pharmacist',
    phone: '+1 (555) 678-9012', 
    department: 'Pharmacy', 
    joinDate: 'March 2019',
    specialization: 'Clinical Pharmacy',
    certifications: ['Licensed Pharmacist', 'Immunization Certified'],
    initials: user?.name ? user.name.substring(0, 2).toUpperCase() : 'PH',
    email: user?.email || 'pharmacy@clinic.com'
  };

  const isPrescriptionComplete = selectedPrescriptionGroup?.items?.every((i:any) => (i.dispensedCount || 0) >= i.quantity);
  const criticalExpiry = expiringItems.filter(i => i.daysLeft <= 30);
  const warningExpiry = expiringItems.filter(i => i.daysLeft > 30 && i.daysLeft <= 90);

  // =========================
  // 6. RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center"><Pill className="size-6 text-white" /></div>
            <div><h1 className="text-xl text-gray-900">Pharmacist Portal</h1><p className="text-sm text-gray-500">Inventory & Medication Management</p></div>
          </div>
          <div className="flex items-center gap-4">
             <Avatar className="cursor-pointer" onClick={() => setShowProfile(true)}><AvatarFallback className="bg-purple-600 text-white">{pharmacistProfile.initials}</AvatarFallback></Avatar>
             <Button 
                variant="destructive"
                onClick={() => setShowLogoutConfirm(true)}
                className="hover:bg-red-700 transition-colors"
              >
                <LogOut className="size-4 mr-2" />
                Log Out
              </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex gap-2 border-b">
            {['inventory', 'prescriptions', 'expiry', 'addStock'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 border-b-2 capitalize flex items-center gap-2 ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600'}`}>
                    {tab === 'inventory' && <Package className="size-4" />}
                    {tab === 'prescriptions' && <Pill className="size-4" />}
                    {tab === 'expiry' && <AlertTriangle className="size-4" />}
                    {tab === 'addStock' && <PackagePlus className="size-4" />}
                    {tab === 'addStock' ? '+ Add Stock' : tab}
                </button>
            ))}
          </div>

          {/* TAB 1: INVENTORY (WITH BATCH INSPECTOR) */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 h-fit">
                <CardHeader>
                  <div className="flex justify-between">
                    <div><CardTitle>Medication Inventory</CardTitle><CardDescription>Click a row to see batch details</CardDescription></div>
                    <div className="flex gap-2">
                        {/* ... inside activeTab === 'inventory' -> CardHeader ... */}
                    
                    <div className="flex gap-2">
                        {/* SEARCH BAR */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input 
                                placeholder="Search name..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="pl-10 w-64" 
                            />
                        </div>

                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-[140px]">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name A-Z</SelectItem>
                                <SelectItem value="stock-asc">Stock Low-High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-8"></TableHead><TableHead>Medication</TableHead><TableHead>Location</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                          {loadingInventory ? (
                             <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin size-6 mx-auto" /></TableCell></TableRow>
                          ) : paginatedInventory.map(item => (
                              <React.Fragment key={item.id}>
                                  <TableRow 
                                    className={`cursor-pointer transition-colors ${expandedRowId === item.id ? 'bg-purple-50 hover:bg-purple-50 border-b-0' : 'hover:bg-gray-50'}`}
                                    onClick={() => toggleRow(item.id)}
                                  >
                                      <TableCell>{expandedRowId === item.id ? <ChevronDown className="size-4 text-purple-600" /> : <ChevronRight className="size-4 text-gray-400" />}</TableCell>
                                      <TableCell><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{item.category}</p></TableCell>
                                      <TableCell><Badge variant="outline">{item.location}</Badge></TableCell>
                                      <TableCell><span className="font-mono font-medium">{item.stock}</span></TableCell>
                                      <TableCell><Badge className={item.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{item.status}</Badge></TableCell>
                                      <TableCell><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowEditItem(true); }}>Edit</Button></TableCell>
                                  </TableRow>
                                  {expandedRowId === item.id && (
                                      <TableRow className="bg-purple-50 hover:bg-purple-50">
                                          <TableCell colSpan={6} className="p-0">
                                              <div className="p-4 pl-12 border-b border-purple-100 animate-in slide-in-from-top-2 duration-200">
                                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-800 mb-3 flex items-center gap-2"><Package className="size-3" /> Batch Breakdown</h4>
                                                  {loadingBatches ? (
                                                      <div className="flex items-center gap-2 text-sm text-purple-600"><Loader2 className="size-4 animate-spin" /> Loading batches...</div>
                                                  ) : batchDetails.length > 0 ? (
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                          {batchDetails.map((batch: any, idx: number) => (
                                                              <div key={idx} className="bg-white border border-purple-200 rounded-md p-3 shadow-sm">
                                                                  <div className="flex justify-between items-start mb-2"><Badge variant="outline" className="font-mono text-[10px] bg-gray-50">BATCH #{batch.BatchID}</Badge><span className="font-bold text-sm text-purple-700">x{batch.Quantity}</span></div>
                                                                  <div className="space-y-1 text-xs text-gray-600"><div className="flex items-center gap-2"><Calendar className="size-3 text-gray-400" /> Exp: {new Date(batch.ExpiryDate).toLocaleDateString()}</div><div className="flex items-center gap-2"><Hash className="size-3 text-gray-400" /> {batch.BarcodeID || 'No Barcode'}</div></div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  ) : (<p className="text-sm text-gray-500 italic">No specific batches found. Stock is untracked.</p>)}
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                  )}
                              </React.Fragment>
                          ))}
                        </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between mt-4">
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="size-4 mr-2" /> Prev</Button>
                      <span className="text-sm text-gray-500 pt-2">Page {currentPage} of {totalPages}</span>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <ChevronRight className="size-4 ml-2" /></Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Prescription Card */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader className="flex flex-row justify-between"><div><CardTitle>Pending Prescription</CardTitle><CardDescription>Queue to fulfill</CardDescription></div><Button variant="ghost" size="sm" onClick={fetchPendingRx}><RefreshCw className="size-4" /></Button></CardHeader>
                <CardContent className="space-y-4">
                    {pendingRxList.map((group: any) => (
                        <div key={group.prescriptionId} className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="flex justify-between mb-2"><span className="font-bold">{group.patient}</span><Badge>{group.items?.length} Items</Badge></div>
                            <div className="mb-4 space-y-2">
                                {group.items?.map((item: any) => (
                                    <div key={item.itemId} className="flex justify-between text-sm"><span className="text-gray-700 font-medium">{item.medication}</span><span className="text-gray-500">x{item.quantity}</span></div>
                                ))}
                            </div>
                            <Button className="w-full bg-purple-600" onClick={() => { setSelectedPrescriptionGroup(group); setScannedItems([]); setShowDispenseScanner(true); setTimeout(() => scanInputRef.current?.focus(), 100); }}>Prepare & Scan</Button>
                        </div>
                    ))}
                    {pendingRxList.length === 0 && <p className="text-gray-500 text-center">No pending prescriptions</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: PRESCRIPTIONS (PAGINATED) */}
          {activeTab === 'prescriptions' && (
            <Card>
                <CardHeader><CardTitle>Dispensing History</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {paginatedHistory.map((rec, i) => (
                            <div key={i} className="flex justify-between p-3 border rounded hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-gray-900">{rec.patient} <span className="font-normal text-gray-500">-</span> {rec.medication} <span className="font-bold text-purple-700">(x{rec.quantity})</span></p>
                                <Badge variant="outline">{new Date(rec.date).toLocaleDateString()}</Badge>
                            </div>
                        ))}
                        {paginatedHistory.length === 0 && <p className="text-gray-500 text-center py-8">No history available.</p>}
                    </div>
                    {/* History Pagination Controls */}
                    <div className="flex justify-between mt-6 pt-4 border-t">
                        <Button size="sm" variant="outline" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}><ChevronLeft className="size-4 mr-2" /> Prev</Button>
                        <span className="text-sm text-gray-500 pt-2">Page {historyPage} of {totalHistoryPages || 1}</span>
                        <Button size="sm" variant="outline" onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages || totalHistoryPages === 0}>Next <ChevronRight className="size-4 ml-2" /></Button>
                    </div>
                </CardContent>
            </Card>
          )}

          {/* TAB 3: EXPIRY TRACKING (PAGINATED) */}
          {activeTab === 'expiry' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-red-50 border-red-100">
                        <CardHeader className="pb-2"><CardTitle className="text-red-600 text-lg flex items-center gap-2"><AlertOctagon className="size-5" /> Critical (30 Days)</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold text-red-700">{criticalExpiry.length} Items</p><p className="text-xs text-red-500">Action: Remove from shelf immediately</p></CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-100">
                        <CardHeader className="pb-2"><CardTitle className="text-orange-600 text-lg flex items-center gap-2"><AlertTriangle className="size-5" /> Warning (90 Days)</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold text-orange-700">{warningExpiry.length} Items</p><p className="text-xs text-orange-500">Action: Plan for disposal or priority use</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-gray-600 text-lg flex items-center gap-2"><CheckCircle2 className="size-5" /> Good Standing</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold text-gray-700">{inventoryItems.length - expiringItems.length} Items</p><p className="text-xs text-gray-500">Safe for dispensing</p></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Expiring Inventory</CardTitle><CardDescription>Batches expiring within the next 3 months</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Medication</TableHead><TableHead>Stock</TableHead><TableHead>Expiry Date</TableHead><TableHead>Days Left</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedExpiryItems.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.stock}</TableCell>
                                        <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant={item.daysLeft <= 30 ? "destructive" : "default"} className={item.daysLeft > 30 ? "bg-orange-500" : ""}>{item.daysLeft <= 0 ? "EXPIRED" : `${item.daysLeft} Days`}</Badge></TableCell>
                                        <TableCell><Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setShowDisposeDialog(true); }}><Trash2 className="size-4 mr-2" /> Dispose</Button></TableCell>
                                    </TableRow>
                                ))}
                                {paginatedExpiryItems.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No items expiring soon. Good job!</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                        {/* Expiry Pagination Controls */}
                        <div className="flex justify-between mt-4">
                            <Button size="sm" variant="outline" onClick={() => setExpiryPage(p => Math.max(1, p - 1))} disabled={expiryPage === 1}><ChevronLeft className="size-4 mr-2" /> Prev</Button>
                            <span className="text-sm text-gray-500 pt-2">Page {expiryPage} of {totalExpiryPages || 1}</span>
                            <Button size="sm" variant="outline" onClick={() => setExpiryPage(p => Math.min(totalExpiryPages, p + 1))} disabled={expiryPage === totalExpiryPages || totalExpiryPages === 0}>Next <ChevronRight className="size-4 ml-2" /></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}

          {/* TAB 4: ADD STOCK */}
          {activeTab === 'addStock' && (
            <div className="max-w-6xl mx-auto space-y-8 pt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="hover:border-purple-400 cursor-pointer transition-all hover:shadow-lg py-8" onClick={() => setShowAddItem(true)}>
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-purple-100 p-4 rounded-full mb-6 w-20 h-20 flex items-center justify-center"><Plus className="size-10 text-purple-600" /></div>
                    <CardTitle className="text-2xl">Register New Drug</CardTitle>
                    <CardDescription className="text-md mt-2">Add a new item to the database</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg py-8" onClick={() => setShowRestockMode(true)}>
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-4 rounded-full mb-6 w-20 h-20 flex items-center justify-center"><PackagePlus className="size-10 text-blue-600" /></div>
                    <CardTitle className="text-2xl">Restock Scanner</CardTitle>
                    <CardDescription className="text-md mt-2">Scan barcodes to add +1 stock</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <div className="mt-24"> 
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2"><History className="size-4" /> Recent Restock Activity</CardTitle></CardHeader>
                  <CardContent>
                    {scanHistory.length > 0 ? (
                      <div className="space-y-2">
                        {scanHistory.map((log, i) => (
                           <div key={i} className="flex justify-between items-center p-3 border-b last:border-0 bg-white rounded mb-1 shadow-sm">
                              <span className="font-medium text-gray-700">{log.name}</span>
                              {log.status === 'success' ? <Badge className="bg-green-600 hover:bg-green-700">+{log.count}</Badge> : <Badge variant="destructive">Failed</Badge>}
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed"><PackagePlus className="size-10 mx-auto mb-2 opacity-20" /><p>No recent restock activity in this session.</p></div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && activeTab === 'inventory' && (
            <Card className="border-orange-200 bg-orange-50 mt-6">
              <CardHeader><CardTitle className="flex items-center gap-2 text-orange-900"><AlertTriangle className="size-5" /> Low Stock Alerts</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-orange-200 rounded-lg">
                      <p className="text-sm text-gray-900 font-bold">{item.name}</p>
                      <p className="text-xs text-gray-500 mb-2">Stock: {item.stock} / Min: {item.minStock}</p>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => { setSelectedItem(item); setShowReorder(true); }}>Reorder</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* === MODALS === */}
      
      {/* 1. DISPOSE DIALOG */}
      <Dialog open={showDisposeDialog} onOpenChange={setShowDisposeDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 /> Confirm Disposal</DialogTitle>
                  <DialogDescription>
                      You are about to dispose of <strong>{selectedItem?.stock} units</strong> of <strong>{selectedItem?.name}</strong>.
                      <br /><br />
                      This action is irreversible and will remove the items from inventory.
                  </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDisposeDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDisposeItem}>Confirm Disposal</Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* 2. DISPENSE SCANNER (FIXED WIDTH & TEXT) */}
      <Dialog open={showDispenseScanner} onOpenChange={setShowDispenseScanner}>
        {/* FIX: Used 'sm:max-w-6xl' to override the default responsive width. 
            Added 'w-full' to ensure it stretches.
        */}
        <DialogContent className="sm:max-w-6xl w-full"> 
            <DialogHeader>
                <DialogTitle className="flex justify-between items-center text-xl">
                    <span>Dispensing for {selectedPrescriptionGroup?.patient}</span>
                    {isPrescriptionComplete && <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 mr-8">READY TO FINISH</Badge>}
                </DialogTitle>
                <DialogDescription>Scan medication barcodes to verify and deduct stock.</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 py-6">
                <div className="flex flex-col gap-4">
                    <div className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors ${isPrescriptionComplete ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
                        <ScanLine className={`size-16 mb-4 ${isPrescriptionComplete ? 'text-green-600' : 'text-gray-400 animate-pulse'}`} />
                        {!isPrescriptionComplete ? (
                            <div className="w-full max-w-xs text-center"><Input ref={scanInputRef} value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={handleDispenseScan} placeholder="Click here & Scan Barcode" className="text-center font-mono text-lg h-12 border-2 border-blue-200 focus:border-blue-500" autoFocus /><p className="text-xs text-gray-500 mt-3">Ensure cursor is in the box to scan</p></div>
                        ) : (
                            <div className="text-center"><h3 className="text-2xl font-bold text-green-700 mb-2">All Items Scanned!</h3><p className="text-green-600">Stock has been deducted from inventory.</p></div>
                        )}
                    </div>
                </div>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b text-sm font-semibold text-gray-600">Prescription Items</div>
                    <div className="divide-y max-h-[450px] overflow-y-auto">
                        {selectedPrescriptionGroup?.items?.map((item: any) => {
                            const dispensed = item.dispensedCount || 0;
                            const total = item.quantity;
                            const remaining = total - dispensed;
                            const isItemComplete = remaining <= 0;
                            return (
                                <div key={item.itemId} className={`p-4 flex items-center justify-between transition-colors ${isItemComplete ? 'bg-green-50' : 'bg-white'}`}>
                                    <div className="flex items-center gap-4 w-full">
                                        {/* Status Icon */}
                                        {isItemComplete ? (
                                            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                                                <CheckCircle2 className="size-6 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="size-10 rounded-full border-2 border-purple-200 bg-purple-50 flex-shrink-0 flex items-center justify-center text-purple-700 font-bold">
                                                {remaining}
                                            </div>
                                        )}

                                        {/* Detailed Info Column */}
                                        <div className="flex-1">
                                            <p className={`font-bold text-base ${isItemComplete ? 'text-green-800' : 'text-gray-900'}`}>
                                                {item.medication}
                                            </p>

                                            {/* Prescription Instructions Box */}
                                            <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 bg-gray-50/80 p-2 rounded border border-gray-100">
                                                <div>
                                                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Dosage</span>
                                                    <p className="font-medium text-gray-800">{item.dosage || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Qty</span>
                                                    <p className="font-medium text-gray-800">{item.quantity} Units</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Instructions</span>
                                                    <p className="font-medium text-gray-800">
                                                        {item.frequency || 'Daily'} • {item.duration || '7 days'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Scan Status Text - UPDATED FORMAT */}
                                            <p className="text-[10px] text-gray-400 mt-1 pl-1">
                                                {isItemComplete ? "Dispensing Complete" : `Waiting for scan... ${dispensed}/${total} scanned`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDispenseScanner(false)}>{isPrescriptionComplete ? "Close" : "Cancel"}</Button>
                {isPrescriptionComplete && <Button className="bg-green-600 hover:bg-green-700 px-6" onClick={() => { setShowDispenseScanner(false); fetchPendingRx(); fetchDispensingHistory(); }}>Finish</Button>}
            </div>
        </DialogContent>
      </Dialog>

      {/* 3. ADD ITEM DIALOG */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Add New Medication</DialogTitle><DialogDescription>Register a new item to the inventory database.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Medication Name</Label><Input value={newItemData.DrugName} onChange={(e) => setNewItemData({...newItemData, DrugName: e.target.value})} autoFocus placeholder="e.g. Paracetamol 500mg" /></div>
            <div className="grid gap-2"><Label>Barcode</Label><div className="relative"><ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input className="pl-10" value={newItemData.BarcodeID} onChange={(e) => setNewItemData({...newItemData, BarcodeID: e.target.value})} placeholder="Scan barcode..." /></div></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2"><Label>Stock</Label><div className="relative"><Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input className="pl-10" type="number" value={newItemData.QuantityInStock} onChange={(e) => setNewItemData({...newItemData, QuantityInStock: e.target.value})} placeholder="0" /></div></div>
              <div className="grid gap-2"><Label>Min Qty</Label><div className="relative"><AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input className="pl-10" type="number" value={newItemData.MinStockLevel} onChange={(e) => setNewItemData({...newItemData, MinStockLevel: e.target.value})} placeholder="10" /></div></div>
              <div className="grid gap-2"><Label>Price</Label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input className="pl-10" type="number" value={newItemData.UnitPrice} onChange={(e) => setNewItemData({...newItemData, UnitPrice: e.target.value})} placeholder="0.00" /></div></div>
            </div>
            <div className="grid gap-2 relative">
              <Label>Category</Label>
              
              {/* 1. THE TRIGGER BUTTON (Looks like a Select input) */}
              <Button 
                variant="outline" 
                role="combobox"
                className="w-full justify-between bg-white font-normal text-left"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setCategorySearch(""); // Reset search when opening
                }}
              >
                {newItemData.Category ? newItemData.Category : <span className="text-gray-500">Select category</span>}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {/* 2. THE DROPDOWN MENU (Appears when open) */}
              {isCategoryOpen && (
                <>
                  {/* Invisible Overlay to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsCategoryOpen(false)}
                  />

                  {/* The Actual Dropdown Box */}
                  <div className="absolute top-full mt-1 w-full z-50 rounded-md border bg-white shadow-md">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        autoFocus
                        className="h-8"
                      />
                    </div>
                    
                    {/* Scrollable List */}
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {drugCategories
                        .filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((category) => (
                          <div
                            key={category}
                            className={`
                              cursor-pointer px-2 py-1.5 text-sm rounded-sm hover:bg-purple-50 hover:text-purple-900
                              ${newItemData.Category === category ? 'bg-purple-100 text-purple-900 font-medium' : 'text-gray-900'}
                            `}
                            onClick={() => {
                              setNewItemData({ ...newItemData, Category: category });
                              setIsCategoryOpen(false);
                            }}
                          >
                            {category}
                          </div>
                        ))}

                      {/* No Results State */}
                      {drugCategories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <p className="p-2 text-sm text-gray-400 text-center">No category found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            </div>
          <DialogFooter><Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleRegisterDrug} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{isSubmitting ? 'Registering...' : 'Register Item'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. REORDER DIALOG */}
      <Dialog open={showReorder} onOpenChange={setShowReorder}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reorder Stock</DialogTitle><DialogDescription>Request more stock for {selectedItem?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
             <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={reorderFormData.quantity} onChange={(e) => setReorderFormData({...reorderFormData, quantity: e.target.value})} /></div>
             <div className="space-y-2"><Label>Urgency</Label>
               <Select value={reorderFormData.urgency} onValueChange={(val) => setReorderFormData({...reorderFormData, urgency: val})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select>
             </div>
             <div className="space-y-2"><Label>Supplier</Label>
                <Select value={reorderFormData.supplier} onValueChange={(val) => setReorderFormData({...reorderFormData, supplier: val})}><SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger><SelectContent><SelectItem value="MedPlus">MedPlus</SelectItem><SelectItem value="PharmaDirect">PharmaDirect</SelectItem></SelectContent></Select>
             </div>
             <div className="space-y-2"><Label>Notes</Label><Textarea value={reorderFormData.notes} onChange={(e) => setReorderFormData({...reorderFormData, notes: e.target.value})} /></div>
             <Button className="w-full bg-purple-600" onClick={handleSubmitReorder} disabled={isReordering}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. RESTOCK DIALOG */}
      <Dialog open={showRestockMode} onOpenChange={setShowRestockMode}>
        <DialogContent>
           <DialogHeader><DialogTitle>Rapid Restock Mode</DialogTitle><DialogDescription>Scan items to add +1 stock instantly</DialogDescription></DialogHeader>
           <div className="py-4 space-y-4">
              <Input autoFocus value={restockInput} onChange={(e) => setRestockInput(e.target.value)} onKeyDown={handleRestockScan} placeholder="Scan item..." className="text-center text-lg h-12" />
              <div className="h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                  {scanHistory.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No items scanned yet.</p>}
                  {scanHistory.map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-3 border-b last:border-0 bg-white rounded mb-1 shadow-sm">
                          <span className="font-medium text-gray-700">{log.name}</span>
                          {log.status === 'success' ? <Badge className="bg-green-600 hover:bg-green-700">+{log.count}</Badge> : <Badge variant="destructive">Failed</Badge>}
                      </div>
                  ))}
              </div>
           </div>
           <Button className="w-full" onClick={() => setShowRestockMode(false)}>Finish</Button>
        </DialogContent>
      </Dialog>

      {/* 6. EDIT DIALOG */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
         <DialogContent>
            <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
               <Label>Current Stock</Label>
               <Input type="number" defaultValue={selectedItem?.stock} />
               <Button className="w-full" onClick={() => { alert("Updated!"); setShowEditItem(false); }}>Update</Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* 7. RECEIPT DIALOG */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
         <DialogContent><DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader><p>Receipt printing...</p></DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog - Ensure you have this since showLogoutConfirm is used */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSignOut}>Log Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileModal open={showProfile} onOpenChange={setShowProfile} profile={pharmacistProfile} />
    </div>
  );
}