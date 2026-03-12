import React, { useMemo } from "react";
import Modal from "../components/Modal";
import BookingModal from "../components/BookingModal";
import StripePaymentWrapper from "../components/StripePayment";
import MapWidget from "../components/MapWidget";
import { formatLocation } from "../utils/locationCache";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import HomeWelcomeStats from "../components/home/HomeWelcomeStats";
import HomeBookingForm from "../components/home/HomeBookingForm";
import RideSummaryCard from "../components/home/RideSummaryCard";
import ReturnedBookingCard from "../components/home/ReturnedBookingCard";

export default function Home() {
  const {
    user,
    activeBookings,
    returnedBookings,
    loading,
    showPaymentBookingId,
    paymentAmount,
    locationsList,
    startLoc,
    endLoc,
    isSearching,
    isCreating,
    foundCycle,
    error,
    showActiveModal,
    selectedActiveBooking,
    showReturnedModal,
    selectedReturnedBooking,
    elapsedMs,
    setStartLoc,
    setEndLoc,
    setShowPaymentBookingId,
    setPaymentAmount,
    handlePayPenalty,
    handleEndBookingById,
    openActiveBooking,
    openReturnedBooking,
    closeActiveBooking,
    closeReturnedBooking,
    handleFindCycle,
    handleCreateBooking,
    loadUserAndBookings,
  } = useHomeDashboard();

  const activeBooking = activeBookings?.[0] || null;
  const returnedBooking = returnedBookings?.[0] || null;
  const hasBlockingBooking = Boolean(activeBooking || returnedBooking);

  const activeCycleLabel = useMemo(
    () => activeBooking?.cycle?.cycleName || "-",
    [activeBooking],
  );
  const returnedCycleLabel = useMemo(
    () => returnedBooking?.cycle?.cycleName || "-",
    [returnedBooking],
  );

  const startLocationLabel = useMemo(
    () =>
      activeBooking?.startLocationName ||
      formatLocation(activeBooking?.startLocation || activeBooking?.location),
    [activeBooking],
  );

  const endLocationLabel = useMemo(
    () =>
      returnedBooking?.endLocationName ||
      formatLocation(returnedBooking?.endLocation || returnedBooking?.location),
    [returnedBooking],
  );

  if (loading) {
    return (
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse bg-slate-100"></div>
        <div className="space-y-6">
          <div className="h-64 rounded-xl shadow-sm border border-slate-200 animate-pulse bg-slate-100"></div>
          <div className="h-32 rounded-xl shadow-sm border border-slate-200 animate-pulse bg-slate-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
      <div className="lg:col-span-2 flex flex-col gap-4 h-full">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <MapWidget locations={locationsList} />
        </div>
      </div>

      <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4">
        <HomeWelcomeStats
          user={user}
          activeCount={activeBookings.length}
          returnedCount={returnedBookings.length}
          onPayPenalty={handlePayPenalty}
        />

        <RideSummaryCard
          booking={activeBooking}
          cycleLabel={activeCycleLabel}
          elapsedMs={elapsedMs}
          startLocationLabel={startLocationLabel}
          onEnd={handleEndBookingById}
          onView={openActiveBooking}
        />

        {!activeBooking && returnedBooking && (
          <ReturnedBookingCard
            booking={returnedBooking}
            cycleLabel={returnedCycleLabel}
            endLocationLabel={endLocationLabel}
            onView={openReturnedBooking}
          />
        )}

        <HomeBookingForm
          disabled={hasBlockingBooking}
          locations={locationsList}
          startLoc={startLoc}
          endLoc={endLoc}
          isSearching={isSearching}
          isCreating={isCreating}
          error={error}
          foundCycle={foundCycle}
          onStartChange={setStartLoc}
          onEndChange={setEndLoc}
          onAction={foundCycle ? handleCreateBooking : handleFindCycle}
        />
      </div>

      {showPaymentBookingId && (
        <Modal
          open={true}
          onClose={() => {
            setShowPaymentBookingId(null);
            setPaymentAmount(0);
          }}
          title="Pay Penalty"
        >
          <StripePaymentWrapper
            bookingId={showPaymentBookingId}
            amount={paymentAmount}
            onSuccess={async () => {
              alert("Payment successful! Penalty cleared.");
              await loadUserAndBookings();
              setShowPaymentBookingId(null);
              setPaymentAmount(0);
            }}
            onError={(err) => {
              alert(err?.message || "Payment failed");
            }}
          />
        </Modal>
      )}

      {selectedActiveBooking && (
        <BookingModal
          open={showActiveModal}
          booking={selectedActiveBooking}
          onClose={closeActiveBooking}
          locations={locationsList}
        />
      )}

      {selectedReturnedBooking && (
        <BookingModal
          open={showReturnedModal}
          booking={selectedReturnedBooking}
          onClose={closeReturnedBooking}
          locations={locationsList}
        />
      )}
    </div>
  );
}
