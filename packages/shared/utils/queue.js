const { Queue, Worker } = require('bullmq');

/**
 * Shared Redis connection options for BullMQ.
 * BullMQ needs IORedis-style config, NOT the `redis` npm package.
 * The REDIS_URL env var is parsed into host/port/password.
 */
const parseRedisUrl = (url) => {
  if (!url) {
    return { host: '127.0.0.1', port: 6379 };
  }

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      username: parsed.username !== 'default' ? parsed.username : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined, // Upstash requires TLS
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
};

const getRedisConnection = () => parseRedisUrl(process.env.REDIS_URL);

/**
 * Create a producer queue.
 * Usage:
 *   const { createQueue } = require('@feastfleet/shared');
 *   const orderQueue = createQueue('order-events');
 *   await orderQueue.add('order.placed', { orderId: '123', ... });
 */
const createQueue = (queueName) => {
  const queue = new Queue(queueName, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
      removeOnFail: { count: 500 },      // Keep last 500 failed jobs
      attempts: 3,                        // Retry 3 times
      backoff: {
        type: 'exponential',
        delay: 2000,                      // 2s, 4s, 8s
      },
    },
  });

  queue.on('error', (err) => {
    console.error(`[Queue:${queueName}] Error:`, err.message);
  });

  return queue;
};

/**
 * Create a consumer worker.
 * Usage:
 *   const { createWorker } = require('@feastfleet/shared');
 *   const worker = createWorker('order-events', async (job) => {
 *     if (job.name === 'order.placed') { ... }
 *   });
 */
const createWorker = (queueName, processor, options = {}) => {
  const worker = new Worker(queueName, processor, {
    connection: getRedisConnection(),
    concurrency: options.concurrency || 5,
    limiter: options.limiter || undefined,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker:${queueName}] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker:${queueName}] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Worker:${queueName}] Error:`, err.message);
  });

  return worker;
};

module.exports = { createQueue, createWorker, getRedisConnection };
