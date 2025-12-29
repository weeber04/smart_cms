// CompleteConsultationButton.tsx
import { Button } from '../ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface CompleteConsultationButtonProps {
  consultationId: number | null;
  patientId: number | null;
  doctorId: number | null;
  isCompleting?: boolean;
  onComplete: () => void;
  canComplete?: boolean;
}

export function CompleteConsultationButton({
  consultationId,
  patientId,
  doctorId,
  isCompleting = false,
  onComplete,
  canComplete = true
}: CompleteConsultationButtonProps) {
  const handleClick = () => {
    if (!consultationId || !patientId || !doctorId) {
      toast.error('Cannot complete consultation. Please ensure consultation is saved first.');
      return;
    }
    
    if (!canComplete) {
      toast.error('Please save the consultation form first before completing.');
      return;
    }
    
    onComplete();
  };

  return (
    <div className="w-full flex justify-center">
      <Button 
        variant="default"
        className="bg-green-600 hover:bg-green-700"
        onClick={handleClick}
        disabled={isCompleting || !consultationId || !canComplete}
      >
        {isCompleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Consultation
          </>
        )}
      </Button>
    </div>
  );
}