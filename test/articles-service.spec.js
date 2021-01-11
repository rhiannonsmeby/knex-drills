const { expect } = require("chai")

const ArticlesService = require('../src/articles-service')
const knex = require('knex')


describe(`Articles service object`, function() {
    let db
    let testArticles = [
        {
            id: 1,
            date_published: new Date('2029-01-22T16:28:32.615Z'),
            title: 'First test post!',
            content: 'Lorem ipsum'
        },
        {
            id: 2,
            date_published: new Date('2100-05-22T16:28:32.615Z'),
            title: 'Second test post!',
            content: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum, exercitationem cupiditate dignissimos est perspiciatis, nobis commodi alias saepe atque facilis labore sequi deleniti. Sint, adipisci facere! Velit temporibus debitis rerum.'
        },
        {
            id: 3,
            date_published: new Date('1919-12-22T16:28:32.615Z'),
            title: 'Third test post!',
            content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Possimus, voluptate? Necessitatibus, reiciendis? Cupiditate totam laborum esse animi ratione ipsa dignissimos laboriosam eos similique cumque. Est nostrum esse porro id quaerat.'
        },
    ]

    before('set up db', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    })

    //Before all tests run and after each indiv test, empty blogful_articles table
    before('clean db', () => db('blogful_articles').truncate())
    afterEach('clean db', () => db('blogful_articles').truncate())

    //After all tests run, let go of db connection
    after('destroy db connection', () => db.destroy())

    describe(`getAllArticles()`, () => {
        it(`returns an empty array`, () => {
            //test that ArticlesService.getAllArticles gets data from table
            return ArticlesService
                .getAllArticles(db)
                .then(articles => expect(articles).to.eql([]))
        })

        //Whenever we set context with data present, we should include
        //a beforeEach() hook within the context that takes care of adding
        //the appropriate data to our table
        context(`Given 'blogful_articles' has data`, () => {
            beforeEach('insert test articles', () =>
                db('blogful_articles')
                    .insert(testArticles)
            )

            it('returns all test articles', () => {
                return ArticlesService
                    .getAllArticles(db)
                    .then(articles => expect(articles).to.eql(testArticles))
            })
        })
    })

    describe('insertArticle()', () => {
        it('inserts record in db and returns article with new id', () => {
            //New article to use as subject of our test
            const newArticle = {
                title: 'Test new title',
                content: 'Test new content',
                date_published: new Date('2020-01-01T00:00:00.000Z'),
            }

            return ArticlesService.insertArticle(db, newArticle) 
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        title: newArticle.title,
                        content: newArticle.content,
                        date_published: newArticle.date_published,
                    })
                })
        })

        it('throws not-null constraint error if title not provided', () => {
            //Subject for the test does not contain a'title' field, so we
            //expect the db to prevent the record to be added
            const newArticle = {
                content: 'Test new content',
                date_published: new Date('2020-01-01T00:00:00.000Z'),
            }

            //The .then() method on a promise can optionally take a second argment:
            //The first callback occurs if the promise is resolved, which wwe've been
            //using for all our promise chains. The second occurs if promise is
            //rejected. in the following test, we EXPECT the promise to be rejected
            //as the db should throw an error due to NOT NULL constraint
            return ArticlesService
                .insertArticle(db, newArticle)
                .then(
                    () => expect.fail('db should throw error'),
                    err => expect(err.message).to.include('not-null')
                )
        })
    })

    describe('getById', () => {
        it('should return undefined', () => {
            return ArticlesService
                .getById(db, 999)
                .then(article => expect(article).to.be.undefined)
        })

        context('with data present', () => {
            before('insert articles', () => 
                db('blogful_articles')
                    .insert(testArticles)
            )

            it('should return existing article', () => {
                const expectedArticleId = 3;
                const expectedArticle = testArticles.find(a => a.id === expectedArticleId);
                return ArticlesService.getById(db, expectedArticleId)
                    .then(actual => expect(actual).to.eql(expectedArticle))
            })
        })
    })

    describe('deletedArticle()', () => {
        it('should return 0 rows affected', () => {
            return ArticlesService
                .deleteArticle(db, 999)
                .then(rowsAffected => expect(rowsAffected).to.eql(0))
        })

        context('with data present', () => {
            before('insert articles', () =>
                db('blogful_articles')
                    .insert(testArticles)
            )

            it('should return 1 row affected and record is removed from db', () => {
                const deletedArticleId = 1;

                return ArticlesService
                    .deleteArticle(db, deletedArticleId)
                    .then(rowsAffected => {
                        expect(rowsAffected).to.eq(1);
                        return db('blogful_articles').select('*');
                    })
                    .then(actual => {
                        //copy testArticles array with id 1 filtered out
                        const expected = testArticles.filter(a => a.id !== deletedArticleId)
                        expect(actual).to.eql(expected);
                    })
            })
        })
    })

    describe('updateArticle()', () => {
        it('should return 0 rows affected', () => {
            return ArticlesService
                .updateArticle(db, 999, {title: 'new title!'})
                .then(rowsAffected => expect(rowsAffected).to.eq(0))
        })

        context('with data present', () => {
            before('insert articles', () => 
                db('blogful_articles')
                    .insert(testArticles)
            )

            it('should successfully update an article', () => {
                const updatedArticleId = 1;
                const testArticle = testArticles.find(a => a.id === updatedArticleId);
                // make copy of testArticle in db, overwriting with newly updated field value 
                const updatedArticle = {...testArticle, title: 'New title!'};

                return ArticlesService
                    .updateArticle(db, updatedArticleId, updatedArticle)
                    .then(rowsAffected => {
                        expect(rowsAffected).to.eq(1)
                        return db('blogful_articles').select('*').where({id: updatedArticleId}).first();
                    })
                    .then(article => {
                        expect(article).to.eql(updatedArticle);
                    })
            })
        })
    })
})