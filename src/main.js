// finds and emails businesses of a given type in a given location
// expects the shell arguments: query, latitude, longitude

const assert = require("assert");
const Emitter = require("events");
const shellArguments = require("shell-arguments");
const prompt = require("prompt");
const data = require("./data");
const scout = require("./scout");
const delve = require("./delve");
const email = require("./email");

// get parameters
const { query, latitude, longitude } = shellArguments;
assert(query);
assert(latitude);
assert(longitude);

// the program will start looking for business emails immediately to save time.
// while it looks for emails, the user is prompted to enter their password
// if an email is found before the password is entered, then the program will wait until the
// password is entered by adding a response to an event emitter.
// when the password is entered, the event emitter emits a "ready" signal, sending the saved emails

// ask the user for their email
// after they entered their email, the event emitter sends a "ready" event, sending waiting emails
const passwordEmitter = new Emitter();
let password;
prompt.start();
prompt.get({ properties: { password: { hidden: true } } }, (err, response) => {
  if (err) {
    console.log(err);
    return;
  }
  password = response.password;
  passwordEmitter.emit("ready"); // send the waiting emails
});

scout(data.foursquare, { latitude, longitude }, query, (business) => {
  delve(business, (businessName, businessEmail) => {
    // if the password has already been entered, send the email
    if (password) {
      email(businessName, businessEmail, data.personal.name, data.personal.email, password);
    }

    // if the password has not been entered yet, wait until the "ready" signal is given to send it
    else {
      passwordEmitter.on("ready", () =>
        email(businessName, businessEmail, data.personal.name, data.personal.email, password)
      );
    }
  });
});
