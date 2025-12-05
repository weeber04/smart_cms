import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function RecentMedicalRecords() {
  const [recentRecords] = useState<any[]>([
    // This would be populated from actual data
    // { patient: "John Smith", date: "2024-03-15", diagnosis: "Hypertension", treatment: "Medication management" },
    // { patient: "Sarah Johnson", date: "2024-03-14", diagnosis: "Type 2 Diabetes", treatment: "Insulin therapy" }
  ]);

  const handleViewRecord = () => {
    alert('Viewing full record...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Recent Medical Records
        </CardTitle>
        <CardDescription>Recently accessed patient records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentRecords.map((record: any, index: number) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm text-gray-900">{record.patient}</p>
                    <Badge variant="outline" className="text-xs">
                      {record.date}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Treatment:</span> {record.treatment}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleViewRecord}>
                  View Full Record
                </Button>
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="size-12 mx-auto mb-3 text-gray-400" />
              <p>No recent medical records</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}