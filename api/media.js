const { Router } = require('express')
const { downloadPhotoById, downloadThumbnailById, containsThumbnail, containsPhoto} = require("../models/photo");

const router = Router()

router.get('/photos/:id.jpg', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})

router.get('/photos/:id.jpeg', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})


router.get('/photos/:id.png', async (req, res, next) => {
  try {
    if (!await containsPhoto(req.params.id)) {
      res.status(404).send({
        error: "Photo not found."
      })
      return
    }
    await downloadPhotoById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo."
    })
  }
})

router.get('/thumbs/:id.jpg', async (req, res, next) => {
  try {
    if (!await containsThumbnail(req.params.id)) {
      res.status(404).send({
        error: "Thumbnail not found."
      })
      return
    }
    await downloadThumbnailById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch thumbnail."
    })
  }
})

module.exports = router