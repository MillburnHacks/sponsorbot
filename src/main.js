"use strict";

const request = require("request");
const logarithmic = require("logarithmic");
const findEmails = require("./findEmails.js");

class Business {
	constructor(name, website) {
		this.name = name;
		this.website = website;
		this.tld = this.website.split(".")[this.website.split(".").length - 1];
	}

	processURL(url) {
		const isValidURL = (url) =>
			/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)

		if (isValidURL(url)) {
			return url;
		}

		let website;

		if (this.website.charAt(this.website.length - 1) === "/" && url.charAt(0) === "/") {
			website =this.website.slice(0, this.website.length - 1) + url;
		} else if (this.website.charAt(this.website.length - 1) === "/" ^ url.charAt(0) === "/") {
			website = this.website + url;
		} else {
			website = this.website + "/" + url;
		}

		if (website.slice(0, "http".length) !== "http") {
			website = "http://" + website;
		}

		return website;
	}

	email(next) {
		request(this.website, (err, code, homepage) => {
			if (err) {
				logarithmic.warning(err);
				return;
			}
			try {
				findEmails(homepage, this.website).forEach((email) => next(email))

				homepage
					.match(/<a(.*?)<\/a>/gi)
					// .filter((p) => p.indexOf(/<a(.*?)><\/p>/gi) !== -1)
					.filter((a) => a.indexOf("contact") !== -1 || a.indexOf("mailto") !== -1)
					.map((a) => a.match(/href="(.*?)"/gi))
					.reduce((prev, curr) => prev.concat(curr), [])
					.map((href) => href.slice("href=\"".length, href.length - 1))
					.map((link) => this.processURL(link))
					.filter((link, i, links) => links.indexOf(link) === i)
					.forEach((link) => request(link, (err, code, contactPage) => {
						try {
							findEmails(contactPage, this.website).forEach((email) => next(email))
						} catch (error) {
							logarithmic.warning(error);
						}
					}))
			} catch (error) {
				logarithmic.warning("Skipping " + this.name);
				logarithmic.warning(error);
			}
		})
	}
}


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
				(new Business(venue.name, venue.url)).email((email) => {
					logarithmic.ok("Found email: " + email);
				})
			}
		}
	})
}
