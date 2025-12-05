import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface PrescriptionProps {
  recentPrescriptions: any[];
}

export function Prescription({ recentPrescriptions }: PrescriptionProps) {
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  const handlePrintPrescription = () => {
    alert('Printing prescription...');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Recent Prescriptions
          </CardTitle>
          <CardDescription>Prescriptions issued by you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPrescriptions.map((prescription, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm text-gray-900">{prescription.patient}</p>
                      <Badge variant="outline" className="text-xs">{prescription.date}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{prescription.medication}</p>
                    <p className="text-xs text-gray-500 mt-1">Dosage: {prescription.dosage}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedPrescription(prescription);
                      setShowPrescriptionView(true);
                    }}>View</Button>
                    <Button variant="ghost" size="sm" onClick={handlePrintPrescription}>Reprint</Button>
                  </div>
                </div>
              </div>
            ))}
            {recentPrescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="size-12 mx-auto mb-3 text-gray-400" />
                <p>No recent prescriptions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prescription View Dialog */}
      <Dialog open={showPrescriptionView} onOpenChange={setShowPrescriptionView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              {selectedPrescription && `Prescription for ${selectedPrescription.patient}`}
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
                  <span className="text-gray-600">Dosage:</span>
                  <span className="text-gray-900">{selectedPrescription.dosage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{selectedPrescription.date}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowPrescriptionView(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}