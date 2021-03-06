const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe(`GET /api/bookmarks`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, [])
      })
    })
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, testBookmarks)
      })
    })
  })

  describe(`GET /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })
    })
  })

  describe(`POST /api/bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`,  function() {
      this.retries(3)
      const newBookmark = {
	title: 'Amazon',
        description: 'online everything store',
        url: 'https://amazon.com',
        rating: 5
      }
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
	.expect( res => {
	  expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
	  expect(res.body).to.have.property('id')
	  expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
	})
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })

    it(`responds with 400 and an error message when the 'title' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          description: 'online everything store',
          url: 'https://amazon.com',
          rating: 5
        })
        .expect(400, {
          error: { message: `Missing 'title' in request body` }
        })
    })

    it(`responds with 400 and an error message when the 'url' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
	  title: 'Amazon',
          description: 'online everything store',
          rating: 5
        })
        .expect(400, {
          error: { message: `Missing 'url' in request body` }
        })
    })

    it(`responds with 400 and an error message when the 'rating' is missing`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'Amazon',
          description: 'online everything store',
	  url: 'https://amazon.com',
        })
        .expect(400, {
          error: { message: `Missing 'rating' in request body` }
        })
    })

    it(`responds with 400 and an error message when the 'rating' is invalid`, () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({
          title: 'Amazon',
          description: 'online everything store',
          url: 'https://amazon.com',
	  rating: 7
        })
        .expect(400, {
          error: { message: `Invalid rating value` }
        })
    })

  })


  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmark_id = 123456
        return supertest(app)
          .delete(`/api/bookmarks/${bookmark_id}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()
 
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })
 
      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
	const testBookmarks = makeBookmarksArray()
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedBookmarks)
          )
      })
    })
  })

  describe.only(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()
 
      beforeEach('insert bookmarkss', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })
 
      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'GenkiRawrs',
          description: 'test description',
          url: 'https://genkirawrs.com',
          rating: 4
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'description', 'url' or 'rating'`
            }
          })
       })

       it(`responds with 204 when updating only a subset of fields`, () => {
         const idToUpdate = 2
         const updateBookmark = {
           title: 'updated bookmakr title',
         }
         const expectedBookmark = {
           ...testBookmarks[idToUpdate - 1],
           ...updateBookmark
         }

         return supertest(app)
           .patch(`/api/bookmarks/${idToUpdate}`)
           .send({
             ...updateBookmark,
             fieldToIgnore: 'should not be in GET response'
           })
           .expect(204)
           .then(res =>
             supertest(app)
               .get(`/api/bookmarks/${idToUpdate}`)
               .expect(expectedBookmark)
           )
       })


    })
  })



})
