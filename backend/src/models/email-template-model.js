const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var emailTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["ResetPassword", "Register"],
  },
  to: {
    type: String,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  cc: {
    type: Array,
    default: [],
  },
  bcc: {
    type: Array,
    default: [],
  },
});

//Export the model
module.exports = mongoose.model(
  "EmailTemplate",
  emailTemplateSchema,
  "EmailTemplates"
);
