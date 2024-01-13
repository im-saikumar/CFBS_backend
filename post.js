import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sub_heading: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: () => Date.now() },
  visiblity: { type: Boolean, default: true, required: true },
  comment: { type: Array },
  saved: { type: Array },
  liked: { type: Array },
  ip_address: {type: Array},
  post_views: {type: Number, default: 0},
  image: {type: String, required: true}
});

export const Post = mongoose.model("Post", postSchema);
