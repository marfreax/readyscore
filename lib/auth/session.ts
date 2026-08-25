import { cookies } from "next/headers";
import { createSession, deleteSession, getSession } from "./store";
export const SESSION_COOKIE="readyscore_session";
export async function getCurrentSession(){const jar=await cookies(),id=jar.get(SESSION_COOKIE)?.value;return id?getSession(id):null}
export async function startSession(userId:string){const s=createSession(userId),jar=await cookies();jar.set(SESSION_COOKIE,s.id,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:new Date(s.expiresAt)});return s}
export async function endSession(){const jar=await cookies(),id=jar.get(SESSION_COOKIE)?.value;if(id)deleteSession(id);jar.set(SESSION_COOKIE,"",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:new Date(0)})}
