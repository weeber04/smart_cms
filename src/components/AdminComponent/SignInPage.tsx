import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Phone, Clock, Lock, Mail, MapPin, Heart, XCircle } from 'lucide-react';
import { useEffect } from 'react';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const { user } = useAuth();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting...');
      navigate('/');
    }
  }, [user, navigate]);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Use a local variable to track the error
  let errorMessage = '';
  
  setError('');
  setIsLoading(true);
  setShowErrorDialog(false);

  try {
    await login(email, password);
  } catch (error: any) {
    errorMessage = error.message || 'Login failed. Please check your credentials.';
    console.log('Caught error:', errorMessage);
    
    // Set state directly without setTimeout
    setError(errorMessage);
    setDialogError(errorMessage);
    setShowErrorDialog(true);
    
    // Also show alert for immediate feedback
    alert(`Login Failed: ${errorMessage}`);
    
  } finally {
    setIsLoading(false);
  }
};

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e5eff4' }}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="size-6 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-xl text-gray-900">Smart CMS</h1>
                  <p className="text-sm text-gray-500">Clinic Management System</p>
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
          <Card className="w-full max-w-md shadow-xl bg-white">
            <CardHeader className="space-y-4 text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Lock className="size-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Sign In Portal</CardTitle>
                <CardDescription className="mt-2">
                  Sign in to access your account
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Inline Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@smartcms.com"
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </Button>
                
              </form>
              {/* Add this after your form fields but before the Sign In button */}
<div className="pt-4 border-t">
  <Button 
    type="button"
    onClick={() => {
      console.log('TEST: Setting error manually');
      setError('TEST ERROR MESSAGE - If you see this, error display works');
      setDialogError('TEST DIALOG MESSAGE');
      setShowErrorDialog(true);
    }}
    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mb-2"
  >
    🔧 Test Error Display
  </Button>
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm text-gray-600 mb-2">Developer Testing:</p>
      <Button 
        type="button"
        onClick={() => navigate('/test-pharmacist')}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        🧪 Test Pharmacist Portal (No Login Required)
      </Button>
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
                    <span>support@smartcms.com</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-sm text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <a href="#" className="hover:text-blue-600 transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-blue-600 transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-blue-600 transition-colors">
                      Support Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-blue-600 transition-colors">
                      System Status
                    </a>
                  </li>
                </ul>
              </div>

              {/* System Info */}
              <div>
                <h3 className="text-sm text-gray-900 mb-3">System Information</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Secure access for authorized personnel only.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>&copy; 2025 Smart CMS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Simple Built-in Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="size-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Login Failed</h3>
              </div>
              
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
                <p className="text-sm">{dialogError}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    console.log('Closing error dialog');
                    setShowErrorDialog(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}