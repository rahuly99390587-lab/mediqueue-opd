import React from 'react';

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className={`${sizes[size]} border-brand-200 border-t-brand-600 rounded-full animate-spin ${className}`} />
  );
};

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <Spinner size="lg" />
    <p className="text-slate-400 font-medium text-sm">{message}</p>
  </div>
);

// ─── Alert ────────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  const icons = { error: '❌', success: '✅', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none ml-2">&times;</button>
      )}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, sub, color = 'brand', onClick }) => {
  const colorMap = {
    brand: { bg: 'bg-brand-50', iconBg: 'bg-brand-100', iconColor: 'text-brand-600', border: 'border-brand-100' },
    teal:  { bg: 'bg-teal-50',  iconBg: 'bg-teal-100',  iconColor: 'text-teal-600',  border: 'border-teal-100' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-100' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
    rose:  { bg: 'bg-rose-50',  iconBg: 'bg-rose-100',  iconColor: 'text-rose-600',  border: 'border-rose-100' },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border ${c.border} p-5 shadow-card
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5' : ''}
        transition-all duration-200 animate-fade-in
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <span className={c.iconColor}>{icon}</span>
        </div>
        {sub && <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">{sub}</span>}
      </div>
      <div className="mt-4">
        <p className="font-display text-3xl font-bold text-slate-800 leading-none">{value ?? '—'}</p>
        <p className="text-sm text-slate-500 font-medium mt-1.5">{label}</p>
      </div>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    waiting:   'bg-amber-100 text-amber-700 border-amber-200',
    printed:   'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const labels = { waiting: 'Waiting', printed: 'Printed', completed: 'Completed', cancelled: 'Cancelled' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.waiting}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Token Badge ──────────────────────────────────────────────────────────────
export const TokenBadge = ({ token, size = 'sm' }) => {
  const sizes = { sm: 'text-sm px-3 py-1', md: 'text-base px-4 py-1.5', lg: 'text-xl px-6 py-2' };
  return (
    <span className={`font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg inline-block ${sizes[size]}`}>
      {token}
    </span>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-800 leading-tight">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', padding = true }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-card ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-display font-semibold text-slate-600 text-lg">{title}</h3>
    {description && <p className="text-slate-400 text-sm mt-2 max-w-xs">{description}</p>}
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, className = '', fullWidth = false
}) => {
  const variants = {
    primary:   'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white shadow-lg shadow-brand-500/25',
    secondary: 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    danger:    'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
    ghost:     'text-slate-600 hover:bg-slate-100',
    teal:      'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        font-semibold transition-all duration-200 flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        active:scale-95 ${className}
      `}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────
export const InputField = ({
  label, name, type = 'text', value, onChange, placeholder,
  required, icon, error, hint, rows, maxLength, pattern, inputMode
}) => {
  const baseClass = `
    w-full px-4 py-3 rounded-xl border-2 border-slate-200
    text-slate-800 placeholder:text-slate-300 font-medium text-sm
    transition-all duration-200 bg-white
    focus:outline-none focus:border-brand-400 focus:ring-0
    ${error ? 'border-red-300 bg-red-50/50' : ''}
    ${icon ? 'pl-11' : ''}
  `;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-slate-600">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        {rows ? (
          <textarea
            name={name} value={value} onChange={onChange}
            placeholder={placeholder} required={required}
            rows={rows} maxLength={maxLength}
            className={`${baseClass} resize-y min-h-[80px] pt-3`}
          />
        ) : (
          <input
            type={type} name={name} value={value} onChange={onChange}
            placeholder={placeholder} required={required}
            maxLength={maxLength} pattern={pattern} inputMode={inputMode}
            className={baseClass}
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
};
