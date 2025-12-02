import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Phone, Clock, Lock, Mail, MapPin, Heart } from 'lucide-react';

export function SignInPage({ 
  onNavigateToRegister, 
  onSignInSuccess, 
  onNavigateToStaffSignIn 
}: { 
  onNavigateToRegister: () => void; 
  onSignInSuccess: (role: string) => void; 
  onNavigateToStaffSignIn: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // In your SignInPage component, update the fetch URL:
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify({
      userId: data.userId,
      name: data.name,
      role: data.role,
      email: email
    }));

    // Pass the role back to parent and let it handle navigation
    onSignInSuccess(data.role);
  } catch {
    alert("Server connection error.");
  }
};

  return (
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
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
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
  );
}