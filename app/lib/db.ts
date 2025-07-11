import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://Takshaga:54321@nodebootcamp.jtxse.mongodb.net/?retryWrites=true&w=majority&appName=nodebootcamp";

// At this point, MONGODB_URI is guaranteed to be defined
const MONGODB_URI_FINAL = MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      dbName: 'takshagamanage' // Explicitly set database name
    };

    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', MONGODB_URI_FINAL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

    cached.promise = mongoose.connect(MONGODB_URI_FINAL, opts).then((mongoose) => {
      console.log('MongoDB Atlas connected successfully!');
      console.log('Database:', mongoose.connection.db?.databaseName || 'unknown');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB Atlas connection error:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to connect to MongoDB Atlas:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect; 