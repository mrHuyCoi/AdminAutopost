// src/pages/SubscriptionPlanPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen, faRobot, faPlus, faEdit, faTrash, faSync,
  faExclamationTriangle, faCheckCircle, faGift, faGem,
  faTimes, faListUl, faShieldAlt, faTag
} from '@fortawesome/free-solid-svg-icons';

import { subscriptionPlanService } from '../services/subscriptionPlanService';
import apiClient from '../lib/axios';

// --- HELPER ---
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

// --- API SERVICES ---
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
  createService: async (data: { name: string; description?: string; base_price: number }) => {
    const resp = await apiClient.post('/chatbot-subscriptions/admin/services', data);
    return resp.data;
  },
  deleteService: async (id: string) => {
    await apiClient.delete(`/chatbot-subscriptions/admin/services/${id}`);
  }
};

// --- INTERFACES ---
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

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '', base_price: 0 });
  const [isSavingService, setIsSavingService] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '', description: '', price: 0, monthly_price: 0, duration_days: 30,
    is_active: true, service_ids: [],
    max_videos_per_day: 3, max_scheduled_days: 7, max_stored_videos: 30,
    storage_limit_gb: 5, max_social_accounts: 5, ai_content_generation: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const plans = activeTab === 'regular' ? regularPlans : chatbotPlans;
  const totalItems = plans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = plans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- NORMALIZERS ---
  const normalizeRegularPlan = (p: any): RegularPlan => ({
    id: p.id,
    name: p.name ?? '',
    description: p.description ?? '',
    price: Number(p.price ?? 0),
    duration_days: Number(p.duration_days ?? 0),
    max_videos_per_day: Number(p.max_videos_per_day ?? 0),
    max_scheduled_days: Number(p.max_scheduled_days ?? 0),
    max_stored_videos: Number(p.max_stored_videos ?? 0),
    storage_limit_gb: Number(p.storage_limit_gb ?? 0),
    max_social_accounts: Number(p.max_social_accounts ?? 0),
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
      duration_days: Number(p.duration_days ?? 30),
      is_active: getBooleanStatus(p),
      service_ids: sIds,
    };
  };

  // --- LOAD DATA ---
  const loadChatbotServices = async () => {
    setLoadingServices(true);
    try {
      const services = await localChatbotServiceService.getAllServices();
      setChatbotServices(services);
    } catch (err) {
      console.error('Error loading services:', err);
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
      if (activeTab === 'regular') setRegularPlans([]); else setChatbotPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const title = document.getElementById('pageTitle');
    if (title) title.innerText = 'Quản lý Gói dịch vụ';
    loadData();
  }, [activeTab]);

  // --- HANDLERS ---
  const openAddModal = () => {
    setIsEditMode(false); setEditId(null); setModalError(null);
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
    setIsEditMode(true); setEditId(plan.id); setModalError(null);
    if (activeTab === 'chatbot' && chatbotServices.length === 0) loadChatbotServices();
    
    // Copy toàn bộ dữ liệu đã normalize vào form
    if (activeTab === 'regular') {
      setFormData({ ...normalizeRegularPlan(plan) });
    } else {
      setFormData({ ...normalizeChatbotPlan(plan) });
    }
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value })); // Giữ nguyên chuỗi để nhập liệu
    }
  };

  const handleServiceToggle = (id: string) => {
    setFormData((prev: any) => {
      const current = prev.service_ids || [];
      return {
        ...prev,
        service_ids: current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      if (!formData.name?.trim()) throw new Error('Tên gói không được để trống');
      
      // Payload chung
      const commonPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        price: Number(formData.price),
        duration_days: Number(formData.duration_days) || 30,
        is_active: Boolean(formData.is_active), // Quan trọng: Ép kiểu Boolean
      };

      let submitData;
      if (activeTab === 'regular') {
        submitData = {
          ...commonPayload,
          max_videos_per_day: Number(formData.max_videos_per_day),
          max_scheduled_days: Number(formData.max_scheduled_days),
          max_stored_videos: Number(formData.max_stored_videos),
          storage_limit_gb: Number(formData.storage_limit_gb),
          max_social_accounts: Number(formData.max_social_accounts),
          ai_content_generation: Boolean(formData.ai_content_generation),
        };
        if (isEditMode) await subscriptionPlanService.updatePlan(editId!, submitData);
        else await subscriptionPlanService.createPlan(submitData);
      } else {
        if (!formData.service_ids?.length) throw new Error('Chọn ít nhất 1 dịch vụ');
        submitData = {
          ...commonPayload,
          monthly_price: Number(formData.monthly_price),
          service_ids: formData.service_ids,
        };
        if (isEditMode) await localChatbotPlanService.updatePlan(editId!, submitData);
        else await localChatbotPlanService.createPlan(submitData);
      }

      await loadData();
      setShowModal(false);
    } catch (err: any) {
      setModalError(err?.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceData.name.trim()) return;
    setIsSavingService(true);
    try {
      await localChatbotServiceService.createService({
        name: newServiceData.name,
        description: newServiceData.description,
        base_price: Number(newServiceData.base_price) || 0
      });
      await loadChatbotServices();
      setNewServiceData({ name: '', description: '', base_price: 0 });
    } catch (err: any) {
      alert("Lỗi: " + (err?.response?.data?.detail || err.message));
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
      alert("Lỗi xóa: " + (err?.response?.data?.detail || err.message));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      activeTab === 'regular' ? await subscriptionPlanService.deletePlan(deletingId) : await localChatbotPlanService.deletePlan(deletingId);
      await loadData();
      setShowDeleteModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || '';
      if (msg.includes('IntegrityError') || msg.includes('NotNullViolationError')) {
          setDeleteError('KHÔNG THỂ XÓA: Gói này đang có người dùng. Vui lòng tắt kích hoạt thay vì xóa.');
      } else {
          setDeleteError('Lỗi xóa gói: ' + msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // --- UI COMPONENTS ---
  const renderPriceBadge = (price: number) => price === 0 ? <span className="badge bg-info text-dark">Miễn phí</span> : <span className="fw-bold text-success">{price.toLocaleString()} ₫</span>;
  const renderStatusBadge = (isActive: boolean) => isActive ? <span className="badge bg-success">Hoạt động</span> : <span className="badge bg-secondary">Vô hiệu</span>;

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-1 fw-bold"><FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" /> Quản lý Gói dịch vụ</h1>
            <small className="text-muted">Cấu hình các gói cước đăng bài & chatbot</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={loadData} disabled={loading}><FontAwesomeIcon icon={faSync} spin={loading} /> Làm mới</button>
            {activeTab === 'chatbot' && <button className="btn btn-info text-white btn-sm" onClick={() => { loadChatbotServices(); setShowServiceModal(true); }}><FontAwesomeIcon icon={faListUl} /> Dịch vụ</button>}
            <button className="btn btn-primary btn-sm" onClick={openAddModal}><FontAwesomeIcon icon={faPlus} /> Thêm gói</button>
          </div>
        </div>

        {/* TABS */}
        <ul className="nav nav-tabs">
          <li className="nav-item"><button className={`nav-link ${activeTab === 'regular' ? 'active' : ''}`} onClick={() => setActiveTab('regular')}><FontAwesomeIcon icon={faBoxOpen} className="me-2"/> Gói Đăng bài</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}><FontAwesomeIcon icon={faRobot} className="me-2"/> Gói Chatbot</button></li>
        </ul>

        {/* TABLE */}
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Tên gói</th>
                  <th>Giá</th>
                  <th>Thời hạn</th>
                  {activeTab === 'regular' && <><th>Video/ngày</th><th>Lưu trữ</th></>}
                  {activeTab === 'chatbot' && <th>Dịch vụ</th>}
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="text-center py-5">Đang tải...</td></tr> : currentItems.length === 0 ? <tr><td colSpan={8} className="text-center py-5 text-muted">Trống</td></tr> : 
                currentItems.map(p => (
                  <tr key={p.id} className={!p.is_active ? 'opacity-75 bg-light' : ''}>
                    <td className="ps-4"><div className="fw-bold">{p.name}</div><small className="text-muted">{p.description}</small></td>
                    <td>{renderPriceBadge(p.price)}</td>
                    <td>{p.duration_days} ngày</td>
                    {activeTab === 'regular' && <><td>{p.max_videos_per_day}</td><td>{p.storage_limit_gb} GB</td></>}
                    {activeTab === 'chatbot' && <td>
                      <div className="d-flex flex-wrap gap-1">
                        {p.service_ids?.map(sid => {
                          const s = chatbotServices.find(x => x.id === sid);
                          return s ? <span key={sid} className="badge bg-light text-dark border">{s.name}</span> : null;
                        })}
                        {(!p.service_ids || p.service_ids.length === 0) && <span className="text-muted small">-</span>}
                      </div>
                    </td>}
                    <td className="text-center">{renderStatusBadge(p.is_active)}</td>
                    <td className="text-center text-nowrap">
                       <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal(p)}><FontAwesomeIcon icon={faEdit} /></button>
                       <button className="btn btn-sm btn-outline-danger" onClick={() => {setDeletingId(p.id); setShowDeleteModal(true)}}><FontAwesomeIcon icon={faTrash} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {createPortal(
        <>
          {(showModal || showDeleteModal || showServiceModal) && <div className="modal-backdrop fade show" style={{zIndex: 1040}}></div>}

          {/* ADD/EDIT MODAL - FIX UI & STATUS */}
          {showModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content shadow">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Gói' : 'Thêm Gói mới'}</h5>
                    <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                  </div>
                  <form onSubmit={handleSave}>
                    <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                      {modalError && <div className="alert alert-danger">{modalError}</div>}
                      <div className="row g-3">
                        <div className="col-md-6"><label className="form-label">Tên gói *</label><input className="form-control" name="name" value={formData.name} onChange={handleFormChange} required /></div>
                        <div className="col-md-6"><label className="form-label">Giá (VND) *</label><input type="number" className="form-control" name="price" value={formData.price} onChange={handleFormChange} required min={0} /></div>
                        
                        {/* FIX: Nút Status đẹp hơn */}
                        <div className="col-12 d-flex align-items-center bg-light p-2 rounded border">
                           <div className="form-check form-switch ms-2">
                              <input className="form-check-input" type="checkbox" id="isActiveSwitch" name="is_active" checked={formData.is_active} onChange={handleFormChange} style={{cursor: 'pointer', transform: 'scale(1.2)'}} />
                              <label className="form-check-label fw-bold ms-3" htmlFor="isActiveSwitch" style={{cursor: 'pointer'}}>
                                 {formData.is_active ? <span className="text-success"><FontAwesomeIcon icon={faCheckCircle} /> Đang Kích hoạt</span> : <span className="text-secondary"><FontAwesomeIcon icon={faTimes} /> Đang Vô hiệu</span>}
                              </label>
                           </div>
                           <small className="text-muted ms-auto me-2">Hiển thị cho khách hàng đăng ký</small>
                        </div>

                        <div className="col-md-6"><label className="form-label">Thời hạn (ngày) *</label><input type="number" className="form-control" name="duration_days" value={formData.duration_days} onChange={handleFormChange} required min={1} /></div>
                        {activeTab === 'chatbot' && <div className="col-md-6"><label className="form-label">Giá tháng *</label><input type="number" className="form-control" name="monthly_price" value={formData.monthly_price} onChange={handleFormChange} required min={0} /></div>}
                        <div className="col-12"><label className="form-label">Mô tả</label><textarea className="form-control" name="description" value={formData.description} onChange={handleFormChange} rows={2} /></div>
                        
                        {activeTab === 'chatbot' && (
                          <div className="col-12">
                            <label className="form-label fw-bold">Dịch vụ kèm theo *</label>
                            <div className="card p-2" style={{maxHeight: '150px', overflowY: 'auto'}}>
                              {chatbotServices.map(s => (
                                <div className="form-check" key={s.id}>
                                  <input className="form-check-input" type="checkbox" id={`svc_${s.id}`} checked={formData.service_ids.includes(s.id)} onChange={() => handleServiceToggle(s.id)} />
                                  <label className="form-check-label" htmlFor={`svc_${s.id}`}>{s.name} <span className="text-muted small">({s.base_price?.toLocaleString()}đ)</span></label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activeTab === 'regular' && (
                          <>
                            <div className="col-md-4"><label className="form-label small">Video/ngày</label><input type="number" className="form-control" name="max_videos_per_day" value={formData.max_videos_per_day} onChange={handleFormChange}/></div>
                            <div className="col-md-4"><label className="form-label small">Lưu trữ (Video)</label><input type="number" className="form-control" name="max_stored_videos" value={formData.max_stored_videos} onChange={handleFormChange}/></div>
                            <div className="col-md-4"><label className="form-label small">Dung lượng (GB)</label><input type="number" className="form-control" name="storage_limit_gb" value={formData.storage_limit_gb} onChange={handleFormChange}/></div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu lại'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SERVICE MODAL */}
          {showServiceModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                   <div className="modal-header bg-info text-white"><h5 className="modal-title">Quản lý Dịch vụ Chatbot</h5><button className="btn-close btn-close-white" onClick={() => setShowServiceModal(false)}></button></div>
                   <div className="modal-body">
                      <form onSubmit={handleCreateService} className="row g-2 mb-4 align-items-end">
                        <div className="col-md-4"><label className="small">Tên dịch vụ</label><input className="form-control" value={newServiceData.name} onChange={e => setNewServiceData({...newServiceData, name: e.target.value})} required placeholder="VD: Bán hàng"/></div>
                        <div className="col-md-3"><label className="small">Giá cơ bản</label><input type="number" className="form-control" value={newServiceData.base_price} onChange={e => setNewServiceData({...newServiceData, base_price: +e.target.value})} placeholder="0"/></div>
                        <div className="col-md-3"><label className="small">Mô tả</label><input className="form-control" value={newServiceData.description} onChange={e => setNewServiceData({...newServiceData, description: e.target.value})}/></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100" disabled={isSavingService}>Thêm</button></div>
                      </form>
                      <hr/>
                      <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                        <table className="table table-sm table-hover">
                          <thead><tr><th>Tên</th><th>Giá</th><th>Mô tả</th><th></th></tr></thead>
                          <tbody>
                            {chatbotServices.map(s => (
                              <tr key={s.id}>
                                <td>{s.name}</td><td>{s.base_price?.toLocaleString()}</td><td className="small text-muted">{s.description}</td>
                                <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(s.id)}><FontAwesomeIcon icon={faTrash}/></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* DELETE MODAL */}
          {showDeleteModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
               <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                     <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa</h5><button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button></div>
                     <div className="modal-body text-center py-4">
                        {deleteError ? <div className="alert alert-danger">{deleteError}</div> : <p>Bạn có chắc muốn xóa gói này không?</p>}
                     </div>
                     <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy</button><button className="btn btn-danger" onClick={handleConfirmDelete}>Xóa</button></div>
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