const amqp = require('amqplib');

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

export const QueueName = {
  PHOTOS: 'photos'
}

async function sendToQueue(queueName, data, timeout = 500) {
  await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      channel.assertQueue(queueName, {
        durable: true
      });

      channel.sendToQueue(queueName, Buffer.from(data));
      console.log(`Message sent to queue: ${data}`);
    });

    setTimeout(() => {
      conn.close();
      //process.exit(0);
    }, timeout)
  })
}

/*
async function sendToQueue(data) {
  await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      const queue = 'photos';

      channel.assertQueue(queue, {
        durable: true
      });

      channel.sendToQueue(queue, Buffer.from(data));
      console.log(`Message sent to queue: ${data}`);
    });

    setTimeout(() => {
      conn.close();
      //process.exit(0);
    }, 500)
  })
}
 */

async function receiveFromQueue(queueName, callback) {
  await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      channel.assertQueue(queueName, {
        durable: true
      });

      channel.consume(queueName, (msg) => {
        console.log(`Message received from queue: ${msg.content.toString()}`);
        callback(msg.content.toString());
      }, {
        noAck: true
      });
    });
  });
}

/*
async function receiveFromQueue() {
  await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      const queue = 'photos';

      channel.assertQueue(queue, {
        durable: true
      });

      channel.consume(queue, (msg) => {
        console.log(`Message received from queue: ${msg.content.toString()}`);
        const photoId = msg.content.toString();
        uploadNewThumbnailFromPhoto(photoId)
      }, {
        noAck: true
      });
    });
  });
}
 */

exports.sendToQueue = sendToQueue;