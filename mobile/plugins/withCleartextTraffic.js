const fs = require('node:fs');
const path = require('node:path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');

// Production EAS builds only allow cleartext to the live API host; dev/preview builds also allow
// it everywhere so Metro / LAN servers keep working. Move the API to HTTPS to drop this entirely.
const IS_PRODUCTION_BUILD = process.env.EAS_BUILD_PROFILE === 'production';

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow HTTP to the live API host (no TLS on AWS IP yet). -->
    <base-config cleartextTrafficPermitted="${IS_PRODUCTION_BUILD ? 'false' : 'true'}">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">13.60.23.65</domain>
    </domain-config>
</network-security-config>
`;

/**
 * Android blocks plain HTTP (cleartext) by default.
 * Expo's usesCleartextTraffic flag alone is not enough on some devices /
 * EAS builds — this plugin writes network_security_config.xml and wires it
 * into AndroidManifest.
 */
function withCleartextTraffic(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_XML);
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$ = app.$ ?? {};
    app.$['android:usesCleartextTraffic'] = IS_PRODUCTION_BUILD ? 'false' : 'true';
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return cfg;
  });

  return config;
}

module.exports = withCleartextTraffic;
