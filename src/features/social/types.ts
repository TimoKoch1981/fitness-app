/**
 * Social Community Types — Friendships, Groups, Challenges, Activity Feed
 */

// ── Friendships ──────────────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  requested_at: string;
  accepted_at: string | null;
  /** Joined profile data (from friend's perspective) */
  friend_profile?: FriendProfile;
}

export interface FriendProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_visibility: 'private' | 'friends' | 'public';
}

// ── Groups ───────────────────────────────────────────────────────────

export type GroupVisibility = 'private' | 'public';
export type GroupMemberRole = 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  avatar_url: string | null;
  visibility: GroupVisibility;
  max_members: number;
  created_at: string;
  /** Computed: current member count */
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  /** Joined profile */
  profile?: FriendProfile;
}

// ── Challenges ───────────────────────────────────────────────────────

export type ChallengeType =
  | 'workout_count'
  | 'total_volume'
  | 'calories_logged'
  | 'streak_days'
  | 'body_measurements'
  | 'custom';

export type ChallengeVisibility = 'private' | 'friends' | 'group' | 'public';

export interface Challenge {
  id: string;
  group_id: string | null;
  creator_id: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit: string | null;
  start_date: string;
  end_date: string;
  visibility: ChallengeVisibility;
  created_at: string;
  /** Computed: participants with progress */
  participants?: ChallengeParticipant[];
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  current_value: number;
  joined_at: string;
  completed_at: string | null;
  /** Joined profile */
  profile?: FriendProfile;
}

// ── Activity Feed ────────────────────────────────────────────────────

export type ActivityType =
  | 'workout_completed'
  | 'goal_achieved'
  | 'badge_earned'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'streak_milestone'
  | 'body_goal_reached'
  | 'recipe_shared';

export type ActivityVisibility = 'private' | 'friends' | 'public';

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  visibility: ActivityVisibility;
  created_at: string;
  /** Joined profile */
  profile?: FriendProfile;
}
