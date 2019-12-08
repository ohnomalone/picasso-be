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
		it('should be able to return 200 status and all the catalogs for a specific user - happy path', async () => {
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

	describe('GET /api/v1/users/:userId/catalogs/:catalogId', () => {
		it('should be able to return a specific catalog for a specific user - happy path', async () => {
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

		it('should return a 404 status and the message, "Catalog not found" - sad path', async () => {
			// Setup
			const user = await database('users').first();
			const usersId = user.id;
			const invalidId = -1;

			// Execution
			const response = await request(app).get(
				`/api/v1/users/${usersId}/catalogs/${invalidId}`
			);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe('Catalog not found');
		});
	});

	describe('GET /api/v1/users/userId/catalogs/:catalogId/palettes', () => {
		it('should be able to return all the palettes inside a specific catalog - happy path', async () => {
			const palette = await database('palettes').first();
			const { catalog_id } = palette;
			const userId = 1;

			const response = await request(app).get(
				`/api/v1/users/${userId}/catalogs/${catalog_id}/palettes`
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

		it('should return a 404 status and the message, "No palettes were found" - sad path', async () => {
			// Setup
			const invalidId = -1;
			// Execution
			const response = await request(app).get(
				`/api/v1/users/${invalidId}/catalogs/${invalidId}/palettes`
			);
			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe('No palettes were found');
		});
	});

	describe('GET /api/v1/users/:usersId/catalogs/:catalogId/palettes/:paletteId', () => {
		it('should be able to return a specific palette - happy path', async () => {
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
	});

	describe('GET /api/v1/searchdatabase/?', () => {
		it('should return a 200 status and the palette - happy path', async () => {
			// Setup
			const user = await database('users').first();
			const userId = user.id;
			const catalog = await database('catalogs')
				.where('user_id', userId)
				.first();
			const catalogId = catalog.id;
			const palette = await database('palettes')
				.where('catalog_id', catalogId)
				.first();
			const dbToSearch = 'palettes';
			const id = palette.id;

			// Execution
			const response = await request(app).get(
				`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`
			);

			// Expectation
			expect(response.status).toBe(200);
			expect(response.body[0].id).toEqual(palette.id);
		});

		it('should return a 200 status and the catalog - happy path', async () => {
			// Setup
			const user = await database('users').first();
			const userId = user.id;
			const catalog = await database('catalogs')
				.where('user_id', userId)
				.first();
			const id = catalog.id;
			const dbToSearch = 'catalogs';

			// Execution
			const response = await request(app).get(
				`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`
			);

			// Expectation
			expect(response.status).toBe(200);
			expect(response.body[0].id).toEqual(catalog.id);
		});

		it('should return a 404 status and the message "catalog not found" - sad path', async () => {
			// Setup
			const id = -1;
			const dbToSearch = 'catalogs';

			// Execution
			const response = await request(app).get(
				`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`
			);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toEqual('catalog not found');
		});

		it('should return a 404 status and the message "palette not found" - sad path', async () => {
			// Setup
			const id = -1;
			const dbToSearch = 'palettes';

			// Execution
			const response = await request(app).get(
				`/api/v1/searchdatabase/?database=${dbToSearch}&id=${id}`
			);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toEqual('palette not found');
		});
	});

	describe('POST /api/v1/login', () => {
		it('should be able to return a 200 status and user id and first name if username and poassword match - happy path', async () => {
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

		it('should be able to return a 400 status and message, "Incorrect Password" - sad path', async () => {
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

		it('should be able to return a 400 status and message, "Email not found" - sad path', async () => {
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

	describe('POST /api/v1/users', () => {
		it('should be able to return a 201 status and create a new user - happy path', async () => {
			// Setup
			const newUser = {
				firstName: 'Sandler',
				lastName: 'McCalsin',
				email: 'SadieMcCaslin@gmail.com',
				password: '123456'
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/`)
				.send(newUser);

			// Expectation
			expect(response.status).toBe(201);
			expect(response.body.firstName).toBe(newUser.firstName);
		});

		it('should be able to return a 422 status and respond with error message - sad path', async () => {
			// Setup
			const newUser = {
				firstName: 'Sadie',
				lastName: 'McCalsin',
				password: '123456'
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/`)
				.send(newUser);

			// Expectation
			expect(response.status).toBe(422);
			expect(response.body.error.length).toBe(238);
		});

		it('should be able to return a 422 status and respond with error message, "The request could not be completed due to email already in use" - sad path', async () => {
			// Setup
			const existingUser = {
				firstName: 'Edwin',
				lastName: 'Del Bosque',
				email: 'edwinbosq@gmail.com',
				password: '123456'
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/`)
				.send(existingUser);

			// Expectation
			expect(response.status).toBe(422);
			expect(response.body.error).toBe(
				'The request could not be completed due to email already in use'
			);
		});
	});

	describe('POST /api/v1/users/:userId/catalogs', () => {
		it('should be able to return a 201 status and create a new catalog - happy path', async () => {
			// Setup
			const user = await database('users').first();
			const userId = user.id;

			const newCatalog = {
				catalogName: 'Something Something',
				user_id: userId
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/${userId}/catalogs`)
				.send(newCatalog);

			// Expectation
			expect(response.status).toBe(201);
			expect(response.body.catalogName).toBe(newCatalog.catalogName);
		});

		it('should be able to return a 422 status and respond with error message - sad path', async () => {
			// Setup
			const newCatalog = {
				catalogName: 'Something Something'
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/-1/catalogs`)
				.send(newCatalog);

			// Expectation
			expect(response.status).toBe(422);
			expect(response.body.error.length).toBe(99);
		});
	});

	describe('POST /api/v1/users/:userId/catalogs/:catalogId/palettes', () => {
		it('should be able to return a 201 status and create a new palette - happy path', async () => {
			// Setup
			const catalog = await database('catalogs').first();
			const catalogId = catalog.id;

			const newPalette = {
				paletteName: 'Something Something',
				color1: JSON.stringify({ hex: '1214312', rbg: '123, 132, 423' }),
				color2: JSON.stringify({ hex: '1214312', rbg: '123, 132, 423' }),
				color3: JSON.stringify({ hex: '1214312', rbg: '123, 132, 423' }),
				color4: JSON.stringify({ hex: '1214312', rbg: '123, 132, 423' }),
				color5: JSON.stringify({ hex: '1214312', rbg: '123, 132, 423' }),
				catalog_id: catalogId
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/1234/catalogs/${catalogId}/palettes`)
				.send(newPalette);

			// Expectation
			expect(response.status).toBe(201);
			expect(response.body.paletteName).toBe(newPalette.paletteName);
		});

		it('should be able to return a 422 status and respond with error message - sad path', async () => {
			// Setup
			const newPalette = {
				paletteName: 'Something Something'
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/1234/catalogs/-1/palettes`)
				.send(newPalette);

			// Expectation
			expect(response.status).toBe(422);
			expect(response.body.error.length).toBe(196);
		});
	});

	describe('PATCH /api/v1/users/:usersId/catalogs/:catalogId', () => {
		it('should upate the name of a catalog - happy path', async () => {
			// Setup
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

		it('should be able to return a status of 404 when the catalog is not found - sad path', async () => {
			// Setup
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
			expect(response.body.error).toBe(
				'Catalog not found - unable to update catalog name'
			);
		});
	});

	describe('PATCH /api/v1/users/:usersId/catalogs/:catalogId/palettes/paletteId', () => {
		it('should upate the name of a palette - happy path', async () => {
			// Setup
			const catalog = await database('catalogs').first();
			const catalogId = catalog.id;

			const palette = await database('palettes')
				.where('catalog_id', catalogId)
				.first();
			const paletteId = palette.id;
			const newBatch = { paletteName: 'Jesusmina' };

			// Execution
			const response = await request(app)
				.patch(`/api/v1/users/2345/catalogs/${catalogId}/palettes/${paletteId}`)
				.send(newBatch);
			const result = response.body;

			// Expectation
			expect(response.status).toBe(200);
			expect(result).toEqual(newBatch);
		});

		it('should be able to return a status of 404 when the palette is not found - sad path', async () => {
			// Setup
			const catalog = await database('catalogs').first();
			const catalogId = catalog.id;
			const newBatch = { paletteName: 'Jesusmina' };
			const invalidId = -1;

			// Execution
			const response = await request(app)
				.patch(`/api/v1/users/1234/catalogs/${invalidId}/palettes/${invalidId}`)
				.send(newBatch);

			// Expectation
			expect(response.status).toBe(404);
			expect(response.body.error).toBe(
				'Palette not found - unable to update palette'
			);
		});
	});
});
