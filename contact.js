import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: Number, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: () => Date.now() },
});

export const ContactUs = mongoose.model("ContactUs", ContactSchema);