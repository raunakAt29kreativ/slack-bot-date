const { App } = require("@slack/bolt");
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SIGNIN_SECRET, // Replace with your Slack app's signing secret
});

// Listen for 'hi' message
app.message("hi", async ({ message, say }) => {
  const today = new Date().toDateString();
  await say(`Hello <@${message.user}>! Today's date is ${today}.`);
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
