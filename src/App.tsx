import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BrandProvider } from './contexts/BrandContext'; // 👈 THÊM DÒNG NÀY
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Layout from './pages/layout/Layout';
import UserManagementPage from './pages/UserManagementPage';
import SubscriptionPlanPage from './pages/SubscriptionPlanPage';
import NewRegistrationsPage from './pages/NewRegistrationsPage';
import ChatbotPage from './pages/ChatbotPage';
import ChatbotPermissionsPage from './pages/ChatbotPermissionsPage';
import DeviceManagementPage from './pages/DeviceManagementPage';
import ColorManagementPage from './pages/ColorManagementPage';
import StorageManagementPage from './pages/StorageManagementPage';
import ComponentManagementPage from './pages/ComponentManagementPage';
import BrandManagementPage from './pages/BrandManagementPage';
import ServiceManagementPage from './pages/ServiceManagementPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import SupportPage from './pages/SupportPage';
import DeviceInfoManagementPage  from './pages/DeviceInfoManagementPage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  console.log('🚀 App component loaded');
  return (
    <AuthProvider>
      <BrandProvider> {/* 👈 BỌC THÊM LỚP NÀY */}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/users" replace />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/packages" element={<SubscriptionPlanPage />} />
            <Route path="/registrations" element={<NewRegistrationsPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/chatbot-permissions" element={<ChatbotPermissionsPage />} />
            <Route path="/devices" element={<DeviceManagementPage />} />
            <Route path="/device-infos" element={<DeviceInfoManagementPage />} />
            <Route path="/colors" element={<ColorManagementPage />} />
            <Route path="/storage" element={<StorageManagementPage />} />
            <Route path="/components" element={<ComponentManagementPage />} />
            <Route path="/brands" element={<BrandManagementPage />} />
            <Route path="/services" element={<ServiceManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Routes>
      </BrandProvider>
    </AuthProvider>
  );
};

export default App;
