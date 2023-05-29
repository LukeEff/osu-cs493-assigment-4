const { Router } = require('express')
const { getPhotoById, downloadPhotoById, downloadThumbnailById} = require("../models/photo");

const router = Router()

router.get('/photos/:id.jpg', async (req, res, next) => {
  try {
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
    await downloadThumbnailById(req.params.id, res)
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch thumbnail."
    })
  }
})

module.exports = router