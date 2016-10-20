// this file takes a business and finds its email
// it then passes the business' name and email to the callback parameter

const request = require("request");
const assert = require("assert");
const validation = require("./validation");

const combineURLURI = (url, uri) => uri[0] === "/" ? url + uri : combineURLURI(url, "/" + uri);
const uniq = (elem, i, arr) => arr.indexOf(elem) === i;

// yes, I found this on Stack overflow

const contactPageURIs = (page) => {
  try {
    // we have to find the links, and then filter so that we have only the contact page links

    const links = page.match(/<a(.*?)<\/a>/gi);
    const contactPageATags = links.filter((a) => a.includes("contact") || a.includes("mailto"));
    const contactPageHrefs = contactPageATags.map((a) => a.match(/href="(.*?)"/gi));
    const contactPageFlatHrefs = contactPageHrefs.reduce((prev, curr) => prev.concat(curr), []);
    const contactPageURIs = contactPageFlatHrefs.map((href) => href.slice("href=\"".length, -1));
    return contactPageURIs.filter(uniq);
  } catch (exception) {
    return [];
  }
}

const findEmailsInContactPage = (url, page) => {
  // find all the lines that have an "@DOMAIN_NAME" and then find the emails from those lines
  // this method is somewhat reliable
  // this code is horrible, though. I'm sorry

  const domain = url.replace("http://", "").replace("https://", "").replace("www.", "");

  const lines = page.split(/\n/gi);
  const linesWithAtSymbol = lines.filter(line => line.includes("@"))
  const linesThatMightHaveEmail = linesWithAtSymbol.filter(line => line.includes(domain));
  const emails = [];

  // go through every line in linesThatMightHaveEmail and try to find an email & push it to emails
  linesThatMightHaveEmail.map(line => {
    // we assume that the emails for a business take the form SOMETHING@domain where
    // domain is the domain name of the website

    // first, find all occurances of SOMETHING@domain
    const emailEndings = line.match(RegExp(`(.*?)@${domain}`, "gi"));

    // for every occurance of SOMETHING@domain, try to isolate the important SOMETHING from the junk
    emailEndings.forEach(ending => {
      // start at the "@domain" and append the things from the left while it is a valid email

      let email = ending.substring(ending.indexOf("@" + domain) - 1);
      for (let i = 1; validation.email(email); i++) {
        email = ending.substring(ending.indexOf("@" + domain) - i);
      }
      // now, email includes all the characters it can while being a valid email
      // however, the first character of email makes it invalid, so ignore the first character
      emails.push(email.substring(1));
    });
  });

  return emails.filter(uniq);
}

// the business data is from Foursquare
// the business must have a name and url
// next is a function that accepts a name and an email parameter
module.exports = (business, next) => {
  assert(business.name);
  assert(business.url);

  // find the email for a business
  request(business.url, (err, code, homepage) => {
    // error handling
    if (err) {
      logarithmic.warning(err);
      return;
    }

    contactPageURIs(homepage).forEach((uri) => {
      // if the URI is an email address,
      if (uri.includes("mailto")) {
        next(business.name, uri.replace("mailto:", ""));
      } else {
        const requestURI = validation.requestableURI(uri) ? uri : combineURLURI(business.url, uri);
        request(requestURI, (error, code, contactPage) => {
          if (error) {
            console.log(error);
            return;
          }

          const emails = findEmailsInContactPage(business.url, contactPage)
          emails.forEach(email => next(business.name, email));
        });
      }
    });
  });
}
