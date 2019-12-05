import express from 'express';
import cors from 'cors';

const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.locals.title = 'picasso palette picker';
app.use(cors());
app.use(express.json());

// All endpoints live here

app.get('/', (request, response) => {
	response.send("We're going to test all the routes!");
});

app.get('/api/v1/users/:id/catalogs', async (request, response) => {
	try {
		const catalogs = await database('catalogs')
			.where('user_id', request.params.id)
			.select();
		if (catalogs.length) {
			response.status(200).json(catalogs);
		} else {
			return response.status(404).send({ error: 'Catalogs not found' });
		}
	} catch (error) {
		response.status(500).json({ error });
	}
});

app.get(
	'/api/v1/users/:userId/catalogs/:catalogId',
	async (request, response) => {
		try {
			const { catalogId, userId } = request.params;
			const catalog = await database('catalogs')
				.where('id', catalogId)
				.where('user_id', userId)
				.select();
			if (catalog.length) {
				response.status(200).json(catalog);
			} else {
				return response.status(404).send({ error: 'Catalog not found' });
			}
		} catch (error) {
			response.status(500).json({ error });
		}
	}
);

app.get('/api/v1/catalogs/:catalogId/palettes', async (request, response) => {
	try {
		const { userId, catalogId } = request.params;
		const palettes = await database('palettes')
			.where('catalog_id', catalogId)
			.select();
		if (palettes.length) {
			response.status(200).json(palettes);
		} else {
			return response.status(404).send({ error: 'No palettes were found' });
		}
	} catch (error) {
		response.status(500).json({ error });
	}
});

export default app;
