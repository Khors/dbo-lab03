const fs = require('fs')
const readline = require('readline')
const { DataFactory, Writer } = require('n3');

const categories = [
    { id: 1, name: "Різне" },
    { id: 2, name: "кабель" },
    { id: 3, name: "адаптер" },
    { id: 4, name: "лампа" },
    { id: 5, name: "Денні ходові вогні" },
    { id: 6, name: "зарядний пристрій" },
    { id: 7, name: "Блок живлення" }
];

const manufacturers = [
    { id: 1, name: "OSRAM" },
    { id: 2, name: "EPSON" },
    { id: 3, name: "USHIO" },
    { id: 4, name: "PHILIPS" }
];

function setManufacturerId(object) {
    if (object.partnumber) {
        const lowerName = object.partnumber.toLowerCase();
        for (const manufacturer of manufacturers) {
            if (lowerName.includes(manufacturer.name.toLowerCase())) {
                return { ...object, manufacturer: manufacturer.id, partnumber: null };
            }
        }
    }
    return { ...object, manufacturer: null };
}

function setCategoryId(object) {
    if (object.name) {
        const lowerName = object.name.toLowerCase();
        for (const category of categories) {
            if (lowerName.includes(category.name.toLowerCase())) {
                return { ...object, category: category.id };
            }
        }
    }
    return { ...object, category: 1 };
}


function parsePrice(price) {
    if (price) {
        return parseFloat(price.replace(',', '.').replace(/[^\d.]/g, '')) || null;
    }
    return null;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}


const parseAndSave = async () => {

    const rows = [];
    const readStream = fs.createReadStream('./to-parse.csv')
    const rl = readline.createInterface({ input: readStream });

    for await (const line of rl) {
        const row = parseCSVLine(line);
        if (row[0] === '№' || row.filter((value) => value !== '').length <= 1) {
            continue;
        }

        rows.push(row);
    }

    const objects = rows.map((row) => {
        let object = {
            partnumber: row[1]?.trim() || null,
            name: row[2]?.trim() || null,
            url: row[3]?.trim() || null,
            availability: row[4]?.trim() || null,
            price: parsePrice(row[5]),
            manufacturer: null,
            category: null
        };
        object = setManufacturerId(object);
        object = setCategoryId(object);
        // console.log(object);
        return object;
    });
    // пишемо файл
    const { namedNode, literal } = DataFactory;
    // Ініціалізуємо Writer
    const writer = new Writer({
        prefixes: {
            ex: 'http://example.org/ontology/',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            owl: 'http://www.w3.org/2002/07/owl#',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
        },
    });

    // Класи
    const classes = ['Product', 'Category', 'Manufacturer'];
    classes.forEach((cls) => {
        writer.addQuad(namedNode(`http://example.org/ontology/${cls}`), namedNode('rdf:type'), namedNode('owl:Class'));
    });

    const dataProperties = {
        name: 'xsd:string',
        price: 'xsd:decimal',
        availability: 'xsd:string',
        url: 'xsd:anyURI',
    };
    Object.entries(dataProperties).forEach(([prop, type]) => {
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdf:type'), namedNode('owl:DatatypeProperty'));
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdfs:domain'), namedNode('http://example.org/ontology/Product'));
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdfs:range'), namedNode(type));
    });

    // Об'єктні властивості
    const objectProperties = {
        belongsToCategory: 'Category',
        hasManufacturer: 'Manufacturer',
    };
    Object.entries(objectProperties).forEach(([prop, range]) => {
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdf:type'), namedNode('owl:ObjectProperty'));
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdfs:domain'), namedNode('http://example.org/ontology/Product'));
        writer.addQuad(namedNode(`http://example.org/ontology/${prop}`), namedNode('rdfs:range'), namedNode(`http://example.org/ontology/${range}`));
    });

    // категорії та виробники

    categories.forEach((category) => {
        writer.addQuad(namedNode(`http://example.org/ontology/Category_${category.id}`), namedNode('rdf:type'), namedNode('http://example.org/ontology/Category'));
        writer.addQuad(namedNode(`http://example.org/ontology/Category_${category.id}`), namedNode('http://example.org/ontology/name'), literal(category.name, namedNode('xsd:string')));
    });

    manufacturers.forEach((manufacturer) => {
        writer.addQuad(namedNode(`http://example.org/ontology/Manufacturer_${manufacturer.id}`), namedNode('rdf:type'), namedNode('http://example.org/ontology/Manufacturer'));
        writer.addQuad(namedNode(`http://example.org/ontology/Manufacturer_${manufacturer.id}`), namedNode('http://example.org/ontology/name'), literal(manufacturer.name, namedNode('xsd:string')));
    });

    // продукти

    objects.forEach((product, index) => {
        const productURI = `http://example.org/ontology/Product_${index + 1}`;
        writer.addQuad(namedNode(productURI), namedNode('rdf:type'), namedNode('http://example.org/ontology/Product'));
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/name'), literal(product.name, namedNode('xsd:string')));
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/url'), literal(product.url, namedNode('xsd:anyURI')));
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/availability'), literal(product.availability, namedNode('xsd:string')));
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/price'), literal(product.price, namedNode('xsd:decimal')));

        // Додавання зв'язків
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/hasManufacturer'), namedNode(`http://example.org/ontology/Manufacturer_${product.manufacturer}`));
        writer.addQuad(namedNode(productURI), namedNode('http://example.org/ontology/belongsToCategory'), namedNode(`http://example.org/ontology/Category_${product.category}`));
    });

    writer.end((error, result) => {
        if (error) {
            console.error('Error generating OWL:', error);
        } else {
            const outputFilePath = './ontology.owl';
            fs.writeFileSync(outputFilePath, result);
            console.log(`OWL ontology saved to ${outputFilePath}`);
        }
    });

}





const run = async () => {
    parseAndSave()
}

run()