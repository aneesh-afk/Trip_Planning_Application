import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useItinerary } from '../hooks/useItinerary';
import { useTripExpenses } from '../hooks/useTripExpenses';
import { useBookings } from '../hooks/useBookings';

import BudgetHeader from '../components/budget/BudgetHeader';
import BudgetSummaryRow from '../components/budget/BudgetSummaryRow';
import BudgetOverviewTab from '../components/budget/BudgetOverviewTab';
import BudgetByDayTab from '../components/budget/BudgetByDayTab';
import BudgetByCategoryTab from '../components/budget/BudgetByCategoryTab';
import ActualExpensesTab from '../components/budget/ActualExpensesTab';
import BookingsTab from '../components/budget/BookingsTab';
import SetBudgetTargetModal from '../components/budget/SetBudgetTargetModal';
import LogExpenseModal from '../components/budget/LogExpenseModal';
import AddBookingModal from '../components/budget/AddBookingModal';

export default function BudgetView() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trip, tripStops, activities, loading, error, refetch, updateActivityDetails } = useItinerary(tripId);

  // Hook for actual expenses (Module 4.4, FR-14 to FR-16)
  const {
    expenses: actualExpenses,
    totalActualExpenses,
    addExpense,
    deleteExpense,
    isRealtimeConnected: isExpensesRealtime,
  } = useTripExpenses(tripId, trip?.budget);

  // Hook for bookings (Module 4.5, FR-17 to FR-20)
  const {
    bookings,
    totalBookingCost,
    addBooking,
    deleteBooking,
    isRealtimeConnected: isBookingsRealtime,
  } = useBookings(tripId, { start: trip?.start_date, end: trip?.end_date });

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Overview';
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);

  // Combine real activities + synthetic "stay" / "transport" expenses from trip_stops
  const expenses = useMemo(() => {
    const list = [];
    
    // Add real activities
    activities.forEach(act => {
      if (act.cost > 0) {
        list.push({ ...act, type: 'activity' });
      }
    });

    // Add implicit stay & transport costs from stops
    tripStops.forEach((stop, index) => {
      const start = new Date(stop.start_date);
      const end = new Date(stop.end_date);
      const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      
      const tripStart = new Date(trip?.start_date || stop.start_date);
      const dayOffset = Math.max(1, Math.round((start - tripStart) / (1000 * 60 * 60 * 24)) + 1);

      if (stop.stay_cost_per_night > 0) {
        list.push({
          id: `stay-${stop.id}`,
          type: 'stay',
          title: `Accommodation (${nights} nights @ ₹${stop.stay_cost_per_night})`,
          city_name: stop.city?.name,
          category: 'other',
          day: dayOffset,
          cost: stop.stay_cost_per_night * nights,
          isEstimated: true
        });
      }

      if (stop.transport_cost_to_here > 0 && index > 0) {
        list.push({
          id: `trans-${stop.id}`,
          type: 'transport',
          title: `Transport to ${stop.city?.name}`,
          city_name: stop.city?.name,
          category: 'transport',
          day: dayOffset,
          cost: stop.transport_cost_to_here,
          isEstimated: true
        });
      }
    });

    return list;
  }, [activities, tripStops, trip]);

  const totalCost = expenses.reduce((sum, exp) => sum + exp.cost, 0);
  
  // Trip length in days
  const tripLength = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return 0;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }, [trip]);

  const handleUpdateExpense = async (expense, newCost) => {
    if (expense.type === 'activity') {
      await updateActivityDetails(expense.id, { custom_cost_override: Number(newCost) });
    }
  };

  const handleSetBudget = async (newBudget) => {
    try {
      const { error: updErr } = await supabase.from('trips').update({ budget: newBudget }).eq('id', tripId);
      if (updErr) throw updErr;
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordExpense = async (data) => {
    await addExpense(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center font-['IBM_Plex_Mono'] text-muted">
        Calculating budget...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="bg-danger/10 text-danger border border-danger/20 p-[24px] rounded-[12px] max-w-[400px] text-center">
          <h2 className="font-['Fraunces'] font-semibold text-[18px] mb-[8px]">Error</h2>
          <p className="text-[14px]">{error || "Trip not found."}</p>
        </div>
      </div>
    );
  }

  // FR-19: Include recorded booking costs in overall actual expenses
  const combinedActualExpenses = totalActualExpenses + totalBookingCost;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <BudgetHeader trip={trip} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <BudgetSummaryRow 
        totalCost={totalCost} 
        actualExpensesTotal={combinedActualExpenses}
        tripLength={tripLength} 
        budgetTarget={trip.budget} 
        onSetBudget={() => setIsModalOpen(true)}
        onLogExpense={() => setIsLogExpenseOpen(true)}
      />

      <main className="flex-1 w-full p-[24px] overflow-y-auto">
        <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentTab === 'Overview' && <BudgetOverviewTab expenses={expenses} />}
          {currentTab === 'Actual Expenses' && (
            <ActualExpensesTab 
              expenses={actualExpenses} 
              onDeleteExpense={deleteExpense} 
              onOpenLogModal={() => setIsLogExpenseOpen(true)}
              tripBudget={trip.budget}
            />
          )}
          {currentTab === 'Bookings' && (
            <BookingsTab
              bookings={bookings}
              onDeleteBooking={deleteBooking}
              onOpenAddModal={() => setIsAddBookingOpen(true)}
              tripDates={{ start: trip.start_date, end: trip.end_date }}
              isRealtimeConnected={isBookingsRealtime}
            />
          )}
          {currentTab === 'By Day' && (
            <BudgetByDayTab 
              expenses={expenses} 
              onUpdateExpense={handleUpdateExpense} 
              isCompleted={(() => {
                if (!trip?.end_date) return false;
                const end = new Date(trip.end_date + 'T00:00:00');
                const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
                return end < today;
              })()} 
            />
          )}
          {currentTab === 'By Category' && (
            <BudgetByCategoryTab expenses={expenses} totalCost={totalCost} />
          )}
        </div>
      </main>

      {/* Modal to set budget target (FR-13) */}
      <SetBudgetTargetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentBudget={trip.budget} 
        onSave={handleSetBudget} 
      />

      {/* Modal to log actual expense (FR-14) */}
      <LogExpenseModal
        isOpen={isLogExpenseOpen}
        onClose={() => setIsLogExpenseOpen(false)}
        onSave={handleRecordExpense}
        tripDates={{ start: trip.start_date, end: trip.end_date }}
      />

      {/* Modal to add booking (FR-17) */}
      <AddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        onSave={addBooking}
        tripDates={{ start: trip.start_date, end: trip.end_date }}
      />
    </div>
  );
}
