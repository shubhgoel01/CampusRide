import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";

export const connectDB = async () => {
    console.log("Connecting to database...");
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {console.error("Database URL is not defined in environment variables");
        throw new ApiError(500,"Database URL is not defined in environment variables",{}, "connectDB : index.db.js");}

    const response = await mongoose.connect(dbUrl)

    console.log("Database connected successfully");
}

export default connectDB;
