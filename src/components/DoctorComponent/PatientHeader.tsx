// PatientHeader.tsx
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { UserCircle, Droplet, Bell, History, FileEdit } from 'lucide-react';

interface PatientHeaderProps {
  patientData: {
    Name: string;
    age?: number;
    Gender: string;
    ICNo: string;
    BloodType?: string;
  };
  allergiesCount: number;
  onViewHistory: () => void;
  onAddQuickNote: () => void;
}

export function PatientHeader({ 
  patientData, 
  allergiesCount, 
  onViewHistory, 
  onAddQuickNote 
}: PatientHeaderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 border-2 border-blue-100">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {patientData.Name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{patientData.Name}</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {patientData.age} years
                </Badge>
                <Badge variant="outline">
                  {patientData.Gender === 'M' ? 'Male' : 'Female'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <UserCircle className="size-4" />
                  <span>IC: {patientData.ICNo}</span>
                </div>
                {patientData.BloodType && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Droplet className="size-4 text-red-500" />
                    <span>Blood: {patientData.BloodType}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Bell className="size-4" />
                  <span>Allergies: {allergiesCount}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewHistory}
              className="flex items-center gap-2"
            >
              <History className="size-4" />
              History
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddQuickNote}
              className="flex items-center gap-2"
            >
              <FileEdit className="size-4" />
              Quick Note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}