import mongoose from "mongoose";

const states = new mongoose.Schema();

export const State = mongoose.model("state", states);
