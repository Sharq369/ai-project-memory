'use client'

// components/NotificationCenter.tsx
// Drop this anywhere in your layout — renders a bell icon with badge
// and a dropdown panel showing notification history.

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, X, CheckCheck, Trash2, CheckCircle2,
  AlertCircle, Info, AlertTriangle, Loader2, ExternalLink
} from 'lucide-react'
import { useNotifications, AppNotification, NotificationType } from '../context/NotificationContext'

// ── Helpers ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ElementType
  iconClass: string
  badgeBg: string
  rowBorder: string
  dotColor: string
}> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500',
    rowBorder: 'border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-400',
    badgeBg: 'bg-red-500',
    rowBorder: 'border-red-500/20',
    dotColor: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    badgeBg: 'bg-amber-500',
    rowBorder: 'border-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  info: {
    icon: Info,
    iconClass: 'text-cyan-400',
    badgeBg: 'bg-cyan-500',
    rowBorder: 'border-cyan-500/20',
    dotColor: 'bg-cyan-400',
  },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Notification Row ───────────────────────────────────────────────────────────
function NotifRow({ notif }: { notif: AppNotification }) {
  const { markAsRead, dismiss } = useNotifications()
  const router = useRouter()
  const cfg = TYPE_CONFIG[notif.type]
  const Icon = cfg.icon

  const handleClick = async () => {
    if (!notif.is_read) await markAsRead(notif.id)
    if (notif.link) router.push(notif.link)
  }

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3.5 transition-all cursor-pointer
        ${notif.is_read
          ? 'bg-transparent hover:bg-white/[0.03]'
          : `bg-[#0d1117] border-l-2 ${cfg.rowBorder} hover:bg-white/[0.04]`
        }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[11px] font-bold uppercase tracking-wider leading-tight
            ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
            {notif.title}
          </p>
          <span className="text-[9px] text-slate-600 font-mono shrink-0 mt-0.5">
            {timeAgo(notif.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>
        {notif.link && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={10} /> View
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${cfg.dotColor} shadow-[0_0_6px_currentColor]`} />
      )}

      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Bell Icon with Badge ───────────────────────────────────────────────────────
export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-black text-white shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── Notification Panel (Dropdown) ─────────────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, loading, markAllRead, clearAll } = useNotifications()

  return (
    <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[480px] flex flex-col
      rounded-2xl border border-[#1a1a3a] bg-[#07070f]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]
      overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-fuchsia-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-[9px] font-black border border-fuchsia-500/30">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
              title="Mark all read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              title="Clear all"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-fuchsia-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Bell size={20} className="text-slate-600" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All clear</p>
            <p className="text-[10px] text-slate-600 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => <NotifRow key={n.id} notif={n} />)
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/5 bg-[#05050a]">
          <p className="text-[9px] text-slate-600 font-mono text-center">
            Showing last {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  )
}
