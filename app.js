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

app.post('/api/v1/users/:userId/catalogs', async (request, response) => {
	const newCatalog = request.body;
	for (let requiredParameter of ['catalogName', 'user_id']) {
		if (!newCatalog[requiredParameter]) {
			return response.status(422).send({
				error: `Expected format: { catalogName: <string>, user_id: <integer> }. You are missing a ${requiredParameter} property.`
			});
		}
	}

	try {
		const catalogs = await database('catalogs').insert(newCatalog, 'id');

		if (catalogs.length) {
			response.status(201).json(catalogs[0]);
		} else {
			response
				.status(404)
				.send({ error: 'The catalog could not be submitted' });
		}
	} catch (error) {
		response.status(500).json({ error });
	}
});

app.post(
	'/api/v1/users/:userId/catalogs/:catalogId/palettes',
	async (request, response) => {
		const newPalette = request.body;
		for (let requiredParameter of [
			'paletteName',
			'catalog_id',
			'color1',
			'color2',
			'color3',
			'color4',
			'color5'
		]) {
			if (!newPalette[requiredParameter]) {
				return response.status(422).send({
					error: `Expected format: { paletteName: <string>, catalog_id: <integer>, color1: <string>, color2: <string>, color3: <string>, color4: <string>, color5: <string>, }. You are missing a ${requiredParameter} property.`
				});
			}
		}

		try {
			const palettes = await database('palettes').insert(newPalette, 'id');

			if (palettes.length) {
				response.status(201).json(palettes[0]);
			} else {
				response
					.status(404)
					.send({ error: 'The catalog could not be submitted' });
			}
		} catch (error) {
			response.status(500).json({ error });
		}
	}
);

export default app;
