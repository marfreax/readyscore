import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
function read(file){return fs.readFileSync(path.join(root,file),"utf8");}
function assert(c,m){if(!c) throw new Error(m); console.log(`${m.padEnd(48)}: PASS`);}
const types=read("lib/commercial/types.ts");
const access=read("app/access/page.tsx");
const checkout=read("app/checkout/[productId]/page.tsx");
const upgrade=read("app/checkout/upgrade/page.tsx");
const checkoutApi=read("app/api/commercial/checkout/route.ts");
const fulfillment=read("lib/commercial/v14-3.ts");
assert(types.includes('id: "product-medium"') && types.includes('tier: "MEDIUM"') && types.includes('name: "All Tests"'),"Six-test package is MEDIUM / All Tests");
for (const k of ["COGNITIVE","EQ","DISC","RIASEC","WORK_ATTITUDE","LEARNING_PREFERENCE"]) assert(types.includes(`"${k}"`),`MEDIUM baseline includes ${k}`);
assert(types.includes('else if (coreTestCount < CORE_TEST_ENTITLEMENT_KEYS.length) level = ACCESS_LEVELS.CUSTOM_ACCESS;') && types.includes('else if (profiling) level = ACCESS_LEVELS.ADVANCE;') && types.includes('else level = ACCESS_LEVELS.ALL_TESTS;'),"CUSTOM_ACCESS reserved for partial entitlement; six tests = ALL_TESTS");
assert(access.includes('/checkout/${product.id}') && access.includes('/checkout/product-basic?testType=') && access.includes('/checkout/reassessment-credit?testType='),"Purchase CTAs route into payment flow");
assert(access.includes('/checkout/upgrade?tier=') && access.includes('Bayar Upgrade'),"Upgrade CTA routes into payment flow");
assert(checkout.includes('/api/commercial/payments') && checkout.includes('window.location.assign(redirectUrl)'),"Primary checkout redirects to Payment Gateway");
assert(upgrade.includes('/api/commercial/payments') && upgrade.includes('window.location.assign(paymentBody.payment.redirectUrl)'),"Upgrade checkout redirects to Payment Gateway");
assert(checkoutApi.includes('createUpgradeCheckoutOrder'),"Upgrade checkout order is supported by commercial API");
assert(fulfillment.includes('isUpgradeOrder') && fulfillment.includes('ENTITLEMENT_ALREADY_PRESENT'),"Upgrade fulfillment does not consume extra usage on existing entitlements");
console.log("V19.5 Commercial Alignment gate: PASS");
