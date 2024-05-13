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

async function updateParentNodeHash(parentNodeId) {
    const parentNode = await modelsBuilder.findOne({ _id: parentNodeId });

    if (parentNode) {
        let hashValue = await calculateHash(parentNode.name);

        if (parentNode.nodes && parentNode.nodes.length > 0) {
            for (let nodeId of parentNode.nodes) {
                const node = await modelsNodes.findOne({ _id: nodeId });
                if (node) {
                    const nodeHash = await calculateHash(node.name);
                    hashValue = await calculateHash(hashValue + nodeHash);
                }
            }
        }

        if (parentNode.edges && parentNode.edges.length > 0) {
            for (let edgeId of parentNode.edges) {
                const edge = await modelsEdges.findOne({ _id: edgeId });
                if (edge) {
                    const edgeHash = await calculateHash(edge.name);
                    hashValue = await calculateHash(hashValue + edgeHash);
                }
            }
        }

        await modelsBuilder.updateOne({ _id: parentNodeId }, { $set: { hashValue: hashValue } });
    }
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

        inventoryChangeStream.on('change', async (change) => {
            console.log("Inventory Change:", change);
            if (change.operationType === 'insert' || change.operationType === 'update') {
                const documentId = change.documentKey._id;
                await updateParentNodeHash(documentId);
            }
        });

        nodesChangeStream.on('change', async (change) => {
            console.log("Nodes Change:", change);
            if (change.operationType === 'update' || change.operationType === 'insert') {
                const documentId = change.documentKey._id;
                const parentNodes = await modelsBuilder.find({ nodes: documentId }).toArray();
                for (let parentNode of parentNodes) {
                    await updateParentNodeHash(parentNode._id);
                }
            }
        });

        edgesChangeStream.on('change', async (change) => {
            console.log("Edges Change:", change);
            if (change.operationType === 'update' || change.operationType === 'insert') {
                const documentId = change.documentKey._id;
                const parentNodes = await modelsBuilder.find({ edges: documentId }).toArray();
                for (let parentNode of parentNodes) {
                    await updateParentNodeHash(parentNode._id);
                }
            }
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
