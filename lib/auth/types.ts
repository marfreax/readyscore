export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type UserRecord = { id:string; name:string; email:string; passwordHash:string; role:UserRole; status:UserStatus; createdAt:string; updatedAt:string };
export type PublicUser = Omit<UserRecord,"passwordHash">;
export type SessionRecord = { id:string; userId:string; createdAt:string; expiresAt:string };
