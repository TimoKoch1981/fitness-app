// Notification types for FitBuddy Push Notification System
// Stored in localStorage (device-specific, no DB overhead)

export type NotificationType =
  | 'substance'
  | 'blood_pressure'
  | 'body_measurement'
  | 'custom'
  | 'daily_summary';

export interface NotificationTypeConfig {
  enabled: boolean;
}

export interface NotificationPreferences {
  /** Master toggle — disables all notifications when false */
  enabled: boolean;
  /** Per-type toggles */
  types: Record<NotificationType, boolean>;
  /** Time for daily summary notification (HH:mm) */
  dailySummaryTime: string;
  /** Quiet hours — no notifications during this window */
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  types: {
    substance: true,
    blood_pressure: true,
    body_measurement: true,
    custom: true,
    daily_summary: true,
  },
  dailySummaryTime: '21:00',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
};

/** Payload for dispatching a single notification */
export interface NotificationPayload {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  at: Date;
  route?: string; // App route to navigate on click
}

/** Route map: notification type -> app route */
export const NOTIFICATION_ROUTES: Record<NotificationType, string> = {
  substance: '/medical',
  blood_pressure: '/medical',
  body_measurement: '/tracking',
  custom: '/cockpit',
  daily_summary: '/cockpit',
};
