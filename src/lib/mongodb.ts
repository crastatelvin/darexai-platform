import { PrismaClient as MongoPrismaClient } from '../generated/mongo-client';

const globalForMongo = global as unknown as { mongoPrisma: MongoPrismaClient };

export const mongoDb = globalForMongo.mongoPrisma || new MongoPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForMongo.mongoPrisma = mongoDb;
