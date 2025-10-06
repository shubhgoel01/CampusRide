import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";

function PaymentForm({ bookingId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
  setProcessing(true);
  // debug: ensure bookingId and amount are passed
  console.log('[Stripe] create payment intent', { bookingId, amount });
  const { data } = await api.post(`/stripe/${bookingId}/transaction`, { amount: Number(amount) });
  const { clientSecret, paymentIntentId } = data;

      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) throw result.error;

      if (result.paymentIntent?.status === "succeeded") {
        await api.post(`/stripe/${bookingId}/transaction/verify`, { paymentIntentId, bookingId });
        onSuccess?.(result.paymentIntent);
      } else {
        throw new Error("Payment not successful");
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.response?.data || null
      const display = serverMsg || err.message || "Payment failed"
      console.error('[Stripe] payment error', { err, serverMsg })
      setError(display);
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="border p-2 rounded">
        <CardElement />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <button
        disabled={!stripe || processing}
        className={`px-3 py-1 rounded ${(!stripe || processing) ? "bg-gray-400" : "bg-green-600 text-white"}`}
      >
        {processing ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </form>
  );
}

export default function StripePaymentWrapper(props) {
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeError, setStripeError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        let pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!pk) {
          const res = await api.get('/stripe/config');
          pk = res?.data?.publishableKey || null;
        }
        if (!pk) throw new Error('Stripe publishable key not found');
        setStripePromise(await loadStripe(pk));
      } catch (err) {
        setStripeError(err.message || 'Failed to initialize Stripe');
      }
    };
    init();
  }, []);

  if (stripeError) return <div className="text-red-600">{stripeError}</div>;
  if (!stripePromise) return <div>Loading payment...</div>;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
