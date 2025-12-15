// ConsultationTabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ClipboardList, Activity, Pill, AlertTriangle, FileText } from 'lucide-react';

interface ConsultationTabsProps {
  activeSubTab: string;
  onTabChange: (value: string) => void;
}

export function ConsultationTabs({ activeSubTab, onTabChange }: ConsultationTabsProps) {
  return (
    <div className="p-6 pb-0">
      <Tabs value={activeSubTab} onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="consultation" className="flex-1 min-w-[120px] flex items-center justify-center gap-2">
            <ClipboardList className="size-4" />
            Consultation
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex-1 min-w-[120px] flex items-center justify-center gap-2">
            <Activity className="size-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="prescription" className="flex-1 min-w-[120px] flex items-center justify-center gap-2">
            <Pill className="size-4" />
            Prescription
          </TabsTrigger>
          <TabsTrigger value="allergies" className="flex-1 min-w-[120px] flex items-center justify-center gap-2">
            <AlertTriangle className="size-4" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex-1 min-w-[120px] flex items-center justify-center gap-2">
            <FileText className="size-4" />
            Summary
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}