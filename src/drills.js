require('dotenv').config()
const knex = require('knex')

const knexInstance = knex({
    client: 'pg',
    connection: process.env.DB_URL
})

console.log('knex and driver installed correctly');

knexInstance('shopping_list')
    .select('*');

// function getAllItemsWithText(searchTerm) {
//     knexInstance
//         .select('name', 'price', 'category')
//         .from('shopping_list')
//         .where('name', 'ILIKE', `%${searchTerm}%`)
//         .then(result => {
//             console.log(result)
//         })
// }

// getAllItemsWithText('b')

// function paginateItems(pageNumber) {
//     const productsPerPage = 6
//     const offset = productsPerPage * (pageNumber - 1)
//     knexInstance
//         .select('name')
//         .from('shopping_list')
//         .limit(productsPerPage)
//         .offset(offset)
//         .then(result => {
//             console.log(result)
//         })
// }

// paginateItems(2)

function itemsAddedAfter(daysAgo) {
    knexInstance
        .select('name', 'date_added')
        .from('shopping_list')
        .where('date_added', '>', knexInstance.raw(`now() - '??days'::INTERVAL`, daysAgo))
        .then(result => {
            console.log(result)
        })
}

itemsAddedAfter(5);

function totalCostPerCategory() {
    knexInstance
        .select('category')
        .sum('price as total')
        .from('shopping_list')
        .groupBy('category')
        .then(result => {
            console.log(result)
        })
}

totalCostPerCategory()