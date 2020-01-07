import * as PerceptualHash from './hashAlgorithm.js';
import * as ColorSeperate from './colorSeperate.js';
import * as ContentFeature from './contentFeature.js';
import * as Utils from './utils.js';

enum FeatureMethod{
    AverageHash = "average hash",
    PerceptualHash = "perceive hash",
    ColorSeperate = "color seperate",
    ContentFeature = "content feature",
}
class ChainHandler {
    imgData: any;
    fingerprint: any;
    method: any;
    
    constructor({ imgData, fingerprint, method = null }) {
        this.imgData = imgData;
        this.fingerprint = fingerprint;
        this.method = method;
    }
    getNewImg() {
        return Utils.getSrcFromImageData(this.imgData);
    }
}
export default class Presbyopic {
    imgSrc: string;
    imgWidth: number;
    constructor({ imgSrc = '', imgWidth = 8 }) {
        this.imgSrc = imgSrc;
        this.imgWidth = imgWidth;
    }
    static compareFingerprint(fingerprint1, fingerprint2, method) {
        if (!method) {
            throw new Error(`Param "method" must be one of "perceptual hash", "color seperate" or "content feature", but found "${method}"`);
        }
        if (typeof fingerprint1 !== typeof fingerprint2) {
            throw new Error(`Type ${typeof fingerprint1} of fingerprint1 could not compare with type ${typeof fingerprint2} of fingerprint2.`);
        }
        if (method === FeatureMethod.ColorSeperate || method === FeatureMethod.ContentFeature) {
            if (fingerprint1.length !== fingerprint2.length) {
                throw new Error(`The length of two fingerprint must be equal, but found fingerprint1's length is ${fingerprint1.length} and fingerprint2's length is ${fingerprint2.length}`);
            }
        }
        if (method === FeatureMethod.AverageHash || method === FeatureMethod.PerceptualHash) {
            fingerprint1 = fingerprint1;
            fingerprint2 = fingerprint2;
            const hammingDistance = Utils.hammingDistance(fingerprint1, fingerprint2);
            return {
                hammingSimilarity: ((fingerprint1.length - hammingDistance) / fingerprint1.length).toFixed(2),
                cosineSimilarity: (Utils.cosineSimilarity(fingerprint1.split('').map(f => Number(f)), fingerprint2.split('').map(f => Number(f)))).toFixed(2),
                method
            };
        }
        if (method === FeatureMethod.ColorSeperate || FeatureMethod.ContentFeature) {
            fingerprint1 = fingerprint1;
            fingerprint2 = fingerprint2;
            const hammingDistance = Utils.hammingDistance(fingerprint1.join(''), fingerprint2.join(''));
            return {
                hammingSimilarity: method === FeatureMethod.ColorSeperate ? undefined : ((fingerprint1.length - hammingDistance) / fingerprint1.length).toFixed(2),
                cosineSimilarity: (Utils.cosineSimilarity(fingerprint1, fingerprint2)).toFixed(2),
                method
            };
        }
    }
    async compressImg() {
        return await Utils.compressImg(this.imgSrc, this.imgWidth);
    }
    async compressFingerprint() {
        const imgData = await Utils.compressImg(this.imgSrc, this.imgWidth);
        return imgData;
    }
    async getHash(isPHash = false) {
        const imgData = await this.compressImg();
        const grayImgData = PerceptualHash.createGrayscale(imgData);
        const fingerprint = isPHash ? PerceptualHash.getPHashFingerprint(grayImgData) : PerceptualHash.getAHashFingerprint(grayImgData);
        return new ChainHandler({
            imgData: grayImgData,
            fingerprint,
            method: FeatureMethod.PerceptualHash
        });
    }
    async colorSeperate(zoneAmount = 4) {
        const imgData = await this.compressImg();
        const simplifiedList = ColorSeperate.simplifyColorData(imgData, zoneAmount);
        const zonedList = ColorSeperate.seperateListToColorZone(simplifiedList);
        const fingerprint = ColorSeperate.getFingerprint(zonedList, zoneAmount);
        return new ChainHandler({
            imgData,
            fingerprint,
            method: FeatureMethod.ColorSeperate
        });
    }
    async contentFeature() {
        const imgData = await this.compressImg();
        const threshold = ContentFeature.OTSUAlgorithm(imgData);
        const newImgData = ContentFeature.binaryzation(imgData, threshold);
        const fingerprint = ContentFeature.getContentFeatureFingerprint(newImgData);
        return new ChainHandler({
            imgData: newImgData,
            fingerprint,
            method: FeatureMethod.ContentFeature
        });
    }
}
