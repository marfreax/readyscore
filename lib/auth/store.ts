import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { PublicUser, SessionRecord, UserRecord } from "./types";
type AuthState={version:1;users:UserRecord[];sessions:SessionRecord[]};
const FILE=path.join(process.cwd(),"data","auth-state.json");
function load():AuthState{try{return fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,"utf8")) as AuthState:{version:1,users:[],sessions:[]}}catch{return {version:1,users:[],sessions:[]}}}
function save(s:AuthState){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(s,null,2));}
const emailOf=(v:string)=>v.trim().toLowerCase();
export function toPublicUser(u:UserRecord):PublicUser{const {passwordHash:_p,...r}=u;return r}
export function hashPassword(password:string){const salt=randomBytes(16).toString("hex");return `scrypt$${salt}$${scryptSync(password,salt,64).toString("hex")}`;}
export function verifyPassword(password:string,encoded:string){const [scheme,salt,expected]=encoded.split("$");if(scheme!=="scrypt"||!salt||!expected)return false;const actual=scryptSync(password,salt,64), exp=Buffer.from(expected,"hex");return actual.length===exp.length&&timingSafeEqual(actual,exp)}
export function createUser(i:{name:string;email:string;password:string}){const s=load(),email=emailOf(i.email);if(s.users.some(u=>u.email===email))throw new Error("EMAIL_ALREADY_EXISTS");const now=new Date().toISOString();const u:UserRecord={id:`usr_${randomBytes(12).toString("hex")}`,name:i.name.trim(),email,passwordHash:hashPassword(i.password),role:"USER",createdAt:now,updatedAt:now};s.users.push(u);save(s);return toPublicUser(u)}
export function authenticate(i:{email:string;password:string}){const s=load(),u=s.users.find(x=>x.email===emailOf(i.email));if(!u||!verifyPassword(i.password,u.passwordHash))throw new Error("INVALID_CREDENTIALS");return toPublicUser(u)}
export function createSession(userId:string,ttlDays=7){const s=load(),now=new Date();const x:SessionRecord={id:`ses_${randomBytes(24).toString("hex")}`,userId,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+ttlDays*86400000).toISOString()};s.sessions=s.sessions.filter(v=>new Date(v.expiresAt)>now);s.sessions.push(x);save(s);return x}
export function deleteSession(id:string){const s=load();s.sessions=s.sessions.filter(x=>x.id!==id);save(s)}
export function getSession(id:string){const s=load(),x=s.sessions.find(v=>v.id===id);if(!x)return null;if(new Date(x.expiresAt)<=new Date()){deleteSession(id);return null}const u=s.users.find(v=>v.id===x.userId);return u?{session:x,user:toPublicUser(u)}:null}
export function getUserRecord(id:string){const s=load();return s.users.find(x=>x.id===id)??null}
export function updateUser(id:string,i:{name?:string;email?:string}){const s=load(),u=s.users.find(x=>x.id===id);if(!u)throw new Error("USER_NOT_FOUND");if(i.email!==undefined){const e=emailOf(i.email);if(!e)throw new Error("INVALID_EMAIL");if(s.users.some(x=>x.id!==id&&x.email===e))throw new Error("EMAIL_ALREADY_EXISTS");u.email=e}if(i.name!==undefined){const n=i.name.trim();if(!n)throw new Error("INVALID_NAME");u.name=n}u.updatedAt=new Date().toISOString();save(s);return toPublicUser(u)}
