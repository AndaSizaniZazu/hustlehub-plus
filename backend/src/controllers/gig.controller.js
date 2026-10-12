const Gig = require('../models/Gig');

const listGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find()
      .populate('freelancer', 'name') // name only, never email
      .sort('-createdAt');
    return res.status(200).json(gigs);
  } catch (err) {
    next(err);
  }
};

const getGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('freelancer', 'name');
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    return res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
};

const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ freelancer: req.user.id }).sort('-createdAt');
    return res.status(200).json(gigs);
  } catch (err) {
    next(err);
  }
};

const createGig = async (req, res, next) => {
  try {
    const { title, description, category, price } = req.body;
    const gig = await Gig.create({
      title,
      description,
      category,
      price,
      freelancer: req.user.id, // owner comes from the token, never the body
    });
    return res.status(201).json(gig);
  } catch (err) {
    next(err);
  }
};

const updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    if (!gig.freelancer.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, description, category, price } = req.body;
    Object.assign(gig, { title, description, category, price });
    await gig.save();

    return res.status(200).json(gig);
  } catch (err) {
    next(err);
  }
};

const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    if (!gig.freelancer.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await gig.deleteOne();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { listGigs, getGig, getMyGigs, createGig, updateGig, deleteGig };