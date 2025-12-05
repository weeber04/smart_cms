// BillingManagement.tsx
import { useState } from 'react';
import { DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface BillingManagementProps {
  receptionistId: number | null;
  billingRecords: any[];
  refreshData: () => void;
}

export function BillingManagement({ receptionistId, billingRecords, refreshData }: BillingManagementProps) {
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);

  const handleProcessPayment = async () => {
    if (!selectedBilling || !receptionistId) return;

    try {
      const amountInput = document.getElementById('amount-received') as HTMLInputElement;
      const paymentMethodSelect = document.getElementById('payment-method') as HTMLSelectElement;
      const notesTextarea = document.getElementById('payment-notes') as HTMLTextAreaElement;
      
      if (!amountInput?.value || !paymentMethodSelect?.value) {
        alert("Please fill in all required fields");
        return;
      }

      const paymentData = {
        billId: selectedBilling.id,
        amountPaid: amountInput.value,
        paymentMethod: paymentMethodSelect.value,
        notes: notesTextarea?.value || '',
        processedBy: receptionistId
      };

      const response = await fetch("http://localhost:3001/api/receptionist/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowBillingDialog(false);
        alert('Payment processed successfully!');
        refreshData();
      } else {
        alert(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Failed to process payment");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Billing Management
          </CardTitle>
          <CardDescription>Process payments for consultations and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">{record.patient}</TableCell>
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell className="text-sm">{record.service}</TableCell>
                    <TableCell className="text-sm">${record.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={record.status === 'paid' ? 'default' : 'secondary'}
                        className={
                          record.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'partial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={record.status === 'paid' ? 'outline' : 'default'}
                        onClick={() => {
                          setSelectedBilling(record);
                          setShowBillingDialog(true);
                        }}
                      >
                        {record.status === 'paid' ? 'Receipt' : 'Process'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {selectedBilling && `Process payment for ${selectedBilling.patient}`}
            </DialogDescription>
          </DialogHeader>
          {selectedBilling && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient:</span>
                  <span className="text-gray-900">{selectedBilling.patient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{selectedBilling.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="text-gray-900">{selectedBilling.service}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-lg text-gray-900">${selectedBilling.amount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-received">Amount Received ($)</Label>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={selectedBilling.amount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Payment notes, insurance details, etc..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleProcessPayment}
                >
                  <CreditCard className="size-4 mr-2" />
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setShowBillingDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}