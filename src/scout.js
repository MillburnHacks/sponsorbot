// this file finds companies' websites by scouting through Foursquare
// it runs the passed callback on each business

const request = require("request");
const assert = require("assert");

// foursquare is an object of API stuff, like an id & secret
// location is a map that has a latitude and longitude property
// the query is the search query e.g. "Restaurant"
// next is the function that gets called on every business that is found
module.exports = (foursquare, location, query, next) => {
  assert(foursquare.id);
  assert(foursquare.secret);
  assert(location.latitude);
  assert(location.longitude);
  assert(query);

  const requestURI = `https://api.foursquare.com/v2/venues/search
    ?client_id=${foursquare.id}
    &client_secret=${foursquare.secret}
    &v=20130815&ll=${location.latitude},${location.longitude}
    &query=${query}`
    .replace(/\n/gi, "") // get rid of new lines because we can't have newlines in a URI
    .replace(/ /gi, ""); // get rid of spaces because we can't have spaces in a URI

  // we can get the API response for that URI
  request(requestURI, (err, code, response) => {
    // error handling
    if (err) {
      logarithmic.warning(err);
      return;
    }

    const businesses = JSON.parse(response).response.venues; // parse and extract the businesses
    const usableBusiness = (business) => business.name && business.url;
    businesses.filter(usableBusiness).forEach(next); // run the callback on each business
  });
};
