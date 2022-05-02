import CBOR from './cbor';
function str(arr: Uint8Array, slice_end:number|null = null) {
    if(slice_end) arr = arr.slice(0, slice_end);
 return Array.from(arr).map((v, i) => {if (v >=32 && v < 127) return String.fromCharCode(v); else return ` ${v} `}).join("")
}
// details parsed from here` https://medium.com/numbers-protocol/cai-series-1-how-to-inject-jumbf-metadata-into-jpg-c76826f10e6d
class Box {
    // size - 2 bytes
    lBox:number = 0;
    // identifier - jumd
    tBox:string;
    payload: Uint8Array|null = null;
    headerSize:number = 0;
    constructor(rawData: DataView) {
        this.lBox = rawData.getUint32(0, false);
        console.log("size bin",this.lBox, new Array(4).fill(0).map((_, i) => rawData.getUint8(i)) )
        this.headerSize += 4;
        this.tBox = str(new Uint8Array(new Array(4).fill(0).map((_, i) => rawData.getUint8(this.headerSize + i))));
        this.headerSize += 4;
        console.log("superbox size is", this.lBox, this.tBox, "hha", rawData.byteLength);
        this.payload = new Uint8Array(this.lBox/4).map((_, i) =>rawData.getUint8(this.headerSize + i));
        console.log("final header size is", this.headerSize);
        console.log("payload:", str(this.payload));
    }
}

class SuperBox extends Box {
};

class DescriptionBox extends Box {
    type: Uint8Array|null = null;
    toggles: number = 0;
    label: string|null = null;

    constructor(rawData: DataView) {
        super(rawData);
        console.log("descr header", this.lBox, this.tBox);
        
        this.type = new Uint8Array(16).map((_,i) => rawData.getUint8(i+this.headerSize));
        this.headerSize += 16;
        this.toggles = rawData.getUint8(this.headerSize);
        this.headerSize += 1;
        this.label = Array(15).map((_, i) => String.fromCharCode(rawData.getUint8(this.headerSize + i ))).join("") 
        this.headerSize += 15;
        console.log("description:",this.label, this.label, "meh")
    }
};

class ContentBox extends Box {
    payload_string:string|undefined|null = null;
    payload_json:object|null = null;
    constructor(rawData: DataView) {
        super(rawData);
        if (!this.payload) {
            console.log("no palod, returning early");
            return;
        }
        this.payload_string = Array.from(this.payload).map((v, i) => String.fromCharCode(v)).join("")
        console.log("payload is", this.payload_string);
        console.log("cbor decoded:", CBOR.decode(this.payload.buffer));
        this.payload_json = JSON.parse(this.payload_string);
    }
};


class Jumbf {
    superBox: SuperBox|null = null;
    descriptionBox: DescriptionBox| null= null;
    contentBox: ContentBox| null = null;
    constructor(rawData: DataView) {
        rawData = new DataView(rawData.buffer.slice(8));
        let rest;
        this.superBox = new SuperBox(rawData);
        rest = new DataView(rawData.buffer.slice(this.superBox.headerSize));
        this.descriptionBox = new DescriptionBox(rest);
        rest = new DataView(rawData.buffer.slice(this.superBox.headerSize+this.descriptionBox.headerSize)); 
        this.contentBox = new ContentBox(rest);
    }

}

export {
    Jumbf
}