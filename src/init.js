// saves some data into data.json

const prompt = require("prompt");
const fs = require("fs");

prompt.start();
prompt.get(["Foursquare API ID", "Foursquare API Secret", "Your name", "Your email"], (err, res) => {
  if (err) {
    console.log(err);
    return;
  }

  const data = {
    foursquare: {
      id: res["Foursquare API ID"],
      secret: res["Foursquare API Secret"]
    },
    personal: {
      name: res["Your name"],
      email: res["Your email"]
    }
  };

  fs.writeFileSync("./src/data.json", JSON.stringify(data), "utf-8");
});
