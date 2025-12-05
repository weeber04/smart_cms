import React from 'react';
import { XCircle, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'error'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="size-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="size-6 text-yellow-600" />;
      case 'info':
        return <Info className="size-6 text-blue-600" />;
      default:
        return <XCircle className="size-6 text-red-600" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-red-50';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className={`p-4 rounded-md ${getBgColor()} ${getTextColor()}`}>
          <div className="text-sm whitespace-pre-line">{message}</div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="default">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};