import { prisma } from "../db/prisma";
export async function getTestCatalog(){return prisma.testType.findMany({orderBy:[{status:"asc"},{code:"asc"}],include:{taxonomies:{orderBy:{version:"desc"},include:{nodes:{orderBy:[{level:"asc"},{code:"asc"}]}}}}});}
