import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { createPaymentIntent, createTransaction } from "../controllers/stripe.controller.js"

const stripeRouter = express.Router()

stripeRouter.route("/:bookingId/transaction").post(verifyUser, createPaymentIntent)
stripeRouter.route("/:bookingId/transaction/verify").post(verifyUser, createTransaction)

export {stripeRouter}