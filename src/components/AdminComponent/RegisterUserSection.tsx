import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  CheckCircle, 
  IdCard, 
  Stethoscope, 
  Building, 
  FileText, 
  AlertCircle
} from 'lucide-react';

export function RegisterUserSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    phoneNum: '',
    ICNo: '',
    status: 'Active'
  });

  // Doctor-specific fields
  const [doctorProfile, setDoctorProfile] = useState({
    specialization: '',
    licenseNo: '',
    clinicRoom: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Function to validate NRIC format (Malaysian IC format)
  const validateICNo = (icNo: string): boolean => {
    const cleanIC = icNo.replace(/[\s-]/g, '');
    const malaysianICRegex = /^\d{6}-\d{2}-\d{4}$|^\d{12}$/;
    
    if (!malaysianICRegex.test(cleanIC)) {
      if (cleanIC.length !== 12) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate IC Number format
      if (!validateICNo(formData.ICNo)) {
        setError('Invalid IC/NRIC format. Please use format: YYMMDD-PB-#### or 12 digits');
        setLoading(false);
        return;
      }

      // Prepare the data to send
      const userData = {
        ...formData,
        ...(formData.role === 'doctor' && { doctorProfile })
      };

      const response = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to register user");
        return;
      }

      // Show success modal
      setSuccess(true);

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        phoneNum: "",
        ICNo: "",
        status: "Active",
      });

      // Reset doctor profile if doctor was selected
      setDoctorProfile({
        specialization: '',
        licenseNo: '',
        clinicRoom: ''
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
    
    // Reset doctor profile if switching away from doctor role
    if (value !== 'doctor') {
      setDoctorProfile({
        specialization: '',
        licenseNo: '',
        clinicRoom: ''
      });
    }
  };

  const handleClearForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      phoneNum: '',
      ICNo: '',
      status: 'Active'
    });
    setDoctorProfile({
      specialization: '',
      licenseNo: '',
      clinicRoom: ''
    });
    setError(null);
  };

  // Format IC number as user types (YYMMDD-PB-####)
  const handleICNoChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    
    let formatted = digitsOnly;
    
    if (digitsOnly.length > 6) {
      formatted = digitsOnly.slice(0, 6) + '-' + digitsOnly.slice(6, 8);
    }
    if (digitsOnly.length > 8) {
      formatted = formatted.slice(0, 9) + '-' + digitsOnly.slice(8, 12);
    }
    if (digitsOnly.length > 12) {
      formatted = formatted.slice(0, 14);
    }
    
    setFormData({ ...formData, ICNo: formatted });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900 mb-1">Register New Staff</h2>
        <p className="text-sm text-gray-500">Add staff accounts for clinic operations</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Staff Registration Form
          </CardTitle>
          <CardDescription>Fill in the required information</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-6 bg-red-50 text-red-900 border-red-200">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BASIC INFORMATION SECTION */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              
              {/* NAME + EMAIL */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.smith@clinic.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* PHONE + IC */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNum">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="phoneNum"
                      placeholder="+60 12-345 6789"
                      value={formData.phoneNum}
                      onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ICNo">
                    IC / NRIC Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="ICNo"
                      placeholder="YYMMDD-PB-####"
                      value={formData.ICNo}
                      onChange={(e) => handleICNoChange(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                      pattern="\d{6}-\d{2}-\d{4}"
                      title="Format: YYMMDD-PB-####"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Format: YYMMDD-PB-#### (e.g., 900101-14-1234)
                  </p>
                </div>
              </div>

              {/* ROLE + STATUS */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Staff Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="size-4" />
                          <span>Doctor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only staff roles are available for registration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Active or Inactive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
              </div>
            </div>

            {/* DOCTOR PROFILE SECTION - Only show when doctor role is selected */}
            {formData.role === 'doctor' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Stethoscope className="size-5" />
                  Doctor Profile Information
                </h3>
                <p className="text-sm text-gray-500">
                  Additional information required for doctor registration
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">
                      Specialization <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="specialization"
                        placeholder="e.g., General Medicine, Pediatrics"
                        value={doctorProfile.specialization}
                        onChange={(e) => setDoctorProfile({ ...doctorProfile, specialization: e.target.value })}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNo">
                      License Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="licenseNo"
                        placeholder="e.g., MED12345"
                        value={doctorProfile.licenseNo}
                        onChange={(e) => setDoctorProfile({ ...doctorProfile, licenseNo: e.target.value })}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicRoom">Clinic Room</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="clinicRoom"
                      placeholder="e.g., Room 101"
                      value={doctorProfile.clinicRoom}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, clinicRoom: e.target.value })}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Optional - Can be assigned later</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    {formData.role === 'doctor' ? 'Register Doctor' : 'Register Staff'}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClearForm}
                disabled={loading}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SUCCESS POPUP MODAL */}
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            {/* Animated Success Icon */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            {/* Success Message */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Registration Successful!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Staff member has been successfully added to the database.
              </DialogDescription>
            </DialogHeader>
            
            {/* Close Button */}
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700 w-full"
              onClick={() => setSuccess(false)}
            >
              Great!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}