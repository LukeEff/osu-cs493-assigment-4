/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { sendToQueue } = require('../lib/rabbitmq')
const fs = require("fs");
const Jimp = require('jimp');

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false },
  file: { required: true }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema)
  //photo.businessId = ObjectId(photo.businessId)
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const metadata = {
    contentType: photo.file.mimetype,
    businessId: photo.businessId,
    caption: photo.caption
  }
  // Upload the photo alongside its metadata to the database
  return new Promise(resolve => {
    fs.createReadStream(photo.file.path).pipe(bucket.openUploadStream(photo.file.originalname, {
          chunkSizeBytes: 512,
          metadata: metadata
        })
    ).on('finish', function (result) {
      console.log(result)
      sendToQueue(result._id.toString())
      resolve(result)
    })
  })
}

async function getDownloadedPhotoFileById(id, fileLocation) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const downloadStream = bucket.openDownloadStream(new ObjectId(id))

  return new Promise(resolve => {
    downloadStream.on('data', (chunk) => {
      fs.appendFileSync(fileLocation, chunk);
    })
    downloadStream.on('end', () => {
      resolve(fileLocation)
    })
  })
}

async function transformPhotoToPixels(photoFilePath, width, height) {
  const image = await Jimp.read(photoFilePath)
  const newPhotoFilePath = `/tmp/${photoFilePath}`
  return new Promise(resolve => {
    image.resize(width, height).write(newPhotoFilePath, () => {
      resolve(newPhotoFilePath)
    })
  })

}

async function updateThumbnailIdOfPhoto(photoId, thumbId) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const result = await bucket.updateOne(
    { _id: new ObjectId(photoId) },
    { $set: { thumbId: thumbId } }
  )
  return result.matchedCount > 0
}

async function uploadNewThumbnailFromPhoto(photoId) {
  // Retrieve photo and scale it down to 100x100px
  const photo = await getDownloadedPhotoFileById(photoId, `/tmp/${photoId}.jpg`)
  const transformedFilePath = await transformPhotoToPixels(photo, 100, 100)

  // Get a reference to the database and to the bucket
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const metadata = {
    contentType: 'image/jpeg',
  }

  // Upload the scaled thumbnail to the database
  return new Promise(resolve => {
    // openUploadStream parameter filename might be better not to be a photoId
    fs.createReadStream(transformedFilePath).pipe(bucket.openUploadStream(photoId, {
          chunkSizeBytes: 512,
          metadata: metadata
        })
    ).on('finish', function (result) {
      updateThumbnailIdOfPhoto(photoId, result._id.toString())
      resolve(result._id)
    })
  })
}


/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results[0]
}

async function downloadPhotoById(id, outputFile) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })
  const downStream = bucket.openDownloadStream(new ObjectId(id))
  downStream.pipe(outputFile)
}

async function getThumbnailById(id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const cursor = bucket.find({ _id: new ObjectId(id) })
  const results = await cursor.toArray()
  return results[0]
}

async function downloadThumbnailById(id, outputFile) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
  const downStream = bucket.openDownloadStream(new ObjectId(id))
  downStream.pipe(outputFile)
}

exports.insertNewPhoto = insertNewPhoto
exports.getPhotoById = getPhotoById
exports.downloadPhotoById = downloadPhotoById
exports.uploadNewThumbnailFromPhoto = uploadNewThumbnailFromPhoto
exports.downloadThumbnailById = downloadThumbnailById
exports.getThumbnailById = getThumbnailById