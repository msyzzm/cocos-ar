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
var resemble = require('resemblejs');


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

    cameraData : any;
    imageData : any;
    compareTimer: number;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    createQuadData(width, height) {
        let data = new Uint8Array(width * height * 4);
        for (let i = 0; i < width; i++) {
            for (let n = 0; n < height; n++) {
                var num = i * width * 4 + n * 4;
                //R
                data[num] = 255;
                //G
                data[num + 1] = 255;
                //B
                data[num + 2] = 255;
                //A
                data[num + 3] = 255;
            }
        }
        return data;
    }

    onComplete(data){
        cc.log('Compare Result:',data);
        this.resultLaber.string = JSON.stringify(data,null,2);
    }

    start() {
        this.compareTimer = 5;

        // resemble.outputSettings({
        //     errorColor: {
        //         red: 255,
        //         green: 0,
        //         blue: 255
        //     },
        //     errorType: "movement",
        //     transparency: 0.3,
        //     largeImageThreshold: 1200,
        //     useCrossOrigin: false,
        //     outputDiff: true
        // });
        // 渲染一张白图来测试功能
        let size = cc.size(100, 200);
        let newTexture = new cc.Texture2D();
        let data = this.createQuadData(size.width, size.height);
        newTexture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, size.width, size.height);
        newTexture.handleLoadedTexture();
        let spriteFrame = new cc.SpriteFrame(newTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        this.cameraSprite.width = size.width;
        this.cameraSprite.height = size.height;

        // 获取目标图
        size = cc.size(this.textures[0].width, this.textures[0].height);
        var render = new cc.RenderTexture();
        render.initWithSize(size.width, size.height);
        render.drawTextureAt(this.textures[0], 0, 0);
        var renderData = this.createQuadData(size.width, size.height);
        render.readPixels(renderData);
        this.targetSprite.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.textures[0], new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        // this.targetSprite.width = size.width;
        // this.targetSprite.height = size.height;

        // var imageData = new ImageData(new Uint8ClampedArray(renderData),size.width,size.height);
        this.imageData = {
            data: new Uint8ClampedArray(renderData),
            width: size.width,
            height: size.height,
        }
        cc.log('imageData:',this.imageData);

        // 测试resemble功能，分析目标图
        // var api = resemble(this.imageData).onComplete(function (data) {
        //     cc.log(data);
        // });

        var diff = resemble(this.imageData)
            .compareTo(this.imageData)
            .ignoreAntialiasing()
            .onComplete(this.onComplete.bind(this));

        // 是否微信小游戏
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            var camera = wx.createCamera({
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
            camera.listenFrameChange();
            camera.onCameraFrame(this.onCameraFrame);
        }
    }

    update(dt){
        this.compareTimer-=dt;
        if(this.compareTimer<=0){
            this.compare();
            this.compareTimer = 5;
        }
    }

    onCameraFrame(res){
        // 渲染相机图
        let size = cc.size(res.width, res.height);
        let newTexture = new cc.Texture2D();
        newTexture.initWithData(res.data, cc.Texture2D.PixelFormat.RGBA8888, size.width, size.height);
        newTexture.handleLoadedTexture();
        let spriteFrame = new cc.SpriteFrame(newTexture, new cc.Rect(0, 0, size.width, size.height), false, cc.Vec2.ZERO, size);
        this.cameraSprite.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        this.cameraSprite.width = size.width;
        this.cameraSprite.height = size.height;

        // 构造相机图数据
        this.cameraData = {
            data: new Uint8ClampedArray(res.data),
            width: size.width,
            height: size.height,
        }
    }

    // 对比结果
    compare() {
        cc.log('compare cameraData:',this.cameraData);
        if(this.imageData == null || this.cameraData == null) return;
        var diff = resemble(this.imageData)
            .compareTo(this.cameraData)
            .scaleToSameSize()
            .ignoreAntialiasing()
            .onComplete(this.onComplete.bind(this));
    }
}