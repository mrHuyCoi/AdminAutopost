import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  UserSubscription, 
  SubscriptionUsage, 
  PaymentHistory, 
  PricingPlan,
  UserWithSubscription 
} from '../types/pricing';
import { adminApiService } from '../services/adminApiService.js';

const SubscriptionRow: React.FC<{
  subscription: UserSubscription;
  plan: PricingPlan | null;
  onView: (subscription: UserSubscription) => void;
  onToggleActive: (subscription: UserSubscription, isActive: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ subscription, plan, onView, onToggleActive, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Usage functionality has been removed

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{subscription.userName || `User ${subscription.userId}`}</div>
            <div className="text-sm text-gray-500">{subscription.userEmail || ''}</div>
            <div className="text-sm text-gray-500 mt-1">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                {subscription.planName || plan?.name || 'Unknown Plan'}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <button
            onClick={() => onToggleActive(subscription, subscription.status !== 'active')}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${subscription.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            {getStatusIcon(subscription.status)}
            <span className="ml-1">{subscription.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</span>
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatDate(subscription.startDate)}</div>
        <div className="text-sm text-gray-500">đến {formatDate(subscription.endDate)}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(subscription)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const SubscriptionModal: React.FC<{
  subscription: UserSubscription | null;
  plan: PricingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleActive: (subscription: UserSubscription, isActive: boolean) => void;
}> = ({ subscription, plan, isOpen, onClose, onToggleActive }) => {
  const [formData, setFormData] = useState<Partial<UserSubscription>>({});

  if (!isOpen || !subscription) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết đăng ký
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Người dùng</label>
                <p className="mt-1 text-sm text-gray-900">{subscription.userName || 'Unknown User'}</p>
                <p className="text-sm text-gray-500">{subscription.userEmail || subscription.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gói đăng ký</label>
                <p className="mt-1 text-sm text-gray-900">{subscription.planName || plan?.name || 'Unknown'}</p>
                {subscription.planPrice && (
                  <p className="text-sm text-gray-500">
                    {formatCurrency(subscription.planPrice)} VNĐ / {subscription.planPeriod || 'monthly'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <p className="mt-1 text-sm text-gray-900">
                  {subscription.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(subscription.startDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(subscription.endDate)}</p>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={() => {
                    onToggleActive(subscription, subscription.status !== 'active');
                    onClose();
                  }}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${subscription.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {subscription.status === 'active' ? 'Hủy kích hoạt' : 'Kích hoạt'}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export const AdminUserSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionsAndPlans = async () => {
    setLoading(true);
    try {
      const [subscriptionsResult, plansResult] = await Promise.all([
        adminApiService.getSubscriptions({}, { page: 1, limit: 100 }),
        adminApiService.getPricingPlans()
      ]);
      setSubscriptions(subscriptionsResult.subscriptions || []);
      setPlans(plansResult.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsAndPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa subscription này?')) {
      try {
        await adminApiService.deleteSubscription(id);
        fetchSubscriptionsAndPlans();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa subscription');
        console.error('Error deleting subscription:', err);
      }
    }
  };

  const handleToggleActive = async (subscription: UserSubscription, isActive: boolean) => {
    try {
      if (isActive) {
        await adminApiService.approveSubscription(subscription.id);
      } else {
        await adminApiService.updateSubscription(subscription.id, isActive);
      }
      fetchSubscriptionsAndPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật trạng thái');
      console.error('Error updating subscription status:', err);
    }
  };

  const handleView = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setModalOpen(true);
  };

  const getPlanById = (planId: string) => plans.find(p => p.id === planId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchSubscriptionsAndPlans}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đăng ký</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các đăng ký gói dịch vụ của người dùng
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>



      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Subscriptions ({subscriptions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng & Gói</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                  plan={getPlanById(subscription.planId)}
                  onView={handleView}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy đăng ký nào</h3>
            <p className="mt-1 text-sm text-gray-500">Chưa có đăng ký nào trong hệ thống.</p>
          </div>
        )}
      </div>

      <SubscriptionModal
        subscription={selectedSubscription}
        plan={selectedSubscription ? getPlanById(selectedSubscription.planId) : null}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
};
