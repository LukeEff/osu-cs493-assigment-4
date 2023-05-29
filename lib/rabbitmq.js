const amqp = require('amqplib');
const { ObjectId, GridFSBucket } = require('mongodb');
const { downloadPhotoById, uploadNewThumbnailFromPhoto } = require('../models/photo');
const fs = require("fs");
const {getDbReference} = require("./mongo");
const Jimp = require('jimp');

async function sendToQueue(data) {
  await amqp.connect('amqp://localhost', (err, conn) => {
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

async function receiveFromQueue() {
  await amqp.connect('amqp://localhost', (err, conn) => {
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

exports.sendToQueue = sendToQueue;