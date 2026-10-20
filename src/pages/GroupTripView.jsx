import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGroupTrip } from '../hooks/useGroupTrip';
import { useAuth } from '../hooks/useAuth';
import AddSharedExpenseModal from '../components/group/AddSharedExpenseModal';
import InviteMemberModal from '../components/group/InviteMemberModal';
import { 
  Users, 
  Split, 
  DollarSign, 
  ArrowRight, 
  UserPlus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Layers,
  ChevronLeft
} from 'lucide-react';

export default function GroupTripView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    trip,
    members,
    sharedExpenses,
    availableUsers,
    loading,
    error,
    balanceSummary,
    inviteMember,
    removeMember,
    addSharedExpense,
    deleteSharedExpense,
    isRealtimeConnected,
  } = useGroupTrip(tripId);

  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'expenses' | 'members'
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-['IBM_Plex_Mono'] text-muted">
        Loading group trip & calculating shared balances...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="bg-surface border border-danger/20 p-8 rounded-2xl max-w-md text-center shadow-lg">
          <AlertCircle size={36} className="text-danger mx-auto mb-3" />
          <h2 className="font-['Fraunces'] font-semibold text-xl text-ink mb-2">Trip Not Found</h2>
          <p className="text-sm text-muted mb-6">{error || 'Unable to load group trip.'}</p>
          <button
            onClick={() => navigate('/trips')}
            className="px-5 py-2.5 bg-route text-white rounded-xl text-sm font-semibold hover:bg-route/90 transition-colors"
          >
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  const { memberBalances, settlements, totalGroupSpend } = balanceSummary;
  const currentMemberBalance = memberBalances.find((m) => m.user?.id === user?.id);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-[1080px] mx-auto w-full px-4 lg:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Back button */}
            <button
              onClick={() => navigate(`/trips/${tripId}/view`)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Back to</span> Itinerary
            </button>

            {/* Title & Badge */}
            <div className="text-center min-w-0">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-['Fraunces'] font-bold text-lg sm:text-xl text-ink truncate max-w-xs sm:max-w-md">
                  {trip.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-route/10 text-route border border-route/20">
                  <Users size={12} /> Group Trip
                </span>
                <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-['IBM_Plex_Mono'] font-medium border ${
                  isRealtimeConnected 
                    ? 'bg-success/10 text-success border-success/30' 
                    : 'bg-bg text-muted border-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-success animate-pulse' : 'bg-route'}`} />
                  {isRealtimeConnected ? 'Realtime Live' : 'Supabase Synced'}
                </span>
              </div>
              <p className="font-['IBM_Plex_Mono'] text-xs text-muted">
                {members.length} Traveler{members.length > 1 ? 's' : ''} • Expense Sharing & Settlements
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInviteOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-xs font-semibold text-muted hover:text-ink hover:border-route transition-colors"
              >
                <UserPlus size={14} /> Invite
              </button>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-route text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <Split size={14} /> Add Shared Expense
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-8 pt-2">
            {[
              { id: 'balances', label: 'Balances & Settlement (FR-24)', icon: DollarSign },
              { id: 'expenses', label: `Shared Expenses (${sharedExpenses.length})`, icon: Split },
              { id: 'members', label: `Group Members (${members.length})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-route text-route font-semibold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* ============================================================== */}
        {/* TAB 1: BALANCES & WHO OWES WHOM SETTLEMENT                     */}
        {/* ============================================================== */}
        {activeTab === 'balances' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Group Spend */}
              <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                  Total Shared Spend
                </span>
                <div className="mt-2 font-['Fraunces'] font-bold text-3xl text-ink">
                  ₹{totalGroupSpend.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted">
                  Across {sharedExpenses.length} shared expense{sharedExpenses.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Your Personal Net Balance */}
              <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                  Your Balance
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`font-['Fraunces'] font-bold text-3xl ${
                      (currentMemberBalance?.netBalance || 0) > 0
                        ? 'text-success'
                        : (currentMemberBalance?.netBalance || 0) < 0
                        ? 'text-danger'
                        : 'text-ink'
                    }`}
                  >
                    {(currentMemberBalance?.netBalance || 0) > 0
                      ? `+₹${currentMemberBalance.netBalance.toLocaleString()}`
                      : (currentMemberBalance?.netBalance || 0) < 0
                      ? `-₹${Math.abs(currentMemberBalance.netBalance).toLocaleString()}`
                      : '₹0'}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {(currentMemberBalance?.netBalance || 0) > 0
                      ? 'You are owed'
                      : (currentMemberBalance?.netBalance || 0) < 0
                      ? 'You owe'
                      : 'Settled up'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  Paid: ₹{(currentMemberBalance?.totalPaid || 0).toLocaleString()} • Share: ₹{(currentMemberBalance?.totalShare || 0).toLocaleString()}
                </div>
              </div>

              {/* Quick Action Card */}
              <div className="bg-route/5 border border-route/20 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-route font-['IBM_Plex_Mono']">
                    Group Split Action
                  </span>
                  <p className="text-xs text-muted mt-1">
                    Split dinners, rental cars, or tickets across travelers automatically.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-route text-white rounded-xl text-xs font-semibold hover:bg-route/90 transition-colors shadow-sm"
                >
                  <Split size={14} /> + Log Shared Expense
                </button>
              </div>
            </div>

            {/* "Who Owes Whom" Simplified Debt Settlements */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-['Fraunces'] font-semibold text-lg text-ink">
                    Who Owes Whom (Settlement Plan)
                  </h3>
                  <p className="text-xs text-muted">
                    Simplified minimum transactions to completely settle all debts
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-bg border border-border text-muted font-['IBM_Plex_Mono']">
                  {settlements.length} Transaction{settlements.length !== 1 ? 's' : ''} Needed
                </span>
              </div>

              {settlements.length === 0 ? (
                <div className="py-8 text-center text-muted flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-success opacity-80" />
                  <p className="text-sm font-medium text-ink">All balances are currently settled!</p>
                  <p className="text-xs">No one in this group owes any money right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-bg border border-border flex items-center justify-between gap-3 hover:border-route/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-danger/10 text-danger font-bold text-xs flex items-center justify-center shrink-0">
                          {s.from?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-ink truncate">
                            <span className="font-semibold">{s.from?.display_name || 'Member'}</span>
                            <span className="text-muted text-xs">owes</span>
                            <span className="font-semibold text-route">{s.to?.display_name || 'Member'}</span>
                          </div>
                          <div className="text-xs text-muted font-['IBM_Plex_Mono']">
                            Direct Settlement Transfer
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-['Fraunces'] font-bold text-lg text-ink">
                          ₹{s.amount.toLocaleString()}
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Participant Balance Ledger */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-bg/50 flex items-center justify-between">
                <h3 className="font-['Fraunces'] font-semibold text-base text-ink">
                  Participant Balances Ledger
                </h3>
                <span className="text-xs text-muted font-['IBM_Plex_Mono']">
                  {memberBalances.length} Member{memberBalances.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-border">
                {memberBalances.map((item, idx) => {
                  const isCurrent = item.user?.id === user?.id;
                  const isPositive = item.netBalance > 0.01;
                  const isNegative = item.netBalance < -0.01;

                  return (
                    <div
                      key={idx}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-bg/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-route/10 text-route font-bold flex items-center justify-center text-sm shrink-0 border border-route/20">
                          {item.user?.display_name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink truncate">
                              {item.user?.display_name || item.user?.email || 'Traveler'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                                YOU
                              </span>
                            )}
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg text-muted border border-border capitalize">
                              {item.role || 'member'}
                            </span>
                          </div>
                          <div className="text-xs text-muted mt-0.5 font-['IBM_Plex_Mono']">
                            Paid: ₹{item.totalPaid.toLocaleString()} • Fair Share: ₹{item.totalShare.toLocaleString()}
                          </div>
                        </div>
                      </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-['Fraunces'] font-bold text-lg ${
                              isPositive
                                ? 'text-success'
                                : isNegative
                                ? 'text-danger'
                                : 'text-muted'
                            }`}
                          >
                            {isPositive
                              ? `+₹${item.netBalance.toLocaleString()}`
                              : isNegative
                              ? `-₹${Math.abs(item.netBalance).toLocaleString()}`
                              : '₹0.00'}
                          </div>
                          <span className="text-xs font-medium text-muted">
                            {isPositive ? 'Gets back' : isNegative ? 'Owes' : 'Settled'}
                          </span>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SHARED EXPENSES LIST (FR-23)                            */}
        {/* ============================================================== */}
        {activeTab === 'expenses' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Fraunces'] font-semibold text-lg text-ink">
                  Shared Expenses Ledger
                </h3>
                <p className="text-xs text-muted">
                  All group expenses logged and split across travelers
                </p>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-route text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <Split size={15} /> + Add Expense
              </button>
            </div>

            {sharedExpenses.length === 0 ? (
              <div className="py-16 text-center bg-surface border border-border rounded-2xl p-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-route/10 text-route flex items-center justify-center text-2xl mb-4">
                  🧾
                </div>
                <h4 className="font-['Fraunces'] font-semibold text-lg text-ink mb-1">
                  No shared expenses yet
                </h4>
                <p className="text-xs text-muted max-w-sm mx-auto mb-6">
                  Add group meals, tickets, or transport to start splitting costs among companions.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-route text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-route/90 transition-colors shadow-sm"
                >
                  <Split size={15} /> Add First Shared Expense
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
                {sharedExpenses.map((exp) => (
                  <div key={exp.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg/30 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {exp.category === 'food' ? '🍽️' : exp.category === 'stay' ? '🏨' : exp.category === 'transport' ? '🚗' : exp.category === 'activities' ? '🎟️' : '📦'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-ink">{exp.title}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-route/10 text-route border border-route/20 capitalize font-medium">
                            {exp.category}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg text-muted border border-border font-medium">
                            {exp.split_method === 'equal' ? 'Split Equally' : 'Custom Split'}
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-1 font-['IBM_Plex_Mono']">
                          Paid by <span className="font-semibold text-ink">{exp.payer?.display_name || 'Member'}</span> on {exp.date}
                        </div>
                        {/* Member splits preview */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted">
                          {(exp.splits || []).map((s, sIdx) => {
                            const memberName = members.find((m) => m.user_id === s.user_id)?.user?.display_name || 'Member';
                            return (
                              <span key={sIdx} className="bg-bg border border-border px-2 py-0.5 rounded text-[11px] font-['IBM_Plex_Mono']">
                                {memberName}: ₹{s.amount}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="font-['Fraunces'] font-bold text-xl text-ink">
                        ₹{Number(exp.amount).toLocaleString()}
                      </div>
                      <button
                        onClick={() => deleteSharedExpense(exp.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GROUP MEMBERS & INVITATIONS (FR-21 & FR-22)             */}
        {/* ============================================================== */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Fraunces'] font-semibold text-lg text-ink">
                  Trip Travelers & Permissions
                </h3>
                <p className="text-xs text-muted">
                  Manage collaborators who can view the itinerary and participate in shared expenses
                </p>
              </div>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-route text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-route/90 transition-colors shadow-sm"
              >
                <UserPlus size={15} /> Invite Traveler
              </button>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
              {members.map((m) => {
                const isOwner = m.role === 'organizer';
                const isCurrentUser = m.user_id === user?.id;

                return (
                  <div key={m.id || m.user_id} className="p-5 flex items-center justify-between gap-4 hover:bg-bg/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-route/10 text-route font-bold flex items-center justify-center text-base border border-route/20 shrink-0">
                        {m.user?.display_name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink">
                            {m.user?.display_name || 'Traveler'}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                              YOU
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                              isOwner
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-bg text-muted border-border'
                            }`}
                          >
                            {m.role || 'member'}
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-0.5 font-['IBM_Plex_Mono']">
                          {m.user?.email || 'No email specified'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted font-['IBM_Plex_Mono'] hidden sm:inline">
                        Status: <span className="text-success font-semibold">Active</span>
                      </span>
                      {!isOwner && !isCurrentUser && (
                        <button
                          onClick={() => removeMember(m.id || m.user_id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:text-danger hover:border-danger/30 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Shared Expense Modal (FR-23) */}
      <AddSharedExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={addSharedExpense}
        members={members}
        currentUserId={user?.id}
      />

      {/* Invite Member Modal (FR-21) */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={inviteMember}
        availableUsers={availableUsers}
        currentMembers={members}
      />
    </div>
  );
}
