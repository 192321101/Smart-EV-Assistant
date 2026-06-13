import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cyber-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 p-8 shadow-cyber z-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-md">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600 tracking-tighter mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-3">
          Page Not Found
        </h2>
        <p className="text-sm font-semibold text-slate-400 mb-8 max-w-xs mx-auto">
          The requested coordinate on the EV Grid does not exist. Check the URL or return to safety.
        </p>

        <button
          id="notfound-home-btn"
          name="notfound-home"
          data-testid="notfound-home-button"
          aria-label="Back to Safety"
          role="button"
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Home className="w-4.5 h-4.5" />
          <span>Back to safety</span>
        </button>
      </div>
    </div>
  );
}
