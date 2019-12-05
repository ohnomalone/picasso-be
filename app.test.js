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
            // SETUP
            const user = await database('users').first();
            const { id } = user;
            
            // Execution
            const response = await request(app).get(`/api/v1/users/${id}/catalogs`)
            const catalogs = await database('catalogs').where('user_id', id).select();

            // Expectation
            expect(response.status).toEqual(200);
            expect(response.body).toEqual(catalogs);
        })
    })
});
