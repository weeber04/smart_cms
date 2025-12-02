import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Mail, Phone, MapPin, Calendar, Briefcase, Award } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    initials: string;
    joinDate: string;
    specialization?: string;
    certifications?: string[];
  };
}

export function ProfileModal({ open, onOpenChange, profile }: ProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Staff Profile</DialogTitle>
          <DialogDescription>Detailed information about staff member</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-600">{profile.role}</p>
              <Badge className="mt-1">{profile.department}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-gray-400" />
              <span className="text-gray-900">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 text-gray-400" />
              <span className="text-gray-900">{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-gray-400" />
              <span className="text-gray-900">Joined {profile.joinDate}</span>
            </div>
            {profile.specialization && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="size-4 text-gray-400" />
                <span className="text-gray-900">{profile.specialization}</span>
              </div>
            )}
          </div>

          {profile.certifications && profile.certifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="size-4 text-gray-400" />
                <h4 className="text-sm text-gray-900">Certifications</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
