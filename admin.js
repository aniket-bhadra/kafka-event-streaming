const kafka = require("./client");

async function init() {
  const admin = kafka.admin();
  console.log("admin connecting....");
  await admin.connect();
  console.log("admin connected successfully");

  console.log("creating topic rider updates");
  await admin.createTopics({
    topics: [
      {
        topic: "rider_updates",
        numPartitions: 2,
      },
    ],
  });
  console.log("topic created success");
  console.log("Admin disconnecting...");
  await admin.disconnect();
}

init();
