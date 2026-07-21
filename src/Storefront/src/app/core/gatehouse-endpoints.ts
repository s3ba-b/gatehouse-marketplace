// Kratos and Oathkeeper are only reachable from the browser on their
// gatehouse.test subdomains (see README.md "Run locally") — the shared base
// domain is what lets the Kratos session cookie reach Oathkeeper's
// cookie_session authenticator. Fixed dev-only ports, matching AppHost.cs.
export const KRATOS_PUBLIC_URL = 'http://kratos.gatehouse.test:4433';
export const GATEWAY_URL = 'http://gateway.gatehouse.test:4455';
