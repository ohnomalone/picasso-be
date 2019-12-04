const usersData = require()
const catalogsData = require()
const palettesData = require()

const createUser = (knex, user) => {
  return knex('users').insert({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password
  }, 'id')
  .then(userId => {
    let catalogsPromises = [];

    user.catalogs.forEach(catalog => {
      catalogsPromises.push(
        createCatalog(knex, {
          catalogName: catalog.catalogName,
          user_id: userId[0]
        }, 'id')
        .then(catalogId => {
          let palettePromises = [];

          catalog.palettes.forEach(palette => {
            palettePromises.push(
              createCatalog(knex, {
                palletName: palette.palletName,
                color1: palette.color1,
                color2: palette.color2,
                color3: palette.color3,
                color4: palette.color4,
                color5: palette.color5,
                catalog_id: catalogId[0]
              })
            )
          })

        })
      )
    })
  })
}


exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('palettes').del()
  .then(() => knex('catalogs').del())
  .then(() => knex('users').del())
    .then( () => {
      let userPromises = [];

      usersData.forEach(user => {
        userPromises.push(createUser(knex, user))
      })

      return Promise.all(userPromises)
    })
    .catch(error => console.log(`Error seeding data: ${error}`));
};
