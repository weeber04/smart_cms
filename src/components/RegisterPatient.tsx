// RegisterPatient.tsx
import { useState, useRef } from 'react';
import { UserPlus, User, Phone, Mail, Home, FileText, AlertCircle, Droplets, Shield, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';

interface RegisterPatientProps {
  receptionistId: number | null;
  doctors: any[];
  refreshData: () => void;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  icNo: string;
  gender: string;
  dob: string;
  bloodType: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  chronicDisease: 'Y' | 'N';
  allergy: 'Y' | 'N';
  insuranceProvider: string;
  insurancePolicyNo: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  reasonForVisit: string;
  visitNotes: string;
  doctor: string;
  consent: boolean;
}

export function RegisterPatient({ receptionistId, doctors, refreshData }: RegisterPatientProps) {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Initialize form state with all fields
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    icNo: '',
    gender: '',
    dob: '',
    bloodType: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    chronicDisease: 'N',
    allergy: 'N',
    insuranceProvider: '',
    insurancePolicyNo: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    reasonForVisit: 'First consultation',
    visitNotes: '',
    doctor: '',
    consent: false
  });

  // Handle input changes
  const handleInputChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle radio group changes
  const handleRadioChange = (field: 'chronicDisease' | 'allergy', value: 'Y' | 'N') => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!receptionistId) {
      setError("Receptionist ID not found");
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.icNo || !formData.gender || 
        !formData.dob || !formData.phone || !formData.addressLine1 || !formData.city || 
        !formData.state || !formData.country || !formData.consent) {
      setError("Please fill in all required fields (*) and agree to the consent");
      setIsLoading(false);
      return;
    }

    try {
      // Build full address
      const fullAddress = [
        formData.addressLine1,
        formData.addressLine2,
        formData.city,
        formData.state,
        formData.zipCode,
        formData.country
      ].filter(Boolean).join(', ');

      // In your handleRegisterPatient function:
      const patientData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        icNo: formData.icNo,
        gender: formData.gender,
        dob: formData.dob,
        phoneNumber: formData.phone,
        email: formData.email || null,
        bloodType: formData.bloodType || null,
        
        // Send BOTH address formats for compatibility
        address: fullAddress, // Built from components
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        
        chronicDisease: formData.chronicDisease,
        allergy: formData.allergy,
        
        insuranceProvider: formData.insuranceProvider || null,
        insurancePolicyNo: formData.insurancePolicyNo || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        
        createdBy: receptionistId,
        reasonForVisit: formData.reasonForVisit,
        doctorId: formData.doctor || null
      };

      console.log('Sending patient data:', patientData);

      const response = await fetch("http://localhost:3001/api/receptionist/register-patient", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(patientData)
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setRegistrationSuccess(true);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          icNo: '',
          gender: '',
          dob: '',
          bloodType: '',
          phone: '',
          email: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          chronicDisease: 'N',
          allergy: 'N',
          insuranceProvider: '',
          insurancePolicyNo: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          reasonForVisit: 'First consultation',
          visitNotes: '',
          doctor: '',
          consent: false
        });
        refreshData();
        
        setTimeout(() => {
          setRegistrationSuccess(false);
        }, 3000);
        
      } else {
        setError(result.error || 'Failed to register patient. Please try again.');
        console.error('Registration failed:', result);
      }
      
    } catch (error) {
      console.error("❌ Registration error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            New Patient Registration
          </CardTitle>
          <CardDescription>Register a new patient with complete information</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegisterPatient} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="personal">
                  <User className="size-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Home className="size-4 mr-2" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="medical">
                  <Droplets className="size-4 mr-2" />
                  Medical
                </TabsTrigger>
                <TabsTrigger value="visit">
                  <FileText className="size-4 mr-2" />
                  Visit Info
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John" 
                        className="pl-10" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icNo">IC/Passport Number *</Label>
                    <Input 
                      id="icNo" 
                      value={formData.icNo}
                      onChange={(e) => handleInputChange('icNo', e.target.value)}
                      placeholder="e.g., 900101010101" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleInputChange('gender', value)}
                      required
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input 
                      id="dob" 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      required 
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select 
                      value={formData.bloodType} 
                      onValueChange={(value) => handleInputChange('bloodType', value)}
                    >
                      <SelectTrigger id="bloodType">
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000" 
                        className="pl-10" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="patient@example.com" 
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input 
                    id="addressLine1" 
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    placeholder="Street address, P.O. box, company name" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input 
                    id="addressLine2" 
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    placeholder="Apartment, suite, unit, building, floor" 
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input 
                      id="state" 
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input 
                      id="zipCode" 
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="12345" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="MY">Malaysia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Medical Information Tab */}
              <TabsContent value="medical" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertCircle className="size-4" />
                      Chronic Disease History
                    </Label>
                    <RadioGroup 
                      value={formData.chronicDisease} 
                      onValueChange={(value: 'Y' | 'N') => handleRadioChange('chronicDisease', value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="N" id="chronic-no" />
                        <Label htmlFor="chronic-no">No chronic diseases</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Y" id="chronic-yes" />
                        <Label htmlFor="chronic-yes">Has chronic diseases</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertCircle className="size-4" />
                      Allergies
                    </Label>
                    <RadioGroup 
                      value={formData.allergy} 
                      onValueChange={(value: 'Y' | 'N') => handleRadioChange('allergy', value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="N" id="allergy-no" />
                        <Label htmlFor="allergy-no">No known allergies</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Y" id="allergy-yes" />
                        <Label htmlFor="allergy-yes">Has allergies</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="size-4" />
                      Insurance Provider
                    </Label>
                    <Input 
                      id="insuranceProvider" 
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                      placeholder="e.g., Aetna, Blue Cross, etc." 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insurancePolicyNo">Policy Number</Label>
                    <Input 
                      id="insurancePolicyNo" 
                      value={formData.insurancePolicyNo}
                      onChange={(e) => handleInputChange('insurancePolicyNo', e.target.value)}
                      placeholder="Insurance policy number" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <UserCog className="size-4" />
                    Emergency Contact
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Contact Name</Label>
                      <Input 
                        id="emergencyContactName" 
                        value={formData.emergencyContactName}
                        onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                        placeholder="Emergency contact person" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                      <Input 
                        id="emergencyContactPhone" 
                        type="tel" 
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                        placeholder="+1 (555) 000-0000" 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Visit Information Tab */}
              <TabsContent value="visit" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reasonForVisit">Reason for Visit *</Label>
                  <Select 
                    value={formData.reasonForVisit} 
                    onValueChange={(value) => handleInputChange('reasonForVisit', value)}
                  >
                    <SelectTrigger id="reasonForVisit">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First consultation">First Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
                      <SelectItem value="Routine check-up">Routine Check-up</SelectItem>
                      <SelectItem value="Emergency">Emergency Visit</SelectItem>
                      <SelectItem value="Lab test">Lab Test</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitNotes">Additional Visit Notes</Label>
                  <Textarea 
                    id="visitNotes" 
                    value={formData.visitNotes}
                    onChange={(e) => handleInputChange('visitNotes', e.target.value)}
                    placeholder="Any additional information about this visit..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Assign to Doctor (Optional)</Label>
                  <Select 
                    value={formData.doctor} 
                    onValueChange={(value) => handleInputChange('doctor', value)}
                  >
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Select doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* CHANGE THIS LINE: Remove empty string value */}
                      <SelectItem value="none">No assignment</SelectItem>
                      {doctors.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={String(doctor.id)}>
                          Dr. {doctor.Name} - {doctor.Specialization || 'General Medicine'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    If assigned, the patient will be added to the doctor's waiting list
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center space-x-2">
                    {/* Add ErrorBoundary around checkbox to catch errors */}
                    <input 
                      type="checkbox" 
                      id="consent" 
                      checked={formData.consent}
                      onChange={(e) => handleInputChange('consent', e.target.checked)}
                      required 
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <Label htmlFor="consent" className="text-sm">
                      I confirm that the information provided is accurate and consent to treatment *
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    Register Patient
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setFormData({
                    firstName: '',
                    lastName: '',
                    icNo: '',
                    gender: '',
                    dob: '',
                    bloodType: '',
                    phone: '',
                    email: '',
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                    chronicDisease: 'N',
                    allergy: 'N',
                    insuranceProvider: '',
                    insurancePolicyNo: '',
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    reasonForVisit: 'First consultation',
                    visitNotes: '',
                    doctor: '',
                    consent: false
                  });
                }}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={registrationSuccess} onOpenChange={setRegistrationSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Patient Registered!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Patient has been successfully registered in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                ✓ Added to patient database
              </p>
              <p className="text-sm text-gray-600">
                ✓ Ready for appointment scheduling
              </p>
            </div>
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700 w-full"
              onClick={() => setRegistrationSuccess(false)}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}