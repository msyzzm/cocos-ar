// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;
import Presbyopic, { FeatureMethod } from './plugins/presbyopic';
import { resolve } from 'dns';

const widthLimit = 320;

@ccclass
export default class Test extends cc.Component {

    @property(cc.Node)
    private cameraSprite: cc.Node = null;
    @property(cc.Node)
    private compareSprite: cc.Node = null;
    @property(cc.Node)
    private targetSprite: cc.Node = null;
    @property(cc.Label)
    private resultLaber: cc.Label = null;

    @property({ type: cc.Texture2D })
    textures: cc.Texture2D[] = [];
    cameraTexture: cc.Texture2D;
    cameraImageData: {
        data: Uint8ClampedArray,
        width: number,
        height: number,
    };

    compareTimer: number;
    compareTimerDis = 10;
    imgWidth: 8;
    zoneAmount: '4';

    // 手机相机
    camera;

    start() {
        this.compareTimer = this.compareTimerDis;

        // 获取目标图
        var texture = this.textures[0];
        var size = cc.size(texture.width, texture.height);
        this.targetSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        if (size.width > widthLimit) {
            this.targetSprite.width = widthLimit;
            this.targetSprite.height = size.height / size.width * widthLimit;
        }

        // 相机图替代图
        this.cameraTexture = this.textures[1];
        var texture = this.textures[1];
        var size = cc.size(texture.width, texture.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
        }

        var rTexture = new cc.RenderTexture();
        rTexture.initWithElement(texture.getHtmlElementObj());
        var data = this.createQuadData(rTexture.width,rTexture.height);
        rTexture.readPixels(data);
        // this.cameraImageData = {
        //     data: new Uint8ClampedArray(data.buffer),
        //     width: rTexture.width,
        //     height: rTexture.height,
        // }

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = texture.width;
        canvas.height = texture.height;
        // ctx.drawImage(texture.getHtmlElementObj(),0,0);
        // var imagedata = ctx.getImageData(0,0,texture.width,texture.height);
        var imagedata = ctx.createImageData(texture.width,texture.height);
        imagedata.data.set(data);
        this.cameraImageData = imagedata;

        // 是否微信小游戏
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            this.camera = wx.createCamera({
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                devicePosition: 'back',
                flash: 'auto',
                size: 'small',
                success: (result) => {
                    cc.log(result);
                },
                fail: (result) => {
                    cc.log(result);
                },
                complete: (result) => {
                    cc.log(result);
                },
            });
            this.camera.listenFrameChange();
            this.camera.onCameraFrame(this.onCameraFrame.bind(this));
        }
    }

    // update(dt){
    //     this.compareTimer-=dt;
    //     if(this.compareTimer<=0){
    //         this.compareTimer = this.compareTimerDis;
    //         this.compare().then(cc.log);
    //     }
    // }

    onCameraFrame(res) {
        // 渲染相机图
        this.cameraImageData = {
            data: new Uint8ClampedArray(res.data),
            width: res.width,
            height: res.height,
        };
        let size = cc.size(res.width, res.height);
        this.cameraTexture = new cc.Texture2D();
        this.cameraTexture.initWithData(res.data, cc.Texture2D.PixelFormat.RGBA8888, size.width, size.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.cameraTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size)
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
        }
    }

    // 对比结果
    async compare() {
        cc.log('compare start');

        const targetResult = await new Presbyopic({
            imgSrc: this.textures[0].getHtmlElementObj().id,
            imgWidth: this.imgWidth,
        }).colorSeperate();

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = this.cameraImageData.width;
        canvas.height = this.cameraImageData.height;
        ctx.putImageData(this.cameraImageData,0,0);


        let size = cc.size(this.cameraImageData.width, this.cameraImageData.height);
        var compareTexture = new cc.Texture2D();
        compareTexture.initWithElement(canvas);
        this.compareSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.cameraTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size)
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
        }

        var src = await this.getSrc(canvas);
        console.log(src);

        const cameraResult = await new Presbyopic({
            imgSrc: src,
            imgWidth: this.imgWidth,
        }).colorSeperate();
        // 显示结果
        this.resultLaber.string = JSON.stringify(Presbyopic.compareFingerprint(targetResult.fingerprint, cameraResult.fingerprint, FeatureMethod.ColorSeperate), null, 2);

        cc.log('compare complete');
    }

    async getSrc(canvas): Promise<string>{
        return new Promise(function(resolve,reject){
            var src;
            if(cc.sys.platform === cc.sys.WECHAT_GAME){
                canvas.toTempFilePath({
                    success: function(res){
                        src = res.tempFilePath;
                        wx.setClipboardData({
                            data: src,
                            success(res) {
                                console.log(res) // data
                                resolve(src);
                            }
                        });
                    }
                });
            }else{
                src = canvas.toDataURL();
                resolve(src);
            }
        });
    }

    createQuadData(width, height) {
        let data = new Uint8Array(width * height * 4);
        data.fill(255);
        // for (let i = 0; i < width; i++) {
        //     for (let n = 0; n < height; n++) {
        //         var num = i * width * 4 + n * 4;
        //         //R
        //         data[num] = 255;
        //         //G
        //         data[num + 1] = 255;
        //         //B
        //         data[num + 2] = 255;
        //         //A
        //         data[num + 3] = 255;
        //     }
        // }
        return data;
    }

    createImageData(texture: cc.Texture2D, arrayBuffer: ArrayBuffer, width: number, height: number): ImageData {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            return this.wxCreateImageData(texture, width, height);
        }
        else {
            return new ImageData(new Uint8ClampedArray(arrayBuffer), width, height);
        }
    }

    wxCreateImageData(texture: cc.Texture2D, width: number, height: number): ImageData {
        var canvas: HTMLCanvasElement = wx.createCanvas();
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(texture.getHtmlElementObj(), 0, 0);
        var imageData = ctx.getImageData(0, 0, width, height);
        return imageData;
    }

    save(buff) {
        var data = new Uint8Array(buff);
        var blob = new Blob([data]);
        var url = window.URL.createObjectURL(blob);
        return url;
    }

    // public method for encoding an Uint8Array to base64
    arrayBufferToBase64(input) {
        input = new Uint8Array(input);
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }
}
