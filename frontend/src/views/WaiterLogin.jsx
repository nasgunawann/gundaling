import React, { useState } from 'react';
import useStore from '../store';

export default function WaiterLogin({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginStore = useStore((state) => state.login);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!employeeId) {
      setErrorMsg('Please enter your employee ID.');
      return;
    }
    if (pin.length !== 4) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const loggedInUser = await loginStore(employeeId, pin);
      setIsSubmitting(false);
      onLoginSuccess(loggedInUser);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.message || 'Invalid Employee ID or Secure PIN. Try again.');
      setPin('');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background select-none font-body overflow-hidden">
      <div className="relative md:w-[40%] w-full h-[28vh] md:h-full bg-primary flex flex-col justify-between p-container_margin text-on-primary overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        ></div>

        <div className="relative z-10 flex flex-col gap-unit">
          <div className="h-10 md:h-20 flex items-center justify-start mb-3 md:mb-6">
            <img src="/logo.png" alt="Gundaling Farmstead Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="font-display font-bold text-display-lg leading-tight text-[28px] md:text-[40px] text-on-primary">
            Gundaling Farmstead
          </h1>
          <p className="hidden md:block text-body-lg opacity-80 max-w-xs leading-relaxed mt-2">
            Premium Farm-to-Table Experience & Service Management System.
          </p>
        </div>

        <div className="relative z-10 flex md:flex-col justify-between items-center md:items-start w-full">
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 md:px-6 md:py-3 w-fit border border-white/10">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
            <span className="font-semibold text-[10px] md:text-xs tracking-wider uppercase">POS Connected</span>
          </div>
          <p className="text-[9px] md:text-[10px] font-bold mt-0 md:mt-4 opacity-50 uppercase tracking-widest">
            Version {import.meta.env.VITE_APP_VERSION || '-'}
          </p>
        </div>

        <div 
          className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none"
        />
      </div>

      <div className="flex-1 bg-surface flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
        <form onSubmit={handleLoginSubmit} className="w-full max-w-md flex flex-col gap-4 md:gap-6">
          <div className="text-center">
            <h2 className="font-display font-bold text-headline-sm md:text-headline-md text-on-surface mb-1">Staff Login</h2>
            <p className="text-xs font-medium text-on-surface-variant/80">Enter your Employee ID and secure PIN</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Employee ID</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter Employee ID"
                required
                className="w-full h-12 bg-surface-container-low border-none rounded-xl px-4 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">Secure PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter 4-Digit PIN"
                required
                className="w-full h-12 bg-surface-container-low border-none rounded-xl px-4 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>

            {errorMsg && (
              <div className="text-error text-xs font-bold text-center mt-0.5 flex items-center justify-center gap-1.5 bg-error/10 py-2 rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full h-12 md:h-14 bg-primary text-on-primary rounded-xl font-bold text-sm md:text-base shadow-lg active:scale-[0.98] hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Verifying Staff ID...' : 'Authorize Login'}
              <span className={`material-symbols-outlined ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'sync' : 'login'}
              </span>
            </button>
          </div>

          <div className="flex justify-between w-full text-[10px] md:text-xs font-semibold text-outline px-2">
            <button type="button" onClick={() => alert("Please contact your administrator or manager to reset your secure PIN.")} className="hover:text-primary transition-colors">Forgot PIN?</button>
            <button type="button" onClick={() => alert(`Gundaling POS v${import.meta.env.VITE_APP_VERSION || '-'} - System fully operational.`)} className="hover:text-primary transition-colors">System Support</button>
          </div>
        </form>
      </div>
    </div>
  );
}
