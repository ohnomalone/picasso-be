import express from 'express';
import cors from 'cors';

const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.locals.title = 'picasso palette picker';
app.use(cors());
app.use(express.json());

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

app.get(
	'/api/v1/users/:userId/catalogs/:catalogId/palettes',
	async (request, response) => {
		try {
			const { catalogId } = request.params;
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
	}
);

app.get(
	'/api/v1/users/:userId/catalogs/:catalogId/palettes/:paletteId',
	async (request, response) => {
		try {
			const palette = await database('palettes')
				.where('id', request.params.paletteId)
				.select();

			if (palette.length) {
				response.status(200).json(palette);
			} else {
				return response.status(404).send({ error: 'Cannot get palette' });
			}
		} catch (error) {
			response.status(500).json(error);
		}
	}
);

app.get('/api/v1/searchdatabase/?', async (request, response) => {
	try {
		const itemFromDatabase = await database(`${request.query.database}`).where(
			'id',
			request.query.id
		);
		if (itemFromDatabase.length) {
			response.status(200).json(itemFromDatabase);
		} else {
			let returnWord = request.query.database.split('');
			returnWord.pop();
			return response
				.status(404)
				.send({ error: `${returnWord.join('')} not found` });
		}
	} catch {
		response.status(500).json({ error: '500: Internal Server Error' });
	}
});

app.get('/api/v1/users/:userId/palettes', async (request, response) => {
	const { userId } = request.params;
	try {
		const catalogs = await database('catalogs').where('user_id', userId)
		const allReducedPalettes = await catalogs.reduce( async (acc, catalog) => {
			if (!acc.length) {
				acc = []
				const palettes = await database('palettes').where('catalog_id', catalog.id)
				acc = [...palettes]
			} else {
				const palettes = await database('palettes').where('catalog_id', catalog.id)
				acc = [...acc, ...palettes]
			}
			return acc
		}, [])

		if (allReducedPalettes.length) {
			response.status(200).json(allReducedPalettes);
		} else {
			return response
				.status(404)
				.send({ error: `No Palettes found with api /api/v1/users/:userId/palettes` });
		}
	} catch {
		response.status(500).json({ error: '500: Internal Server Error' });
	}
});

app.post('/api/v1/login', async (request, response) => {
	try {
		const { email, password } = request.body;
		const currentLogin = await database('users')
			.where('email', email)
			.select();
		if (currentLogin.length && password === currentLogin[0].password) {
			const { firstName, id } = currentLogin[0];
			return response.status(200).send({ firstName, id });
		} else if (currentLogin.length) {
			return response.status(404).send({ error: 'Incorrect Password' });
		} else {
			return response.status(404).send({ error: 'Email not found' });
		}
	} catch (error) {
		response.status(500).json(error);
	}
});

app.post('/api/v1/users', async (request, response) => {
	const newUser = request.body;
	for (let requiredParameter of [
		'firstName',
		'lastName',
		'email',
		'password'
	]) {
		if (!newUser[requiredParameter]) {
			return response.status(422).send({
				error: `Expected format: {
                    "firstName": <String>,
                    "lastName": <String>,
                    "email": <String>,
                    "password": <String>,
                }. You're missing a "${requiredParameter}" property.`
			});
		}
	}

	try {
		const emailExists = await database('users').where('email', newUser.email);

		if (emailExists.length) {
			return response.status(422).send({
				error: 'The request could not be completed due to email already in use'
			});
		}
	} catch {
		response.status(500).json({ error: '500: Internal Server Error' });
	}

	try {
		const newAddedUser = await database('users').insert(newUser, 'id');
		response
			.status(201)
			.send({ firstName: newUser.firstName, id: newAddedUser[0] });
	} catch {
		response.status(500).json({ error: '500: Internal Server Error' });
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
			const { catalogName, id } = catalogs;
			response.status(201).send({ catalogName, id });
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
			'colors'
		]) {
			if (!newPalette[requiredParameter]) {
				return response.status(422).send({
					error: `Expected format: { paletteName: <string>, catalog_id: <integer>, colors: <array of objects> }. You are missing a ${requiredParameter} property.`
				});
			}
		}

		try {
			const palettes = await database('palettes').insert(newPalette, 'id');
			if (palettes.length) {
				const { paletteName, id } = palettes;
				return response.status(201).send({ paletteName, id });
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

app.patch(
	'/api/v1/users/:userId/catalogs/:catalogId',
	async (request, response) => {
		try {
			const { newName } = request.body;
			const catalog = await database('catalogs').where(
				'id',
				request.params.catalogId
			);
			if (catalog.length) {
				await database('catalogs')
					.where('id', request.params.catalogId)
					.update({ catalogName: newName });
				return response.status(200).send({ newName });
			} else {
				return response
					.status(404)
					.send({ error: 'Catalog not found - unable to update catalog name' });
			}
		} catch (error) {
			response.status(500).json(error);
		}
	}
);

app.patch(
	'/api/v1/users/:userId/catalogs/:catalogId/palettes/:paletteId',
	async (request, response) => {
		try {
			const { catalogId, paletteId } = request.params;
			const newPatch = request.body;
			const palette = await database('palettes')
				.where('id', paletteId)
				.where('catalog_id', catalogId);

			if (palette.length) {
				await database('palettes')
					.where('id', paletteId)
					.where('catalog_id', catalogId)
					.update(newPatch);
				return response.status(200).send(newPatch);
			} else {
				return response.status(404).send({
					error: 'Palette not found - unable to update palette'
				});
			}
		} catch (error) {
			response.status(500).json(error);
		}
	}
);

app.delete(
	'/api/v1/users/:userId/catalogs/:catalogId/palettes/:paletteId',
	async (request, response) => {
		try {
			const { catalogId, paletteId } = request.params;
			const palettes = await database('palettes')
				.where('id', paletteId)
				.where('catalog_id', catalogId)
				.del();

			if (palettes === 0) {
				return response.status(204).json();
			}

			response
				.status(202)
				.json(`Palette ${paletteId} was successfully removed`);
		} catch (error) {
			response.status(500).json({ error });
		}
	}
);

app.delete(
	'/api/v1/users/:userId/catalogs/:catalogId',
	async (request, response) => {
		const { userId, catalogId } = request.params;

		try {
			await database('palettes')
				.where('catalog_id', catalogId)
				.del();
			const catalog = await database('catalogs')
				.where('id', catalogId)
				.where('user_id', userId)
				.del();

			if (catalog === 0) {
				return response.status(204).json();
			}

			response
				.status(202)
				.json(`Catalog ${catalogId} was successfully removed`);
		} catch (error) {
			response.status(500).json({ error });
		}
	}
);

export default app;
