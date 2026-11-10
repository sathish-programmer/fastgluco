import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Users,
  Stethoscope,
  TestTube,
  ShieldCheck,
  Utensils,
  Settings,
  Mail,
  Bot,
  Truck,
  HelpCircle,
  Activity,
  ArrowRight,
  X
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions';
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: 'dashboard', title: 'Main Executive Dashboard', category: 'Navigation', icon: <LayoutDashboard className="h-4 w-4" />, onSelect: () => onNavigateTab('dashboard') },
    { id: 'orders', title: 'Order Management Hub & Fulfillment', category: 'Navigation', icon: <ShoppingCart className="h-4 w-4" />, onSelect: () => onNavigateTab('order-management') },
    { id: 'revenue', title: 'Revenue Analytics & GMV Reports', category: 'Navigation', icon: <DollarSign className="h-4 w-4" />, onSelect: () => onNavigateTab('revenue-analytics') },
    { id: 'users', title: 'User Management & Subscriptions', category: 'Navigation', icon: <Users className="h-4 w-4" />, onSelect: () => onNavigateTab('users') },
    { id: 'doctors', title: 'Doctor Portal & Consultations', category: 'Navigation', icon: <Stethoscope className="h-4 w-4" />, onSelect: () => onNavigateTab('doctors') },
    { id: 'labs', title: 'Diagnostic Laboratories & Tests', category: 'Navigation', icon: <TestTube className="h-4 w-4" />, onSelect: () => onNavigateTab('labs') },
    { id: 'shipping', title: 'Pincode Delivery & Shipping Rules', category: 'Navigation', icon: <Truck className="h-4 w-4" />, onSelect: () => onNavigateTab('shipping') },
    { id: 'products', title: 'Shop Products & Inventory', category: 'Navigation', icon: <ShoppingCart className="h-4 w-4" />, onSelect: () => onNavigateTab('products') },
    { id: 'food-library', title: 'Food Master Library & Nutrition', category: 'Navigation', icon: <Utensils className="h-4 w-4" />, onSelect: () => onNavigateTab('food') },
    { id: 'support', title: 'Customer Support Tickets & Helpdesk', category: 'Navigation', icon: <HelpCircle className="h-4 w-4" />, onSelect: () => onNavigateTab('support') },
    { id: 'workflows', title: 'AI Chat Workflows (3 Modes)', category: 'Navigation', icon: <Bot className="h-4 w-4" />, onSelect: () => onNavigateTab('workflows') },
    { id: 'app-health', title: 'App Store & Play Store Telemetry', category: 'Navigation', icon: <Activity className="h-4 w-4" />, onSelect: () => onNavigateTab('app-health') },
    { id: 'otp-logs', title: 'OTP Delivery & SMS Telemetry Logs', category: 'Navigation', icon: <ShieldCheck className="h-4 w-4" />, onSelect: () => onNavigateTab('otp-logs') },
    { id: 'sent-emails', title: 'Sent Transactional Email Logs', category: 'Navigation', icon: <Mail className="h-4 w-4" />, onSelect: () => onNavigateTab('sent-emails') },
    { id: 'settings', title: 'Payment Gateway & System Config', category: 'Navigation', icon: <Settings className="h-4 w-4" />, onSelect: () => onNavigateTab('settings') },
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigateTab(commands[0].id); // or trigger toggle
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onNavigateTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a section, tool, or order (e.g. 'Orders', 'Revenue', 'Doctors')..."
            className="w-full bg-transparent px-3 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching admin sections found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold transition-all ${
                  idx === selectedIndex
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${idx === selectedIndex ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-80">
                  <span className="text-[10px] uppercase tracking-wider">{item.category}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-between">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">↓</kbd></span>
          <span>Select with <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};

