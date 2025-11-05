const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["general", "departmental", "individual", "system"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    attachment: {
      name: String,
      path: String,
    },
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model(
  "Notification",
  notificationSchema,
  "Notifications"
);
