import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings, 
  Package, 
  Shield,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  ChatbotService, 
  ChatbotPlan, 
  UserChatbotSubscription,
  ChatbotPermission,
  ChatbotServiceCreate,
  ChatbotPlanCreate
} from '../types/chatbot';
import { chatbotService } from '../services/chatbotService';
import { ChatbotServiceModal } from '../components/ChatbotServiceModal';
import { ChatbotPlanModal } from '../components/ChatbotPlanModal';
import Swal from 'sweetalert2';

type TabType = 'services' | 'plans' | 'subscriptions' | 'permissions';

export const AdminChatbotPermissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [services, setServices] = useState<ChatbotService[]>([]);
  const [plans, setPlans] = useState<ChatbotPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserChatbotSubscription[]>([]);
  const [permissions, setPermissions] = useState<ChatbotPermission[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<ChatbotService | null>(null);
  const [currentPlan, setCurrentPlan] = useState<ChatbotPlan | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesData, plansData, subscriptionsData, permissionsData] = await Promise.all([
        chatbotService.getServices(),
        chatbotService.getPlans(),
        chatbotService.getUserSubscriptions(),
        chatbotService.getPermissions()
      ]);
      
      setServices(servicesData);
      setPlans(plansData);
      setSubscriptions(subscriptionsData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Lỗi', 'Không thể tải dữ liệu chatbot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = async (subscription: UserChatbotSubscription) => {
    // Build a small form with plan select, months, status, is_active
    const planOptions = plans.map(p => `<option value="${p.id}" ${p.id === subscription.plan.id ? 'selected' : ''}>${p.name}</option>`).join('');
    const html = `
      <div class="space-y-3 text-left">
        <label class="block text-sm font-medium text-gray-700">Gói cước</label>
        <select id="swal-plan" class="swal2-select">${planOptions}</select>

        <label class="block text-sm font-medium text-gray-700 mt-2">Số tháng</label>
        <input id="swal-months" type="number" min="1" value="${subscription.months_subscribed}" class="swal2-input" />

        <label class="block text-sm font-medium text-gray-700 mt-2">Trạng thái</label>
        <select id="swal-status" class="swal2-select">
          <option value="pending" ${subscription.status === 'pending' ? 'selected' : ''}>Chờ phê duyệt</option>
          <option value="approved" ${subscription.status === 'approved' ? 'selected' : ''}>Đã phê duyệt</option>
          <option value="rejected" ${subscription.status === 'rejected' ? 'selected' : ''}>Đã từ chối</option>
        </select>

        <label class="inline-flex items-center mt-2">
          <input id="swal-active" type="checkbox" class="mr-2" ${subscription.is_active ? 'checked' : ''} />
          <span>Kích hoạt</span>
        </label>
      </div>
    `;

    const result = await Swal.fire({
      title: 'Cập nhật đăng ký',
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const plan_id = (document.getElementById('swal-plan') as HTMLSelectElement)?.value;
        const monthsStr = (document.getElementById('swal-months') as HTMLInputElement)?.value;
        const status = (document.getElementById('swal-status') as HTMLSelectElement)?.value as 'pending' | 'approved' | 'rejected';
        const is_active = (document.getElementById('swal-active') as HTMLInputElement)?.checked;
        const months = parseInt(monthsStr || '0', 10);
        if (!months || months < 1) {
          Swal.showValidationMessage('Số tháng phải >= 1');
          return;
        }
        return { plan_id, months_subscribed: months, status, is_active };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await chatbotService.updateUserSubscription(subscription.id, result.value);
        Swal.fire('Thành công', 'Cập nhật đăng ký thành công!', 'success');
        fetchData();
      } catch (error) {
        console.error('Error updating subscription:', error);
        Swal.fire('Lỗi', 'Không thể cập nhật đăng ký.', 'error');
      }
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa đăng ký này? Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await chatbotService.deleteUserSubscription(subscriptionId);
        Swal.fire('Thành công', 'Đã xóa đăng ký.', 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting subscription:', error);
        Swal.fire('Lỗi', 'Không thể xóa đăng ký.', 'error');
      }
    }
  };

  // Service Management
  const handleOpenServiceModal = (service: ChatbotService | null = null) => {
    setCurrentService(service);
    setServiceModalOpen(true);
  };

  const handleCloseServiceModal = () => {
    setServiceModalOpen(false);
    setCurrentService(null);
  };

  const handleSaveService = async (service: ChatbotService | ChatbotServiceCreate) => {
    try {
      if (currentService) {
        // Update existing service
        await chatbotService.updateService(currentService.id, service as ChatbotService);
        Swal.fire('Thành công', 'Cập nhật dịch vụ thành công!', 'success');
      } else {
        // Create new service
        await chatbotService.createService(service as ChatbotServiceCreate);
        Swal.fire('Thành công', 'Tạo dịch vụ mới thành công!', 'success');
      }
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      Swal.fire('Lỗi', 'Không thể lưu dịch vụ.', 'error');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa dịch vụ này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await chatbotService.deleteService(serviceId);
        Swal.fire('Thành công', 'Xóa dịch vụ thành công!', 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting service:', error);
        Swal.fire('Lỗi', 'Không thể xóa dịch vụ.', 'error');
      }
    }
  };

  // Plan Management
  const handleOpenPlanModal = (plan: ChatbotPlan | null = null) => {
    setCurrentPlan(plan);
    setPlanModalOpen(true);
  };

  const handleClosePlanModal = () => {
    setPlanModalOpen(false);
    setCurrentPlan(null);
  };

  const handleSavePlan = async (plan: ChatbotPlan | ChatbotPlanCreate) => {
    try {
      if (currentPlan) {
        // Update existing plan
        await chatbotService.updatePlan(currentPlan.id, plan as ChatbotPlan);
        Swal.fire('Thành công', 'Cập nhật gói cước thành công!', 'success');
      } else {
        // Create new plan
        await chatbotService.createPlan(plan as ChatbotPlanCreate);
        Swal.fire('Thành công', 'Tạo gói cước mới thành công!', 'success');
      }
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      Swal.fire('Lỗi', 'Không thể lưu gói cước.', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa gói cước này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await chatbotService.deletePlan(planId);
        Swal.fire('Thành công', 'Xóa gói cước thành công!', 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting plan:', error);
        Swal.fire('Lỗi', 'Không thể xóa gói cước.', 'error');
      }
    }
  };

  const handleApproveSubscription = async (subscriptionId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận phê duyệt',
      text: 'Bạn có chắc chắn muốn phê duyệt đăng ký này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Phê duyệt',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await chatbotService.approveSubscription(subscriptionId);
        Swal.fire('Thành công', 'Đã phê duyệt đăng ký thành công!', 'success');
        fetchData();
      } catch (error) {
        console.error('Error approving subscription:', error);
        Swal.fire('Lỗi', 'Không thể phê duyệt đăng ký.', 'error');
      }
    }
  };

  const handleRejectSubscription = async (subscriptionId: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận từ chối',
      text: 'Bạn có chắc chắn muốn từ chối đăng ký này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await chatbotService.rejectSubscription(subscriptionId);
        Swal.fire('Thành công', 'Đã từ chối đăng ký thành công!', 'success');
        fetchData();
      } catch (error) {
        console.error('Error rejecting subscription:', error);
        Swal.fire('Lỗi', 'Không thể từ chối đăng ký.', 'error');
      }
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chatbot Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý dịch vụ, gói cước và phân quyền chatbot
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'services', label: 'Dịch vụ', icon: Settings, count: services.length },
            { id: 'plans', label: 'Gói cước', icon: Package, count: plans.length },
            { id: 'subscriptions', label: 'Đăng ký', icon: Users, count: subscriptions.length },
            { id: 'permissions', label: 'Phân quyền', icon: Shield, count: permissions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Dịch vụ Chatbot</h3>
            <button
              onClick={() => handleOpenServiceModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Thêm dịch vụ
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dịch vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá cơ bản</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {service.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(service.base_price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenServiceModal(service)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Gói cước Chatbot</h3>
            <button
              onClick={() => handleOpenPlanModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Thêm gói cước
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên gói</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá/tháng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {plan.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(plan.monthly_price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {plan.services.map((service) => (
                          <span
                            key={service.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenPlanModal(plan)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Đăng ký Chatbot</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gói cước</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.user?.full_name || 'Không có tên'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.user?.email || `User ${subscription.user_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.plan.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.months_subscribed} tháng
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.is_active)}`}>
                        {getStatusIcon(subscription.is_active)}
                        <span className="ml-1">
                          {subscription.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </span>
                      </span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          subscription.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subscription.status === 'pending' ? 'Chờ phê duyệt' :
                           subscription.status === 'approved' ? 'Đã phê duyệt' :
                           'Đã từ chối'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(subscription.total_price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        {subscription.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveSubscription(subscription.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Phê duyệt"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectSubscription(subscription.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Từ chối"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditSubscription(subscription)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Phân quyền Chatbot</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{permission.user_name}</div>
                      <div className="text-sm text-gray-500">{permission.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{permission.service_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(permission.is_active)}`}>
                        {getStatusIcon(permission.is_active)}
                        <span className="ml-1">
                          {permission.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {permission.granted_at && formatDate(permission.granted_at)}
                      </div>
                      {permission.expires_at && (
                        <div className="text-sm text-gray-500">
                          Hết hạn: {formatDate(permission.expires_at)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChatbotServiceModal
        isOpen={serviceModalOpen}
        onClose={handleCloseServiceModal}
        onSave={handleSaveService}
        currentService={currentService}
      />

      <ChatbotPlanModal
        isOpen={planModalOpen}
        onClose={handleClosePlanModal}
        onSave={handleSavePlan}
        currentPlan={currentPlan}
        availableServices={services}
      />
    </div>
  );
}; 