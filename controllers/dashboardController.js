const Note = require('../models/Notes');
const mongoose = require('mongoose');
const { z } = require('zod');

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  body: z.string().min(1, 'Body is required')
});

exports.dashboard = async (req, res, next) => {
    let perPage = 6;
    let page = req.query.page || 1;
    try {
        const notes = await Note.aggregate([
            { $sort: { createdAt: -1 } },
            { $match: { user: new mongoose.Types.ObjectId(req.user.id) } }
        ]).skip(perPage * page - perPage).limit(perPage).exec();

        const count = await Note.countDocuments({ 'user': new mongoose.Types.ObjectId(req.user.id) });
        res.status(200).send({
            notes: notes,
            current: page,
            pages: Math.ceil(count / perPage)
        });
    } catch (error) {
        next(error);
    }
}

exports.dashboardViewNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id).where({ user: req.user.id }).lean();
        if (note) {
            res.status(200).send({ noteID: req.params.id, note, profileImg: req.user.profileImage });
        } else {
            res.status(404).send({ error: "Note not found" });
        }
    } catch (error) {
        next(error);
    }
}

exports.dashboardUpdateNote = async (req, res, next) => {
    try {
        const validated = noteSchema.parse(req.body);
        let result = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title: validated.title, body: validated.body },
            { new: true }
        );
        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ error: 'Note not found' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        next(error);
    }
};

exports.dashboardDeleteNote = async (req, res, next) => {
    try {
        let result = await Note.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ error: 'Note not found' });
        }
    } catch (error) {
        next(error);
    }
}

exports.dashboardAddNote = async (req, res, next) => {
    try {
        const validated = noteSchema.parse(req.body);
        validated.user = req.user.id;
        let result = await Note.create(validated);
        if (result) {
            res.status(201).send(result);
        } else {
            res.status(400).send({ error: 'Failed to create note' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        next(error);
    }
}

exports.dashboardSearch = async (req, res, next) => {
    try {
        let searchTerm = req.params.searchTerm;
        const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
        const searchResults = await Note.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
                { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
            ],
            user: req.user.id
        });
        
        if (searchResults) {
            res.status(200).send({ notes: searchResults, profileImg: req.user.profileImage });
        } else {
            res.status(404).send({ error: "No search results" });
        }
    } catch (error) {
        next(error);
    }
}