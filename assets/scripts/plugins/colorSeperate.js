export function simplifyColorData(imgData, zoneAmount = 16) {
    const colorZoneDataList = [];
    const zoneStep = 256 / zoneAmount;
    const zoneBorder = [0];
    for (let i = 1; i <= zoneAmount; i++) {
        zoneBorder.push(zoneStep * i - 1);
    }
    imgData.data.forEach((data, index) => {
        if ((index + 1) % 4 !== 0) {
            for (let i = 0; i < zoneBorder.length; i++) {
                if (data > zoneBorder[i] && data <= zoneBorder[i + 1]) {
                    data = i;
                }
            }
        }
        colorZoneDataList.push(data);
    });
    return colorZoneDataList;
}
export function seperateListToColorZone(simplifiedDataList) {
    const zonedList = [];
    let tempZone = [];
    simplifiedDataList.forEach((data, index) => {
        if ((index + 1) % 4 !== 0) {
            tempZone.push(data);
        }
        else {
            zonedList.push(JSON.stringify(tempZone));
            tempZone = [];
        }
    });
    return zonedList;
}
export function getFingerprint(zonedList, zoneAmount = 16) {
    const colorSeperateMap = {};
    for (let i = 0; i < zoneAmount; i++) {
        for (let j = 0; j < zoneAmount; j++) {
            for (let k = 0; k < zoneAmount; k++) {
                colorSeperateMap[JSON.stringify([i, j, k])] = 0;
            }
        }
    }
    zonedList.forEach(zone => {
        colorSeperateMap[zone]++;
    });
    return Object.values(colorSeperateMap);
}
