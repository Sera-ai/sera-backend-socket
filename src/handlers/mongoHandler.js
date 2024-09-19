import mongoose from 'mongoose';

const { default: sera_settings_model } = await import("../models/models.sera_settings.cjs");
const { default: sera_events_model } = await import("../models/models.sera_events.cjs");
const { default: hosts_model } = await import("../models/models.hosts.cjs");
const { default: tx_logs_model } = await import("../models/models.tx_logs.cjs");

let toastables = [];

export const connectDatabase = async (mongoString) => {
    try {
        await mongoose.connect(`${mongoString}/Sera`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Database Connected');

        const settingsStream = sera_settings_model.watch();
        const eventStream = sera_events_model.watch();
        const hostStream = hosts_model.watch();
        const nginxStream = tx_logs_model.watch();

        // Initialize toastables
        const settingsDoc = await sera_settings_model.findOne({ user: 'admin' });
        toastables = settingsDoc?.toastables || [];

        settingsStream.on('change', (change) => {
            if (change?.updateDescription?.updatedFields?.toastables) {
                toastables = change?.updateDescription?.updatedFields?.toastables || [];
                console.log(toastables);
            }
        });

        settingsStream.on('error', (error) => {
            console.error('Settings Stream Error:', error);
        });

        eventStream.on('error', (error) => {
            console.error('Events Stream Error:', error);
        });

        hostStream.on('error', (error) => {
            console.error('Host Stream Error:', error);
        });

        nginxStream.on('error', (error) => {
            console.error('NGINX Stream Error:', error);
        });

        return { streams: { hostStream, eventStream, nginxStream }, toastables };
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};
