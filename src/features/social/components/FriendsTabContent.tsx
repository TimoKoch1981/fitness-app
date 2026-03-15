/**
 * FriendsTabContent — Friends list with pending requests, search + add.
 */

import { useState } from 'react';
import {
  UserPlus, UserCheck, UserX, UserMinus, Search, X, Clock,
  Users, MessageCircle, Loader2,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import {
  useFriends,
  usePendingRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
  useSearchUsers,
} from '../hooks/useFriendships';
import type { Friendship, FriendProfile } from '../types';

// ── Avatar helper ────────────────────────────────────────────────────

function UserAvatar({ profile, size = 'md' }: { profile?: FriendProfile | null; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initials = (profile?.display_name ?? '?').slice(0, 2).toUpperCase();

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name ?? ''}
        className={cn(sizeClass, 'rounded-full object-cover')}
      />
    );
  }

  return (
    <div className={cn(sizeClass, 'rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold')}>
      {initials}
    </div>
  );
}

// ── Add Friend (Search) Dialog ──────────────────────────────────────

function AddFriendSection() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearchUsers(query);
  const sendRequest = useSendFriendRequest();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSend = (userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => setSentIds(prev => new Set(prev).add(userId)),
    });
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isDE ? 'Nutzer suchen...' : 'Search users...'}
          className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading && query.length >= 2 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-1">
          {results.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <UserAvatar profile={user} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
                </p>
              </div>
              {sentIds.has(user.id) ? (
                <span className="text-xs text-teal-500 font-medium flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" />
                  {isDE ? 'Gesendet' : 'Sent'}
                </span>
              ) : (
                <button
                  onClick={() => handleSend(user.id)}
                  disabled={sendRequest.isPending}
                  className="px-3 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results?.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          {isDE ? 'Keine Nutzer gefunden' : 'No users found'}
        </p>
      )}
    </div>
  );
}

// ── Pending Requests Section ────────────────────────────────────────

function PendingRequestsSection() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: pending } = usePendingRequests();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  if (!pending || pending.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {isDE ? 'Ausstehende Anfragen' : 'Pending Requests'}
        <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {pending.length}
        </span>
      </h3>
      <div className="space-y-1">
        {pending.map((req: Friendship) => (
          <div key={req.id} className="flex items-center gap-3 p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl">
            <UserAvatar profile={req.friend_profile} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {req.friend_profile?.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
              </p>
              <p className="text-[10px] text-gray-400">
                {new Date(req.requested_at).toLocaleDateString(isDE ? 'de-DE' : 'en-US')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => acceptRequest.mutate(req.id)}
                disabled={acceptRequest.isPending}
                className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                title={isDE ? 'Annehmen' : 'Accept'}
              >
                <UserCheck className="h-4 w-4" />
              </button>
              <button
                onClick={() => declineRequest.mutate(req.id)}
                disabled={declineRequest.isPending}
                className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                title={isDE ? 'Ablehnen' : 'Decline'}
              >
                <UserX className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Friends List ────────────────────────────────────────────────────

export function FriendsTabContent() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: friends, isLoading } = useFriends();
  const removeFriend = useRemoveFriend();
  const [showSearch, setShowSearch] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Add Friend Toggle */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
          showSearch
            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
        )}
      >
        {showSearch ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {showSearch
          ? (isDE ? 'Suche schließen' : 'Close search')
          : (isDE ? 'Freund hinzufügen' : 'Add friend')
        }
      </button>

      {showSearch && <AddFriendSection />}

      {/* Pending Requests */}
      <PendingRequestsSection />

      {/* Friends List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {isDE ? 'Freunde' : 'Friends'}
          {friends && friends.length > 0 && (
            <span className="ml-auto text-[10px] text-gray-400 font-normal normal-case">
              {friends.length}
            </span>
          )}
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : friends && friends.length > 0 ? (
          <div className="space-y-1">
            {friends.map((f: Friendship) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-xl hover:border-teal-100 transition-colors"
              >
                <UserAvatar profile={f.friend_profile} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {f.friend_profile?.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
                  </p>
                  {f.accepted_at && (
                    <p className="text-[10px] text-gray-400">
                      {isDE ? 'Seit' : 'Since'} {new Date(f.accepted_at).toLocaleDateString(isDE ? 'de-DE' : 'en-US')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {confirmRemoveId === f.id ? (
                    <>
                      <button
                        onClick={() => { removeFriend.mutate(f.id); setConfirmRemoveId(null); }}
                        className="px-2 py-1 bg-red-500 text-white text-[10px] font-medium rounded-lg"
                      >
                        {isDE ? 'Ja' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-medium rounded-lg"
                      >
                        {isDE ? 'Nein' : 'No'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(f.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                      title={isDE ? 'Freund entfernen' : 'Remove friend'}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <MessageCircle className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">
              {isDE
                ? 'Noch keine Freunde. Suche nach Nutzern!'
                : 'No friends yet. Search for users!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
