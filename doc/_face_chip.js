//あいう
//
// ImageIndexerが出来たので不要になった
//
// 表情キーのメモとしてこのファイルは残す
// また、表情を規格化する必要が出来たら再考する
//

/** キャラクター顔グラフィックチップクラス */
cls.$chips.FaceChip = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Chip(), cls.Chip);

    //
    // 表情メモ:
    //
    // none 無し
    // smiling 微笑み
    // laughing 笑い
    // annoyed 苛々
    // angry 怒り
    // sad 悲しみ
    // crying 泣き
    // questioning 疑問
    // surprised 驚き
    // narvous 緊張
    // fearing 恐怖
    // awaking 気付き
    // proud 得意げ
    // appalling 呆れ
    //
    // 二次候補(該当画像が少ないもの):
    // panic 狼狽 ("驚き"で代用可能な場合が多い, いわゆる「アセ」だと画像が無い)
    // 照れ
    // surprised-cartoony 漫画的驚き
    // 企み
    //

    /** 表情を別種設定として加える
        expression 表情種別文字列, 基本はチップ画像ID準拠('none','smiling'等)だがそれ以外も可能
        posIndex   [top,left]=画像内での位置 ||
                   num=1-8の整数=インデックス指定, 今は396x192を前提に 上段:1234 下段:5678
        url        undefined=初期設定と同じ画像, str=別画像の場合はそのurl */
    kls.prototype.addExpression = function(expression, posIndex, url){
        var props = {};
        // クリップ位置
        var pos = [0, 0];
        if (typeof posIndex === 'number') {// インデックス設定
            // 現在は 96x96 を 384x192 で設定する前提
            if (posIndex === 1) pos = [0, 0];
            if (posIndex === 2) pos = [0, 96];
            if (posIndex === 3) pos = [0, 192];
            if (posIndex === 4) pos = [0, 288];
            if (posIndex === 5) pos = [96, 0];
            if (posIndex === 6) pos = [96, 96];
            if (posIndex === 7) pos = [96, 192];
            if (posIndex === 8) pos = [96, 288];
        } else {
            pos = posIndex;
        };
        props.clipPos = pos;
        // 別画像ならURL
        if (url !== undefined) props.url = url;
        this.addVariation(expression, props);
    };

    kls.prototype._clone = function(){
        var obj = kls._factory(
            this.getSize(),
            this.getPos(),
            this._variationData_.__default__
        );
        this._cloneData(obj);
        return obj;
    };

    /** 96x96顔グラチップを生成する, 396x192画像を使うのがデフォルト設定 */
    kls.factory96x96 = function(url, position, options){
        var opts = options || {};
        var obj = this._factory([96, 96], position, {
            url: url,
            fullSize: ('imageSize' in opts)? opts.imageSize: [384, 192],
            clipPos: ('defaultFace' in opts)? opts.defaultFace: [0, 0]
        });
        return obj;
    };

    /** 96x96顔グラチップを別サイズ画像から生成する */
    kls.factory96x96ByAnother = function(url, position, imageSize, clipPos, clipSize){
        var obj = this._factory([96, 96], position, {
            type: 'resize',
            url: url,
            fullSize: imageSize,
            clipPos: clipPos,
            clipSize: clipSize
        });
        return obj;
    };

    return kls;
//}}}
})();
