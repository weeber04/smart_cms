import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { useAuth } from '../../contexts/AuthContext'; 
import { Loader2, AlertCircle } from 'lucide-react'; 

type Status = 'pending' | 'approved' | 'rejected';

type DrugRequest = {
  id: number;
  drugName: string;
  quantity: number;
  pharmacist: string;
  reason: string;
  status: Status;
  urgency?: string;
  category?: string;
  stock?: number;
  date?: string;
  supplier?: string;
};

export function DrugRequestsSection() {
  const [activeTab, setActiveTab] = useState<Status>('pending');
  const [requests, setRequests] = useState<DrugRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDrugRequests();
  }, [activeTab]);

  const fetchDrugRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/drug-requests?status=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch drug requests');
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (error: any) {
      console.error('Error fetching drug requests:', error);
      setError(error.message);
      // Fallback to sample data if API fails
      setRequests([
        {
          id: 1,
          drugName: 'Paracetamol 500mg',
          quantity: 500,
          pharmacist: 'Robert Wilson',
          reason: 'Low stock, high demand',
          status: 'pending',
          urgency: 'high'
        },
        {
          id: 2,
          drugName: 'Amoxicillin 250mg',
          quantity: 300,
          pharmacist: 'Sarah Lee',
          reason: 'Clinic campaign',
          status: 'ordered',
          urgency: 'medium'
        },
        {
          id: 3,
          drugName: 'Ibuprofen 400mg',
          quantity: 200,
          pharmacist: 'John Tan',
          reason: 'Emergency stock',
          status: 'cancelled',
          urgency: 'critical'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: Status) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/drug-requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: `Changed by ${user?.name || 'Admin'}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        )
      );
      
      alert(`Status updated to ${newStatus}`);
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusText = (status: Status) => {
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const tabs: { id: Status; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'ordered', label: 'Ordered' },
    { id: 'received', label: 'Received' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug Requests Management</CardTitle>
        <CardDescription>
          Review, approve, and track all drug requests
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="size-8 animate-spin text-blue-600" />
          </div>
        ) : (
          /* Table */
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Pharmacist</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  {activeTab === 'pending' && (
                    <TableHead>Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'pending' ? 6 : 5} className="text-center text-gray-500 py-8">
                      No {getStatusText(activeTab).toLowerCase()} requests
                    </TableCell>
                  </TableRow>
                )}

                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.drugName}</TableCell>
                    <TableCell>{req.quantity.toLocaleString()}</TableCell>
                    <TableCell>{req.pharmacist}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(req.status)}>
                        {getStatusText(req.status)}
                      </Badge>
                    </TableCell>

                    {/* Action Buttons (Pending only) */}
                    {activeTab === 'pending' && (
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(req.id, 'ordered')}
                        >
                          Approve Order
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(req.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{requests.length}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'ordered').length}
                </div>
                <div className="text-sm text-gray-600">Ordered</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'received').length}
                </div>
                <div className="text-sm text-gray-600">Received</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}