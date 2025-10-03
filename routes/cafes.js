const express = require('express');
const router = express.Router();
const cafes = require('../controllers/cafes')
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateCafe} = require('../middleware');
const multer  = require('multer')
const {storage} = require('../cloudinary');
const upload = multer({storage});

router.route('/')
    .get(catchAsync(cafes.index))
    // .post(isLoggedIn, validateCafe, catchAsync(cafes.createCafe));
    .post(upload.array('image'), (req,res) => {
        res.send('it worked!');
    })

router.get('/new', isLoggedIn, cafes.renderNewForm);

router.route('/:id')
    .get(catchAsync(cafes.showCafe))
    .put(isLoggedIn, isAuthor, validateCafe, catchAsync(cafes.updateCafe))
    .delete(isLoggedIn, isAuthor, catchAsync(cafes.deleteCafe));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(cafes.renderEditForm));

module.exports = router;