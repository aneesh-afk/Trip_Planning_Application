import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useGroupTrip(tripId) {
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDbSynced, setIsDbSynced] = useState(true);

  const storageKey = `gt_group_trip_${tripId}`;

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { members: [], sharedExpenses: [] };
  }, [storageKey]);

  const saveToStorage = useCallback((data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save group data to localStorage:', e);
    }
  }, [storageKey]);

  const fetchGroupData = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Trip
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .select('*, users(id, display_name, email, avatar_url)')
        .eq('id', tripId)
        .single();

      if (tripErr) throw tripErr;
      setTrip(tripData);

      // 2. Fetch Available Registered Users (for inviting)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, display_name, avatar_url');
      setAvailableUsers(usersData || []);

      // 3. Fetch Trip Members
      let fetchedMembers = [];
      const { data: membersData, error: memErr } = await supabase
        .from('trip_members')
        .select('*, user:users(id, display_name, email, avatar_url)')
        .eq('trip_id', tripId);

      if (memErr) {
        setIsDbSynced(false);
        const local = loadFromStorage();
        // If empty local members, initialize with trip owner as organizer
        if (!local.members || local.members.length === 0) {
          const ownerMember = {
            id: `mem-owner-${tripData.user_id}`,
            trip_id: tripId,
            user_id: tripData.user_id,
            role: 'organizer',
            status: 'accepted',
            user: tripData.users || {
              id: tripData.user_id,
              display_name: 'Trip Organizer',
              email: 'organizer@example.com',
            },
          };
          fetchedMembers = [ownerMember];
        } else {
          fetchedMembers = local.members;
        }
      } else {
        setIsDbSynced(true);
        // Make sure trip owner is in members list
        const hasOwner = membersData.some((m) => m.user_id === tripData.user_id);
        if (!hasOwner && tripData.users) {
          const ownerMember = {
            id: `mem-owner-${tripData.user_id}`,
            trip_id: tripId,
            user_id: tripData.user_id,
            role: 'organizer',
            status: 'accepted',
            user: tripData.users,
          };
          fetchedMembers = [ownerMember, ...membersData];
        } else {
          fetchedMembers = membersData;
        }
      }
      setMembers(fetchedMembers);

      // 4. Fetch Shared Expenses
      let fetchedExpenses = [];
      const { data: expData, error: expErr } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          payer:users!payer_id(id, display_name, email, avatar_url),
          splits:shared_expense_splits(id, user_id, amount)
        `)
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (expErr) {
        setIsDbSynced(false);
        const local = loadFromStorage();
        fetchedExpenses = local.sharedExpenses || [];
      } else {
        fetchedExpenses = expData || [];
      }
      setSharedExpenses(fetchedExpenses);

      saveToStorage({ members: fetchedMembers, sharedExpenses: fetchedExpenses });
    } catch (err) {
      console.warn('Group data fetch error:', err);
      setError(err.message);
      const local = loadFromStorage();
      if (local.members?.length) setMembers(local.members);
      if (local.sharedExpenses?.length) setSharedExpenses(local.sharedExpenses);
    } finally {
      setLoading(false);
    }
  }, [tripId, loadFromStorage, saveToStorage]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    fetchGroupData();

    if (!tripId) return;

    // Supabase Realtime Subscription for Live Group Collaboration (FR-21 to FR-24)
    const channel = supabase
      .channel(`rt:group_trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchGroupData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_expenses',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchGroupData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_expense_splits',
        },
        () => {
          fetchGroupData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, fetchGroupData]);

  // Invite Member (FR-21)
  const inviteMember = async (targetUser, role = 'member') => {
    const existing = members.find((m) => m.user_id === targetUser.id);
    if (existing) {
      throw new Error('This user is already a member of this trip.');
    }

    const newMember = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      user_id: targetUser.id,
      role,
      status: 'accepted',
      user: {
        id: targetUser.id,
        display_name: targetUser.display_name || targetUser.email.split('@')[0],
        email: targetUser.email,
        avatar_url: targetUser.avatar_url || null,
      },
      joined_at: new Date().toISOString(),
    };

    const nextMembers = [...members, newMember];
    setMembers(nextMembers);
    saveToStorage({ members: nextMembers, sharedExpenses });

    try {
      await supabase.from('trip_members').insert([
        {
          id: newMember.id,
          trip_id: tripId,
          user_id: targetUser.id,
          role,
          status: 'accepted',
        },
      ]);
    } catch (err) {
      console.info('Saved member locally:', err);
    }
    return newMember;
  };

  // Remove Member
  const removeMember = async (memberId) => {
    const nextMembers = members.filter((m) => m.id !== memberId && m.user_id !== memberId);
    setMembers(nextMembers);
    saveToStorage({ members: nextMembers, sharedExpenses });

    try {
      await supabase.from('trip_members').delete().eq('id', memberId);
    } catch (err) {
      console.info('Removed member locally:', err);
    }
  };

  // Add Shared Expense (FR-23)
  const addSharedExpense = async ({
    title,
    amount,
    payer_id,
    category = 'food',
    date,
    split_method = 'equal',
    customSplits = {}, // { userId: amount }
  }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Please enter a valid amount.');
    }
    if (!payer_id) {
      throw new Error('Please select who paid for this expense.');
    }

    // Compute split shares
    let splits = [];
    if (split_method === 'equal') {
      const activeMembers = members.length > 0 ? members : [{ user_id: payer_id }];
      const sharePerPerson = Math.round((numAmount / activeMembers.length) * 100) / 100;
      splits = activeMembers.map((m, idx) => {
        // Adjust any rounding cent difference on the first member
        const isLast = idx === activeMembers.length - 1;
        const adjustedShare = isLast
          ? numAmount - sharePerPerson * (activeMembers.length - 1)
          : sharePerPerson;
        return {
          id: crypto.randomUUID(),
          user_id: m.user_id,
          amount: Math.round(adjustedShare * 100) / 100,
        };
      });
    } else {
      // Custom split validation
      let totalCustom = 0;
      splits = Object.entries(customSplits).map(([uId, share]) => {
        const nShare = Number(share) || 0;
        totalCustom += nShare;
        return {
          id: crypto.randomUUID(),
          user_id: uId,
          amount: nShare,
        };
      });

      if (Math.abs(totalCustom - numAmount) > 0.05) {
        throw new Error(
          `Custom split total (₹${totalCustom}) does not equal the expense total (₹${numAmount}).`
        );
      }
    }

    const payer = members.find((m) => m.user_id === payer_id)?.user || {
      id: payer_id,
      display_name: 'Payer',
      email: '',
    };

    const newExpense = {
      id: crypto.randomUUID(),
      trip_id: tripId,
      payer_id,
      payer,
      title: title.trim(),
      amount: numAmount,
      category,
      split_method,
      date: date || new Date().toISOString().split('T')[0],
      splits,
      created_at: new Date().toISOString(),
    };

    const nextExpenses = [newExpense, ...sharedExpenses];
    setSharedExpenses(nextExpenses);
    saveToStorage({ members, sharedExpenses: nextExpenses });

    try {
      const { data: dbExp, error: expErr } = await supabase
        .from('shared_expenses')
        .insert([
          {
            id: newExpense.id,
            trip_id: tripId,
            payer_id,
            title: newExpense.title,
            amount: numAmount,
            category,
            split_method,
            date: newExpense.date,
          },
        ])
        .select()
        .single();

      if (!expErr && dbExp) {
        const splitsToInsert = splits.map((s) => ({
          id: s.id,
          expense_id: dbExp.id,
          user_id: s.user_id,
          amount: s.amount,
        }));
        await supabase.from('shared_expense_splits').insert(splitsToInsert);
      }
    } catch (err) {
      console.info('Saved shared expense locally:', err);
    }

    return newExpense;
  };

  // Delete Shared Expense
  const deleteSharedExpense = async (expenseId) => {
    const nextExpenses = sharedExpenses.filter((e) => e.id !== expenseId);
    setSharedExpenses(nextExpenses);
    saveToStorage({ members, sharedExpenses: nextExpenses });

    try {
      await supabase.from('shared_expenses').delete().eq('id', expenseId);
    } catch (err) {
      console.info('Deleted expense locally:', err);
    }
  };

  // FR-24: Balance Calculations & Debt Simplification
  const balanceSummary = useMemo(() => {
    const balances = {}; // { [userId]: { user, totalPaid, totalShare, netBalance } }

    members.forEach((m) => {
      balances[m.user_id] = {
        user: m.user,
        role: m.role,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      };
    });

    sharedExpenses.forEach((exp) => {
      const payerId = exp.payer_id;
      if (!balances[payerId]) {
        balances[payerId] = {
          user: exp.payer || { id: payerId, display_name: 'Member', email: '' },
          role: 'member',
          totalPaid: 0,
          totalShare: 0,
          netBalance: 0,
        };
      }
      balances[payerId].totalPaid += Number(exp.amount) || 0;

      // Add each split
      (exp.splits || []).forEach((split) => {
        const uId = split.user_id;
        if (!balances[uId]) {
          balances[uId] = {
            user: { id: uId, display_name: 'Member', email: '' },
            role: 'member',
            totalPaid: 0,
            totalShare: 0,
            netBalance: 0,
          };
        }
        balances[uId].totalShare += Number(split.amount) || 0;
      });
    });

    // Compute net balance: Positive = gets back, Negative = owes
    Object.values(balances).forEach((b) => {
      b.netBalance = Math.round((b.totalPaid - b.totalShare) * 100) / 100;
    });

    // Simplified Debt Settlement (Who Owes Whom)
    // Greedy algorithm: match largest debtor with largest creditor
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([uId, b]) => {
      if (b.netBalance < -0.01) {
        debtors.push({ userId: uId, user: b.user, amount: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.01) {
        creditors.push({ userId: uId, user: b.user, amount: b.netBalance });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.user,
          fromId: debtor.userId,
          to: creditor.user,
          toId: creditor.userId,
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    const totalGroupSpend = sharedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      memberBalances: Object.values(balances),
      settlements,
      totalGroupSpend,
    };
  }, [members, sharedExpenses]);

  return {
    trip,
    members,
    sharedExpenses,
    availableUsers,
    loading,
    error,
    isDbSynced,
    isRealtimeConnected,
    balanceSummary,
    inviteMember,
    removeMember,
    addSharedExpense,
    deleteSharedExpense,
    refetch: fetchGroupData,
  };
}
