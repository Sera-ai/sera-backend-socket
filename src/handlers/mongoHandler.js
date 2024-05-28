const mongoose = require("mongoose");
const SeraEvents = require("../models/models.seraEvents");
const SeraSettings = require("../models/models.sera_settings");

let toastables = [];

const connectDatabase = async (mongoString) => {
    try {
        await mongoose.connect(`${mongoString}/Sera`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database Connected");


        const settingsStream = SeraSettings.watch();
        const eventStream = SeraEvents.watch();

        // Initialize toastables
        const settingsDoc = await SeraSettings.findOne({ user: "admin" });
        toastables = settingsDoc?.toastables || [];

        settingsStream.on("change", (change) => {
            console.log("Settings Change:", change);
            if (change?.updateDescription?.updatedFields?.toastables) {
                toastables = change?.updateDescription?.updatedFields?.toastables || [];
                console.log(toastables);
            }
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
