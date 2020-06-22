const path = require('path')
const express = require('express')
const { v4: uuid } = require('uuid')
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
  url: xss(bookmark.url),
  rating: bookmark.rating
})

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const { title, description, url, rating } = req.body;
    const newBookmark = { title, description, url, rating }

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null && key !== 'description') {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    if (typeof rating !== 'number' || (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: { message: `Invalid rating value` }
      })
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  })

bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
     BookmarksService.getById(
       req.app.get('db'),
       req.params.bookmark_id
     )
       .then(bookmark => {
         if (!bookmark) {
           return res.status(404).json({
             error: { message: `Bookmark doesn't exist` }
           })
         }
         res.bookmark = bookmark // save the bookmark for the next middleware
         next() 
       })
       .catch(next)
  })
  .get((req, res, next) => {
     res.json({
        id: res.bookmark.id,
        title: xss(res.bookmark.title), // sanitize title
        description: xss(res.bookmark.description), // sanitize description
        url: xss(res.bookmark.url), // sanitize url
        rating: res.bookmark.rating
     })
  })
  .delete((req, res, next) => {
     BookmarksService.deleteBookmark(
       req.app.get('db'),
       req.params.bookmark_id
     )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, description, url, rating } = req.body
    const bookmarkToUpdate = { title, description, url, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'description', 'url' or 'rating'`
        }
      })
    }
 
    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = bookmarksRouter
