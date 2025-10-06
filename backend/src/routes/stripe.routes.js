import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { createPaymentIntent, createTransaction, getStripeConfig } from "../controllers/stripe.controller.js"

const stripeRouter = express.Router()

stripeRouter.route("/:bookingId/transaction").post(verifyUser, createPaymentIntent)
stripeRouter.route("/:bookingId/transaction/verify").post(verifyUser, createTransaction)
// public config endpoint so frontend can obtain publishable key when env isn't available to Vite
stripeRouter.route('/config').get(getStripeConfig)

export {stripeRouter}