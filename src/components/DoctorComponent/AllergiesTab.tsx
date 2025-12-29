// AllergiesTab.tsx
import { useState } from 'react'; // ADD THIS IMPORT
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import type { AllergyFinding } from './types';

interface AllergiesTabProps {
  allergies: AllergyFinding[];
  onSaveAllergy: (allergyData: any) => void;
  onBackToConsultation: () => void;
  allergyForm: any;
  onAllergyFormChange: (form: any) => void;
  isSaving?: boolean;
}

export function AllergiesTab({ 
  allergies, 
  onSaveAllergy, 
  onBackToConsultation,
  allergyForm,
  onAllergyFormChange,
  isSaving = false
}: AllergiesTabProps) {
  // Add this state in your component
  const [showAllergyHistory, setShowAllergyHistory] = useState(false); // MOVED THIS LINE AFTER useState IMPORT

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'life-threatening': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmit = () => {
    onSaveAllergy(allergyForm);
    // Reset form in parent component
    onAllergyFormChange({
      AllergyName: '',
      Reaction: '',
      Severity: 'mild',
      OnsetDate: new Date().toISOString().split('T')[0],
      Status: 'active',
      Notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Record New Allergy Finding</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Allergy Name *</Label>
            <Input
              placeholder="e.g., Penicillin, Peanuts, Latex"
              value={allergyForm.AllergyName}
              onChange={(e) => onAllergyFormChange({...allergyForm, AllergyName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Reaction *</Label>
            <Input
              placeholder="e.g., Rash, Anaphylaxis, Difficulty breathing"
              value={allergyForm.Reaction}
              onChange={(e) => onAllergyFormChange({...allergyForm, Reaction: e.target.value})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Severity *</Label>
            <Select 
              value={allergyForm.Severity}
              onValueChange={(value: any) => onAllergyFormChange({...allergyForm, Severity: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
                <SelectItem value="life-threatening">Life-threatening</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Onset Date *</Label>
            <Input
              type="date"
              value={allergyForm.OnsetDate}
              onChange={(e) => onAllergyFormChange({...allergyForm, OnsetDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select 
              value={allergyForm.Status}
              onValueChange={(value: any) => onAllergyFormChange({...allergyForm, Status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional notes about the allergy..."
            rows={2}
            value={allergyForm.Notes}
            onChange={(e) => onAllergyFormChange({...allergyForm, Notes: e.target.value})}
          />
        </div>

        <div className="flex gap-3">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={!allergyForm.AllergyName.trim() || !allergyForm.Reaction.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Allergy Finding'
            )}
          </Button>
                    <Button 
            variant="outline"
            onClick={onBackToConsultation}
          >
            Back to Consultation
          </Button>
        </div>
      </div>

      {allergies.length > 0 && (
        <div className="pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Allergy History</h3>
            <button
              onClick={() => setShowAllergyHistory(!showAllergyHistory)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllergyHistory ? 'Hide History' : 'Show History'}
              <svg
                className={`w-4 h-4 transition-transform ${showAllergyHistory ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showAllergyHistory && (
            <div className="space-y-3">
              {allergies.map((allergy, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{allergy.AllergyName}</h4>
                        <p className="text-sm text-gray-600">Reaction: {allergy.Reaction}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getSeverityColor(allergy.Severity)}>
                          {allergy.Severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {allergy.Status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Onset Date</p>
                        <p className="text-gray-900">{new Date(allergy.OnsetDate).toLocaleDateString()}</p>
                      </div>
                      {allergy.Notes && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Notes</p>
                          <p className="text-gray-900">{allergy.Notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}