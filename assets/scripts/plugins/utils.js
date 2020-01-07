export function compressImg(imgSrc, imgWidth = 8) {
    return new Promise((resolve, reject) => {
        if (!imgSrc) {
            reject('imgSrc can not be empty!');
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
            var _a, _b;
            canvas.width = imgWidth;
            canvas.height = imgWidth;
            (_a = ctx) === null || _a === void 0 ? void 0 : _a.drawImage(img, 0, 0, imgWidth, imgWidth);
            const data = (_b = ctx) === null || _b === void 0 ? void 0 : _b.getImageData(0, 0, imgWidth, imgWidth);
            resolve(data);
        };
        img.src = imgSrc;
    });
}
export function getSrcFromImageData(imgData) {
    var _a;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    (_a = ctx) === null || _a === void 0 ? void 0 : _a.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}
export function createImgData(dataDetail) {
    var _a;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgWidth = Math.sqrt(dataDetail.length / 4);
    const newImageData = (_a = ctx) === null || _a === void 0 ? void 0 : _a.createImageData(imgWidth, imgWidth);
    for (let i = 0; i < dataDetail.length; i += 4) {
        let R = dataDetail[i];
        let G = dataDetail[i + 1];
        let B = dataDetail[i + 2];
        let Alpha = dataDetail[i + 3];
        newImageData.data[i] = R;
        newImageData.data[i + 1] = G;
        newImageData.data[i + 2] = B;
        newImageData.data[i + 3] = Alpha;
    }
    return newImageData;
}
export function hammingDistance(str1, str2) {
    let distance = 0;
    const str1Arr = str1.split('');
    const str2Arr = str2.split('');
    distance = Math.abs(str1Arr.length - str2Arr.length);
    str1Arr.forEach((letter, index) => {
        if (letter !== str2Arr[index]) {
            distance++;
        }
    });
    return distance;
}
export function cosineSimilarity(sampleFingerprint, targetFingerprint) {
    // cosθ = ∑n, i=1(Ai × Bi) / (√∑n, i=1(Ai)^2) × (√∑n, i=1(Bi)^2) = A · B / |A| × |B|
    const length = sampleFingerprint.length;
    let innerProduct = 0;
    for (let i = 0; i < length; i++) {
        innerProduct += sampleFingerprint[i] * targetFingerprint[i];
    }
    let vecA = 0;
    let vecB = 0;
    for (let i = 0; i < length; i++) {
        vecA += Math.pow(sampleFingerprint[i], 2);
        vecB += Math.pow(targetFingerprint[i], 2);
    }
    const outerProduct = Math.sqrt(vecA) * Math.sqrt(vecB);
    return innerProduct / outerProduct;
}
