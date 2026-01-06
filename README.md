# node-libplist

WebAssembly build of libimobiledevice's libplist with a minimal Node.js API.

For library details, implementation notes, and plist format specifics, please see the upstream project: https://github.com/libimobiledevice/libplist

## API

### Types
- **`PlistPrimitive`**: string | number | boolean
- **`PlistValue`**: `PlistPrimitive` | `PlistObject` | `PlistArray`
- **`PlistObject`**: `{ [key: string]: PlistValue }`
- **`PlistArray`**: `PlistValue[]`

### Functions
- **`parse(buffer: Buffer): Promise<PlistValue>`**: Parse XML or binary plist from a buffer.
- **`parseFile(filePath: string): Promise<PlistValue>`**: Parse plist from a file path.
- **`toXml(obj: PlistValue): Promise<string>`**: Convert a JavaScript value to plist XML.
- **`toBinary(obj: PlistValue): Promise<Buffer>`**: Convert a JavaScript value to binary plist.
- **`binaryToXml(binaryData: Buffer): Promise<string>`**: Convert binary plist to XML.
- **`xmlToBinary(xmlData: string | Buffer): Promise<Buffer>`**: Convert XML plist to binary.

### Usage: Direct XML ↔ Binary
```ts
import plist from 'node-libplist';

// XML → Binary
const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>number</key><real>1.0</real></dict></plist>`;
const binary = await plist.xmlToBinary(xmlString);

// Binary → XML
const xmlOut = await plist.binaryToXml(binary);
```

### Usage: Object ↔ Plist
```ts
import plist from 'node-libplist';

// Object → XML/Binary (JSON-bridged)
const obj = { intVal: 42, realVal: 3.14 };
const xml = await plist.toXml(obj);
const bin = await plist.toBinary(obj);

// Parse buffer (XML or binary) to JS object (JSON-bridged)
const parsed = await plist.parse(bin);
```

### Notes
- Direct format conversions (`xmlToBinary`, `binaryToXml`) do not use the JSON bridge and preserve original plist types as-is.
- JSON-bridged conversions (`parse`, `toXml`, `toBinary`) follow libplist's JSON writer/parser:
	- Real values printed as integer-valued numbers (e.g., `1.0`) are emitted without a decimal and re-parsed as integers.
	- `0.0` is special-cased and stays a real.
	- Real values with fractional digits (e.g., `3.14`) remain real.
