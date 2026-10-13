import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useSnackbar } from '../../context/SnackbarContext';
import { en } from '../../i18n/en';
import type { Member, MemberDevice } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface MemberWithDevices extends Member {
  devices: MemberDevice[];
}

interface MembersAdminModalProps {
  onClose: () => void;
}

export function MembersAdminModal({ onClose }: MembersAdminModalProps) {
  const { member: currentMember } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [membersWithDevices, setMembersWithDevices] = useState<MemberWithDevices[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState<{ deviceId: string; memberName: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: membersData, error: membersErr } = await supabase
        .from('members')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (membersErr) throw membersErr;

      const { data: devicesData, error: devicesErr } = await supabase
        .from('member_devices')
        .select('*');

      if (devicesErr) throw devicesErr;

      const combined: MemberWithDevices[] = (membersData ?? []).map((m) => ({
        ...m,
        devices: (devicesData ?? []).filter((d) => d.member_id === m.id),
      }));

      setMembersWithDevices(combined);
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvite = async (memberId: string) => {
    setBusy(true);
    try {
      const { data: code, error } = await (supabase.rpc as any)('create_invite', {
        p_member_id: memberId,
      });
      if (error) throw error;
      const inviteUrl = `${window.location.origin}/invite?code=${code}`;
      setInviteLinks((prev) => ({ ...prev, [memberId]: inviteUrl }));
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyInvite = async (memberId: string) => {
    const link = inviteLinks[memberId];
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showSnackbar('Invite link copied!');
    } catch {
      showSnackbar(en.errorGeneric);
    }
  };

  const handleRemoveDevice = async () => {
    if (!confirmRemove) return;
    setBusy(true);
    try {
      const { error } = await (supabase.rpc as any)('remove_device', {
        p_device_id: confirmRemove.deviceId,
      });
      if (error) throw error;
      setConfirmRemove(null);
      await fetchData();
      showSnackbar('Device removed.');
    } catch {
      showSnackbar(en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleStartRename = (m: Member) => {
    setRenamingId(m.id);
    setRenameValue(m.name);
  };

  const handleSaveRename = async () => {
    if (!renamingId || !renameValue.trim()) return;
    setBusy(true);
    try {
      const { error } = await (supabase.rpc as any)('rename_member', {
        p_member_id: renamingId,
        p_new_name: renameValue.trim(),
      });

      if (error) {
        // Fallback to direct update if RPC is not yet created
        const { error: directErr } = await supabase
          .from('members')
          .update({ name: renameValue.trim() })
          .eq('id', renamingId);
        if (directErr) throw error;
      }

      setRenamingId(null);
      await fetchData();
    } catch (e: any) {
      showSnackbar(e?.message || en.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="members-admin-heading"
      className="fixed inset-0 bg-black/60 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 id="members-admin-heading" className="text-2xl font-bold text-[var(--text)]">
            {en.membersTitle}
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] px-3 py-1 text-lg font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            Done
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <p className="text-lg text-[var(--muted)] text-center py-8">Loading…</p>
          ) : (
            membersWithDevices.map((m) => {
              const isCurrentMember = m.id === currentMember?.id;
              const invite = inviteLinks[m.id];

              return (
                <Card key={m.id} className="space-y-3">
                  {/* Member name + rename */}
                  <div className="flex items-center justify-between gap-3">
                    {renamingId === m.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 px-3 py-2 bg-[var(--surface)] border-2 border-[var(--primary)] rounded-xl text-lg text-[var(--text)] focus:outline-none"
                          autoFocus
                          aria-label="New name"
                        />
                        <button
                          onClick={handleSaveRename}
                          disabled={busy || !renameValue.trim()}
                          className="min-h-[44px] px-4 rounded-xl bg-[var(--primary)] text-white font-semibold text-base disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-[var(--muted)] font-semibold text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-lg font-bold text-[var(--text)]">
                            {m.name}
                            {m.is_admin && (
                              <span className="ml-2 text-sm font-normal text-[var(--primary)]">(Admin)</span>
                            )}
                            {isCurrentMember && (
                              <span className="ml-2 text-sm font-normal text-[var(--muted)]">(you)</span>
                            )}
                          </p>
                          <p className="text-base text-[var(--muted)]">
                            {m.devices.length === 0
                              ? 'No devices linked'
                              : m.devices.length === 1
                              ? '1 device linked'
                              : `${m.devices.length} devices linked`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartRename(m)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border)] text-base font-semibold text-[var(--text)] hover:bg-gray-50"
                          aria-label={`${en.membersRename} ${m.name}`}
                        >
                          {en.membersRename}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Devices list */}
                  {m.devices.length > 0 && (
                    <ul className="space-y-1 pl-1">
                      {m.devices.map((device, idx) => (
                        <li key={device.id} className="flex items-center justify-between gap-2">
                          <span className="text-base text-[var(--muted)]">
                            Device {idx + 1}
                            {device.auth_user_id === currentMember?.id && ' (this device)'}
                          </span>
                          <button
                            onClick={() =>
                              setConfirmRemove({ deviceId: device.id, memberName: m.name })
                            }
                            className="min-h-[44px] px-3 py-1 text-base text-[var(--owe)] font-semibold rounded-xl hover:bg-red-50"
                            aria-label={`${en.membersRemoveDevice} for ${m.name}`}
                          >
                            {en.membersRemoveDevice}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Invite link */}
                  {invite ? (
                    <div className="space-y-2">
                      <input
                        readOnly
                        value={invite}
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] select-all"
                        aria-label="Invite link"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant="secondary"
                        onClick={() => handleCopyInvite(m.id)}
                        aria-label="Copy invite link"
                      >
                        Copy link
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleCreateInvite(m.id)}
                      disabled={busy}
                      aria-label={`${en.membersCreateInvite} for ${m.name}`}
                    >
                      {en.membersCreateInvite}
                    </Button>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Remove device confirmation dialog */}
      {confirmRemove && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full">
            <h3 className="text-2xl font-bold text-[var(--text)] mb-4">
              {en.membersRemoveDevice}
            </h3>
            <p className="text-lg text-[var(--text)] leading-relaxed mb-6">
              {en.membersRemoveConfirm}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRemoveDevice}
                disabled={busy}
                aria-label={en.membersRemoveYes}
              >
                {busy ? 'Removing…' : en.membersRemoveYes}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmRemove(null)}
                disabled={busy}
                aria-label={en.membersRemoveNo}
              >
                {en.membersRemoveNo}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
