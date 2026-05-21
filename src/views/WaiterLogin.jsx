import React, { useState } from 'react'

export default function WaiterLogin({ onLoginSuccess }) {
  const [selectedStaff, setSelectedStaff] = useState('')
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const staffMembers = [
    { id: 'waiter_1', name: 'Andi Pratama', role: 'Server' },
    { id: 'waiter_2', name: 'Siti Aminah', role: 'Server' },
    { id: 'waiter_3', name: 'Budi Santoso', role: 'Server' },
    { id: 'manager_1', name: 'David Lee', role: 'Manager' }
  ]

  const handleNumClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
      setErrorMsg('')
    }
  }

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleClearPin = () => {
    setPin('')
    setErrorMsg('')
  }

  const handleLoginSubmit = () => {
    if (!selectedStaff) {
      setErrorMsg('Please select a staff member first.')
      return
    }
    if (pin.length !== 4) {
      setErrorMsg('PIN must be exactly 4 digits.')
      return
    }

    setIsSubmitting(true)

    // Simulate validation and optimistic loader
    setTimeout(() => {
      setIsSubmitting(false)
      const matched = staffMembers.find(s => s.id === selectedStaff)

      // Allow any 4-digit PIN for demonstration, but let's say '1234' is manager and others can login with anything or '1234' too
      if (pin === '1234' || pin === '0000' || pin === '4321' || pin.length === 4) {
        onLoginSuccess(matched)
      } else {
        setErrorMsg('Invalid Secure PIN. Try again.')
        setPin('')
      }
    }, 800)
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background select-none font-body">
      {/* Left Side: Branding */}
      <div className="relative md:w-[40%] w-full h-[40vh] md:h-full bg-primary flex flex-col justify-between p-container_margin text-on-primary overflow-hidden">
        {/* Background Texture Simulation */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px;' }}
        ></div>

        <div className="relative z-10 flex flex-col gap-unit">
          <div className="w-16 h-16 bg-on-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-primary-container/20">
            <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
              agriculture
            </span>
          </div>
          <h1 className="font-display font-bold text-display-lg leading-tight text-[40px] text-on-primary">
            Gundaling<br />Farmstead
          </h1>
          <p className="text-body-lg opacity-80 max-w-xs leading-relaxed mt-2">
            Premium Farm-to-Table Experience & Service Management System.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 w-fit border border-white/10">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
            <span className="font-semibold text-xs tracking-wider uppercase">POS System Connected</span>
          </div>
          <p className="text-[10px] font-bold mt-4 opacity-50 uppercase tracking-widest">
            Version 4.2.1 • Berastagi, North Sumatra
          </p>
        </div>

        {/* Farm Background Image Overlay */}
        <img
          alt="Gundaling Farmstead Background"
          className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-20 mix-blend-overlay pointer-events-none"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr-eMW1j8C8HdZu5T0VRgWoP8gwnmkD6fUj593svwohkF7SyqssEgUeX0I7hPeNs0Gu9xqn9g39yO12CsjDhMzy73J2t-2DCyBS5pGLOoG8iDJPaArT4xg_REJ-fWy1gVLv9HU-G0Aw0fXdw2OZ-pxkLzWKZGwr5ZX6Y6DUNxvcO65IQze7IcOL8KnXkjs2qjcDCS_E6gGh0nhZFYWJc1gqE4Fz6nc4aaKW77j6IxJC6WkfUtdHW4HAUhdzEm6jQObqm-YEGtekg5z"
        />
      </div>

      {/* Right Side: Login Interaction */}
      <div className="flex-1 bg-surface flex flex-col items-center justify-center p-container_margin">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="font-display font-bold text-headline-md text-on-surface mb-2">Staff Login</h2>
            <p className="text-sm font-medium text-on-surface-variant/80">Select your name and enter your secure PIN</p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-6">
            {/* Employee Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Employee Name</label>
              <div className="relative">
                <select
                  value={selectedStaff}
                  onChange={(e) => {
                    setSelectedStaff(e.target.value)
                    setErrorMsg('')
                  }}
                  className="w-full h-14 bg-surface-container-low border-none rounded-xl px-4 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary appearance-none shadow-sm cursor-pointer"
                >
                  <option value="" disabled>Select Staff Member</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PIN Display */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Secure PIN</label>
              <div className="flex justify-between items-center bg-surface-container-low h-16 rounded-xl px-8 border-2 border-transparent focus-within:border-primary transition-all shadow-sm">
                <div className="flex gap-4">
                  {/* Password dots */}
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${index < pin.length ? 'bg-primary scale-110 shadow-sm' : 'bg-outline-variant/60'
                        }`}
                    />
                  ))}
                </div>
                <span className="material-symbols-outlined text-outline">lock</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="text-error text-xs font-bold text-center mt-1 flex items-center justify-center gap-1.5 bg-error/10 py-2.5 rounded-lg border border-error/20 animate-pulse">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-16 font-display font-bold text-xl bg-surface-container-high rounded-xl text-on-surface shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              {/* Backspace */}
              <button
                onClick={handleBackspace}
                className="h-16 bg-surface-container-high rounded-xl text-error/80 shadow-sm active:scale-95 active:bg-error/10 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-2xl font-bold">backspace</span>
              </button>

              {/* Zero */}
              <button
                onClick={() => handleNumClick('0')}
                className="h-16 font-display font-bold text-xl bg-surface-container-high rounded-xl text-on-surface shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center"
              >
                0
              </button>

              {/* Clear */}
              <button
                onClick={handleClearPin}
                className="h-16 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface-variant shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center text-xs font-bold uppercase tracking-[0.24em]"
              >
                Clear
              </button>
            </div>

            {/* Login Trigger Button */}
            <button
              onClick={handleLoginSubmit}
              disabled={isSubmitting}
              className="mt-2 w-full h-16 bg-primary text-on-primary rounded-xl font-bold text-base shadow-lg active:scale-[0.98] hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Verifying Staff ID...' : 'Authorize Login'}
              <span className="material-symbols-outlined">
                {isSubmitting ? 'sync' : 'login'}
              </span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="flex justify-between w-full text-xs font-semibold text-outline px-2">
            <button className="hover:text-primary transition-colors">Forgot PIN?</button>
            <button className="hover:text-primary transition-colors">System Support</button>
          </div>
        </div>
      </div>
    </div>
  )
}
