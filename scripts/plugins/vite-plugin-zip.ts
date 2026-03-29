import { Plugin } from 'vite';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ChromeExtension from 'crx';
import { generateKeyPairSync } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function zipPlugin(): Plugin {
  return {
    name: 'vite-plugin-zip',
    apply: 'build',
    async closeBundle() {
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'));
      const version = packageJson.version;
      const name = packageJson.name;

      const zip = new JSZip();
      const distPath = path.resolve(__dirname, '../../dist');
      const releaseDir = path.resolve(__dirname, '../../releases');

      if (!fs.existsSync(releaseDir)) {
        fs.mkdirSync(releaseDir);
      }

      function addFilesToZip(dir: string, currentZip: JSZip) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            const folder = currentZip.folder(file);
            if (folder) addFilesToZip(filePath, folder);
          } else {
            const content = fs.readFileSync(filePath);
            currentZip.file(file, content);
          }
        }
      }

      // 1. Pack ZIP
      addFilesToZip(distPath, zip);
      const zipContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const zipFileName = `${name}-v${version}.zip`;
      fs.writeFileSync(path.join(releaseDir, zipFileName), zipContent);
      console.log(`\n\x1b[32mSuccessfully created release: ${zipFileName}\x1b[0m`);

      // 2. Pack CRX
      const keyPath = path.resolve(__dirname, '../../key.pem');
      let privateKey: Buffer | string;

      if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath);
      } else {
        const keyPair = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
        });
        privateKey = keyPair.privateKey;
        fs.writeFileSync(keyPath, privateKey);
        console.log(`\x1b[33mGenerated new key.pem for CRX packing\x1b[0m`);
      }

      const crx = new ChromeExtension({ privateKey });
      try {
        await crx.load(distPath);
        const crxBuffer = await crx.pack();
        const crxFileName = `${name}-v${version}.crx`;
        fs.writeFileSync(path.join(releaseDir, crxFileName), crxBuffer);
        console.log(`\x1b[32mSuccessfully created release: ${crxFileName}\x1b[0m\n`);
      } catch (err) {
        console.error(`\x1b[31mFailed to create CRX file: ${err}\x1b[0m\n`);
      }
    },
  };
}
