//
// 旧画像テキストクラス
//
// 1文字1画像URLしか対応してなくて、クリップすることが出来ない
//
// もう使わないと思うけど、処理速度面にはこちらの方が軽いので一応保存しておく
// 割と生成と廃棄を繰り返す要素になるし
//
cls.$trials.ImageTextBlock = (function(){

    var kls = function(){
        /** 1文字のサイズ, [横px, 縦px] */
        this._characterSize = undefined;
        /** 文字数 */
        this._length = undefined;
        /** 文字画像マップ, '<文字>':'<画像URL>' */
        this._imageMap = undefined;
        /** 現在の文字列 */
        this._imageText = '';
        /** 文字ブロックリスト, [0]=最も左の桁 */
        this._characterBlocks = undefined;
        /** 左寄せか右寄せか, 'left' || 'right' */
        this._textAlign = 'left';
        /** 文字間隔 */
        this._spacing = 0; //! 初期値は実質factory内のものが反映されている
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.toString = function(){ return 'ImageTextBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'imagetext';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._imageMap = {};
        self._characterBlocks = [];
        $f.each($f.squaring(self._characterSize, self.getSize(), self._spacing), function(i, partPos){
            var b = cls.block(self._characterSize, partPos);
            self.append(b);
            b.drawAndShow();
            self._characterBlocks.push(b);
        });
    };

    /** 文字と画像のマッピングを設定する */
    kls.prototype.setImage = function(character, url){
        this._imageMap[character] = url;
    };

    // 単なるアクセサ群
    kls.prototype.setImageText = function(text){
        this._imageText = text;
    };
    kls.prototype.setTextAlign = function(value){
        this._textAlign = value;
    };

    /** 描画処理のためにフックする */
    kls.prototype._draw = function(){
        var self = this;
        cls.Block.prototype._draw.apply(this);
        // 全ての文字をクリア
        $f.each(this._characterBlocks, function(i, v){ v.style({ img:'none' }) });
        // テキスト無しなら終了
        if (this._imageText === '') return;
        // 文字リストを逆順を考慮して用意
        var characters = this._imageText.split('');
        var blocks = this._characterBlocks.slice();
        if (this._textAlign === 'right') {
            characters.reverse();
            blocks.reverse();
        };
        // 反映
        $f.each(blocks, function(i, block){
            var urlOrNone = 'none';
            var c = characters[i];
            if (c !== undefined && self._imageMap[c] !== undefined) {
                urlOrNone = self._imageMap[c];
            };
            block.style({ img:urlOrNone });
        });
    };

    /**
        options:
            spacing:
    */
    kls.factory = function(characterSize, length, pos, options){
        var opts = options || {};
        var spacing = ('spacing' in opts)? opts.spacing: 0;
        // 現状は、1行のみの固定長
        var size = [
            characterSize[0] * length + spacing * (length - 1),
            characterSize[1]
        ];
        var obj = cls.Block._factory.apply(this, [size, pos]);
        obj._characterSize = characterSize;
        //! 第2引数を文字列と間違えて '123456789' などとしたら
        //  メモリオーバーでフリーズした　ということがあった
        if (length >= 256) {
            throw new Error('RPGMaterial:ImageTextBlock.factory, too meny length=' + length);
        };
        obj._length = length;
        obj._spacing = spacing;
        __INITIALIZE(obj);
        return obj;
    };

    return kls;

})();


//tester.add(1, 'ImageTextBlock, basic usage', function(u, $d){
//    // 左から
//    var it = cls.$trials.ImageTextBlock.factory([5, 9], 5);
//    var i;
//    for (i = 0; i < 10; i++) { it.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it.setImageText('0123456789');
//    it.drawAndShow();
//    $('#image_text_block').append(it.getView());
//    // 右から
//    var it2 = cls.$trials.ImageTextBlock.factory([5, 9], 5, [10, 0]);
//    for (i = 0; i < 10; i++) { it2.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it2.setTextAlign('right');
//    it2.setImageText('0123456789');
//    it2.drawAndShow();
//    $('#image_text_block').append(it2.getView());
//    // 左からで空桁有り
//    var it3 = cls.$trials.ImageTextBlock.factory([5, 9], 5, [0, 30]);
//    for (i = 0; i < 10; i++) { it3.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it3.setImageText('100');
//    it3.drawAndShow();
//    $('#image_text_block').append(it3.getView());
//    // 右からで空桁有り
//    var it4 = cls.$trials.ImageTextBlock.factory([5, 9], 5, [10, 30]);
//    for (i = 0; i < 10; i++) { it4.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it4.setTextAlign('right');
//    it4.setImageText('200');
//    it4.drawAndShow();
//    $('#image_text_block').append(it4.getView());
//    // 再描画時に前の内容がクリアされているか
//    var it5 = cls.$trials.ImageTextBlock.factory([5, 9], 5, [0, 60]);
//    for (i = 0; i < 10; i++) { it5.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it5.setImageText('01234');
//    it5.drawAndShow();
//    it5.setImageText('99');
//    it5.draw();
//    $('#image_text_block').append(it5.getView());
//    // 文字間隔付き
//    var it6 = cls.$trials.ImageTextBlock.factory([5, 9], 9, [10, 60], { spacing:2 });
//    for (i = 0; i < 10; i++) { it6.setImage(i + '', './sample_images/text/n' + i + '.png') };
//    it6.setImageText('141421356');
//    it6.drawAndShow();
//    $('#image_text_block').append(it6.getView());
//});
