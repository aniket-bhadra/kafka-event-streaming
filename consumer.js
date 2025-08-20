const kafka = require("./client");

async function init() {
  const consumer = kafka.consumer({ groupId: "rider-1" });
  await consumer.connect();
  await consumer.subscribe({ topics: ["rider_updates"], fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      console.log({
        key: message.key.toString(),
        value: message.value.toString(),
        headers: message.headers,
        topic,
        partition,
      });
    },
  });
}

init();
