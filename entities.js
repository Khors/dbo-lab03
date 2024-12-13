const { EntitySchema } = require('typeorm');


const Category = new EntitySchema({
    name: 'Category',
    tableName: 'categories',
    columns: {
        id: { type: 'int', primary: true, generated: true },
        name: { type: 'varchar', unique: true },
    },
    relations: {
        products: { type: 'one-to-many', target: 'Product', inverseSide: 'category' },
    },
});

const Manufacturer = new EntitySchema({
    name: 'Manufacturer',
    tableName: 'manufacturers',
    columns: {
        id: { type: 'int', primary: true, generated: true },
        name: { type: 'varchar', unique: true },
    },
    relations: {
        products: { type: 'one-to-many', target: 'Product', inverseSide: 'manufacturer' },
    },
});

const Product = new EntitySchema({
    name: 'Product',
    tableName: 'products',
    columns: {
        id: { type: 'int', primary: true, generated: true },
        partnumber: { type: 'varchar', nullable: true },
        name: { type: 'varchar' },
        url: { type: 'varchar', nullable: true },
        availability: { type: 'varchar', nullable: true },
        price: { type: 'decimal', precision: 10, scale: 2 },
    },
    relations: {
        category: { type: 'many-to-one', target: 'Category', cascade: true },
        manufacturer: { type: 'many-to-one', target: 'Manufacturer', cascade: true },
    },
});

module.exports = {
    Category,
    Manufacturer,
    Product,
}
