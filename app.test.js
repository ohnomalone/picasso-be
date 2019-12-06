import '@babel/polyfill'; // allows us to rewrite code for older browsers - check in package.json
import request from 'supertest';
import app from './app';
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

describe('Server', () => {
	beforeEach(async () => {
		await database.seed.run();
	});
	describe('init', () => {
		it('should return a 200 status', async () => {
			const res = await request(app).get('/');
			expect(res.status).toBe(200);
		});
    });
    
    describe('GET /api/v1/users/:id/catalogs', () => {
        it('should be able to return a 200 status and all the catalogs for a specific user - happy path', async () => {
            // SETUP
            const user = await database('users').first();
            const { id } = user;
            
            // Execution
            const response = await request(app).get(`/api/v1/users/${id}/catalogs`)
            const catalogs = await database('catalogs').where('user_id', id).select();

            // Expectation
            expect(response.status).toBe(200);
            expect(response.body.length).toEqual(catalogs.length);
        })

        it('should return a 404 status and the message, "Cannot get Catalogs, User not found" - sad path', async () => {
            // Setup
            const invalidId = -1
            // Execution
            const response = await request(app).get(`/api/v1/users/${invalidId}/catalogs`)
            // Expectation
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Cannot get Catalogs, User not found")
          });
    })

    describe('GET /api/v1/users/:usersId/catalogs/:catalogId/palettes/:paletteId', () => {
        it('should be able to return a specific palette', async () => {
            // SETUP
            const user = await database('users').first();
            const usersId = user.id
            const catalog = await database('catalogs').where('user_id', usersId).select().first()
            const catalogId = catalog.id
            const palette = await database('palettes').where('catalog_id', catalogId).select().first()
            const paletteId = palette.id
            
            // Execution
            const response =  await request(app).get(`/api/v1/users/${usersId}/catalogs/${catalogId}/palettes/${paletteId}`)
            
            // Expectation
            expect(response.status).toBe(200)
            expect(response.body[0].id).toEqual(palette.id)

        })
    })

    it('should return a 404 status and the message, "Cannot get palette" - sad path', async () => {
        // Setup
        const user = await database('users').first();
        const usersId = user.id
        const catalog = await database('catalogs').where('user_id', usersId).select().first()
        const catalogId = catalog.id
        const invalidId = -1

        // Execution
        const response =  await request(app).get(`/api/v1/users/${usersId}/catalogs/${catalogId}/palettes/${invalidId}`)

        // Expectation
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Cannot get palette")
      });

      describe('POST /api/v1/login', () => {
          it('should be able to return a 200 status and user id and first name if username and poassword match', async () => {
            // Setup
            const loginCredentials = {
                email: "winteriscoming@gmail.com",
                password: "edwinissagenius"
            }

            const currentUser = await database('users').where('email', loginCredentials.email).select();
            const expectedReturn = {
                firstName: "Quinne",
                id: `${currentUser.id}`
            }

            // Execution
            const response =  await request(app).post('/api/v1/login').send(loginCredentials)

            // Expectation
            expect(response.status).toBe(200)
            console.log(response.body, expectedReturn.firstName);
            
            expect(response.body.firstName).toEqual(expectedReturn.firstName)

          })

          it('should be able to return a 400 status and message, "Incorrect Password"', async () => {
            // Setup
            const loginCredentials = {
                email: "winteriscoming@gmail.com",
                password: "notCorrectPassword"
            }

            // Execution
            const response =  await request(app).post('/api/v1/login').send(loginCredentials)

            // Expectation
            expect(response.status).toBe(404)
            expect(response.body.error).toBe("Incorrect Password")
          })

          it('should be able to return a 400 status and message, "Email not found"', async () => {
            // Setup
            const loginCredentials = {
                email: "emailDoesNotExist@gmail.com",
                password: "notCorrectPassword"
            }

            // Execution
            const response =  await request(app).post('/api/v1/login').send(loginCredentials)

            // Expectation
            expect(response.status).toBe(404)
            expect(response.body.error).toBe("Email not found")
          })
      })

      describe('PATCH /api/v1/users/:usersId/catalogs/:catalogId', () => {
          it('should upate the name of a catalog', async () => {
            // setup
            const user = await database('users').first();
            const userId = user.id
            
            const catalog = await database('catalogs').where('user_id', userId).first()
            const catalogId = catalog.id
            const newName = { newName: "Baby Beluga"}
            
            // Execution
            const response = await request(app).patch(`/api/v1/users/${userId}/catalogs/${catalogId}`).send(newName)
            const result = response.body
            
            // Expectation
            expect(response.status).toBe(200)
            expect(result).toEqual(newName)
          })

          it.only('should be able to return a status of 404 when the catalog is not found', async () => {
            // setup
            const user = await database('users').first();
            const userId = user.id
            const catalogId = -1
             // Execution
             const response = await request(app).patch(`/api/v1/users/${userId}/catalogs/${catalogId}`).send(newName)
           
          })
      })



});
