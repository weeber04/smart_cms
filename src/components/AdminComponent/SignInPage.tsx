import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Phone, Clock, Lock, Mail, MapPin, Heart, XCircle, 
  ChevronLeft, ChevronRight, Users, Calendar, Stethoscope, 
  Pill, Settings, UserPlus, FileText, BarChart3, Shield, 
  Building, ClipboardList, CheckCircle, Key
} from 'lucide-react';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();
  const { login } = useAuth();
  const navigate = useNavigate();
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {
      title: 'Admin',
      description: 'Manage users and roles, system configuration, access control, and view system reports and statistics.',
      icon: Settings,
      color: 'bg-purple-100 text-purple-600',
      features: ['User Management', 'System Configuration', 'Access Control', 'Reports & Analytics']
    },
    {
      title: 'Receptionist',
      description: 'Patient registration, appointment scheduling, billing, check-in, and check-out management.',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-600',
      features: ['Patient Registration', 'Appointment Scheduling', 'Billing Management', 'Check-in/out']
    },
    {
      title: 'Doctor',
      description: 'View patient medical history, record diagnoses and consultations, prescribe medication.',
      icon: Stethoscope,
      color: 'bg-green-100 text-green-600',
      features: ['Medical History', 'Diagnoses', 'Consultations', 'Prescriptions']
    },
    {
      title: 'Pharmacist',
      description: 'View prescriptions, manage medication inventory, dispense medication and update records.',
      icon: Pill,
      color: 'bg-orange-100 text-orange-600',
      features: ['Prescription View', 'Inventory Management', 'Medication Dispensing', 'Records Update']
    }
  ];

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting...');
      navigate('/');
    }
  }, [user, navigate]);

  // Auto-rotate slides
  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let errorMessage = '';
    
    setError('');
    setIsLoading(true);
    setShowErrorDialog(false);

    try {
      await login(email, password);
    } catch (error: any) {
      errorMessage = error.message || 'Login failed. Please check your credentials.';
      console.log('Caught error:', errorMessage);
      
      setError(errorMessage);
      setDialogError(errorMessage);
      setShowErrorDialog(true);
      
      alert(`Login Failed: ${errorMessage}`);
      
    } finally {
      setIsLoading(false);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SmartCare CMS</h1>
                <p className="text-sm text-gray-600">Clinic Management System</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Shield className="w-4 h-4" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Side by Side Layout */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Sign In Form */}
            <div>
              <Card className="border-gray-200 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8 text-white fill-white" />
                    </div>
                    <CardTitle className="text-2xl text-center">SmartCare CMS</CardTitle>
                    <CardDescription className="text-center mt-2">
                      Secure healthcare management portal
                    </CardDescription>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">Sign In to Your Account</h3>
                    <p className="text-sm text-gray-600 mt-1">Enter your credentials to access the system</p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Inline Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@smartcms.com"
                          className="pl-10 h-11"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                        <a 
                          href="#" 
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Forgot Password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 h-11"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Key className="w-4 h-4 mr-2" />
                          Sign In
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Test Button Section */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">Developer Testing:</p>
                    <div className="space-y-2">
                      <Button 
                        type="button"
                        onClick={() => {
                          console.log('TEST: Setting error manually');
                          setError('TEST ERROR MESSAGE - If you see this, error display works');
                          setDialogError('TEST DIALOG MESSAGE');
                          setShowErrorDialog(true);
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        🔧 Test Error Display
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => navigate('/test-pharmacist')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        🧪 Test Pharmacist Portal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

{/* Right Column - Carousel */}
<div className="h-full">
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 lg:p-8 h-full">
    {/* Carousel Container */}
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
      {/* Header inside carousel */}
      <div className="p-6 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Features</h2>
        <p className="text-gray-600 mb-4">Comprehensive healthcare management solutions</p>
        
        {/* Role Selection Buttons */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Select role to view features:</p>
          <div className="flex flex-wrap gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                onClick={() => goToSlide(index)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  currentSlide === index 
                    ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium' 
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {slide.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Carousel Content */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-xl ${currentSlideData.color}`}>
            <currentSlideData.icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentSlideData.title}</h3>
            <p className="text-gray-600">Role-based Access System</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6 text-sm">{currentSlideData.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentSlideData.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">{feature}</span>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Additional Info - Inside carousel at bottom */}
      <div className="border-t border-gray-100 pt-4 px-6 pb-4 mt-4">
        <p className="text-sm text-gray-600 text-center">
          Need help? Contact support at{' '}
          <a href="mailto:support@smartcms.com" className="text-blue-600 hover:text-blue-800">
            support@smartcms.com
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
          </div>
        </div>
      </main>

      {/* Footer - Updated for centered layout */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="font-bold text-gray-900">SmartCare CMS</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Empowering healthcare providers with intelligent clinic management solutions.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>123 Medical Center Dr</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>support@smartcms.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors inline-block">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors inline-block">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors inline-block">
                    Support Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors inline-block">
                    System Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* System Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">System Security</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>End-to-End Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>24/7 Monitoring</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SmartCare Clinic Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Login Failed</h3>
                  <p className="text-sm text-gray-600">Unable to authenticate</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium">{dialogError}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}