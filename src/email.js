// sends a form email to a business

const nodemailer = require('nodemailer');

module.exports = (businessName, businessEmail, myName, myEmail, password) => {
  const transporter = nodemailer.createTransport(`smtps://${myEmail}:${password}@smtp.gmail.com`);

  const text = `
Hello ${businessName},

I'm an organizer for hackMHS III, the second largest high school hackathon in New Jersey. At a hackathon, students can learn how to program, have some friendly competition, and win prizes. We plan on having over 100 students attend this December 3rd for a 12-hour hackathon, and we would love it if you could sponsor us in exchange for advertising. We have to give the attendees food, drink, prizes, and shirts, all of which cost money. You, as a company, can benefit tremendously from advertising, especially in Millburn, one of the richest towns in America. Unlike other advertising methods, like online or print, sponsoring a hackathon guarantees that you will be seen, either by the attendees at the hackathon or on their shirts.

If you're interested, we can discuss this further.

Best,
${myName}
`;

  const email = {
    from: `"${myName}" ${myEmail}`,
    to: businessEmail,
    subject: "Sponsor hackMHS!",
    text
  };

  transporter.sendMail(email, (error, info) => {
    if (error) {
      console.log(error);
      return;
    }

    console.log(info);
  });
};
