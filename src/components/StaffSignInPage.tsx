import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Activity, Lock, Mail, AlertCircle, Phone, MapPin, Clock, UserCircle, ArrowLeft, Stethoscope, Pill, Heart, ClipboardList } from 'lucide-react';

export function StaffSignInPage({ onNavigateToAdminSignIn, onSelectDoctor, onSelectPharmacist, onSelectNurse, onSelectReceptionist }: { 
  onNavigateToAdminSignIn: () => void;
  onSelectDoctor: () => void;
  onSelectPharmacist: () => void;
  onSelectNurse: () => void;
  onSelectReceptionist: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock authentication - replace with actual authentication
      console.log('Staff sign in attempt:', { email, password });
      setError('Authentication functionality not yet connected. Please integrate with your backend.');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Activity className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl text-gray-900">HealthCare Clinic</h1>
                <p className="text-sm text-gray-500">Staff Portal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="size-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <UserCircle className="size-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Staff Portal</CardTitle>
              <CardDescription>
                Select your role to access your portal
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Doctor Button */}
                <button
                  onClick={onSelectDoctor}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <Stethoscope className="size-8 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg text-gray-900 mb-1">Doctor</h3>
                      <p className="text-sm text-gray-500">Consultation & Medical Records</p>
                    </div>
                  </div>
                </button>

                {/* Pharmacist Button */}
                <button
                  onClick={onSelectPharmacist}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                      <Pill className="size-8 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg text-gray-900 mb-1">Pharmacist</h3>
                      <p className="text-sm text-gray-500">Inventory & Medication</p>
                    </div>
                  </div>
                </button>

                {/* Nurse Button */}
                <button
                  onClick={onSelectNurse}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-200 p-6 hover:border-pink-500 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                      <Heart className="size-8 text-pink-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg text-gray-900 mb-1">Nurse</h3>
                      <p className="text-sm text-gray-500">Vital Signs & Medical Records</p>
                    </div>
                  </div>
                </button>

                {/* Receptionist Button */}
                <button
                  onClick={onSelectReceptionist}
                  className="group relative overflow-hidden rounded-lg border-2 border-gray-200 p-6 hover:border-orange-500 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                      <ClipboardList className="size-8 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg text-gray-900 mb-1">Receptionist</h3>
                      <p className="text-sm text-gray-500">Patient Registration & Appointments</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">Administrator?</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onNavigateToAdminSignIn}
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Admin Sign In
              </Button>

              <div className="pt-4 text-center text-sm text-gray-600">
                <p>Select your role to access the appropriate portal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  <span>123 Medical Center Dr, Suite 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>admin@healthcareclinic.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-green-600">Support Center</a></li>
                <li><a href="#" className="hover:text-green-600">System Status</a></li>
              </ul>
            </div>

            {/* System Info */}
            <div>
              <h3 className="text-sm text-gray-900 mb-3">Staff Information</h3>
              <p className="text-sm text-gray-600 mb-3">
                Secure staff portal access for authorized clinic personnel.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>&copy; 2024 HealthCare Clinic Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
