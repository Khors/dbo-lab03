const { DataSource } = require('typeorm');
const { Category, Product, Manufacturer } = require('./entities')

const connection = new DataSource({
    type: 'mysql', // Change to your DB type (e.g., postgres, mysql)
    database: 'for-03lab',
    username: "root",
    password: "root",
    entities: [Category, Product, Manufacturer],
    synchronize: true,
    logging: true,
});

module.exports = {
    connection
}