/**
 * ProfilesTable
 * - Purpose: Display the list of profiles for the authenticated account.
 * - Actions per row: Edit, Remove.
 * - Uses AddProfileModal for editing by passing defaultValues + profileId.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProfilesStore } from '../../stores/profilesStore';
import type { MemberProfile } from '../../types';
import { Button } from '../ui/button';
import AddProfileModal from './AddProfileModal';

/** Human-readable full name helper. */
function fullName(p: MemberProfile) {
  return `${p.firstName} ${p.lastName}`.trim();
}

export default function ProfilesTable() {
  const { account } = useAuthStore();
  const { ensureLoaded, profiles, removeProfile, currentProfileId, setCurrentProfile } = useProfilesStore();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MemberProfile | null>(null);

  useEffect(() => {
    if (account?.id) ensureLoaded(account.id);
  }, [account?.id, ensureLoaded]);

  const rows = useMemo(() => profiles.slice().sort((a, b) => fullName(a).localeCompare(fullName(b))), [profiles]);

  function handleEdit(p: MemberProfile) {
    setEditing(p);
    setEditOpen(true);
  }

  function handleRemove(p: MemberProfile) {
    if (!account?.id) return;
    const confirmed = window.confirm(`Remove profile "${fullName(p)}"?`);
    if (confirmed) {
      removeProfile(account.id, p.id);
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">License #</th>
            <th className="px-3 py-2 font-medium">NABP ID</th>
            <th className="px-3 py-2 font-medium">Active</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-slate-600">
                No profiles yet. Click "Add Profile" to create one.
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="px-3 py-2">{fullName(p)}</td>
                <td className="px-3 py-2">{p.roleType}</td>
                <td className="px-3 py-2">{p.phoneNumber || '—'}</td>
                <td className="px-3 py-2">{p.profileEmail || '—'}</td>
                <td className="px-3 py-2">{p.licenseNumber || '—'}</td>
                <td className="px-3 py-2">{p.nabpEprofileId || '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
                      currentProfileId === p.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-1.5 w-1.5 rounded-full',
                        currentProfileId === p.id ? 'bg-green-600' : 'bg-slate-400',
                      ].join(' ')}
                    />
                    {currentProfileId === p.id ? 'Selected' : 'Not selected'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    {currentProfileId !== p.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setCurrentProfile(p.id)}
                      >
                        Use
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleEdit(p)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handleRemove(p)}>
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit modal reusing AddProfileModal */}
      <AddProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profileId={editing?.id}
        defaultValues={editing ?? undefined}
      />
    </div>
  );
}
