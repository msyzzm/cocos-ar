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
import Presbyopic from './plugins/presbyopic'
const widthLimit = 320;

@ccclass
export default class Test extends cc.Component {

    @property(cc.Node)
    private cameraSprite: cc.Node = null;
    @property(cc.Node)
    private targetSprite: cc.Node = null;
    @property(cc.Label)
    private resultLaber: cc.Label = null;

    @property({ type: cc.Texture2D })
    textures: cc.Texture2D[] = [];
    cameraTexture: cc.Texture2D;
    cameraImageData: ArrayBuffer;

    compareTimer: number;
    imgWidth: 8;
    zoneAmount: '4';
    
    cameraResult = null;
    targetResult = null;
    compareResult = null;

    // 手机相机
    camera;

    start() {
        this.compareTimer = 5;

        // 获取目标图
        var texture = this.textures[0];
        var size = cc.size(texture.width, texture.height);
        this.targetSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        if(size.width>widthLimit){
            this.targetSprite.width = widthLimit;
            this.targetSprite.height = size.height/size.width*widthLimit;
        }

        // 相机图替代图
        this.cameraTexture = this.textures[1];
        var texture = this.textures[1];
        var size = cc.size(texture.width, texture.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        if(size.width>widthLimit){
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height/size.width*widthLimit;
        }

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
                }
            });
            this.camera.listenFrameChange();
            this.camera.onCameraFrame(this.onCameraFrame.bind(this));
        }
    }

    update(dt){
        this.compareTimer-=dt;
        if(this.compareTimer<=0){
            this.compareTimer = 5;
            this.compare().then(cc.log);
        }
    }

    onCameraFrame(res){
        // 渲染相机图
        this.cameraImageData = res.data;
        let size = cc.size(res.width, res.height);
        this.cameraTexture = new cc.Texture2D();
        // var image = new Image();
        // image.src = 'data:image/png;base64,'+this.encode(new Uint8Array(this.cameraImageData));
        // this.cameraTexture.initWithElement(image);
        this.cameraTexture.initWithData(res.data, cc.Texture2D.PixelFormat.RGBA8888, size.width, size.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.cameraTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size)
        if(size.width>widthLimit){
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height/size.width*widthLimit;
        }
    }

    // 对比结果
    async compare() {
        cc.log('compare start');
        this.targetResult = await new Presbyopic({
            imgSrc: this.textures[0].getHtmlElementObj().id,
            imgWidth: this.imgWidth,
        }).getHash();

        var src;
        if(this.cameraTexture.getHtmlElementObj() === undefined){
            src = 'data:image/png;base64,'+await this.encode(new Uint8Array(this.cameraImageData));
        }
        else{
            src = this.cameraTexture.getHtmlElementObj().id;
        }
        cc.log('camera src:',src);
        this.cameraResult = await new Presbyopic({
            imgSrc: src,
            imgWidth: this.imgWidth,
        }).getHash();
        // 显示结果
        this.resultLaber.string = JSON.stringify(Presbyopic.compareFingerprint(this.targetResult.fingerprint, this.cameraResult.fingerprint, 'average hash'), null, 2);
        return 'compare complete';
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

    createImageData(texture: cc.Texture2D,arrayBuffer:ArrayBuffer,width:number,height:number):ImageData{
        if(cc.sys.platform === cc.sys.WECHAT_GAME){
            return this.wxCreateImageData(texture,width,height);
        }
        else{
            return new ImageData(new Uint8ClampedArray(arrayBuffer),width,height);
        }
    }

    wxCreateImageData(texture: cc.Texture2D,width:number,height:number):ImageData{
        var canvas:HTMLCanvasElement = wx.createCanvas();
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(texture.getHtmlElementObj(),0,0);
        var imageData = ctx.getImageData(0,0,width,height);
        return imageData;
    }

    // public method for encoding an Uint8Array to base64
    async encode (input) {
        cc.log('encode start:',new Date());
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
        cc.log('encode end:',new Date());
        // cc.log(input,' => ',output);
        return output;
    }
}
