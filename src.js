"use strict";

const request = require("request");


class Business {
	constructor(name, website) {
		this.name = name;
		this.website = website;
	}

	processURL(url) {
		const isValidURL = (url) =>
			/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)

		if (isValidURL(url)) {
			return url;
		}

		return this.website + (url.charAt(0) === "/" ? url.slice(1) : url);
	}

	email(next) {
		request(this.website, (err, code, response) => {
			if (err) {
				// console.log(err);
				return;
			}

			try {
				response
					.match(/<a(.*?)<\/a>/gi)
					// .filter((p) => p.indexOf(/<a(.*?)><\/p>/gi) !== -1)
					.filter((a) => a.indexOf("contact") !== -1)
					.map((a) => a.match(/href="(.*?)"/gi))
					.reduce((prev, curr) => prev.concat(curr), [])
					.map((href) => href.slice("href=\"".length, href.length - 1))
					.map((link) => this.processURL(link))
					.filter((link, i, links) => links.indexOf(link) === i)
					.forEach((link) => request(link, (err, code, response) => {
						try {
							response.match(/mailto:(.*?)"/gi)
								.map((a) => a.slice("mailto:".length, a.length - 1))
								.forEach((email) => next(email))
						} catch (error) {
							// console.log(error);
						}
					}))
			} catch (error) {
				// console.log("Skipping", this.name);
				// console.log(error);
			}
		})
	}
}

const latitude = 40.7;
const longitude = -74;
const queries = [
	"ai",
	"restaurant",
	"business"
];
for (let query of queries)
request(`
	https://api.foursquare.com/v2/venues/search?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&v=20130815&ll=${latitude},${longitude}&query=${query}`, (error, code, response) => {
	if (error) {
		console.error(error);
		return;
	}

	const venues = JSON.parse(response).response.venues;

	for (let venue of venues) {
		if (venue.url && venue.name)
			(new Business(venue.name, venue.url)).email(console.log)
	}
})
