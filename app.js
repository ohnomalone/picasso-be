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

app.get('/api/v1/users/:usersId/catalogs', async (request, response) => {
    try{
        const catalogs = await database('catalogs').where('user_id', request.params.usersId).select();
        if (catalogs.length) {
            response.status(200).json(catalogs);
        } else { 
            return response.status(404).send({error: 'Cannot get Catalogs, User not found'});
          }
    } catch(error) {
        response.status(500).json( error );
      }
})

app.get('/api/v1/users/:usersId/catalogs/:catalogId/palettes/:paletteId', async (request, response) => {
    
    try {
        const palette = await database('palettes').where('id', request.params.paletteId).select()
        
        if (palette.length) {
            response.status(200).json(palette);
        } else { 
            return response.status(404).send({error: 'Cannot get palette'});
          }
    } catch(error) {
        response.status(500).json( error );
      }
})

app.post('/api/v1/login', async (request, response) => {
    try {
        const { email, password } = request.body
        const currentLogin = await database('users').where('email', email).select();
        if (currentLogin.length && password === currentLogin[0].password) {
            const { firstName, id } = currentLogin[0]
            return response.status(200).send({ firstName, id });
        } else if (currentLogin.length) {
            return response.status(404).send({error: 'Incorrect Password'});
        } else { 
            return response.status(404).send({error: 'Email not found'});
        }
    } catch(error) {
        response.status(500).json( error );
      }
})

app.patch('/api/v1/users/:userId/catalogs/:catalogId', async (request, response) => {
    try {
        const { newName } = request.body
        const catalog = await database('catalogs').where('id', request.params.catalogId);
        if (catalog.length) {
            await database('catalogs').where('id', request.params.catalogId).update({ catalogName: newName});
            return response.status(200).send({ newName });
        } else { 
            return response.status(404).send({error: 'Catalog not found - unable to update catalog name'});
        }
    } catch(error) {
        response.status(500).json( error );
      }
})


export default app;