import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Loader2 } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { token, apiUrl } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${apiUrl}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error fetching unread notification count:', e);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    const willShow = !showDropdown;
    setShowDropdown(willShow);
    if (willShow) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const res = await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        fetchUnreadCount();
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="p-2 rounded-full hover:bg-slate-100 transition-colors relative text-slate-600 focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white font-extrabold text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-black text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-4 flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 hover:bg-slate-50/50 transition-colors text-xs ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start space-x-2">
                    <div>
                      <p className={`font-bold text-slate-800 ${!n.isRead ? 'text-primary' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-slate-500 mt-0.5 font-medium leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-1.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                        className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-all shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
