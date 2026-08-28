const base = process.env.BASE_URL || "http://localhost:3000";
const email = `e2e_auth_${Date.now()}@example.test`;
const password = "ReadyScore-L13-2026!";
const name = "ReadyScore E2E";
function fail(message){ throw new Error(message); }
async function request(path, options={}){
  const r=await fetch(`${base}${path}`,{redirect:"manual",...options});
  return {r, text:await r.text()};
}
console.log("=== READY SCORE V7 L13 AUTHENTICATION ACTUAL RUNTIME E2E ===");
console.log(`Base URL : ${base}`);
let x=await request("/login"); if(x.r.status!==200) fail(`login page HTTP ${x.r.status}`); console.log("Login page                  : PASS");
x=await request("/register"); if(x.r.status!==200) fail(`register page HTTP ${x.r.status}`); console.log("Register page               : PASS");
x=await request("/app"); if(x.r.status!==307 && x.r.status!==308) fail(`protected /app expected redirect, got ${x.r.status}`); console.log("Unauthenticated /app guard : PASS");
const reg=await request("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,email,password})});
if(reg.r.status!==201) fail(`register API HTTP ${reg.r.status} ${reg.text}`); console.log("Registration                : PASS");
const setCookie=reg.r.headers.get("set-cookie"); if(!setCookie) fail("registration session cookie missing");
const cookie=setCookie.split(";")[0];
const session=await request("/api/auth/session",{headers:{cookie}}); if(session.r.status!==200 || !JSON.parse(session.text).authenticated) fail(`session API failed ${session.r.status} ${session.text}`); console.log("Session persistence         : PASS");
const app=await request("/app",{headers:{cookie}}); if(app.r.status!==200) fail(`authenticated /app HTTP ${app.r.status}`); console.log("Authenticated /app          : PASS");
const logout=await request("/api/auth/logout",{method:"POST",headers:{cookie}}); if(logout.r.status!==303) fail(`logout expected 303, got ${logout.r.status}`); console.log("Logout                      : PASS");
const postLogout=await request("/app",{headers:{cookie:""}}); if(postLogout.r.status!==307 && postLogout.r.status!==308) fail(`post-logout /app expected redirect, got ${postLogout.r.status}`); console.log("Post-logout protection     : PASS");
console.log("=== READY SCORE V7 L13 AUTHENTICATION ACTUAL RUNTIME E2E: PASS ===");
console.log(`E2E User Email              : ${email}`);
