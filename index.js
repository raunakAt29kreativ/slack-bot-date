const HOLIDAYS = [
  "26-01-2024",
  "25-03-2024",
  "29-03-2024",
  "11-04-2024",
  "17-04-2024",
  "21-04-2024",
  "23-05-2024",
  "17-06-2024",
  "17-07-2024",
  "15-08-2024",
  "26-08-2024",
  "16-09-2024",
  "02-10-2024",
  "12-10-2024",
  "31-10-2024",
  "15-11-2024",
  "25-12-2024",
];

const request = require("request");
const cron = require("node-cron");
const { App } = require("@slack/bolt");
require("dotenv").config();

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SIGNIN_SECRET, // Replace with your Slack app's signing secret
});

// Listen for 'hi' message
app.message("#hi", async ({ message, say }) => {
  const today = new Date().toDateString();
  await say(`Hello <@${message.user}>! 
  I'm a bot to help you know about India's Holidays.

  Commands:-
  #hi - Info
  #next - Next Holiday
  #<month> - All Holidays in given month
  #year - All Holidays in current year`);
});

app.message("#next", async ({ message, say }) => {
  let m = "";
  const today = new Date();
  let next = "";

  const sortedHolidays = HOLIDAYS.sort((a, b) => {
    const dateA = new Date(a.split("-").reverse().join("-"));
    const dateB = new Date(b.split("-").reverse().join("-"));
    return dateA - dateB;
  });

  for (let holiday of sortedHolidays) {
    if (new Date(holiday.split("-").reverse().join("-")) > today) {
      next = holiday;
      break;
    }
  }
  if (!next) {
    await say(`Holiday List Ended!`);
    return;
  }
  await request.get(
    {
      url:
        "https://api.api-ninjas.com/v1/holidays?country=" +
        "IN" +
        "&year=" +
        "2024",
      headers: {
        "X-Api-Key": process.env.API_KEY,
      },
    },
    async function (error, response, body) {
      if (error) {
        return "";
      } else if (response.statusCode != 200) {
        return "";
      } else {
        const holidays = JSON.parse(body);
        const nextRev = next.split("-").reverse().join("-");
        let map = new Map();
        map.set(nextRev, 1);
        for (const holiday of holidays) {
          if (map.has(holiday["date"])) {
            const options = { year: "numeric", month: "short", day: "numeric" };
            const d = new Date(nextRev).toLocaleDateString("en-us", options);
            m = `${d} <${holiday["day"]}>\nOccasion: ${holiday["name"]}\nType: ${holiday["type"]}`;
            break;
          }
        }
        await say(
          `Hello <@${message.user}>!\n\nNext Holiday is on :- \n${m || next}.`
        );
      }
    }
  );
});

app.message("#year", async ({ message, say }) => {
  const year = new Date().getFullYear();
  let m = "";
  await request.get(
    {
      url:
        "https://api.api-ninjas.com/v1/holidays?country=" +
        "IN" +
        "&year=" +
        year,
      headers: {
        "X-Api-Key": process.env.API_KEY,
      },
    },
    async function (error, response, body) {
      if (error) {
        return "";
      } else if (response.statusCode != 200) {
        return "";
      } else {
        const holidays = JSON.parse(body);
        const compareDates = (date1, date2) => {
          if (date1["date"] < date2["date"]) return -1;
          if (date1["date"] > date2["date"]) return 1;
          return 0;
        };

        holidays.sort(compareDates);
        for (const holiday of holidays) {
          const options = { year: "numeric", month: "short", day: "2-digit" };
          const d = new Date(holiday["date"]).toLocaleDateString(
            "en-us",
            options
          );
          m += `${d}    <${holiday["day"].substring(0, 3)}>    ${
            holiday["name"]
          }\n`;
        }
        await say(m || "Something Went Wrong");
      }
    }
  );
});

app.message(
  /#(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  async ({ message, say }) => {
    const arr = [
      "#jan",
      "#feb",
      "#mar",
      "#apr",
      "#may",
      "#jun",
      "#jul",
      "#aug",
      "#sep",
      "#oct",
      "#nov",
      "#dec",
    ];
    const year = new Date().getFullYear();
    let m = "";
    let month = String(arr.indexOf(message.text) + 1);
    if (month.length === 1) month = "0" + month;
    if (month === "00") {
      await say("Try Shortcut like '#jan' for 'January'");
      return;
    }

    await request.get(
      {
        url:
          "https://api.api-ninjas.com/v1/holidays?country=" +
          "IN" +
          "&year=" +
          year,
        headers: {
          "X-Api-Key": process.env.API_KEY,
        },
      },
      async function (error, response, body) {
        if (error) {
          return "";
        } else if (response.statusCode != 200) {
          return "";
        } else {
          let holidays = JSON.parse(body);
          const compareDates = (date1, date2) => {
            if (date1["date"] < date2["date"]) return -1;
            if (date1["date"] > date2["date"]) return 1;
            return 0;
          };

          holidays.sort(compareDates);
          holidays = holidays.filter(
            (h) => h["date"].substring(5, 7) === month
          );
          for (const holiday of holidays) {
            const options = { year: "numeric", month: "short", day: "2-digit" };
            const d = new Date(holiday["date"]).toLocaleDateString(
              "en-us",
              options
            );
            m += `${d}    <${holiday["day"].substring(0, 3)}>    ${
              holiday["name"]
            }\n`;
          }
          await say(m || "Something Went Wrong!");
        }
      }
    );
  }
);

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
async function sendMessageToSlack() {
  const date = new Date();
  const currDate = formatDate(date);
  if (!HOLIDAYS.includes(currDate)) return;
  await request.get(
    {
      url:
        "https://api.api-ninjas.com/v1/holidays?country=" +
        "IN" +
        "&year=" +
        "2024",
      headers: {
        "X-Api-Key": process.env.API_KEY,
      },
    },
    async function (error, response, body) {
      let m = "";
      if (error) {
        return "";
      } else if (response.statusCode != 200) {
        return "";
      } else {
        const holidays = JSON.parse(body);
        let map = new Map();
        map.set(currDate, 1);
        for (const holiday of holidays) {
          if (map.has(holiday["date"])) {
            const options = { year: "numeric", month: "short", day: "numeric" };
            const d = new Date(nextRev).toLocaleDateString("en-us", options);
            m = `${d} <${holiday["day"]}>\nOccasion: ${holiday["name"]}\nType: ${holiday["type"]}`;
            break;
          }
        }
        const optionsPost = {
          method: "POST",
          url: process.env.WEBHOOK_URL,
          headers: {
            Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `Today is Holiday - 
          ${m}`,
          }),
        };

        await request(optionsPost, function (error, response, body) {
          if (error) {
            console.error("Error sending scheduled message to Slack:", error);
          } else {
            console.log("Scheduled Message sent to Slack successfully.");
          }
        });
      }
    }
  );
}

cron.schedule(
  "0 6 * * *",
  () => {
    sendMessageToSlack();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

(async () => {
  // Start the app
  await app.start(process.env.PORT || 5000);

  console.log("⚡️ Bolt app is running!");
})();
