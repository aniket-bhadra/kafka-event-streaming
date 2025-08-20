const kafka = require("./client");
const readline = require("readline");

const rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout,
});

async function init() {
 const producer = kafka.producer();
 await producer.connect();
 console.log("producer connection success!!");

 rl.setPrompt(">");
 rl.prompt();

 rl.on("line", async (line) => {
   const [riderName, location] = line.split(" ");

   await producer.send({
     topic: "rider_updates",
     messages: [
       {
         partition: location.toLowerCase() === "north" ? 0 : 1,
         key: "location-update",
         value: JSON.stringify({
           name: riderName,
           loc: location,
         }),
       },
     ],
   });

   rl.prompt();
 });

 rl.on("close", async () => {
   await producer.disconnect();
   process.exit(0);
 });
}

init();