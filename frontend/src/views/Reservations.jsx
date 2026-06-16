import React, { useState } from 'react';
import { useNotification } from '../components/NotificationProvider';
import useStore from '../store';

export default function Reservations({ reservations }) {
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const storeTables = useStore((state) => state.tables);
  const addReservationStore = useStore((state) => state.addReservation);
  const updateReservationStore = useStore((state) => state.updateReservation);

  // Form states for booking table
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGuests, setNewGuests] = useState('2');
  const [newTable, setNewTable] = useState('');
  const [newTime, setNewTime] = useState('19:00');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  const filterStatuses = ['All', 'Confirmed', 'Seated', 'Cancelled'];

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReservationStore(id, newStatus);
      showToast(`Reservation status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update reservation status.', 'error');
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      showToast('Please fill in the guest details.', 'error');
      return;
    }

    const selectedTableId = newTable || (storeTables[0] ? storeTables[0].id : '');
    if (!selectedTableId) {
      showToast('No tables available to book.', 'error');
      return;
    }

    const bookingTime = `${newDate} ${newTime}:00`;

    try {
      await addReservationStore({
        name: newName,
        phone: newPhone,
        guests: parseInt(newGuests),
        table_id: parseInt(selectedTableId),
        time: bookingTime,
        status: 'Confirmed'
      });

      const tableObj = storeTables.find(t => t.id === parseInt(selectedTableId));

      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      showToast(`Reservation booked successfully for ${newName} at ${tableObj?.name || 'Table'}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to book reservation.', 'error');
    }
  };

  const openAddModal = () => {
    if (storeTables.length > 0 && !newTable) {
      setNewTable(storeTables[0].id.toString());
    }
    setShowAddModal(true);
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.phone.includes(searchQuery);
    const matchesFilter = statusFilter === 'All' || res.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10">
        <div>
          <h2 className="text-xl font-bold text-on-surface font-display leading-tight">Reservation & Guest Management</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">Live Guest Bookings • Gundaling Farmstead</p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md text-sm font-display"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Reservation
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="px-container_margin py-4 flex flex-wrap gap-4 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/10">
        <div className="relative w-full max-w-xs">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-12 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          {filterStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                statusFilter === status 
                  ? 'bg-status-reserved/10 text-status-reserved border-status-reserved/20 font-bold shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table list */}
      <div className="flex-1 p-container_margin overflow-y-auto custom-scrollbar bg-surface-container-lowest/30 pb-16">
        <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low/20">
                <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Guest Info</th>
                <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Time & Seats</th>
                <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Table Details</th>
                <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">Status</th>
                <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/40">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => {
                  const bookingTime = new Date(res.time);
                  const bookingDateStr = bookingTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                  const bookingTimeStr = bookingTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={res.id} className="hover:bg-surface-container-low/10 transition-colors">
                      {/* Guest Info */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {res.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface leading-tight">{res.name}</p>
                            <p className="text-[11px] font-semibold text-on-surface-variant font-mono mt-0.5">{res.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Time & Seats */}
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface font-mono">
                            <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                            {bookingDateStr}, {bookingTimeStr}
                          </div>
                          <p className="text-xs text-on-surface-variant/80 font-semibold">{res.guests} Guests booked</p>
                        </div>
                      </td>

                      {/* Table Details */}
                      <td className="py-5 px-6">
                        <span className="bg-surface-container px-3.5 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant border border-outline-variant/10 shadow-sm font-mono">
                          {res.table?.name || 'Table'}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-5 px-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                          res.status === 'Seated' 
                            ? 'bg-status-success/10 border-status-success/20 text-status-success' 
                            : res.status === 'Cancelled'
                            ? 'bg-status-danger/10 border-status-danger/20 text-status-danger'
                            : 'bg-status-reserved/10 border-status-reserved/20 text-status-reserved'
                        }`}>
                          {res.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          {res.status === 'Confirmed' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(res.id, 'Seated')}
                                className="px-3.5 py-2 bg-status-success text-status-on-success font-bold rounded-xl text-xs transition-colors shadow-sm hover:opacity-90 active:scale-95"
                              >
                                Seat Guest
                              </button>
                              <button 
                                onClick={() => handleStatusChange(res.id, 'Cancelled')}
                                className="px-3.5 py-2 border border-status-danger/30 text-status-danger font-bold rounded-xl text-xs transition-colors shadow-sm hover:bg-status-danger/5 active:scale-95"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {res.status === 'Seated' && (
                            <span className="text-xs font-bold text-status-success uppercase tracking-wider pr-3 py-2 leading-none flex items-center gap-1.5 justify-end">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Seated
                            </span>
                          )}
                          {res.status === 'Cancelled' && (
                            <span className="text-xs font-bold text-outline uppercase tracking-wider pr-3 py-2 leading-none flex items-center gap-1.5 justify-end">
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-on-surface-variant/80">
                    <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">menu_book</span>
                    <p className="text-xs font-bold uppercase tracking-wider">No matching bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-inverse-on-surface/40 backdrop-blur-md">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] p-8 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-6">
              <h3 className="text-lg font-bold font-display text-on-surface">Book Table</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Guest Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Contact Number</label>
                <input 
                  type="text" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +62 812..."
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Guests Count</label>
                  <select 
                    value={newGuests} 
                    onChange={(e) => setNewGuests(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Persons</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Booking Table</label>
                  <select 
                    value={newTable} 
                    onChange={(e) => setNewTable(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {storeTables.map(t => {
                      const capacityOk = t.seats >= parseInt(newGuests || 1);
                      const prefix = capacityOk ? '' : '⚠️ [Capacity Low] ';
                      return (
                        <option key={t.id} value={t.id} className="text-on-surface bg-surface font-semibold">
                          {prefix}{t.name} ({t.seats} Seats) — {t.status}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Booking Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Time Schedule</label>
                  <input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full h-14 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-sm font-display"
              >
                Confirm Table Reservation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
