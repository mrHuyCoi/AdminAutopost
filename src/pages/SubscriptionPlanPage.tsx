// src/pages/SubscriptionPlanPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen,
  faRobot,
  faPlus,
  faEdit,
  faTrash,
  faSync,
  faExclamationTriangle,
  faCheckCircle,
  faGift,
  faGem
} from '@fortawesome/free-solid-svg-icons';

// Import services
import { subscriptionPlanService } from '../services/subscriptionPlanService';
import apiClient from '../lib/axios';

// --- SERVICE DEFINITIONS ---
const safeGetData = (resp: any) => {
  const d = resp?.data || resp;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.plans)) return d.plans;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.services)) return d.services;
  return [];
};

const getBooleanStatus = (item: any): boolean => {
  if (item.is_active !== undefined) return Boolean(item.is_active);
  if (item.active !== undefined) return Boolean(item.active);
  if (item.status !== undefined) {
    if (typeof item.status === 'string') return item.status === 'active';
    return Boolean(item.status);
  }
  return true;
};

// Service type cho Chatbot Service
interface ChatbotService {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Service API cho quản lý dịch vụ
// Thay thế hoàn toàn object chatbotServiceAdmin
const chatbotServiceAdmin = {
  getAll: async (): Promise<ChatbotService[]> => {
    const resp = await apiClient.get('/chatbot-subscriptions/admin/services/');
    return safeGetData(resp).map((s: any) => ({
      id: s.id,
      name: s.name ?? '',
      description: s.description ?? '',
      is_active: getBooleanStatus(s),
    }));
  },
  create: async (data: { name: string; description?: string }) => {
    const resp = await apiClient.post('/chatbot-subscriptions/admin/services/', data);
    return resp.data;
  },
  update: async (id: string, data: { name: string; description?: string; is_active?: boolean }) => {
    const resp = await apiClient.put(`/chatbot-subscriptions/admin/services/${id}/`, data);
    return resp.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/chatbot-subscriptions/admin/services/${id}/`);
  },
};

const localChatbotPlanService = {
  getAllPlans: async () => {
    const resp = await apiClient.get('/chatbot-subscriptions/admin/plans/');
    return safeGetData(resp);
  },
  createPlan: async (data: any) => {
    const resp = await apiClient.post('/chatbot-subscriptions/admin/plans/', data);
    return resp.data;
  },
  updatePlan: async (id: string , data: any) => {
    const resp = await apiClient.put(`/chatbot-subscriptions/admin/plans/${id}/`, data);
    return resp.data;
  },
  deletePlan: async (id: string) => {
    await apiClient.delete(`/chatbot-subscriptions/admin/plans/${id}/`);
  },
};

const localChatbotServiceService = {
  getAllServices: async () => {
    const resp = await apiClient.get('/chatbot-subscriptions/admin/services/');
    return safeGetData(resp);
  },
};

// --- TYPES ---
interface RegularPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  max_videos_per_day?: number;
  max_scheduled_days?: number;
  max_stored_videos?: number;
  storage_limit_gb?: number;
  max_social_accounts?: number;
  ai_content_generation?: boolean;
  is_active: boolean;
}

interface ChatbotPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  monthly_price: number;
  duration_days: number;
  is_active: boolean;
  service_ids: string[];
}

// Modal root
const rawModalRoot = document.getElementById('modal-root') || document.body;

const SubscriptionPlanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'regular' | 'chatbot' | 'chatbot-services'>('regular');
  const [regularPlans, setRegularPlans] = useState<RegularPlan[]>([]);
  const [chatbotPlans, setChatbotPlans] = useState<ChatbotPlan[]>([]);
  const [chatbotServicesAll, setChatbotServicesAll] = useState<ChatbotService[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data lists
  const [chatbotServices, setChatbotServices] = useState<{ id: string, name: string }[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isEditServiceMode, setIsEditServiceMode] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    price: 0,
    monthly_price: 0,
    duration_days: 30,
    is_active: true,
    service_ids: [],
    max_videos_per_day: 3,
    max_scheduled_days: 7,
    max_stored_videos: 30,
    storage_limit_gb: 5,
    max_social_accounts: 5,
    ai_content_generation: true,
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const plans = activeTab === 'regular' ? regularPlans : 
                activeTab === 'chatbot' ? chatbotPlans : 
                chatbotServicesAll;
  const totalItems = plans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = plans.slice(indexOfFirstItem, indexOfLastItem);

  // --- HELPER FUNCTIONS ---
  const normalizeRegularPlan = (p: any): RegularPlan => ({
    id: p.id,
    name: p.name ?? '',
    description: p.description ?? '',
    price: Number(p.price ?? 0),
    duration_days: Number(p.duration_days ?? 0),
    max_videos_per_day: p.max_videos_per_day ? Number(p.max_videos_per_day) : 0,
    max_scheduled_days: p.max_scheduled_days ? Number(p.max_scheduled_days) : 0,
    max_stored_videos: p.max_stored_videos ? Number(p.max_stored_videos) : 0,
    storage_limit_gb: p.storage_limit_gb ? Number(p.storage_limit_gb) : 0,
    max_social_accounts: p.max_social_accounts ? Number(p.max_social_accounts) : 0,
    ai_content_generation: Boolean(p.ai_content_generation),
    is_active: getBooleanStatus(p),
  });

  const normalizeChatbotPlan = (p: any): ChatbotPlan => {
    let sIds: string[] = [];
    if (Array.isArray(p.service_ids)) {
      sIds = p.service_ids.map((s: any) => (typeof s === 'object' ? s.id : s));
    } else if (p.services && Array.isArray(p.services)) {
      sIds = p.services.map((s: any) => s.id);
    }
    
    return {
      id: p.id,
      name: p.name ?? '',
      description: p.description ?? '',
      price: Number(p.price ?? 0),
      monthly_price: Number(p.monthly_price ?? 0),
      duration_days: Number(p.duration_days ?? 0),
      is_active: getBooleanStatus(p),
      service_ids: sIds,
    };
  };

  // --- API CALLS ---
  const loadAllChatbotServices = async () => {
    setLoading(true);
    try {
      const services = await chatbotServiceAdmin.getAll();
      setChatbotServicesAll(services);
      setChatbotServices(services.map(s => ({ id: s.id, name: s.name })));
    } catch (err: any) {
      setError('Lỗi tải danh sách dịch vụ chatbot: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadChatbotServices = async () => {
    setLoadingServices(true);
    try {
      const services = await localChatbotServiceService.getAllServices();
      setChatbotServices(services);
    } catch (err) {
      console.error('Error loading chatbot services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'regular') {
        const raw = await subscriptionPlanService.getAllPlans();
        const arr = safeGetData(raw);
        setRegularPlans(arr.map(normalizeRegularPlan));
      } else if (activeTab === 'chatbot') {
        const raw = await localChatbotPlanService.getAllPlans();
        const arr = safeGetData(raw);
        setChatbotPlans(arr.map(normalizeChatbotPlan));
        
        if (chatbotServices.length === 0) {
          loadChatbotServices();
        }
      }
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      setError(err?.message || 'Lỗi tải dữ liệu');
      if (activeTab === 'regular') setRegularPlans([]);
      else setChatbotPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    if (titleElement) titleElement.innerText = 'Quản lý Gói dịch vụ';
    if (subtitleElement) subtitleElement.innerText = 'Gói đăng bài & Gói Chatbot';

    if (activeTab === 'chatbot-services') {
      loadAllChatbotServices();
    } else {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  // --- MODAL HANDLERS ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    
    setFormData({
      name: '',
      description: '',
      price: 0,
      monthly_price: 0,
      duration_days: 30,
      is_active: true,
      service_ids: [],
      max_videos_per_day: 3,
      max_scheduled_days: 7,
      max_stored_videos: 30,
      storage_limit_gb: 5,
      max_social_accounts: 5,
      ai_content_generation: true,
    });

    if (activeTab === 'chatbot' && chatbotServices.length === 0) {
      loadChatbotServices();
    }
    
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setIsEditMode(true);
    setEditId(plan.id);
    setModalError(null);

    if (activeTab === 'chatbot' && chatbotServices.length === 0) {
      loadChatbotServices();
    }

    if (activeTab === 'regular') {
      const p = normalizeRegularPlan(plan);
      setFormData({
        ...p,
        max_videos_per_day: p.max_videos_per_day || 0,
        max_scheduled_days: p.max_scheduled_days || 0,
        max_stored_videos: p.max_stored_videos || 0,
        storage_limit_gb: p.storage_limit_gb || 0,
        max_social_accounts: p.max_social_accounts || 0,
        ai_content_generation: p.ai_content_generation || false
      });
    } else {
      const p = normalizeChatbotPlan(plan);
      setFormData({
        ...p,
        service_ids: p.service_ids || []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (!isSaving) setShowModal(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      const numberFields = [
        'price', 'monthly_price', 'duration_days', 'max_videos_per_day', 
        'max_scheduled_days', 'max_stored_videos', 'storage_limit_gb', 'max_social_accounts'
      ];
      
      const val = numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value;
      setFormData((prev: any) => ({ ...prev, [name]: val }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev: any) => {
      const currentServices = Array.isArray(prev.service_ids) ? prev.service_ids : [];
      if (currentServices.includes(serviceId)) {
        return {
          ...prev,
          service_ids: currentServices.filter((id: string) => id !== serviceId)
        };
      } else {
        return {
          ...prev,
          service_ids: [...currentServices, serviceId]
        };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      if (!formData.name?.trim()) throw new Error('Tên gói không được để trống');

      let submitData: any = {};

      if (activeTab === 'regular') {
        submitData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          price: Number(formData.price),
          duration_days: Number(formData.duration_days),
          is_active: Boolean(formData.is_active),
          max_videos_per_day: Number(formData.max_videos_per_day),
          max_scheduled_days: Number(formData.max_scheduled_days),
          max_stored_videos: Number(formData.max_stored_videos),
          storage_limit_gb: Number(formData.storage_limit_gb),
          max_social_accounts: Number(formData.max_social_accounts),
          ai_content_generation: Boolean(formData.ai_content_generation),
        };
      } else {
        if (!formData.service_ids || formData.service_ids.length === 0) {
          throw new Error('Phải chọn ít nhất một dịch vụ cho gói Chatbot');
        }

        submitData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          price: Number(formData.price),
          monthly_price: Number(formData.monthly_price),
          duration_days: Number(formData.duration_days),
          is_active: Boolean(formData.is_active),
          service_ids: formData.service_ids,
        };
      }

      if (activeTab === 'regular') {
        if (isEditMode && editId) {
          await subscriptionPlanService.updatePlan(editId, submitData);
        } else {
          await subscriptionPlanService.createPlan(submitData);
        }
      } else {
        if (isEditMode && editId) {
          await localChatbotPlanService.updatePlan(editId, submitData);
        } else {
          await localChatbotPlanService.createPlan(submitData);
        }
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving plan:', err);
      if (err?.response?.status === 422 && err?.response?.data?.detail) {
        const details = err.response.data.detail;
        if (Array.isArray(details)) {
          const msgs = details.map((d: any) => `${d.loc?.join('.')} : ${d.msg}`).join('\n');
          setModalError(`Lỗi dữ liệu:\n${msgs}`);
        } else {
          setModalError(String(details));
        }
      } else {
        setModalError(err.message || 'Có lỗi xảy ra khi lưu.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (activeTab === 'chatbot-services') {
      // Xử lý xóa dịch vụ
      setDeletingId(id);
      setDeleteError(null);
      setShowDeleteModal(true);
    } else {
      // Xử lý xóa gói
      setDeletingId(id);
      setDeleteError(null);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (activeTab === 'regular') {
        await subscriptionPlanService.deletePlan(deletingId);
      } else if (activeTab === 'chatbot') {
        await localChatbotPlanService.deletePlan(deletingId);
      } else if (activeTab === 'chatbot-services') {
        await chatbotServiceAdmin.delete(deletingId);
        await loadAllChatbotServices();
      }
      await loadData();
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error('Error deleting:', err);
      setDeleteError(err?.response?.data?.detail || err.message || 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderPriceBadge = (price: number) => {
    if (price === 0) return <span className="badge bg-info text-dark px-2 py-1">Miễn phí</span>;
    return <strong>{price.toLocaleString('vi-VN')} ₫</strong>;
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive
      ? <span className="badge bg-success px-2 py-1">Hoạt động</span>
      : <span className="badge bg-secondary px-2 py-1">Vô hiệu</span>;
  };

  // Tính toán thống kê
  const activeCount = plans.filter(p => p.is_active).length;
  const freeCount = plans.filter(p => p.price === 0).length;
  const maxPrice = plans.length > 0 ? Math.max(...plans.map(p => p.price)) : 0;

  // --- RENDER ---
  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-4">
        {/* Header & Tabs */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h1 className="h3 mb-1 text-dark fw-bold">
              <FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" />
              Quản lý Gói dịch vụ
            </h1>
            <p className="text-muted mb-0 small">Gói đăng bài tự động & Gói Chatbot</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={() => activeTab === 'chatbot-services' ? loadAllChatbotServices() : loadData()}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
            {activeTab === 'chatbot-services' ? (
              <button
                className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
                onClick={() => {
                  setIsEditServiceMode(false);
                  setEditingServiceId(null);
                  setServiceFormData({ name: '', description: '', is_active: true });
                  setServiceError(null);
                  setShowServiceModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Thêm dịch vụ
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
                onClick={openAddModal}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Thêm gói mới
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'regular' ? 'active' : ''}`}
              onClick={() => setActiveTab('regular')}
            >
              <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
              Gói đăng bài ({regularPlans.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'chatbot' ? 'active' : ''}`}
              onClick={() => setActiveTab('chatbot')}
            >
              <FontAwesomeIcon icon={faRobot} className="me-2" />
              Gói Chatbot ({chatbotPlans.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'chatbot-services' ? 'active' : ''}`}
              onClick={() => setActiveTab('chatbot-services')}
            >
              <FontAwesomeIcon icon={faRobot} className="me-2" />
              Dịch vụ Chatbot ({chatbotServicesAll.length})
            </button>
          </li>
        </ul>

        {/* Stats Cards - Ẩn khi ở tab dịch vụ */}
        {activeTab !== 'chatbot-services' && (
          <div className="row g-3">
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: activeTab === 'chatbot' ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Tổng số Gói</h6>
                      <h3 className="mb-0 fw-bold">{loading ? '...' : plans.length}</h3>
                    </div>
                    <FontAwesomeIcon icon={faBoxOpen} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Gói Hoạt động</h6>
                      <h3 className="mb-0 fw-bold">{loading ? '...' : activeCount}</h3>
                    </div>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Gói Miễn phí</h6>
                      <h3 className="mb-0 fw-bold">{loading ? '...' : freeCount}</h3>
                    </div>
                    <FontAwesomeIcon icon={faGift} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Gói đắt nhất</h6>
                      <h3 className="mb-0 fw-bold">{loading ? '...' : `${maxPrice.toLocaleString('vi-VN')} ₫`}</h3>
                    </div>
                    <FontAwesomeIcon icon={faGem} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        {activeTab === 'chatbot-services' ? (
          // Tab Dịch vụ Chatbot
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-semibold text-dark">
                Quản lý Dịch vụ Chatbot
              </h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={loadAllChatbotServices}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} /> Làm mới
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Tên dịch vụ</th>
                      <th>Mô tả</th>
                      <th className="text-center">Trạng thái</th>
                      <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-5">Đang tải...</td></tr>
                    ) : chatbotServicesAll.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-5 text-muted">Chưa có dịch vụ nào</td></tr>
                    ) : (
                      chatbotServicesAll.map(service => (
                        <tr key={service.id}>
                          <td className="fw-semibold">{service.name}</td>
                          <td className="text-muted small">{service.description || '-'}</td>
                          <td className="text-center">{renderStatusBadge(service.is_active)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  setIsEditServiceMode(true);
                                  setEditingServiceId(service.id);
                                  setServiceFormData({
                                    name: service.name,
                                    description: service.description || '',
                                    is_active: service.is_active,
                                  });
                                  setServiceError(null);
                                  setShowServiceModal(true);
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteClick(service.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Tab Gói dịch vụ (Regular & Chatbot)
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold text-dark">
                {activeTab === 'regular' ? 'Danh sách Gói đăng bài' : 'Danh sách Gói Chatbot'}
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-dark">
                    <tr>
                      <th style={{ paddingLeft: '1.5rem' }}>Tên gói</th>
                      <th>Giá</th>
                      <th>Thời hạn</th>
                      {activeTab === 'regular' && (
                        <>
                          <th>Video/ngày</th>
                          <th>Lưu trữ</th>
                          <th>TK MXH</th>
                        </>
                      )}
                      {activeTab === 'chatbot' && (
                        <th>Services</th>
                      )}
                      <th className="text-center">Trạng thái</th>
                      <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={10} className="text-center py-5">Đang tải dữ liệu...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={10} className="text-center py-5 text-danger">{error}</td></tr>
                    ) : currentItems.length === 0 ? (
                      <tr><td colSpan={10} className="text-center py-5 text-muted">Chưa có gói dịch vụ nào.</td></tr>
                    ) : (
                      currentItems.map((plan: any) => (
                        <tr key={plan.id} className={!plan.is_active ? 'opacity-75 bg-light' : ''}>
                          <td style={{ paddingLeft: '1.5rem' }}>
                            <div className="fw-semibold">{plan.name}</div>
                            {plan.description && <small className="text-muted d-block">{plan.description}</small>}
                          </td>
                          <td>{renderPriceBadge(plan.price)}</td>
                          <td><strong>{plan.duration_days}</strong> ngày</td>
                          
                          {activeTab === 'regular' && (
                            <>
                              <td>{plan.max_videos_per_day}</td>
                              <td>{plan.storage_limit_gb} GB</td>
                              <td>{plan.max_social_accounts}</td>
                            </>
                          )}
                          
                          {activeTab === 'chatbot' && (
                            <td>
                              <small className="text-muted">
                                {plan.service_ids?.length || 0} dịch vụ
                              </small>
                            </td>
                          )}
                          
                          <td className="text-center">{renderStatusBadge(plan.is_active)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => openEditModal(plan)} title="Sửa">
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button className="btn btn-outline-danger" onClick={() => handleDeleteClick(plan.id)} title="Xóa">
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white d-flex justify-content-end py-3">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Trước</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Sau</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {createPortal(
        <>
          {(showModal || showDeleteModal || showServiceModal) && <div className="modal-backdrop fade show"></div>}

          {/* ADD/EDIT PLAN MODAL */}
          {showModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={activeTab === 'chatbot' ? faRobot : faBoxOpen} className="me-2" />
                      {isEditMode ? 'Cập nhật Gói' : 'Thêm Gói mới'} {activeTab === 'chatbot' ? 'Chatbot' : 'đăng bài'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} disabled={isSaving} />
                  </div>

                  <form onSubmit={handleSave}>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                      {modalError && (
                        <div className="alert alert-danger mb-3" style={{ whiteSpace: 'pre-line' }}>
                          <div className="fw-bold mb-1">Lỗi:</div>
                          {modalError}
                        </div>
                      )}

                      <div className="row g-3">
                        {/* Common Fields */}
                        <div className="col-12 col-md-6">
                          <label className="form-label">Tên gói <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            required
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label">Giá (VND) <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            name="price"
                            value={formData.price}
                            onChange={handleFormChange}
                            required
                            min={0}
                          />
                        </div>

                        {activeTab === 'chatbot' && (
                          <div className="col-12 col-md-6">
                            <label className="form-label">Giá hàng tháng (VND) <span className="text-danger">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              name="monthly_price"
                              value={formData.monthly_price}
                              onChange={handleFormChange}
                              required
                              min={0}
                            />
                          </div>
                        )}

                        <div className="col-12">
                          <label className="form-label">Mô tả</label>
                          <textarea
                            className="form-control"
                            name="description"
                            rows={2}
                            value={formData.description}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label">Thời hạn (ngày) <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            name="duration_days"
                            value={formData.duration_days}
                            onChange={handleFormChange}
                            required
                            min={1}
                          />
                        </div>

                        {/* Chatbot Services */}
                        {activeTab === 'chatbot' && (
                          <div className="col-12">
                            <label className="form-label fw-bold">Dịch vụ Chatbot <span className="text-danger">*</span></label>
                            
                            {loadingServices && (
                              <div className="text-muted mb-2">
                                <FontAwesomeIcon icon={faSync} spin className="me-2"/> Đang tải danh sách dịch vụ...
                              </div>
                            )}

                            {!loadingServices && chatbotServices.length === 0 && (
                              <div className="alert alert-warning">
                                Không tìm thấy dịch vụ nào. Vui lòng kiểm tra lại cấu hình Services API.
                              </div>
                            )}

                            {!loadingServices && chatbotServices.length > 0 && (
                              <div className="card p-3 bg-light">
                                <div className="row g-2">
                                  {chatbotServices.map(service => (
                                    <div key={service.id} className="col-12 col-md-6">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`service-${service.id}`}
                                          checked={formData.service_ids.includes(service.id)}
                                          onChange={() => handleServiceToggle(service.id)}
                                        />
                                        <label className="form-check-label" htmlFor={`service-${service.id}`}>
                                          {service.name}
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {formData.service_ids.length === 0 && (
                                  <div className="text-danger small mt-2">Vui lòng tích chọn ít nhất một dịch vụ.</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Regular Plan Fields */}
                        {activeTab === 'regular' && (
                          <>
                            <div className="col-12 col-md-6">
                              <label className="form-label">Video/ngày</label>
                              <input
                                type="number"
                                className="form-control"
                                name="max_videos_per_day"
                                value={formData.max_videos_per_day}
                                onChange={handleFormChange}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">Lên lịch (ngày)</label>
                              <input
                                type="number"
                                className="form-control"
                                name="max_scheduled_days"
                                value={formData.max_scheduled_days}
                                onChange={handleFormChange}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">Video lưu trữ</label>
                              <input
                                type="number"
                                className="form-control"
                                name="max_stored_videos"
                                value={formData.max_stored_videos}
                                onChange={handleFormChange}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">Dung lượng (GB)</label>
                              <input
                                type="number"
                                className="form-control"
                                name="storage_limit_gb"
                                value={formData.storage_limit_gb}
                                onChange={handleFormChange}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">TK MXH tối đa</label>
                              <input
                                type="number"
                                className="form-control"
                                name="max_social_accounts"
                                value={formData.max_social_accounts}
                                onChange={handleFormChange}
                              />
                            </div>
                            <div className="col-12">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ai_content_generation"
                                  name="ai_content_generation"
                                  checked={formData.ai_content_generation}
                                  onChange={handleFormChange}
                                />
                                <label className="form-check-label" htmlFor="ai_content_generation">Tạo nội dung AI</label>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Status Toggle */}
                        <div className="col-12 mt-3">
                          <div className="form-check form-switch p-3 border rounded bg-light">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_active"
                              name="is_active"
                              checked={formData.is_active}
                              onChange={handleFormChange}
                            />
                            <label className="form-check-label fw-bold ms-2" htmlFor="is_active">
                              Kích hoạt gói này (Hiển thị cho người dùng đăng ký)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer bg-light">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang lưu...
                          </>
                        ) : (
                          isEditMode ? 'Cập nhật' : 'Thêm mới'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SERVICE MODAL */}
          {showServiceModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-md">
                <div className="modal-content shadow-lg">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={faRobot} className="me-2" />
                      {isEditServiceMode ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
                    </h5>
                    <button className="btn-close btn-close-white" onClick={() => setShowServiceModal(false)} disabled={savingService} />
                  </div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingService(true);
                    setServiceError(null);
                    try {
                      if (!serviceFormData.name.trim()) throw new Error('Tên dịch vụ không được để trống');

                      if (isEditServiceMode && editingServiceId) {
                        await chatbotServiceAdmin.update(editingServiceId, {
                          name: serviceFormData.name.trim(),
                          description: serviceFormData.description,
                          is_active: serviceFormData.is_active,
                        });
                      } else {
                        await chatbotServiceAdmin.create({
                          name: serviceFormData.name.trim(),
                          description: serviceFormData.description,
                        });
                      }
                      await loadAllChatbotServices();
                      setShowServiceModal(false);
                    } catch (err: any) {
                      setServiceError(err.message || 'Lỗi khi lưu dịch vụ');
                    } finally {
                      setSavingService(false);
                    }
                  }}>
                    <div className="modal-body">
                      {serviceError && <div className="alert alert-danger">{serviceError}</div>}
                      <div className="mb-3">
                        <label className="form-label">Tên dịch vụ <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={serviceFormData.name}
                          onChange={e => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Mô tả</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={serviceFormData.description}
                          onChange={e => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="service_active"
                          checked={serviceFormData.is_active}
                          onChange={e => setServiceFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="service_active">
                          Kích hoạt dịch vụ này
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)} disabled={savingService}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={savingService}>
                        {savingService ? 'Đang lưu...' : (isEditServiceMode ? 'Cập nhật' : 'Thêm mới')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* DELETE MODAL */}
          {showDeleteModal && deletingId && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Xác nhận xóa {activeTab === 'chatbot-services' ? 'dịch vụ' : 'gói'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} />
                  </div>
                  <div className="modal-body">
                    {deleteError && <div className="alert alert-danger mb-3">{deleteError}</div>}
                    <p className="mb-0">
                      Bạn có chắc chắn muốn xóa {activeTab === 'chatbot-services' ? 'dịch vụ' : 'gói'} này không? Hành động này không thể hoàn tác.
                    </p>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                      Hủy
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                      {isDeleting ? 'Đang xóa...' : 'Xóa ngay'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        rawModalRoot
      )}
    </>
  );
};

export default SubscriptionPlanPage;