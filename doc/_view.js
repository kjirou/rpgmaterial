//あいう <- For auto file encoding

//
// jQueryとTitaniumMobileでViewを共通化しようと思いViewクラスを作ってたバージョン
// 良く考えると、このアプリに関してはほぼWebのみになるので、共通化しても意味がない
// 逆に不便になるのでマイナスになる
//
// TitaniumMobile対策にjQeuryのAPIを絞って使うのはいいことで
// その為にViewを介すこと自体は悪くない可能性はあるが
// それをこのアプリでやる必要は無い
// また、仮にここでやることが良いことだとしても、一回泥移行をした後じゃないと碌なものにならない
//
// ステータスは
// View.style の入力チェックを書いていた時に止めて、未テスト
//

/**
 * JSRPGMaker
 *
 * @dependency jQuery v1.7 <http://jquery.com/>
 *             JSDeferred v0.4 <http://cho45.stfuawsc.com/jsdeferred/doc/intro.html>
 * @author kjirou[dot]web[at]google[dot]com
 *         <http://kjirou.sakura.ne.jp/mt/>
 * @charset utf-8
 */
var JSRPGMaker = (function(){

var __classScope__ = this;

// 依存関係チェック
if ('JSRPGMaker' in __classScope__ && __classScope__.JSRPGMaker !== undefined) {
    alert('`JSRPGMaker` is already defined');
    return;
};
if ('Deferred' in this === false) {
    alert('Not required JSDeferred as `Deferred`');
    return;
};

// ショートカット群
// ファイルを分ける場合は毎回定義することになるので増やし過ぎない
var $d, $f;


/**
 * クラス本体
 */
var cls = function(){
    throw new Error('Error in JSRPGMaker(), impossible `call` and `new`');
};

/** 開発中フラグ */
cls.debug = true;

/** ビューエンジン種別 */
cls._viewEngineType = 'jquery';

/** 下層名前空間 */
cls.$functions = {}; // 共通関数・関数用変数群
cls.$tests = {}; // テスト関係
cls.$views= {}; // ViewEngineサブクラス群
cls.$windows = {}; // Windowサブクラス群


//
// 関数群
//

/** 開発用出力関数 */
cls.$functions.consoleLog = function(){
    if (cls.debug && 'console' in this && 'log' in this.console) {
        try {
            return this.console.log.apply(this.console, arguments);
        } catch (err) {// For IE
            var args = Array.prototype.slice.apply(arguments);
            return this.console.log(args.join(' '));
        };
    };
};

/** 自分のプロパティのみのオブジェクトを返す, 開発用 */
cls.$functions.getOwnProperties = function(){
    var obj = {}, k;
    for (k in this) {
        if (this.hasOwnProperty(k)) obj[k] = this[k];
    };
    return obj;
};

/** オブジェクトのキー／値リストを配列で返す, 順番は保障されない */
cls.$functions.keys = function(obj){
    var keys = [], k;
    for (k in obj) { keys.push(k) };
    return keys;
};
cls.$functions.values = function(obj){
    var values = [], k;
    for (k in obj) { values.push(obj[k]) };
    return values;
};

/** Mixinする */
cls.$functions.mixin = function(SubClass, superObj){
    var k;
    for (k in superObj.constructor) { SubClass[k] = superObj.constructor[k] };
    for (k in superObj) { SubClass.prototype[k] = superObj[k] };
};

/** オブジェクトを拡張する */
cls.$functions.extend = function(target, expansion) {
    var k;
    for (k in expansion) { target[k] = expansion[k] };
};

/** オブジェクトや配列の各要素に対して関数を実行する, @ref jQuery */
cls.$functions.each = function(obj, callback) {
    var length = obj.length, name;
    if (length === undefined) {
        for (name in obj) {
            if (callback.call(obj[name], name, obj[name]) === false) { break };
        };
    } else {
        var i = 0;
        for ( ; i < length; ) {
            if (callback.call(obj[i], i, obj[i++]) === false) { break };
        };
    };
    return obj;
};

/** Array.indexOf と同じ, IE対策 */
cls.$functions.indexOf = function(target, arr){
    var i;
    for (i = 0; i < arr.length; i++) { if (target === arr[i]) return i; };
    return -1;
};

/** 配列内に指定要素があるかを判定する */
cls.$functions.inArray = function(target, arr) {
    return this.indexOf(target, arr) !== -1;
};

$f = cls.$functions;
$d = cls.$functions.consoleLog;


//
// テスト関係
//
cls.$tests._testData = [];
cls.$tests._testResults = {};
cls.$tests.add = function(testName, level, func){
    this._testData.push({
        testName: testName,
        level: level,// 0=実行しない, 1=実行するがタイトル以外は出力しない, 2=実行する
        routine: func
    });
};
cls.$tests.test = function(){
    var self = this;
    $f.each(this._testData, function(nouse, t){
        if (t.level === 0) return;
        var _$d = (t.level === 2)? $d: function(){}; // テスト内での出力関数を変更することで出力制御
        $d('#### Test:' + t.testName + ' ####');
        var utils = {};
        self._testResults[t.testName] = t.routine(utils, cls, _$d, $f);
    });
};


/**
 * ビュークラス, 抽象基底
 */
cls.View = (function(){

    var kls = function(){

        /** 各環境でのビュー本体 */
        this._view = undefined;

        /** 共通化されたスタイル情報 */
        this._styles = undefined;

        /** 親子関係にあるViewインスタンス／インスタンスリスト */
        this._parent = undefined;
        this._children = undefined;
    };

    /** this._styles の書式兼初期値 */
    kls._styleFormat = {
        zIndex: 0,
        paddingTop: 0,
        paddingLeft: 0,
        paddingBottom: 0,
        paddingRight: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        lineHeight: 15,
        fontSize: 12,
        fontWeight: 'normal',
        letterSpacing: 1,
        color: '#000',
        textAlign: 'left',
        background: '#FFF',
        opacity: 1.0
    };

    kls.prototype._initialize = function(){
        this._styles = {};
        $f.extend(this._styles, kls._styleFormat);
        this._view = this._factoryView();
    };

    /** ビュー本体を生成して返す, 要override */
    kls.prototype._factoryView = function(){
        throw new Error('Error in JSRPGMaker.View._factoryView, not implemented');
    };

    /** スタイルを this._styles の値を使って反映する, _付きは要override */
    kls.prototype._style = function(){
        throw new Error('Error in JSRPGMaker.View._style, not implemented');
    };
    kls.prototype.style = function(data, validation){
        validation = !validation;// true(default)=入力チェックをする, false=しない, 性能対策
        if (validation) {
            var k, dat, errTxt, targets, ignores;
            for (k in data) {
                dat = data[k];
                errTxt = 'Error in JSRPGMaker.View.style, invalid style data key=`' + k + '` value=`' + dat + '`';
                // 書式に定義の無いキーはエラー
                if (k in kls._styleFormat === false) {
                    throw new Error(errTxt);
                };
                // 数値のみ
                ignores = ['fontWeight', 'color', 'textAlign', 'background'];
                if ($f.inArray(k, ignores) === false && typeof data[k] !== 'number') {
                    throw new Error(errTxt);
                };
                // 'left' || 'center' || 'right' のみ
                targets = ['textAlign'];
                if ($f.inArray(k, targets) && $f.inArray(k, ['left', 'center', 'right']) === false) {
                    throw new Error(errTxt);
                };
                // 色指定のみ, 現在は '#FFF' || '#FFFFFF' 形式のみ
                targets = ['color'];
                if ($f.inArray(k, targets) && /^#(?:[a-zA-Z]{3}|[a-zA-Z]{6})$/.test(dat) === false) {
                    throw new Error(errTxt);
                };
                // 色指定or画像オブジェクト指定(後で)のみ
                targets = ['background'];
                if ($f.inArray(k, targets) && /^#(?:[a-zA-Z]{3}|[a-zA-Z]{6})$/.test(dat) === false
                    && typeof dat !== 'object') {
                    throw new Error(errTxt);
                };
                // その他個別
                if (k === 'fontWeight' && $f.inArray(dat, ['normal', 'bold']) === false) {
                    throw new Error(errTxt);
                };
            };
        };
        $f.extend(this._styles, data);
        return this._style();
    };

    kls.prototype.text = function(){
    };

    /** 表示する／隠す, _付きは要override */
    kls.prototype._show = function(){
        throw new Error('Error in JSRPGMaker.View._show, not implemented');
    };
    kls.prototype.show = function(){
        return this._show.apply(this, arguments);
    };
    kls.prototype._hide = function(){
        throw new Error('Error in JSRPGMaker.View._hide, not implemented');
    };
    kls.prototype.hide = function(){
        return this._hide.apply(this, arguments);
    };

    kls.prototype.append = function(){
    };
    kls.prototype.remove = function(){
    };
    kls.prototype.empty = function(){
    };
    kls.prototype.bind = function(){
    };
    kls.prototype.animate = function(){
    };

    /** ビュー本体を返す */
    kls.prototype.getView = function(){
        return this._view;
    };

    kls._factory = function(){
        var obj = new this();
        obj._initialize();
        return obj;
    };

    return kls;
})();

cls.$views.JQueryView = (function(){
    var kls = function(){};
    $f.mixin(kls, new cls.View());

    kls.prototype._factoryView = function(){
        return $('<div />').css({
            position: 'absolute'
        });
    };

    kls.prototype.getViewAsHTMLElement = function(){
        return this._view.get(0);
    };

    kls.factory = cls.View._factory;

    return kls;
})();


cls.Block = undefined;
cls.Line = undefined;
cls.Window = undefined;// .Talk
cls.Screen = undefined;

cls.Image = undefined;

// ! ファイルを分ける場合に困るので名前の設定は無くした
//   いずれにせよファイルをいじらないと名前設定できないので使われることもない
//   jQueryのような衝突回避システムを持たないなら不要
//// 外部参照用クラス定義
//__classScope__[__className__] = cls;

return cls;
})();


//
// テスト作成
//
JSRPGMaker.$tests.add('jQueryViewFactory', 0, function(utils, cls, $d, $f){
    var v = cls.$views.JQueryView.factory();
    $d(v);
});
JSRPGMaker.$tests.add('jQueryViewShowToDocument', 2, function(utils, cls, $d, $f){
    var v = cls.$views.JQueryView.factory();
    v.style({
        top: 20,
        left: 100,
        width: 100,
        height: 200,
        zIndex: 10
    });
    $('#container').append(v.getView());
});
