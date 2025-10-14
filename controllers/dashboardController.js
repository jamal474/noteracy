const Note = require('../models/Notes');
const mongoose = require('mongoose')

exports.dashboard = async (req, res) => {

    let perPage = 6;
    let page = req.query.page || 1;

    try {

        const notes = await Note.aggregate([
            {
                $sort: {
                    createdAt: -1,
                }
            },
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id)
                }
            },
            {
                $project: {
                    title: { $substr: ['$title', 0, 30] },
                    body: { $substr: ['$body', 0, 100] }
                }
            }
        ])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();
        console.log()
        const count = await Note.where({ 'user': new mongoose.Types.ObjectId(req.user.id) }).count();
        res.status(201).send({
            notes: notes,
            current: page,
            pages: Math.ceil(count / perPage)
        });

    }
    catch (error) {
        console.log(error);
    }

}


exports.dashboardViewNote = async (req, res) => {
    const note = await Note.findById({
        _id: req.params.id
    })
        .where({ user: req.user.id }).lean();

    if (note) {
        res.status(201).send({
            noteID: req.params.id,
            note,
            profileImg: req.user.profileImage,
        });
    }
    else {
        res.send("Something went wrong");
    }
}

exports.dashboardUpdateNote = async (req, res) => {
    try {
        let result = await Note.findOneAndUpdate(
            { _id: req.params.id },
            { title: req.body.title, body: req.body.body },
            { new: true }
        ).where({ user: req.user.id });

        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ error: 'Note not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.dashboardDeleteNote = async (req, res) => {
    try {
        let result = await Note.deleteOne({ _id: req.params.id }).where({ user: req.user.id });

        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ error: 'Note not found' });
        }
    }
    catch (error) {
        console.log(error);
    }
}


exports.dashboardAddNote = async (req, res) => {
    try {
        req.body.user = req.user.id;
        let result = await Note.create(req.body);

        if (result) {
            res.status(200).send(result);
        }
        else {
            res.status(404).send({ error: 'Note not found' });
        }
    }
    catch (error) {
        console.log(error);
    }
}

exports.dashboardSearch = async (req, res) => {
    try {
        let searchTerm = req.params.searchTerm;
        const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

        const searchResults = await Note.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
                { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
            ],
        }).where({ user: req.user.id });

        if(searchResults)
        {
            res.status(201).send({
                notes : searchResults,
                profileImg: req.user.profileImage,
            });
        }
        else
        {
            res.status(404).send({
                error : "search not working"
            });
        }
        
    }
    catch (error) {
        console.log(error);
    }
}