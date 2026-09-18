import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { KitchenDashboard } from './components/KitchenDashboard';
import { ToastProvider } from './components/Toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    const savedStaffId = localStorage.getItem('kitchen_staff_id');
    const savedStaffName = localStorage.getItem('kitchen_staff_name');

    if (savedStaffId && savedStaffName) {
      setStaffId(savedStaffId);
      setStaffName(savedStaffName);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (id: string, name: string) => {
    setStaffId(id);
    setStaffName(name);
    setIsAuthenticated(true);
    localStorage.setItem('kitchen_staff_id', id);
    localStorage.setItem('kitchen_staff_name', name);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStaffId('');
    setStaffName('');
    localStorage.removeItem('kitchen_staff_id');
    localStorage.removeItem('kitchen_staff_name');
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginScreen onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <KitchenDashboard staffId={staffId} staffName={staffName} onLogout={handleLogout} />
    </ToastProvider>
  );
}

export default App;
