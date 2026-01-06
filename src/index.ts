import { WASI } from 'wasi';
import { readFile } from 'fs/promises';
import { join } from 'path';

export type PlistPrimitive = string | number | boolean;
export type PlistValue = PlistPrimitive | PlistObject | PlistArray;
export type PlistObject = { [key: string]: PlistValue };
export type PlistArray = PlistValue[];

class LibPlistWASI {
  private instance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;
  private wasi: WASI | null = null;

  async init() {
    if (this.instance) {
      return;
    }

    this.wasi = new WASI({
      version: 'preview1',
      args: [],
      env: {},
      preopens: {}
    });

    const wasmPath = join(__dirname, '..', 'dist', 'libplist.wasm');
    const wasmBuffer = await readFile(wasmPath);
    
    const { instance } = await WebAssembly.instantiate(wasmBuffer, {
      ...this.wasi.getImportObject()
    });

    this.instance = instance;
    this.memory = instance.exports.memory as WebAssembly.Memory;
    this.wasi.start(instance);
  }

  private malloc(size: number): number {
    return (this.instance!.exports.malloc as Function)(size);
  }

  private free(ptr: number): void {
    (this.instance!.exports.free as Function)(ptr);
  }

  private writeToMemory(data: Buffer | string): { ptr: number; length: number } {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const ptr = this.malloc(buffer.length);
    const memoryBuffer = this.memory!.buffer;
    const view = new Uint8Array(memoryBuffer, ptr, buffer.length);
    const safeCopy = new Uint8Array(buffer);
    view.set(safeCopy);
    return { ptr, length: buffer.length };
  }

  private readFromMemory(ptr: number, length: number): Buffer {
    const view = new Uint8Array(this.memory!.buffer, ptr, length);
    return Buffer.from(view);
  }

  private readStringFromMemory(ptr: number, length: number): string {
    return this.readFromMemory(ptr, length).toString('utf8');
  }

  async parse(buffer: Buffer): Promise<PlistValue> {
    await this.init();
    
    const { ptr: dataPtr, length } = this.writeToMemory(buffer);
    const outLengthPtr = this.malloc(4);
    
    try {
      const resultPtr = (this.instance!.exports.plist_parse_to_json as Function)(
        dataPtr, length, outLengthPtr
      );
      
      if (!resultPtr) {
        throw new Error('Failed to parse plist');
      }
      
      const outLengthView = new Uint32Array(this.memory!.buffer, outLengthPtr, 1);
      const jsonStr = this.readStringFromMemory(resultPtr, outLengthView[0]);
      
      this.free(resultPtr);
      return JSON.parse(jsonStr);
    } finally {
      this.free(dataPtr);
      this.free(outLengthPtr);
    }
  }

  async parseFile(filePath: string): Promise<PlistValue> {
    const buffer = await readFile(filePath);
    return this.parse(buffer);
  }

  async toXml(obj: PlistValue): Promise<string> {
    await this.init();
    
    const jsonStr = JSON.stringify(obj);
    const { ptr: jsonPtr, length } = this.writeToMemory(jsonStr);
    const outLengthPtr = this.malloc(4);
    
    try {
      const resultPtr = (this.instance!.exports.plist_json_to_xml as Function)(
        jsonPtr, length, outLengthPtr
      );
      
      if (!resultPtr) {
        throw new Error('Failed to convert to XML');
      }
      
      const outLengthView = new Uint32Array(this.memory!.buffer, outLengthPtr, 1);
      const xmlStr = this.readStringFromMemory(resultPtr, outLengthView[0]);
      
      this.free(resultPtr);
      return xmlStr;
    } finally {
      this.free(jsonPtr);
      this.free(outLengthPtr);
    }
  }

  async toBinary(obj: PlistValue): Promise<Buffer> {
    await this.init();
    
    const jsonStr = JSON.stringify(obj);
    const { ptr: jsonPtr, length } = this.writeToMemory(jsonStr);
    const outLengthPtr = this.malloc(4);
    
    try {
      const resultPtr = (this.instance!.exports.plist_json_to_bin as Function)(
        jsonPtr, length, outLengthPtr
      );
      
      if (!resultPtr) {
        throw new Error('Failed to convert to binary');
      }
      
      const outLengthView = new Uint32Array(this.memory!.buffer, outLengthPtr, 1);
      const binaryData = this.readFromMemory(resultPtr, outLengthView[0]);
      
      this.free(resultPtr);
      return binaryData;
    } finally {
      this.free(jsonPtr);
      this.free(outLengthPtr);
    }
  }

  async binaryToXml(binaryData: Buffer): Promise<string> {
    await this.init();
    
    const { ptr: binPtr, length } = this.writeToMemory(binaryData);
    const outLengthPtr = this.malloc(4);
    
    try {
      const resultPtr = (this.instance!.exports.plist_bin_to_xml as Function)(
        binPtr, length, outLengthPtr
      );
      
      if (!resultPtr) {
        throw new Error('Failed to convert binary to XML');
      }
      
      const outLengthView = new Uint32Array(this.memory!.buffer, outLengthPtr, 1);
      const xmlStr = this.readStringFromMemory(resultPtr, outLengthView[0]);
      
      this.free(resultPtr);
      return xmlStr;
    } finally {
      this.free(binPtr);
      this.free(outLengthPtr);
    }
  }

  async xmlToBinary(xmlData: string | Buffer): Promise<Buffer> {
    await this.init();
    
    const { ptr: xmlPtr, length } = this.writeToMemory(xmlData);
    const outLengthPtr = this.malloc(4);
    
    try {
      const resultPtr = (this.instance!.exports.plist_xml_to_bin as Function)(
        xmlPtr, length, outLengthPtr
      );
      
      if (!resultPtr) {
        throw new Error('Failed to convert XML to binary');
      }
      
      const outLengthView = new Uint32Array(this.memory!.buffer, outLengthPtr, 1);
      const binaryData = this.readFromMemory(resultPtr, outLengthView[0]);
      
      this.free(resultPtr);
      return binaryData;
    } finally {
      this.free(xmlPtr);
      this.free(outLengthPtr);
    }
  }
}

const plist = new LibPlistWASI();

export default plist;
export { plist };

export const parse = (buffer: Buffer) => plist.parse(buffer);
export const parseFile = (filePath: string) => plist.parseFile(filePath);
export const toXml = (obj: PlistValue) => plist.toXml(obj);
export const toBinary = (obj: PlistValue): Promise<Buffer> => plist.toBinary(obj);
export const binaryToXml = (binaryData: Buffer) => plist.binaryToXml(binaryData);
export const xmlToBinary = (xmlData: string | Buffer): Promise<Buffer> => plist.xmlToBinary(xmlData);
