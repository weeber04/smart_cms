import { Bell, X, Clock, UserPlus, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface Notification {
  id: number;
  type: 'appointment' | 'patient' | 'alert' | 'report';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationPanel({ role }: { role: string }) {
  const notifications: Notification[] = [
    {
      id: 1,
      type: 'appointment',
      title: 'New Appointment',
      message: 'John Smith scheduled for 2:00 PM today',
      time: '5 min ago',
      read: false
    },
    {
      id: 2,
      type: 'patient',
      title: 'Patient Check-in',
      message: 'Emma Davis has checked in',
      time: '15 min ago',
      read: false
    },
    {
      id: 3,
      type: 'alert',
      title: 'Low Stock Alert',
      message: 'Paracetamol 500mg is running low',
      time: '1 hour ago',
      read: false
    },
    {
      id: 4,
      type: 'report',
      title: 'Lab Results Ready',
      message: 'Blood test results for Robert Wilson',
      time: '2 hours ago',
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="size-4 text-blue-600" />;
      case 'patient':
        return <UserPlus className="size-4 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="size-4 text-orange-600" />;
      case 'report':
        return <FileText className="size-4 text-purple-600" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900">{notification.title}</p>
                    {!notification.read && (
                      <Badge className="bg-blue-600 text-white text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="size-3" />
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            Mark All as Read
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
