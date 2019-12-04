exports.up = function(knex) {
    return Promise.all([
        knex.schema.createTable('users', function(table) {
          table.increments('id').primary();
          table.string('firstName');
          table.string('lastName');
          table.unique('email');
          table.string('password');
          table.timestamps(true, true);
        }),
        knex.schema.createTable('catalogs', function(table) {
          table.increments('id').primary();
          table.string('catalogName');
          table.integer('user_id').unsigned()
          table.foreign('user_id')
            .references('users.id');
          table.timestamps(true, true);
        }),
        knex.schema.createTable('palettes', function(table) {
            table.increments('id').primary();
            table.string('paletteName');
            table.json('color1');
            table.json('color2');
            table.json('color3');
            table.json('color4');
            table.json('color5');
            table.integer('catalog_id').unsigned()
            table.foreign('catalog_id')
              .references('catalogs.id');
            table.timestamps(true, true);
          })
      ])
};
exports.down = function(knex) {
    return Promise.all([
        knex.schema.dropTable('users'),
        knex.schema.dropTable('catalogs'),
        knex.schema.dropTable('palettes')
      ]);
};