const mongoose = require("mongoose");

module.exports = mongoose.model("Email Address", new mongoose.Schema({
	address: String,
	sent: Boolean
}))
