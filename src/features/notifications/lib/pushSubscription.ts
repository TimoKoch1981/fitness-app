/**
 * Web Push subscription management.
 * Handles browser PushManager subscription + Supabase persistence.
 */

import { supabase } from '../../../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Convert VAPID key from base64url to Uint8Array (for PushManager) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if Web Push is supported in this browser */
export function isWebPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

/** Get or create a Web Push subscription */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isWebPushSupported() || !VAPID_PUBLIC_KEY) return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    // Save to Supabase
    if (subscription) {
      await savePushSubscription(subscription);
    }

    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}

/** Unsubscribe from Web Push */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('channel', 'web_push')
          .eq('endpoint', subscription.endpoint);
      }

      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}

/** Get current Web Push subscription state */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Save push subscription to Supabase */
async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const json = subscription.toJSON();
  const keys = json.keys as Record<string, string> | undefined;

  // Delete existing subscription for same endpoint, then insert fresh
  // (partial unique indexes don't work with upsert onConflict)
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('channel', 'web_push')
    .eq('endpoint', json.endpoint ?? '');

  await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      channel: 'web_push',
      endpoint: json.endpoint,
      p256dh: keys?.p256dh ?? null,
      auth_key: keys?.auth ?? null,
      is_active: true,
      device_name: getBrowserName(),
      updated_at: new Date().toISOString(),
    });
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Browser';
}
