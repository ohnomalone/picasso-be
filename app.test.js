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
});
