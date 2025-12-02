import { useState } from 'react';
import { Search, Bell, LogOut, Pill, Package, TrendingDown, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { NotificationPanel } from './NotificationPanel';
import { ProfileModal } from './ProfileModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

export function PharmacistPortal({ onSignOut }: { onSignOut: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'expiry'>('inventory');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showEditItem, setShowEditItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showReorder, setShowReorder] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const pharmacistProfile = {
    name: 'Robert Wilson',
    role: 'Pharmacist',
    department: 'Pharmacy',
    email: 'robert.wilson@clinic.com',
    phone: '+1 (555) 678-9012',
    initials: 'RW',
    joinDate: 'March 2019',
    specialization: 'Clinical Pharmacy',
    certifications: ['Licensed Pharmacist', 'Immunization Certified', 'MTM Certified']
  };

  const inventory = [
    { id: 1, name: 'Amoxicillin 500mg', stock: 450, minStock: 200, status: 'good', location: 'A-12' },
    { id: 2, name: 'Paracetamol 500mg', stock: 180, minStock: 300, status: 'low', location: 'B-05' },
    { id: 3, name: 'Ibuprofen 400mg', stock: 520, minStock: 250, status: 'good', location: 'A-15' },
    { id: 4, name: 'Lisinopril 10mg', stock: 75, minStock: 150, status: 'critical', location: 'C-08' },
    { id: 5, name: 'Metformin 850mg', stock: 340, minStock: 200, status: 'good', location: 'B-12' },
    { id: 6, name: 'Omeprazole 20mg', stock: 165, minStock: 200, status: 'low', location: 'C-03' }
  ];

  const pendingPrescriptions = [
    { id: 1, patient: 'John Smith', doctor: 'Dr. Johnson', medication: 'Amoxicillin 500mg', quantity: 30, status: 'pending' },
    { id: 2, patient: 'Emma Davis', doctor: 'Dr. Chen', medication: 'Paracetamol 500mg', quantity: 20, status: 'ready' },
    { id: 3, patient: 'Robert Wilson', doctor: 'Dr. Brown', medication: 'Ibuprofen 400mg', quantity: 40, status: 'pending' }
  ];

  const expiringMeds = [
    { name: 'Aspirin 100mg', stock: 200, location: 'A-10', expiryDate: '2024-12-15', daysLeft: 29 },
    { name: 'Cough Syrup', stock: 45, location: 'B-08', expiryDate: '2024-11-30', daysLeft: 14 },
    { name: 'Vitamin C 500mg', stock: 150, location: 'C-05', expiryDate: '2025-01-10', daysLeft: 55 }
  ];

  const dispensingHistory = [
    { patient: 'John Smith', medication: 'Lisinopril 10mg', quantity: 30, date: '2024-11-16 09:30' },
    { patient: 'Emma Davis', medication: 'Amoxicillin 500mg', quantity: 21, date: '2024-11-16 10:15' },
    { patient: 'Sarah Johnson', medication: 'Metformin 850mg', quantity: 60, date: '2024-11-16 11:00' }
  ];

  const lowStockItems = inventory.filter(item => item.status === 'low' || item.status === 'critical');

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <AvatarFallback className="bg-purple-600 text-white">PH</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm text-gray-900">Robert Wilson</p>
                <p className="text-xs text-gray-500">Pharmacist</p>
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
          </div>

          {activeTab === 'inventory' && (
            <>
              {/* Inventory Management */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Medication Inventory</CardTitle>
                      <CardDescription>Current stock levels</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          placeholder="Search medication..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddItem(true)}>
                        <Plus className="size-4 mr-2" />
                        Add Item
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
                        {filteredInventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="text-sm text-gray-900">{item.name}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.location}</Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-900">{item.stock} units</p>
                              <p className="text-xs text-gray-500">Min: {item.minStock}</p>
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

              {/* Pending Prescriptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Prescriptions</CardTitle>
                  <CardDescription>Prescriptions to fulfill</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingPrescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm text-gray-900">{prescription.patient}</p>
                            <p className="text-xs text-gray-500">{prescription.doctor}</p>
                          </div>
                          <Badge
                            variant={prescription.status === 'ready' ? 'default' : 'secondary'}
                            className={
                              prescription.status === 'ready'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }
                          >
                            {prescription.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{prescription.medication}</p>
                        <p className="text-xs text-gray-500 mb-3">Qty: {prescription.quantity}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          variant={prescription.status === 'ready' ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setShowDispense(true);
                          }}
                        >
                          {prescription.status === 'ready' ? 'Dispense' : 'Prepare'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
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

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>Add a new item to the pharmacy inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Medication Name</Label>
              <Input id="med-name" placeholder="e.g., Amoxicillin 500mg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input id="stock" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-stock">Minimum Stock</Label>
                <Input id="min-stock" type="number" placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input id="location" placeholder="e.g., A-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antibiotic">Antibiotic</SelectItem>
                  <SelectItem value="analgesic">Analgesic</SelectItem>
                  <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                  <SelectItem value="diabetes">Diabetes</SelectItem>
                  <SelectItem value="respiratory">Respiratory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">Unit Price ($)</Label>
                <Input id="unit-price" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                Add Medication
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
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
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

      {/* Reorder Dialog */}
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
                  alert('Reorder placed successfully!');
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
    </div>
  );
}
