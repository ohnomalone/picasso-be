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
    try{
        const catalogs = await database('catalogs').where('user_id', request.params.id).select();
        if (catalogs.length) {
            response.status(200).json(catalogs);
        } else { 
            return response.status(404).send({error: 'Catalogs not found'});
          }
    } catch(error) {
        response.status(500).json({ error });
      }
})

export default app;
