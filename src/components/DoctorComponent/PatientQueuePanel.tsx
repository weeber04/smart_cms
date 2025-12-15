// PatientQueuePanel.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarClock } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronRight } from 'lucide-react';

interface PatientQueuePanelProps {
  todayAppointments: any[];
  selectedPatient: number | null;
  onSelectPatient: (patientId: number) => void;
}

export function PatientQueuePanel({ todayAppointments, selectedPatient, onSelectPatient }: PatientQueuePanelProps) {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'checked-in': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Checked In</Badge>;
      case 'in-consultation': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Consultation</Badge>;
      case 'completed': 
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default: 
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            <span>Patient Queue</span>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {todayAppointments.length} patients
          </Badge>
        </CardTitle>
        <CardDescription>
          Today's appointments and waiting list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3">
{todayAppointments.map((patient, index) => {
  const isSelected = selectedPatient === patient.patientId;
  const appointmentTime = patient.time ? new Date(patient.time).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '--:--';
  
  // Use CalledTime if available
  const calledTime = patient.CalledTime ? new Date(patient.CalledTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : appointmentTime;
  
  return (
    <Card 
      key={patient.id || patient.VisitID}
      className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
        isSelected 
          ? 'border-l-blue-500 bg-blue-50 border-blue-200' 
          : 'border-l-gray-200 hover:border-l-blue-300'
      }`}
      onClick={() => onSelectPatient(patient.patientId)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="size-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                {index + 1}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {calledTime}
              </span>
              {patient.sourceType && (
                <Badge variant="outline" className="text-xs mt-1">
                  {patient.sourceType}
                </Badge>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{patient.name}</p>
              <p className="text-sm text-gray-600">
                {patient.age} years • {patient.gender}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(patient.status)}
                {patient.DoctorID && (
                  <Badge variant="outline" className="text-xs bg-green-50">
                    Assigned
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {isSelected && (
            <div className="text-blue-600">
              <ChevronRight className="size-4" />
            </div>
          )}
        </div>
        
        {patient.chiefComplaint && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600">Chief Complaint</p>
            <p className="text-sm text-gray-800 truncate">{patient.chiefComplaint}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
})}

{todayAppointments.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <CalendarClock className="size-12 mx-auto mb-3 text-gray-400" />
    <p className="text-sm">No patients in consultation</p>
    <p className="text-xs mt-1">Call patients from the queue to appear here</p>
  </div>
)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}