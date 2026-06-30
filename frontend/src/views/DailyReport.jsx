import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api';
import useStore from '../store';

export default function DailyReport() {
  const { showToast } = useNotification();
  const user = useStore((state) => state.user);
  
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/daily', {
        params: { date: reportDate }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch daily sales report.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportDate]);

  const handlePrintReport = () => {
    window.print();
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden relative">
      {/* Printable Area (Hidden on screen via CSS print media query) */}
      {reportData && (
        <div className="hidden print:block print-receipt-view bg-white text-black p-4 w-[80mm] font-mono text-xs leading-tight mx-auto">
          <div className="text-center border-b border-dashed border-black pb-4 mb-4">
            <h1 className="text-sm font-bold uppercase tracking-wider">Gundaling Farmstead</h1>
            <p className="text-[10px] mt-1">End of Day Sales (Z-Report)</p>
            <p className="text-[10px] mt-0.5">Date: {reportData.date}</p>
          </div>

          <div className="space-y-1.5 border-b border-dashed border-black pb-3 mb-3">
            <div className="flex justify-between">
              <span>Gross Sales:</span>
              <span className="font-bold">Rp {Math.floor(reportData.subtotal).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (10%):</span>
              <span className="font-bold">Rp {Math.floor(reportData.serviceCharge).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-dotted border-black pt-1.5 mt-1.5">
              <span>Grand Total:</span>
              <span>Rp {Math.floor(reportData.grandTotal).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-1 border-b border-dashed border-black pb-3 mb-3">
            <div className="flex justify-between">
              <span>Total Transactions:</span>
              <span className="font-bold">{reportData.orderCount} bills</span>
            </div>
            <div className="flex justify-between">
              <span>Audited By:</span>
              <span className="font-bold">{user?.name}</span>
            </div>
          </div>

          <div>
            <p className="font-bold uppercase tracking-wider mb-2 text-center text-[10px]">Top Menu Sales</p>
            {reportData.topItems.length > 0 ? (
              <div className="space-y-1">
                {reportData.topItems.map((item, idx) => (
                  <div key={item.productId || idx} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[200px]">{idx + 1}. {item.productName}</span>
                    <span className="font-bold shrink-0">x{item.qty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center italic text-[10px] mt-2">No menu item sales recorded today</p>
            )}
          </div>

          <div className="text-center border-t border-dashed border-black pt-4 mt-6 text-[9px]">
            <p className="font-bold">Gundaling Farmstead POS</p>
            <p className="opacity-80">Printed at: {new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}

      {/* Screen Area (Hidden when printing) */}
      <div className="flex-grow flex flex-col h-full overflow-hidden print:hidden">
        {/* Header */}
        <header className="h-20 bg-surface flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
          <div>
            <h2 className="text-xl font-bold text-on-surface leading-tight">Daily Sales Report</h2>
            <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5 font-mono">
              Z-Report Financial Summaries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-surface-container-low border-none font-bold text-on-surface px-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
            />
            <button
              onClick={handlePrintReport}
              disabled={loading || !reportData}
              className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print Z-Report
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-20 bg-surface-container-lowest/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary animate-spin">
                <span className="material-symbols-outlined text-xl font-bold">sync</span>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Calculating sales aggregates...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Report Subtitle */}
              <div className="bg-surface px-6 py-4 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">calendar_today</span>
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">{formatDateLabel(reportData.date)}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-status-success/15 border border-status-success/20 text-status-success rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-status-success rounded-full"></span>Operational day settled
                </span>
              </div>

              {/* Financial Metrics Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gross Sales */}
                <div className="bg-surface p-6 rounded-3xl border border-outline-variant/35 shadow-sm flex flex-col justify-between h-36">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest leading-none block mb-1">Gross Sales</span>
                    <h3 className="text-2xl font-bold font-display text-on-surface mt-2">
                      Rp {Math.floor(reportData.subtotal).toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-outline-variant/80 border-t border-outline-variant/10 pt-2 block mt-auto leading-tight">Total revenue excluding services</span>
                </div>

                {/* Service Charge */}
                <div className="bg-surface p-6 rounded-3xl border border-outline-variant/35 shadow-sm flex flex-col justify-between h-36">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest leading-none block mb-1">Service Charge (10%)</span>
                    <h3 className="text-2xl font-bold font-display text-on-surface mt-2">
                      Rp {Math.floor(reportData.serviceCharge).toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-outline-variant/80 border-t border-outline-variant/10 pt-2 block mt-auto leading-tight">Calculated service taxation</span>
                </div>

                {/* Grand Total */}
                <div className="bg-surface p-6 rounded-3xl border border-outline-variant/35 shadow-sm flex flex-col justify-between h-36 ring-2 ring-primary ring-offset-2">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none block mb-1">Grand Financial Total</span>
                    <h3 className="text-2xl font-bold font-display text-primary mt-2">
                      Rp {Math.floor(reportData.grandTotal).toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center border-t border-outline-variant/10 pt-2 mt-auto text-[10px] font-semibold text-on-surface-variant/80">
                    <span>Total Cash Drawer Intake</span>
                    <span className="font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">{reportData.orderCount} bills</span>
                  </div>
                </div>

              </div>

              {/* Top Menu Sales Table */}
              <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
                <header className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">Top Selling Menu Items</h4>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">trending_up</span>
                </header>
                {reportData.topItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/10 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                        <th className="px-6 py-3.5 w-16">Rank</th>
                        <th className="px-6 py-3.5">Product Name</th>
                        <th className="px-6 py-3.5 text-right">Quantity Sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-xs font-semibold text-on-surface-variant">
                      {reportData.topItems.map((item, idx) => (
                        <tr key={item.productId || idx} className="hover:bg-surface-container-lowest/40 transition-colors">
                          <td className="px-6 py-3.5 font-bold font-mono text-primary">#{idx + 1}</td>
                          <td className="px-6 py-3.5 font-bold text-on-surface">{item.productName}</td>
                          <td className="px-6 py-3.5 text-right font-mono font-bold text-on-surface">x{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant/70 flex flex-col items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-3xl opacity-35">receipt_long</span>
                    <p className="text-xs font-bold uppercase tracking-wider">No Sales Records</p>
                    <p className="text-[10px] max-w-xs mt-0.5 leading-relaxed">No menu item transactions were recorded for this day.</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 text-on-surface-variant/70 min-h-[50vh]">
              <span className="material-symbols-outlined text-[48px] opacity-35 mb-3">error_med</span>
              <p className="text-sm font-bold uppercase tracking-wider">Error compiling report</p>
              <p className="text-xs max-w-xs mt-1.5 leading-relaxed">System failed to aggregate database tables for this operational date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
