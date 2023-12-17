const mongoose = require('mongoose');



const dataSchema = new mongoose.Schema({
    nodes: {
        required: true,
        type: Array
    },
    edges: {
        required: true,
        type: Array
    }
}, { collection: "builder_inventory", strict: false })

module.exports = mongoose.model('builder_inventory', dataSchema)