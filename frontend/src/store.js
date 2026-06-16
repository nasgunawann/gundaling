import { create } from 'zustand';
import api, { initEcho } from './api';

const getInitialState = () => {
  const token = localStorage.getItem('gundaling_token');
  let user = null;
  if (token) {
    try {
      const savedUser = localStorage.getItem('gundaling_user');
      if (savedUser) {
        user = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
  }
  return { token, user };
};

const { token: initialToken, user: initialUser } = getInitialState();

const useStore = create((set, get) => ({
  user: initialUser,
  token: initialToken,
  products: [],
  tables: [],
  orders: [],
  reservations: [],
  categories: [],
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
      localStorage.setItem('gundaling_user', JSON.stringify(user));
      
      const echo = initEcho(token);
      window.Echo = echo;
      
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
    localStorage.removeItem('gundaling_user');
    const { echo } = get();
    if (echo) {
      echo.disconnect();
    }
    window.Echo = null;
    set({ user: null, token: null, echo: null, products: [], tables: [], orders: [], reservations: [] });
  },

  tryAutoLogin: async () => {
    const token = localStorage.getItem('gundaling_token');
    if (!token) return false;

    set({ token, loading: true });
    try {
      const res = await api.get('/api/me');
      const user = res.data;
      localStorage.setItem('gundaling_user', JSON.stringify(user));
      
      const echo = initEcho(token);
      window.Echo = echo;
      
      set({ user, echo });
      
      await get().fetchInitialData();
      get().subscribeToChannels(echo);
      
      set({ loading: false });
      return true;
    } catch (err) {
      localStorage.removeItem('gundaling_token');
      localStorage.removeItem('gundaling_user');
      set({ token: null, user: null, loading: false });
      return false;
    }
  },

  fetchInitialData: async () => {
    try {
      const res = await api.get('/api/bootstrap');
      set({
        products: res.data.products,
        tables: res.data.tables,
        orders: res.data.orders,
        reservations: res.data.reservations,
        categories: res.data.categories,
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
        const newTables = state.tables.map((t) => 
          t.id === updatedOrder.table_id ? updatedOrder.table : t
        );
        return { orders: newOrders, tables: newTables };
      });

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
        const newTables = state.tables.map((t) => 
          t.id === updatedOrder.table_id ? updatedOrder.table : t
        );
        return { orders: newOrders, tables: newTables };
      });
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
        const newTables = state.tables.map((t) => 
          t.id === updatedOrder.table_id ? updatedOrder.table : t
        );
        return { orders: newOrders, tables: newTables };
      });
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

    const handleOrderUpdate = (order) => {
      set((state) => {
        const index = state.orders.findIndex((o) => o.id === order.id);
        const newOrders = [...state.orders];
        if (index > -1) {
          newOrders[index] = order;
        } else {
          newOrders.push(order);
        }
        const newTables = state.tables.map((t) => 
          t.id === order.table_id ? order.table : t
        );
        return { orders: newOrders, tables: newTables };
      });
    };

    if (user.role === 'Chef' || user.role === 'Manager') {
      echo.private('kitchen-orders')
        .listen('.OrderSent', (e) => {
          handleOrderUpdate(e.order);
        })
        .listen('.OrderServed', (e) => {
          handleOrderUpdate(e.order);
        });
    }

    if (user.role === 'Server' || user.role === 'Manager') {
      echo.private('waiter-floor')
        .listen('.OrderPreparing', (e) => {
          handleOrderUpdate(e.order);
        })
        .listen('.OrderReady', (e) => {
          handleOrderUpdate(e.order);
          if (window.showToast) {
            window.showToast(`Order for ${e.order.table?.name || 'Table'} is ready for pickup!`, 'success');
          }
        })
        .listen('.OrderPaid', (e) => {
          handleOrderUpdate(e.order);
        });
    }
  },
}));

export default useStore;
