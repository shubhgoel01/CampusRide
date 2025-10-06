import express from "express";
import verifyUser from "../middlewares/auth.middleware.js";
import { getTransactionsByUserOrBooking, getTransactionById } from "../controllers/transaction.controller.js";

const router = express.Router();

router.use(verifyUser);

// GET /v1/transaction/?userId=... or /v1/transaction/?bookingId=...
router.get("/", getTransactionsByUserOrBooking);

// GET /v1/transaction/:id
router.get("/:id", getTransactionById);

export default router;
