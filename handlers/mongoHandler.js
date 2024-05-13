const mongoose = require("mongoose");
const SeraEvents = require("../models/models.seraEvents");
const SeraSettings = require("../models/models.sera_settings");
const modelsBuilder = require("../models/models.builder");
const modelsNodes = require("../models/models.nodes");
const modelsEdges = require("../models/models.edges");
const crypto = require('crypto');

let toastables = [];

async function calculateHash(value) {
    return crypto.createHash('md5').update(value).digest('hex');
}

const connectDatabase = async (mongoString) => {
    try {
        await mongoose.connect(`${mongoString}/Sera`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database Connected");

        const inventoryChangeStream = modelsBuilder.watch();
        const nodesChangeStream = modelsNodes.watch();
        const edgesChangeStream = modelsEdges.watch();
        const settingsStream = SeraSettings.watch();
        const eventStream = SeraEvents.watch();

        // Initialize toastables
        const settingsDoc = await SeraSettings.findOne({ user: "admin" });
        toastables = settingsDoc?.toastables || [];

        settingsStream.on("change", (change) => {
            console.log("Settings Change:", change);
            toastables = change.updateDescription.updatedFields.toastables;
            console.log(toastables);
        });

        // Add error handling for streams
        inventoryChangeStream.on('error', (error) => {
            console.error("Inventory Stream Error:", error);
        });

        nodesChangeStream.on('error', (error) => {
            console.error("Nodes Stream Error:", error);
        });

        edgesChangeStream.on('error', (error) => {
            console.error("Edges Stream Error:", error);
        });

        settingsStream.on('error', (error) => {
            console.error("Settings Stream Error:", error);
        });

        eventStream.on('error', (error) => {
            console.error("Events Stream Error:", error);
        });

        return { eventStream, toastables };
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

module.exports = { connectDatabase };
