import { PrismaClient } from "@prisma/client";

// Workaround for Prisma 7.0.1 + tsx compatibility issue
// The constructor expects an object or nothing, but tsx may pass undefined
let prismaInstance: PrismaClient;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient();
    } catch (error) {
      // Fallback: explicitly pass empty object if default fails
      prismaInstance = new PrismaClient({});
    }
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();
