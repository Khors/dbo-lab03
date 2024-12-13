const { connection } = require('./db-connection')
const fs = require('fs')
const readline = require('readline')
const { DBService } = require('./db-service')

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

// const defineManufacturers = (rows) => {
//     const manufacturerCounts = new Map();

//     rows.forEach((row) => {
//         const manufacturer = row[1]; // Second column
//         if (manufacturer && !/\d/.test(manufacturer)) {
//             const upperCaseManufacturer = manufacturer.toUpperCase();
//             manufacturerCounts.set(
//                 upperCaseManufacturer,
//                 (manufacturerCounts.get(upperCaseManufacturer) || 0) + 1
//             );
//         }
//     });

//     return Array.from(manufacturerCounts.entries())
//         .filter(([, count]) => count > 2)
//         .map(([name]) => name);
// }


function setManufacturerId(object) {
    if (object.partnumber) {
        const lowerName = object.partnumber.toLowerCase();
        for (const manufacturer of manufacturers) {
            if (lowerName.includes(manufacturer.name.toLowerCase())) {
                return { ...object, manufacturer: manufacturer.id, partnumber: null };
            }
        }
    }
    return { ...object, manufacturer: null }; // Default to null if no manufacturer is found
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

    result.push(current.trim()); // Add the last segment
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
        return object;
    });

    // console.log('Generated objects:');
    // objects.forEach((obj, index) => {
    //     console.log(`Object ${index + 1}:`, obj);
    // });

    // console.log('Analysis of descriptions completed');
    // Output objects with category = 1
    // console.log('Objects with category = 1 (Різне):');
    // objects.filter(obj => obj.category === 1).forEach((obj, index) => {
    //     console.log(`Object ${index + 1}:`, obj);
    // });

    const dbService = new DBService()

    for await (let category of categories) {
        const result = await dbService.addCategory(category)
        console.log(result)
    }

    for await (let manufacturer of manufacturers) {
        const result = await dbService.addManufacturer(manufacturer)
        console.log(result)
    }

    for await (let object of objects) {
        const result = await dbService.addProduct(object)
        console.log(result)
    }

}





const run = async () => {
    await connection.initialize()
    parseAndSave()
}

run()