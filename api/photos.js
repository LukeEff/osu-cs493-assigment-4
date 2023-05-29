/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')

const { validateAgainstSchema } = require('../lib/validation')
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById
} = require('../models/photo')
const mime = require('mime-types')
const multer = require('multer')
const upload = multer({ dest: `${__dirname}/uploads/images`, fileFilter: (req, file, callback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true)
  }
  else {
    callback(new Error('Invalid file type. Only jpeg and png files are allowed.'), false)
  }
}})


const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single('file'), async (req, res) => {
  req.body = {
    ...req.body,
    file: req.file
  }
  if (validateAgainstSchema(req.body, PhotoSchema)) {
    try {
      req.body.businessId = Number(req.body.businessId)
      await insertNewPhoto(req.body).then( metadata => {
        // Download path for photo
        const id = metadata.id
        const extension = mime.extension(req.file.mimetype) // look into using returned metadata instead of this
        const photoUrl = `/media/photos/${id}.${extension}`
        // Path for business
        const businessId = req.body.businessId
        const businessUrl = `/businesses/${businessId}`

        res.status(201).send({
          id: id,
          links: {
            photo: photoUrl,
            business: businessUrl
          }
        })
      })
    } catch (err) {
      console.error(err)
      res.status(500).send({
        error: "Error inserting photo into DB.  Please try again later."
      })
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    })
  }
})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id)
    if (!photo) {
      return next()
    }

    const metadata = photo.metadata

    // Generate URLs for photo
    const extension = metadata.contentType.split('/').pop()
    const photoUrl = `/media/photos/${req.params.id}.${extension}`
    const thumbUrl = photo.thumbId ? `/media/thumbs/${photo.thumbId}.jpg` : ''
    console.log(photo)
    res.status(200).send({
      ...photo,
      links: {
        photo: photoUrl,
        thumbnail: thumbUrl
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    })
  }
})

module.exports = router
