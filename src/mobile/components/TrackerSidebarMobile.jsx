import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Gift, LayoutGrid, ListTodo, X } from 'lucide-react';

const navItems = [
  { to: '/tracker', label: 'Dashboard', icon: LayoutGrid },
  { to: '/tracker/airdrops', label: 'Airdrops', icon: Gift },
  { to: '/tracker/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/tracker/daily', label: 'Daily Tasks', icon: CalendarDays },
];

export default function TrackerSidebarMobile({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-64 transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <span className="text-lg font-bold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tracker navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-label="Tracker navigation">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {React.createElement(Icon, { className: 'h-5 w-5', 'aria-hidden': true })}
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
