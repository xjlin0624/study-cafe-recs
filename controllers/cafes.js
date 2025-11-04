const Cafe = require('../models/cafe');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const MapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken: MapBoxToken});
const {cloudinary} = require('../cloudinary');

const wifiSign = ['strong', 'spotty', 'no wifi'];

module.exports.index = async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', {cafes});
};

module.exports.renderNewForm = (req,res) => {
    res.render('cafes/new', {wifiSign});
};

module.exports.createCafe = async (req,res,next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.cafe.location,
        limit: 1
    }).send();
    const cafe = new Cafe(req.body.cafe);
    cafe.geometry = geoData.body.features[0].geometry;
    cafe.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    cafe.author = req.user._id;
    await cafe.save();
    console.log(cafe);
    req.flash('success', 'Successfully added a new cafe!');
    res.redirect(`/cafes/${cafe._id}`);
};

module.exports.showCafe = async (req,res,) => {
    const cafe = await Cafe.findById(req.params.id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    // console.log(cafe);
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/show', {cafe});
};

module.exports.renderEditForm = async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findById(id);
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/edit', {cafe, wifiSign});
};

module.exports.updateCafe = async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findByIdAndUpdate(id,{...req.body.cafe});
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    cafe.images.push(...imgs);
    await cafe.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await cafe.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
    };
    req.flash('success', 'Successfully updated cafe!')
    res.redirect(`/cafes/${cafe._id}`);
};

module.exports.deleteCafe = async (req,res) => {
    const {id} = req.params;
    await Cafe.findByIdAndDelete(id);
    req.flash('success', 'Cafe deleted.');
    res.redirect('/cafes');
};