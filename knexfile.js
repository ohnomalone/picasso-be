module.exports = {
	development: {
		client: 'pg',
		connection: 'postgres://localhost/picasso_db',
		migrations: {
			directory: './db/migrations'
		},
		seeds: {
			directory: './db/seeds/dev'
		},
		useNullAsDefault: true
	},

	staging: {
		client: 'postgresql',
		connection: {
			database: 'my_db',
			user: 'username',
			password: 'password'
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'knex_migrations'
		}
	},

	production: {
		client: 'pg',
		connection: process.env.DATABASE_URL + `?ssl=true`,
		migrations: {
		  directory: './db/migrations'
		},
		seeds: {
			directory: './db/seeds/dev'
		  },
		useNullAsDefault: true
	  },

	test: {
		client: 'pg',
		connection: 'postgres://localhost/picasso_db_test',
		migrations: {
			directory: './db/migrations'
		},
		seeds: {
			directory: './db/seeds/dev'
		},
		useNullAsDefault: true
	}
};
