const kafka = require("./client");

async function init() {
  const producer = kafka.producer();
  await producer.connect();
  console.log("producer connection success!!");
  await producer.send({
    topic: "rider_updates",
    messages: [
      {
        partition: 0,
        key: "location-update",
        value: JSON.stringify({
          name: "Rahul Roy",
          loc: "19.0761° N, 72.8775° E",
        }),
      },
    ],
  });
  await producer.disconnect();
}

init();
