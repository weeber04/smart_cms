import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { toast } from 'react-hot-toast';
import { Loader2, Moon, Sun } from 'lucide-react';

export function SettingsSection() {
  // ===============================
  // STATES
  // ===============================
  const [clinicName, setClinicName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#2563eb');

  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  const [maxAppointmentsPerDay, setMaxAppointmentsPerDay] = useState(20);
  const [defaultAppointmentDuration, setDefaultAppointmentDuration] = useState(30);
  const [allowSameDayBooking, setAllowSameDayBooking] = useState(true);

  const [autoApproveThreshold, setAutoApproveThreshold] = useState(5);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ===============================
  // LOAD SETTINGS (GET)
  // ===============================
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('http://localhost:3001/api/settings');
        const s = res.data;
        
        // Clinic Info
        setClinicName(s.clinic_name || '');

        // Theme
        setDarkMode(!!s.dark_mode);
        setPrimaryColor(s.primary_color || '#2563eb');

        // Notifications
        setEmailNotifications(!!s.email_notifications);
        setSmsNotifications(!!s.sms_notifications);
        setPushNotifications(!!s.push_notifications);
        setReminderHoursBefore(s.reminder_hours_before || 24);

        // Appointment Policy
        setMaxAppointmentsPerDay(s.max_appointments_per_day || 20);
        setDefaultAppointmentDuration(s.default_appointment_duration || 30);
        setAllowSameDayBooking(!!s.allow_same_day_booking);

        // Drug Policy
        setAutoApproveThreshold(s.auto_approve_threshold || 5);
        
        // Apply saved theme on load
        applyTheme(!!s.dark_mode, s.primary_color || '#2563eb');
        
      } catch (err) {
        console.error('Failed to load settings', err);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ===============================
  // APPLY THEME GLOBALLY
  // ===============================
  const applyTheme = (isDark: boolean, color?: string) => {
    // Apply dark/light mode
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
      document.body.style.backgroundColor = '#0f172a';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = '';
      localStorage.setItem('theme', 'light');
    }

    // Apply primary color
    if (color) {
      document.documentElement.style.setProperty('--primary', color);
      localStorage.setItem('primary-color', color);
    }
  };

  // ===============================
  // UPDATE HANDLERS
  // ===============================
  const handleUpdate = async (data: any, section: string) => {
    try {
      setIsSaving(true);
      const response = await axios.put('http://localhost:3001/api/settings', data);
      
      if (response.data.success) {
        toast.success(`${section} updated successfully!`);
        
        // If clinic name was updated, update it in the browser tab title
        if (data.clinicName) {
          document.title = `${data.clinicName} - Clinic System`;
          // Also update in localStorage for other pages
          localStorage.setItem('clinic-name', data.clinicName);
        }
        
        // If theme was updated, apply it immediately
        if (data.darkMode !== undefined || data.primaryColor) {
          applyTheme(data.darkMode ?? darkMode, data.primaryColor || primaryColor);
        }
        
      } else {
        toast.error(`Failed to update ${section}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || `Failed to update ${section}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateClinicInfo = () => {
    handleUpdate({
      clinicName
    }, 'Clinic Information');
  };

  const handleUpdateTheme = () => {
    handleUpdate({
      darkMode,
      primaryColor
    }, 'Theme');
  };

  const handleUpdateNotifications = () => {
    handleUpdate({
      emailNotifications,
      smsNotifications,
      pushNotifications,
      reminderHoursBefore
    }, 'Notifications');
  };

  const handleUpdateAppointmentPolicy = () => {
    handleUpdate({
      maxAppointmentsPerDay,
      defaultAppointmentDuration,
      allowSameDayBooking
    }, 'Appointment Policy');
  };

  const handleUpdateDrugPolicy = () => {
    handleUpdate({
      autoApproveThreshold
    }, 'Drug Policy');
  };

  // ===============================
  // TOGGLE DARK MODE BUTTON
  // ===============================
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    handleUpdate({ darkMode: newDarkMode }, 'Dark Mode');
  };

  // ===============================
  // UI
  // ===============================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER CARD */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">
            System Settings
          </CardTitle>
          <CardDescription className="text-base">
            Manage global configuration for clinic system
          </CardDescription>
        </CardHeader>
      </Card>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* CLINIC INFO */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Clinic Information</CardTitle>
            <CardDescription>Edit clinic name (applies to entire system)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Clinic Name</label>
              <Input 
                value={clinicName} 
                onChange={(e) => setClinicName(e.target.value)} 
                placeholder="Enter clinic name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This name will appear in page titles and system headers
              </p>
            </div>
          </CardContent>
          <CardContent className="flex justify-end pt-0">
            <Button 
              onClick={handleUpdateClinicInfo}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Clinic Name
            </Button>
          </CardContent>
        </Card>

        {/* THEME & APPEARANCE */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Theme & Appearance</CardTitle>
            <CardDescription>Customize dashboard appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3">
              <div>
                <span className="font-medium">Global Dark Mode</span>
                <p className="text-sm text-muted-foreground">Applies to entire system</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleDarkMode}
                  className="gap-2"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {darkMode ? 'Switch to Light' : 'Switch to Dark'}
                </Button>
              </div>
            </div>

            {/* Primary Color */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3">
              <div>
                <span className="font-medium">Primary Color</span>
                <p className="text-sm text-muted-foreground">Main brand color</p>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded border-2" 
                  style={{ backgroundColor: primaryColor }}
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 cursor-pointer rounded-full"
                  title="Choose primary color"
                />
              </div>
            </div>

            {/* Update Theme Button */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleUpdateTheme}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Theme
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NOTIFICATIONS */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            <CardDescription>Configure alerts and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Email Notifications', state: emailNotifications, setter: setEmailNotifications },
              { label: 'SMS Notifications', state: smsNotifications, setter: setSmsNotifications },
              { label: 'Push Notifications', state: pushNotifications, setter: setPushNotifications }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className="text-sm text-muted-foreground">Send {item.label.toLowerCase()}</p>
                </div>
                <Switch 
                  checked={item.state} 
                  onCheckedChange={item.setter} 
                />
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <span className="font-medium">Reminder Time</span>
                <p className="text-sm text-muted-foreground">Hours before appointment</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  className="w-24"
                  value={reminderHoursBefore}
                  onChange={(e) => setReminderHoursBefore(Math.max(1, +e.target.value))}
                />
                <span className="text-sm">hours</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleUpdateNotifications}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APPOINTMENT POLICY */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Appointment Policies</CardTitle>
            <CardDescription>Configure booking rules and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { 
                label: 'Max Appointments / Day', 
                value: maxAppointmentsPerDay, 
                setter: setMaxAppointmentsPerDay,
                min: 1,
                max: 100,
                unit: 'appointments'
              },
              { 
                label: 'Default Duration', 
                value: defaultAppointmentDuration, 
                setter: setDefaultAppointmentDuration,
                min: 5,
                max: 240,
                unit: 'minutes'
              }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className="text-sm text-muted-foreground">Set maximum {item.label.toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={item.min}
                    max={item.max}
                    className="w-24"
                    value={item.value}
                    onChange={(e) => item.setter(Math.max(item.min, +e.target.value))}
                  />
                  <span className="text-sm">{item.unit}</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <span className="font-medium">Allow Same-Day Booking</span>
                <p className="text-sm text-muted-foreground">Enable booking for today</p>
              </div>
              <Switch 
                checked={allowSameDayBooking} 
                onCheckedChange={setAllowSameDayBooking} 
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleUpdateAppointmentPolicy}
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DRUG POLICY */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Drug Request Policy</CardTitle>
            <CardDescription>Configure auto-approval settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-medium">Auto-Approve Threshold</span>
                  <p className="text-sm text-muted-foreground">Maximum quantity for automatic approval</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    className="w-32"
                    value={autoApproveThreshold}
                    onChange={(e) => setAutoApproveThreshold(Math.max(1, +e.target.value))}
                  />
                  <span className="text-sm">units</span>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleUpdateDrugPolicy}
                  disabled={isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Drug Policy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}