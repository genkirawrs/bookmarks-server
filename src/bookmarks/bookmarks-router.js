const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')


const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, description, url, rating } = req.body;
    if (!title) {
      logger.error(`Title is required`);
      return res
        .status(400)
        .send('Invalid data: title is required');
    }

    if (!description) {
      logger.error(`Content is required`);
      return res
        .status(400)
        .send('Invalid data: description is required');
    }

    if (!rating) {
      logger.error(`Content is required`);
      return res
        .status(400)
        .send('Invalid data: rating is required');
    }

    if (!url) {
      logger.error(`Content is required`);
      return res
        .status(400)
        .send('Invalid data: a url is required');
    }

    if (typeof rating !== 'number') {
      logger.error(`Rating is required`);
      return res
        .status(400)
        .send('Invalid data: rating must be a number');
    }

    const id = uuid();

    const newBookmark = {
      id,
      title,
      description,
      url,
      rating
    };

    bookmarks.push(newBookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(newBookmark);
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Sorry, Bookmark Not Found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if ( bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);

    res
      .status(204)
      .end();
  })

module.exports = bookmarksRouter
