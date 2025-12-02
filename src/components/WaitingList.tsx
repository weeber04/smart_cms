// WaitingList.tsx
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface WaitingListProps {
  waitingRoomList: any[];
  refreshData: () => void;
}

export function WaitingList({ waitingRoomList, refreshData }: WaitingListProps) {
  const handleUpdateVisitStatus = async (visitId: number, status: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/receptionist/update-visit-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, status })
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        refreshData();
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update status");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Waiting List</CardTitle>
        <CardDescription>Patients in waiting area</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {waitingRoomList.map((visit) => (
            <div key={visit.VisitID} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">{visit.patientName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Type: {visit.visitTypeLabel}</span>
                    <span>Arrived: {visit.arrivalTime || 'Not yet'}</span>
                    {visit.doctorName && <span>Doctor: {visit.doctorName}</span>}
                  </div>
                  {visit.ReasonForVisit && (
                    <p className="text-xs text-gray-600 mt-1">Reason: {visit.ReasonForVisit}</p>
                  )}
                </div>
                <Badge
                  className={
                    visit.VisitStatus === 'in-consultation'
                      ? 'bg-purple-100 text-purple-800'
                      : visit.VisitStatus === 'checked-in'
                      ? 'bg-green-100 text-green-800'
                      : visit.VisitStatus === 'arrived'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {visit.VisitStatus}
                </Badge>
              </div>
              <div className="flex gap-2">
                {visit.VisitStatus === 'arrived' && (
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleUpdateVisitStatus(visit.VisitID, 'checked-in')}
                  >
                    Check In
                  </Button>
                )}
                {visit.VisitStatus === 'checked-in' && (
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleUpdateVisitStatus(visit.VisitID, 'in-consultation')}
                  >
                    Start Consultation
                  </Button>
                )}
                {visit.VisitStatus === 'in-consultation' && (
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleUpdateVisitStatus(visit.VisitID, 'completed')}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {waitingRoomList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="size-12 mx-auto mb-3 text-gray-300" />
              <p>No patients in waiting area</p>
              <p className="text-sm mt-2">Patients will appear here once they check in</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}