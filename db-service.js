const { Category, Product, Manufacturer } = require('./entities')
const { connection } = require('./db-connection')

class DBService {

    constructor() {
        this.categoryRepo = connection.getRepository(Category)
        this.productRepo = connection.getRepository(Product)
        this.manufacturerRepo = connection.getRepository(Manufacturer)
    }

    async addCategory(category) {
        const newCategory = await this.categoryRepo.save(category)
        return newCategory
    }
    async addProduct(product) {
        const newProduct = await this.productRepo.save(product)
        return newProduct
    }

    async addManufacturer(manufacturer) {
        const newManufacturer = await this.manufacturerRepo.save(manufacturer)
        return newManufacturer
    }

    getCategoyList() { }
    getProductList() { }
    getManufacturerList() { }

}

module.exports = {
    DBService
}