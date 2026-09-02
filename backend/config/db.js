import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing in backend/.env"
      );
    }

    const connection =
      await mongoose.connect(
        process.env.MONGO_URI
      );

    console.log(
      `✅ MongoDB connected: ${connection.connection.name}`
    );

    console.log(
      `📦 MongoDB host: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:"
    );

    console.error(error.message);

    process.exit(1);
  }
}

export default connectDB;