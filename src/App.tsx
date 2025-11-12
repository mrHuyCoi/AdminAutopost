// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// (Giả sử bạn đã có các file này)
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import Layout from './pages/layout/Layout';
import { BrandProvider } from './contexts/BrandContext';

// Import các trang
import UserManagementPage from './pages/UserManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import SubscriptionPlanPage from './pages/SubscriptionPlanPage';
import NewRegistrationsPage from './pages/NewRegistrationsPage';
import ChatbotPage from './pages/ChatbotPage';
import ChatbotPermissionsPage from './pages/ChatbotPermissionsPage';
import DeviceManagementPage from './pages/DeviceManagementPage';
import ColorManagementPage from './pages/ColorManagementPage';
import StorageManagementPage from './pages/StorageManagementPage';
import ComponentManagementPage from './pages/ComponentManagementPage';
import BrandManagementPage from './pages/BrandManagementPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import SupportPage from './pages/SupportPage';


const App: React.FC = () => {
  return (

    <AuthProvider>
      <BrandProvider>
        <Routes>

        {/* === TUYẾN ĐƯỜNG CÔNG KHAI === */}
        <Route path="/login" element={<LoginPage />} />
        


        <Route element={<ProtectedRoute> <Layout /> </ProtectedRoute>}>
        
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/dashboard" element={<UserManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="packages" element={<SubscriptionPlanPage />} />
          <Route path="registrations" element={<NewRegistrationsPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="chatbot-permissions" element={<ChatbotPermissionsPage />} />
          <Route path="devices" element={<DeviceManagementPage />} />
          <Route path="colors" element={<ColorManagementPage />} />
          <Route path="storage" element={<StorageManagementPage />} />
          <Route path="components" element={<ComponentManagementPage />} />
          <Route path="brands" element={<BrandManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="support" element={<SupportPage />} />

        </Route>

      </Routes>
      </BrandProvider>
      
    </AuthProvider>
  );
};

export default App;