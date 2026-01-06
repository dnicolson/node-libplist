import * as fs from 'fs';
import * as path from 'path';
import { parse, parseFile, toXml, toBinary, xmlToBinary, binaryToXml } from './index';

describe('libplist-wasm', () => {
  describe('parse', () => {
    it('should parse a simple XML plist buffer', async () => {
      const xmlPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>name</key>
  <string>Test</string>
  <key>version</key>
  <integer>1</integer>
  <key>enabled</key>
  <true/>
</dict>
</plist>`;
      
      const buffer = Buffer.from(xmlPlist);
      const result = await parse(buffer);
      const obj = result as any;
      
      expect(obj).toBeDefined();
      expect(typeof obj).toBe('object');
      expect(obj.name).toBe('Test');
      expect(obj.version).toBe(1);
      expect(obj.enabled).toBe(true);
    });

    it('should handle empty buffer', async () => {
      const buffer = Buffer.from('');
      
      await expect(parse(buffer)).rejects.toThrow();
    });

    it('should handle invalid plist data', async () => {
      const buffer = Buffer.from('invalid plist data');
      
      await expect(parse(buffer)).rejects.toThrow();
    });
  });

  describe('parseFile', () => {
    it('should parse a plist from file', async () => {
      // Create a temporary plist file
      const tempFile = path.join(__dirname, 'temp-test.plist');
      const xmlPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>testKey</key>
  <string>testValue</string>
</dict>
</plist>`;
      
      fs.writeFileSync(tempFile, xmlPlist);
      
      try {
        const result = await parseFile(tempFile);
        const obj = result as any;
        expect(obj).toBeDefined();
        expect(typeof obj).toBe('object');
      } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should throw error for non-existent file', async () => {
      await expect(parseFile('/non/existent/file.plist')).rejects.toThrow();
    });
  });

  describe('toXml', () => {
    it('should convert a simple object to XML', async () => {
      const obj = {
        name: 'Test',
        version: 1,
        enabled: true
      };
      
      const xml = await toXml(obj);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<?xml');
      expect(xml).toContain('plist');
      expect(xml).toContain('<key>name</key>');
      expect(xml).toContain('<integer>1</integer>');
    });

    it('should handle nested objects', async () => {
      const obj = {
        name: 'Test',
        nested: {
          key: 'value'
        }
      };
      
      const xml = await toXml(obj);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });

    it('should handle arrays', async () => {
      const obj = {
        items: ['item1', 'item2', 'item3']
      };
      
      const xml = await toXml(obj);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });

    it('should preserve integer vs real types', async () => {
      const obj = {
        intVal: 42,      // Should be <integer>
        floatVal: 3.14   // Should be <real>
      };
      
      const xml = await toXml(obj);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<integer>42</integer>');
      expect(xml).toMatch(/<real>3\.14[0-9]*<\/real>/);
    });
  });

  describe('toBinary', () => {
    it('should convert a simple object to binary plist', async () => {
      const obj = {
        name: 'Test',
        version: 1
      };
      
      const buffer = await toBinary(obj);
      
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should create valid binary plist header', async () => {
      const obj = { test: 'value' };
      
      const buffer = await toBinary(obj);
      
      // Binary plists start with 'bplist'
      const header = buffer.toString('utf8', 0, 6);
      expect(header).toBe('bplist');
    });

    it('should handle complex objects', async () => {
      const obj = {
        name: 'Complex',
        nested: {
          array: [1, 2, 3],
          bool: true
        },
        number: 42.5
      };
      
      const buffer = await toBinary(obj);
      
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  describe('xmlToBinary', () => {
    it('should convert XML plist to binary format', async () => {
      const xmlPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>name</key>
  <string>Test</string>
  <key>version</key>
  <integer>1</integer>
</dict>
</plist>`;
      
      const buffer = await xmlToBinary(xmlPlist);
      
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Binary plists start with 'bplist'
      const header = buffer.toString('utf8', 0, 6);
      expect(header).toBe('bplist');
    });

    it('should accept XML as Buffer', async () => {
      const xmlPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>test</key>
  <string>value</string>
</dict>
</plist>`;
      
      const buffer = await xmlToBinary(Buffer.from(xmlPlist));
      
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 6)).toBe('bplist');
    });

    it('should throw error for invalid XML', async () => {
      await expect(xmlToBinary('invalid xml data')).rejects.toThrow();
    });
  });

  describe('binaryToXml', () => {
    it('should convert binary plist to XML format', async () => {
      // First create a binary plist
      const obj = {
        name: 'Test',
        version: 2,
        enabled: false
      };
      
      const binary = await toBinary(obj);
      const xml = await binaryToXml(binary);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<?xml');
      expect(xml).toContain('plist');
      expect(xml).toContain('<key>name</key>');
      expect(xml).toContain('<string>Test</string>');
      expect(xml).toContain('<integer>2</integer>');
      expect(xml).toContain('<false/>');
    });

    it('should handle complex binary plists', async () => {
      const obj = {
        nested: {
          array: [1, 2, 3],
          dict: { key: 'value' }
        }
      };
      
      const binary = await toBinary(obj);
      const xml = await binaryToXml(binary);
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<array>');
      expect(xml).toContain('<dict>');
    });

    it('should throw error for invalid binary data', async () => {
      const invalidBinary = Buffer.from('not a binary plist');
      
      await expect(binaryToXml(invalidBinary)).rejects.toThrow();
    });
  });

  describe('round-trip conversion', () => {
    it('should convert object to XML and back preserving types', async () => {
      const original = {
        name: 'Test',
        intValue: 42,      // Integer
        realValue: 3.14,   // Real
        enabled: true
      };
      
      const xml = await toXml(original);
      const buffer = Buffer.from(xml);
      const parsed = await parse(buffer);
      const pobj = parsed as any;
      
      expect(pobj).toBeDefined();
      expect(pobj.name).toBe('Test');
      expect(pobj.intValue).toBe(42);
      expect(pobj.realValue).toBeCloseTo(3.14);
      expect(pobj.enabled).toBe(true);
    });

    it('should convert object to binary and back preserving types', async () => {
      const original = {
        name: 'Test',
        intValue: 123,
        realValue: 9.99
      };
      
      const binary = await toBinary(original);
      const parsed = await parse(binary);
      const pobj = parsed as any;
      
      expect(pobj).toBeDefined();
      expect(pobj.name).toBe('Test');
      expect(pobj.intValue).toBe(123);
      expect(pobj.realValue).toBeCloseTo(9.99);
    });

    it('should convert XML to binary to XML preserving data', async () => {
      const originalXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>testKey</key>
  <string>testValue</string>
  <key>number</key>
  <integer>42</integer>
</dict>
</plist>`;
      
      const binary = await xmlToBinary(originalXml);
      const resultXml = await binaryToXml(binary);
      
      expect(resultXml).toBeDefined();
      expect(resultXml).toContain('<key>testKey</key>');
      expect(resultXml).toContain('<string>testValue</string>');
      expect(resultXml).toContain('<integer>42</integer>');
    });

    it('should convert binary to XML to binary preserving data', async () => {
      const obj = { test: 'value', num: 123 };
      const originalBinary = await toBinary(obj);
      
      const xml = await binaryToXml(originalBinary);
      const resultBinary = await xmlToBinary(xml);
      
      // Parse both to compare content
      const originalParsed = await parse(originalBinary);
      const resultParsed = await parse(resultBinary);
      
      expect(resultParsed).toEqual(originalParsed);
    });
  });
});
