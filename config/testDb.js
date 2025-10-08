import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import colors from "colors";

const MONGO_BASE_URL = 'mongodb://127.0.0.1';
const MONGO_TEST_PORT = 37017;
const MONGO_DB_NAME = 'test';

let mongoServer;

const createAndConnectTestDB = async () => {
    try {
        mongoServer = await MongoMemoryServer.create({instance: {port: MONGO_TEST_PORT}});
        const uri = mongoServer.getUri();
        const conn = await mongoose.connect(uri, {dbName: MONGO_DB_NAME});
        console.log(uri);
        console.log(`Connected To Test Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.log(`Error in Test Mongodb ${error}`.bgRed.white);
    }
}

const connectTestDB = async () => {
    try {
        const uri = `${MONGO_BASE_URL}:${MONGO_TEST_PORT}`;
        const conn = await mongoose.connect(uri, {dbName: MONGO_DB_NAME});
        console.log(uri);
        console.log(`Connected To Test Mongodb Database ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error in Test Mongodb ${error}`);
    }
};

const closeTestDB = async () => {
    if (!mongoServer) return;

    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    mongoServer = null;
}

const clearTestDB = async () => {
    if(!mongoServer) return;

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

export {
    createAndConnectTestDB,
    connectTestDB,
    closeTestDB,
    clearTestDB,
};