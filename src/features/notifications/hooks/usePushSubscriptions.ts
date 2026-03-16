/**
 * usePushSubscriptions — Manage cloud push channels (Web Push, WhatsApp, Telegram).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { subscribeToPush, unsubscribeFromPush, isWebPushSupported } from '../lib/pushSubscription';

interface PushSubscription {
  id: string;
  user_id: string;
  channel: 'web_push' | 'whatsapp' | 'telegram';
  endpoint?: string;
  whatsapp_phone?: string;
  telegram_chat_id?: string;
  device_name?: string;
  is_active: boolean;
  created_at: string;
}

const PUSH_KEY = 'push-subscriptions';

/** List all push subscriptions for current user */
export function usePushSubscriptions() {
  return useQuery({
    queryKey: [PUSH_KEY],
    queryFn: async (): Promise<PushSubscription[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

/** Enable/disable Web Push */
export function useToggleWebPush() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        await subscribeToPush();
      } else {
        await unsubscribeFromPush();
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PUSH_KEY] }),
  });
}

/** Register a WhatsApp phone number */
export function useRegisterWhatsApp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Normalize phone to E.164
      const normalized = phone.replace(/\s+/g, '').replace(/^00/, '+');
      const e164 = normalized.startsWith('+') ? normalized : `+${normalized}`;

      // Delete existing, then insert (partial unique indexes)
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('channel', 'whatsapp');

      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          channel: 'whatsapp',
          whatsapp_phone: e164,
          is_active: true,
          device_name: 'WhatsApp',
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PUSH_KEY] }),
  });
}

/** Create a Telegram link token (user then opens bot link with this token) */
export function useLinkTelegram() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate random link token
      const linkToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

      // Create inactive subscription with link token as placeholder
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          channel: 'telegram',
          telegram_chat_id: linkToken, // Will be replaced by webhook
          is_active: false, // Activated by telegram-webhook when user clicks /start
          device_name: 'Telegram (pending)',
        });

      if (error) throw error;

      return linkToken;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PUSH_KEY] }),
  });
}

/** Remove a push subscription */
export function useRemovePushSubscription() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      // If it's a web push subscription, also unsubscribe from browser
      const { data } = await supabase
        .from('push_subscriptions')
        .select('channel')
        .eq('id', subscriptionId)
        .single();

      if (data?.channel === 'web_push') {
        await unsubscribeFromPush();
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PUSH_KEY] }),
  });
}

/** Send a test push notification to self */
export function useSendTestPush() {
  return useMutation({
    mutationFn: async (channel?: 'web_push' | 'whatsapp' | 'telegram') => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '🏋️ FitBuddy Test',
            body: 'Push-Benachrichtigungen funktionieren! / Push notifications work!',
            notification_type: 'custom',
            channel,
            url: 'https://fudda.de/cockpit',
          }),
        },
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return response.json();
    },
  });
}

/** Check if Web Push is available in this browser */
export { isWebPushSupported };
