"use strict";

const request = require("request");
const logarithmic = require("logarithmic");
const findEmails = require("./findEmails");

module.exports = class Business {
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

	get formEmail() {
		return `
		Hello ${this.name},

		I am an organizer of hackMHS II, a hackathon at Millburn High School in
		New Jersey. At our hackathon, our mission is to build an inclusive
		community in which students can learn new skills, grow as developers,
		and collaborate to create innovative technology.

		On May 21st, over 200 high school students from many districts will
		attend hackMHS II and code for 24 hours. They will be provided free meals,
		phenomenal tech workshops, knowledgeable mentors, and the opportunity to
		talk to sponsoring companies. In order to make this a memorable and
		outstanding hackathon, you can aid us by sponsoring our event through
		monetary contributions or company products and services. In return, we
		have several sponsor benefits. I would be more than happy to send you
		information or schedule a call to discuss our sponsorship tiers and benefits.

		Best,
		Abhinav Madahar
		`
	}

	findEmail(next) {
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
