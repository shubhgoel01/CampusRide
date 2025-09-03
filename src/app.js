import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

//Inbuilt Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

//Import routes
import { userRouter } from './routes/user.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { bookingRouter } from './routes/booking.routes.js';
import { cycleRouter } from './routes/cycle.routes.js';
import { penaltyRouter } from './routes/penalty.routes.js';
import { stripeRouter } from './routes/stripe.routes.js';
import { locationRouter } from './routes/location.routes.js';
import guardRouter from './routes/guard.routes.js';

app.use("/v1/auth", authRouter)
app.use("/v1/user", userRouter)
app.use("/v1/booking", bookingRouter)
app.use("/v1/cycle", cycleRouter)
app.use("/v1/user/penalty", penaltyRouter)
app.use("/v1/booking", stripeRouter)
app.use("/v1/location", locationRouter)
app.use("/v1/guard", guardRouter)

// app.use("*", (req, res) => {
//   res.status(404).json({ success: false, message: "Route not found" });
// });


//Import Custom Middlewares
import { globalErrorHandler } from './middlewares/error.middleware.js';
app.use(globalErrorHandler);

export default app