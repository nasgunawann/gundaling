import { create } from 'zustand';
import api, { initEcho } from './api';

const useStore = create((set, get) => ({
  user: null,
  token: null,
  products: [],
  tables: [],
  orders: [],
  reservations: [],
  echo: null,
  loading: false,

  setTables: (tables) => set({ tables }),
  setOrders: (orders) => set({ orders }),
  setReservations: (reservations) => set({ reservations }),

  login: async (id, pin) => {
    set({ loading: true });
    try {
      const res = await api.post('/api/login', { id, pin });
      const { user, token } = res.data;
      localStorage.setItem('gundaling_token', token);
      
      const echo = initEcho(token);
      
      set({ user, token, echo, loading: false });
      
      await get().fetchInitialData();
      get().subscribeToChannels(echo);
      
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/logout');
    } catch (e) {}
    localStorage.removeItem('gundaling_token');
    const { echo } = get();
    if (echo) {
      echo.disconnect();
    }
    set({ user: null, token: null, echo: null, products: [], tables: [], orders: [], reservations: [] });
  },

  tryAutoLogin: async () => {
    const token = localStorage.getItem('gundaling_token');
    if (!token) return false;

    set({ token, loading: true });
    try {
      const res = await api.get('/api/me');
      const user = res.data;
      const echo = initEcho(token);
      
      set({ user, echo, loading: false });
      
      await get().fetchInitialData();
      get().subscribeToChannels(echo);
      
      return true;
    } catch (err) {
      localStorage.removeItem('gundaling_token');
      set({ token: null, user: null, loading: false });
      return false;
    }
  },

  fetchInitialData: async () => {
    try {
      const [prodRes, tabRes, ordRes, resRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/tables'),
        api.get('/api/orders'),
        api.get('/api/reservations'),
      ]);
      set({
        products: prodRes.data,
        tables: tabRes.data,
        orders: ordRes.data,
        reservations: resRes.data,
      });
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    }
  },

  submitOrder: async (tableId, items) => {
    try {
      const res = await api.post('/api/orders', { table_id: tableId, items });
      const updatedOrder = res.data;
      
      set((state) => {
        const index = state.orders.findIndex((o) => o.id === updatedOrder.id);
        const newOrders = [...state.orders];
        if (index > -1) {
          newOrders[index] = updatedOrder;
        } else {
          newOrders.push(updatedOrder);
        }
        return { orders: newOrders };
      });

      await get().fetchInitialData();
      return updatedOrder;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  transmitOrder: async (orderId) => {
    try {
      const res = await api.post(`/api/orders/${orderId}/transmit`);
      const updatedOrder = res.data;
      set((state) => {
        const newOrders = state.orders.map((o) => o.id === orderId ? updatedOrder : o);
        return { orders: newOrders };
      });
      await get().fetchInitialData();
      return updatedOrder;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await api.put(`/api/orders/${orderId}/status`, { status });
      const updatedOrder = res.data;
      set((state) => {
        const newOrders = state.orders.map((o) => o.id === orderId ? updatedOrder : o);
        return { orders: newOrders };
      });
      await get().fetchInitialData();
      return updatedOrder;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  addReservation: async (data) => {
    try {
      const res = await api.post('/api/reservations', data);
      const newRes = res.data;
      set((state) => ({ reservations: [...state.reservations, newRes] }));
      await get().fetchInitialData();
      return newRes;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateReservation: async (id, status) => {
    try {
      const res = await api.put(`/api/reservations/${id}`, { status });
      const updated = res.data;
      set((state) => ({
        reservations: state.reservations.map((r) => r.id === id ? updated : r),
      }));
      await get().fetchInitialData();
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateTablePosition: async (tableId, posX, posY) => {
    try {
      const res = await api.put(`/api/tables/${tableId}`, { pos_x: posX, pos_y: posY });
      const updatedTable = res.data;
      set((state) => ({
        tables: state.tables.map((t) => t.id === tableId ? updatedTable : t),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  subscribeToChannels: (echo) => {
    const { user } = get();
    if (!user) return;

    if (user.role === 'Chef' || user.role === 'Manager') {
      echo.private('kitchen-orders')
        .listen('.OrderSent', (e) => {
          set((state) => {
            const index = state.orders.findIndex((o) => o.id === e.order.id);
            const newOrders = [...state.orders];
            if (index > -1) {
              newOrders[index] = e.order;
            } else {
              newOrders.push(e.order);
            }
            return { orders: newOrders };
          });
          get().fetchInitialData();
        })
        .listen('.OrderServed', (e) => {
          get().fetchInitialData();
        });
    }

    if (user.role === 'Server' || user.role === 'Manager') {
      echo.private('waiter-floor')
        .listen('.OrderAccepted', (e) => {
          get().fetchInitialData();
        })
        .listen('.OrderPreparing', (e) => {
          get().fetchInitialData();
        })
        .listen('.OrderReady', (e) => {
          get().fetchInitialData();
          if (window.showToast) {
            window.showToast(`Order for ${e.order.table?.name || 'Table'} is ready for pickup!`, 'success');
          }
        })
        .listen('.OrderPaid', (e) => {
          get().fetchInitialData();
        });
    }
  },
}));

export default useStore;
