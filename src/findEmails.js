"use strict";

const canBeInEmail = (character) =>
	character.toLowerCase().match(/[a-z]/i) || character === "@" || character === "."

module.exports = (html, website) => {
	const urlSections = website.split(".").reverse().filter((x, i) => i < 2).reverse().map((x) => x.replace("/", ""))
	const tld = urlSections[1];
	const simplifiedWebsite = urlSections[0] + "." + tld;

	const groups = html.split(" ");
	const groupsWithEmail = groups
		.filter((group) => group.indexOf("@" + simplifiedWebsite) !== -1)
		.map((groupWithEmail) => groupWithEmail
			.slice(0, groupWithEmail.indexOf(tld) + tld.length)
			.split("")
			.filter((character) => canBeInEmail(character))
			.reduce((prev, curr) => prev + curr, "")
		)
		.map((email) => email.replace("hrefmailto", ""))
	return groupsWithEmail;
}
