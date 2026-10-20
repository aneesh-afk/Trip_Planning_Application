import React, { useState } from 'react';

// Sub-component for User Row to handle local states (dropdown, etc)
function UserRow({ user, selected, onSelect, onAction }) {
  const [showMenu, setShowMenu] = useState(false);
  const isSuspended = user.simulated_status === 'suspended';

  return (
    <tr className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${selected ? 'bg-horizon/5' : ''}`}>
      <td className="p-[16px]">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={(e) => onSelect(user.id, e.target.checked)}
          className="rounded-[4px] border-border text-route focus:ring-route"
        />
      </td>
      <td className="p-[16px]">
        <div className="flex items-center gap-[12px]">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-[32px] h-[32px] rounded-full object-cover" />
          ) : (
            <div className="w-[32px] h-[32px] rounded-full bg-muted/20 flex items-center justify-center text-[12px] font-bold text-muted">
              {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[14px] font-medium text-ink">{user.display_name || 'No Name'}</span>
        </div>
      </td>
      <td className="p-[16px] text-[14px] text-muted">{user.email}</td>
      <td className="p-[16px] text-[14px] text-muted font-['IBM_Plex_Mono']">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="p-[16px]">
        {isSuspended ? (
          <span className="px-[8px] py-[2px] rounded-full bg-danger/10 text-danger text-[11px] font-bold tracking-wide uppercase">
            Suspended
          </span>
        ) : (
          <span className="px-[8px] py-[2px] rounded-full bg-success/10 text-success text-[11px] font-bold tracking-wide uppercase">
            Active
          </span>
        )}
      </td>
      <td className="p-[16px] text-right relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="text-muted hover:text-horizon p-[4px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
            <div className="absolute right-[16px] top-[40px] w-[180px] bg-surface border border-border rounded-[8px] shadow-card py-[8px] z-20 text-left">
              <button onClick={() => { setShowMenu(false); onAction('view_trips', user); }} className="w-full text-left px-[16px] py-[8px] text-[13px] text-ink hover:bg-bg transition-colors">
                View Trip History
              </button>
              <button onClick={() => { setShowMenu(false); onAction('toggle_suspend', user); }} className="w-full text-left px-[16px] py-[8px] text-[13px] text-ink hover:bg-bg transition-colors">
                {isSuspended ? 'Reactivate Account' : 'Suspend Account'}
              </button>
              <div className="h-[1px] bg-border my-[4px]"></div>
              <button onClick={() => { setShowMenu(false); onAction('delete', user); }} className="w-full text-left px-[16px] py-[8px] text-[13px] text-danger hover:bg-danger/10 transition-colors">
                Delete User
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}


export default function ManageUsersTab({ data, globalSearch }) {
  const { rawUsers = [], rawTrips = [] } = data;
  
  // Local state to simulate DB mutations for Suspend/Delete
  const [usersState, setUsersState] = useState(rawUsers.map(u => ({ ...u, simulated_status: 'active' })));
  
  // Selections & Pagination
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [historyModal, setHistoryModal] = useState({ open: false, user: null, trips: [] });

  // Filter users (excluding deleted ones)
  const filteredUsers = usersState.filter(u => {
    if (u.simulated_status === 'deleted') return false;
    
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    const nameMatch = u.display_name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedUsers.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleRowAction = (action, user) => {
    if (action === 'view_trips') {
      const userTrips = rawTrips.filter(t => t.user_id === user.id);
      setHistoryModal({ open: true, user, trips: userTrips });
    } else if (action === 'toggle_suspend') {
      setUsersState(prev => prev.map(u => {
        if (u.id === user.id) {
          return { ...u, simulated_status: u.simulated_status === 'suspended' ? 'active' : 'suspended' };
        }
        return u;
      }));
    } else if (action === 'delete') {
      setDeleteModal({ open: true, user });
    }
  };

  const confirmDelete = () => {
    setUsersState(prev => prev.map(u => u.id === deleteModal.user.id ? { ...u, simulated_status: 'deleted' } : u));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(deleteModal.user.id);
      return next;
    });
    setDeleteModal({ open: false, user: null });
  };

  const handleBulkSuspend = () => {
    setUsersState(prev => prev.map(u => {
      if (selectedIds.has(u.id)) {
        return { ...u, simulated_status: 'suspended' };
      }
      return u;
    }));
    setSelectedIds(new Set()); // clear selection
  };

  const exportCSV = (usersToExport) => {
    if (usersToExport.length === 0) return;
    const headers = ['ID', 'Email', 'Display Name', 'Joined At', 'Status'];
    const rows = usersToExport.map(u => [
      u.id, 
      u.email, 
      u.display_name || 'N/A', 
      new Date(u.created_at).toISOString(),
      u.simulated_status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-[12px] shadow-sm flex flex-col">
        {/* Tab Header & Actions */}
        <div className="p-[20px] border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
          <div>
            <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Manage Users</h3>
            <p className="text-[13px] text-muted">{filteredUsers.length} total active/suspended users</p>
          </div>
          
          <div className="flex items-center gap-[12px]">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-[8px] mr-[8px] animate-in fade-in">
                <span className="text-[13px] font-medium text-route">{selectedIds.size} selected</span>
                <button 
                  onClick={handleBulkSuspend}
                  className="px-[12px] py-[6px] bg-surface border border-border rounded-[6px] text-[13px] font-medium text-ink hover:text-danger hover:border-danger transition-colors"
                >
                  Suspend
                </button>
                <button 
                  onClick={() => exportCSV(filteredUsers.filter(u => selectedIds.has(u.id)))}
                  className="px-[12px] py-[6px] bg-surface border border-border rounded-[6px] text-[13px] font-medium text-ink hover:border-horizon transition-colors"
                >
                  Export
                </button>
              </div>
            )}
            <button 
              onClick={() => exportCSV(filteredUsers)}
              disabled={filteredUsers.length === 0}
              className="flex items-center gap-[6px] px-[12px] py-[8px] bg-bg border border-border rounded-[6px] text-[13px] font-medium text-ink hover:border-horizon transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export All CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                <th className="p-[16px] w-[40px]">
                  <input 
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                    onChange={toggleSelectAll}
                    className="rounded-[4px] border-border text-route focus:ring-route"
                  />
                </th>
                <th className="p-[16px]">User</th>
                <th className="p-[16px]">Email</th>
                <th className="p-[16px]">Join Date</th>
                <th className="p-[16px]">Status</th>
                <th className="p-[16px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-[32px] text-center text-[14px] text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    selected={selectedIds.has(user.id)}
                    onSelect={toggleSelectOne}
                    onAction={handleRowAction}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-[16px] border-t border-border flex items-center justify-between bg-bg rounded-b-[12px]">
            <span className="text-[13px] text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-[8px]">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-[12px] py-[6px] border border-border rounded-[6px] text-[13px] bg-surface hover:bg-bg disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-[12px] py-[6px] border border-border rounded-[6px] text-[13px] bg-surface hover:bg-bg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-[400px] rounded-[16px] shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="p-[24px]">
              <div className="w-[48px] h-[48px] rounded-full bg-danger/10 flex items-center justify-center mb-[16px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[24px] h-[24px] text-danger"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </div>
              <h2 className="font-['Fraunces'] text-[24px] font-semibold text-ink mb-[8px]">Delete User</h2>
              <p className="text-[14px] text-muted mb-[24px]">
                Are you sure you want to delete <strong>{deleteModal.user.email}</strong>? This action cannot be undone and will remove all their associated trips.
              </p>
              <div className="flex gap-[12px]">
                <button 
                  onClick={() => setDeleteModal({ open: false, user: null })}
                  className="flex-1 py-[10px] rounded-[8px] bg-bg border border-border text-[14px] font-medium text-ink hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-[10px] rounded-[8px] bg-danger text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip History Modal */}
      {historyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[24px] bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-[600px] rounded-[16px] shadow-xl overflow-hidden border border-border flex flex-col max-h-[80vh]">
            <div className="p-[20px] border-b border-border flex items-center justify-between bg-bg">
              <h2 className="font-['Fraunces'] text-[20px] font-semibold text-ink">
                Trip History: {historyModal.user.display_name || historyModal.user.email}
              </h2>
              <button onClick={() => setHistoryModal({ open: false, user: null, trips: [] })} className="text-muted hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[20px] h-[20px]"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-[20px] overflow-y-auto">
              {historyModal.trips.length === 0 ? (
                <div className="text-center text-muted py-[40px] text-[14px]">This user has not created any trips.</div>
              ) : (
                <div className="flex flex-col gap-[16px]">
                  {historyModal.trips.map(trip => (
                    <div key={trip.id} className="border border-border rounded-[8px] p-[16px] flex items-center justify-between">
                      <div>
                        <h4 className="font-['Fraunces'] text-[16px] font-semibold text-ink">{trip.name}</h4>
                        <div className="flex items-center gap-[12px] mt-[4px] text-[12px] font-['IBM_Plex_Mono'] text-muted">
                          <span>{new Date(trip.start_date || trip.created_at).toLocaleDateString()}</span>
                          {trip.is_public && <span className="text-route font-semibold">PUBLIC</span>}
                        </div>
                      </div>
                      <span className="text-[13px] font-medium text-horizon bg-horizon/10 px-[8px] py-[4px] rounded-[4px]">
                        {trip.trip_stops?.length || 0} stops
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
