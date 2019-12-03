
exports.up = function(knex) {
    return Promise.all([
        knex.schema.createTable('catalogss', function(table) {
          table.increments('id').primary();
          table.string('firstName');
          table.string('lastName');
          table.string('email');
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
            table.string('palletName');
            table.integer('catalog_id').unsigned()
            table.foreign('catalog_id')
              .references('catalogs.id');
            table.timestamps(true, true);
          })
      ])
};

exports.down = function(knex) {
  
};
