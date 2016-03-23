"use strict";

const request = require("request");
const mongoose = require("mongoose");
const logarithmic = require("logarithmic");
const findEmails = require("./findEmails.js");
const Business = require("./Business.js");
const sendEmail = require("./sendEmail.js");
const Email = require("../models/Email.js");

const latitude = process.env.LATITUDE;
const longitude = process.env.LONGITUDE;
const queries = process.argv.slice(2);

logarithmic.alert(`Looking for ${queries} in ${latitude}, ${longitude}`);

mongoose.connect("mongodb://localhost/");

mongoose.connection.on("error", () => {
	logarithmic.error("Cannot connect to email database. Canceling out");
	process.exit(1);
})

mongoose.connection.on("open", () => {
	Email.find({}, (err, emails) => {
		if (err) {
			logarithmic.error(err);
			process.exit(1);
		}

		if (emails.length > 0) {
			logarithmic.alert("Emails already found:");
			for (let email of emails)
				logarithmic.alert(email.address);
		}
	});

	for (let query of queries) {
		request(`https://api.foursquare.com/v2/venues/search?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&v=20130815&ll=${latitude},${longitude}&query=${query}`, (error, code, response) => {
			if (error) {
				logarithmic.error(error);
				return;
			}

			const venues = JSON.parse(response).response.venues;

			logarithmic.alert("Found the following venues:");
			for (let venue of venues) {
				if (venue.url && venue.name) {
					logarithmic.alert("Checking", venue.name, "at", venue.url);
					(new Business(venue.name, venue.url)).findEmail((email) => {
						Email.findOne({address: email}, (error, found) => {
							if (error) {
								logarithmic.warning(error);
								return;
							}

							if (found)
								logarithmic.alert("Already added " + email);
							else {
								logarithmic.alert("Adding " + email);
								Email.create({
									address: email,
									sent: false
								}, (createError, made) => {
									if (createError) {
										logarithmic.warning(createError);
									} else {
										logarithmic.ok("Saved " + email)
									}
								})
							}

						})
					});
				}
			}
		})
	}
})
