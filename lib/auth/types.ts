export type UserRole = "USER" | "ADMIN";
export type UserRecord = { id:string; name:string; email:string; passwordHash:string; role:UserRole; createdAt:string; updatedAt:string };
export type PublicUser = Omit<UserRecord,"passwordHash">;
export type SessionRecord = { id:string; userId:string; createdAt:string; expiresAt:string };
