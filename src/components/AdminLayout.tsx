import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { logoutUser } from '../services/auth.service';
import { 
  Users, 
  Bell,
  Menu,
  X,
  User,
  DollarSign,
  CreditCard,
  Smartphone,
  MessageSquare,
  Package,
  Palette,
  Layers,
  Settings,
  ChevronDown,
  Shield,
  FileText
} from 'lucide-react';

interface AdminLayoutProps {}

const navigation = [
  { name: 'Người dùng', href: '/admin/users', icon: Users },
  { name: 'Gói đăng bài tự động', href: '/admin/pricing', icon: DollarSign },
  { name: 'Người dùng đăng ký', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Phân quyền Chatbot', href: '/admin/chatbot-permissions', icon: Shield },
  { 
    name: 'Chatbot', 
    href: '/admin/chatbot', 
    icon: MessageSquare,
    children: [
      { name: 'Thiết bị', href: '/admin/chatbot/devices', icon: Smartphone },
      { name: 'Thiết bị - Màu sắc', href: '/admin/chatbot/device-colors', icon: Layers },
      { name: 'Thiết bị - Dung lượng', href: '/admin/chatbot/device-storage', icon: Layers },
      { name: 'Linh kiện', href: '/admin/chatbot/product-components', icon: Package },
      { name: 'Thương hiệu', href: '/admin/service-management', icon: Palette },
      { name: 'System prompt', href: '/admin/chatbot/system-prompt', icon: FileText },
      { name: 'System prompt custom', href: '/admin/chatbot/system-prompt-custom', icon: FileText },
      { name: 'Chat', href: '/admin/chatbot/chat', icon: MessageSquare },
      { name: 'Instructions', href: '/admin/chatbot/instructions', icon: Settings },
      { name: 'Cài đặt', href: '/admin/chatbot/settings', icon: Settings },
    ]
  },
];

const NavItem: React.FC<{ item: any }> = ({ item }) => {
  const location = useLocation();
  const isParentActive = location.pathname.startsWith(item.href);
  const [isOpen, setIsOpen] = useState(isParentActive);

  if (!item.children) {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
          isParentActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <item.icon className="mr-3 h-5 w-5" />
        <span className="flex-1 text-left">{item.name}</span>
        <ChevronDown
          className={`h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pl-5 mt-1 space-y-1">
          {item.children.map((child: any) => {
            const isChildActive = location.pathname === child.href;
            return (
              <Link
                key={child.name}
                to={child.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isChildActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <child.icon className="mr-3 h-5 w-5" />
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Xử lý click outside để đóng dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Xóa token và chuyển về trang login
    //localStorage.removeItem('token');
    //localStorage.removeItem('user');
    //window.location.href = '/login';
    logoutUser();
  };

  const handleEditProfile = () => {
    // Chuyển đến trang chỉnh sửa profile
    window.location.href = '/admin/profile';
  };

  const toggleAdminMenu = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 h-px bg-gray-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-400" />
              </button>
              <div className="relative">
                <button 
                  onClick={toggleAdminMenu}
                  className="flex items-center gap-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span>Admin</span>
                  <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown menu */}
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200" ref={adminMenuRef}>
                    <button
                      onClick={handleEditProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sửa tài khoản
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};