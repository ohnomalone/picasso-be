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
		it('should be able to return all the catalogs for a specific user', async () => {
			// Setup
			const user = await database('users').first();
			const { id } = user;

			// Execution
			const response = await request(app).get(`/api/v1/users/${id}/catalogs`);
			const catalogs = await database('catalogs')
				.where('user_id', id)
				.select()
				.map(catalog => {
					const { id, catalogName, user_id } = catalog;
					return { id, catalogName, user_id };
				});

			const receivedCatalogs = response.body.map(catalog => {
				const { id, catalogName, user_id } = catalog;
				return { id, catalogName, user_id };
			});

			// Expectation
			expect(response.status).toEqual(200);
			expect(receivedCatalogs).toEqual(catalogs);
		});
	});

	describe('GET /api/v1/users/:userId/catalogs/:catalogId', () => {
		it('should be able to return a specific catalog for a specific user', async () => {
			// SETUP
			const catalog = await database('catalogs').first();
			const { user_id, id } = catalog;

			// Execution
			const response = await request(app).get(
				`/api/v1/users/${user_id}/catalogs/${id}`
			);

			const receivedResponse = response.body.map(catalog => {
				const { id, catalogName, user_id } = catalog;
				return { id, catalogName, user_id };
			});

			const expectedCatalog = await database('catalogs')
				.where('user_id', user_id)
				.where('id', id)
				.select()
				.map(catalog => {
					const { id, catalogName, user_id } = catalog;
					return { id, catalogName, user_id };
				});

			// Expectation
			expect(response.status).toEqual(200);
			expect(receivedResponse).toEqual(expectedCatalog);
		});
	});

	describe('GET /api/v1/catalogs/:catalogId/palettes', () => {
		it('should be able to return all the palettes inside a specific catalog', async () => {
			const palette = await database('palettes').first();
			const { catalog_id } = palette;

			const response = await request(app).get(
				`/api/v1/catalogs/${catalog_id}/palettes`
			);

			const receivedResponse = response.body.map(catalog => {
				const {
					id,
					paletteName,
					catalog_id,
					color1,
					color2,
					color3,
					color4,
					color5
				} = catalog;
				return {
					id,
					paletteName,
					catalog_id,
					color1,
					color2,
					color3,
					color4,
					color5
				};
			});

			const expectedPalettes = await database('palettes')
				.where('catalog_id', catalog_id)
				.select()
				.map(catalog => {
					const {
						id,
						paletteName,
						catalog_id,
						color1,
						color2,
						color3,
						color4,
						color5
					} = catalog;
					return {
						id,
						paletteName,
						catalog_id,
						color1,
						color2,
						color3,
						color4,
						color5
					};
				});

			expect(response.status).toEqual(200);
			expect(receivedResponse).toEqual(expectedPalettes);
		});
	});

	describe('GET /api/v1/users/:id/catalogs', () => {
		it('should be able to return a 200 status and all the catalogs for a specific user - happy path', async () => {
			// SETUP
			const user = await database('users').first();
			const { id } = user;

			// Execution
			const response = await request(app).get(`/api/v1/users/${id}/catalogs`);
			const catalogs = await database('catalogs')
				.where('user_id', id)
				.select();

			// Expectation
			expect(response.status).toBe(200);
			expect(response.body.length).toEqual(catalogs.length);
		});

		it('should return a 404 status and the message, "Catalogs not found" - sad path', async () => {
			// Setup
			const invalidId = -1;
			// Execution
			const response = await request(app).get(
				`/api/v1/users/${invalidId}/catalogs`
			);
			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe('Catalogs not found');
		});
	});

	describe('GET /api/v1/users/:usersId/catalogs/:catalogId/palettes/:paletteId', () => {
		it('should be able to return a specific palette', async () => {
			// SETUP
			const user = await database('users').first();
			const usersId = user.id;
			const catalog = await database('catalogs')
				.where('user_id', usersId)
				.select()
				.first();
			const catalogId = catalog.id;
			const palette = await database('palettes')
				.where('catalog_id', catalogId)
				.select()
				.first();
			const paletteId = palette.id;

			// Execution
			const response = await request(app).get(
				`/api/v1/users/${usersId}/catalogs/${catalogId}/palettes/${paletteId}`
			);

			// Expectation
			expect(response.status).toBe(200);
			expect(response.body[0].id).toEqual(palette.id);
		});
	});

	it('should return a 404 status and the message, "Cannot get palette" - sad path', async () => {
		// Setup
		const user = await database('users').first();
		const usersId = user.id;
		const catalog = await database('catalogs')
			.where('user_id', usersId)
			.select()
			.first();
		const catalogId = catalog.id;
		const invalidId = -1;

		// Execution
		const response = await request(app).get(
			`/api/v1/users/${usersId}/catalogs/${catalogId}/palettes/${invalidId}`
		);

		// Expectation
		expect(response.status).toBe(404);
		expect(response.body.error).toBe('Cannot get palette');
	});

	describe('POST /api/v1/login', () => {
		it('should be able to return a 200 status and user id and first name if username and poassword match', async () => {
			// Setup
			const loginCredentials = {
				email: 'winteriscoming@gmail.com',
				password: 'edwinissagenius'
			};

			const currentUser = await database('users')
				.where('email', loginCredentials.email)
				.select();
			const expectedReturn = {
				firstName: 'Quinne',
				id: `${currentUser.id}`
			};

			// Execution
			const response = await request(app)
				.post('/api/v1/login')
				.send(loginCredentials);

			// Expectation
			expect(response.status).toBe(200);
			expect(response.body.firstName).toEqual(expectedReturn.firstName);
		});

		it('should be able to return a 400 status and message, "Incorrect Password"', async () => {
			// Setup
			const loginCredentials = {
				email: 'winteriscoming@gmail.com',
				password: 'notCorrectPassword'
			};

			// Execution
			const response = await request(app)
				.post('/api/v1/login')
				.send(loginCredentials);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe('Incorrect Password');
		});

		it('should be able to return a 400 status and message, "Email not found"', async () => {
			// Setup
			const loginCredentials = {
				email: 'emailDoesNotExist@gmail.com',
				password: 'notCorrectPassword'
			};

			// Execution
			const response = await request(app)
				.post('/api/v1/login')
				.send(loginCredentials);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe('Email not found');
		});
	});

	describe('PATCH /api/v1/users/:usersId/catalogs/:catalogId', () => {
		it('should upate the name of a catalog', async () => {
			// setup
			const user = await database('users').first();
			const userId = user.id;

			const catalog = await database('catalogs')
				.where('user_id', userId)
				.first();
			const catalogId = catalog.id;
			const newName = { newName: 'Baby Beluga' };

			// Execution
			const response = await request(app)
				.patch(`/api/v1/users/${userId}/catalogs/${catalogId}`)
				.send(newName);
			const result = response.body;

			// Expectation
			expect(response.status).toBe(200);
			expect(result).toEqual(newName);
		});

		it('should be able to return a status of 404 when the catalog is not found', async () => {
			// setup
			const user = await database('users').first();
			const userId = user.id;
			const newName = { newName: 'Baby Beluga' };
			const catalogId = -1;

			// Execution
			const response = await request(app)
				.patch(`/api/v1/users/${userId}/catalogs/${catalogId}`)
        .send(newName);
        
        // Expectation
      expect(response.status).toBe(404);
			expect(response.body.error).toBe('Catalog not found - unable to update catalog name');
		});
  });
  
  describe('POST /api/v1/users', () => {
    it('should be able to return a 201 status and create a new user', async () => {
      // setup
      const newUser  = {
        firstName: 'Sandler',
        lastName: 'McCalsin',
        email: 'SadieMcCaslin@gmail.com',
        password: '123456'
      }

      // Execution
			const response = await request(app)
      .post(`/api/v1/users/`)
      .send(newUser);

      // Expectation
      expect(response.status).toBe(201);
      expect(response.body.firstName).toBe(newUser.firstName);
    })

    it('should be able to return a 422 status and respond with error message', async () => {
      // setup
      const newUser  = {
        firstName: 'Sadie',
        lastName: 'McCalsin',
        password: '123456'
      }

      // Execution
			const response = await request(app)
      .post(`/api/v1/users/`)
      .send(newUser);

      // Expectation
      expect(response.status).toBe(422);
      expect(response.body.error.length).toBe(238);
    })

    it('should be able to return a 422 status and respond with error message, "The request could not be completed due to email already in use"', async () => {
      // setup
      const existingUser  = {
        firstName: 'Edwin',
        lastName: 'Del Bosque',
        email: 'edwinbosq@gmail.com',
        password: '123456'
      }


      // Execution
			const response = await request(app)
      .post(`/api/v1/users/`)
      .send(existingUser);

      // Expectation
      expect(response.status).toBe(422);
      expect(response.body.error).toBe("The request could not be completed due to email already in use");
    })
  })

  describe('GET /api/v1/searchdatabase/?', () => {
	  it('should return a 200 status and the palette', async () => {
		// setup
		const user = await database('users').first();
		const userId = user.id;
		const catalog = await database('catalogs')
			.where('user_id', userId)
			.first();
		const catalogId = catalog.id
		const palette = await database('palettes').where('catalog_id', catalogId).first()
		const dbToSearch = 'palettes'
		const id = palette.id
		
		
		// Execution
		const response = await request(app).get(`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`);
		
		// Expectation
		expect(response.status).toBe(200);
		expect(response.body[0].id).toEqual(palette.id);
	  })

	  it('should return a 200 status and the catalog', async () => {
		// setup
		const user = await database('users').first();
		const userId = user.id;
		const catalog = await database('catalogs')
			.where('user_id', userId)
			.first();
		const id = catalog.id
		const dbToSearch = 'catalogs'
		
		// Execution
		const response = await request(app).get(`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`);
		
		// Expectation
		expect(response.status).toBe(200);
		expect(response.body[0].id).toEqual(catalog.id);
	  })

	  it('should return a 404 status and the message "catalog not found"', async () => {
		// setup
		const id = -1
		const dbToSearch = 'catalogs'
		
		// Execution
		const response = await request(app).get(`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`);
		
		// Expectation
		expect(response.status).toBe(404);
		expect(response.body.error).toEqual('catalog not found');
	  })

	  it('should return a 404 status and the message "palette not found"', async () => {
		// setup
		const id = -1
		const dbToSearch = 'palettes'
		
		// Execution
		const response = await request(app).get(`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`);
		
		// Expectation
		expect(response.status).toBe(404);
		expect(response.body.error).toEqual('palette not found');
	  })
  })

});
