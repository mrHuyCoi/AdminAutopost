// // src/services/chatbotSubscriptionService.ts
// import http from '../lib/axios';

// export interface ChatbotPlan {
//   id: string;
//   name: string;
//   price: number;
//   duration_days: number;
// }

// export interface UserChatbotSubscription {
//   id: string;
//   user_id: string;
//   plan_id: string;
//   status: 'pending' | 'approved' | 'rejected';
//   start_date: string;
//   end_date: string;
//   total_price: number;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
//   user?: { id: string; email: string; full_name: string };
//   plan?: ChatbotPlan;
//   admin_notes?: string;
// }

// const unwrapData = (response: any): any => {
//   const data = response?.data;
//   if (data?.data) return data.data;
//   if (Array.isArray(data?.items)) return data.items;
//   if (Array.isArray(data)) return data;
//   if (data) return data;
//   return response;
// };

// export const chatbotSubscriptionService = {
//   getAllSubscriptions: async (): Promise<UserChatbotSubscription[]> => {
//     const res = await http.get('/chatbot-subscriptions/admin/subscriptions');
//     return unwrapData(res);
//   },

//   approveSubscription: async (
//     id: string, 
//     adminId: string, 
//     notes?: string | null
//   ): Promise<UserChatbotSubscription> => {
//     // Body chỉ chứa notes (nếu cần)
//     const bodyData = { 
//         notes: notes,

//         status: 'approved' 
//     };

//     const res = await http.post(
//         `/chatbot-subscriptions/admin/subscriptions/${id}/approve`, 
//         bodyData, 
//         { 
//             params: { admin_id: adminId } // <-- Gửi admin_id ở đây
//         }
//     );
//     return unwrapData(res);
//   },

//   rejectSubscription: async (
//     id: string, 
//     adminId: string, 
//     notes: string
//   ): Promise<UserChatbotSubscription> => {
//     const bodyData = {
//         notes: notes,
//         status: 'rejected'
//     };

//     const res = await http.post(
//         `/chatbot-subscriptions/admin/subscriptions/${id}/reject`, 
//         bodyData,
//         { 
//             params: { admin_id: adminId } // <-- Gửi admin_id ở đây
//         }
//     );
//     return unwrapData(res);
//   },

//   deleteSubscription: async (id: string): Promise<void> => {
//     await http.delete(`/chatbot-subscriptions/admin/subscriptions/${id}`);
//   },

//   getAllChatbotPlans: async (): Promise<ChatbotPlan[]> => {
//     const res = await http.get('/chatbot-subscriptions/plans');
//     return unwrapData(res);
//   }
// };


// src/services/chatbotSubscriptionService.ts
import http from '../lib/axios';

export interface ChatbotPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

export interface UserChatbotSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date: string;
  total_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: string; email: string; full_name: string };
  plan?: ChatbotPlan;
  admin_notes?: string;
  approved_by?: string;
  rejected_by?: string;
}

const unwrapData = (response: any): any => {
  const data = response?.data;
  if (data?.data) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (data) return data;
  return response;
};

export const chatbotSubscriptionService = {
  getAllPermissions: async (): Promise<UserChatbotSubscription[]> => {
    const res = await http.get('/chatbot-subscriptions/admin/permissions');
    return unwrapData(res);
  },

  getPendingPermissions: async (): Promise<UserChatbotSubscription[]> => {
    const res = await http.get('/chatbot-subscriptions/admin/permissions/pending');
    return unwrapData(res);
  },

  approvePermission: async (permissionId: string, notes?: string | null) => {
    const res = await http.post(
      `/chatbot-subscriptions/admin/permissions/${permissionId}/approve`,
      { notes: notes || null }
    );
    return unwrapData(res);
  },

  rejectPermission: async (permissionId: string, notes: string) => {
    const res = await http.post(
      `/chatbot-subscriptions/admin/permissions/${permissionId}/reject`,
      { notes }
    );
    return unwrapData(res);
  },

  deletePermission: async (permissionId: string) => {
    await http.delete(`/chatbot-subscriptions/admin/permissions/${permissionId}`);
  },

  // Giữ lại fallback cho các trang cũ (nếu còn dùng)
  getAllSubscriptions: async (): Promise<UserChatbotSubscription[]> => {
    return chatbotSubscriptionService.getAllPermissions();
  },

  approveSubscription: async (id: string, notes?: string | null) => {
    return chatbotSubscriptionService.approvePermission(id, notes);
  },

  rejectSubscription: async (id: string, notes: string) => {
    return chatbotSubscriptionService.rejectPermission(id, notes);
  },

  deleteSubscription: async (id: string) => {
    return chatbotSubscriptionService.deletePermission(id);
  },

  getAllChatbotPlans: async (): Promise<ChatbotPlan[]> => {
    const res = await http.get('/chatbot-subscriptions/plans');
    return unwrapData(res);
  },
};