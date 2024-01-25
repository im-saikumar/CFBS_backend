import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sub_heading: { type: String },
  state: { type: String, required: true },
  district: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: () => Date.now() },
  visiblity: { type: Boolean, default: true, required: true },
  status: {type: String, default: "pending"},
  comment: { type: Array },
  saved: { type: Array },
  liked: { type: Array },
  ip_address: {type: Array},
  post_views: {type: Number, default: 0},
  imagepath: {type: String, required: true},
  requests: {type: Array, required: true},
  report: {type: Array}
});

export const Post = mongoose.model("Post", postSchema);
