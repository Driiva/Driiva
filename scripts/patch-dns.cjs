/**
 * DNS patch: makes dns.lookup() use dns.resolve4/6 instead of getaddrinfo.
 * Workaround for macOS mDNSResponder not resolving external domains while
 * the system resolver (resolv.conf) works fine.
 * Usage: node -r ./scripts/patch-dns.cjs <script>
 */
'use strict';
const dns = require('dns');
const originalLookup = dns.lookup.bind(dns);

dns.lookup = function patchedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!hostname || typeof hostname !== 'string') {
    return originalLookup(hostname, options, callback);
  }

  const all = options && options.all;
  const family = (options && options.family) || 0;

  if (all) {
    // Return array of { address, family } objects
    dns.resolve4(hostname, (err4, addrs4) => {
      const results4 = err4 ? [] : (addrs4 || []).map(a => ({ address: a, family: 4 }));
      dns.resolve6(hostname, (err6, addrs6) => {
        const results6 = err6 ? [] : (addrs6 || []).map(a => ({ address: a, family: 6 }));
        const combined = [...results4, ...results6];
        if (combined.length > 0) return callback(null, combined);
        originalLookup(hostname, options, callback);
      });
    });
    return;
  }

  if (family === 6) {
    dns.resolve6(hostname, (err6, addrs6) => {
      if (!err6 && addrs6 && addrs6.length > 0) return callback(null, addrs6[0], 6);
      originalLookup(hostname, options, callback);
    });
    return;
  }

  // Default: try IPv4 first
  dns.resolve4(hostname, (err4, addrs4) => {
    if (!err4 && addrs4 && addrs4.length > 0) return callback(null, addrs4[0], 4);
    dns.resolve6(hostname, (err6, addrs6) => {
      if (!err6 && addrs6 && addrs6.length > 0) return callback(null, addrs6[0], 6);
      originalLookup(hostname, options, callback);
    });
  });
};
