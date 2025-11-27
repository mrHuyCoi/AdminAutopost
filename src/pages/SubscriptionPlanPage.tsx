// src/pages/SubscriptionPlanPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen, faRobot, faPlus, faEdit, faTrash, faSync,
  faExclamationTriangle, faCheckCircle, faGift, faGem,
  faTimes, faListUl, faShieldAlt, faTag // Đổi icon Key thành Shield để biểu thị Scope
} from '@fortawesome/free-solid-svg-icons';

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

const localChatbotPlanService = {
  getAllPlans: async () => {
    const resp = await apiClient.get('/chatbot-subscriptions/admin/plans');
    return safeGetData(resp);
  },
  createPlan: async (data: any) => {
    const resp = await apiClient.post('/chatbot-subscriptions/admin/plans', data);
    return resp.data;
  },
  updatePlan: async (id: string, data: any) => {
    const resp = await apiClient.put(`/chatbot-subscriptions/admin/plans/${id}`, data);
    return resp.data;
  },
  deletePlan: async (id: string) => {
    await apiClient.delete(`/chatbot-subscriptions/admin/plans/${id}`);
  },
};

const localChatbotServiceService = {
  getAllServices: async () => {
    const resp = await apiClient.get('/chatbot-subscriptions/admin/services');
    return safeGetData(resp);
  },
  createService: async (data: { name: string; description?: string; code?: string; base_price: number }) => {
    const resp = await apiClient.post('/chatbot-subscriptions/admin/services', data);
    return resp.data;
  },
  deleteService: async (id: string) => {
    await apiClient.delete(`/chatbot-subscriptions/admin/services/${id}`);
  }
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

interface ChatbotService {
  id: string;
  name: string;
  description?: string;
  code?: string;      // Đây là Scope (vd: "Bán điện thoại")
  base_price?: number; 
}

const rawModalRoot = document.getElementById('modal-root') || document.body;

const SubscriptionPlanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'regular' | 'chatbot'>('regular');
  const [regularPlans, setRegularPlans] = useState<RegularPlan[]>([]);
  const [chatbotPlans, setChatbotPlans] = useState<ChatbotPlan[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chatbotServices, setChatbotServices] = useState<ChatbotService[]>([]);

  // Plan Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '', code: '', base_price: 0 });
  const [isSavingService, setIsSavingService] = useState(false);

  // Form Data (Plan)
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

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const plans = activeTab === 'regular' ? regularPlans : chatbotPlans;
  const totalItems = plans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = plans.slice(indexOfFirstItem, indexOfLastItem);

  // --- HELPER ---
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

  // --- API ---
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
        setRegularPlans(safeGetData(raw).map(normalizeRegularPlan));
      } else {
        const raw = await localChatbotPlanService.getAllPlans();
        setChatbotPlans(safeGetData(raw).map(normalizeChatbotPlan));
        if (chatbotServices.length === 0) loadChatbotServices();
      }
      setCurrentPage(1);
    } catch (err: any) {
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
    loadData();
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
      name: '', description: '', price: 0, monthly_price: 0, duration_days: 30,
      is_active: true, service_ids: [],
      max_videos_per_day: 3, max_scheduled_days: 7, max_stored_videos: 30,
      storage_limit_gb: 5, max_social_accounts: 5, ai_content_generation: true,
    });
    if (activeTab === 'chatbot' && chatbotServices.length === 0) loadChatbotServices();
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setIsEditMode(true);
    setEditId(plan.id);
    setModalError(null);
    if (activeTab === 'chatbot' && chatbotServices.length === 0) loadChatbotServices();

    if (activeTab === 'regular') {
      const p = normalizeRegularPlan(plan);
      setFormData({ ...p, max_videos_per_day: p.max_videos_per_day || 0, max_scheduled_days: p.max_scheduled_days || 0, max_stored_videos: p.max_stored_videos || 0, storage_limit_gb: p.storage_limit_gb || 0, max_social_accounts: p.max_social_accounts || 0, ai_content_generation: p.ai_content_generation || false });
    } else {
      const p = normalizeChatbotPlan(plan);
      setFormData({ ...p, service_ids: p.service_ids || [] });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { if (!isSaving) setShowModal(false); };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      const numberFields = ['price', 'monthly_price', 'duration_days', 'max_videos_per_day', 'max_scheduled_days', 'max_stored_videos', 'storage_limit_gb', 'max_social_accounts'];
      const val = numberFields.includes(name) ? (value === '' ? '' : Number(value)) : value;
      setFormData((prev: any) => ({ ...prev, [name]: val }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev: any) => {
      const current = Array.isArray(prev.service_ids) ? prev.service_ids : [];
      return {
        ...prev,
        service_ids: current.includes(serviceId) ? current.filter((id: string) => id !== serviceId) : [...current, serviceId]
      };
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
          name: formData.name.trim(), description: formData.description?.trim() || '',
          price: Number(formData.price), duration_days: Number(formData.duration_days), is_active: Boolean(formData.is_active),
          max_videos_per_day: Number(formData.max_videos_per_day), max_scheduled_days: Number(formData.max_scheduled_days),
          max_stored_videos: Number(formData.max_stored_videos), storage_limit_gb: Number(formData.storage_limit_gb),
          max_social_accounts: Number(formData.max_social_accounts), ai_content_generation: Boolean(formData.ai_content_generation),
        };
      } else {
        if (!formData.service_ids || formData.service_ids.length === 0) throw new Error('Phải chọn ít nhất một dịch vụ cho gói Chatbot');
        submitData = {
          name: formData.name.trim(), description: formData.description?.trim() || '',
          price: Number(formData.price), monthly_price: Number(formData.monthly_price),
          duration_days: Number(formData.duration_days), is_active: Boolean(formData.is_active),
          service_ids: formData.service_ids,
        };
      }

      if (activeTab === 'regular') {
        isEditMode && editId ? await subscriptionPlanService.updatePlan(editId, submitData) : await subscriptionPlanService.createPlan(submitData);
      } else {
        isEditMode && editId ? await localChatbotPlanService.updatePlan(editId, submitData) : await localChatbotPlanService.createPlan(submitData);
      }
      await loadData();
      setShowModal(false);
    } catch (err: any) {
      setModalError(err?.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => { setDeletingId(id); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      activeTab === 'regular' ? await subscriptionPlanService.deletePlan(deletingId) : await localChatbotPlanService.deletePlan(deletingId);
      await loadData();
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.detail || err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- SERVICE MANAGEMENT HANDLERS ---
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceData.name.trim()) return;
    if (!newServiceData.code || !newServiceData.code.trim()) {
        alert("Vui lòng nhập Scope (Mã quyền) cho dịch vụ");
        return;
    }

    setIsSavingService(true);
    try {
      await localChatbotServiceService.createService({
        ...newServiceData,
        base_price: Number(newServiceData.base_price) || 0 // Fix lỗi 422: Gửi base_price
      });
      await loadChatbotServices();
      setNewServiceData({ name: '', description: '', code: '', base_price: 0 });
    } catch (err: any) {
      alert("Lỗi tạo dịch vụ: " + (err?.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;
    try {
      await localChatbotServiceService.deleteService(id);
      await loadChatbotServices();
    } catch (err: any) {
      alert("Lỗi xóa dịch vụ: " + (err?.response?.data?.detail || err.message));
    }
  };

  // --- RENDER HELPERS ---
  const renderPriceBadge = (price: number) => price === 0 ? <span className="badge bg-info text-dark px-2 py-1">Miễn phí</span> : <strong>{price.toLocaleString('vi-VN')} ₫</strong>;
  const renderStatusBadge = (isActive: boolean) => isActive ? <span className="badge bg-success px-2 py-1">Hoạt động</span> : <span className="badge bg-secondary px-2 py-1">Vô hiệu</span>;
  const activeCount = plans.filter(p => p.is_active).length;
  const freeCount = plans.filter(p => p.price === 0).length;
  const maxPrice = plans.length > 0 ? Math.max(...plans.map(p => p.price)) : 0;

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-4">
        {/* Header & Tabs */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h1 className="h3 mb-1 text-dark fw-bold"><FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" /> Quản lý Gói dịch vụ</h1>
            <p className="text-muted mb-0 small">Gói đăng bài tự động & Gói Chatbot</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={loadData} disabled={loading}>
              <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} /> {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
            {activeTab === 'chatbot' && (
              <button className="btn btn-info text-white btn-sm shadow-sm" onClick={() => { loadChatbotServices(); setShowServiceModal(true); }}>
                <FontAwesomeIcon icon={faListUl} className="me-1" /> Dịch vụ
              </button>
            )}
            <button className="btn btn-primary btn-sm shadow-sm" onClick={openAddModal}>
              <FontAwesomeIcon icon={faPlus} className="me-1" /> Thêm gói mới
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs">
          <li className="nav-item"><button className={`nav-link ${activeTab === 'regular' ? 'active' : ''}`} onClick={() => setActiveTab('regular')}><FontAwesomeIcon icon={faBoxOpen} className="me-2" /> Gói đăng bài ({regularPlans.length})</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}><FontAwesomeIcon icon={faRobot} className="me-2" /> Gói Chatbot ({chatbotPlans.length})</button></li>
        </ul>

        {/* Stats Cards */}
        <div className="row g-3">
          <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{ background: activeTab === 'chatbot' ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><div className="card-body text-white"><div className="d-flex justify-content-between align-items-center"><div><h6 className="mb-1 opacity-75">Tổng số Gói</h6><h3 className="mb-0 fw-bold">{loading ? '...' : plans.length}</h3></div><FontAwesomeIcon icon={faBoxOpen} size="2x" className="opacity-50" /></div></div></div></div>
          <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}><div className="card-body text-white"><div className="d-flex justify-content-between align-items-center"><div><h6 className="mb-1 opacity-75">Gói Hoạt động</h6><h3 className="mb-0 fw-bold">{loading ? '...' : activeCount}</h3></div><FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" /></div></div></div></div>
          <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}><div className="card-body text-white"><div className="d-flex justify-content-between align-items-center"><div><h6 className="mb-1 opacity-75">Gói Miễn phí</h6><h3 className="mb-0 fw-bold">{loading ? '...' : freeCount}</h3></div><FontAwesomeIcon icon={faGift} size="2x" className="opacity-50" /></div></div></div></div>
          <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}><div className="card-body text-white"><div className="d-flex justify-content-between align-items-center"><div><h6 className="mb-1 opacity-75">Gói đắt nhất</h6><h3 className="mb-0 fw-bold">{loading ? '...' : `${maxPrice.toLocaleString('vi-VN')} ₫`}</h3></div><FontAwesomeIcon icon={faGem} size="2x" className="opacity-50" /></div></div></div></div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-white py-3"><h5 className="mb-0 fw-semibold text-dark">{activeTab === 'regular' ? 'Danh sách Gói đăng bài' : 'Danh sách Gói Chatbot'}</h5></div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-dark">
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Tên gói</th><th>Giá</th><th>Thời hạn</th>
                    {activeTab === 'regular' && <><th>Video/ngày</th><th>Lưu trữ</th><th>TK MXH</th></>}
                    {activeTab === 'chatbot' && <th>Services</th>}
                    <th className="text-center">Trạng thái</th><th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={10} className="text-center py-5">Đang tải dữ liệu...</td></tr> : error ? <tr><td colSpan={10} className="text-center py-5 text-danger">{error}</td></tr> : currentItems.length === 0 ? <tr><td colSpan={10} className="text-center py-5 text-muted">Chưa có gói dịch vụ nào.</td></tr> : currentItems.map((plan: any) => (
                    <tr key={plan.id} className={!plan.is_active ? 'opacity-75 bg-light' : ''}>
                      <td style={{ paddingLeft: '1.5rem' }}><div className="fw-semibold">{plan.name}</div>{plan.description && <small className="text-muted d-block">{plan.description}</small>}</td>
                      <td>{renderPriceBadge(plan.price)}</td><td><strong>{plan.duration_days}</strong> ngày</td>
                      {activeTab === 'regular' && <><td>{plan.max_videos_per_day}</td><td>{plan.storage_limit_gb} GB</td><td>{plan.max_social_accounts}</td></>}
                      {activeTab === 'chatbot' && <td><small className="text-muted">{plan.service_ids?.length || 0} dịch vụ</small></td>}
                      <td className="text-center">{renderStatusBadge(plan.is_active)}</td>
                      <td><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" onClick={() => openEditModal(plan)}><FontAwesomeIcon icon={faEdit} /></button><button className="btn btn-outline-danger" onClick={() => handleDeleteClick(plan.id)}><FontAwesomeIcon icon={faTrash} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && <div className="card-footer bg-white d-flex justify-content-end py-3"><nav><ul className="pagination pagination-sm mb-0"><li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Trước</button></li>{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}><button className="page-link" onClick={() => handlePageChange(page)}>{page}</button></li>))}<li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Sau</button></li></ul></nav></div>}
        </div>
      </div>

      {createPortal(
        <>
          {(showModal || showDeleteModal || showServiceModal) && <div className="modal-backdrop fade show"></div>}

          {/* SERVICE MANAGEMENT MODAL (FIXED) */}
          {showServiceModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content shadow-lg">
                  <div className="modal-header bg-info text-white">
                    <h5 className="modal-title"><FontAwesomeIcon icon={faListUl} className="me-2" /> Quản lý Dịch vụ Chatbot</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowServiceModal(false)} />
                  </div>
                  <div className="modal-body bg-light">
                    {/* Form thêm service */}
                    <form onSubmit={handleCreateService} className="card p-3 mb-4 shadow-sm">
                      <h6 className="fw-bold mb-3">Thêm dịch vụ mới</h6>
                      <div className="row g-2">
                        <div className="col-md-3">
                          <label className="form-label small">Tên dịch vụ *</label>
                          <input type="text" className="form-control" placeholder="VD: Gói Bán Hàng" value={newServiceData.name} onChange={e => setNewServiceData({...newServiceData, name: e.target.value})} required />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-primary">Scope (Mã quyền) *</label>
                          <div className="input-group">
                             <span className="input-group-text"><FontAwesomeIcon icon={faShieldAlt} /></span>
                             <input type="text" className="form-control" placeholder="VD: Bán điện thoại" value={newServiceData.code} onChange={e => setNewServiceData({...newServiceData, code: e.target.value})} required />
                          </div>
                        </div>
                        <div className="col-md-2">
                          <label className="form-label small fw-bold">Giá cơ bản *</label>
                          <div className="input-group">
                             <input type="number" className="form-control" placeholder="0" value={newServiceData.base_price} onChange={e => setNewServiceData({...newServiceData, base_price: Number(e.target.value)})} required min={0} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small">Mô tả</label>
                          <div className="d-flex gap-2">
                             <input type="text" className="form-control" placeholder="Mô tả ngắn" value={newServiceData.description} onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} />
                             <button type="submit" className="btn btn-primary" disabled={isSavingService} style={{minWidth: '80px'}}>
                               {isSavingService ? <FontAwesomeIcon icon={faSync} spin /> : 'Thêm'}
                             </button>
                          </div>
                        </div>
                      </div>
                    </form>

                    {/* Danh sách Services */}
                    <h6 className="fw-bold mb-2">Danh sách hiện có ({chatbotServices.length})</h6>
                    <div className="list-group shadow-sm" style={{maxHeight: '300px', overflowY: 'auto'}}>
                      {loadingServices ? <div className="p-3 text-center text-muted">Đang tải...</div> : chatbotServices.length === 0 ? <div className="p-3 text-center text-muted">Chưa có dịch vụ nào. Hãy thêm mới ở trên.</div> : 
                        chatbotServices.map(svc => (
                          <div key={svc.id} className="list-group-item list-group-item-action">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold d-flex align-items-center">
                                      {svc.name}
                                      {svc.code && <span className="badge bg-light text-dark border ms-2 font-monospace"><FontAwesomeIcon icon={faShieldAlt} className="me-1 text-primary"/>{svc.code}</span>}
                                      {svc.base_price !== undefined && <span className="badge bg-success bg-opacity-10 text-success border border-success ms-2"><FontAwesomeIcon icon={faTag} className="me-1"/>{svc.base_price.toLocaleString()}đ</span>}
                                  </div>
                                  <small className="text-muted">{svc.description || 'Không có mô tả'}</small>
                                </div>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(svc.id)}><FontAwesomeIcon icon={faTrash} /></button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>Đóng</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD/EDIT PLAN MODAL */}
          {showModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title"><FontAwesomeIcon icon={activeTab === 'chatbot' ? faRobot : faBoxOpen} className="me-2" /> {isEditMode ? 'Cập nhật Gói' : 'Thêm Gói mới'} {activeTab === 'chatbot' ? 'Chatbot' : 'đăng bài'}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} disabled={isSaving} />
                  </div>
                  <form onSubmit={handleSave}>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                      {modalError && <div className="alert alert-danger mb-3">{modalError}</div>}
                      <div className="row g-3">
                        <div className="col-12 col-md-6"><label className="form-label">Tên gói *</label><input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} required /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Giá (VND) *</label><input type="number" className="form-control" name="price" value={formData.price} onChange={handleFormChange} required min={0} /></div>
                        {activeTab === 'chatbot' && <div className="col-12 col-md-6"><label className="form-label">Giá hàng tháng *</label><input type="number" className="form-control" name="monthly_price" value={formData.monthly_price} onChange={handleFormChange} required min={0} /></div>}
                        <div className="col-12"><label className="form-label">Mô tả</label><textarea className="form-control" name="description" rows={2} value={formData.description} onChange={handleFormChange} /></div>
                        <div className="col-12 col-md-6"><label className="form-label">Thời hạn (ngày) *</label><input type="number" className="form-control" name="duration_days" value={formData.duration_days} onChange={handleFormChange} required min={1} /></div>
                        
                        {activeTab === 'chatbot' && (
                          <div className="col-12">
                            <label className="form-label fw-bold">Chọn Dịch vụ (Scope) <span className="text-danger">*</span></label>
                            {!loadingServices && chatbotServices.length === 0 && <div className="alert alert-warning">Chưa có dịch vụ nào. Vui lòng đóng cửa sổ này và nhấn nút "Dịch vụ" để tạo mới.</div>}
                            {chatbotServices.length > 0 && (
                              <div className="card p-3 bg-light">
                                <div className="row g-2">
                                  {chatbotServices.map(svc => (
                                    <div key={svc.id} className="col-12 col-md-6">
                                      <div className="form-check p-2 border rounded bg-white">
                                        <input className="form-check-input ms-1" type="checkbox" id={`svc-${svc.id}`} checked={formData.service_ids.includes(svc.id)} onChange={() => handleServiceToggle(svc.id)} />
                                        <label className="form-check-label ms-2 w-100" htmlFor={`svc-${svc.id}`} style={{cursor: 'pointer'}}>
                                            <div className="fw-bold text-primary">{svc.name}</div>
                                            {svc.code && <div className="small text-muted font-monospace"><FontAwesomeIcon icon={faShieldAlt} className="me-1 text-secondary"/>{svc.code}</div>}
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'regular' && (
                          <>
                            <div className="col-12 col-md-6"><label className="form-label">Video/ngày</label><input type="number" className="form-control" name="max_videos_per_day" value={formData.max_videos_per_day} onChange={handleFormChange} /></div>
                            <div className="col-12 col-md-6"><label className="form-label">Lên lịch (ngày)</label><input type="number" className="form-control" name="max_scheduled_days" value={formData.max_scheduled_days} onChange={handleFormChange} /></div>
                            <div className="col-12 col-md-6"><label className="form-label">Video lưu trữ</label><input type="number" className="form-control" name="max_stored_videos" value={formData.max_stored_videos} onChange={handleFormChange} /></div>
                            <div className="col-12 col-md-6"><label className="form-label">Dung lượng (GB)</label><input type="number" className="form-control" name="storage_limit_gb" value={formData.storage_limit_gb} onChange={handleFormChange} /></div>
                            <div className="col-12 col-md-6"><label className="form-label">TK MXH tối đa</label><input type="number" className="form-control" name="max_social_accounts" value={formData.max_social_accounts} onChange={handleFormChange} /></div>
                            <div className="col-12"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="ai_gen" name="ai_content_generation" checked={formData.ai_content_generation} onChange={handleFormChange} /><label className="form-check-label" htmlFor="ai_gen">Tạo nội dung AI</label></div></div>
                          </>
                        )}

                        <div className="col-12 mt-3"><div className="form-check form-switch p-3 border rounded bg-light"><input className="form-check-input" type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleFormChange} /><label className="form-check-label fw-bold ms-2" htmlFor="is_active">Kích hoạt gói này</label></div></div>
                      </div>
                    </div>
                    <div className="modal-footer bg-light"><button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button><button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}</button></div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && deletingId && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa gói</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} /></div>
                  <div className="modal-body">{deleteError && <div className="alert alert-danger mb-3">{deleteError}</div>}<p className="mb-0">Bạn có chắc chắn muốn xóa gói này không? Hành động này không thể hoàn tác.</p></div>
                  <div className="modal-footer bg-light"><button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Hủy</button><button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xóa ngay'}</button></div>
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