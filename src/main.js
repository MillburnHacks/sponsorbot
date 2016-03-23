"use strict";

const request = require("request");
const logarithmic = require("logarithmic");
const findEmails = require("./findEmails.js");
const Business = require("./Business.js");

const latitude = process.env.LATITUDE;
const longitude = process.env.LONGITUDE;
const queries = process.argv.slice(2);

logarithmic.alert(`Looking for ${queries} in ${latitude}, ${longitude}`);

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
				(new Business(venue.name, venue.url)).sendEmail();
			}
		}
	})
}
