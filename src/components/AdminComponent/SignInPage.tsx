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
  Building, ClipboardList, CheckCircle, Key, AlertCircle, 
  Loader2, CheckCircle2, Eye, EyeOff, User, Hash
} from 'lucide-react';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: IC Verification, 3: New Password, 4: Success
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const { user } = useAuth();
  const { login } = useAuth();
  const navigate = useNavigate();
  const slideInterval = useRef<ReturnType<typeof setTimeout> | null>(null); // Fixed this line

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

  // Step 1: Verify email exists
  const handleEmailVerification = async () => {
    if (!forgotPasswordEmail) {
      setResetError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }

    setIsVerifying(true);
    setResetError('');
    
    try {
      // Call backend to verify email and get user info (masked IC)
      const response = await fetch('http://localhost:3001/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data.user);
        setStep(2); // Move to IC verification step
      } else {
        setResetError(data.message || 'Email not found in our system');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setResetError('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Verify IC number
  const handleIcVerification = async () => {
    if (!icNumber) {
      setResetError('Please enter your IC number');
      return;
    }

    // Basic IC validation (adjust based on your country format)
    if (icNumber.length < 8) {
      setResetError('Please enter a valid IC number');
      return;
    }

    setIsVerifying(true);
    setResetError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-ic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          icNumber: icNumber
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3); // Move to password reset step
      } else {
        setResetError(data.message || 'IC number does not match our records');
      }
    } catch (error) {
      console.error('IC verification error:', error);
      setResetError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setResetError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    // Password strength validation
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setResetError('Password must contain uppercase, lowercase letters and numbers');
      return;
    }

    setIsResetting(true);
    setResetError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          icNumber: icNumber,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(4); // Success step
        // Auto-close after 3 seconds
        setTimeout(() => {
          handleCloseForgotPassword();
        }, 3000);
      } else {
        setResetError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError('Network error. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setStep(1);
    setForgotPasswordEmail('');
    setIcNumber('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setUserData(null);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setIcNumber('');
      setResetError('');
    } else if (step === 3) {
      setStep(2);
      setNewPassword('');
      setConfirmPassword('');
      setResetError('');
    }
  };

  const currentSlideData = slides[currentSlide];

  // Format IC for display (show only last 4 digits)
  const formatIcDisplay = (ic: string) => {
    if (!ic) return '';
    if (ic.length <= 4) return '•••••' + ic;
    return '•••••' + ic.slice(-4);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart CMS</h1>
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
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                      <img 
                        src="../logo.png" 
                        alt="Clinic Logo" 
                        className="w-14 h-14 object-contain"
                      />
                    </div>
                    <CardTitle className="text-2xl text-center">Smart CMS</CardTitle>
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
                        <button 
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Forgot Password?
                        </button>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="font-bold text-gray-900">Smart CMS</span>
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
              &copy; {new Date().getFullYear()} Smart Clinic Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
                  <p className="text-sm text-gray-600">
                    {step === 1 && 'Enter your email to start'}
                    {step === 2 && 'Verify your identity'}
                    {step === 3 && 'Create new password'}
                    {step === 4 && 'Password reset successful'}
                  </p>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      step > stepNum ? 'bg-green-100 text-green-600' :
                      step === stepNum ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step > stepNum ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{stepNum}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {stepNum === 1 && 'Email'}
                      {stepNum === 2 && 'IC Number'}
                      {stepNum === 3 && 'New Password'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Email Verification */}
              {step === 1 && (
                <>
                  <div className="mb-6">
                    <Label htmlFor="reset-email" className="text-gray-700 mb-2 block">
                      Enter your registered email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="reset-email"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="your.email@smartcms.com"
                        className="pl-10 h-11"
                        disabled={isVerifying}
                        autoFocus
                      />
                    </div>
                    {resetError && (
                      <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{resetError}</span>
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-sm text-gray-500">
                      Enter the email address associated with your account to verify your identity.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseForgotPassword}
                      className="flex-1"
                      disabled={isVerifying}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEmailVerification}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Continue
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: IC Number Verification */}
              {step === 2 && userData && (
                <>
                  <div className="mb-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{userData.name || 'User'}</p>
                          <p className="text-sm text-gray-600">Email: {forgotPasswordEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ic-number" className="text-gray-700 mb-2 block">
                        Enter your IC/Passport Number
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="ic-number"
                          type="text"
                          value={icNumber}
                          onChange={(e) => setIcNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter your IC number (digits only)"
                          className="pl-10 h-11"
                          disabled={isVerifying}
                          autoFocus
                        />
                      </div>
                      {userData.maskedIc && (
                        <p className="mt-2 text-sm text-gray-500">
                          For verification: {formatIcDisplay(userData.maskedIc)}
                        </p>
                      )}
                    </div>

                    {resetError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{resetError}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500">
                      Enter the IC/Passport number associated with your account for additional security verification.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                      disabled={isVerifying}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleIcVerification}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <>
                  <div className="mb-6 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Identity Verified</p>
                          <p className="text-sm text-gray-600">Email: {forgotPasswordEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new-password" className="text-gray-700 mb-2 block">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="pl-10 pr-10 h-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        • At least 8 characters<br />
                        • Include uppercase and lowercase letters<br />
                        • Include at least one number
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-gray-700 mb-2 block">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="pl-10 pr-10 h-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {resetError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{resetError}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                      disabled={isResetting}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Reset Password
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Successful!</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Your password has been successfully updated for <span className="font-medium">{forgotPasswordEmail}</span>.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-700">
                      <strong>Next steps:</strong> Return to the login page and sign in with your new password.
                    </p>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    This dialog will close automatically...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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