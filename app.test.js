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
		it.only('should be able to return a 201 status and create a new palette - happy path', async () => {
			// Setup
			const catalog = await database('catalogs').first();
			const catalogId = catalog.id;
			console.log(catalogId);
			

			const newPalette = {
				paletteName: 'Something Something',
				catalog_id: catalogId,
				colors: JSON.stringify([
					{
					  "XYZ": {
						"fraction": {
						  "X": 0.624636862745098,
						  "Y": 0.6834392156862745,
						  "Z": 0.7964952941176472
						},
						"value": "XYZ(62, 68, 80)",
						"X": 62,
						"Y": 68,
						"Z": 80
					  },
					  "cmyk": {
						"fraction": {
						  "c": 0.21808510638297884,
						  "m": 0.03723404255319151,
						  "y": 0,
						  "k": 0.26274509803921564
						},
						"value": "cmyk(22, 4, 0, 26)",
						"c": 22,
						"m": 4,
						"y": 0,
						"k": 26
					  },
					  "hex": {
						"value": "#93B5BC",
						"clean": "93B5BC"
					  },
					  "hsl": {
						"fraction": {
						  "h": 0.5284552845528455,
						  "s": 0.23428571428571443,
						  "l": 0.6568627450980392
						},
						"h": 190,
						"s": 23,
						"l": 66,
						"value": "hsl(190, 23%, 66%)"
					  },
					  "hsv": {
						"fraction": {
						  "h": 0.5284552845528455,
						  "s": 0.21808510638297884,
						  "v": 0.7372549019607844
						},
						"value": "hsv(190, 22%, 74%)",
						"h": 190,
						"s": 22,
						"v": 74
					  },
					  "rgb": {
						"fraction": {
						  "r": 0.5764705882352941,
						  "g": 0.7098039215686275,
						  "b": 0.7372549019607844
						},
						"r": 147,
						"g": 181,
						"b": 188,
						"value": "rgb(147, 181, 188)"
					  },
					  "name": {
						"value": "Pewter Blue",
						"closest_named_hex": "#8BA8B7",
						"exact_match_name": false,
						"distance": 428
					  }
					},
					{
					  "XYZ": {
						"fraction": {
						  "X": 0.4909266666666666,
						  "Y": 0.5129113725490195,
						  "Z": 0.752076862745098
						},
						"value": "XYZ(49, 51, 75)",
						"X": 49,
						"Y": 51,
						"Z": 75
					  },
					  "cmyk": {
						"fraction": {
						  "c": 0.4043715846994535,
						  "m": 0.27868852459016386,
						  "y": 0,
						  "k": 0.2823529411764706
						},
						"value": "cmyk(40, 28, 0, 28)",
						"c": 40,
						"m": 28,
						"y": 0,
						"k": 28
					  },
					  "hex": {
						"value": "#6D84B7",
						"clean": "6D84B7"
					  },
					  "hsl": {
						"fraction": {
						  "h": 0.6148648648648648,
						  "s": 0.33944954128440374,
						  "l": 0.5725490196078431
						},
						"h": 221,
						"s": 34,
						"l": 57,
						"value": "hsl(221, 34%, 57%)"
					  },
					  "hsv": {
						"fraction": {
						  "h": 0.6148648648648648,
						  "s": 0.40437158469945356,
						  "v": 0.7176470588235294
						},
						"value": "hsv(221, 40%, 72%)",
						"h": 221,
						"s": 40,
						"v": 72
					  },
					  "rgb": {
						"fraction": {
						  "r": 0.42745098039215684,
						  "g": 0.5176470588235295,
						  "b": 0.7176470588235294
						},
						"r": 109,
						"g": 132,
						"b": 183,
						"value": "rgb(109, 132, 183)"
					  },
					  "name": {
						"value": "Ship Cove",
						"closest_named_hex": "#788BBA",
						"exact_match_name": false,
						"distance": 311
					  }
					},
					{
					  "XYZ": {
						"fraction": {
						  "X": 0.42004431372549017,
						  "Y": 0.46437019607843133,
						  "Z": 0.7241827450980391
						},
						"value": "XYZ(42, 46, 72)",
						"X": 42,
						"Y": 46,
						"Z": 72
					  },
					  "cmyk": {
						"fraction": {
						  "c": 0.5875706214689266,
						  "m": 0.28813559322033894,
						  "y": 0,
						  "k": 0.3058823529411765
						},
						"value": "cmyk(59, 29, 0, 31)",
						"c": 59,
						"m": 29,
						"y": 0,
						"k": 31
					  },
					  "hex": {
						"value": "#497EB1",
						"clean": "497EB1"
					  },
					  "hsl": {
						"fraction": {
						  "h": 0.581730769230769,
						  "s": 0.41600000000000004,
						  "l": 0.49019607843137253
						},
						"h": 209,
						"s": 42,
						"l": 49,
						"value": "hsl(209, 42%, 49%)"
					  },
					  "hsv": {
						"fraction": {
						  "h": 0.581730769230769,
						  "s": 0.5875706214689266,
						  "v": 0.6941176470588235
						},
						"value": "hsv(209, 59%, 69%)",
						"h": 209,
						"s": 59,
						"v": 69
					  },
					  "rgb": {
						"fraction": {
						  "r": 0.28627450980392155,
						  "g": 0.49411764705882355,
						  "b": 0.6941176470588235
						},
						"r": 73,
						"g": 126,
						"b": 177,
						"value": "rgb(73, 126, 177)"
					  },
					  "name": {
						"value": "Steel Blue",
						"closest_named_hex": "#4682B4",
						"exact_match_name": false,
						"distance": 114
					  }
					},
					{
					  "XYZ": {
						"fraction": {
						  "X": 0.24699725490196078,
						  "Y": 0.24557019607843134,
						  "Z": 0.431363137254902
						},
						"value": "XYZ(25, 25, 43)",
						"X": 25,
						"Y": 25,
						"Z": 43
					  },
					  "cmyk": {
						"fraction": {
						  "c": 0.5046728971962616,
						  "m": 0.42990654205607476,
						  "y": 0,
						  "k": 0.580392156862745
						},
						"value": "cmyk(50, 43, 0, 58)",
						"c": 50,
						"m": 43,
						"y": 0,
						"k": 58
					  },
					  "hex": {
						"value": "#353D6B",
						"clean": "353D6B"
					  },
					  "hsl": {
						"fraction": {
						  "h": 0.6419753086419754,
						  "s": 0.3375,
						  "l": 0.3137254901960784
						},
						"h": 231,
						"s": 34,
						"l": 31,
						"value": "hsl(231, 34%, 31%)"
					  },
					  "hsv": {
						"fraction": {
						  "h": 0.6419753086419754,
						  "s": 0.5046728971962616,
						  "v": 0.4196078431372549
						},
						"value": "hsv(231, 50%, 42%)",
						"h": 231,
						"s": 50,
						"v": 42
					  },
					  "rgb": {
						"fraction": {
						  "r": 0.20784313725490197,
						  "g": 0.23921568627450981,
						  "b": 0.4196078431372549
						},
						"r": 53,
						"g": 61,
						"b": 107,
						"value": "rgb(53, 61, 107)"
					  },
					  "name": {
						"value": "Rhino",
						"closest_named_hex": "#2E3F62",
						"exact_match_name": false,
						"distance": 432
					  }
					},
					{
					  "XYZ": {
						"fraction": {
						  "X": 0.09798431372549019,
						  "Y": 0.09173254901960784,
						  "Z": 0.2203078431372549
						},
						"value": "XYZ(10, 9, 22)",
						"X": 10,
						"Y": 9,
						"Z": 22
					  },
					  "cmyk": {
						"fraction": {
						  "c": 0.6964285714285715,
						  "m": 0.607142857142857,
						  "y": 0,
						  "k": 0.7803921568627451
						},
						"value": "cmyk(70, 61, 0, 78)",
						"c": 70,
						"m": 61,
						"y": 0,
						"k": 78
					  },
					  "hex": {
						"value": "#111638",
						"clean": "111638"
					  },
					  "hsl": {
						"fraction": {
						  "h": 0.6452991452991452,
						  "s": 0.5342465753424658,
						  "l": 0.14313725490196078
						},
						"h": 232,
						"s": 53,
						"l": 14,
						"value": "hsl(232, 53%, 14%)"
					  },
					  "hsv": {
						"fraction": {
						  "h": 0.6452991452991452,
						  "s": 0.6964285714285715,
						  "v": 0.2196078431372549
						},
						"value": "hsv(232, 70%, 22%)",
						"h": 232,
						"s": 70,
						"v": 22
					  },
					  "rgb": {
						"fraction": {
						  "r": 0.06666666666666667,
						  "g": 0.08627450980392157,
						  "b": 0.2196078431372549
						},
						"r": 17,
						"g": 22,
						"b": 56,
						"value": "rgb(17, 22, 56)"
					  },
					  "name": {
						"value": "Haiti",
						"closest_named_hex": "#1B1035",
						"exact_match_name": false,
						"distance": 801
					  }
					}
				  ])
			};

			// Execution
			const response = await request(app)
				.post(`/api/v1/users/1234/catalogs/${catalogId}/palettes`)
				.send(newPalette);

			// Expectation
			// expect(response.status).toBe(201);
			// expect(response.body.paletteName).toBe(newPalette.paletteName);
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

	describe('DELETE /api/v1/users/:userId/catalogs/:catalogId/palettes/:paletteId', () => {
		it('should delete a palette - happy path', async () => {
			// Setup
			const catalog = await database('catalogs').first();
			const catalogId = catalog.id;

			const palette = await database('palettes')
				.where('catalog_id', catalogId)
				.first();
			const paletteId = palette.id;

			// Execution
			const response = await request(app).delete(
				`/api/v1/users/2345/catalogs/${catalogId}/palettes/${paletteId}`
			);

			const result = response.body;

			// Expectation
			expect(response.status).toBe(202);
			expect(result).toEqual(`Palette ${paletteId} was successfully removed`);
		});

		it('should be able to return a status of 404 when the palette is not found - sad path', async () => {
			// Setup
			const catalogId = -1;

			const palette = await database('palettes').first();
			const paletteId = palette.id;

			// Execution
			const response = await request(app).delete(
				`/api/v1/users/2345/catalogs/${catalogId}/palettes/${paletteId}`
			);

			const result = response.body;

			// Expectation
			expect(response.status).toBe(204);
			expect(result).toEqual({});
		});
	});

	describe('DELETE /api/v1/users/:userId/catalogs/:catalogId', () => {
		it('should delete a palette - happy path', async () => {
			// Setup
			const user = await database('users').first();
			const userId = user.id;

			const catalog = await database('catalogs')
				.where('user_id', userId)
				.first();
			const catalogId = catalog.id;

			// Execution
			const response = await request(app).delete(
				`/api/v1/users/${userId}/catalogs/${catalogId}`
			);

			const result = response.body;


			// Expectation
			expect(response.status).toBe(202);
			expect(result).toEqual(`Catalog ${catalogId} was successfully removed`);
		});

		it('should be able to return a status of 404 when the palette is not found - sad path', async () => {
			// Setup
			const catalogId = -1;

			const palette = await database('palettes').first();
			const paletteId = palette.id;

			// Execution
			const response = await request(app).delete(
				`/api/v1/users/2345/catalogs/${catalogId}`
			);

			const result = response.body;

			// Expectation
			expect(response.status).toBe(204);
			expect(result).toEqual({});
		});
	});
});
