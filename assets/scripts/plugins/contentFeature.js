var GrayscaleWeight;
(function (GrayscaleWeight) {
    GrayscaleWeight[GrayscaleWeight["R"] = 0.299] = "R";
    GrayscaleWeight[GrayscaleWeight["G"] = 0.587] = "G";
    GrayscaleWeight[GrayscaleWeight["B"] = 0.114] = "B";
})(GrayscaleWeight || (GrayscaleWeight = {}));
function toGray(imgData) {
    const grayData = [];
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = ~~(data[i] * GrayscaleWeight.R + data[i + 1] * GrayscaleWeight.G + data[i + 2] * GrayscaleWeight.B);
        data[i] = data[i + 1] = data[i + 2] = gray;
        grayData.push(gray);
    }
    return grayData;
}
// OTSU algorithm
// rewrite from http://www.labbookpages.co.uk/software/imgProc/otsuThreshold.html
export function OTSUAlgorithm(imgData) {
    const grayData = toGray(imgData);
    let ptr = 0;
    let histData = Array(256).fill(0);
    let total = grayData.length;
    while (ptr < total) {
        let h = 0xFF & grayData[ptr++];
        histData[h]++;
    }
    let sum = 0;
    for (let i = 0; i < 256; i++) {
        sum += i * histData[i];
    }
    let wB = 0;
    let wF = 0;
    let sumB = 0;
    let varMax = 0;
    let threshold = 0;
    for (let t = 0; t < 256; t++) {
        wB += histData[t];
        if (wB === 0)
            continue;
        wF = total - wB;
        if (wF === 0)
            break;
        sumB += t * histData[t];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;
        let varBetween = wB * wF * Math.pow((mB - mF), 2);
        if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
        }
    }
    return threshold;
}
export function binaryzation(imgData, threshold) {
    var _a;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgWidth = Math.sqrt(imgData.data.length / 4);
    const newImageData = (_a = ctx) === null || _a === void 0 ? void 0 : _a.createImageData(imgWidth, imgWidth);
    for (let i = 0; i < imgData.data.length; i += 4) {
        let R = imgData.data[i];
        let G = imgData.data[i + 1];
        let B = imgData.data[i + 2];
        let Alpha = imgData.data[i + 3];
        let sum = (R + G + B) / 3;
        newImageData.data[i] = sum > threshold ? 255 : 0;
        newImageData.data[i + 1] = sum > threshold ? 255 : 0;
        newImageData.data[i + 2] = sum > threshold ? 255 : 0;
        newImageData.data[i + 3] = Alpha;
    }
    return newImageData;
}
export function getContentFeatureFingerprint(imgData) {
    const data = imgData.data;
    const contentFeature = [];
    for (let i = 0; i < data.length; i += 4) {
        contentFeature.push(data[i] === 255 ? 1 : 0);
    }
    return contentFeature;
}
