/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const fs = require("fs");

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
      resolve(result._id)
    })
  })



  //const collection = db.collection('photos')
  //const result = await collection.insertOne(photo)
  //return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

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

  /*
  const collection = db.collection('photos')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray()
    return results[0]
  }
   */
}
exports.getPhotoById = getPhotoById
