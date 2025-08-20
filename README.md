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

## Why This Architecture is Beneficial

With this architecture, Kafka can implement both **Queue** and **Pub/Sub** patterns:

### Queue Pattern (1 Producer → 1 Consumer)
- Even if Multiple consumers attached, but msg1 picked by consumer1 means msg1 cannot be picked by consumer2 (deleted from queue)
- **Implementation in Kafka:** 4 partitions + 1 group + 4 consumers
- Each partition belongs to 1 consumer
- If msg1 comes to partition1 → only the consumer assigned to partition1 gets msg1, other 3 don't

**Best Practice:** Make number of partitions = number of consumers

### Pub/Sub Pattern (1 Publisher → Multiple Listeners)
- Same message can be listened to by multiple consumers
- **Implementation in Kafka:** 4 partitions + 4 groups + 1 consumer per group
- If msg1 comes to partition1 → msg1 goes to all consumers since all 4 partitions belong to all 4 groups
- Inside each group there's 1 consumer → pub/sub architecture achieved

## Why Kafka Has Such High Throughput?

Kafka achieves high throughput through:

1.  **Sequential I/O Operations**: It writes data sequentially to disk, which is much faster than random access.

2.  **Zero-Copy Data Transfer**: When a consumer requests data, Kafka bypasses the server's RAM. It reads the data directly from the disk and sends it to the network, eliminating unnecessary copy steps.

3.  **Batch Processing**: Instead of processing single messages, Kafka efficiently groups them into larger batches for both reading and writing, reducing the overhead of network calls.

4.  **Distributed Architecture**: Kafka scales across multiple servers. The load is distributed, preventing any single server from becoming a bottleneck. Data is further split into partitions to allow multiple consumers to process different parts of the data at the same time (parallelism). **For example: one consumer consumes one partition, while another consumer consumes a different partition at the same time.** This is why Kafka is so powerful.

Kafka brokers handle all message operations (topics, partitions, replication), while ZooKeeper in Kafka 2.6.x and below only tracks brokers and stores configuration data—that's why ZooKeeper starts first. confluentinc/cp-kafka creates the broker, so use confluentinc/cp-zookeeper with confluentinc/cp-kafka since they're designed to work together, unlike the plain zookeeper image which isn't optimized for Kafka.

```bash
docker run -d --name zookeeper -p 2181:2181 -e ZOOKEEPER_CLIENT_PORT=2181 -e ZOOKEEPER_TICK_TIME=2000 confluentinc/cp-zookeeper:6.2.10
```

ZOOKEEPER_TICK_TIME=2000 means every 2 seconds it checks connections and sessions using this timing.

Then run Kafka:
```bash
docker run --name kafka -p 9092:9092 -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 --link zookeeper confluentinc/cp-kafka:6.2.10
```

KAFKA_ZOOKEEPER_CONNECT tells this Kafka where ZooKeeper is running:
- `<pc's private ip>:2181` or
- `<containerName>:2181`

Docker's internal DNS resolves it automatically.

IP is required when connecting from outside Docker (like Node.js app on your host).

KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 specifies where Kafka is actually running.

PLAINTEXT in Kafka is not HTTP. It's Kafka's own protocol over TCP, used for producers and consumers to talk to brokers. PLAINTEXT just means unencrypted, no SSL. So it's a TCP-based messaging protocol, not HTTP.

HTTP runs on top of TCP, but it is a different protocol with request/response semantics. Kafka's PLAINTEXT protocol is also TCP-based but uses its own binary message format.

KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR controls how many replicas of each partition exist. If you have 1 broker → set to 1, if multiple brokers then 3 is safe.

Setting it to 1 means each partition has only 1 copy (no replicas). If replicas existed, they would exist on different brokers. Since there are no replicas here, it means only 1 broker. If this single broker goes down, the partition data is unavailable.

### KafkaJS
- admin - infrastructure setup (topics, partitions setup)
- producer - message produced  
- consumer - message consumed
