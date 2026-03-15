/**
 * GroupsTabContent — My groups + public group discovery + create group.
 */

import { useState, useEffect } from 'react';
import {
  Users, Plus, Globe, Lock, Crown, LogOut, Trash2, ChevronDown,
  ChevronUp, Loader2, X,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import {
  useMyGroups,
  usePublicGroups,
  useGroupMembers,
  useCreateGroup,
  useJoinGroup,
  useLeaveGroup,
  useDeleteGroup,
} from '../hooks/useGroups';
import type { Group, GroupMember } from '../types';

// ── Create Group Dialog ─────────────────────────────────────────────

function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const createGroup = useCreateGroup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined, visibility },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-teal-100 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">
        {isDE ? 'Neue Gruppe erstellen' : 'Create New Group'}
      </h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={isDE ? 'Gruppenname' : 'Group name'}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        maxLength={100}
        required
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={isDE ? 'Beschreibung (optional)' : 'Description (optional)'}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        rows={2}
        maxLength={500}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVisibility('private')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
            visibility === 'private'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          {isDE ? 'Privat' : 'Private'}
        </button>
        <button
          type="button"
          onClick={() => setVisibility('public')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
            visibility === 'public'
              ? 'bg-teal-500 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          {isDE ? 'Öffentlich' : 'Public'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
        >
          {isDE ? 'Abbrechen' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={!name.trim() || createGroup.isPending}
          className="flex-1 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:opacity-50"
        >
          {createGroup.isPending
            ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            : (isDE ? 'Erstellen' : 'Create')
          }
        </button>
      </div>
    </form>
  );
}

// ── Group Card ──────────────────────────────────────────────────────

function GroupCard({
  group,
  isOwner,
  isMember,
}: {
  group: Group;
  isOwner: boolean;
  isMember: boolean;
}) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [expanded, setExpanded] = useState(false);
  const { data: members } = useGroupMembers(expanded ? group.id : null);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-teal-100 transition-colors">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-800 truncate">{group.name}</p>
            {isOwner && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
            {group.visibility === 'public'
              ? <Globe className="h-3 w-3 text-teal-400 flex-shrink-0" />
              : <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
            }
          </div>
          {group.description && (
            <p className="text-[11px] text-gray-400 truncate">{group.description}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {/* Expanded: members + actions */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-50 pt-2">
          {/* Members */}
          {members && members.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {isDE ? 'Mitglieder' : 'Members'} ({members.length})
              </p>
              {members.map((m: GroupMember) => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                    {(m.profile?.display_name ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-700 truncate flex-1">
                    {m.profile?.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
                  </span>
                  {m.role === 'admin' && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!isMember && (
              <button
                onClick={() => joinGroup.mutate(group.id)}
                disabled={joinGroup.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600"
              >
                <Users className="h-3.5 w-3.5" />
                {isDE ? 'Beitreten' : 'Join'}
              </button>
            )}
            {isMember && !isOwner && (
              <button
                onClick={() => leaveGroup.mutate(group.id)}
                disabled={leaveGroup.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                {isDE ? 'Verlassen' : 'Leave'}
              </button>
            )}
            {isOwner && (
              confirmDelete ? (
                <div className="flex-1 flex gap-1">
                  <button
                    onClick={() => deleteGroup.mutate(group.id)}
                    className="flex-1 py-2 bg-red-500 text-white text-xs font-medium rounded-lg"
                  >
                    {isDE ? 'Ja, löschen' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg"
                  >
                    {isDE ? 'Nein' : 'No'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function GroupsTabContent() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: myGroups, isLoading: loadingMy } = useMyGroups();
  const { data: publicGroups, isLoading: loadingPublic } = usePublicGroups();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'my' | 'discover'>('my');

  // Determine ownership from current user
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const myGroupIds = new Set((myGroups ?? []).map(g => g.id));

  return (
    <div className="space-y-4">
      {/* Create group toggle */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
          showCreate
            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
        )}
      >
        {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {showCreate
          ? (isDE ? 'Schließen' : 'Close')
          : (isDE ? 'Gruppe erstellen' : 'Create group')
        }
      </button>

      {showCreate && <CreateGroupForm onClose={() => setShowCreate(false)} />}

      {/* Sub-tabs: My Groups / Discover */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setTab('my')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
            tab === 'my' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500',
          )}
        >
          {isDE ? 'Meine Gruppen' : 'My Groups'}
        </button>
        <button
          onClick={() => setTab('discover')}
          className={cn(
            'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
            tab === 'discover' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500',
          )}
        >
          {isDE ? 'Entdecken' : 'Discover'}
        </button>
      </div>

      {/* Group list */}
      {tab === 'my' && (
        loadingMy ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : myGroups && myGroups.length > 0 ? (
          <div className="space-y-2">
            {myGroups.map((g: Group) => (
              <GroupCard
                key={g.id}
                group={g}
                isOwner={g.owner_id === userId}
                isMember={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Users className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">
              {isDE
                ? 'Noch keine Gruppen. Erstelle eine oder tritt einer bei!'
                : 'No groups yet. Create one or join a group!'}
            </p>
          </div>
        )
      )}

      {tab === 'discover' && (
        loadingPublic ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : publicGroups && publicGroups.length > 0 ? (
          <div className="space-y-2">
            {publicGroups.filter(g => !myGroupIds.has(g.id)).map((g: Group) => (
              <GroupCard
                key={g.id}
                group={g}
                isOwner={false}
                isMember={false}
              />
            ))}
            {publicGroups.filter(g => !myGroupIds.has(g.id)).length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">
                {isDE ? 'Alle Gruppen bereits beigetreten!' : 'Already joined all groups!'}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Globe className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">
              {isDE ? 'Keine öffentlichen Gruppen vorhanden' : 'No public groups available'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
