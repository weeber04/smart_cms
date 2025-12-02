import { useState } from 'react';
import { SignInPage } from './components/SignInPage';
import { RegisterPage } from './components/RegisterPage';
import { Dashboard } from './components/Dashboard';
import { StaffSignInPage } from './components/StaffSignInPage';
import { DoctorPortal } from './components/DoctorPortal';
import { PharmacistPortal } from './components/PharmacistPortal';
import { NursePortal } from './components/NursePortal';
import { ReceptionistPortal } from './components/ReceptionistPortal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'signin' | 'register' | 'dashboard' | 'staff-signin' | 'doctor' | 'pharmacist' | 'nurse' | 'receptionist'>('signin');
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <div>
      {currentPage === 'signin' && (
        <SignInPage 
          onNavigateToRegister={() => setCurrentPage('register')}
          onSignInSuccess={(role: string) => {
            setUserRole(role);
            if (role === 'Admin') {
              setCurrentPage('dashboard');
            } else if (role === 'Doctor' || role === 'doctor') {
              setCurrentPage('doctor');
            } else if (role === 'Pharmacist') {
              setCurrentPage('pharmacist');
            } else if (role === 'Nurse') {
              setCurrentPage('nurse');
            } else if (role === 'Receptionist' || role == 'receptionist') {
              setCurrentPage('receptionist');
            }
          }}
          onNavigateToStaffSignIn={() => setCurrentPage('staff-signin')}
        />
      )}
      {currentPage === 'register' && (
        <RegisterPage onNavigateToSignIn={() => setCurrentPage('signin')} />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard onSignOut={() => {
          setUserRole(null);
          setCurrentPage('signin');
        }} />
      )}
      {currentPage === 'staff-signin' && (
        <StaffSignInPage 
          onNavigateToAdminSignIn={() => setCurrentPage('signin')}
          onSelectDoctor={() => setCurrentPage('doctor')}
          onSelectPharmacist={() => setCurrentPage('pharmacist')}
          onSelectNurse={() => setCurrentPage('nurse')}
          onSelectReceptionist={() => setCurrentPage('receptionist')}
        />
      )}
      {currentPage === 'doctor' && (
        <DoctorPortal onSignOut={() => {
          setUserRole(null);
          setCurrentPage('signin');
        }} />
      )}
      {currentPage === 'pharmacist' && (
        <PharmacistPortal onSignOut={() => {
          setUserRole(null);
          setCurrentPage('signin');
        }} />
      )}
      {currentPage === 'nurse' && (
        <NursePortal onSignOut={() => {
          setUserRole(null);
          setCurrentPage('signin');
        }} />
      )}
      {currentPage === 'receptionist' && (
        <ReceptionistPortal onSignOut={() => {
          setUserRole(null);
          setCurrentPage('signin');
        }} />
      )}
    </div>
  );
}