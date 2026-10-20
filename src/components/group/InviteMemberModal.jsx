import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, Check } from 'lucide-react';

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  availableUsers = [],
  currentMembers = [],
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter out users who are already members
  const memberUserIds = new Set(currentMembers.map((m) => m.user_id));
  const uninvitedUsers = availableUsers.filter((u) => !memberUserIds.has(u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let targetUser = null;

    if (selectedUserId) {
      targetUser = availableUsers.find((u) => u.id === selectedUserId);
    } else if (emailInput.trim()) {
      // Check if email belongs to an existing user
      targetUser = availableUsers.find(
        (u) => u.email?.toLowerCase() === emailInput.trim().toLowerCase()
      );
      if (!targetUser) {
        // Create pseudo user object
        targetUser = {
          id: crypto.randomUUID(),
          email: emailInput.trim(),
          display_name: emailInput.split('@')[0],
        };
      }
    } else {
      setError('Please select a user or enter an email address.');
      return;
    }

    if (!targetUser) {
      setError('Please specify a user to invite.');
      return;
    }

    setSubmitting(true);
    try {
      await onInvite(targetUser, role);
      setSelectedUserId('');
      setEmailInput('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to invite participant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[460px] bg-surface border border-border rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-route/10 text-route flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="font-['Fraunces'] font-semibold text-[19px] text-ink leading-tight">
                Invite Participant
              </h2>
              <p className="text-[12px] text-muted">
                Add travel companions to your group trip (FR-21)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-border/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Option A: Select from existing users */}
          {uninvitedUsers.length > 0 && (
            <div>
              <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
                Select Registered User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  if (e.target.value) setEmailInput('');
                }}
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink focus:outline-none focus:border-route"
              >
                <option value="">-- Choose a user --</option>
                {uninvitedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 text-[12px] text-muted font-['IBM_Plex_Mono']">
            <div className="flex-1 h-px bg-border"></div>
            <span>OR INVITE VIA EMAIL</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Option B: Email Input */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              User Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-muted" />
              <input
                type="email"
                placeholder="companion@gmail.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (e.target.value) setSelectedUserId('');
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-route"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[12px] font-semibold text-muted font-['IBM_Plex_Mono'] uppercase tracking-wider mb-2">
              Trip Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'member'
                    ? 'border-route bg-route/10 text-route font-semibold ring-2 ring-route/20'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <div className="text-[13px] font-semibold">Participant</div>
                <div className="text-[11px] opacity-80 mt-0.5">Can add & split shared expenses</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('co-organizer')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'co-organizer'
                    ? 'border-route bg-route/10 text-route font-semibold ring-2 ring-route/20'
                    : 'border-border bg-bg text-muted hover:text-ink'
                }`}
              >
                <div className="text-[13px] font-semibold">Co-Organizer</div>
                <div className="text-[11px] opacity-80 mt-0.5">Can invite others & manage trip</div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-medium text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-route text-white text-[14px] font-semibold shadow-sm hover:bg-route/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
