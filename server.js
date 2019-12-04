import app from './app';
const app = express();
const cors = require('cors');
const express = require('express');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.use(cors());
app.use(express.json());
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
	console.log(
		`${app.locals.title} is running on localhost:${app.get('port')}.`
	);
});
