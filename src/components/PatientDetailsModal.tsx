import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Calendar, Phone, Mail, MapPin, Droplet, AlertTriangle, FileText, Activity } from 'lucide-react';

interface PatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any; // Changed to any to handle null/undefined
}

export function PatientDetailsModal({ open, onOpenChange, patient }: PatientDetailsModalProps) {
  // Add null check and default values
  if (!patient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Medical Record</DialogTitle>
            <DialogDescription>No patient data available</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            <p>No patient information to display</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Safe access with fallbacks
  const safePatient = {
    name: patient?.name || 'Unknown Patient',
    age: patient?.age || 'N/A',
    gender: patient?.gender || 'N/A',
    bloodType: patient?.bloodType || 'N/A',
    phone: patient?.phone || 'N/A',
    email: patient?.email || 'N/A',
    address: patient?.address || 'N/A',
    allergies: patient?.allergies || [],
    medicalHistory: patient?.medicalHistory || [],
    currentMedications: patient?.currentMedications || [],
    recentVisits: patient?.recentVisits || []
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Medical Record</DialogTitle>
          <DialogDescription>Complete medical information for {safePatient.name}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="medical">Medical Info</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm text-gray-900">{safePatient.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Age / Gender</p>
                  <p className="text-sm text-gray-900">{safePatient.age} years / {safePatient.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Droplet className="size-5 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Blood Type</p>
                  <p className="text-sm text-gray-900">{safePatient.bloodType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{safePatient.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <Mail className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{safePatient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <MapPin className="size-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{safePatient.address}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-red-500" />
                <h3 className="text-sm text-gray-900">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {safePatient.allergies.length > 0 ? (
                  safePatient.allergies.map((allergy: string, index: number) => (
                    <Badge key={index} variant="destructive">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No known allergies</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="size-4 text-orange-500" />
                <h3 className="text-sm text-gray-900">Medical Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {safePatient.medicalHistory.length > 0 ? (
                  safePatient.medicalHistory.map((record: any, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      {record.condition || record.diagnosis || 'Unknown Condition'} ({record.status || 'Active'})
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No medical conditions recorded</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-blue-500" />
                <h3 className="text-sm text-gray-900">Current Medications</h3>
              </div>
              <div className="space-y-2">
                {safePatient.currentMedications.length > 0 ? (
                  safePatient.currentMedications.map((medication: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-900">{medication.name || 'Unknown Medication'}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {medication.dosage || 'N/A'} - {medication.frequency || 'N/A'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No current medications</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {safePatient.recentVisits.length > 0 ? (
              safePatient.recentVisits.map((record: any, index: number) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-900">{record.reason || 'No reason provided'}</p>
                      <p className="text-xs text-gray-500 mt-1">{record.doctor || 'Unknown Doctor'}</p>
                    </div>
                    <Badge variant="outline">{record.date || 'Unknown Date'}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No visit history available</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}