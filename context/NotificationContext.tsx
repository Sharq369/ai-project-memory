'use client'

// context/NotificationContext.tsx
// Global notification state — wraps the entire dashboard.
// Provides: notifications list, unreadCount, markAsRead, markAllRead, clearAll.
// Realtime: new rows inserted into `notifications` by any server action
// appear instantly without polling.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ── Types ──────────────────────────────────────────────────────────────────────
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  link?: string | null
  created_at: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clearAll: () => Promise<void>
  dismiss: (id: string) => Promise<void>
}

// ── Stable singleton client ────────────────────────────────────────────────────
// Created outside the component so it never re-instantiates across renders,
// which would break the WebSocket connection.
let _supabase: ReturnType<typeof createBrowserClient> | null = null
const getSupabase = () => {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

// ── Context ────────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)
  const supabase = getSupabase()

  // ─────────────────────────────────────────────────────────────────────────
  // FIX: Realtime filter race condition.
  //
  // BEFORE (broken):
  //   useEffect called fetchNotifications() — which is async.
  //   Then immediately called supabase.channel(...).subscribe().
  //   fetchNotifications sets userIdRef.current ASYNCHRONOUSLY, but the
  //   channel was already subscribing before the await resolved.
  //   Result: userIdRef.current was null when the filter was evaluated,
  //   so filter = undefined — the subscription received ALL users'
  //   notifications OR nothing at all depending on RLS policy.
  //
  // AFTER (fixed):
  //   We fetch the user ID first, set userIdRef.current synchronously,
  //   THEN subscribe to the channel with the correct filter already in place.
  //   The subscription is set up inside an async function that awaits the
  //   user resolution before calling .subscribe().
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      // Step 1: resolve user FIRST before any subscription
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Step 2: set the ref BEFORE subscribing
      userIdRef.current = user.id

      // Step 3: fetch existing notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) setNotifications(data as AppNotification[])
      setLoading(false)

      // Step 4: subscribe NOW — userIdRef.current is guaranteed to be set
      channel = supabase
        .channel(`notifications-${user.id}`)  // user-scoped channel name
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,  // always set — no race condition
          },
          (payload) => {
            const newNotif = payload.new as AppNotification
            setNotifications(prev => [newNotif, ...prev].slice(0, 50))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as AppNotification
            setNotifications(prev =>
              prev.map(n => n.id === updated.id ? updated : n)
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const deleted = payload.old as { id: string }
            setNotifications(prev => prev.filter(n => n.id !== deleted.id))
          }
        )
        .subscribe((status) => {
          console.log('[Notifications] Realtime status:', status)
        })
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, []) // runs once on mount — stable supabase singleton means no re-runs needed

  // ── Actions ──────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userIdRef.current) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userIdRef.current)
      .eq('is_read', false)
  }, [])

  const dismiss = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }, [])

  const clearAll = useCallback(async () => {
    if (!userIdRef.current) return
    setNotifications([])
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userIdRef.current)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllRead,
      clearAll,
      dismiss,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
