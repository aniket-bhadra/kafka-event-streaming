# Apache Kafka: High Throughput Event Streaming Platform

## What is Throughput?
Throughput = number of operations completed per unit of time.

In regular databases, throughput is generally lower, so we cannot perform many operations per second. Whenever we need to read and write multiple data records per second in databases, there's a chance we could end up crashing that database.

**Example:** Food delivery app's delivery partner real-time data storing when they're delivering food - millions of delivery partners delivering food at the same time means millions of data records getting inserted into the database simultaneously, which can lead to database crashes.

In group chat where multiple people are chatting, if every message that someone sends is first stored to a normal database and then emitted to others in that group, this whole process takes time since database insertion takes time, plus network speed, plus server processing speed. Overall, this doesn't make the chat real-time since operations become high, leading the database down quickly.

## Why Kafka?

Kafka has high throughput, so even if we read and write millions of data records per second in Kafka, it can handle that efficiently and won't crash.

### Key Differences: Kafka vs Regular Databases

**Kafka:**
- Higher throughput but lower storage capability
- Can allow millions of read/write operations per second without getting crushed
- Data is stored in Kafka but it's not designed for permanent storage (has retention policies)
- Designed for streaming, not long-term data storage and complex querying

**Regular Databases:**
- Lower throughput - cannot handle millions of read/write operations per second
- Can store billions of records permanently forever (permanent storage)
- Can query data efficiently
- Designed for persistent data storage

## Why Use Both Together?

**Example: Ride-sharing App**

100,000 cars per second producing data:
- What is their speed?
- Who is the driver?
- Location coordinates

We push this raw, unprocessed data directly to Kafka because Kafka has high throughput and can handle millions of data records per second.

### Architecture Flow:
```
Producer (Cars) → Kafka → Consumers (Services)
```

**Producers:** Cars generating location/speed data
**Consumers:** Multiple services that pick data from Kafka:
- Fare service
- Analytics service  
- Customer service

These services take data from Kafka, perform calculations, send to clients, and then bulk insert to the database. This way we're not pushing data to the database per second - we take all the data and bulk insert it to the database in one go in a single transaction.

**Benefits:**
- Database load is drastically reduced
- Even if bulk insert takes time, no problem because we already sent data to clients
- Later, if we need historical data, we can query from the database
- Solves Kafka's temporary storage limitation

Clients can also consume directly from Kafka - either clients take data from Kafka and show to users, or backend servers take data from Kafka and send to clients before storing in database. Both approaches work.

Broker = Kafka server that stores data (like a database server)
Consumer = Application that reads data from Kafka
Producer = Application that writes data to Kafka

## Kafka Architecture

### Topics
Topics are logical partitioning of messages.

**Example for Food Delivery App:**
- Topic 1: Messages related to delivery partner locations
- Topic 2: Messages about restaurant food preparation status

Producers specify which topic they want to push messages to when inserting.

### Partitions
Inside each topic, we can use partitions to manage data better. Since millions of data records are pushed per second from all over the world, we partition based on criteria like location:

**Example:**
- Inside delivery partner location topic: partition by geography
- India location messages consumed by India message consumer
- USA location messages consumed by USA message consumer

### Architecture Hierarchy:
```
Kafka → Topics → Partitions
```

### Consumer Load Balancing

If there are 4 partitions inside 1 topic and 2 consumers, Kafka automatically balances load:
- 1 consumer handles 2 partitions
- Other consumer handles other 2 partitions

**Important Kafka Rule:**
- ✅ 1 consumer can handle multiple partitions
- ❌ 1 partition cannot be handled by multiple consumers

## Consumer Groups

To solve scaling limitations, we have consumer groups. When we create a consumer, by default it belongs to a group - consumers cannot exist without groups.

### Example Scenario:
**Setup:** 1 topic with 4 partitions

**Group 1 with 1 consumer:**
- This consumer consumes from all 4 partitions

**Group 1 with 2 consumers:**
- Due to auto-balancing: 2 partitions belong to consumer 1, other 2 belong to consumer 2

**Group 1 with 5 consumers:**
- Due to auto-balancing: each partition belongs to one consumer
- 1 consumer will be idle (since 1 partition can belong to only 1 consumer)

**Adding Group 2 with 1 consumer:**
- All 4 partitions belong to Group 1's consumers (distributed among them)
- Same 4 partitions also belong to Group 2's 1 consumer
- Auto-balancing works at group level

### Auto-balancing Logic:
- If 4 partitions and 2 groups with 1 consumer each → each group's consumer gets all 4 partitions
- If Group 1 adds 1 more consumer → 2 partitions go to Group 1 Consumer 1, 2 partitions go to Group 1 Consumer 2
- Group 2's consumer still gets all 4 partitions
