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
    cameraImageData: {
        data: Uint8ClampedArray,
        width: number,
        height: number,
    };

    compareTimer: number;
    compareTimerDis = 5;
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
        var texture = this.textures[1];
        var size = cc.size(texture.width, texture.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
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

    update(dt){
        this.compareTimer-=dt;
        if(this.compareTimer<=0){
            this.compareTimer = this.compareTimerDis;
            this.compare();
        }
    }

    onCameraFrame(res) {
        // 渲染相机图
        this.cameraImageData = {
            data: new Uint8ClampedArray(res.data),
            width: res.width,
            height: res.height,
        };
        let size = cc.size(res.width, res.height);
        var cameraTexture = new cc.Texture2D();
        cameraTexture.initWithData(res.data, cc.Texture2D.PixelFormat.RGBA8888, size.width, size.height);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(cameraTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size)
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
        }
    }

    // 对比结果
    async compare() {
        cc.log('compare start');

        var targetResult = await new Presbyopic({
            imgSrc: this.textures[0].getHtmlElementObj().id,
            imgWidth: this.imgWidth,
        }).getHash();
        cc.log(targetResult);
        
        if(this.cameraImageData === undefined){
            var texture = this.textures[1];
            var image = texture.getHtmlElementObj();
            if(cc.sys.platform === cc.sys.WECHAT_GAME){
                image = await this.wxLoadSrc(image);
            }
            cc.log(image);
            var canvas = document.createElement('canvas');
            canvas.width = texture.width;
            canvas.height = texture.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image,0,0);
            this.cameraImageData = ctx.getImageData(0,0,texture.width,texture.height);
        }
        
        var canvas = document.createElement('canvas');
        canvas.width = this.cameraImageData.width;
        canvas.height = this.cameraImageData.height;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.createImageData(this.cameraImageData.width,this.cameraImageData.height);
        imageData.data.set(this.cameraImageData.data);
        ctx.putImageData(imageData,0,0);

        let size = cc.size(this.cameraImageData.width, this.cameraImageData.height);
        var compareTexture = new cc.Texture2D();
        compareTexture.initWithElement(canvas);
        this.compareSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(compareTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size)
        if (size.width > widthLimit) {
            this.cameraSprite.width = widthLimit;
            this.cameraSprite.height = size.height / size.width * widthLimit;
        }

        var src = await this.getSrc(canvas);
        var cameraResult = await new Presbyopic({
            imgSrc: src,
            imgWidth: this.imgWidth,
        }).getHash();
        cc.log(cameraResult);
        // 显示结果
        this.resultLaber.string = JSON.stringify(Presbyopic.compareFingerprint(targetResult.fingerprint, cameraResult.fingerprint, FeatureMethod.PerceptualHash), null, 2);

        cc.log('compare complete');
    }

    async wxLoadSrc(image): Promise<HTMLImageElement>{
        return new Promise(function(resolve,reject){
            image.src = image.id;
            image.onload = function(){
                resolve(image);
            }
        })
    }

    async getSrc(canvas): Promise<string>{
        return new Promise(function(resolve,reject){
            var src;
            if(cc.sys.platform === cc.sys.WECHAT_GAME){
                canvas.toTempFilePath({
                    success: function(res){
                        src = res.tempFilePath;
                        console.log(res) // data
                        resolve(src);
                        // wx.setClipboardData({
                        //     data: src,
                        //     success(res) {
                        //     }
                        // });
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
}
