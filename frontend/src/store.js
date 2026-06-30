import { create } from 'zustand';
import api, { initSocket } from './api';
import { get as idbGet, set as idbSet } from 'idb-keyval';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const getInitialState = () => {
  const token = localStorage.getItem('gundaling_token');
  let user = null;
  if (token) {
    const payload = parseJwt(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      localStorage.removeItem('gundaling_token');
      localStorage.removeItem('gundaling_user');
      return { token: null, user: null };
    }
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
  syncQueue: [],
  isSyncing: false,

  initializeStore: async () => {
    try {
      const syncQueue = await idbGet('gundaling_sync_queue') || [];
      set({ syncQueue });
      if (navigator.onLine && syncQueue.length > 0) {
        get().processQueue();
      }
    } catch (e) {
      console.error('Failed to initialize store queue', e);
    }
  },

  loadOfflineData: async () => {
    try {
      const products = await idbGet('gundaling_cache_products') || [];
      const categories = await idbGet('gundaling_cache_categories') || [];
      const tables = await idbGet('gundaling_cache_tables') || [];
      const orders = await idbGet('gundaling_cache_orders') || [];
      const reservations = await idbGet('gundaling_cache_reservations') || [];
      const syncQueue = await idbGet('gundaling_sync_queue') || [];
      set({ products, categories, tables, orders, reservations, syncQueue });
    } catch (e) {
      console.error('Failed to load offline data', e);
    }
  },

  addToQueue: async (action, payload, tempId = null) => {
    const queueItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      action,
      payload,
      tempId,
    };
    const { syncQueue } = get();
    const newQueue = [...syncQueue, queueItem];
    set({ syncQueue: newQueue });
    await idbSet('gundaling_sync_queue', newQueue);
    if (navigator.onLine) {
      get().processQueue();
    }
  },

  processQueue: async () => {
    if (get().isSyncing) return;
    const { syncQueue } = get();
    if (syncQueue.length === 0) return;

    set({ isSyncing: true });
    const remainingQueue = [...syncQueue];

    while (remainingQueue.length > 0) {
      const item = remainingQueue[0];
      try {
        if (item.action === 'submitOrder') {
          const res = await api.post('/orders', item.payload);
          const updatedOrder = res.data;
          set((state) => {
            const filteredOrders = state.orders.filter((o) => o.id !== item.tempId);
            const index = filteredOrders.findIndex((o) => o.id === updatedOrder.id);
            const newOrders = [...filteredOrders];
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
          remainingQueue.forEach((qItem) => {
            if (qItem.payload && qItem.payload.orderId === item.tempId) {
              qItem.payload.orderId = updatedOrder.id;
            }
          });
        } else if (item.action === 'transmitOrder') {
          const res = await api.post(`/orders/${item.payload.orderId}/transmit`);
          const updatedOrder = res.data;
          set((state) => {
            const newOrders = state.orders.map((o) => o.id === item.payload.orderId ? updatedOrder : o);
            return { orders: newOrders };
          });
        } else if (item.action === 'updateOrderStatus') {
          const res = await api.put(`/orders/${item.payload.orderId}/status`, { status: item.payload.status });
          const updatedOrder = res.data;
          set((state) => {
            const newOrders = state.orders.map((o) => o.id === item.payload.orderId ? updatedOrder : o);
            return { orders: newOrders };
          });
        } else if (item.action === 'addReservation') {
          const res = await api.post('/reservations', item.payload);
          const newRes = res.data;
          set((state) => {
            const filtered = state.reservations.filter((r) => r.id !== item.tempId);
            if (filtered.some((r) => r.id === newRes.id)) return { reservations: filtered };
            return { reservations: [...filtered, newRes] };
          });
        } else if (item.action === 'updateReservation') {
          const res = await api.put(`/reservations/${item.payload.id}`, { status: item.payload.status });
          const updated = res.data;
          set((state) => ({
            reservations: state.reservations.map((r) => r.id === item.payload.id ? updated : r),
          }));
        } else if (item.action === 'updateTablePosition') {
          await api.put(`/tables/${item.payload.tableId}`, { pos_x: item.payload.posX, pos_y: item.payload.posY });
        }

        remainingQueue.shift();
        set({ syncQueue: remainingQueue });
        await idbSet('gundaling_sync_queue', remainingQueue);
      } catch (err) {
        console.error('Failed to sync item', item, err);
        if (!err.response || err.code === 'ERR_NETWORK') {
          break;
        }
        remainingQueue.shift();
        set({ syncQueue: remainingQueue });
        await idbSet('gundaling_sync_queue', remainingQueue);
      }
    }

    set({ isSyncing: false });
    if (remainingQueue.length === 0) {
      await get().fetchInitialData();
    }
  },

  setTables: (tables) => set({ tables }),
  setOrders: (orders) => set({ orders }),
  setReservations: (reservations) => set({ reservations }),

  login: async (employeeId, pin) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { employeeId, pin });
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
      if (!err.response || err.code === 'ERR_NETWORK') {
        const userStr = localStorage.getItem('gundaling_user');
        if (userStr) {
          const payload = parseJwt(token);
          if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
            const user = JSON.parse(userStr);
            set({ user, token, socket: null });
            await get().loadOfflineData();
            set({ loading: false });
            return true;
          }
        }
      }
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
      idbSet('gundaling_cache_products', productsRes.data);
      idbSet('gundaling_cache_categories', categoriesRes.data);
      idbSet('gundaling_cache_tables', tablesRes.data);
      idbSet('gundaling_cache_orders', ordersRes.data);
      idbSet('gundaling_cache_reservations', reservationsRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data', err);
      get().loadOfflineData();
    }
  },

  submitOrder: async (tableId, items) => {
    const tempId = 'temp-' + Date.now();
    const { user, products, tables } = get();
    const table = tables.find(t => t.id === tableId);
    
    const orderItems = items.map((item, idx) => {
      const product = products.find(p => p.id === item.product_id);
      return {
        id: 'temp-item-' + idx + '-' + Date.now(),
        orderId: tempId,
        productId: item.product_id,
        qty: item.qty,
        unitPrice: product ? product.price : 0,
        sent: item.sent ?? false,
        note: item.note ?? null,
        product: product || { name: 'Unknown Product', price: 0 }
      };
    });

    const subtotal = orderItems.reduce((acc, item) => acc + Number(item.unitPrice) * item.qty, 0);
    const total = subtotal * 1.1;

    const tempOrder = {
      id: tempId,
      tableId,
      userId: user ? user.id : 0,
      status: 'pending',
      total,
      isPendingSync: true,
      table: table ? { ...table, status: 'Occupied' } : null,
      user: user ? { id: user.id, name: user.name, role: user.role, email: user.email } : null,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const newOrders = [...state.orders, tempOrder];
      const newTables = state.tables.map((t) => 
        t.id === tableId ? { ...t, status: 'Occupied' } : t
      );
      return { orders: newOrders, tables: newTables };
    });

    if (navigator.onLine) {
      try {
        const res = await api.post('/orders', { table_id: tableId, items });
        const updatedOrder = res.data;
        
        set((state) => {
          const filteredOrders = state.orders.filter(o => o.id !== tempId);
          const index = filteredOrders.findIndex((o) => o.id === updatedOrder.id);
          const newOrders = [...filteredOrders];
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

        idbSet('gundaling_cache_orders', get().orders);
        idbSet('gundaling_cache_tables', get().tables);
        return updatedOrder;
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('submitOrder', { table_id: tableId, items }, tempId);
          return tempOrder;
        }
        set((state) => {
          const newOrders = state.orders.filter(o => o.id !== tempId);
          const newTables = state.tables.map((t) => 
            t.id === tableId ? { ...t, status: 'Available' } : t
          );
          return { orders: newOrders, tables: newTables };
        });
        throw err;
      }
    } else {
      get().addToQueue('submitOrder', { table_id: tableId, items }, tempId);
      return tempOrder;
    }
  },

  transmitOrder: async (orderId) => {
    const isTemp = typeof orderId === 'string' && orderId.startsWith('temp-');
    
    set((state) => {
      const newOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          const updatedItems = o.items.map(item => ({ ...item, sent: true }));
          return { ...o, status: 'pending', items: updatedItems, isPendingSync: true };
        }
        return o;
      });
      return { orders: newOrders };
    });

    if (isTemp) {
      const { syncQueue } = get();
      const newQueue = syncQueue.map(item => {
        if (item.action === 'submitOrder' && item.tempId === orderId) {
          const updatedPayloadItems = item.payload.items.map(i => ({ ...i, sent: true }));
          return { ...item, payload: { ...item.payload, items: updatedPayloadItems } };
        }
        return item;
      });
      set({ syncQueue: newQueue });
      idbSet('gundaling_sync_queue', newQueue);
      return get().orders.find(o => o.id === orderId);
    }

    if (navigator.onLine) {
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
        idbSet('gundaling_cache_orders', get().orders);
        idbSet('gundaling_cache_tables', get().tables);
        return updatedOrder;
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('transmitOrder', { orderId });
          return get().orders.find(o => o.id === orderId);
        }
        throw err;
      }
    } else {
      get().addToQueue('transmitOrder', { orderId });
      return get().orders.find(o => o.id === orderId);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const isTemp = typeof orderId === 'string' && orderId.startsWith('temp-');

    set((state) => {
      const newOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          const isPaid = status === 'paid';
          const updatedItems = isPaid ? o.items.map(i => ({ ...i, sent: true })) : o.items;
          return { ...o, status, items: updatedItems, isPendingSync: true };
        }
        return o;
      });
      let newTables = state.tables;
      if (status === 'paid') {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          const orderTableId = order.tableId || order.table_id;
          newTables = state.tables.map(t => t.id === orderTableId ? { ...t, status: 'Available' } : t);
        }
      }
      return { orders: newOrders, tables: newTables };
    });

    if (isTemp) {
      get().addToQueue('updateOrderStatus', { orderId, status });
      return get().orders.find(o => o.id === orderId);
    }

    if (navigator.onLine) {
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
        idbSet('gundaling_cache_orders', get().orders);
        idbSet('gundaling_cache_tables', get().tables);
        return updatedOrder;
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('updateOrderStatus', { orderId, status });
          return get().orders.find(o => o.id === orderId);
        }
        throw err;
      }
    } else {
      get().addToQueue('updateOrderStatus', { orderId, status });
      return get().orders.find(o => o.id === orderId);
    }
  },

  addReservation: async (data) => {
    const tempId = 'temp-' + Date.now();
    const tempReservation = {
      id: tempId,
      ...data,
      status: 'Confirmed',
      isPendingSync: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({ reservations: [...state.reservations, tempReservation] }));

    if (navigator.onLine) {
      try {
        const res = await api.post('/reservations', data);
        const newRes = res.data;
        set((state) => {
          const filtered = state.reservations.filter((r) => r.id !== tempId);
          if (filtered.some((r) => r.id === newRes.id)) return { reservations: filtered };
          return { reservations: [...filtered, newRes] };
        });
        idbSet('gundaling_cache_reservations', get().reservations);
        return newRes;
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('addReservation', data, tempId);
          return tempReservation;
        }
        set((state) => ({ reservations: state.reservations.filter((r) => r.id !== tempId) }));
        throw err;
      }
    } else {
      get().addToQueue('addReservation', data, tempId);
      return tempReservation;
    }
  },

  updateReservation: async (id, status) => {
    const isTemp = typeof id === 'string' && id.startsWith('temp-');

    set((state) => ({
      reservations: state.reservations.map((r) => r.id === id ? { ...r, status, isPendingSync: true } : r),
    }));

    if (isTemp) {
      get().addToQueue('updateReservation', { id, status });
      return get().reservations.find(r => r.id === id);
    }

    if (navigator.onLine) {
      try {
        const res = await api.put(`/reservations/${id}`, { status });
        const updated = res.data;
        set((state) => ({
          reservations: state.reservations.map((r) => r.id === id ? updated : r),
        }));
        idbSet('gundaling_cache_reservations', get().reservations);
        return updated;
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('updateReservation', { id, status });
          return get().reservations.find(r => r.id === id);
        }
        throw err;
      }
    } else {
      get().addToQueue('updateReservation', { id, status });
      return get().reservations.find(r => r.id === id);
    }
  },

  updateTablePosition: async (tableId, posX, posY) => {
    set((state) => ({
      tables: state.tables.map((t) => t.id === tableId ? { ...t, pos_x: posX, pos_y: posY, isPendingSync: true } : t),
    }));

    if (navigator.onLine) {
      try {
        const res = await api.put(`/tables/${tableId}`, { pos_x: posX, pos_y: posY });
        const updatedTable = res.data;
        set((state) => ({
          tables: state.tables.map((t) => t.id === tableId ? updatedTable : t),
        }));
        idbSet('gundaling_cache_tables', get().tables);
      } catch (err) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          get().addToQueue('updateTablePosition', { tableId, posX, posY });
        }
      }
    } else {
      get().addToQueue('updateTablePosition', { tableId, posX, posY });
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
      set((state) => {
        if (state.tables.some((t) => t.id === table.id)) return state;
        return { tables: [...state.tables, table] };
      });
    });

    socket.on('table.deleted', (tableId) => {
      set((state) => ({
        tables: state.tables.filter((t) => t.id !== tableId)
      }));
    });

    socket.on('product.created', (product) => {
      set((state) => {
        if (state.products.some((p) => p.id === product.id)) return state;
        return { products: [...state.products, product] };
      });
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
      set((state) => {
        if (state.categories.some((c) => c.id === category.id)) return state;
        return { categories: [...state.categories, category] };
      });
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
      set((state) => {
        if (state.reservations.some((r) => r.id === res.id)) return state;
        return { reservations: [...state.reservations, res] };
      });
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

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().processQueue();
  });
  // Initialize queue and cache from idb-keyval on startup
  useStore.getState().initializeStore();
}

export default useStore;
