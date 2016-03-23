const fs = require("fs");

const findEmails = require("../src/findEmails.js");

findEmails(fs.readFileSync("./sample/pageWithEmail.html", "utf-8"), "www.lalascookies.com/");
