const usersData = require('../../../data/users.js');
const catalogsData = require('../../../data/catalogs.js');
const palettesData = require('../../../data/palettes.js');

const createUser = (knex, user) => {
	return knex('users')
		.insert(
			{
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				password: user.password
			},
			'id'
		)

		.then(userId => {
			let catalogsPromises = [];
			const filteredCatalogs = catalogsData.filter(
				catalog => catalog.user_id === user.id
			);
			filteredCatalogs.forEach(catalog => {
				catalogsPromises.push(
					createCatalog(
						knex,
						{
							catalogName: catalog.catalogName,
							user_id: userId[0]
						},
						'id'
					).then(catalogId => {
						let palettesPromises = [];
						const filteredPalettes = palettesData.filter(
							palette => palette.catalog_id === catalog.id
						);
						filteredPalettes.forEach(palette => {
							console.log(palette);
							palettesPromises.push(
								createPalette(knex, {
									paletteName: palette.paletteName,
									color1: JSON.stringify(palette.color1),
									color2: JSON.stringify(palette.color2),
									color3: JSON.stringify(palette.color3),
									color4: JSON.stringify(palette.color4),
									color5: JSON.stringify(palette.color5),
									catalog_id: catalogId[0]
								})
							);
						});
						return Promise.all(palettesPromises);
					})
				);
			});
			return Promise.all(catalogsPromises);
		});
};

const createCatalog = (knex, catalog) => {
	return knex('catalogs').insert(catalog, 'id');
};

const createPalette = (knex, palette) => {
	return knex('palettes').insert(palette);
};

exports.seed = knex => {
	return knex('palettes')
		.del()
		.then(() => knex('catalogs').del())
		.then(() => knex('users').del())
		.then(() => {
			let userPromises = [];

			usersData.forEach(user => {
				userPromises.push(createUser(knex, user));
			});

			return Promise.all(userPromises);
		})
		.catch(error => console.log(`Error seeding data: ${error}`));
};
