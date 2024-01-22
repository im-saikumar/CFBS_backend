import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  parent_post_id: { type: String, required: true },
  parent_post_email: { type: String, required: true, lowercase: true },
  createdAt: { type: Date, default: () => Date.now() },
  read_status: { type: Boolean, required: true },
});

export const Notifications = mongoose.model("Notification", notificationSchema);