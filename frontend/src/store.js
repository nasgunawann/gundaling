import { create } from 'zustand';
import api, { initSocket } from './api';

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
  socket: null,
  loading: false,

  setTables: (tables) => set({ tables }),
  setOrders: (orders) => set({ orders }),
  setReservations: (reservations) => set({ reservations }),

  login: async (id, pin) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { id, pin });
      const { user, token } = res.data;
      localStorage.setItem('gundaling_token', token);
      localStorage.setItem('gundaling_user', JSON.stringify(user));
      
      const socket = initSocket(token);
      
      set({ user, token, socket, loading: false });
      
      await get().fetchInitialData();
      get().subscribeToSocket(socket);
      
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    localStorage.removeItem('gundaling_token');
    localStorage.removeItem('gundaling_user');
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ user: null, token: null, socket: null, products: [], tables: [], orders: [], reservations: [] });
  },

  tryAutoLogin: async () => {
    const token = localStorage.getItem('gundaling_token');
    if (!token) return false;

    set({ token, loading: true });
    try {
      const res = await api.get('/auth/me');
      const user = res.data;
      localStorage.setItem('gundaling_user', JSON.stringify(user));
      
      const socket = initSocket(token);
      
      set({ user, socket });
      
      await get().fetchInitialData();
      get().subscribeToSocket(socket);
      
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
      const [productsRes, categoriesRes, tablesRes, ordersRes, reservationsRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/tables'),
        api.get('/orders'),
        api.get('/reservations'),
      ]);
      set({
        products: productsRes.data,
        categories: categoriesRes.data,
        tables: tablesRes.data,
        orders: ordersRes.data,
        reservations: reservationsRes.data,
      });
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    }
  },

  submitOrder: async (tableId, items) => {
    try {
      const res = await api.post('/orders', { table_id: tableId, items });
      const updatedOrder = res.data;
      
      set((state) => {
        const index = state.orders.findIndex((o) => o.id === updatedOrder.id);
        const newOrders = [...state.orders];
        if (index > -1) {
          newOrders[index] = updatedOrder;
        } else {
          newOrders.push(updatedOrder);
        }
        const updatedTableId = updatedOrder.tableId || updatedOrder.table_id;
        const newTables = state.tables.map((t) => 
          t.id === updatedTableId ? updatedOrder.table : t
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
      const res = await api.post(`/orders/${orderId}/transmit`);
      const updatedOrder = res.data;
      set((state) => {
        const newOrders = state.orders.map((o) => o.id === orderId ? updatedOrder : o);
        const updatedTableId = updatedOrder.tableId || updatedOrder.table_id;
        const newTables = state.tables.map((t) => 
          t.id === updatedTableId ? updatedOrder.table : t
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
      const res = await api.put(`/orders/${orderId}/status`, { status });
      const updatedOrder = res.data;
      set((state) => {
        const newOrders = state.orders.map((o) => o.id === orderId ? updatedOrder : o);
        const updatedTableId = updatedOrder.tableId || updatedOrder.table_id;
        const newTables = state.tables.map((t) => 
          t.id === updatedTableId ? updatedOrder.table : t
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
      const res = await api.post('/reservations', data);
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
      const res = await api.put(`/reservations/${id}`, { status });
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
      const res = await api.put(`/tables/${tableId}`, { pos_x: posX, pos_y: posY });
      const updatedTable = res.data;
      set((state) => ({
        tables: state.tables.map((t) => t.id === tableId ? updatedTable : t),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  subscribeToSocket: (socket) => {
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
        const orderTableId = order.tableId || order.table_id;
        const newTables = state.tables.map((t) => 
          t.id === orderTableId ? order.table : t
        );
        return { orders: newOrders, tables: newTables };
      });
    };

    socket.on('OrderSent', (order) => {
      handleOrderUpdate(order);
    });

    socket.on('OrderServed', (order) => {
      handleOrderUpdate(order);
    });

    socket.on('OrderPreparing', (order) => {
      handleOrderUpdate(order);
    });

    socket.on('OrderReady', (order) => {
      handleOrderUpdate(order);
      if (window.showToast && (user.role === 'Server' || user.role === 'Manager')) {
        window.showToast(`Order for ${order.table?.name || 'Table'} is ready for pickup!`, 'success');
      }
    });

    socket.on('OrderPaid', (order) => {
      handleOrderUpdate(order);
    });

    socket.on('table.updated', (table) => {
      set((state) => ({
        tables: state.tables.map((t) => t.id === table.id ? table : t)
      }));
    });

    socket.on('table.created', (table) => {
      set((state) => ({
        tables: [...state.tables, table]
      }));
    });

    socket.on('table.deleted', (tableId) => {
      set((state) => ({
        tables: state.tables.filter((t) => t.id !== tableId)
      }));
    });

    socket.on('product.created', (product) => {
      set((state) => ({
        products: [...state.products, product]
      }));
    });

    socket.on('product.updated', (product) => {
      set((state) => ({
        products: state.products.map((p) => p.id === product.id ? product : p)
      }));
    });

    socket.on('product.deleted', (productId) => {
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId)
      }));
    });

    socket.on('category.created', (category) => {
      set((state) => ({
        categories: [...state.categories, category]
      }));
    });

    socket.on('category.updated', (category) => {
      set((state) => ({
        categories: state.categories.map((c) => c.id === category.id ? category : c)
      }));
    });

    socket.on('category.deleted', (categoryId) => {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId)
      }));
    });

    socket.on('reservation.created', (res) => {
      set((state) => ({
        reservations: [...state.reservations, res]
      }));
    });

    socket.on('reservation.updated', (res) => {
      set((state) => ({
        reservations: state.reservations.map((r) => r.id === res.id ? res : r)
      }));
    });

    socket.on('reservation.deleted', (resId) => {
      set((state) => ({
        reservations: state.reservations.filter((r) => r.id !== resId)
      }));
    });
  },
}));

export default useStore;
