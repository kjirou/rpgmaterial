//あいう
// vim: set foldmethod=marker :
/**
 * RPGMaterial
 *
 * @dependency jQuery v1.7.2 <http://jquery.com/>
 *             JSDeferred v0.4 <http://cho45.stfuawsc.com/jsdeferred/>
 *             threadmanager.js <own>
 * @include jquery-json v2.3 <http://code.google.com/p/jquery-json/>
 *          jquery-cookie <https://github.com/carhartl/jquery-cookie/>
 * @author intergamesjp[at]google[dot]com, <http://intergames.jp/>
 * @copyright Copyright (C) 2012 intergames.jp, All right reserved
 *            If you want to use this `rpgmaterial.js`, please contact me
 *            You can use `rpgmaterial.js` as free in most cases
 * @charset utf-8
 */
//
// タスクメモ:
// - chainDrawing仕様を除去する, *凄い大変*なので注意, プロジェクトの区切り目にやる
//   途中までやって諦めたメモ:
//   - Board/MapEditorが激しく依存している, 特にBoardは以下のような点で割と有効につかっている
//     1. 原型キーによるレイヤブロック設定で、設定時のfactory設定を短く書く
//     2. チェインで描画を保留することで、描画処理を1回だけでやるようにしている
//        特にオートタイリングだとこの形式が必須
//     除去するならこれらの機能は保持する必要がある
//   - Windowなどでは簡単に除去できるかも
//   - 新しくは使わない、同様のことがしたいなら_drawをoverrideで対応すること
// - 次プロジェクトから each と collect コールバックを (i, v) じゃなくて (v, i) にする
// - 点滅機能もBlockに持たせてBoard側はそれに準ずるようにする
// - Border.drawIndex がdrawClosingLine共通化の時に動かなくなった、マップエディタで使ってるので
//   新しい仕組みにする。今のようにそのために1要素を強制表示するのはNG
// - ZINDEX_SYSTEM_TOP を drawCoverとdrawClosingLineに使ってるのを止める
//   どちらかというとdrawClosingLineを上に出したいので別にしたいというのと
//   そもそも概念自体に無理が有ったので、Blockのクラス変数に個別の値として定義する
//   で、必要があればエンドで変更するのを前提にする
//
(function(){

var __classScope__ = this;


// 依存関係チェック
//{{{
if ('RPGMaterial' in __classScope__) {
    alert('`RPGMaterial` is already defined');
    return;
};
(function(scope, needs){
    var notdefineds = [], i;
    for (i = 0; i < needs.length; i++) {
        if (needs[i] in scope === false) notdefineds.push(needs[i]);
    };
    if (notdefineds.length > 0) {
        var txt = 'Not defined `' + notdefineds.join('`, `') + '`';
        alert(txt);
        throw new Error('RPGMaterial, ' + txt);
    };
})(__classScope__, ['$', 'Deferred', 'ThreadManager']);
//}}}


// ショートカット用ローカル変数群
var $d, $f;


/**
 * トップクラス
 */
var cls = (function(){
//{{{
    var cls = function(){
        throw new Error('RPGMaterial(), impossible `call` and `new`');
    };

    /** 開発用出力関数のラッパ, 出力をデバッグフラグで制御 */
    cls.consoleLog = function(){
        if (cls.debug) $f.consoleLog.apply(__classScope__, arguments);
    };

    /** 開発用共通エラーハンドラ */
    cls.catchError = function(err){
        // try-catch と deferred.error 両方で使えるようにする
        $d(err);
        return Deferred.next();
    };

    /** 自プロパティのみのオブジェクトを返す, 開発用 */
    cls.getOwnProperties = function(){
        var obj = {}, k;
        for (k in this) {
            if (this.hasOwnProperty(k)) obj[k] = this[k];
        };
        return obj;
    };

    return cls;
//}}}
})();
$d = cls.consoleLog;


/** 開発中フラグ */
cls.debug = true;

/** 下層名前空間 */
cls.$animations = {}; // Animationサブクラス群
cls.$blocks = {}; // Blockサブクラス群
cls.$boards = {}; // Boardサブクラス群
cls.$callbacks = {}; // 外部連携用コールバック関数群
cls.$chipAnimations = {}; // ChipAnimationサブクラス群
cls.$chips = {}; // Chipサブクラス群
cls.$consts = {}; // 共通定数群
cls.$dialogs = {}; // Dialogサブクラス群
cls.$functions = {}; // 汎用関数群
cls.$mapEditors = {}; // MapEditorサブクラス群
cls.$requests = {}; // Requestサブクラス群
cls.$trials = {}; // お試し中機能群
cls.$types = {}; // プリミティブ型の拡張サブクラス, または型っぽいクラス群
cls.$values = {}; // Valueサブクラス群
cls.$windows = {}; // Windowサブクラス群

$f = cls.$functions;
cls.callbacks = cls.$callbacks; // '$'が不安なので別名を付ける


//
// 汎用関数群
//
// - 他アプリへインポートしても使えるもののみ, 一般ライブラリや他汎用関数依存はOK
//   当ライブラリの定数や他環境に依存する共通処理は、トップクラスのクラスプロパティへ定義
// - 変数はNG, 定数は当汎用関数群専用であればOK(__CONST_NAME__の書式)
//
//{{{
/** 開発用出力関数 */
cls.$functions.consoleLog = function(){
    if ('console' in this && 'log' in this.console) {
        try {
            return this.console.log.apply(this.console, arguments);
        } catch (err) {// For IE
            var args = Array.prototype.slice.apply(arguments);
            return this.console.log(args.join(' '));
        };
    };
};

/** オブジェクトを拡張する */
cls.$functions.extend = function(target, expansion) {
    var k;
    for (k in expansion) { target[k] = expansion[k] };
    return target;
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

/** 継承する／Mixinする
    @param SubClass   func
    @param superObj   obj || null(Mixin時のみ)
    @param SuperClass func || null */
var __MIXIN__ = function(SubClass, superObj, SuperClass){
    var k;
    if (superObj !== undefined && superObj !== null) {
        for (k in superObj) { SubClass.prototype[k] = superObj[k] };
    };
    //! superObj.constructor で楽しようとするとプロトタイプチェーン時にバグる
    if (SuperClass !== undefined && SuperClass !== null) {
        for (k in SuperClass) {
            if (k === 'prototype') continue; // For FF3
            SubClass[k] = SuperClass[k]
        };
    };
};
cls.$functions.inherit = function(SubClass, superObj, SuperClass){
    SubClass.prototype = superObj;
    SubClass.prototype.__myClass__ = SubClass;// constructorが自分では無くなるため, なお'class'だとIEでバグ
    __MIXIN__(SubClass, null, SuperClass);// _MIXINを定義したのはここでクロージャにするため
}
cls.$functions.mixin = __MIXIN__;

/** Arrayをプロトタイプ・チェーン継承したクラスの継承されたメソッド群をなじませる
    ref) http://kjirou.sakura.ne.jp/mt/2012/02/javascript_9.html */
cls.$functions.blendArray = function(klass){
    klass.convert = function(arr){
        if (arr instanceof Array === false) {
            throw new Error('RPGMaterial:($f.blendArray).convert, invalid parameter');
        };
        var obj = new klass(), i;
        for (i = 0; i < arr.length; i++) { obj.push(arr[i]) };
        return obj;
    };
    var toMine = function(methodName){
        return function(){
            return klass.convert(Array.prototype[methodName].apply(this, arguments));
        };
    };
    klass.prototype.slice = toMine('slice');
    klass.prototype.splice = toMine('splice');
    klass.prototype.concat = function(){
        throw new Error('RPGMaterial:($f.blendArray).concat, not implemented');
    };
    klass.prototype.toString = function(){
        var arr = Array.prototype.slice.apply(this); // 配列に変換しないと使えない
        return Array.prototype.toString.apply(arr, arguments);
    };
};

/** 関数の動的スコープを束縛する
    ネイティブ関数やarguments.calleeを直接参照コピーせずに複製する際にも使用 */
cls.$functions.bindScope = function(func, scope){
    return function() {
        return func.apply(scope, arguments);
    };
};

/** オブジェクトや配列の各要素に対して関数を実行する, @ref jQuery */
cls.$functions.each = function(obj, callback) {
    var length = obj.length, name;
    //! Function.length があるので関数だと正常に動作しない
    //  ref) http://1106.suac.net/johoB/JavaScript/jscriptf.html#functionlength
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

/** 指定回数ループする, callback func=引数には1からの回数が入る,falseを返すと実行終了 */
cls.$functions.times = function(count, callback){
    var i;
    for (i = 1; i <= count; i++) {
        if (callback(i) === false) return;
    };
};

/** 配列各要素を関数で評価し、その結果で配列を再生成して返す, undefined を返すと除外される
    ref) RubyのArray#collect */
cls.$functions.collect = function(arr, callback){
    if (arr instanceof Array === false) {// オブジェクトを入れることが良くあるので
        throw new Error('RPGMaterial:$functions.collect, collect usable to Array only');
    };
    var newArr = [], i, result;
    for (i = 0; i < arr.length; i++) {
        result = callback(i, arr[i]);
        if (result !== undefined) newArr.push(result);
    };
    return newArr;
};

/** 配列全要素を真偽評価して、その論理和／論理積を返す
    callback func 評価ルーチンを決定する, デフォルトは !!value 評価
    ex) callback = function(v, i){ return v % 2 } */
cls.$functions.any = function(arr, callback){
    callback = callback || function(v, i){ return v };
    var i;
    for (i = 0; i < arr.length; i++) {
        if (!!callback(arr[i], i)) return true; // 最終的には常に論理型へキャストされる
    };
    return false;
};
cls.$functions.all= function(arr, callback){
    callback = callback || function(v, i){ return v };
    var i;
    for (i = 0; i < arr.length; i++) {
        if (!!callback(arr[i], i) === false) return false;
    };
    return true;
};

/** Array.indexOf と同じ, IE対策 */
cls.$functions.indexOf = function(target, arr){
    if (arr instanceof Array === false) {// inArrayにオブジェクトを入れることが良くあるので
        throw new Error('RPGMaterial:$functions.indexOf, invalid parameter, `arr` is not instanceof Array');
    };
    var i;
    for (i = 0; i < arr.length; i++) { if (target === arr[i]) return i; };
    return -1;
};

/** 配列内に指定要素があるかを判定する */
cls.$functions.inArray = function(target, arr) {
    return $f.indexOf(target, arr) !== -1;
};

/** 配列内に指定要素が全てあるかを判定する */
cls.$functions.allInArray = function(targets, arr){
    var i;
    for (i = 0; i < targets.length; i++) {
        if ($f.inArray(targets[i], arr) === false) return false;
    };
    return true;
};

/** 配列から重複値を除去して返す */
cls.$functions.uniqueArray = function(arr) {
    var list = [], i;
    for (i = 0; i < arr.length; i++) {
        if ($f.inArray(arr[i], list) === false) list.push(arr[i]);
    };
    return list;
};

/** 配列をシャッフルする, 破壊的に変更しつつ戻り値でも返す
    @author http://la.ma.la/blog/diary_200608300350.htm */
cls.$functions.shuffleArray = function(ary){
    var i = ary.length;
    while (i) {
        var j = Math.floor(Math.random() * i);
        var t = ary[--i];
        ary[i] = ary[j];
        ary[j] = t;
    };
    return ary;
};

/** ランダムに要素を選択して返す */
cls.$functions.randChoice = function(arr){
    if (arr.length === 0) { throw new Error('RPGMaterial:$f.randChoice, array.length = 0') };
    return arr[$f.randInt(0, arr.length - 1)];
};

/** ランダムに複数要素を選択して返す, @return arr 順番は保障されない */
cls.$functions.randChoices = function(arr, count){
    //! なぜ1に初期化しているのかは不明, プロジェクト変更時に止める
    if (count === undefined) count = 1;
    var stack = arr.slice();
    var results = [];
    if (count > stack.length) throw new Error('RPGMaterial:$f.randChoices, invalid parameter');
    $f.times(count, function(){
        results.push(stack.splice($f.randInt(0, stack.length - 1), 1)[0]);
    });
    return results;
};

/** 選択比率からランダムにキーを選択して返す
    ratioMap arr=[1.0, 2.0, 0.5] のような比率リスト ||
             dict={apple:1.0, orange:2.0, grape:0.5} のような比率辞書
    @return 配列の場合は比率によりランダム選択された要素番号、辞書の場合はキーを返す */
cls.$functions.randRatioChoice = function(ratioMap){
    var list = [], i, k;
    // [要素番号orキー, 選択比率] の配列にする
    if (ratioMap instanceof Array) {
        for (i = 0; i < ratioMap.length; i++) list.push([i, ratioMap[i]]);
    } else if (typeof ratioMap === 'object') {
        for (k in ratioMap) list.push([k, ratioMap[k]]);
    } else {
        throw new Error('RPGMaterial:$f.randRatioChoice, invalid parameter=' + ratioMap);
    };
    var total = $f.sum(list, function(v){ return v[1] });
    var rand = Math.random() * total;
    for (i = 0; i < list.length; i++) {
        if (rand < list[i][1]) return list[i][0];
        rand -= list[i][1];
    };
    throw new Error('RPGMaterial:$f.randRatioChoice, invalid situation');// 来ないはず
};

/** 配列の値の合計値を返す
    @param callback func=numを返す加算式,nullやundefinedだと無視する, デフォルトは単純な加算 */
cls.$functions.sum = function(arr, callback){
    var callback = callback || function(v){ return v };
    var total = 0, i;
    for (i = 0; i < arr.length; i++) { total += callback(arr[i], i) || 0 };
    return total;
};

/** 配列同士の内容を比較して内容が同じかを判定する
    ! 前はtoStringを掛けた同士を比較していたが、順番が保障されるか不明なので止めた
    asNoParticularOrder false(default)=順番も要一致 || true=順不同 */
cls.$functions.areSimilarArrays = function(a, b, asNoParticularOrder){
    var asNoParticularOrder = !!asNoParticularOrder;
    var a2 = a.slice();
    var b2 = b.slice();
    if (asNoParticularOrder) {
        a2.sort();
        b2.sort();
    };
    if (a2.length !== b2.length) return false;
    var i;
    for (i = 0; i < a2.length; i++) {
        if (a2[i] !== b2[i]) return false;
    };
    return true;
};

/** ランダムな整数を返す, min以上max以下 */
cls.$functions.randInt = function(min, max){
    if (min > max) throw new Error('RPGMaterial:$f.randint, min=' + min + ' larger than max=' + max);
    var span = max - min;
    return min + parseInt(Math.random() * (span + 1));
};

/** 端数をランダムで丸めた整数を返す, ex) 1.2は80%で1, 20%で2 / -2.5は50%で-2, 50%で-3 */
cls.$functions.randRound = function(num){
    if (num % 1 === 0) return num;
    var plusOrMinus = (num < 0)? -1: 1;
    var base = Math.abs(parseInt(num));
    var fraction = Math.abs(num % 1);
    var zeroOrOne = (Math.random() < fraction)? 1: 0;
    return (base + zeroOrOne) * plusOrMinus;
};

/** 範囲内で正規分布風確率でランダムな値を返す
    実際は中央を頂点として直線状に下がる図の分布になる
    @param と @return は両方とも float
    ref) http://kjirou.net/main/public/js/test/oreore_rand/ */
cls.$functions.randGaussLike = function(min, max){
    var delta = max - min;
    return (Math.random() * delta + Math.random() * delta) / 2 + min;
};

/** 数値を範囲内の値に収めて返す, それぞれ null || undefined で指定しない */
cls.$functions.withinNum = function(value, min, max){
    if (min !== null && min !== undefined && min > value) return min;
    if (max !== null && max !== undefined && max < value) return max;
    return value;
};

/** 数値AがBより超過／以上／等しい／以下／未満かを判定する */
cls.$functions.compareNum = function(oper, a, b){
    //! 関数化する '==' '<' 等にも対応する
    var operands = ['eq', '==', 'gt', '>', 'egt', '>=', 'elt', '<=', 'lt', '<'];
    if ($f.inArray(oper, operands) === false) {
        throw new Error('RPGMaterial:$f.compareNum, not defined operand=' + oper);
    };
    if (oper === 'gt' || oper === '>') return a > b;
    if (oper === 'egt' || oper === '>=') return a >= b;
    if (oper === 'eq' || oper === '==') return a == b;
    if (oper === 'elt' || oper === '<=') return a <= b;
    if (oper === 'lt' || oper === '<') return a < b;
};

/** Python3風文字列フォーマット操作関数
    @example format('My name is {0}, {1} years old', 'kjirou', 34)
             format('I like {0} and {1}', ['sushi', 'sukiyaki'])
             format('{0.x} {1.y}', {x:11}, {y:22})
    @author http://d.hatena.ne.jp/ajalabox/20110223/1298448703 */
cls.$functions.format = function() {
    var args, fmt, result;

    args = Array.apply([], arguments);
    fmt = typeof this === "string" ? this : args.shift();

    if (args.length === 1 && typeof args[0] === "object") {
        args = args[0];
    };

    result = fmt.replace(/{([^}]+)}/g, function (s, id) {
        var chain = id.split("."), substr, i;
        if (chain.length >= 2) {
            substr = args[chain[0]];
            for (i = 1; i < chain.length; i++) {
                substr = substr[chain[i]];
            }
        } else {
            substr = args[id];
        }
        return substr;
    });

    return result;
};

/** 文字を一定文字数にて切り落とす */
cls.$functions.cutStr = function(str, max, suffix){
    if (suffix === undefined) suffix = '';
    return str.replace(new RegExp('^(.{' + parseInt(max) + '}).+$'), '$1' + suffix);
};

/** 文字列の桁数を指定し、足りない分を指定文字で埋める, 0埋めなどに使う */
cls.$functions.fillStr = function(str, digits, chr){
    var i;
    for (i = 0; i < digits; i++) { str = chr + str };
    return str.slice(-digits);
};

/** 半角英数字で構成されるランダムな文字列を生成する
    options:
        smalls: 候補となる半角小文字英字を文字列で指定, デフォルトは全部
        larges: 半角大文字英字
        digits: 半角数値 */
cls.$functions.randStr = function(length, options){
    var opts = options || {};
    var smalls = ('smalls' in opts)? opts.smalls.split(''): 'abcdefghijklmnopqrstuvwxyz'.split('');
    var larges = ('larges' in opts)? opts.larges.split(''): 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var digits = ('digits' in opts)? opts.digits.split(''): '0123456789'.split('');
    var all = smalls.concat(larges.concat(digits));
    var s = '', i;
    for (i = 0; i < length; i++) s += $f.randChoice(all);
    return s;
};

/** 金額へ桁区切りを入れる、例) '1234567.89' -> '1,234,567.89' */
var __FORMAT_NUM_PATTERN__ = /(\d)(\d{3})(,|\.|$)/;
cls.$functions.formatNum = function(numOrStr){
    var str = numOrStr;
    if (typeof str !== 'string') str = str.toString();
    while (1) {
        var replaced = str.replace(__FORMAT_NUM_PATTERN__, '$1,$2$3');
        if (str === replaced) {
            return str;
        } else {
            str = replaced;
        };
    }
};

/** 文字が半角か／文字列が半角文字だけかを判定する, utf-8専用 */
var __IS_HAN_PATTERN__ = /^[\x00-\x7F]$/;
cls.$functions.isHan = function(character){
    return __IS_HAN_PATTERN__.test(character);
};
var __IS_HAN_STRING_PATTERN__ = /^[\x00-\x7F]*$/;
cls.$functions.isHanString = function(str){
    return __IS_HAN_STRING_PATTERN__.test(str);
};

/** 文章前後の改行文字をすべて削除する */
var __TNLC1_PATTERN__ = /^[\n\r]*/g;
var __TNLC2_PATTERN__ = /[\n\r]*$/g;
cls.$functions.trimNewLineCharacters = function(text){
    return text.replace(__TNLC1_PATTERN__, '').replace(__TNLC2_PATTERN__, '');
};

/** 改行文字を正規化する */
var __NNLC_PATTERN__ = /(\r\n|\r)/g;
cls.$functions.normalizeNewLineCharacters = function(text, options){
    var opts = options || {};
    // オプション: 末尾が改行文字なら削除
    var deleteLast = ('deleteLast' in opts)? opts.deleteLast: false;
    text = text.replace(__NNLC_PATTERN__, '\n'); // 改行文字を\nへ揃える
    if (deleteLast) text = text.replace(/\n$/, '');
    return text;
};

/** -1 を '-1' に、1 を '+1' に変換して返す, zeroPrefixは値が0の場合の符号を個別設定 */
cls.$functions.toModifierString = function(num, zeroPrefix) {
    zeroPrefix = zeroPrefix || '';
    if (num === 0) return zeroPrefix + '0';
    return (num > 0)? '+' + num: num.toString();
};

/** 指定オブジェクトのあるスコープ内での変数名リストを取得する
    @return arr=変数名文字列リスト, []=無い場合 */
cls.$functions.getMyNames = function(obj, scope){
    var list = [], k;
    for (k in scope) { if (obj === scope[k]) list.push(k) };
    return list;
};
/** 上記で複数または無い場合にはエラーを返す, @return 変数名文字列 */
cls.$functions.getMyName = function(obj, scope){
    var names = $f.getMyNames(obj, scope);
    if (names.length !== 1) throw new Error('RPGMaterial:$f.getMyName, invalid situation');
    return names[0];
};

/** IEかを判別する */
var __IS_IE_PATTERN__ = /MSIE \d+\./;
cls.$functions.isIE = function(){
    return __IS_IE_PATTERN__.test(window.navigator.userAgent);
};

/** ブラウザ判別を行う
    jQuery.browserは非推奨とされ代替のjQuery.supportも微妙なため作成した */
cls.$functions.getBrowser = function(){
    // 未対応点:
    // - iPhoneアプリとiPhone-Safari判別が一緒になっている
    //   iPhoneアプリはアプリ次第だが、"Safari"の有無で分岐して良さそう
    //   ref) http://www.diigo.com/item/note/ofm2/b01m
    // - スマフォのAndroidブラウザと携帯版Androidが一緒になっている
    //   "Mobile"を含むものが携帯版らしい
    //   ref) http://www.alphaseo.jp/seo-faq/mobile/110617_200517.html
    // - 下記関数が複数条件を持てる形になっていないのと
    //   確認が手間で当面必要ないので後回しにした
    var browsers = [
        //! 古いiPadは'iPhone'を含むらしく, iPhone-Safariには'Safari'を含むので
        // iPad -> iPhone -> Safari という順にすること
        ['ipad', /iPad/],
        ['iphone', /iPhone/],
        ['android', /Android/],
        ['ie9', /MSIE 9\./],
        ['ie8', /MSIE 8\./],
        ['ie7', /MSIE 7\./],
        ['ie6', /MSIE 6\./],
        ['chrome', /Chrome/],
        ['firefox', /Firefox/],
        ['safari', /Safari/],
        ['opera', /Opera/]//,
    ];
    var i;
    for (i = 0; i < browsers.length; i++) {
        if (browsers[i][1].test(window.navigator.userAgent)) return browsers[i][0];
    };
    return 'unknown';
};

/** HTML特殊文字をエスケープする
    なおcreateTextNodeを使うprototype.js式は、重いし改行文字が潰される問題があった */
cls.$functions.escapeHTML = function(str){
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#039;');
    return str;
};

/** 改行文字を改行タグへ置換する */
var __NL2BR_PATTERN__ = /(?:\r\n|\n|\r)/g;
cls.$functions.nl2br = function(str){
    //! IE7以前で連続する<br />が正しく表示されないので、その対処をしている
    //  Ref) http://www.tagindex.com/stylesheet/text_font/letter_spacing.html
    var br = '<br style="letter-spacing:0;" />';
    return str.replace(__NL2BR_PATTERN__, br);
};

/** URLを解析してGET値のハッシュを返す */
cls.$functions.parseUrlToParameters = function(url){
    var params = {};
    if (/^.+?\?./.test(url)) {
        var pairs = url.replace(/^.+?\?/, '').split('&');
        var i, pair;
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i].split('=');
            params[pair[0]] = ((pair[1] !== undefined)? pair[1]: "");
        };
    };
    return params;
};

/** 素オブジェクトをGETリクエスト用クエリストリングへ変換する
    '?'は含まない */
cls.$functions.objectToQueryString = function(data){
    var str = '', first = true;
    $f.each(data, function(k, v){
        if (first === false) str += '&';
        first = false;
        str += encodeURIComponent(k) + '=' + encodeURIComponent(v);
    });
    return str;
};

/** テキスト選択を不可にする, 子要素も影響を受ける
    - 本当は継承させたくなかったけどCSSの仕様か無理だった
    - IEの場合、自然には継承されず再帰的に全子要素に個別設定するので重さ注意
    - また、IEで動的にメッセージ出力中は、出力中インライン要素の親ブロック要素の親ブロック要素 ..に
      付けないと有効にならなかった, 詳細不明なので過信は禁物
    - removing=true で選択不可を解除するが、設定したjqObjの子要素を指定するとIEだけ解除されることになる
      設定した要素に対して解除を行うこと
    @ref http://www.programming-magic.com/20071217225449/
    @ref https://developer.mozilla.org/en/CSS/user-select
    @ref http://blogs.msdn.com/b/ie_ja/archive/2012/01/17/css-user-select.aspx */
cls.$functions.toUnselectable = function(jqObj, removing){
    removing = !!removing;
    var he = jqObj.get(0); // jqObj.css だと存否確認が出来ない
    // IE10=MsUserSelect(未確認), Firefox=MozUserSelect, Chrome=KhtmlUserSelect
    // Safari=webkitUserSelect(未確認), HTML5=UserSelect(未確認)
    var propNames = ['MsUserSelect', 'MozUserSelect',
        'KhtmlUserSelect', 'webkitUserSelect', 'UserSelect'];
    var i, propName;
    for (i = 0; i < propNames.length; i++) {
        propName = propNames[i];
        if (typeof he.style === 'object' && propName in he.style) {
            if (!removing) {
                he.style[propName] = 'none';
            } else {
                he.style[propName] = '';
            };
            //jqObj.children().each(function(){// 子要素へは継承を解除したかったけど出来なかった
            //    this.style[propName] = 'text';// 'all'でもダメ
            //});
            return;
        };
    };
    // IE, Opera, Others
    var modifier = function(){$(this).attr('unselectable', 'on')};
    if (removing) modifier = function(){$(this).removeAttr('unselectable')};
    jqObj.each(modifier).find('*').each(modifier);
};

/** keypress/keyupイベント時にFirefoxでエラーが発生しないようにjQueryを書き換える
    挙動が若干変わるので注意、詳細は以下参照
    ref) http://kjirou.sakura.ne.jp/mt/2012/02/jquery_firefoxkeydownkeyup.html */
cls.$functions.modifyJQueryForStableKeyEvents = function(jQuery_){
    jQuery_.event.keyHooks.props = "char key keyCode".split(" ");
    jQuery_.event.keyHooks.filter = function(event, original){
        // "keypress"
        if (event.type === 'keypress') {
            // jQuery original filter
            if (event.which == null) {
                event.which = original.charCode != null ? original.charCode : original.keyCode;
            };
        // "keydown", "keyup"
        } else {
            if (event.which == null) {
                event.which = event.keyCode;
            };
        };
        return event;
    };
};

/** ある長さに複数サイズの辺を並べた時に間隔が等間隔になる座標リストを返す
    辺の合計の長さが全長に収まらない場合は、重なる部分が等間隔になる座標リストを返す
    @param length num=全体の辺の長さ
    @param sides arr=辺の長さリスト
    @param options:
             startPoint: true(default)=始点にも間隔を作る, false=作らない
             endPoint: true(default)=右端にも間隔を作る, false=作らない
    @return arr 最始点を0とした辺リストの始点リスト */
cls.$functions.spacing = function(length, sides, options) {
    var opts = options || {};
    var points = [];
    var total = $f.sum(sides);
    var spaceCount = sides.length - 1;
    var startPoint = ('startPoint' in opts)? opts.startPoint: true;
    var endPoint = ('endPoint' in opts)? opts.endPoint: true;
    var space;
    // 全長に収まる
    if (total <= length) {
        if (startPoint) spaceCount += 1;
        if (endPoint) spaceCount += 1;
        if (spaceCount === 0) throw new Error('RPGMaterial:$f.spacing, none space');
        space = (length - total) / spaceCount;
        //! ここわかり難いけど、ループに入る前に1つ目の辺の座標を格納して
        //  ループ内ではそれに 次の辺の長さ＋間隔 を足して次の辺の始点を格納している
        //  sides.length - 1 と最後の辺をループに含まないのは、既に前ループで格納されているから
        points.push(startPoint ? space: 0);
        $f.times(sides.length - 1, function(t){
            var idx = t - 1;
            points.push(points[idx] + sides[idx] + space);
        });
    // 全長に収まらない
    } else {
        if (spaceCount === 0) throw new Error('RPGMaterial:$f.spacing, none space');
        space = (length - total) / spaceCount;
        points.push(0);
        $f.times(sides.length - 1, function(t){
            var idx = t - 1;
            points.push(points[idx] + sides[idx] + space);
        });
    };
    return points;
};

/** 大きな矩形を一定サイズの矩形で分割した場合の座標リストを返す
    @param partSize [width,height]
    @param targetSize [width,height]
    @param borderWidth 矩形と矩形の隙間幅, default=0
    @return arr [[top,left], ...] の座標リスト, 左から右・上から下 の順 */
cls.$functions.squaring = function(partSize, targetSize, borderWidth) {
    if (borderWidth === undefined) borderWidth = 0;
    var coords = [], top, left;
    for (top = 0; targetSize[1] > top; top += partSize[1] + borderWidth) {
        for (left = 0; targetSize[0] > left; left += partSize[0] + borderWidth) {
            coords.push([top, left]);
        };
    };
    return coords;
};

/** 多次元配列を直列化する
    @param mdArray 多次元配列 @param maxDimension 直列化する階層の深さ上限, default=2次元まで */
cls.$functions.collapseMDArray = function(mdArray, maxDimension){
    if (maxDimension === undefined) maxDimension = 2;
    var seq = [];
    (function(mdArray, dimension){
        var i, v;
        for (i = 0; i < mdArray.length; i++) {
            v = mdArray[i];
            if (v instanceof Array && dimension <= maxDimension) {
                arguments.callee(v, dimension + 1);
            } else {
                seq.push(v);
            };
        };
    })(mdArray, 2);
    return seq;
};

/** 矩形のデータマップ情報を表現したテキストを解析して2次元配列へ変換する
    @param text 行と列それぞれが揃っているテキストデータ,1行は改行文字で表現される
                ex) 'abc\ndef\nghi\njkl' は 行4x列3 のデータを表す
                なお、配列を渡した場合は1要素に1行入っていると解釈される
                ex) [['abc'],['def'],['ghi'],['jkl']] は上記と等価
                基本は半角文字で使うことを想定しているが全角でも大丈夫なはず
    @param allowedSymbols 許可されている文字,初期値はnullで全て許可されている状態
    @return [[<2次元配列>], 広さ [列数,行数]] */
cls.$functions.parseMapLikeText = function(text, allowedSymbols){
    if (allowedSymbols === undefined) allowedSymbols = null;
    if (text instanceof Array) text = text.join('\n');
    text = $f.normalizeNewLineCharacters(text, {deleteLast:true});

    var chrs = [[]];
    var ri = 0; // 現在の行番号
    var ci = 0; // 現在の列番号
    var i, chr;
    for (i = 0; i < text.length; i++) {
        chr = text.slice(i, i + 1);
        if (chr === '\n') {
            ri += 1;
            ci = 0;
            chrs[ri] = [];
        } else {
            // 正しい記号かを判定
            if (allowedSymbols !== null && $f.inArray(chr, allowedSymbols) === false) {
                throw new Error('RPGMaterial:$f.parseMapLikeText, invalid symbol=`' + chr + '`');
            };
            chrs[ri][ci] = chr;
            ci += 1;
        };
    };
    // 矩形かをチェック
    var columnCount = chrs[0].length;
    for (i = 1; i < chrs.length; i++) {
        if (columnCount !== chrs[i].length) {
            throw new Error('RPGMaterial:$f.parseMapLikeText, not rectangle');
        };
    };
    return [chrs, [columnCount, chrs.length]];
};
//}}}


//
// 共通定数群
//
//{{{
/** リリースバージョン／リリース日時 */
cls.$consts.VERSION = '1.0.1';
cls.$consts.RELEASED_AT = '2012-05-11 00:00:00';
/** CSSセレクタのプレフィックス */
cls.$consts.CSS_SELECTOR_PREFIX = 'rpgm-';
/** 安定的な動作がある程度期待できる最速setTimeout間隔, =jQuery.fx.interval(v1.7) */
cls.$consts.FASTEST_INTERVAL = 13;
/** IEも含めた全ブラウザで同様に動く間隔, 値は自己調査から */
cls.$consts.STABLE_INTERVAL = 34;
/** 高さであるz-indexの真の最大値, 通常使わない
    ref) http://logicalerror.seesaa.net/article/221475596.html */
cls.$consts.HIGHEST_ZINDEX = 2147483647;
/** 高さであるz-indexの充分に高い値 */
cls.$consts.ZINDEX_SYSTEM_TOP = 99999999; // コンテンツより上に置くことを意図した値
cls.$consts.ZINDEX_TOP = 999999; // コンテンツの中で一時的に最上部にするための値
//}}}


/** アプリケーションクラス */
cls.Application = (function(){
//{{{
    //
    // 各アプリのトップ名前空間オブジェクトを生成するクラス
    // 変数管理やサブ名前空間生成機能を持つ
    //
    // 前は主に app(k, v) で変数を追加するために関数オブジェクトにしていたが
    // そんなに頻繁に更新する訳じゃないので意味が薄いのと, コンソールで変数一覧がすぐに見えないのと
    // 一部の環境でFunctionを独自拡張していて(*)、それが不具合に繋がったなどの理由で止めた
    // *) 例えばmixiアプリには Function.inherits が追加されている
    //
    // 継承には現在未対応, というのも、変数群をオブジェクト直下に置くために
    // setメソッドなど既存変数と衝突しないようにしている
    // もし継承してメソッドを増やした場合に、そちらとの衝突回避機能を入れる必要があるが
    // それが面倒なため
    //
    var kls = function(){
        /** 変数定義マップ, '<変数名>':null のペア群
            - 定義されていない変数が出来ていたり、値がundefinedのままの場合は
              checkDefinitions 時にエラーを返す
            - nullは固定で不使用、後で型チェック用の情報を入れるかもしれない */
        this.__definitions__ = {};
    };

    kls.prototype.toString = function(){ return 'Application' };

    /** 予約変数名リスト */
    kls.__RESERVED_WORDS__ = 'define __definitions__ checkDefinitions defineNameSpace'.split(' ');

    /** 変数を定義する
        @param value 同時に値も定義する場合に指定、空でundefinedが入っても良い */
    kls.prototype.define = function(key, value){
        if ($f.inArray(key, kls.__RESERVED_WORDS__)) {
            throw new Error('RPGMaterial:Application, reserved key=' + key);
        };
        if (key in this.__definitions__) {
            throw new Error('RPGMaterial:Application, already defined key=' + key);
        };
        this[key] = value;
        this.__definitions__[key] = null;
    };

    /** 定義に従って変数が格納されているかを確認する, 不正な場合はエラー
        アプリケーションの初期化完了時点で実行する使い方 */
    kls.prototype.checkDefinitions = function(){
        var k;
        for (k in this) {// 宣言されていないプロパティ
            if (k in this.__definitions__ === false && !$f.inArray(k, kls.__RESERVED_WORDS__)) {
                throw new Error('RPGMaterial:Application.checkDefinitions, invalid property key=`' + k +'`');
            };
        };
        for (k in this.__definitions__) {
            if (k in this === false) {// プロパティが無い
                throw new Error('RPGMaterial:Application.checkDefinitions, not found property key=`' + k + '`');
            } else if (this[k] === undefined){// プロパティが未定義のまま
                throw new Error('RPGMaterial:Application.checkDefinitions, undefined value property key=`' + k + '`');
            };
        };
    };

    /** 名前空間を生成する
        動的にアクセスする際の名前間違いエラーを確認し易い様に作った */
    kls.prototype.defineNameSpace = function(key){
        this.define(key, new kls.ApplicationNameSpace());
    };
    /** サブ名前空間クラス, 格納は直接代入で良い
        簡易クラスでないのはhasOwnPropertyを有効にするため */
    kls.ApplicationNameSpace = function(){};
    kls.ApplicationNameSpace.prototype.has = function(propName){
        return propName in this;
    };
    kls.ApplicationNameSpace.prototype.get = function(propName){
        if (this.has(propName)) {
            return this[propName];
        };
        throw new Error('RPGMaterial:app.get, not found property=' + propName + ' in namespace=' + $f.keys(this));
    };
    /** 自プロパティのみを返す */
    kls.ApplicationNameSpace.prototype.getData = function(){
        var self = this, data = {};
        $f.each(this, function(k, v){
            if (self.hasOwnProperty(k) === false) return;
            data[k] = v;
        });
        return data;
    };

    kls.factory = function(){
        var obj = new this();
        return obj;
    };

    return kls;
//}}}
})();


/** Cookie操作クラス */
cls.Cookie = (function(){
//{{{
    // 以下に丸々jquery-cookieをコピペしている
    // @usage Cookie.cookie('key', 'value', { expires:<num=days> })
    //                     expires は -1 でセッションクッキー(default)
    var kls = function(){};
    /*!
     * jQuery Cookie Plugin
     * https://github.com/carhartl/jquery-cookie
     *
     * Copyright 2011, Klaus Hartl
     * Dual licensed under the MIT or GPL Version 2 licenses.
     * http://www.opensource.org/licenses/mit-license.php
     * http://www.opensource.org/licenses/GPL-2.0
     */
    kls.cookie = function(key, value, options) {

        // key and at least value given, set cookie...
        if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null || value === undefined)) {
            options = $f.extend({}, options);

            if (value === null || value === undefined) {
                options.expires = -1;
            }

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            value = String(value);

            return (document.cookie = [
                encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path    ? '; path=' + options.path : '',
                options.domain  ? '; domain=' + options.domain : '',
                options.secure  ? '; secure' : ''
            ].join(''));
        }

        // key and possibly options given, get cookie...
        options = value || {};
        var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

        var pairs = document.cookie.split('; ');
        for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
            if (decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
        }
        return null;
    };
    return kls;
//}}}
})();


/** JSON操作クラス */
cls.JSONUtils = (function(){
//{{{
    //
    // - 以下に丸々jquery.jsonをコピペしている
    // - 他環境へクラスまたはメソッド別にインポートできるように、当環境に依存しないようにする
    //
    var kls = function(){};
//{{{
/**
 * jQuery JSON Plugin
 * version: 2.3 (2011-09-17)
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
 * website's http://www.json.org/json2.js, which proclaims:
 * "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 * I uphold.
 *
 * It is also influenced heavily by MochiKit's serializeJSON, which is
 * copyrighted 2005 by Bob Ippolito.
 */
(function($){var escapeable=/["\\\x00-\x1f\x7f-\x9f]/g,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};$.toJSON=typeof JSON==='object'&&JSON.stringify?JSON.stringify:function(o){if(o===null){return'null';}
var type=typeof o;if(type==='undefined'){return undefined;}
if(type==='number'||type==='boolean'){return''+o;}
if(type==='string'){return $.quoteString(o);}
if(type==='object'){if(typeof o.toJSON==='function'){return $.toJSON(o.toJSON());}
if(o.constructor===Date){var month=o.getUTCMonth()+1,day=o.getUTCDate(),year=o.getUTCFullYear(),hours=o.getUTCHours(),minutes=o.getUTCMinutes(),seconds=o.getUTCSeconds(),milli=o.getUTCMilliseconds();if(month<10){month='0'+month;}
if(day<10){day='0'+day;}
if(hours<10){hours='0'+hours;}
if(minutes<10){minutes='0'+minutes;}
if(seconds<10){seconds='0'+seconds;}
if(milli<100){milli='0'+milli;}
if(milli<10){milli='0'+milli;}
return'"'+year+'-'+month+'-'+day+'T'+
hours+':'+minutes+':'+seconds+'.'+milli+'Z"';}
if(o.constructor===Array){var ret=[];for(var i=0;i<o.length;i++){ret.push($.toJSON(o[i])||'null');}
return'['+ret.join(',')+']';}
var name,val,pairs=[];for(var k in o){type=typeof k;if(type==='number'){name='"'+k+'"';}else if(type==='string'){name=$.quoteString(k);}else{continue;}
type=typeof o[k];if(type==='function'||type==='undefined'){continue;}
val=$.toJSON(o[k]);pairs.push(name+':'+val);}
return'{'+pairs.join(',')+'}';}};$.evalJSON=typeof JSON==='object'&&JSON.parse?JSON.parse:function(src){return eval('('+src+')');};$.secureEvalJSON=typeof JSON==='object'&&JSON.parse?JSON.parse:function(src){var filtered=src.replace(/\\["\\\/bfnrtu]/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,'');if(/^[\],:{}\s]*$/.test(filtered)){return eval('('+src+')');}else{throw new SyntaxError('Error parsing JSON, source is not valid.');}};$.quoteString=function(string){if(string.match(escapeable)){return'"'+string.replace(escapeable,function(a){var c=meta[a];if(typeof c==='string'){return c;}
c=a.charCodeAt();return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);})+'"';}
return'"'+string+'"';};})(kls);
//}}}

    //kls.toJSON // これは同名
    kls.fromJSON = function(json){
        return kls.secureEvalJSON(json);
    };
    kls.isJSON = function(text){
        try {
            kls.secureEvalJSON(text);
        } catch (err) {
            return false;
        };
        return true;
    };
    kls.deepcopy = function(data){
        return eval('(' + kls.toJSON(data) + ')');
    };

    return kls;
//}}}
})();


/** 抽象基底単体値クラス */
cls.Value = (function(){
//{{{
    //
    //! valueOfで値を返そうと思ったけど、誤って参照コピーをしてバグになりそうなので止めた
    //
    var kls = function(){
        /** 値本体 */
        this._value = undefined;
        /** undefinedを許可するか */
        this._allowUndefined = true;
        /** nullを許可するか */
        this._allowNull = true;
    };

    kls.prototype.toString = function(){ return 'Value' };

    /** 値を返す */
    kls.prototype.get = function(){
        return this._value;
    };

    /** 値を設定する */
    kls.prototype.set = function(value){
        var newValue = value;
        if (this.validate(newValue) === false) {
            throw new Error('RPGMaterial:Value.set, set invalid value=' + newValue + ' to ' + this);
        };
        return this._value = newValue;
    };

    /** 値が正しいかを判定する, 必要なら__付きをoverride */
    kls.prototype._validate = function(newValue){
        return true;
    };
    kls.prototype.validate = function(newValue){
        if (!this._allowUndefined && newValue === undefined) return false;
        if (!this._allowNull && newValue === null) return false;
        return this._validate(newValue);
    };

    /** undefined許可を設定する, 単なるアクセサ */
    kls.prototype.setAllowUndefined = function(bool){
        this._allowUndefined = bool;
    };
    /** null許可を設定する, 単なるアクセサ */
    kls.prototype.setAllowNull = function(bool){
        this._allowNull = bool;
    };

    /**
     * options:
     *   defaultValue: 初期値
     *   allowUndefined:
     *   allowNull:
     */
    kls._factory = function(options){
        var opts = options || {};
        var obj = new this();
        if ('defaultValue' in opts) obj._value = opts.defaultValue;
        if ('allowUndefined' in opts) obj._allowUndefined = opts.allowUndefined;
        if ('allowNull' in opts) obj._allowNull = opts.allowNull;
        return obj;
    };

    return kls;
//}}}
})();

/** 数値クラス */
cls.$values.NumberValue = (function(){
//{{{
    var kls = function(){
        this._value = 0;
        this._allowUndefined = false;
        this._allowNull = false;
        /** 値の範囲, num || null=未設定 || func=コールバック */
        this._min = null;
        this._max = null;
    };
    $f.inherit(kls, new cls.Value());

    kls.prototype.toString = function(){ return 'NumberValue' };

    kls.prototype._validate = function(newValue){
        var v = $f.withinNum(newValue, this.getMin(), this.getMax());
        return v === newValue;
    };

    /** 値を設定範囲内に収めて更新する */
    kls.prototype.within = function(value){
        var v = $f.withinNum(value, this.getMin(), this.getMax());
        return this.set(v);
    };

    /** 値を差分修正する, strict false(default)=範囲外でも非エラー, true=エラー */
    kls.prototype.delta = function(delta, strict){
        strict = !!strict;
        var v = this._value + delta;
        return (strict)? this.set(v): this.within(v);
    };

    /** 最小値を返す, num || null */
    kls.prototype.getMin = function(){
        if (this._min === null || typeof this._min === 'number') {
            return this._min;
        };
        return this._min();
    };
    /** 最大値を返す, num || null */
    kls.prototype.getMax = function(){
        if (this._max === null || typeof this._max === 'number') {
            return this._max;
        };
        return this._max();
    };

    /**
     * options: (+_factory継承分)
     *   max:
     *   min:
     */
    kls.factory = function(value, options){
        var opts = options || {};
        if (typeof value === 'number') opts.defaultValue = value;
        var obj = cls.Value._factory.apply(this, [opts]);
        if ('min' in opts) obj._min = opts.min;
        if ('max' in opts) obj._max = opts.max;
        return obj;
    };

    return kls;
//}}}
})();


/** プレーンテキストベースの独自ML処理クラス */
cls.RichText = (function(){
//{{{
    var kls = function(){
        /** 未加工テキスト */
        this._richText = undefined;
        /** 文章リスト */
        this._sentences = undefined;
        /** 現在出力中の文章を示すポインタ, -1=未開始||int=_sentences要素番号 */
        this._pointer = undefined;
        /** 自動改行設定, null(default)=しない || 2以上の整数=1行の文字数
            文字数は、半角で何文字かを設定する, 半角2文字=全角1文字換算 */
        this._autoReturn = null;
    };

    kls.prototype._initialize = function(){
        this._sentences = [];
        this.reset();
        this._parse();
    };

    kls.prototype._parse = function(){
        var self = this;
        // 改行文字を正規化
        var text = $f.normalizeNewLineCharacters(this._richText, {deleteLast:true});
        // 改行区切りで1文章とする
        var sentenceTexts = text.split('\n');
        // 先頭から解析
        $f.each(sentenceTexts, function(nouse, sentenceText){
            var s = kls.Sentence.parse(sentenceText, self._autoReturn);
            self._sentences.push(s);
        });
    };

    kls.prototype.reset = function(){
        this._pointer = -1;
    };

    /** 次の文章を返しつつポインタを進める */
    kls.prototype.getNextSentence = function(){
        var nextPointer = this._pointer + 1;
        if (this._sentences[nextPointer] === undefined) {
            throw new Error('RPGMaterial:RichText.getNextSentence, already finished');
        };
        this._pointer += 1;
        return this._sentences[this._pointer];
    };

    /** 既に最後の文章を返していたらtrue, ! 最後の文章の出力確認は含まれてない */
    kls.prototype.isFinished = function(){
        return this._sentences[this._pointer + 1] === undefined;
    };

    /** ビューを返す, 通常出力中だった場合は、そのビューとの連携は切れる
        @param asList false(default)=ビューで返す || true=全文の配列で返す
        @return jQueryオブジェクト || arr=行リスト */
    kls.prototype.toView = function(asList){
        asList = !!asList;
        this.reset();
        var sentenceViews = [];
        while (this.isFinished() === false) {
            var sentence = this.getNextSentence();
            sentence.reset();
            sentenceViews.push(sentence.getView());
            while (sentence.isFinished() === false) {
                sentence.last();
                sentence.print();
            };
        };
        // 枠を付けてビューで返す
        if (asList === false) {
            var view = $('<div />');
            $f.each(sentenceViews, function(i, v){ view.append(v) });
            return view;
        // 各行の配列で返す
        } else {
            return sentenceViews;
        };
    };

    kls.prototype.toPlainText = function(){
        var list = $f.collect(this._sentences, function(i, v){
            return v.toPlainText();
        });
        return list.join('\n');
    };

    /** 生成メソッド */
    kls._factory = function(richText, options){
        var opts = options || {};
        var obj = new this();
        obj._richText = richText;
        if ('autoReturn' in opts && typeof opts.autoReturn === 'number' && opts.autoReturn >= 2) {
            obj._autoReturn = opts.autoReturn;
        };
        obj._initialize();
        return obj;
    };
    kls.parse = kls._factory;


    /** 文章クラス */
    kls.Sentence = (function(){
        var kkls = function(){
            /** オブジェクトID, ユニーク, 整数, 1からの連番 */
            this.objectId = undefined;
            /** 文章の未加工テキスト */
            this._rawText = undefined;
            /** 文字リスト, 各値={text:'あ', role:Roleインスタンス}
                text: テキスト本体, roleへ渡してビューを受け取る
                      またこれだけ繋げてもプレーンテキストとして読めるようにする
                role: 必ず設定される, 未加工の場合は 'none' 種別のRoleが入る
                      同じロール内に属する文字や、'none'の場合は地続きの文字は同じロールを共有する */
            this._characters = undefined;
            /** 出力済みの場所を示すポインタ, -1=未開始||int=文字リストの要素番号 */
            this._pointer = undefined;
            /** 目的ポインタ, 次回のprintで進む位置 */
            this._destination = undefined;
            /** 全体の出力先ビュー */
            this._view = undefined;
            /** ビュー内で先頭からの子ビューリスト */
            this._subViews = undefined;
            /** 自動改行設定, RichTextの同プロパティ参照 */
            this._autoReturn = undefined;
        };

        kkls._currentObjectId = 1;

        kkls.CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'richtext-sentence';

        kkls.prototype._initialize = function(){
            this.objectId = kkls._currentObjectId;
            kkls._currentObjectId += 1;
            this._characters = [];
            this.reset();
            this._parse();
        };

        /** 文章テキストを解析して、文字とロールのリストデータにする */
        kkls.ROLE_PATTERN = /:([a-z]{1,32}):`([^`]+?)`/;
        kkls.prototype._parse = function(){
            // ロール解析
            //   文字列を前から削ってくようなルーチン
            var restText = this._rawText;
            while (true) {
                var m = kkls.ROLE_PATTERN.exec(restText);
                if (m === null) {
                    this._addCharacters(restText, null);
                    restText = '';
                    break;
                } else {
                    var plainPart = restText.substr(0, m.index);
                    if (plainPart !== '') {
                        this._addCharacters(plainPart, null);
                    };
                    this._addCharacters(m[2], m[1]);
                    restText = restText.substr(m.index + m[0].length);
                };
            };
        };

        kkls.prototype._addCharacters = function(text, roleType){
            var self = this;
            var role = kls.Role.factory(roleType);
            $f.each(text.split(''), function(nouse, c){
                self._characters.push({
                    text: c,
                    role: role
                });
            });
        };

        /** データを初期状態へ戻す
            ビューとの同期が崩れた場合は一度これを呼んで同期する */
        kkls.prototype.reset = function(){
            this._pointer = -1;
            this._destination = -1;
            // <br />しないと空かないので入れる
            this._view = $('<div><br /></div>').addClass(kkls.CSS_SELECTOR);
            //! IEだとここでもダメだった
            //$f.toUnselectable(this._view);// クリック先送りでテキスト選択しちゃうので
            this._subViews = [];
        };

        kkls.prototype.toString = function(){
            return this.toPlainText();
        };

        /** 目的ポインタまで出力する
            追記式に反映するので現ビューが同期されていないと正常に表示されない
            追記式なのは性能対策と受け取り側での使い易さからそうした */
        kkls.prototype.print = function(){
            // 初出力前に初期化時の <br /> を削除
            if (this._pointer === -1) { this._view.empty() };

            var dest, destChr, currentChr, autoReturned, view;
            var autoReturnPoints = this._getAutoReturnPoints();
            for (dest = this._pointer + 1; dest <= this._destination; dest++) {
                autoReturned = false;
                // 次の文字
                destChr = this._characters[dest];
                // 現在の最後の文字
                currentChr = (this._pointer !== -1)? this._characters[this._pointer]: null;
                // 自動改行
                if (this._autoReturn !== null && $f.inArray(dest, autoReturnPoints)) {
                    view = $('<br />');
                    this._view.append(view);
                    this._subViews.push(view);
                    autoReturned = true;
                };
                // 現roleが次roleと同じか
                // 1. 同じかつ直前で自動改行していないなら末尾ビューへ追記
                if (currentChr !== null && currentChr.role === destChr.role && !autoReturned) {
                    destChr.role.appendTextToView(destChr.text, this._subViews[this._subViews.length - 1]);
                // 2. 違うなら子ビューを生成
                } else {
                    view = destChr.role.createView(destChr.text);
                    this._view.append(view);
                    this._subViews.push(view);
                };
                this._pointer = dest;
            };
        };

        /** 自動改行場所をリストで返す
            例えば戻り値が [11, 20, 29] なら、次の文字の要素番号が11or20or29の場合に直前で改行する */
        kkls.prototype._getAutoReturnPoints = function(){
            var list = [];
            var i, c, len, currentLen = 0;
            for (i = 0; i < this._characters.length; i++) {
                c = this._characters[i].text;
                if (c === '') {// 空文字は入らない、忘れて空文字ロールを作りそうなので特に書いた
                    throw new Error('RPGMaterial:RichText.Sentence._getAutoReturnPoints, invalid situation');
                };
                len = $f.isHan(c)? 1: 2;
                // 単純に自動改行幅を引くロジックだと
                // 9文字の次に全角2文字が来て改行する場合に値がズレるので注意
                if (currentLen + len > this._autoReturn) {
                    list.push(i);
                    currentLen = len;
                } else {
                    currentLen += len;
                };
            };
            return list;
        };

        /** 目的ポインタを1進める */
        kkls.prototype.next = function(){
            if (this.isFinished()) {
                throw new Error('RPGMaterial:RichText.Sentence.next, already finished');
            };
            this._destination += 1;
        };

        /** 目的ポインタを最後まで進める */
        kkls.prototype.last = function(){
            if (this.isFinished()) {
                throw new Error('RPGMaterial:RichText.Sentence.last, already finished');
            };
            this._destination = this._characters.length - 1;
        };

        kkls.prototype.isFinished = function(){
            return this._characters[this._destination + 1] === undefined;
        };

        kkls.prototype.getView = function(){
            return this._view;
        };

        kkls.prototype.toPlainText = function(){
            var self = this, t = '';
            $f.each(self._characters, function(i, v){
                t += v.text;
            });
            return t;
        };

        kkls._factory = function(text, autoReturn){
            var obj = new this();
            obj._rawText = text;
            obj._autoReturn = autoReturn;
            obj._initialize();
            return obj;
        };
        kkls.parse = kkls._factory;

        return kkls;
    })();


    /** ロールクラス */
    kls.Role = (function(){

        var kkls = function(){
            /** オブジェクトID, ユニーク, 整数, 1からの連番 */
            this.objectId = undefined;
            /**
             * ロール種別
             *
             * - [a-z]{1,32} の範囲
             * - 今は未定義ロールを指定されてもエラーにはしていない
             *
             * 'none'     = ロール無し
             * 'emphasis' = 強調, CSSで設定
             * 'strong'   = 強い強調, CSSで設定
             * 'center'   = 中央寄せ
             *
             * 予定:
             * 'link'/'ilink'(外部/内部リンク)
             * 'style'(HTMLセレクタを付与する)
             */
            this._roleType = 'none';
        };

        kkls.CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'richtext-role';

        kkls._currentObjectId = 1;

        kkls.prototype._initialize = function(){
            this.objectId = kkls._currentObjectId;
            kkls._currentObjectId += 1;
        };

        kkls.prototype.toString = function(){
            return this._roleType + ':' + this.objectId;
        };

        //
        // ! ロールまたは各パラグラフにビューを持たせない理由は、途中に自動改行が入るため
        //
        // 例えば、"あなたは:emphasis:`寝坊`した" という文章の場合、一度に出力できるなら
        // "<span>あなたは</span><b>寝坊</b><span>した</span>" となり問題は無いが
        // 自動改行が入って "<span>あなたは</span><b>寝</b><br /><b>坊</b><span>した</span>"
        // となることもある
        // この場合 "寝" と "坊" はビューを分けないといけない、ので少なくとも1対1の関係にはならない
        //
        // また、文章別に出力毎にビューを全部生成しなおさないのは、性能対策
        // 1文字進めるたびに文章単位でビューの削除・生成を行うことになるので、
        // 重いし、チラつく可能性がある
        //

        /** ロール別ビューを生成する */
        kkls.prototype.createView = function(text){
            var jq;
            if (this._roleType === 'emphasis') {
                jq = $('<em />').text(text);
            } else if (this._roleType === 'strong') {
                jq = $('<strong />').text(text);
            } else if (this._roleType === 'center') {
                jq = $('<div />').css(cls.Style.get('role_center')).text(text);
            } else {// none と 不明のロール, エラーにはしない
                jq = $('<span></span>').text(text);
            };
            jq.addClass(kkls.CSS_SELECTOR);
            return jq;
        };

        /** 既存のロール別ビューへテキストを追記する */
        kkls.prototype.appendTextToView = function(text, view){
            var current = view.text();
            view.text(current + text);
        };

        // 追加できるようにしようと思ったが保留, 仕様は以下みたいにすれば良いと思う
        ///** ロールリスト */
        //kkls._roles = {
        //    'emphasis': {// auto は 'text<arg>' や 'text(a,r,g,s)' を予め予測解析して入れてくれる
        //        parser: function(text, auto, data){},
        //        renderer: function(data){}
        //    }//,
        //};

        kkls.factory = function(roleType){
            var obj = new this();
            if (roleType !== undefined && roleType !== null) obj._roleType = roleType;
            obj._initialize();
            return obj;
        };

        return kkls;
    })();

    return kls;
//}}}
})();


/** 座標範囲計算クラス */
cls.Range = (function(){
//{{{
    //
    // メモ:
    // - 単なる距離や矩形やひし形などの定型範囲は、座標リストでなくて数値指定できるようにする
    //   特殊な形のみ座標リストを使う
    // - 中心人物の四方向/八方向き対応
    // - 座標リストだと画面全体などを表現する際に重くなり過ぎるので、その対応
    // - hwhのようなサブクラス式は止める,キャッシュは上記のような状況も含めて別途管理する方法を考慮
    //
    var kls = function(){};

    /**
     * 中心点と距離を指定して範囲内の座標リストを取得する
     *
     * ex) [0, 0] から2歩以内で中心を含まない結果を取得したい場合
     *     centerIndex=[0, 0],
     *     maxDistance=2,
     *     selector=function(idx, dist){if (dist === 0) return false}
     *     ... 結果, 合計12マス分の情報が返される
     *
     * 呼ぶ回数が多くなりそうなので、性能面も若干配慮する
     *
     * @return arr [{index:<座標>, distance:<距離>}, ...]
     *             まずは近い順で、同じ距離の場合は上([0]が低い順)、
     *             同じ縦位置の場合は右([1]が高い順)にソートされる
     */
    kls.getNeighbors = function(centerIndex, maxDistance, selector){
        selector = selector || null;
        // 座標リスト取得 ＆ ソート ＆ 結果生成 を行う
        // それぞれ別にループさせた方がわかり易いけど、性能優先で一巡で終わるようにした
        var results = [];
        var dist, relativePoints, i, ii, p;
        for (i = maxDistance; i >= 0; i--) {
            dist = maxDistance - i; // 0, 1, 2, 3 ... の近い順
            relativePoints = kls.distanceToPoints(dist);
            relativePoints.sort(function(a, b){return b[1] - a[1]}); // 右寄り順
            relativePoints.sort(function(a, b){return a[0] - b[0]}); // 上寄り順
            for (ii = 0; ii < relativePoints.length; ii++) {
                p = [
                    centerIndex[0] + relativePoints[ii][0],
                    centerIndex[1] + relativePoints[ii][1]
                ];
                if (selector === null || selector(p, dist) !== false) {// 選別判定
                    results.push({
                        index: p,
                        distance: dist
                    });
                };
            };
        };
        return results;
    };

    /** 距離を展開して、始点を [0,0] とした場合の取り得る終点の相対座標リストを返す */
    kls.distanceToPoints = function(distance){
        var absPoints = [];
        var i;
        // ex) 距離 2 => [[0,2], [1,1], [2,0]]
        for (i = 0; i <= distance; i++) {
            absPoints.push([i, distance - i]);
        };
        var points = [];
        // ex) [[0,2], [1,1], [2,0]]
        //     => [[0,2], [0,-2], [1,1], [-1,1], [1,-1], [-1,-1], [2,0], [-2,0]]
        var j, x, y;
        for (j = 0; j < absPoints.length; j++) {
            x = absPoints[j][0];
            y = absPoints[j][1];
            if (x === 0 && y === 0) {
                points.push([x, y]);
                continue;
            };
            if (x === 0) {
                points.push([x, y], [x, -y]);
                continue;
            };
            if (y === 0) {
                points.push([x, y], [-x, y]);
                continue;
            };
            points.push([x, y], [-x, y], [x, -y], [-x, -y]);
            continue;
        };
        return points;
    };

    /** 2点座標間の距離を計算する */
    kls.pointsToDistance = function(a, b){
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    };

    /** @ref http://kjirou.net/main/public/js/snippet/strtocoords/index.html */
    kls.strToCoords = function(str /* args */) {
    //{{{
        var funcs = [];
        var opts = {};
        var i, f;
        for (i = 1; i < arguments.length; i++) {
            f = arguments[i];
            if (typeof f === 'function') {
                funcs.push(f);
            } else {
                opts = f;
                break;
            };
        };

        // Keep functions and variables in myself for tests and spec
        var myself = arguments.callee;

        if ('__EXP_PATTERN' in myself === false) {

            // '(5,6..8)$1!(5,7)' -> ['(5,6..8)$1', '!(5,7)']
            // '5,6'              -> ['(5,6)']
            myself.__EXP_PATTERN = /^[!]?[(][-. ,$\d]+[)](?:[$][1-9])?/;
            myself.__devideStrByExp = function(str){
                var s = str, list = [], m;
                while (s !== '') {
                    m = myself.__EXP_PATTERN.exec(s);
                    if (m === null) {
                        s = '(' + str + ')';
                        m = myself.__EXP_PATTERN.exec(s);
                        if (m === null) {
                            throw new Error('Error in strToCoords.__devideStrByExp, syntax error in str=' + str);
                        };
                    };
                    list.push(m[0]);
                    s = s.substr(m[0].length);
                };
                return list;
            };

            // '!(5,7..8)$1' -> ['!', '5,7..8', '$1']
            // '(5,7..8)'    -> [null, '5,7..8', null]
            myself.__EXPPARTS_PATTERN = /^([!])?[(]([-. ,$\d]+)[)]([$][1-9])?$/;
            myself.__explodeExp = function(exp){
                var m = myself.__EXPPARTS_PATTERN.exec(exp);
                if (m === null) {
                    throw new Error('Error in strToCoords.__explodeExp, syntax error in exp=' + exp);
                };
                return [// `=== ''` is for IE
                    (m[1] === undefined || m[1] === '') ? null : m[1],
                    m[2],
                    (m[3] === undefined || m[3] === '') ? null : m[3]
                ];
            };

            // '5,6..8' -> ['5', '6..8']
            // '5,6,7'  -> ['5', '6', '7']
            myself.__devideExpbodyByDimension = function(expbody){
                return expbody.split(','); // Not use /,/ for IE bug
            };

            // '6..8$1' -> ['6..8', '$1']
            // '6..8'   -> ['6..8', null]
            myself.__DIMENSIONPARTS_PATTERN = /^([-. \d]+)([$][1-9])?$/;
            myself.__explodeDimension = function(dimension){
                var m = myself.__DIMENSIONPARTS_PATTERN.exec(dimension);
                if (m === null) {
                    throw new Error('Error in strToCoords.__explodeDimension, syntax error in dimension=' + dimension);
                };
                return [
                    m[1],
                    (m[2] === undefined || m[2] === '') ? null : m[2]
                ];
            };

            // '6..8'    -> [6, 7, 8]
            // '-6..-8'  -> [-6, -7, -8]
            // '8..6'    -> [8, 7, 6]
            // '6 8'     -> [6, 8]
            // '6 8..10' -> [6, 8, 9, 10]
            myself.__RANGE_PATTERN = /^(-?\d+)\.\.(-?\d+)$/;
            myself.__evalDimensionbody = function(dimensionbody){
                var coords = [];
                var parts = dimensionbody.split(' '), i, part, from, to;
                for (i = 0; i < parts.length; i++) {
                    part = parts[i];
                    // '1' || '-20'
                    if (/^-?\d+$/.test(part)) {
                        coords.push(parseInt(part));
                        continue;
                    };
                    // '1..10' || '-1..-10'
                    var m = myself.__RANGE_PATTERN.exec(part);
                    if (m !== null) {
                        from = parseInt(m[1]);
                        to = parseInt(m[2]);
                        if (from < to) {
                            for (; from <= to; from++) { coords.push(from) };
                        } else {
                            for (; from >= to; from--) { coords.push(from) };
                        };
                        continue;
                    };
                    throw new Error('Error in strToCoords.__evalDimensionbody, syntax error in dimensionbody=' + dimensionbody);
                };
                return coords;
            };

            // funcs[0] = function(v){ if (v % 2 === 0) return v };
            // ('$1', [6, 7, 8]) -> [funcs[0](6), funcs[0](7), funcs[0](8)] -> [6, undefined, 8] -> [6, 8]
            myself.__filter = function(symbol, funcs, list){
                // '$1'->funcs[0], $9->funcs[8]
                var idx = parseInt(symbol.replace(/\$/, '')) - 1;
                var func = funcs[idx];
                if (func === undefined) {
                    throw new Error('Error in strToCoords.__filter, not defined filter=' + symbol);
                };
                var result, param, newList = [], i;
                for (i = 0; i < list.length; i++) {
                    param = list[i];
                    // filter([1, 2], 1, 2)
                    if (param instanceof Array) {
                        result = func.apply(this, [param].concat(param));
                    // filter(1)
                    } else {
                        result = func(param);
                    };
                    if (result !== undefined) newList.push(result);
                };
                return newList;
            };

            // ([1])                    -> [[1]]
            // ([1, 2], [3, 4])         -> [[1, 3], [1, 4], [2, 3], [2, 4]]
            // ([1, 2], [3, 4], [5, 6]) -> [[1,3,5], [1,3,6], [1,4,5], [1,4,6], [2,3,5], .. [2,4,6]]
            myself.__composeDimensions = function(/* arguments */){
                var args = Array.prototype.slice.apply(arguments);
                var coords = [];
                (function(dIdx, points){
                    var d = args[dIdx];
                    var i, nextPoints;
                    for (i = 0; i < d.length; i++) {
                        nextPoints = points.concat([d[i]]);
                        if (args[dIdx + 1] === undefined) {
                            coords.push(nextPoints);
                        } else {
                            arguments.callee(dIdx + 1, nextPoints);
                        };
                    };
                })(0, []);
                return coords;
            };

            // ([[6, 6], [6, 7], [6, 8]], [[6, 7]]) -> [[6, 6], [6, 8]]
            myself.__applyRemoveAttr = function(lefts, rights, isStrict){
                var results = [];
                var i, left, ii, right;
                for (i = 0; i < lefts.length; i++) {
                    left = lefts[i];
                    for (ii = 0; ii < rights.length; ii++) {
                        right = rights[ii];
                        if (left.join(',') === right.join(',')) {
                            left = null;
                            break;
                        } else {
                            if (isStrict) {
                                throw new Error('Error in strToCoords.__applyRemoveAttr, can not remove [' + rights.join('][') + '] from [' + lefts.join('][') + ']');
                            };
                        };
                    };
                    if (left !== null) results.push(left);
                };
                return results;
            };
        };

        var isStrict = ('strict' in opts)? opts.strict: false;

        var coords = [];
        var exps = myself.__devideStrByExp(str);
        var dimensionCount = null;
        var i1, exp, expParts, dimensions, i2, dimension, dParts, dPoints, dPointSets, expCoords;
        for (i1 = 0; i1 < exps.length; i1++) {
            exp = exps[i1];
            expParts = myself.__explodeExp(exp);
            dimensions = myself.__devideExpbodyByDimension(expParts[1]);
            if (dimensionCount === null) {
                dimensionCount = dimensions.length;
            } else {
                if (dimensionCount !== dimensions.length) {
                    throw new Error('Error in strToCoords, not equal dimensions');
                };
            };
            dPointSets = [];
            for (i2 = 0; i2 < dimensions.length; i2++) {
                dimension = dimensions[i2];
                dParts = myself.__explodeDimension(dimension);
                dPoints = myself.__evalDimensionbody(dParts[0]);
                if (dParts[1] !== null) {
                    dPoints = myself.__filter(dParts[1], funcs, dPoints);
                };
                dPointSets.push(dPoints);
            };

            expCoords = myself.__composeDimensions.apply(this, dPointSets);
            if (expParts[2] !== null) {
                expCoords = myself.__filter(expParts[2], funcs, expCoords);
            };

            if (expParts[0] === null) {
                coords = coords.concat(expCoords);
            } else if (expParts[0] === '!') {
                coords = myself.__applyRemoveAttr(coords, expCoords, isStrict)
            };
        };

        return coords;
    //}}}
    };

    return kls;
//}}}
})();


/** レベル管理クラス */
cls.LvManager = (function(){
//{{{
    var kls = function(){

        /** 現経験値, 0以上の整数 */
        this._exp = 0;

        /** 配列の必要経験値マップ, 各値は要素番号+1レベルに必要な1LV分の経験値
            差分経験値でトータルでは無い, [0]へは必ず0が入る */
        this._necessaryExps = undefined;

        /** LV計算高速化のためのキャッシュ機能,
            評価の際に前回と同じexpならキャッシュしたLVを返す */
        this._cachedExp = this._exp;
        this._cachedLvInfo = null;
    };

    /** レベルに必要な条件を設定する, 現在は経験値のみ */
    kls.prototype.setLvMap = function(/* args */){
        var lvCap, filter, lv;
        // [0]=arr, LV毎の必要経験値リスト
        if (arguments[0] instanceof Array) {
            this._necessaryExps = arguments[0];
        // [0]=int, [1]=func
        } else {
            lvCap = arguments[0]; // レベル上限, 1以上
            filter = arguments[1]; // function(nextLv){} で必要経験値リストを設定する
            this._necessaryExps = [0];
            for (lv = 2; lv <= lvCap; lv++) {// LV2からスタート
                this._necessaryExps[lv - 1] = filter(lv);
            };
        };
        // 設定失敗, Lv1は必ず0である必要がある
        if (this._necessaryExps instanceof Array === false ||
            this._necessaryExps.length === 0 || this._necessaryExps[0] !== 0) {
            throw new Error('RPGMaterial:LvManager.setLvMap, invalid situation necessaryExps=' + this._necessaryExps);
        };
    };

    /** 現LVと経験値についての情報を返す
        一緒に色々返すのは処理がわずかに重い＋複雑だから
        @return [<現LV>, <次LVへの繰り越し経験値||null>, <次LVに必要な経験値全体||null>]
                nullはレベルが上限に達していることを示す */
    kls.prototype.getLvInfo = function(){
        var self = this;
        // 前評価時と同じ場合はキャッシュから返す
        if (this._cachedLvInfo !== null && this._exp === this._cachedExp) {
            return this._cachedLvInfo.slice();
        };
        var yourLv = 0;
        var totalNecessaryExp = 0;
        var nextLvFullExp = null;
        var nextLvCurrentExp = null;
        $f.each(this._necessaryExps, function(i, necessaryExp){
            var nextLv = i + 1;
            totalNecessaryExp += necessaryExp;
            if (self._exp >= totalNecessaryExp) {
                yourLv = nextLv;
            } else {
                nextLvFullExp = necessaryExp;
                nextLvCurrentExp = self._exp - (totalNecessaryExp - necessaryExp);
                return false;
            };
        });
        if (yourLv === 0) {// 一応, 通らないはず
            throw new Error('RPGMaterial:LvManager.getLvInfo, invalid situation');
        };
        var lvInfo = [yourLv, nextLvCurrentExp, nextLvFullExp];
        // キャッシュ情報更新
        if (this._exp !== this._cachedExp) {
            this._cachedExp = this._exp;
            this._cachedLvInfo = lvInfo.slice();
        };
        return lvInfo;
    };

    /** 現LVのみを返す */
    kls.prototype.getLv = function(){
        return this.getLvInfo()[0];
    };

    /** 上限LVを返す */
    kls.prototype.getLvCap = function(){
        return this._necessaryExps.length;
    };

    /** 上限LVなら真を返す */
    kls.prototype.isLvCap = function(){
        return this.getLv() === this.getLvCap();
    };

    /** 現経験値を返す, 単なるアクセサ */
    kls.prototype.getExp = function(){
        return this._exp;
    };

    /** 上限経験値を返す, なお現在は上限までしか経験値を記録しない */
    kls.prototype.getExpCap = function(){
        return $f.sum(this._necessaryExps);
    };

    /** あるLvからあるLvまで上がるのに必要な合計経験値を返す */
    kls.prototype.calculateTotalNecessaryExp = function(fromLv, toLv){
        var t = 0, i;
        for (i = fromLv + 1; i <= toLv; i++) { t += this._necessaryExps[i - 1] };
        return t;
    };

    /** 経験値を得る, @return false=LVUPしなかった arr=LVUPした場合にその情報 */
    kls.prototype.gainExp = function(exp, withNews){
        var withNews = !!withNews;
        var before = this.getLvInfo();
        this._exp = $f.withinNum(this._exp + exp, null, this.getExpCap());
        var after = this.getLvInfo();
        if (before[0] < after[0]) { return after };
        return false;
    };

    /** 現LVから上昇するLV分の経験値を得る
        余ってた経験値は繰り越される, @return 同gainExp */
    kls.prototype.gainExpByLv = function(lvCount){
        var fromLv = this.getLv();
        var toLv = fromLv + lvCount;
        toLv = $f.withinNum(toLv, null, this.getLvCap());
        return this.gainExp(this.calculateTotalNecessaryExp(fromLv, toLv));
    };

    /** LV計算で経験値を下げる, 端数は切り捨てられてそのLV内での最低値になる */
    kls.prototype.drainExpByLv = function(lvCount){
        var toLv = $f.withinNum(this.getLv() - lvCount, 1);
        this._exp = this.calculateTotalNecessaryExp(1, toLv);
    };

    /** 生成後に setLvMap を行うこと */
    kls.factory = function(){
        var obj = new this();
        return obj;
    };

    return kls;
//}}}
})();


/** 画像規格クラス */
cls.ImageProtocol = (function(){
//{{{
    var kls = function(){};
    /**
     * 画像規格情報
     *
     * とりあえず以下のようにまとめてみる
     * 規格同士で部品の概念を共有するかなどは保留
     *
     * 規格名
     *   ファイル用識別名
     *     size: [width, height]
     *     parts:
     *       部品名1: [[top, left], [width, height]]
     *       部品名2: ...
     */
    kls.IMAGE_PROTOCOLS = {

        'rpg_tkool_vx': {
            'window_': {
                'size': [128, 128],
                'parts': {
                    'pause_sign_1': [[64, 96], [16, 16]],
                    'pause_sign_2': [[64, 112], [16, 16]],
                    'pause_sign_3': [[80, 112], [16, 16]],
                    'pause_sign_4': [[80, 96], [16, 16]]//,
                }
            },
            //
            // +--+
            // |ab| 32x32を左のように16x16に分割してa-dのキーを付ける
            // |dc| 各部分 [0,0,0,0,0] で [上,右,下,左,角] の境界の有無を示すデータを持つことにする
            // +--+ ここではそれを文字列にしたものをキーにし、画像上の座標を定義する
            //
            'auto_tiling': {
                'clip_size': [96, 64], // 使ってない
                'part_size': [16, 16], // 使ってない, ベタ書きしてる
                'a': {
                    '00000': [64, 32],
                    '10000': [32, 32],
                    '00010': [64,  0],
                    '10010': [32,  0],
                    '00001': [ 0, 32]
                },
                'b': {
                    '00000': [64, 16],
                    '10000': [32, 16],
                    '01000': [64, 48],
                    '11000': [32, 48],
                    '00001': [ 0, 48]
                },
                'c': {
                    '00000': [48, 16],
                    '01000': [48, 48],
                    '00100': [80, 16],
                    '01100': [80, 48],
                    '00001': [16, 48]
                },
                'd': {
                    '00000': [48, 32],
                    '00100': [80, 32],
                    '00010': [48,  0],
                    '00110': [80,  0],
                    '00001': [16, 32]
                }
            }
        }
    };

    /** 規格情報を返す */
    kls.get = function(protocolName){
        if (protocolName in kls.IMAGE_PROTOCOLS) {
            return cls.JSONUtils.deepcopy(kls.IMAGE_PROTOCOLS[protocolName]);
        };
        throw new Error('RPGMaterial:ImageProtocol, not defined protocol=`' + protocolName + '`');
    };

    /** 境界線データから各オートタイリング用パーツ画像の座標相対位置データを取得する
        @param オートタイリング用境界線データ, あるマスの境界線の状況を
               [上, 右上隅, 右, 右下隅, 下, 左下隅, 左, 左上隅] のリストで表現したもの
               1=境界線有り, 0=境界線無し を示す
        @return [[パーツ1top, パーツ1left], [..], [..], [..]]
                32x32を16x16で分割した場合の 左上・右上・右下・左下 に使うパーツ用画像の相対位置 */
    kls.parseBoundaryData = function(boundaryData){
        // 境界線データを各パーツ別境界線データへ変換
        var a = [0, 0, 0, 0, 0];
        var b = [0, 0, 0, 0, 0];
        var c = [0, 0, 0, 0, 0];
        var d = [0, 0, 0, 0, 0];
        if (boundaryData[0]) a[0]++, b[0]++;
        if (boundaryData[1]) b[4]++;
        if (boundaryData[2]) b[1]++, c[1]++;
        if (boundaryData[3]) c[4]++;
        if (boundaryData[4]) c[2]++, d[2]++;
        if (boundaryData[5]) d[4]++;
        if (boundaryData[6]) a[3]++, d[3]++;
        if (boundaryData[7]) a[4]++;
        // 規格データから各パーツの画像内での位置を取得
        var protocol = kls.get('rpg_tkool_vx');
        var positions = [
            protocol.auto_tiling.a[a.join('')],
            protocol.auto_tiling.b[b.join('')],
            protocol.auto_tiling.c[c.join('')],
            protocol.auto_tiling.d[d.join('')]
        ];
        // 不安なので本来発生しないはずのエラーだけどハンドリングしとく
        if (
            positions[0] === undefined ||
            positions[1] === undefined ||
            positions[2] === undefined ||
            positions[3] === undefined
        ) {
            throw new Error('RPGMaterial:ImageProtocol.parseBoundaryData, invalid situation');
        };
        return positions;
    };

    /** 同種タイル存否データから境界線データを生成する
        @param 3x3の二次元配列で表現された中心マスとの同種タイル存否データ
               例えば以下のデータは
               [ [1, 1, 1],
                 [0, 1, 1],
                 [0, 0, 0] ]
               中心である[1][1]と同種タイルは北列3つと中央列2つということを示す, 中心は常に1
        @return 境界線データ, parseBoundaryData 参照 */
    kls.createBoundaryData = function(mapData){
        var bd = [0, 0, 0, 0, 0, 0, 0, 0];
        if (// 0or1以外のものが含まれているか、中心が1でないならエラー
            $f.collect($f.collapseMDArray(mapData), function(i, v){
                if (v !== 0 && v !== 1) return v;
            }).length > 0 ||
            mapData[1][1] !== 1
        ) {
            throw new Error('RPGMaterial:ImageProtocol.createBoundaryData, invalid parameter');
        };
        var m = mapData; // 変数名短縮
        if (m[0][1] === 0) bd[0]++; //上辺
        if (m[0][1] === 1 && m[0][2] === 0 && m[1][2] === 1) bd[1]++; //右上隅
        if (m[1][2] === 0) bd[2]++; //右辺
        if (m[1][2] === 1 && m[2][2] === 0 && m[2][1] === 1) bd[3]++; //右下隅
        if (m[2][1] === 0) bd[4]++; //下辺
        if (m[2][1] === 1 && m[2][0] === 0 && m[1][0] === 1) bd[5]++; //左下隅
        if (m[1][0] === 0) bd[6]++; //左辺
        if (m[1][0] === 1 && m[0][0] === 0 && m[0][1] === 1) bd[7]++; //左上隅
        return bd;
    };

    return kls;
//}}}
})();


/** 画像索引クラス */
cls.ImageIndexer = (function(){
//{{{
    //
    // 超暫定版
    // - プレロード機能必要？
    //
    var kls = function(){
        /**
         * 索引データ
         *
         * '<任意のキー>': {
         *     type: '<upload||clip>',
         *     url: '<URL>',
         *     fullSize: [width, height],
         *     // upload 時必須, clip時不要
         *     partSize: [width, height],
         *     // upload 時オプション, clip時は不要
         *     uploadPos: [top, left],
         *     uploadSize: [width, height],
         *     // clip 時必須, upload時は自動設定
         *     clipPos: [top, left],
         *     clipSize: [width, height],
         * }
         */
        this._data = {};
    };

    /**
     * 画像全体を一定幅で分割して索引リストとして登録する
     *
     * options.uploadPos: 分割開始位置の明示指定
     * options.uploadSize: 分割対象サイズ指定
     *
     * 画像実サイズがfullSizeで、uploadSizeはその中の自動分割する領域
     * 1画像に複数の規格の画像セットをまとめる際に必要になる
     */
    kls.prototype.upload = function(key, url, fullSize, partSize, options){
        var opts = options || {};
        var uploadPos = ('uploadPos' in opts)? opts.uploadPos: [0, 0];
        var uploadSize = ('uploadSize' in opts)? opts.uploadSize: fullSize.slice();

        if (this._has(key)) {
            throw new Error('RPGMaterial:ImageIndexer.upload, already key=`' + key + '`');
        };
        if (uploadSize[0] % partSize[0] !== 0 || uploadSize[1] % partSize[1] !== 0) {
            throw new Error('RPGMaterial:ImageIndexer.upload, can\'t be devided');
        };
        this._data[key] = {
            type: 'upload',
            url: url,
            fullSize: fullSize,
            partSize: partSize,
            uploadPos: uploadPos,
            uploadSize: uploadSize,
            clipPos: [0, 0],
            clipSize: fullSize.slice()
        };
    };

    /** 画像の一部をくり抜いて、ひとつの索引を登録する */
    kls.prototype.clip = function(key, url, fullSize, clipPos, clipSize){
        if (this._has(key)) {
            throw new Error('RPGMaterial:ImageIndexer.clip, already key=`' + key + '`');
        };
        if (arguments.length < 5) {// upload と間違えそう
            throw new Error('RPGMaterial:ImageIndexer.clip, not enough arguments=`' + arguments + '`');
        };
        if (fullSize[0] < clipPos[1] + clipSize[0] || fullSize[1] < clipPos[0] + clipSize[1]) {
            throw new Error('RPGMaterial:ImageIndexer.clip, too small image');
        };
        this._data[key] = {
            type: 'clip',
            url: url,
            fullSize: fullSize,
            partSize: null,
            uploadPos: null,
            uploadSize: null,
            clipPos: clipPos,
            clipSize: clipSize
        };
    };

    kls.prototype._has = function(key){
        return key in this._data;
    };

    /** idx num=連番指定 || arr=行,列指定 || (undefined or null)=指定無し */
    kls.prototype._get = function(key, idx){
        if (this._has(key) === false) {
            throw new Error('RPGMaterial:ImageIndexer._get, not defined key=`' + key + '`');
        };
        var dat = this._data[key];
        if (dat.type === 'clip' && idx !== undefined && idx !== null) {// 'clip'はidx指定不可
            throw new Error('RPGMaterial:ImageIndexer._get, clipped image is not selectable idx, key=`' + key + '`');
        };
        var pos, size;
        // 連番で指定, 1スタート
        // ex) 1234
        //     56..
        if (typeof idx === 'number') {
            var columnCount = dat.uploadSize[0] / dat.partSize[0];
            var rowCount = parseInt((idx - 1) / columnCount);
            pos = [
                rowCount * dat.partSize[1] + dat.uploadPos[0],
                ((idx - 1) % columnCount) * dat.partSize[0] + dat.uploadPos[1]
            ];
            size = dat.partSize;
        // [行,列] で指定
        // ex) [0,0][0,1][0,2] ..
        //     [1,0][1,0][1,2] ..
        } else if (idx instanceof Array) {
            pos = [
                idx[0] * dat.partSize[1] + dat.uploadPos[0],
                idx[1] * dat.partSize[0] + dat.uploadPos[1]
            ];
            size = dat.partSize;
        // 指定無し, 唯一の画像を取得, type=uplold の場合は全画像取得
        } else {
            pos = dat.clipPos;
            size = dat.clipSize;
        };
        if (dat.fullSize[0] < pos[1] + size[0] || dat.fullSize[1] < pos[0] + size[1]) {
            throw new Error('RPGMaterial:ImageIndexer._get, bad image index=`' + idx + '`');
        };
        return {
            url: dat.url,
            fullSize: dat.fullSize,
            clipPos: pos,
            clipSize: size
        };
    };

    /** データを受け取る
        'normal'チップならば、そのままvariationへ登録可能 */
    kls.prototype.get = function(key, idx){
        return this._get.apply(this, arguments);
    };

    kls.prototype.getUrl = function(key){
        return this._get(key).url;
    };

    kls.prototype.getUrlForBackground = function(key){
        return 'url(' + this._get(key).url + ')';
    };

    /** データをチップ化して受け取る
        @param resizing arr=その[サイズ]にリサイズ, default=しない */
    kls.prototype.asChip = function(key, idx, resizing){
        var dat = this._get(key, idx);
        var size;
        if (resizing instanceof Array) {
            size = resizing;
            dat.type = 'resize';
        } else {
            size = dat.clipSize;
            delete dat.clipSize;
        };
        return cls.$chips.PlainChip.factory(size, null, dat);
    };

    /** データを非オートタイルとして受け取る
        64x96規格のみ対応で、最左上の32x32をチップとして返す */
    kls.prototype.asTile = function(key, idx){
        var dat = this._get(key, idx);
        if (dat.clipSize[0] !== 64 || dat.clipSize[1] !== 96) {
            throw new Error('RPGMaterial:ImageIndexer.asTile, image size is not 64x96');
        };
        delete dat.clipSize;
        return cls.$chips.PlainChip.factory([32, 32], null, dat);
    };

    /** データを非オートタイルとして受け取る, 64x96規格のみ対応 */
    kls.prototype.asAutoTile = function(key, idx){
        var dat = this._get(key, idx);
        if (dat.clipSize[0] !== 64 || dat.clipSize[1] !== 96) {
            throw new Error('RPGMaterial:ImageIndexer.asAutoTile, image size is not 64x96');
        };
        delete dat.clipSize;
        dat.type = 'auto_tiling';
        return cls.$chips.PlainChip.factory([32, 32], null, dat);
    };

    kls.factory = function(){
        var obj = new this();
        return obj;
    };

    return kls;
//}}}
})();


/** スタイルクラス */
cls.Style = (function(){
//{{{
    //! 値が変わるとシステム上も不具合を起こすものだけを記載する
    var kls = function(){};
    kls.get = function(styleId, errorRaising){
        if (errorRaising === undefined) errorRaising = true;
        if (styleId === 'block') {
            // top,left,width,height はJSにより必ず付与される
            return {
                display: 'block',
                margin: 0,
                padding: 0,
                // とりあえずは隠す前提, 解除可能にするならその際に精査すること
                overflow: 'hidden'
            };
        } else if (styleId === 'block_absolute') {
            return {
                position: 'absolute'
            };
        } else if (styleId === 'block_relative') {
            return {
                position: 'relative'
            };
        } else if (styleId === 'message_block') {
            return $f.extend(this.get('block'), {
                // Windows, Mac, Linux の順
                fontFamily: '"MS Gothic","Osaka-Mono","monospace"'
            });
        } else if (styleId === 'block_cover') {
            return { position:'absolute', top:0, left:0, zIndex:cls.$consts.ZINDEX_SYSTEM_TOP };
        } else if (styleId === 'block_closingline') {
            return { position:'absolute', top:0, left:0, zIndex:cls.$consts.ZINDEX_SYSTEM_TOP };
        } else if (styleId === 'role_center') {
            return {textAlign: 'center'};
        } else if (styleId === 'board_square_click_handker') {
            return {
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundColor: 'transparent'
            };
        } else if (styleId === 'board_square_closing_line_default_color') {
            return {borderColor:'#FFCC00'};
        // 汎用カラーテーマ
        // - 当クラスで使うだけで、利用側には最終的なスタイル値だけ返すだけにしたいのだが
        //   今は Board.Square._parseColor でも参照している
        // - 適当に配色してるので使いながら調整
        // - 他、味方・敵・中立、光・影、アクティブ・インアクティブ など
        } else if (styleId === '_coloring-mist') {
            return {backgroundColor:'#FFFFFF', opacity:0.25};
        } else if (styleId === '_coloring-fog') {
            return {backgroundColor:'#FFFFFF', opacity:0.5};
        } else if (styleId === '_coloring-cloud') {
            return {backgroundColor:'#FFFFFF', opacity:0.75};
        } else if (styleId === '_coloring-black_mist') {
            return {backgroundColor:'#333333', opacity:0.25};
        } else if (styleId === '_coloring-black_fog') {
            return {backgroundColor:'#333333', opacity:0.5};
        } else if (styleId === '_coloring-black_cloud') {
            return {backgroundColor:'#333333', opacity:0.75};
        } else if (styleId === '_coloring-damage') {
            return {backgroundColor:'#FF0000', opacity:0.5};
        } else if (styleId === '_coloring-thin_damage') {
            return {backgroundColor:'#FF0000', opacity:0.25};
        } else if (styleId === '_coloring-healing') {
            return {backgroundColor:'#00FF00', opacity:0.5};
        } else if (styleId === '_coloring-thin_healing') {
            return {backgroundColor:'#00FF00', opacity:0.25};
        } else if (styleId === '_coloring-light') {
            return {backgroundColor:'#FFFF00', opacity:0.5};
        } else if (styleId === '_coloring-dark') {
            return {backgroundColor:'#000000', opacity:0.5};
        };
        if (errorRaising) {
            throw new Error('RPGMaterial:Style.get, undefined styleId=`' + styleId + '`');
        } else {
            return null;
        };
    };

    /** 独自定義の特殊色を設定から返す
        ! Block.drawClosingLine にて 枠線色としても使用している
        @return obj= backgroundColorとopacityで構成されるjQuery.css用スタイル情報
                該当が無い場合は引数指定そのままをobj化して返す
        平面に対するもので、フォントは別手段（今はそもそも無い） */
    kls.getSpecialColor = function(keyOrColorCode, opacity){
        var result = cls.Style.get('_coloring-' + keyOrColorCode, false);
        var styles;
        if (result === null) {
            styles = { backgroundColor: keyOrColorCode };
        } else {
            styles = result;
        };
        if (opacity !== undefined && opacity !== null) styles.opacity = opacity;
        return styles;
    };

    /** IEでopacityの値を変更すると表示やイベントハンドラがおかしくなることがある
        それを修正するためのハック, 主にfadeIn/fadeOut後に問題が出た時に使う
        ref) http://d.hatena.ne.jp/shogo0809/20090831/1251707663
             http://blog.tackikaku.jp/2010/11/ie78opacity.html
        ! 実際jQuery.animateでやってみたら最後にカクカクが取れるので不要だった
          jQueryが何かしてるのか他の理由か不明, ソースは読んだがわからなかった */
    kls.removeIEOpacityCurse = function(jqObj){
        if ($f.isIE()) {
            jqObj.each(function(){
                    this.style.removeAttribute('filter');
                })
                .css({visibility: 'hidden'})
                .css({visibility: 'visible'});
        };
    };

    return kls;
//}}}
})();


/** 3D風2D描画補助クラス */
cls.Not3d = (function(){
//{{{
    //
    // 単体ライブラリでも公開しているので、折を見て向こうも更新
    // 移植時のバージョンは 0.1.0 (2012-05-15)
    //
    // 更新履歴:
    // - calculateRectの位置とサイズを交換した、デモが動かなくなるので移植時注意
    //
    var kls = function(){
        /** 消失点座標, [top, left] */
        this._vanishingPoint = undefined;
    };

    /** 消失点を基準にした相対座標を計算する
        @param distanceRate float 消失点からの相対距離, 0以上の整数, 0.0が消失点で1.0が現在位置
        @param pos arr [top, left], それぞれ値はfloatにもなり得る */
    kls.prototype.calculatePoint = function(distanceRate, pos){
        return [
            kls._calculateMoving(distanceRate, pos[0], this._vanishingPoint[0]),
            kls._calculateMoving(distanceRate, pos[1], this._vanishingPoint[1])
        ];
    };

    /** 消失点を基準にした矩形の相対座標と大きさを計算する
        @param size arr [<基準サイズ>]
        @param pos arr [<基準位置>]
        @return [[<サイズ>], [<位置>]], それぞれ値はfloatにもなり得る */
    kls.prototype.calculateRect = function(distanceRate, size, pos){
        // 次の 上, 右, 下, 左 の位置
        var top = kls._calculateMoving(distanceRate, pos[0], this._vanishingPoint[0]);
        var right = kls._calculateMoving(distanceRate, pos[1]+size[0], this._vanishingPoint[1]);
        var bottom = kls._calculateMoving(distanceRate, pos[0]+size[1], this._vanishingPoint[0]);
        var left = kls._calculateMoving(distanceRate, pos[1], this._vanishingPoint[1]);
        return [
            [Math.abs(left - right), Math.abs(top - bottom)],
            [top, left]
        ];
    };


    /** 相対距離による座標値の変化を計算する */
    kls._calculateMoving = function(distanceRate, targetValue, baseValue){
        return (targetValue - baseValue) * distanceRate + baseValue;
    };


    kls.factory = function(vanishingPoint){
        var obj = new this();
        obj._vanishingPoint = vanishingPoint;
        return obj;
    };

    return kls;
//}}}
})();


/** 抽象基底外部リクエストクラス */
cls.Request = (function(){
//{{{
    var kls = function(){

        /** 結果フラグ, true=正常終了 false=異常終了,または実行中 */
        this._isSuccess = false;

        /** ThreadManager.Clientオブジェクト */
        this._thread = undefined;

        /** 未加工レスポンス内容, str || null=未取得 */
        this._responseText = null;

        /** JSデータ化済みレスポンス内容, obj || arr || null=未取得
            _responseTextと重複することになるが
            JSONPの場合は最初からデータとして取得するので別に定義することになった */
        this._responseData = null;

        /** 各イベントハンドラ, 継承では更新しないで生成引数で設定する
            func || null */
        this._oncomplete = null;
        this._onfail = null;
        this._onstop = null;

        // 以下、当クラスでは処理無しだが、サブクラスで大抵必要なので予約している値
        /** URL, str || null */
        this._url = null;
        /** HTTPメソッド, 'get' || 'post' || null=未使用 */
        this._method = null;
        /** POSTデータ, obj || null=無し */
        this._postData = null;
        /** Key-Value形式のデータ, OpenSocial等のクライアント側APIが良く要求する形式なので特に定義
            _postDataとまとめても良かったが、無理してまとめる必要は無さそうなので別にした */
        this._keyValueData = undefined;
    };

    function __INITIALIZE(self){
        self._thread = ThreadManager.factoryClient('RPGMaterial.Request', true);
        self._thread.bind('stop', {self:self}, __ONSTOP);
        self._keyValueData = {};
    };

    /** リクエストを実行する, _付きをoverride */
    kls.prototype._execute = function(){
        // ここで定義すること, 3と4は必要ならで良い
        // 1.環境別の方法でリクエストを実行
        // 2.正常終了時に、結果を this._responseText や this._responseData へ格納し
        //   this._thread.complete() を実行
        // 3.異常終了時にも、this._thread.complete() を実行
        // 4.this._thread.isFinish() による条件分岐で、正常終了・異常終了処理を実行させない
        //   xhr.abort() のような中断機能のない環境の場合に、強制停止を確実に反映するため
        throw new Error('RPGMaterial:Request._execute, not implemented');
    };
    kls.prototype.execute = function(){
        this._thread.start();
        this._execute.apply(this, arguments);
        return this._thread.getDeferred();
    };

    /** 正常終了時に実行する, 必要なら_付きをoverride */
    kls.prototype._complete = function(){
    };
    kls.prototype.complete = function(){
        this._complete.apply(this, arguments);
        if (this._oncomplete !== null) this._oncomplete();
        this._isSuccess = true;
        this._thread.complete();
    };

    /** 異常終了時に実行する, 必要なら_付きをoverride */
    kls.prototype._fail = function(){
    };
    kls.prototype.fail = function(){
        var self = this;
        // ! setTimeoutしている理由:
        //   IEで存在しないURLへリクエストをした際に、_threadのdeferred.nextが動かなかった
        //   "存在するが不正なURL"の場合は動いたので、存在しないURLの場合は非同期処理にしてないっぽい
        //   それを強制的に非同期化するためにsetTimeoutで括った
        // ! ここに入った時点でアプリ続行は不可なので、多少遅延しても問題ない
        // ! 強制停止の場合は、一連の処理で呼び出すことがないと思われるので、この対応はしない
        setTimeout(function(){
            self._fail();
            if (self._onfail !== null) self._onfail();
            self._isSuccess = false;
            self._thread.complete();
        }, 1);
    };

    /** 強制停止時のハンドラ, 必要なら_stopをoverride */
    kls.prototype._stop = function(){
        // 例えば、環境別リクエスト中断処理を書く xhr.abort() 等
    };
    function __ONSTOP(evt){
        var self = evt.data.self;
        self._stop();
        if (self._onstop !== null) self._onstop();
    };

    // データ取得関連
    /** レスポンステキストを未加工で返す, 単なるアクセサ */
    kls.prototype.getResponseText = function(){
        return this._responseText;
    };
    /** レスポンスデータを返す, 単なるアクセサ */
    kls.prototype.getResponseData = function(){
        return this._responseData;
    };
    /** レスポンステキストをJSON解釈して返す
        ! JSONUtils.fromJSONを等を介してデータを厳しく判別しないのは
          手動管理データなどがNGになるため, もし厳しくしたいならオプションにする */
    kls.prototype.getResponseAsJson = function(){
        //! XP-IE7だとレスポンス内が構文エラーになってもcatchしない, 詳細未調査
        try {
            return eval('(' + this._responseText + ')');
        } catch (err) {
            //!! 開発用のエラーハンドラを使ってるので後で使う時に直す
            //   throw new Error でダメなら考える
            cls.catchError(err);
        };
    };
    /** 何かデータが有れば返す
        !! これ必要なのか不明、必要でも_responseDataと合わせてわかり難いので要対応 !! */
    kls.prototype.getData = function(){
        if (this._responseData !== null) return this._responseData;
        if (this._responseText !== null) return this._responseText;
        throw new Error('RPGMaterial.Request.getData, not get response data');
    };

    /** リクエストが正常終了したかを判定する
        特に定義したのは大抵はこれとこれ以外で処理が分かれるため */
    kls.prototype.isSuccess = function(){
        return this._thread.getState() === 'complete' && this._isSuccess;
    };

    /** スレッドを返す, 単なるアクセサ */
    kls.prototype.getThread = function(){
        return this._thread;
    };

    /** Key-Value形式で更新データを設定する, value は文字列のみ */
    kls.prototype.setKeyValue = function(key, value){
        if (typeof value !== 'string') {
            throw new Error('RPGMaterial.Request.setKeyValue, invalid parameter, value is string only');
        };
        this._keyValueData[key] = value;
    };

    /**
     * 生成関数
     *
     * @param url GETパラメータを付ける場合はここのURLに含めて付与する
     * @param options
     *   method: 'get' || 'post', 無効なサブクラスもある
     *   postData: obj, 無効なサブクラスもある
     *   oncomplete:
     *   onfail:
     *   onstop:
     */
    kls._factory = function(url, options){
        var opts = options || {};
        var obj =  new this();
        obj._url = url;
        if ('method' in opts) obj._method = opts.method;
        if ('postData' in opts) obj._postData = opts.postData;
        if ('oncomplete' in opts) obj._oncomplete = opts.oncomplete;
        if ('onfail' in opts) obj._onfail = opts.onfail;
        if ('onstop' in opts) obj._onstop = opts.onstop;
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();

/** 汎用外部リクエストクラス */
cls.$requests.GeneralRequest = (function(){
//{{{
    var kls = function(){
        this._method = 'get';
        /** $.ajax用dataTypeオプション, わかり難いけど返却時のデータ型指定に使われるだけでは無く
            'script' や 'jsonp' などのリクエスト方法の指定にも使われる
            当クラスに置いては、現在 'text' || 'script' のみ対応 */
        this._dataType = 'text';
    };
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        var ajaxOpts = {
            type: (this._method === 'post'? 'POST': 'GET'),
            url: this._url,
            cache: false,
            dataType: this._dataType,
            success: function(text){
                if (self._thread.isFinished()) return;
                self._responseText = text;
                self.complete();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                if (self._thread.isFinished()) return;
                self.fail();
            }//,
        };
        if (this._method === 'post' && this._postData !== null) {
            ajaxOpts.data = this._postData;
        };
        $.ajax(ajaxOpts);
    };

    /**
     * options+:
     *   dataType: 'text'(default) || 'script'
     */
    kls.factory = function(url, options){
        var opts = options || {};
        var obj = cls.Request._factory.apply(this, [url, opts]);
        if ('dataType' in opts) obj._dataType = opts.dataType;
        return obj;
    };

    return kls;
//}}}
})();

/** 自作Webストレージからのデータ取得リクエストクラス */
cls.$requests.EasyKVSFetchRequest = (function(){
//{{{
    var kls = function(){
        /** ダミーストレージ用ID */
        this._personId = undefined;
        /** 拡張, data.status == 'ng' の場合にエラーにしない
            アカウントの無いユーザの初回アクセスが"ng"になるため */
        this._allowNg = false;
    };
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        $.ajax({
            type: 'GET',
            url: this._url,
            cache: false,
            data: {
                __mode__: 'fetch',
                __person_id__: this._personId
            },
            dataType: 'jsonp',
            jsonp: '__jsonp__',
            success: function(data){
                if (self._thread.isFinished()) return;
                if (typeof data !== 'object' || (data.status !== 'ok' && !self._allowNg)) {
                    self._onngdata(data);
                };
                self._responseData = data;
                self.complete();
            },
            // JSONP形式でない場合も、JSONでない場合もこちらに入る
            error: function(XMLHttpRequest, textStatus, errorThrown){
                if (self._thread.isFinished()) return;
                self.fail();
            }//,
        });
    };

    /** データが"ng"の場合のハンドラ, 必要なら設定またはoverride */
    kls.prototype._onngdata = function(data){};

    /**
     * options+:
     *   allowNg:
     *   onngdata:
     */
    kls.factory = function(url, personId, options){
        var opts = options || {};
        var obj = cls.Request._factory.apply(this, [url, opts]);
        obj._personId = personId;
        if ('allowNg' in opts) obj._allowNg = opts.allowNg;
        if ('onngdata' in opts) obj._onngdata = opts.onngdata;
        return obj;
    };

    return kls;
//}}}
})();
/** 自作Webストレージへのデータ更新リクエストクラス */
cls.$requests.EasyKVSUpdateRequest = (function(){
//{{{
    var kls = function(){
        this._method = 'post';
        /** ダミーストレージ用ID */
        this._personId = undefined;
    };
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;

        this._postData = {
            __mode__: 'update',
            __person_id__: this._personId
        };
        $f.extend(this._postData, this._keyValueData);

        var ajaxOpts = {
            type: 'POST',
            url: this._url,
            cache: false,
            data: this._postData,
            dataType: 'json',
            success: function(data){
                if (self._thread.isFinished()) return;
                if (typeof data !== 'object' || data.status !== 'ok') {
                    self._onngdata(data);
                };
                self._responseData = data;
                self.complete();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                if (self._thread.isFinished()) return;
                self.fail();
            }//,
        };

        if (this._method === 'get') {
            ajaxOpts.type = 'GET';
            ajaxOpts.dataType = 'jsonp';
            ajaxOpts.jsonp = '__jsonp__';
        };

        $.ajax(ajaxOpts);
    };

    /** データが"ng"の場合のハンドラ, 必要なら設定またはoverride */
    kls.prototype._onngdata = function(data){};

    /**
     * options+:
     *   onngdata:
     */
    kls.factory = function(url, personId, options){
        var opts = options || {};
        var obj = cls.Request._factory.apply(this, [url, opts]);
        obj._personId = personId;
        if ('onngdata' in opts) obj._onngdata = opts.onngdata;
        return obj;
    };

    return kls;
//}}}
})();
/** 自作Webストレージのデータ削除リクエストクラス */
cls.$requests.EasyKVSRemoveRequest = (function(){
//{{{
    var kls = function(){
        this._method = 'post';
        /** ダミーストレージ用ID */
        this._personId = undefined;
    };
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        var ajaxOpts = {
            type: 'POST',
            url: this._url,
            cache: false,
            data: {
                __mode__: 'remove',
                __person_id__: this._personId
            },
            dataType: 'json',
            success: function(data){
                if (self._thread.isFinished()) return;
                if (typeof data !== 'object' || data.status !== 'ok') {
                    self._onngdata(data);
                };
                self._responseData = data;
                self.complete();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                if (self._thread.isFinished()) return;
                self.fail();
            }//,
        };

        if (this._method === 'get') {
            ajaxOpts.type = 'GET';
            ajaxOpts.dataType = 'jsonp';
            ajaxOpts.jsonp = '__jsonp__';
        };

        $.ajax(ajaxOpts);
    };

    /** データが"ng"の場合のハンドラ, 必要なら設定またはoverride */
    kls.prototype._onngdata = function(data){};

    /**
     * options+:
     *   onngdata:
     */
    kls.factory = function(url, personId, options){
        var opts = options || {};
        var obj = cls.Request._factory.apply(this, [url, opts]);
        obj._personId = personId;
        if ('onngdata' in opts) obj._onngdata = opts.onngdata;
        return obj;
    };

    return kls;
//}}}
})();

/** 汎用mixiアプリリクエストクラス */
cls.$requests.MixiappRequest = (function(){
//{{{
    var kls = function(){
        this._method = 'get';
    };
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;

        var hasPostData = $a.keys(this._postData).length > 0;
        var postData = $a.extend({}, this._postData);

        // メソッド
        // ! 送信データがあると自動でPOSTにする, 多分勝手にこうなるから(昔のものなので詳細失念)
        var method = gadgets.io.MethodType.GET;
        if (this._method === 'post' || hasPostData) method = gadgets.io.MethodType.POST;

        var params = {};
        params[gadgets.io.RequestParameters.METHOD] = method;
        params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.TEXT;
        //params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
        params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.NONE;
        //params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.SIGNED;

        // 送信データ
        // ! postDataが空の状態でPOST指定しても送信時にエラーになるので
        //   空データでPOSTする場合は { __dummy__:1 } を入れる
        if (this._method === 'post') {
            if (hasPostData === false) { postData['__dummy__'] = 1 };
            params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
        };

        gadgets.io.makeRequest(this._url, function(response) {
            if (response.rc === 200) {// 正常終了
                if (self._thread.isFinished()) return;
                self._responseText = response.data;
                self.complete();
            } else {// 異常終了
                if (self._thread.isFinished()) return;
                self.fail();
            };
        }, params);
    };

    kls.factory = cls.Request._factory;

    return kls;
//}}}
})();

/** mixiアプリ永続化APIからのデータ取得リクエストクラス */
cls.$requests.MixiappPersistenceAPIFetchRequest = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        var params = {};
        params[opensocial.IdSpec.Field.USER_ID] = opensocial.IdSpec.PersonId.VIEWER;
        var idSpec = opensocial.newIdSpec(params);
        var req = opensocial.newDataRequest();
        req.add(req.newFetchPersonAppDataRequest(idSpec, ['*']), 'response');
        req.send(function(data) {
            if (self._thread.isFinished()) return;
            if (data.hadError()) {// 何らかの理由により失敗
                self.fail();
                return;
            };
            var response = data.get('response').getData();
            //! わかり難いけどresponseは '<PersonId>':<その人のデータ> と複数入れる形になっている
            //  今回は、データが全くない場合は {} (つまりループせず) で、何かデータが入ると
            //  { '<ユーザ名>':{'<データキー>':'<JSONテキスト>'} } と二重構造のデータが返ってくる
            self._responseData = {};
            var personId;
            for (personId in response) {
                self._responseData = response[personId];
            };
            self.complete();
        });
    };

    kls.factory = cls.Request._factory;

    return kls;
//}}}
})();
/** mixiアプリ永続化APIへのデータ更新リクエストクラス */
cls.$requests.MixiappPersistenceAPIUpdateRequest = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        var req = opensocial.newDataRequest();
        $a.each(this._keyValueData, function(k, v){
            req.add(
                req.newUpdatePersonAppDataRequest(opensocial.IdSpec.PersonId.VIEWER ,k , v),
                'response'
            );
        });
        req.send(function(data) {
            if (self._thread.isFinished()) return;
            if (data.hadError()) {
                self.fail();
                return;
            };
            var response = data.get('response');
            if (response.hadError()) {
                self.fail();
                return;
            };
            self.complete();
        });
    };

    kls.factory = cls.Request._factory;

    return kls;
//}}}
})();
/** mixiアプリ永続化APIのデータ削除リクエストクラス */
cls.$requests.MixiappPersistenceAPIRemoveRequest = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Request());

    kls.prototype._execute = function(){
        var self = this;
        var req = opensocial.newDataRequest();
        req.add(req.newRemovePersonAppDataRequest(
            opensocial.IdSpec.PersonId.VIEWER, ['*']), 'response');
        req.send(function(data) {
            if (self._thread.isFinished()) return;
            if (data.hadError()) {
                self.fail();
                return;
            };
            var response = data.get('response');
            if (response.hadError()) {
                self.fail();
                return;
            };
            self.complete();
        });
    };

    kls.factory = cls.Request._factory;

    return kls;
//}}}
})();


/** 抽象基底ブロッククラス */
cls.Block = (function(){
//{{{
    var kls = function(){

        /** オブジェクトID, 1からの連番で生成毎に加算 */
        this.__objectId__ = undefined;

        /** オブジェクト表示名, toString用 */
        this.__objectLabel__ = 'Block';

        /** 描画エンジン, 現在は必ずjQueryオブジェクト */
        this.__view__ = undefined;

        /** 表示関係データ, これらは外部と関係するのでデータにする必要がある */
        this.__isShown__ = false;
        this.__isAbsolutePosition__ = true; // 絶対配置フラグ
        this.__top__ = 0;
        this.__left__ = 0;
        this.__width__ = undefined;
        this.__height__ = undefined;
        this.__zIndex__ = 0;

        /** その他のスタイルデータ */
        this.__styleData__ = undefined;

        /** 親子関係, アクセサは基本的に持たないし、jQueryのような検索機能も持たない
            それらは、Blockを中で呼んでいる末端クラス側の仕事になる
            ここでは削除時や座標計算時の自動処理に必要になるだけ */
        this.__parentBlock__ = null;
        this.__childrenBlocks__ = undefined;// {<objectId>:インスタンス, ...}

        /** draw/show/hide等の描画処理を連鎖オプションで呼ばれた場合反映するか
            trueにした場合、自分と自分の子供は描画しなくなる, 直接コールすれば描画可能
            性能対策とブロックの意味をはっきりさせる設計的な面から作った
            使い方:
            1. 初期化処理以降変更の無い飾りのブロックにfalse指定, 初期化処理内で描画も済ます
            2. 描画処理に外部リクエストが含まれたり超重いものなどへも指定
               更新については、手動で呼んでもらうような仕組みを作る */
        this.__isUnchainedDrawing__ = false;

        /** 自動的に描画連鎖するブロックIDリストを設定する
            - クラス別ルートブロックのdrawメソッド(引数無し)で必要な部分を正しく更新するため
              _draw内で連携しようと思ったが、自分単体のみを更新する手段がなくなるからNG
            - 直接の子以外は登録不可
            - インスタンス直参照ではなくIDなのは、子が削除された場合に同期しないで良いように
            - __isUnchainedDrawing__はdraw(true)の時の設定なので、これとは無関係 */
        this.__drawingChainedBlockIds__ = undefined;

        /** カバー用ビューの格納場所 */
        this.__coverViews__ = undefined;
        /** 枠線用ビュー */
        this.__closingLineView__ = null;
    };

    var ZINDEX_BACKGROUND_CHIP_VIEW = -1;
    var CURRENT_OBJECT_ID = 0;

    function __INITIALIZE(self){

        self.__styleData__ = {};
        self.__childrenBlocks__ = {};
        self.__drawingChainedBlockIds__ = [];
        self.__coverViews__ = {};

        // 初期スタイル反映
        self.__view__ = $('<div />').css(cls.Style.get('block'))
            .addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'block');
        // 生成直後は隠す
        self.hide(false);
    };

    kls.prototype.toString = function(){
        // ex) 'block{1}32x32'
        return this.__objectLabel__ + '{' + this.__objectId__.toString() + '}' + this.getSize().join('x')
    };

    /** 描画する／表示する／描画かつ表示する／隠す
        @param chain true=全ての子のdrawも連鎖する、但し__isUnchainedDrawing__=trueの子は呼ばない
                     false=自分のみ
                     null(default)=__drawingChainedBlockIds__にて明示指定した子のみ連鎖する */
    kls.prototype.draw = function(chain){
        __DRAW_OR_SHOW_OR_HIDE(this, 'draw', chain);
    };
    kls.prototype.show = function(chain){
        __DRAW_OR_SHOW_OR_HIDE(this, 'show', chain);
    };
    kls.prototype.drawAndShow = function(chain){
        this.draw(chain);
        this.show(chain);
    };
    kls.prototype.hide = function(chain){
        __DRAW_OR_SHOW_OR_HIDE(this, 'hide', chain);
    };
    /** 表示／非表示を判定する */
    kls.prototype.isShown = function(){ return this.__isShown__ };
    kls.prototype.isHidden = function(){ return !this.__isShown__ };

    /** 描画処理本体, 必要ならサブクラスでoverride */
    kls.prototype._draw = function(){
        var self = this;

        var styles = {
            top: this.__top__,
            left: this.__left__,
            width: this.__width__,
            height: this.__height__,
            zIndex: this.__zIndex__
        };

        if (this.__isAbsolutePosition__) {
            $f.extend(styles, cls.Style.get('block_absolute'));
        } else {
            $f.extend(styles, cls.Style.get('block_relative'));
        };

        $f.extend(styles, this.__styleData__);

        this.__view__.css(styles);
    };

    /** 連鎖設定を考慮して描画関係のメソッドを実行する
        methodType = 'draw'||'show'||'hide' */
    function __DRAW_OR_SHOW_OR_HIDE(self, methodType, chain){
        var methodName = methodType;
        var forMeMethod; // 自分を更新するルーチン
        if (methodType === 'draw') {
            forMeMethod = function(){
                self._draw();
            };
        } else if (methodType === 'show') {
            forMeMethod = function(){
                self.__view__.show();
                self.__isShown__ = true;
            };
        } else if (methodType === 'hide') {
            forMeMethod = function(){
                self.__view__.hide();
                self.__isShown__ = false;
            };
        } else {
            throw new Error('RPGMaterial:Block.__DRAW_OR_SHOW_OR_HIDE, invalid parameter, methodType=`' + methodType + '`');
        };
        // 連鎖設定を考慮して描画する
        if (typeof chain !== 'boolean') chain = null;
        if (chain === true) {// 禁止を除く全ての子ども
            self.eachChildren(function(child){
                if (child.__isUnchainedDrawing__ === false) child[methodName](chain);
            });
        } else if (chain === false) {// 自分だけ
            /* pass */
        } else {// 明示連鎖設定をしたものだけ
            $f.each(__GET_DRAWING_CHAINE_BLOCKS(self), function(nouse, child){
                child[methodName](chain);
            });
        };
        forMeMethod(); // 自分を更新
    };

    kls.prototype.setUnchainedDrawing = function(value){
        this.__isUnchainedDrawing__ = value;
    };

    /** 描画連鎖対象となるブロックを追加する */
    kls.prototype.chainDrawing = function(blockOrBlockId){
        var blockId;
        if (blockOrBlockId instanceof cls.Block) {
            blockId = blockOrBlockId.getBlockId();
        } else {
            blockId = blockOrBlockId;
        };
        if ($f.inArray(blockId.toString(), $f.keys(this.__childrenBlocks__)) === false) {
            throw new Error('RPGMaterial:Block.chainDrawing, invalid parameter, not my child');
        };
        if ($f.inArray(blockId, this.__drawingChainedBlockIds__)) {
            throw new Error('RPGMaterial:Block.chainDrawing, invalid situation, already added');
        };
        this.__drawingChainedBlockIds__.push(blockId);
    };
    kls.prototype.removeDrawingChainedBlockId = function(blockId){
        var idx = $f.indexOf(blockId, this.__drawingChainedBlockIds__);
        if (idx === -1) {
            throw new Error('RPGMaterial:Block.removeDrawingChainedBlockId, invalid parameter');
        };
        this.__drawingChainedBlockIds__.splice(idx, 1);
    };
    function __GET_DRAWING_CHAINE_BLOCKS(self){
        var blocks = [];
        $f.each(self.__drawingChainedBlockIds__, function(nouse, blockId){
            if (blockId in self.__childrenBlocks__) blocks.push(self.__childrenBlocks__[blockId]);
        });
        return blocks;
    };

    /** 子を追加する */
    kls.prototype.append = function(block){
        if (block instanceof cls.Block === false) {
            throw new Error('RPGMaterial:Block.append, not Block instance block=' + block);
        };
        if (block.isRoot() === false) {
            throw new Error('RPGMaterial:Block.append, already appended block=' + block + ' to ' + this);
        };
        this.__childrenBlocks__[block.__objectId__] = block;
        block.__parentBlock__ = this;
        this.__view__.append(block.__view__);
    };

    /** 自身を除去する, 必要なら_付きをoverride
        @param recursive true(default)=子との関係も削除
                         false=子との親子関係は残す,jQuery.removeはこの挙動
        配置から除去されただけでデータは無くならない、再配置可能
        ただし、jQuery.removeによるイベントハンドラやキャッシュ消去は現状行われる */
    kls.prototype._remove = function(){
    };
    kls.prototype.remove = function(recursive){
        if (recursive === undefined) recursive = true;
        // 子から自分、自分の情報から関係情報、描画エンジン情報からその他情報、の順で削除する
        if (recursive === true) {
            this.eachChildren(function(child){ child.remove() });
        };
        this.__view__.remove();
        this._remove();
        if (this.isRoot() === false) {
            if (this.__objectId__ in this.__parentBlock__.__childrenBlocks__ === false) {// ここが壊れてると問題なので一応ハンドリング
                throw new Error('RPGMaterial:Block.remove, invalid situation');
            };
            delete this.__parentBlock__.__childrenBlocks__[this.__objectId__];
            this.__parentBlock__ = null;
        };
    };

    /** 自身は削除せず全ての子を削除する */
    kls.prototype.empty = function(recursive){
        this.eachChildren(function(child){ child.remove(recursive) });
    };

    /** ビューを複製して返して自身は削除する, イベントは削除される
        削除するのは、ビューになって一人歩きした時に当クラスオブジェクトがゴミとして残るのが怖いから */
    kls.prototype.rebornToView = function(){
        var view = this.__view__.clone(); // ちなみに clone(true) でイベントもコピーするらしい
        this.remove();
        return view;
    };

    /** ビューを返す, 単なるアクセサ */
    kls.prototype.getView = function(){
        return this.__view__;
    };

    /** スタイル情報を即座に変更する, 制約を持たせたjQuery.cssのフック
        色や画像による背景設定もこちらで行う

        特殊解釈キー:
        bg: 背景色を Style.getSpecialColor を通して設定する
            backgroundColor/opacityを同時に指定した場合の上書き順序は未対応
        */
    kls.prototype.style = function(rawStyleData, applyingNow){
        if (applyingNow === undefined || applyingNow === null) applyingNow = true;
        var self = this;
        var invalidKeys = ['position', 'top', 'left', 'width', 'height', 'zIndex', 'z-index'];
        if (
            typeof rawStyleData === 'string' || // 辞書型のみ
            $f.collect($f.keys(rawStyleData), function(nouse, k){
                if ($f.inArray(k, invalidKeys)) return k;
            }).length > 0 // 他メソッドでの更新必須
        ) {
            throw new Error('RPGMaterial:Block.style, invalid style data=' + rawStyleData);
        };
        // ショートカット処理解析
        var styleData = {};
        $f.each(rawStyleData, function(k, v){
            if (k === 'bg') {
                $f.extend(styleData, cls.Style.getSpecialColor(v));
            } else if (k === 'img') {
                //! backgroundImage だと none が不正指定になる
                //  特にChromeだと./none宛てに毎度リクエストをするので注意
                if (v === 'none') {
                    styleData.background = 'none';
                } else {
                    styleData.background = 'url(' + v + ')';
                };
            } else {
                styleData[k] = v;
            };
        });
        // 反映＆変数保持
        if (applyingNow) { this.__view__.css(styleData) };
        $f.extend(this.__styleData__, styleData);
    };

    /** テキストを書く
        textType 'plain'(default)=未加工 || 'nl2br'=改行文字を改行タグへ変換 */
    kls.prototype.text = function(text, textType){
        textType = textType || 'plain';
        if (textType === 'plain') {
            this.__view__.text(text);
        } else if (textType === 'nl2br') {
            this.__view__.html($f.nl2br($f.escapeHTML(text)));
        };
    };

    /** 右クリックによるコンテキストメニュー表示を抑止する */
    kls.prototype.bindDisablingContextmenu = function(){
        this.__view__.bind('contextmenu', function(){ return false });
    };

    /** 自身を複製する
        - 可能なクラスのみ_cloneをoverrideする
        - jQuery情報を参照しないこと
        - drawとshowは必ずしてない状態になる, jQuery情報に頼らず生成できる範囲にするため
        - _cloneData は引数に複製オブジェクトを取り拡張する関数, 基底クラスは必ず実装する
        - 複製オブジェクトを生成するまでの処理は_clone内で各末端クラス別にベタ実装する
        - 生成部分も含めた完全共通化は 1)生成関数名が共通でない
          2)生成時の引数に必須なデータを複製元から取得する必要がある という点から無理 */
    kls.prototype._clone = function(){
        throw new Error('RPGMaterial:Block._clone, not implemented');
    };
    kls.prototype.clone = function(){
        return this._clone();
    };
    kls.prototype._cloneData = function(newObj){
        // sizeとposを含まないのは_factoryにそれらが必要だから
        newObj.toRelativePosition(this.isRelativePosition());
        newObj.setZIndex(this.__zIndex__);
        newObj.style(this.__styleData__);
    };

    /** ブロックIDの外部用アクセサ, 内部は直接参照OK */
    kls.prototype.getBlockId = function(){
        return this.__objectId__;
    };

    /** 絶対配置フラグの外部用アクセサ, 内部は直接参照・更新OK */
    kls.prototype.isRelativePosition = function(){
        return !this.__isAbsolutePosition__;
    };
    kls.prototype.toRelativePosition = function(value){
        value = (value !== undefined)? !value: false;
        this.__isAbsolutePosition__ = value;
    };

    /** 位置を変える, 引数は配列で num || str=相対位置,親が必要 || null=変更しない */
    kls.prototype.pos = function(pos){
        if (// 経験上誤った値を入れがちなのでハンドリングしとく
            pos instanceof Array === false ||
            pos.length < 2 ||
            pos[0] !== null && typeof pos[0] !== 'number' && typeof pos[0] !== 'string' ||
            pos[1] !== null && typeof pos[1] !== 'number' && typeof pos[1] !== 'string'
        ) {
            throw new Error('RPGMaterial:Block.pos, invalid pos=' + pos);
        };
        if ((typeof pos[0] === 'string' || typeof pos[1] === 'string') && this.isRoot()) {
            throw new Error('RPGMaterial:Block.pos, relative position need a parent block');
        };
        if (typeof pos[0] === 'number') {
            this.__top__ = pos[0];
        } else if (typeof pos[0] === 'string') {
            this.__top__ = kls.getRelativeTopByKey(pos[0], this.__height__, this.__parentBlock__.getHeight());
        };
        if (typeof pos[1] === 'number') {
            this.__left__ = pos[1];
        } else if (typeof pos[1] === 'string') {
            this.__left__ = kls.getRelativeLeftByKey(pos[1], this.__width__, this.__parentBlock__.getWidth());
        };
    };

    /** 差分指定で位置を変える, pos [<top>, <left>] */
    kls.prototype.move = function(pos){
        this.pos([
            this.__top__ + pos[0],
            this.__left__ + pos[1]
        ]);
    };

    /** サイズを設定する, [<width||null>, <height||null>] */
    kls.prototype.size = function(size){
        if (size instanceof Array === false && size.length !== 2) {
            throw new Error('RPGMaterial:Block.size, invalid size=' + size);
        };
        if (size[0] !== null) this.__width__ = size[0];
        if (size[1] !== null) this.__height__ = size[1];
    };

    /** 高さを設定する／描画も行う */
    kls.prototype.setZIndex = function(value){
        this.__zIndex__ = value;
    };
    kls.prototype.drawSettingZIndex = function(/* args passing */){
        this.setZIndex.apply(this, arguments);
        this.__view__.css({zIndex: this.__zIndex__});
    };

    /** 位置／大きさ／高さを返す */
    kls.prototype.getPos = function(){ return [this.__top__, this.__left__] };
    kls.prototype.getTop = function(){ return this.__top__ };
    kls.prototype.getLeft = function(){ return this.__left__ };
    kls.prototype.getSize = function(){ return [this.__width__, this.__height__] };
    kls.prototype.getWidth = function(){ return this.__width__ };
    kls.prototype.getHeight = function(){ return this.__height__ };
    kls.prototype.getZIndex = function(){ return this.__zIndex__ };

    /** 先祖に属する指定ブロック内での表示上の位置を取得する */
    kls.prototype.getPosIn = function(block){
        var isAcestor = false;
        var pos = this.getPos();
        this.eachParents(function(par){
            if (block === par) {
                isAcestor = true;
                return false;
            } else {
                pos[0] += par.getPos()[0];
                pos[1] += par.getPos()[1];
            };
        });
        if (isAcestor === false) {
            throw new Error('RPGMaterial:Block.getPosIn, not acestor block=' + block);
        };
        return pos;
    };

    /** 指定ブロック内へ配置した場合の位置を、それとは別のブロックへ所属した場合の位置で返す
        指定ブロックは所属ブロックの子である必要がある
        - わかり難いけど「表示上Aブロックの上に重ねたいけどAには追加できない場合」に使う
        - また、ブロックを追加前に位置を取得するのにも使える
        @param targetBlock    指定ブロック
        @param innerPos       指定ブロック内での位置, キーによる相対指定可能
        @param belongingBlock 所属ブロック */
    kls.prototype.getPosOver = function(targetBlock, innerPos, belongingBlock){
        if (innerPos === undefined || innerPos === null) innerPos = [0, 0];
        if (belongingBlock === undefined) belongingBlock = this.__parentBlock__;
        if (belongingBlock === null) {
            throw new Error('RPGMaterial:Block.getPosOver, none parent or belonging block');
        };
        var targetPos = targetBlock.getPosIn(belongingBlock);
        var innerTop = innerPos[0];
        if (typeof innerTop === 'string') {
            innerTop = kls.getRelativeTopByKey(innerTop, this.__height__, targetBlock.getHeight());
        };
        var innerLeft = innerPos[1];
        if (typeof innerLeft === 'string') {
            innerLeft = kls.getRelativeLeftByKey(innerLeft, this.__width__, targetBlock.getWidth());
        };
        return [
            targetPos[0] + innerTop,
            targetPos[1] + innerLeft
        ];
    };

    /** イベントを付ける, jQuery.bindのラッパ, とりあえず定義して通すだけ通している */
    kls.prototype.bindEvent = function(eventType, data, callback){
        var browser = $f.getBrowser();
        var isTouchable = $f.inArray(browser, ['iphone', 'ipad', 'android']);
        if (eventType === 'touch' && isTouchable) {
            eventType = 'touchstart';
        } else {
            eventType = 'mousedown';
        };
        this.__view__.bind(eventType, data, callback);
    };

    /** ブロックをアニメーションする／止める
        - ほぼjQuery.animateのラッパーだが top/left など必要な情報を同期する処理と
          変更不可なパラメータはエラーにする処理を加えた
        - stepオプション内で受け取れる値に制限は掛けてないが、マルチ環境対応を考えて
          出来る限り使わないこと！
        - 準拠仕様) http://semooh.jp/jquery/api/effects/animate/params%2C+options/
        - 現在、同期は完了時のみだが 必要なら終了時同期やstepによる完全同期オプションを付与する
        - Threadと同期する対応も入れたいが animate.stop のコールバックが無く complete も通らないので面倒
          かつ queueというアニメーションをスタックできる仕組みもあるので要調査, 手間的に後回し
          ただ、stopのラッパーだけはメモ的に残す
        - いっそキュー禁止＆単一アニメーションしか出来ないようにしちゃった方がいいかも
          jQueryがやってるようなアニメーション連鎖や、複数の独立アニメーション並列実行による
          ダッシュ＋剣を振る＝ダッシュ斬り のような表現は出来た方がいいけど
          連鎖や合成という機能をAnimation側に持つことは可能でそっちの方がいい気がする
          あくまでも簡易アニメーション用としてのBlock.animateにした方が良さげ
        - hwh-v0.1に自作animateがあるので完全自作するならそちら参照 */
    kls.prototype.animate = function(params, options){
        var self = this;
        var opts = options || {};
        //! とりあえずサイズ変更は禁止する
        //  Chipなどの一部のサブクラスや背景にChipを入れた場合などは変更できない
        //  素ブロックは可能なのでOKにする場合は resize メソッドを作ってダメなクラスは各自override
        if ('width' in params || 'height' in params) {
            throw new Error('RPGMaterial:Block.animate, sorry, not animatable width and height attrs, now');
        };
        // 完了時座標同期処理を加える
        // もし別途渡すならその中で同期すること
        var top, left;
        if ('complete' in opts === false) {
            top = ('top' in params)? params.top: null;
            left = ('left' in params)? params.left: null;
            opts.complete = function(){
                self.pos([top, left]);
            };
        };
        this.__view__.animate(params, opts);
    };
    kls.prototype.stop = function(){
        // trueは全キューを止める設定, これを指定しないと非同期処理が複雑になり過ぎる
        this.__view__.stop(true);
    };

    /** フェードイン/フェードアウトする
        良く使うので特に定義した, 引数はjQueryに準拠, IE対策を自動で入れている
        ref) http://semooh.jp/jquery/api/effects/fadeIn/%5Bspeed%5D%2C+%5Bcallback%5D/ */
    var __FADE_SPEED_MAP = {'fast':200, 'default_':400, 'slow':600};
    var __FADE_BLOCK = function(self, isFadingIn, speed, callback){
        speed = speed || 'default_';
        var duration = (typeof speed === 'number')? speed: __FADE_SPEED_MAP[speed];
        if (duration === undefined) {// 文字列ミス対策
            throw new Error('RPGMaterial:Block.animate, invalid parameter');
        };

        callback = callback || function(){}
        var complete = function(){
            // フェードアウトは最後に非表示にする
            if (isFadingIn === false) self.hide();
            // IE対策付与 ..と思ったんだがしなくても最後にカクカクが消えてくれる
            // jQueryがやってくれてんのかと思ってソースを見たけどわからなかった, 一旦しない
            //cls.Style.removeIEOpacityCurse(self.__view__);
            callback();
        };

        // フェードインは最初に0.0にして表示状態にする
        if (isFadingIn) {
            self.__view__.css({opacity:0.0});
            self.show();
        };

        self.animate({
            opacity: (isFadingIn)? 1.0: 0.0
        }, {
            easing: 'linear',
            duration: duration,
            complete: complete
        });
    };
    kls.prototype.fadeIn = function(speed, callback){
        __FADE_BLOCK(this, true, speed, callback);
    };
    kls.prototype.fadeOut = function(speed, callback){
        __FADE_BLOCK(this, false, speed, callback);
    };

    /** ブロック内の最上面をビューでカバーする, 操作抑止等に使う
        @param key str=フィルタ管理用キー、重複指定した場合はエラーにせず何もしない
                   null(default)=''をキーに指定
               color str=カラーキー, デフォルト無色
               opacity float=0.0-1.0, デフォルト変更しない*/
    kls.prototype.drawCover = function(key, color, opacity){
        if (key === null || key === undefined) key = '';
        if (key in this.__coverViews__) return;
        if (color === undefined) color = 'transparent';
        var styles = cls.Style.get('block_cover');
        styles.width = this.getSize()[0];
        styles.height = this.getSize()[1];
        $f.extend(styles, cls.Style.getSpecialColor(color, opacity));
        this.__coverViews__[key] = $('<div />').css(styles).appendTo(this.getView());
    };
    /** 上記カバーを削除する／全て削除する */
    kls.prototype.clearCover = function(key){
        if (key === null || key === undefined) key = '';
        if (key in this.__coverViews__ === false) return; // こちらもエラーにはならない
        this.__coverViews__[key].remove();
        delete this.__coverViews__[key];
    };
    kls.prototype.clearAllCovers = function(){
        var self = this;
        $f.each(this.__coverViews__, function(k, nouse){ self.clearCover(k) });
    };

    /** 枠線を表示する
        options:
            color: カラーキー
            opacity: num || null=未指定
            borderWidth: num
            borderStyle: 'solid' || 'dashed'
            cursor: 'pointer' || 'default', ポインタ付き要素に使う場合は'pointer'を指定する */
    kls.prototype.drawClosingLine = function(options){
        var opts = options || {};
        var color = ('color' in opts)? opts.color: '#FFCC00';
        var opacity = ('opacity' in opts)? opts.opacity: null;
        var borderWidth = ('borderWidth' in opts)? opts.borderWidth: 2;
        var borderStyle = ('borderStyle' in opts)? opts.borderStyle: 'solid';
        var cursor = ('cursor' in opts)? opts.cursor: 'default';

        var styles = cls.Style.get('block_closingline');
        styles.width = $f.withinNum(this.getWidth() - borderWidth * 2, 1);// 1 は負の値時のエラー回避
        styles.height = $f.withinNum(this.getHeight() - borderWidth * 2, 1);
        styles.borderWidth = borderWidth;
        styles.borderStyle = borderStyle;
        styles.cursor = cursor;
        var colorStyles = cls.Style.getSpecialColor(color, opacity);
        styles.borderColor = colorStyles.backgroundColor;
        if ('opacity' in colorStyles) styles.opacity = colorStyles.opacity;
        if (this.__closingLineView__ !== null) this.clearClosingLine();
        this.__closingLineView__ = $('<div />').css(styles).appendTo(this.getView());
    };
    /** 枠線を削除する */
    kls.prototype.clearClosingLine = function(){
        if (this.__closingLineView__ !== null) {
            this.__closingLineView__.remove();
            this.__closingLineView__ = null;
        };
    };

    /** 親を返す, 単なるアクセサ */
    kls.prototype.getParentBlock = function(){
        return this.__parentBlock__;
    };

    /** 自身がルートブロックかを判定する */
    kls.prototype.isRoot = function(){
        return this.__parentBlock__ === null;
    };

    /** それぞれの子に対して処理を行う */
    kls.prototype.eachChildren = function(callback){
        var self = this;
        $f.each(this.__childrenBlocks__, function(nouse, child){
            return callback(child);
        });
    };

    /** 親を遡ってそれぞれに処理を行う, 近い親の順に実行 */
    kls.prototype.eachParents = function(callback){
        var self = this;
        var parents = [];
        var cur = this;
        while (cur.isRoot() === false) {
            parents.push(cur.__parentBlock__);
            cur = cur.__parentBlock__;
        };
        $f.each(parents, function(nouse, parent_){
            return callback(parent_);
        });
    };


    /** キーによる各相対位置を計算して返す, @return num || Error */
    kls.getRelativeTopByKey = function(key, childHeight, parentHeight){
        var rates = { top:0.0, centertop:0.25, center:0.5, centerbottom:0.75, bottom:1.0 };
        if (key in rates === false) {
            throw new Error('RPGMaterial:Block.getRelativeTop, not defined key=' + key);
        };
        return (parentHeight - childHeight) * rates[key];
    };
    kls.getRelativeLeftByKey = function(key, childWidth, parentWidth){
        var rates = { left:0.0, centerleft:0.25, center:0.5, centerright:0.75, right:1.0 };
        if (key in rates === false) {
            throw new Error('RPGMaterial:Block.getRelativeLeftByKey, not defined key=' + key);
        };
        return (parentWidth - childWidth) * rates[key];
    };

    /** @param pos 配置場所, null(default)=[0, 0] */
    kls._factory = function(size, pos){
        if (size === undefined) size = [1, 1]; // 後でサイズ調整する場合を想定
        if (pos === undefined) pos = null;
        var obj = new this();
        obj.__objectId__ = (CURRENT_OBJECT_ID += 1);
        if (pos instanceof Array) {
            obj.__top__ = pos[0];
            obj.__left__ = pos[1];
        };
        obj.__width__ = size[0];
        obj.__height__ = size[1];
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();

/** 開閉機能付与ブロックMixinクラス */
cls.OpenAndCloseBlockMixin = (function(){
//{{{
    //
    // 必須手動設定:
    // _initializeOpenAndCloseBlockMixin
    //
    var kls = function(){
        /** 閉めた時に同期するDeferredオブジェクト */
        this._deferredClosing = undefined;
    };

    kls.prototype._initializeOpenAndCloseBlockMixin = function(){
        this._deferredClosing = new Deferred();
    };

    /** 開く, 必要なら_付きをoverride */
    kls.prototype._open = function(){
    };
    kls.prototype._afterOpen = function(){
        this.draw();
        this.show();
    };
    kls.prototype.open = function(){
        this._open.apply(this, arguments);
        this._afterOpen.apply(this, arguments);
        return this._deferredClosing;
    };

    /** 閉じる, 必要なら_付きをoverride */
    kls.prototype._close = function(){
    };
    kls.prototype._afterClose = function(){
        this.hide(false);
        this.remove();
    };
    kls.prototype.close = function(){
        this._close.apply(this, arguments);
        this._afterClose.apply(this, arguments);
        this._deferredClosing.call();
    };

    kls.prototype.getDeferredClosing = function(){
        return this._deferredClosing;
    };

    return kls;
//}}}
})();

/** 単純なブロッククラス */
cls.$blocks.PlainBlock = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Block());
    kls.prototype.clone = function(){
        var obj = kls.factory(this.getSize(), this.getPos());
        this._cloneData(obj);
        return obj;
    };
    kls.factory = cls.Block._factory;
    return kls;
//}}}
})();

/** テキストブロッククラス */
cls.$blocks.TextBlock = (function(){
//{{{
    var kls = function(){
        /** テキスト本文, 現在は常に改行文字区切りで改行になる */
        this._text = '';
        /** テキスト描画先ブロック, 今はpaddingがある場合のみ生成される */
        this._textBlock = null;
        /** 行幅 */
        this._lineHeight = 18;
        /** パディング幅, CSSと異なりサイズには加算はされずにその分内部が縮小される */
        this._padding = 0;
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.clone = function(){
        var obj = kls.factory(this.getSize(), this.getPos());
        this._cloneData(obj);
        return obj;
    };
    kls.prototype._cloneData = function(newObj){
        cls.Block.prototype._cloneData.apply(this, arguments);
        newObj.setText(this._text);
        newObj.setLineHeight(this._lineHeight);
        newObj.setPadding(this._padding);
    };

    kls.prototype._draw = function(){
        cls.Block.prototype._draw.apply(this);
        // パティングがある場合は内部へブロックを追加
        if (this._textBlock === null && this._padding > 0) {
            this._textBlock = cls.$blocks.PlainBlock.factory();
            this.append(this._textBlock);
            this._textBlock.show();
        };
        this.drawText();
    };

    /** テキストを描画する */
    kls.prototype.drawText = function(newText){
        if (newText !== undefined && newText !== null) this.setText(newText);
        // 行幅設定
        this.style({ lineHeight:this._lineHeight+'px' });
        // テキスト記述
        if (this._textBlock === null) {
            this.text(this._text, 'nl2br');
        } else {
            this._textBlock.size([
                this.getWidth() - this._padding * 2,
                this.getHeight() - this._padding * 2//
            ]);
            this._textBlock.pos([this._padding, this._padding]);
            this._textBlock.draw();
            this._textBlock.text(this._text, 'nl2br');
        };
    };

    /** テキスト行数に合わせて縦幅を調整する */
    kls.prototype.adjustHeight = function(){
        var lineCount = this._lineCount || $f.normalizeNewLineCharacters(this._text).split('\n').length;
        this.size([null, lineCount * this._lineHeight + this._padding * 2]);
    };

    // 単なるセッター群
    kls.prototype.setText = function(value){ this._text = value };
    kls.prototype.setLineHeight = function(value){ this._lineHeight = value };
    kls.prototype.setPadding = function(value){ this._padding = value };

    // 生成メソッド群
    kls._factory = function(size, pos){// サイズをadjustHeightで合わせる場合は単に指定無しで生成する
        var obj = cls.Block._factory.apply(this, [size, pos]);
        obj.getView().addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'textblock');
        return obj;
    };
    /** 通常汎用生成メソッド */
    kls.factory = kls._factory;
    /** 最もありがちな初期化ルーチンをまとめたショートカット生成メソッド */
    kls.factoryFast = function(width, text, pos) {
        var obj = this._factory([width, 1], pos);
        obj.setText(text);
        obj.adjustHeight();
        return obj;
    };

    return kls;
//}}}
})();

/** メッセージブロッククラス */
cls.$blocks.MessageBlock = (function(){
//{{{

    //
    // [要件]
    // JRPG会話風     = 1段落毎に削除, 1段落は表示に収まるように運営側で調整
    // ログビューア風 = 段落を上に積み重ねて表示できる
    //                  1段落を1行で自動改行しない文字数にして渡すことでログやテロップ風になる
    //                  表示から消えた部分はoverflow:hidden;で消えている
    // コンソール風   = 表示が一杯になったら次の行に入る前にビュー全体を上にずらして切れないようにする
    // (未実装)         自動改行を含めた行数を取得する必要があり、かつ自然に見せようとすると
    //                  自動改行時に行を調整しないといけないので、自動改行イベントハンドラが必要になる
    //                  ついでで出来る範囲を超えてるので保留, 不自然に大変なのはなんでだろうか
    //                  もしかして、float使えば簡単にできるとか、見落としあるかも
    //

    var kls = function(){

        this.__objectLabel__ = 'MessageBlock';

        /** 1行の最大文字数, 半角計算, この文字数に達すると自動改行する
            この文字数内は表示切れを起こさないようにすること */
        this._messageLineLength = undefined;
        //! 今は必ず自動改行, 無し設定を止めたのは、HTML自動改行を抑止するために文ビューを
        //  枠より広くする対応が必要になるが、それが混乱しそうだから
        //  必要になったらとりあえずは文字を落とす方法を検討する
        //this._messageAutoReturn = true;

        /** 全角文字幅と文字間隔 */
        this._messageFontSize = undefined;
        this._messageLetterSpacing = undefined;

        /** 一度に表示可能な最大行数とその幅 */
        this._messageLineCount = undefined;
        this._messageLineHeight = undefined;

        /**
         * 段落リスト
         * [{
         *     // \nで改行, 改行文字の混在は直前に正規化, 末尾が改行文字の場合は削除
         *     rawText: '<RichTextインスタンス>',
         *     // 対応するビュー, jq || null=削除した場合
         *     view: <jqObj>,
         *     // 段落開始時のイベントハンドラ, スコープは当クラスで実行される
         *     onstart: function(){},
         *     // 段落終了時のイベントハンドラ, スコープは当クラスで実行される
         *     onfinish: function(){},
         *     // 当段落限りの出力モード
         *     outputtingMode: 'sentence',
         * }, ...]
         *
         * onstart/onfinish は、段落終了時の「進む」ボタンON/OFFで使うことを想定している
         */
        this._paragraphs = undefined;
        this._currentParagraphIndex = -1;// -1=未開始 || 0以上の整数=現在出力中の要素番号
        this._isOutputting = false; // true=出力中 || false=非出力中

        /** 出力モード
            'character'=1文字送り || 'sentence'=1文送り || 'paragraph'=1段落送り */
        this._outputtingMode = 'character';
        this._currentOutputtingMode = null; // 一時的にここへコピーして使用, 出力中にモードを変えるため

        /** 文字送り速度(ms), 1文送り時の速度でもある */
        this._outputtingInterval = 67; // 特に理由は無いが秒間15フレームに合わせた

        /** 最後にクリックによる次へ進む処理を行ったタイムスタンプ(ms)
            - 2クリック目でmousedownとdblclickが連続発火した際に2回進んでしまう点への対処
              特にparagraphやsentenceで不自然な動きになる為
            ! 2クリック目で二重発火しているのかと思ったら違う時間に発火してた, どういうことだ？
              良くわからんので間隔を調整することで対処中 */
        this._lastClickedAt = 0;
        this._clickEventInterval = 200; // 必要最小間隔(ms)

        /** オート開始設定 */
        this._isAutoRunning = false; // true=段落終了時に次の段落を自動開始する
        this._autoRunningWaitTime = 0; // その場合の開始までの間隔(ms)
        this._hasRunningReservation = false; // オートのsetTimeoutによる次のrunNextParagraph予約があるか

        /** 次の段落開始時に前の段落を削除するか, JRPGの会話ダイアログはこれを使う */
        this._isCleaningParagraphView = false;

        /** 積み重ねフラグ, true=にすると段落追加時に上に積み重なる
            1行だけの段落を積み重ね続けることで、ログビューワやテロップになる */
        this._isStackedMessage = false;
    };
    $f.inherit(kls, new cls.Block(), cls.Block);

    kls.prototype._initializeMessageBlock = function(){
        this._paragraphs = [];
        this.__view__.addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'message');
        this.__view__.css(cls.Style.get('message_block'))
            .css({
                lineHeight: this._messageLineHeight + 'px',
                fontSize: this._messageFontSize,
                letterSpacing: this._messageLetterSpacing
            })
            .bind('mousedown', {self:this}, this._onclickHandler)
            // IEだとdblclickまでの間隔はmousedownが起動せず反応が鈍く感じられる、ので二重定義
            .bind('dblclick', {self:this}, this._onclickHandler)
        ;
        $f.toUnselectable(this.__view__);
    };

    /** 出力中かを判定する, 単なる外部用アクセサ */
    kls.prototype.isOutputting = function(){
        return this._isOutputting;
    };

    /** 全段落終了かを判定する */
    kls.prototype.isAllParagraphsFinished = function(){
        return this._currentParagraphIndex === this._paragraphs.length - 1;
    };

    /** メッセージ出力をスキップモードに変更する, 強制的にオート出力かつ段落送りになる */
    kls.prototype.skipMessages = function(){
        this._outputtingMode = 'paragraph';
        this._currentOutputtingMode = 'paragraph';
        this._isAutoRunning = true;
        this._autoRunningWaitTime = cls.$consts.STABLE_INTERVAL;
        // 出力中でなく次の予約も無ければ自動実行する
        if (this._isOutputting === false && this._hasRunningReservation === false) {
            this.runNextParagraph();
        };
    };

    /** 段落を追加する */
    kls.prototype.addParagraph = function(text, options){
        var opts = options || {};
        var onstart = ('onstart' in opts)? opts.onstart: null;
        var onfinish = ('onfinish' in opts)? opts.onfinish: null;
        var outputtingMode = ('outputtingMode' in opts)? opts.outputtingMode: null;
        this._paragraphs.push({
            richText: cls.RichText.parse(text, {
                autoReturn: this._messageLineLength
            }),
            view: $('<div />'),
            onstart: onstart,
            onfinish: onfinish,
            outputtingMode: outputtingMode
        });
    };

    /** 次の段落を開始する */
    kls.prototype.runNextParagraph = function(){
        if (this._isOutputting) {
            throw new Error('RPGMaterial:MessageBlock.runNextParagraph, outputting now');
        };
        if (this.isAllParagraphsFinished()) {
            throw new Error('RPGMaterial:MessageBlock.runNextParagraph, already finished');
        };
        this._currentParagraphIndex += 1;
        this._runParagraph();
    };

    /** 現在の段落の出力を行う */
    kls.prototype._runParagraph = function(){
        var self = this;
        this._isOutputting = true;
        this._hasRunningReservation = false;
        var paragraph = this._paragraphs[this._currentParagraphIndex];
        var richText = paragraph.richText;
        var sentence = richText.getNextSentence();

        // 出力モード指定
        if (paragraph.outputtingMode !== null) {// 段落別設定を優先
            this._currentOutputtingMode = paragraph.outputtingMode;
        } else {
            this._currentOutputtingMode = this._outputtingMode;
        };

        // 出力前に前のパラグラフを削除する
        if (this._currentParagraphIndex !== 0 && this._isCleaningParagraphView) {
            var preParagraph = this._paragraphs[this._currentParagraphIndex - 1];
            preParagraph.view.remove();
            preParagraph.view = null;
        };

        // 段落と行の追加
        if (this._isStackedMessage === false) {
            this.__view__.append(paragraph.view); // 下に入る
        } else {
            this.__view__.prepend(paragraph.view); // 上に重なる
        };
        paragraph.view.append(sentence.getView());

        // 段落開始ハンドラ
        this._onparagraphstartHandler();
        if (paragraph.onstart !== null) {
            paragraph.onstart.apply(this);
        };

        // 段落終了まで全文章を出力
        (function(){

            // 段落送り以外の場合, 行にまだ文字が残っているなら行が終わるまで出力
            if (self._currentOutputtingMode !== 'paragraph' && sentence.isFinished() === false) {
                // 1文字または文末まで出力
                if (self._currentOutputtingMode === 'sentence') {
                    sentence.last();
                } else {
                    sentence.next();
                };
                sentence.print();
                setTimeout(arguments.callee, self._outputtingInterval);
                return;
            };

            // 段落送りの場合
            if (self._currentOutputtingMode === 'paragraph') {
                paragraph.view.empty(); // 出力済みの内容はクリア
                $f.each(richText.toView(true), function(i, v){ paragraph.view.append(v) });
            };

            // 段落が終了しているか
            // 1. まだ段落が残っている
            if (richText.isFinished() === false) {
                sentence = richText.getNextSentence();
                paragraph.view.append(sentence.getView());
                setTimeout(arguments.callee, self._outputtingInterval);
                return;
            // 2. 段落が終了した
            } else {
                // 段落終了ハンドラ
                self._onparagraphfinishHandler();
                if (paragraph.onfinish !== null) {
                    paragraph.onfinish.apply(self);
                };

                // 全段落が終了しているか
                // 1. まだ段落が残っている
                if (self.isAllParagraphsFinished() === false) {
                    // オート出力がONなら実行する
                    if (self._isAutoRunning) {
                        self._hasRunningReservation = true;
                        setTimeout(function(){
                            self.runNextParagraph();
                        }, self._autoRunningWaitTime);
                    };
                    self._isOutputting = false;
                    return;
                // 2. 全段落が終了した
                } else {
                    // 全段落終了ハンドラを実行して終了
                    self._onfinishHandler();
                    self._isOutputting = false;
                    return;
                };
            };

        })();
    };

    /** クリックハンドラ, 必要なら__付きをoverride
        mousedownとdblclickへ両方設定しているので、連打されることが前提になる */
    kls.prototype.__onclickHandler = function(evt){
        var self = evt.data.self;
    };
    kls.prototype._onclickHandler = function(evt){
        var self = evt.data.self;
        // mousedownとdblclickが2クリック目で同時発火するのを避ける
        var nowTime = (new Date()).getTime();
        if (self._lastClickedAt + self._clickEventInterval > nowTime) {
            return false;
        };
        self._lastClickedAt = nowTime;
        // ユーザ定義処理
        self.__onclickHandler(evt);
        // 未開始の場合は何もしない
        if (self._currentParagraphIndex === -1) return false;
        // 出力中
        if (self._isOutputting === true) {
            // 1文送りモードへ一時的に変更, クリックすると一気に出力する挙動になる
            self._currentOutputtingMode = 'sentence';
        // 待機中
        } else {
            // 次の段落があるか
            if (self.isAllParagraphsFinished() === false) {
                if (self._isAutoRunning) {
                    return false; // オート出力なら自動で最後まで進むので何もしない
                };
                self.runNextParagraph(); // 次の段落へ
            } else {
                self._onfinalclickHandler();
            };
        };
        return false;
    };

    /** 段落開始時の共通イベントハンドラ, 必要なら__付きをoverride, 個別指定も可 */
    kls.prototype.__onparagraphstartHandler = function(){
    };
    kls.prototype._onparagraphstartHandler = function(){
        this.__onparagraphstartHandler();
    };

    /** 段落終了時の共通イベントハンドラ, 必要なら__付きをoverride, 個別指定も可 */
    kls.prototype.__onparagraphfinishHandler = function(){
    };
    kls.prototype._onparagraphfinishHandler = function(){
        this.__onparagraphfinishHandler();
    };

    /** 全段落終了時のイベントハンドラ, 必要なら__付きをoverrideか生成時引数で指定 */
    kls.prototype.__onfinishHandler = function(){
    };
    kls.prototype._onfinishHandler = function(){
        this.__onfinishHandler();
    };
    kls.prototype.setOnfinishHandler = function(callback){// アクセサ, 必要になったから付けた
        this.__onfinishHandler = callback;
    };

    /** 全段落終了後のクリックハンドラ, 必要なら__付きをoverrideか生成時引数で指定 */
    kls.prototype.__onfinalclickHandler = function(){
    };
    kls.prototype._onfinalclickHandler = function(){
        this.__onfinalclickHandler();
    };

    /** 文字数(全角)・フォントサイズ・文字空き幅 から1行に必要な横幅を指定する

        letterSpacing は半角と全角の数で可変長になってしまうので基本0にする
        今は指定が有った場合は長め、つまり全部半角だった場合の間隔にしている

        1.5の倍率のpx以外はズレるらしい
        @ref http://d.hatena.ne.jp/yascentur/20110621/1308650962
        かつ 10.5 13.5 などはフォントが無かったりするので、一番安定するのは 9 12 15 辺り

        1.5の倍数じゃなくてもズレる, 例えば fontSize15px * 20文字 = 300px だと足りない
        文字が小さくなるほどその足りなさも激しくなる
        よーわからんので、実地で調べて係数を作った

        いずれにせよ、フォントが変わるとOS別にダメかもなので、過信は禁物
        サンプルや保守が要らないWebページなどなら自動設定でも良いが、基本は個別調整を推奨
        Mac-Safariの場合、今の osaka-mono でWinより若干短めで、問題ない範囲だった

        なお、調査の際は漢字を使うこと、最も幅が太い
        全角数値はわずかに幅が狭かった

        太字や斜体が入ってもずれるので marginRate という一定倍率で遊びを持たせられるオプションを付けた
    */
    kls.LINE_WIDTH_CALCULATION_FACTORS = {
        '9'   : 1.1500, // 良い
        '10.5': 1.1375, // 悪い, IEは余り Chromeは足りず Firefoxは調度良い
        '12'  : 1.0000, // とても良い、係数要らずでぴったり
        '13.5': 1.0500, // 良い
        '15'  : 1.0750  // 良い
    };
    kls.calculateLineWidth = function(twoByteLength, fontSize, letterSpacing, marginRate){
        var factor = kls.LINE_WIDTH_CALCULATION_FACTORS[15];
        if (fontSize in kls.LINE_WIDTH_CALCULATION_FACTORS) factor = kls.LINE_WIDTH_CALCULATION_FACTORS[fontSize];
        var w = twoByteLength * fontSize;
        w += (twoByteLength * 2 - 1) * letterSpacing; // 文字間隔分
        w *= factor;
        w *= marginRate;
        return Math.ceil(w);
    };

    /**
     * 詳細はコンストラクタ参照
     *
     * 引数:
     * lineLength    = 半角計算の文字数, 2以上の整数
     * fontSize      = 全角フォントサイズ, 3または1.5の倍数を推奨, 理由は上記参照
     * lineCount     = 表示行数, 1以上の整数
     * lineHeight    = 1行の縦幅
     *
     * オプション:
     * letterSpacing  = 文字間隔, 初期値の0のままを推奨, 理由は上記参照
     * marginRate     = 自動横幅計算時に一律で掛ける係数, 初期値は1.0
     * width          = 横幅を強制的に変更する
     * height         = 縦幅を強制的に変更する
     * outputtingMode = 'sentence'で文送り, 'paragraph'で段落送りになる
     * interval       = 1文字(または文・段落)の送り速度(ms)
     * onfinish       = 全段落終了ハンドラ
     * onfinalclick   = 全段落終了後クリックハンドラ
     * autoRunning    = オート出力設定
     * autoCleaning   = 段落出力前に以前の段落表示を消す
     * isStacked      = trueにすると段落が上から積み重なる
     */
    kls._factory = function(lineLength, fontSize, lineCount, lineHeight, position, options){
        var opts = options || {};
        var letterSpacing = ('letterSpacing' in opts)? opts.letterSpacing: 0;
        var marginRate = ('marginRate' in opts)? opts.marginRate: 1.0;
        var width = ('width' in opts)? opts.width: null;
        var height = ('height' in opts)? opts.height: null;
        // サイズ自動計算
        var size = [
            kls.calculateLineWidth(Math.ceil(lineLength / 2), fontSize, letterSpacing, marginRate),
            lineHeight * lineCount
        ];
        if (width !== null) size[0] = width;
        if (height !== null) size[1] = height;
        // 生成
        var obj = cls.Block._factory.apply(this, [size, position]);
        obj._messageLineLength = lineLength;
        obj._messageFontSize = fontSize;
        obj._messageLetterSpacing = letterSpacing;
        obj._messageLineCount = lineCount;
        obj._messageLineHeight = lineHeight;
        obj._initializeMessageBlock();
        if ('outputtingMode' in opts) obj._outputtingMode = opts.outputtingMode;
        if ('interval' in opts) obj._outputtingInterval = opts.interval;
        if ('onfinish' in opts) obj.__onfinishHandler = opts.onfinish;
        if ('onfinalclick' in opts) obj.__onfinalclickHandler = opts.onfinalclick;
        if ('autoRunning' in opts) {
            obj._isAutoRunning = true;
            obj._autoRunningWaitTime = opts.autoRunning;
        };
        if ('autoCleaning' in opts) obj._isCleaningParagraphView = opts.autoCleaning;
        if ('isStacked' in opts) obj._isStackedMessage = opts.isStacked;
        return obj;
    };
    kls.factory = kls._factory;

    return kls;
//}}}
})();

/** ゲージブロッククラス */
cls.$blocks.GaugeBlock = (function(){
//{{{
    var kls = function(){
        /** ゲージ全体枠ブロック, 現在は枠ブロックサイズに等しい */
        this._gaugeFull = undefined;
        /** 現在値枠ブロック */
        this._gaugeValue = undefined;
        /** ゲージ表示割合, 0.0-1.0 */
        this._gaugeRate = 1.0;
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.toString = function(){ return 'GaugeBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'gauge';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);

        self._gaugeFull = cls.block(self.getSize());
        self.append(self._gaugeFull);
        self._gaugeFull.drawAndShow();

        self._gaugeValue = cls.block(self.getSize());
        self.append(self._gaugeValue);
        self._gaugeValue.setZIndex(1);
        self._gaugeValue.drawAndShow();
    };

    /** ゲージ全体／現在値色を設定する */
    kls.prototype.setEmptyColor = function(value){
        this._gaugeFull.style({ bg:value });
    };
    kls.prototype.setValueColor = function(value){
        this._gaugeValue.style({ bg:value });
    };

    /** ゲージ残量割合を設定する */
    kls.prototype.setGaugeRate = function(value){
        this._gaugeRate = $f.withinNum(value, 0.0, 1.0);
    };

    kls.prototype._draw = function(){
        var self = this;
        cls.Block.prototype._draw.apply(this);
        // ゲージ割合に応じて現在値ブロックを左へ移動
        var left = -1 * this._gaugeFull.getWidth() * (1 - this._gaugeRate);
        this._gaugeValue.pos([null, left]);
        this._gaugeValue.draw();
    };

    kls.factory = function(size, pos){
        var obj = cls.Block._factory.apply(this, [size, pos]);
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();


/** 抽象基底盤クラス */
cls.Board = (function(){
//{{{
    var kls = function(){

        /** 1マスのサイズ, [w,h] */
        this._squareSize = undefined;

        /** マス同士の間隔 */
        this._spacing = 0;

        /** マスマップ, 2次元配列で表現, 左上を[0][0]としての [行][列] */
        this._squares = undefined;

        /**
         * マスのレイヤー定義群
         * '<任意の文字列>': <Board.Layerインスタンス>,
         */
        this._layers = undefined;
    };
    $f.inherit(kls, new cls.Block());

    /** マスの高さマップ
        マスに自動設定される高さは 行*100-列+1000 (100x100の場合は901-10801) */
    kls.ZINDEX_SQUARE_TOP = 20000; // マスがフォーカス中に一時的に最前面に出る場合

    kls.prototype.toString = function(){
        return 'Board' + this.getColumnCount() + 'x' + this.getRowCount();
    };

    var __INITIALIZE = function(self, extent){
        self._squares = [];
        self._layers = {};

        // 間隔による全体サイズ修正
        self.size([
            self.getSize()[0] + (extent[0] - 1) * self._spacing,
            self.getSize()[1] + (extent[1] - 1) * self._spacing
        ]);

        // マス生成・配置
        var coords = $f.squaring(self._squareSize, self.getSize(), self._spacing);
        var currentRowIndex = 0;
        var currentColumnIndex = 0;
        $f.each(coords, function(nouse, coord){
            var sq = kls.Square.factory(self._squareSize, coord, [currentRowIndex, currentColumnIndex]);
            sq._board = self;
            sq.setZIndex();
            self.append(sq);
            self.chainDrawing(sq.getBlockId());
            // マスマップへ格納
            if (self._squares[currentRowIndex] === undefined) {
                self._squares[currentRowIndex] = [];
            };
            self._squares[currentRowIndex][currentColumnIndex] = sq;
            // 座標を進める
            currentColumnIndex += 1;
            if (currentColumnIndex === extent[0]) {
                currentRowIndex += 1;
                currentColumnIndex = 0;
            };
        });
    };

    /** レイヤー定義の存否確認をする／返す／全て返す */
    kls.prototype.hasLayer = function(layerKey){
        return layerKey in this._layers;
    };
    kls.prototype.getLayer = function(layerKey){
        if (this.hasLayer(layerKey) === false) {
            throw new Error('RPGMaterial:Board.getLayer, not defined layerKey=`' + layerKey + '`');
        };
        return this._layers[layerKey];
    };
    kls.prototype.getLayers = function(){
        return this._layers;
    };

    /** レイヤーを定義する
        @return Board.Layerインスタンス, 直後に使うことが多いため特に戻り値が必要 */
    kls.prototype.defineLayer = function(layerKey, order){
        var self = this;
        if (this.hasLayer(layerKey)) {
            throw new Error('RPGMaterial:Board.defineLayer, already defined layerKey=`' + layerKey + '`');
        };
        this._layers[layerKey] = new kls.Layer(this, order);
        // マス側の設定情報を初期化
        this.eachSquares(function(sq){
            sq._initializeLayer(layerKey);
        });
        return this._layers[layerKey];
    };

    /** 指定レイヤのオートタイリング用境界線データを同期する
        ! 速度対策で一部だけを指定できるオプションが欲しい,マップエディタは1つずつ変えるから */
    kls.prototype.syncBoundaryData = function(layerKey){
        var self = this;
        var layer = this.getLayer(layerKey);

        this.eachSquares(function(sq){

            // レイヤーブロックが無い
            if (sq.hasLayerBlock(layerKey) === false) return true;
            var block = sq.getLayerBlock(layerKey);
            // レイヤーブロックがチップじゃない、チップでもオートタイルじゃない
            if (block instanceof cls.Chip === false || block.isAutoTile() === false) return true;

            // 自マスを中心とした9マスを取得, 盤外の座標も含む
            var neighbors = cls.Range.getNeighbors(sq.getIndex(), 2, function(idx, dist){
                if (dist === 2) {// ひし形の13マスを正方形の9マスにしている
                    if (idx[0] === sq.getRowIndex() || idx[1] === sq.getColumnIndex()) {
                        return false;
                    };
                };
            });
            var sameTiles = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];
            var i, idx, isSame, targetSquare;
            for (i = 0; i < neighbors.length; i++) {
                idx = neighbors[i].index;
                isSame = false;
                // 盤外でマス無しの部分の処理
                // なお、盤内でマスにレイヤーブロック無しはisSameTileメソッド内に含まれる
                if (self.hasSquare(idx) === false) {
                    isSame = layer.noneSquareAsSame;
                } else {
                    targetSquare = self.getSquare(idx);
                    isSame = sq.isSameTile(targetSquare, layerKey);
                };
                isSame = isSame + 0; //! parseIntはNG
                sameTiles[idx[0] - sq.getRowIndex() + 1][idx[1] - sq.getColumnIndex() + 1] = isSame;
            };
            sq.getLayerBlock(layerKey).applyFixedSameTiles(sameTiles);
            sq.getLayerBlock(layerKey).setBoundaryData(cls.ImageProtocol.createBoundaryData(sameTiles));
        });
    };

    /** 全レイヤの境界線データを同期する */
    kls.prototype.syncAllBoundaryData = function(){
        var self = this;
        $f.each(this._layers, function(layerKey, nouse){
            self.syncBoundaryData(layerKey);
        });
    };

    /** 行数／列数を取得する
        ! 前は getExtent という 広さを返す関数だったが
          行x列 なのか 横x縦 なのかがわかり難いので一旦廃止, 復活の可能性はある */
    kls.prototype.getRowCount = function(){
        return this._squares.length;
    };
    kls.prototype.getColumnCount = function(){
        return this._squares[0].length;
    };
    /** マス総数を返す */
    kls.prototype.getSquareCount = function(){
        return this.getRowCount() * this.getColumnCount();
    };

    /** 指定マスの存否判定をする */
    kls.prototype.hasSquare = function(idx){
        if (idx instanceof Array === false) {// 経験上undefinedを渡すことを良くやったので
            throw new Error('RPGMaterial:Board.hasSquare, invalid parameter idx=`' + idx + '`');
        };
        if (idx[0] in this._squares === false || idx[1] in this._squares[idx[0]] === false) {
            return false;
        };
        return true;
    };

    /** 指定マスを返す, numを渡して0スタートの連番でも指定できる */
    kls.prototype.getSquare = function(idx){
        if (typeof idx === 'number') {
            var ri = parseInt(idx / this.getColumnCount());
            var ci = parseInt(idx % this.getColumnCount());
            idx = [ri, ci];
        };
        if (this.hasSquare(idx) === false) {
            throw new Error('RPGMaterial:Board.getSquare, invalid parameter idx=`' + idx + '`');
        };
        return this._squares[idx[0]][idx[1]];
    };

    /** 全マスへ関数を実行する */
    kls.prototype.eachSquares = function(callback, conditions){
        var c = conditions || {};

        // [上, 右, 下, 左] で実行する枠を指定できる
        // null を入れると、その方向に対しては制限しない
        var rect = ('rect' in c)? c.rect: [null, null, null, null];
        if (rect[0] === null) rect[0] = 0;
        if (rect[1] === null) rect[1] = this.getColumnCount() - 1;
        if (rect[2] === null) rect[2] = this.getRowCount() - 1;
        if (rect[3] === null) rect[3] = 0;

        var ri, ci;
        for (ri = rect[0]; ri <= rect[2]; ri++) {
            for (ci = rect[3]; ci <= rect[1]; ci++) {
                var utils = {};
                //utils.isLastColumn = ci === rect[1];// true=行末尾の列
                if (callback(this._squares[ri][ci], utils) === false) {
                    return;
                };
            };
        };
    };

    /** マスサイズを取得する単なるアクセサ */
    kls.prototype.getSquareSize = function(){
        return this._squareSize;
    };

    /** 指定レイヤに設定されているブロック原型のサンプル集を返す
        @return '<レイヤキー>':<Blockインスタンス> ペア群 */
    kls.prototype.createLayerSamples = function(layerKey){
        var samples = {};
        var layer = this.getLayer(layerKey);
        $f.each(layer.getBlockModels(), function(blockModelKey, nouse){
            var b = layer.createBlock(blockModelKey);
            // 固定方向設定を反映する
            var sameTiles = [[0,0,0], [0,1,0], [0,0,0]];
            b.applyFixedSameTiles(sameTiles);
            b.setBoundaryData(cls.ImageProtocol.createBoundaryData(sameTiles));
            samples[blockModelKey] = b;
        });
        return samples;
    };

    /** 広さからサイズを計算する */
    kls._calculateSize = function(extent, squareSize){
        return [
            extent[0] * squareSize[0],
            extent[1] * squareSize[1]
        ];
    };

    /** @param extent 広さ [列数,行数] */
    kls._factory = function(extent, squareSize, position, options){
        var opts = options || {};
        var size = kls._calculateSize(extent, squareSize);
        var obj = cls.Block._factory.apply(this, [size, position]);
        obj._squareSize = squareSize;
        if ('spacing' in opts) obj._spacing = opts.spacing;
        __INITIALIZE(obj, extent);
        return obj;
    };


    /** レイヤー簡易クラス, @usage new Class(board, order) */
    kls.Layer = function(board, order){
    //{{{
        this._board = board;
        this.toString = function(){ return 'Layer' };

        if (typeof order !== 'number' || order < 1 || order > 100) {
            throw new Error('RPGMaterial:Board.Layer(), invalid parameter order=`' + order + '`');
        };

        /** 表示順, 1-100の整数, 低いほど表示位置が低い
            同じ値が複数レイヤーに設定された場合の動作保障はしない */
        this._order = order;
        this.getOrder = function(){return this._order};

        /** マスが無い部分をオートタイルの境界線がないと認識するか */
        this.noneSquareAsSame = true;

        /**
         * ブロック原型群
         *
         * '<任意の文字列>': {
         *     factory: <ブロック生成用コールバック関数>,
         *     sameKinds: [<ブロック原型キーリスト>],
         * }
         *
         * - factory の設定例
         *   function(size, options){
         *       return SomeBlock.factory(size, null, ...);
         *   }
         *   ポイント1=戻り値でブロックを返すこと
         *   ポイント2=第1引数でマスのサイズが渡されること
         *   ポイント3=第2引数のoptionsのlayerに自身が入る
         *             もし他の原型のほんの一部の情報だけを変えたい場合は
         *             layer.getBlockModel(キー).factory で他の原型を使ってブロックを生成し
         *             それを修正して返すことで対応できる
         *             !! ImageIndexer の方が便利なので消すかもしれない !!
         * - sameKinds はオートタイル処理時に同じものとして境界線無しに設定する対象リスト
         *   デフォルトは自分だけ
         */
        this._blockModels = {};

        /** ブロック原型の存否確認をする／返す／全て返す */
        this.hasBlockModel = function(blockModelKey){
            return blockModelKey in this._blockModels;
        };
        this.getBlockModel = function(blockModelKey){
            if (this.hasBlockModel(blockModelKey) === false) {
                throw new Error('RPGMaterial:Board.Layer.getBlockModel, not defined blockModelKey=`' + blockModelKey + '`');
            };
            return this._blockModels[blockModelKey];
        };
        this.getBlockModels = function(){
            return this._blockModels;
        };

        /** ブロック原型を追加する */
        this.addBlockModel = function(blockModelKey, factory){
            if (this.hasBlockModel(blockModelKey)) {
                throw new Error('RPGMaterial:Board.Layer.addBlockModel, already defined blockModelKey=`' + blockModelKey + '`');
            };
            if (typeof factory !== 'function') {// ブロックそのものを渡しそうだからハンドリング
                throw new Error('RPGMaterial:Board.Layer.addBlockModel, invalid parameter, factory=`' + factory + '`');
            };
            return this._blockModels[blockModelKey] = {
                factory: factory,
                sameKinds: [blockModelKey]
            };
        };

        /** 同じ種類とする原型群を定義する 同じキーに対して二回以上使わない想定 */
        this.defineSameKinds = function(/* args */){
            var self = this;
            var args = Array.prototype.slice.apply(arguments);
            $f.each(args, function(nouse, bmk){
                var bm = self.getBlockModel(bmk);
                bm.sameKinds = Array.prototype.slice.apply(args);
            });
        };

        /** ブロック原型からブロックを生成して返す */
        this.createBlock = function(blockModelKey){
            var blockModel = this.getBlockModel(blockModelKey);
            var block = blockModel.factory([
                this._board._squareSize[0],
                this._board._squareSize[1]
            ], {
                layer: this
            });
            if (block instanceof cls.Block === false) {// 原型がブロックを返さない
                throw new Error('RPGMaterial:Board.Layer.createBlock, invalid situation, blockModel.factory is not returned block instance');
            };
            return block;
        };
    //}}}
    };


    /** マスクラス */
    kls.Square = (function(){
    //{{{
        var qls = function(){

            /** 所属先のBoardインスタンス */
            this._board = undefined;

            /** 盤上の位置, [行インデックス, 列インデックス]
                Board._squares のインデックスと対応 */
            this._index = undefined;

            /** 枠線表現用ブロック, ビューでも良さそうだけど画像を使う場合などもあると思うので */
            this._closingLineBlock = undefined;

            /** 着色表現用ブロック */
            this._coloringBlock = undefined;

            /** 点滅表現用ブロック */
            this._blinkingBlock = undefined;

            /**
             * レイヤーデータ群
             *
             * '<Board._layersの各キー>': {
             *     block:         <ブロック||null>,
             *     blockModelKey: <ブロック原型キー||null>
             * }
             */
            this._layers = undefined;

            /** フリースペース, 自由にデータを格納できる領域 */
            this._freeSpace = undefined;
        };
        $f.inherit(qls, new cls.Block());

        // 高さマップ
        // - 自由設定範囲は 100-1000
        // ! アニメーションする要素を最も高い位置に持ってくるとクリックイベントが拾えないことがあった
        //   例えば、background-colorの点滅表現の時にそうなった, ブラウザは忘れた
        // ! ただ、別のバグを発生させたので結局廃止、替わりに枠線をhideしないで常時最上位表示
        qls.ZINDEXES = {
            CLOSING_LINE: 1300,
            COLORING: 1200,
            BLINKING: 1100//,
        };

        qls.CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'board-square';

        function __INITIALIZE(self){

            self._layers = {};
            self._freeSpace = {};

            self.getView().addClass(qls.CSS_SELECTOR);

            // 枠線・着色・点滅 は、描画時はビューを直接更新なので
            // 初期化の今のタイミングでdrawをする

            // 枠線, 兼座標
            self._closingLineBlock = cls.$blocks.PlainBlock.factory(self.getSize());
            self._closingLineBlock.setZIndex(qls.ZINDEXES.CLOSING_LINE);
            self._closingLineBlock.draw();
            self.append(self._closingLineBlock);
            // 着色
            self._coloringBlock = cls.$blocks.PlainBlock.factory(self.getSize());
            self._coloringBlock.setZIndex(qls.ZINDEXES.COLORING);
            self._coloringBlock.draw();
            self.append(self._coloringBlock);
            // 点滅
            self._blinkingBlock = cls.$blocks.PlainBlock.factory(self.getSize());
            self._blinkingBlock.setZIndex(qls.ZINDEXES.BLINKING);
            self._blinkingBlock.draw();
            self.append(self._blinkingBlock);
        };

        qls.prototype.toString = function(){
            return 'Square[' + this._index[0] + ',' + this._index[1] + ']';
        };

        /** 位置を返す, 基本ディープコピーして返すが deepcopy=false で参照を返す
            百回単位で呼ばれるような関数なので出来る限り性能に配慮したい */
        qls.prototype.getIndex = function(deepcopy){
            if (deepcopy !== false) return [this._index[0], this._index[1]];
            return this._index;
        };
        qls.prototype.getRowIndex = function(){
            return this._index[0];
        };
        qls.prototype.getColumnIndex = function(){
            return this._index[1];
        };

        /** 盤上の位置により高さが決まっているので、その処理を加えてoverride */
        qls.prototype.setZIndex = function(mixed){
            var zi;
            if (mixed === 'top') {
                zi = cls.Board.ZINDEX_SQUARE_TOP;
                this.__zIndex__ = zi;
            } else if (typeof mixed === 'number') {// 通常のsetZIndex処理
                cls.Block.prototype.setZIndex.apply(this, [mixed]);
            } else {
                zi = this._index[0] * 100 - this._index[1] + 1000;
                this.__zIndex__ = zi;
            };
        };

        /** 指定レイヤーのデータを初期化する, Board内で一回呼ばれるだけのメソッド */
        qls.prototype._initializeLayer = function(layerKey){
            this._layers[layerKey] = {
                block: null,
                blockModelKey: null
            };
        };

        /** レイヤデータを返す, 内部用 */
        qls.prototype._getLayerData = function(layerKey){
            if (layerKey in this._layers === false) {
                throw new Error('RPGMaterial:Board.Square._getLayerData, not set layerKey=`' + layerKey + '`');
            };
            return this._layers[layerKey];
        };

        /** レイヤデータを全て返す */
        qls.prototype.getAllLayerData = function(){
            return this._layers;
        };

        /** レイヤブロック存否判定／返す */
        qls.prototype.hasLayerBlock = function(layerKey){
            return this._getLayerData(layerKey).block !== null;
        };
        qls.prototype.getLayerBlock = function(layerKey){
            if (this.hasLayerBlock(layerKey) === false) {
                throw new Error('RPGMaterial:Board.Square.getLayerBlock, not set layerKey=`' + layerKey + '`');
            };
            return this._getLayerData(layerKey).block;
        };
        qls.prototype.getBlockModelKey = function(layerKey){
            if (this.hasLayerBlock(layerKey) === false) {
                throw new Error('RPGMaterial:Board.Square.getBlockModelKey, not set layerKey=`' + layerKey + '`');
            };
            return this._getLayerData(layerKey).blockModelKey;
        };

        /** 指定レイヤーのブロックの高さを設定する */
        qls.prototype._setLayerBlockZIndex = function(layerKey){
            var block = this.getLayerBlock(layerKey);
            var layer = this._board.getLayer(layerKey);
            block.setZIndex(layer.getOrder() + 100);
        };

        /** レイヤーブロックを配置する, ブロックはキー指定で原型から作るor個別に渡すことも可能
            @return 設定したブロック */
        qls.prototype.setLayerBlock = function(layerKey, blockOrModelKey){
            if (this.hasLayerBlock(layerKey)) {// 配置済み
                throw new Error('RPGMaterial:Board.Square.setLayerBlock, already set block');
            };
            var layerData = this._getLayerData(layerKey);
            if (typeof blockOrModelKey === 'string') {
                layerData.block = this._board.getLayer(layerKey).createBlock(blockOrModelKey);
                layerData.blockModelKey = blockOrModelKey;
            } else if (blockOrModelKey instanceof cls.Block) {
                layerData.block = blockOrModelKey;
                layerData.blockModelKey = null;
            } else {
                throw new Error('RPGMaterial:Board.Square.setLayerBlock, invalid parameter blockOrModelKey=`' + blockOrModelKey + '`');
            };
            this._setLayerBlockZIndex(layerKey);
            this.append(layerData.block);
            this.chainDrawing(layerData.block.getBlockId());
            return layerData.block;
        };

        /** レイヤーブロックを除去する／全レイヤーのものを除去する */
        qls.prototype.removeLayerBlock = function(layerKey){
            if (this.hasLayerBlock(layerKey) === false) {// 配置無し
                throw new Error('RPGMaterial:Board.Square.removeLayerBlock, invalid situation, not set block');
            };
            var layerData = this._getLayerData(layerKey);
            this.removeDrawingChainedBlockId(layerData.block.getBlockId());
            layerData.block.remove();
            layerData.block = null;
            layerData.blockModelKey = null;
        };
        qls.prototype.removeAllLayerBlocks = function(){
            var self = this;
            $f.each(this._layers, function(layerKey, nouse){
                if (self.hasLayerBlock(layerKey)) self.removeLayerBlock(layerKey, false);
            });
        };

        /** 個別レイヤーブロックを移動する／描画も行う, 個別以外は使えない
            自マスにブロックがあり移動先に無い状況でないとエラー
            同じマスを移動先に指定した場合は何もしないだけでエラーにしない */
        qls.prototype.moveLayerBlock = function(targetSquare, layerKey){
            // 多分エラーにしない方がいい, mvやクリップのイメージで使うと思う
            if (this === targetSquare) return;
            var layerData = this._getLayerData(layerKey);
            if (layerData.blockModelKey !== null) {// 個別以外は必要ないと思うのでエラーにする
                throw new Error('RPGMaterial:Board.Square.moveLayerBlock, not private block');
            };
            var block = layerData.block;
            this.removeLayerBlock(layerKey);
            targetSquare.setLayerBlock(layerKey, block);
        };
        qls.prototype.drawMovingLayerBlock = function(targetSquare, layerKey){
            this.moveLayerBlock(targetSquare, layerKey);
            targetSquare.getLayerBlock(layerKey).draw();
        };

        /** レイヤーブロックが同種タイルであるかを判定する
            syncBoundaryData内で使われる限り不要な条件分岐もあるが
            それ以外でも使うかもなので何処で呼ばれても良いようにする
            オートタイルだけに使用を限定もしない */
        qls.prototype.isSameTile = function(targetSquare, layerKey){
            var layerData = this._getLayerData(layerKey);
            var targetLayerData = targetSquare._getLayerData(layerKey);
            var layer = this._board.getLayer(layerKey);
            if (
                // 自分か対象のレイヤーブロックが無い
                this.hasLayerBlock(layerKey) === false ||
                targetSquare.hasLayerBlock(layerKey) === false ||
                // 自分か対象のblockModelKeyが無い, つまりは個別設定ブロックだった
                layerData.blockModelKey === null ||
                targetLayerData.blockModelKey === null ||
                // 同じ種類ではない
                $f.inArray(
                    targetLayerData.blockModelKey,
                    layer.getBlockModel(layerData.blockModelKey).sameKinds
                ) === false
            ) {
                return false;
            };
            return true;
        };

        /** レイヤーブロックを1つのビューとして複製して返す */
        qls.prototype.cloneLayerBlockAsView = function(layerKey){
            var block = this.getLayerBlock(layerKey);
            return block.getView().clone();
        };

        /** 各種着色表現用の色・透明度データを定型表現を考慮して解析する
            @param color str=カラーコードor定型コード || false=表示しない
            @return [背景色, 透過度] 背景色=null は非表示という意味 */
        qls.prototype._parseColor = function(color, opacity){
            var styles = cls.Style.get('_coloring-' + color, false);
            // 定型
            if (styles !== null) {
                color = styles.backgroundColor;
                opacity = styles.opacity;
            // 個別
            } else if (typeof color === 'string') {
                if (opacity === undefined) opacity = 1.0;
            // 透過, というか非表示
            } else {
                color = null;
            };
            return [color, opacity];
        };

        //! Block側の同メソッドへ共通化した
        //  残しているのはdrawIndexがあるのと、消して良いかを精査してないため, 何かの折に消す
        ///** マスへ枠線表現を行う
        //    @param color カラーコードor定型コード, 初期値はStyleへ定義, 未設定or'default'で初期値
        //    @param opacity 透過度, 初期値は 1.0
        //    @param borderWidth int=枠線太さ
        //    @param dashed true=点線 false(default)=実線 */
        //qls.prototype.drawClosingLine = function(color, opacity, borderWidth, dashed){
        //    if (color === 'default' || color === undefined) {
        //        color = cls.Style.get('board_square_closing_line_default_color').borderColor;
        //    };
        //    var pair = this._parseColor(color, opacity);
        //    if (borderWidth === undefined) borderWidth = 2;
        //    dashed = !!dashed;

        //    // 枠の分サイズを小さくし、またその分座標を調整する必要がある
        //    this._closingLineBlock.getView().css({
        //        width: this.getSize()[0] - borderWidth * 2,
        //        height: this.getSize()[1] - borderWidth * 2,
        //        borderWidth: borderWidth,
        //        borderColor: pair[0],
        //        borderStyle: (dashed)? 'dashed': 'solid',
        //        opacity: pair[1]
        //    });
        //    this._closingLineBlock.show();
        //};
        //qls.prototype.clearClosingLine = function(){
        //    // hide はしない, cls.ZINDEXES のコメント参照
        //    this._closingLineBlock.getView().css({ border:'none' });
        //};

        //! ファイル頭のタスクメモを参照
        ///** マスへ座標を表示する, 枠線用ブロックを使っている
        //    透過は枠線に従う, 暫定で本番で使うことを想定していない */
        //qls.prototype.drawIndex = function(color){
        //    if (color === 'default' || color === undefined) color = '#000';
        //    var pair = this._parseColor(color, 1.0);
        //    this._closingLineBlock.getView()
        //        .text(this.getRowIndex() + ',' + this.getColumnIndex())
        //        .css({
        //            fontSize: 12,
        //            lineHeight: '12px',
        //            textAlign: 'left',
        //            color: pair[0]
        //        })
        //    ;
        //};
        //qls.prototype.clearIndex = function(){
        //    this._closingLineBlock.getView().text('');
        //};

        /** 指定ブロックへ着色する, つまりはブロックビューの背景色と透過度を設定する
            @param color カラーコードor定型コード || null=非表示 */
        qls.prototype._drawColoringOnly = function(targetBlock, color, opacity){
            if (color === null) {
                targetBlock.hide();
                return;
            };
            var pair = this._parseColor(color, opacity);
            targetBlock.getView().css({
                backgroundColor: pair[0],
                opacity: pair[1]
            });
            targetBlock.show();
        };

        /** 着色表現を行う */
        qls.prototype.drawColoring = function(color, opacity){
            this._drawColoringOnly(this._coloringBlock, color, opacity);
        };
        qls.prototype.clearColoring = function(){
            this._drawColoringOnly(this._coloringBlock, null);
        };

        /** 指定レイヤーブロックへ着色表現を行う */
        qls.prototype.drawLayerColoring = function(layerKey, color, opacity){
            this._drawColoringOnly(this.getLayerBlock(layerKey), color, opacity);
        };
        qls.prototype.clearLayerColoring = function(layerKey){
            this._drawColoringOnly(this.getLayerBlock(layerKey), null);
        };

        /** 点滅表現を行う */
        qls.prototype.runBlinking = function(color, opacity, count, interval){
            var self = this;
            var pair = this._parseColor(color, opacity);
            color = pair[0];
            opacity = pair[1];
            if (color === null) color = '#FFFFFF';
            if (opacity === null || opacity === undefined) opacity = 0.5;
            if (count === undefined) count = 3;
            if (interval === undefined) interval = 50;

            this._blinkingBlock.getView().css({
                backgroundColor: color,
                opacity: opacity
            });

            var anim = cls.$animations.PlainIteratedAnimation.factory(function(cnt){
                (cnt % 2 === 1)? self._blinkingBlock.show(): self._blinkingBlock.hide();
            }, count * 2, interval);
            anim.run();

            return anim;
        };

        /** フリースペース操作関連 */
        qls.prototype.setFreeSpace = function(key, value){
            this._freeSpace[key] = value;
        };
        qls.prototype.hasFreeSpace = function(key){
            return key in this._freeSpace;
        };
        qls.prototype.getFreeSpace = function(key, defaultValue){
            if (this.hasFreeSpace(key) === false) {
                if (defaultValue === undefined) {
                    throw new Error('RPGMaterial:Board.Square.getFreeSpace, not defined key=`' + key + '`');
                } else {
                    return defaultValue;
                };
            };
            return this._freeSpace[key];
        };

        /** クリックイベントハンドラを設定する
            他のように初期化時にbindしていないのはdataを受け取りたいから */
        qls.prototype.bindOnsquareclick = function(data, callback){
            if (typeof data === 'function') {// 引数が1つだけも可能
                callback = data;
                data = {};
            };
            //!! 前はselfに自マスを登録していたけど止めた
            //   利用側で"self"と認識するものが変わるのでわかり難かった
            $f.extend(data, {square:this});
            this.bindEvent('touch', data, callback);
        };

        qls._factory = function(size, pos, idx){
            var obj = cls.Block._factory.apply(this, [size, pos]);
            obj._index = idx;
            __INITIALIZE(obj);
            return obj;
        };
        qls.factory = qls._factory;

        return qls;
    //}}}
    })();


    return kls;
//}}}
})();

/** 単純な盤クラス */
cls.$boards.PlainBoard = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Board());
    kls.factory = function(){
        return cls.Board._factory.apply(this, arguments);
    };
    return kls;
//}}}
})();

/** ボタンセット盤クラス */
cls.$boards.ButtonSetBoard = (function(){
//{{{
    //
    // - ボタンアクティブ/非アクティブを機能に含めようかと思ったが
    //   ボタン状態の類型は ON/OFF, アクティブ/非アクティブ, 表示/非表示 など
    //   複数の状態が重なり合って定義されるものなので簡単には無理だった
    //   やるなら、全部含めてやる
    // - なので、cursor:pointer を付けるのも同じ理由で無理
    //
    var kls = function(){
        /** ボタンセット, '<buttonKey>':<Buttonインスタンス> のペア群 */
        this._buttons = undefined;
    };
    $f.inherit(kls, new cls.Board());

    kls.prototype.toString = function(){ return 'ButtonSetBoard' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'buttonsetboard';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._buttons = {};
        self.defineLayer('button', 50);
    };

    /** ボタンを定義する
        @param buttonKey 任意のキー
        @param idx       ボタンに該当するマスの位置, arr=位置 || num=連番
        @param block     ボタン表示用ブロック */
    kls.prototype.defineButton = function(buttonKey, idx, block){
        var sq = this.getSquare(idx);
        sq.setLayerBlock('button', block);
        var button = new kls.Button(sq, idx);
        this._buttons[buttonKey] = button;
        return button;
    };

    kls.prototype.getButton = function(buttonKey){
        if (buttonKey in this._buttons === false) {
            throw new Error('RPGMaterial:ButtonSetBoard.getButton, not defined buttonKey=' + buttonKey);
        };
        return this._buttons[buttonKey];
    };

    /** ボタンのメインブロックを返す, ショートカット */
    kls.prototype.getButtonBlock = function(buttonKey){
        return this.getButton(buttonKey).square.getLayerBlock('button');
    };

    /** ボタン群を返す, 単なるアクセサ */
    kls.prototype.getButtons = function(){
        return this._buttons;
    };

    /** それぞれのボタンに対して処理を行う, 順番は保障されない */
    kls.prototype.eachButtons = function(callback){
        $f.each(this._buttons, callback);
    };

    /** ボタンクリックハンドラを設定する
        全ボタンそれぞれへ一括で行われるのでボタン定義後に行うこと */
    kls.prototype.bindOnbuttonsetclick = function(data, callback){
        var self = this;
        $f.each(this._buttons, function(buttonKey, button){
            var d = $f.extend({
                buttonSet: self,
                buttonKey: buttonKey,
                button: button
            }, data);
            button.square.bindOnsquareclick(d, callback);
        });
    };

    /** ボタン簡易クラス */
    kls.Button = function(square, index){
        this.square = square;
        this.index = index;
        this.getBlock = function(){ return square.getLayerBlock('button') };
    };

    kls.factory = function(/* args */){
        var obj = cls.Board._factory.apply(this, arguments);
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();


/** 抽象基底マップエディタクラス */
cls.MapEditor = (function(){
//{{{
    //
    // 後で改修:
    // - マップサイズが異なってもロード/ダンプ可能にする, サイズ変更したいことはよくある
    //   - 合わせて、現マップ全体の座標移動、右下へ１マス動かすとか
    //     - なら、クリップ＆ペーストできるようにした方が良いかも
    // - loadBoardDataを静的に呼べるようにする、アプリ側で必要になる
    //   直接Boardに反映するよりも、直前でいい形でデータだけ取れる方が良い
    //   原型キーを他の盤の実体となる何かに渡して、その実体が盤を作る、という手順を踏むこともある
    //   保留している理由は、Boardのレイヤ改修が終わってからの方が良いし、
    //   実害も 1.マップエディタインスタンスを作るのが変 2.上記のように一旦データで取り出せない
    //   という2点だけで、そこまで切迫もしていないから
    //
    var kls = function(){

        /** 各内部要素間の間隔 */
        this._elementSpacing = 8;

        /** 編集対象となる盤ブロック */
        this._boardBlock = undefined;

        /** パレットスタックブロック */
        this._paletteStackBlock = undefined;

        /** パレット広さ */
        this._paletteExtent = [5, 8];

        /** 表示しないレイヤーキーリスト
            表示しないだけでダンプ時のデータには含まれるし、ロード時も参照する */
        this._ignoreLayerKeys = [];

        /** 初期表示するパレットのインデックス, エディタ表示後最上部レイヤを0とした指定
            本来はkeyで指定すべきだけど面倒なのでこれになっている */
        this._defaultPaletteIndex = 0;

        /** コントローラブロック */
        this._controllerBlock = undefined;
        this._controllerBlockHeight = 60;

        /** コントローラ上に表示する初期コマンドリスト情報
            各要素 = { label:'<表示名>', callback:<コールバック関数またはメソッド文字列> } */
        this._defaultCommands = [
            {label:'All', callback:'_onallsquaresbutton'},
            {label:'AutoTiling', callback:'_onautotilingbutton'},
            {label:'Grid', callback:'_onshowgridbutton'},
            {label:'Dump', callback:'_ondumpingdatabutton'},
            {label:'Load', callback:'_onloadingdatabutton'}//,
        ];

        /** beforeunloadの有効フラグ
            false=無効, true=一度でもパレットを触れば有効, null=設定済み */
        this._isEnabledBeforeunload = false;
    };
    $f.inherit(kls, new cls.Block());

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'mapeditor';

    kls.prototype.toString = function(){ return 'MapEditor' }

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self.style({ overflow:'scroll', bg:'#FAFAFA' });

        // パレットスタック
        self._paletteStackBlock = kls.PaletteStackBlock.factory(self, [0, 0]);
        self.append(self._paletteStackBlock);
        self.chainDrawing(self._paletteStackBlock);

        // コントローラ
        self._controllerBlock = cls.$blocks.PlainBlock.factory(
            [self._paletteStackBlock.getSize()[0], self._controllerBlockHeight],
            [self._paletteStackBlock.getPos()[0] + self._paletteStackBlock.getSize()[1] +
                self._elementSpacing, 0]
        );
        self._controllerBlock.style({ bg:'#CCFFFF' });
        self.append(self._controllerBlock);
        self.chainDrawing(self._controllerBlock.getBlockId());
        $f.each(self._defaultCommands, function(nouse, v){
            self.addCommand(v.label, v.callback);
        });

        // 盤
        self._boardBlock.style({ bg:'#CCFFFF' });
        self.append(self._boardBlock);
        self.chainDrawing(self._boardBlock.getBlockId());
        self._boardBlock.pos([0, self._elementSpacing + self._paletteStackBlock.getSize()[0]]);

        // 盤初期化
        self._boardBlock.eachSquares(function(sq){
            sq.getView().css({ cursor:'pointer' });
            sq.bindOnsquareclick(function(evt){
                if (self._isEnabledBeforeunload === true) {
                    __START_BEFOREUNLOAD();
                    self._isEnabledBeforeunload = null;
                };
                if (evt.which === 1) {// 左クリック
                    __UPDATE_BLOCK(self, sq);
                } else if (evt.which === 3) {// 右クリック
                    __UPDATE_BLOCK(self, sq, true);
                };
            });
            sq.getView().bind('contextmenu', function(){ return false });
        });
    };

    /** パレットスタックブロッククラス */
    kls.PaletteStackBlock = (function(){
    //{{{
        var qls = function(){
            this._mapEditor = undefined;
            this._board = undefined; // 改修履歴上の理由でマップエディタインスタンスと別に持っている
            /** 切替タブブロック */
            this._tab = undefined;
            this._tabRowHeight = 18;
            /** パレット情報リスト
                各要素 = { block:<盤ブロック>, key:'<左記に対応するキー>' } */
            this._palettes = [];
            /** 選択中パレットとマスを示す情報群 */
            this._selectionData = {
                key: null,
                paintKey: null // ブロック原型キーが入る
            };
        };
        $f.inherit(qls, new cls.Block());

        function __INITIALIZE(self){

            self._board = self._mapEditor._boardBlock;

            // パレット枚数を算出する
            var addedLayerKeys = [];
            $f.each(self._board.getLayers(), function(layerKey, layer){
                if ($f.inArray(layerKey,
                    addedLayerKeys.concat(self._mapEditor._ignoreLayerKeys))) return;
                self._palettes.push({
                    block: __CREATE_PALETTE(self),
                    key: layerKey,
                    selectButtonView: undefined,
                    displayOnoffView: undefined,
                    isDisplayed: true
                });
            });
            if (self._palettes.length === 0) {// ひとつもレイヤーが無い場合
                throw new Error('RPGMaterial:MapEditor.PaletteStackBlock.__INITIALIZE, none layer');
            };

            // タブ
            var tabSize = [
                self._palettes[0].block.getSize()[0],
                $f.keys(self._palettes).length * self._tabRowHeight // 行数*定数
            ];
            self._tab = cls.$blocks.PlainBlock.factory(tabSize);
            self._tab.style({ bg:'#99CCFF' });
            self.append(self._tab);
            self.chainDrawing(self._tab);

            // パレットスタック全体のサイズ
            self.size([
                tabSize[0],
                tabSize[1] + self._palettes[0].block.getSize()[1]
            ]);

            // パレット位置調整・サンプルブロック展開と・クリックイベント設定
            // !! 現在、パレットに収まらない場合は強制的にエラーになる !!
            $f.each(self._palettes, function(nouse, dat){
                // 位置調整
                dat.block.pos([tabSize[1], null]);
                // サンプルブロック展開
                var samples = self._board.createLayerSamples(dat.key);
                var seq = 0;
                $f.each(samples, function(bmOrBmgKey, sampleBlock){
                    var sq = dat.block.getSquare(seq);
                    sq.setLayerBlock('paint', sampleBlock);
                    // クリックイベント設定
                    sq.bindOnsquareclick(function(){
                        __DRAW_SELECT_PAINT(self, dat.key, bmOrBmgKey, sq);
                    });
                    seq += 1;
                });
            });

            // タブの操作ボタン群を設定
            $f.each(self._palettes, function(idx, dat){
                // 縦幅から少し引かないと少しハミ出てしまった
                var row = $('<div />').css({ marginLeft:5, fontSize:12,
                    lineHeight:self._tabRowHeight - 1 + 'px', height:self._tabRowHeight - 1 });
                var cb = $('<span />')
                    .css({ cursor:'pointer' })
                    .mousedown(function(){
                        dat.isDisplayed = !dat.isDisplayed;
                        __DRAW_DISPLAY_LAYERS(self, [idx]);
                    })
                    .appendTo(row)
                ;
                dat.displayOnoffView = cb;
                var button = $('<a href="javascript:void(0)" />')
                    .css({ marginLeft:3, fontWeight:'bold' })
                    .text(dat.key)
                    .mousedown(function(){
                        __DRAW_CHANGE_PALETTE(self, idx);
                    })
                    .appendTo(row)
                ;
                dat.selectButtonView = button;
                self._tab.getView().append(row);
            });

            // 初期アクティブタブ選択＆初期レイヤ表示反映
            __DRAW_CHANGE_PALETTE(self, self._mapEditor._defaultPaletteIndex);
            __DRAW_DISPLAY_LAYERS(self);
        };

        /** パレットを1枚生成する, 位置は後で設定する */
        function __CREATE_PALETTE(self){
            var palette = cls.$boards.PlainBoard.factory(
                self._mapEditor._paletteExtent, self._board.getSquareSize());
            palette.style({ bg:'#CCFFFF' });
            self.append(palette);
            self.chainDrawing(palette);
            palette.defineLayer('paint', 1);
            return palette;
        };

        /** 全パレットの選択中枠線を消す */
        function __CLEAR_CLOSING_LINES(self){
            $f.each(self._palettes, function(nouse, dat){
                dat.block.eachSquares(function(sq){ sq.clearClosingLine() });
            });
        };

        /** アクティブなパレットを変更する */
        function __DRAW_CHANGE_PALETTE(self, paletteIndex){
            var dat = self._palettes[paletteIndex];
            var key = dat.key;
            var b = dat.block;
            // 選択情報変更
            self._selectionData.key = key;
            self._selectionData.paintKey = null;
            __CLEAR_CLOSING_LINES(self);
            // 各パレット高さ調整・ボタン色変更
            $f.each(self._palettes, function(nouse, dat_){
                dat_.block.setZIndex(0);
                dat_.block.draw(false);
                dat_.selectButtonView.css({ backgroundColor:'transparent' });
            });
            b.setZIndex(1);
            b.draw(false);
            dat.selectButtonView.css({ backgroundColor:'#FFFF00' });
        };

        /** 絵の具を選択する */
        function __DRAW_SELECT_PAINT(self, key, paintKey, sq){
            self._selectionData.key = key;
            self._selectionData.paintKey = paintKey;
            __CLEAR_CLOSING_LINES(self);
            sq.drawClosingLine();
        };

        /** パレットデータから盤上のレイヤ表示切替をする, 同時にタブのチェックボックスも更新する
            @param paletteIndexes arr=操作対象とするパレットデータのインデックス, null=全て
            ! レイヤグループは非対応 */
        function __DRAW_DISPLAY_LAYERS(self, paletteIndexes){
            paletteIndexes = paletteIndexes || null;
            $f.each(self._palettes, function(paletteIndex, dat){
                // チェックへ反映
                if (dat.isDisplayed) {
                    dat.displayOnoffView.text('[+]');
                } else {
                    dat.displayOnoffView.text('[-]');
                };
                // 除外判定
                if (paletteIndexes !== null && !$f.inArray(paletteIndex, paletteIndexes)) return;
                // 全マスへ反映
                self._mapEditor._boardBlock.eachSquares(function(sq){
                    if (dat.isDisplayed) {
                        if (sq.hasLayerBlock(dat.key)) sq.getLayerBlock(dat.key).show(false);
                    } else {
                        if (sq.hasLayerBlock(dat.key)) sq.getLayerBlock(dat.key).hide(false);
                    };
                });
            });
        };

        /** 選択中情報を返す単なるアクセサ */
        qls.prototype.getSelectionData = function(){
            return this._selectionData;
        };

        /** 絵の具情報を消す */
        qls.prototype.clearPaintKey = function(){
            this._selectionData.paintKey = null;
            __CLEAR_CLOSING_LINES(this);
        };

        qls.factory = function(mapEditor, pos){
            var obj = cls.Block._factory.apply(this, [[1, 1], pos]); // サイズは後で変わる
            obj._mapEditor = mapEditor;
            __INITIALIZE(obj);
            return obj;
        };

        return qls;
    //}}}
    })();

    /** 対象マスへレイヤブロックを配置または削除する
        @param deleting true=削除しかしない falseがデフォ */
    function __UPDATE_BLOCK(self, square, deleting){
        if (deleting === undefined) deleting = false;
        // まず、同レイヤのブロックがあるなら削除する、その後絵の具選択があれば更新
        // 削除もココを通るので注意
        var s = self._paletteStackBlock.getSelectionData();
        if (square.hasLayerBlock(s.key)) { square.removeLayerBlock(s.key) };
        if (!deleting && s.paintKey !== null) {
            var block = square.setLayerBlock(s.key, s.paintKey);
            block.drawAndShow();// このブロックだけ操作しているのは、レイヤ別表示/非表示設定のため
        };
    };

    /** コマンドを追加する
        allbackは文字列で内部のメソッドを指定するが、初期化以外で指定することは想定してない */
    kls.prototype.addCommand = function(label, callback){
        var self = this;
        var buttonView = $('<a href="javascript:void(0)" />');
        var _callback;
        if (typeof callback === 'string') {
            _callback = this[callback];
        } else {
            var utils = {
                data: {}, // フリースペース
                button: buttonView,
                board: this._boardBlock,
                palette: this._paletteStackBlock,
                controller: this._controllerBlock//,
            };
            _callback = function(){ callback.apply(self, [utils]) };
        };
        this._controllerBlock.getView()
            .append(
                buttonView
                    .css({ fontSize:12, fontWeight:'bold', lineHeight:'13px'})
                    .text(label)
                    .bind('mousedown', {self:this}, _callback)
            ).append(// margin-rightだけだとChromeで自動改行しなかった, また &nbsp; でもNG
                $('<span> </span>')
            )
        ;
    };

    /** 盤情報をJSON形式にダンプして返す */
    kls.prototype.dumpBoardData = function(){
    //{{{
        var self = this;
        var json = {
            dumped_at: (new Date()).getTime(),
            extent: [this._boardBlock.getColumnCount(), this._boardBlock.getRowCount()],
            layers: {},
            squares: {}//,
        };
        // レイヤ
        $f.each(this._boardBlock.getLayers(), function(layerKey, layer){
            json.layers[layerKey] = {
                block_models: {},
                order: layer.getOrder()
            };
            var autoId = 1; // ダンプデータ内部で完結するID, データ軽量化対策
            $f.each(layer.getBlockModels(), function(blockModelKey, blockModelData){
                json.layers[layerKey].block_models[blockModelKey] = {
                    id: autoId
                };
                autoId += 1;
            });
        });
        /** レイヤキーとブロック原型キーから該当する自動IDを取得する */
        var _getAutoId = function(layerKey, blockModelKey){
            if (
                json.layers[layerKey] !== undefined &&
                json.layers[layerKey].block_models[blockModelKey] !== undefined
            ) {
                return json.layers[layerKey].block_models[blockModelKey].id;
            };
            // 本来発生しないけど一応
            throw new Error('RPGMaterial:MapEditor.dumpBoardData, invalid situation');
        };
        // マス
        // layer_key:',1,,,1,2,,1,2' のように出力する, 数値は自動ID, 無い場合は空
        // 行による改行はここでは行わず「広さ」データに任せる
        this._boardBlock.eachSquares(function(sq){
            $f.each(sq.getAllLayerData(), function(layerKey, layerData){
                var idStr = '';
                if (layerData.blockModelKey !== null) {
                    idStr = _getAutoId(layerKey, layerData.blockModelKey);
                };
                if (layerKey in json.squares === false) {
                    json.squares[layerKey] = idStr;
                } else {
                    json.squares[layerKey] += ',' + idStr;
                };
            });
        });
        return cls.JSONUtils.toJSON(json);
    //}}}
    };

    /** 本クラスからダンプしたJSONテキストまたはJSONデータの情報を解析して
        連結している盤インスタンスへその情報を展開する, 同時にデータが正しいかのチェックも行う
        @param json str=JSON形式テキスト || obj */
    kls.prototype.loadBoardData = function(json, isStrict){
        return kls.loadMapData(this._boardBlock, json, isStrict);
    };
    /** 外部から使うためにクラスメソッドにする
        そもそも上記のインスタンスメソッドにする必要もなくて改修経歴上そうなってるだけ */
    kls.loadMapData = function(board, json, isStrict){
    //{{{
        if (isStrict === undefined) isStrict = true;
        if (typeof json === 'string') {
            json = cls.JSONUtils.fromJSON(json);
        };
        if (isStrict) {
            // 広さチェック
            if (json.extent[0] !== board.getColumnCount() ||
                json.extent[1] !== board.getRowCount()) {
                throw new Error('RPGMaterial:MapEditor.loadMapData, not equired extent');
            };
            // レイヤチェック
            $f.each(board.getLayers(), function(layerKey, layer){
                if (layerKey in json.layers === false) {
                    throw new Error('RPGMaterial:MapEditor.loadMapData, not defined layerKey=`' + layerKey + '`');
                };
                if (layer.getOrder() !== json.layers[layerKey].order) {
                    throw new Error('RPGMaterial:MapEditor.loadMapData, different order, layerKey=`' + layerKey + '`');
                };
                $f.each(layer.getBlockModels(), function(bmk, nouse){
                    if (bmk in json.layers[layerKey].block_models === false) {
                        throw new Error('RPGMaterial:MapEditor.loadMapData, not defined blockModelKey=`' + bmk + '` in layerKey=`' + layerKey + '`');
                    };
                });
            });
        };
        /** 自動IDからブロック原型キーを取得する, id は num 型を渡すこと
            @return str || null=不明として処理する */
        var _getBlockModelKey = function(json, layerKey, id){
            var bmk = null;
            if (json.layers[layerKey] !== undefined ||
                json.layers[layerKey].block_models[blockModelKey] !== undefined) {
                $f.each(json.layers[layerKey].block_models, function(blockModelKey, data){
                    if (data.id === id) {
                        bmk = blockModelKey;
                        return false;
                    };
                });
                if (bmk !== null) return bmk;
            };
            if (isStrict) {// データが壊れている
                throw new Error('RPGMaterial:MapEditor.loadMapData, crushed map data');
            };
            return bmk;
        };
        // マスへレイヤブロックを設定しつつチェック
        board.eachSquares(function(sq){ sq.removeAllLayerBlocks() }); // 最初に全削除
        $f.each(board.getLayers(), function(layerKey, nouse){
            if (isStrict && layerKey in json.squares === false) {
                throw new Error('RPGMaterial:MapEditor.loadMapData, not defined layerKey=`' + layerKey + '` in json.squares');
            };
        });
        $f.each(json.squares, function(layerKey, squaresStr){
            var idStrs = squaresStr.split(','); //!! /,/ だと IE8 で /,/g と同じになるバグがある
            $f.each(idStrs, function(seq, idStr){
                if (idStr === '') return;
                var blockModelKey = _getBlockModelKey(json, layerKey, parseInt(idStr));
                if (blockModelKey === null) return;
                var sq = board.getSquare(seq);
                // レイヤキーが変わってる場合エラーになる
                try {
                    // !! グループ所属レイヤも単レイヤずつ入れているので通常NG
                    //    強制的にfalseを指定して実行してる
                    //    良くないけど、レイヤ全般がそもそもダメなのでその時直す
                    sq.setLayerBlock(layerKey, blockModelKey, false);
                } catch (err) {
                    if (isStrict) throw new Error(err);
                };
            });
        });
    //}}}
    };

    /** Allボタンハンドラ, 選択中ブロックを全マスへ設定する */
    kls.prototype._onallsquaresbutton = function(evt){
    //{{{
        var self = evt.data.self;
        if (confirm('OK?') === false) return false;
        self._boardBlock.eachSquares(function(sq){
            __UPDATE_BLOCK(self, sq);
        });
        return false;
    //}}}
    };

    /** AutoTilingボタンハンドラ, 境界線データを更新して再描画する */
    kls.prototype._onautotilingbutton = function(evt){
    //{{{
        var self = evt.data.self;
        self._boardBlock.syncAllBoundaryData();
        self._boardBlock.draw();
        return false;
    //}}}
    };

    /** Gridボタンハンドラ, 罫線と座標を表示する
        同じレイヤなので別々の機能にし難いし、する必要もなかった */
    kls.prototype._onshowgridbutton = function(evt){
    //{{{
        var self = evt.data.self;
        if (evt.data.shown === undefined) evt.data.shown = false; // 関数内のみ変数として使う
        self._boardBlock.eachSquares(function(sq){
            if (evt.data.shown === true) {
                sq.clearClosingLine();
                //sq.clearIndex();
            } else {
                sq.drawClosingLine({ color:'#CCC', opacity:0.75, borderWidth:1, borderStyle:'dashed' });
                //! drawClosingLine共通化対応のあおりで動かなくなった、使う時に直す
                //sq.drawIndex('#000');
            };
        });
        evt.data.shown = !evt.data.shown;
        return false;
    //}}}
    };

    /** Dumpボタンハンドラ, 盤情報をJSON化してコピペできるように表示する */
    kls.prototype._ondumpingdatabutton = function(evt){
    //{{{
        var self = evt.data.self;
        var json = self.dumpBoardData();
        var view = $('<div />')
            .css({ position:'absolute', top:0, left:0, width:200, height:50, zIndex:1 })
            .append(
                $('<textarea />').val(json).css({
                    position:'absolute', top:20, left:0, width:175, height:30, fontSize:9
                }).click(function(){ this.select() })
            )
            .append(
                $('<input type="button" value="Close" />').click(function(){ view.remove() })
            )
            .appendTo(self.getView())
        ;
        return false;
    //}}}
    };

    /** Loadボタンハンドラ, テキストエリアを表示してそこにJSON化した盤情報を貼り付けて
        データを展開することが出来るようにする */
    kls.prototype._onloadingdatabutton = function(evt){
    //{{{
        var self = evt.data.self;
        var textarea = $('<textarea />').css({
            position:'absolute', top:20, left:0, width:175, height:30, fontSize:9
        });
        var view = $('<div />')
            .css({ position:'absolute', top:0, left:0, width:200, height:50, zIndex:1 })
            .append(textarea)
            .append(
                $('<input type="button" value="Close" />').click(function(){ view.remove() })
            )
            .append(
                $('<input type="button" value="Load" />').click(function(){
                    var jsonText = $f.trimNewLineCharacters(textarea.val());
                    if (jsonText === '' || cls.JSONUtils.isJSON(jsonText) === false) {
                        alert('None or crushed map data');
                        return false;
                    };
                    if (confirm('OK?') === false) return false;
                    // 開発中はアラートが出ないようにする
                    try {
                        self.loadBoardData(jsonText);
                    } catch (nouse) {
                        if (confirm('Not strict data, do you retry not strict mode?') === false) return false;
                        try {
                            self.loadBoardData(jsonText, false);
                        } catch (lastErr) {
                            if (cls.debug) {
                                throw new Error(lastErr);
                            } else {
                                alert('Invalid map data, `' + lastErr + '`');
                            };
                        };
                    };
                    self._boardBlock.draw();
                    self._boardBlock.show();
                    view.remove();
                    return false;
                })
            )
            .appendTo(self.getView())
        ;
        return false;
    //}}}
    };

    /** 実行すると、一回でも盤を触っている場合はページ移動確認ダイアログを出すようにする
        ! IEの場合は不便なバグがあるので注意 ref) http://blogs.yahoo.co.jp/irons765/6688178.html */
    kls.prototype.enableBeforeunload = function(){
        this._isEnabledBeforeunload = true;
    };
    function __START_BEFOREUNLOAD(){
        $(window).bind('beforeunload', function(evt){
            return 'Leaving page?';
        });
    };

    /**
     * 生成メソッド
     *
     * サイズは盤インスタンスからの自動設定ではなく手動設定で決める
     * 自動設定にしなかったのは、パレットと盤の横幅だけならともかくも
     * 使えるレイヤやグループ数からパレットの縦幅までも自動計算しないと正確にならない点から
     * 正確に必要最小サイズを算出できないならやらない方がマシ
     *
     * 引数:
     * board          Boardインスタンス
     *
     * オプション:
     * paletteExtent       パレットの広さ, [列数, 行数]
     * ignoreLayerKeys     パレットに表示しないレイヤリスト, 単レイヤのみ指定可能
     * defaultPaletteIndex 初期表示するパレットインデックス
     */
    kls._factory = function(size, pos, board, options){
        var opts = options || {};
        var obj = cls.Block._factory.apply(this, [size, pos]);
        obj._boardBlock = board;
        if ('paletteExtent' in opts) obj._paletteExtent = opts.paletteExtent;
        if ('ignoreLayerKeys' in opts) obj._ignoreLayerKeys = opts.ignoreLayerKeys;
        if ('defaultPaletteIndex' in opts) obj._defaultPaletteIndex = opts.defaultPaletteIndex;
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();

/** 単純なマップエディタクラス */
cls.$mapEditors.PlainMapEditor = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.MapEditor());
    kls.factory = function(){
        return cls.MapEditor._factory.apply(this, arguments);
    };
    return kls;
//}}}
})();


/** 抽象基底チップクラス */
cls.Chip = (function(){
//{{{
    var kls = function(){

        this.__objectLabel__ = 'Chip';

        /** 画像表示用のメインビュー */
        this._imageBodyView_ = null;

        /**
         * チップ画像設定
         *
         * '<任意のキー>': {
         *     type: '<画像表示処理種別>',
         *     url: '<画像URL>',
         *     fullSize: [<画像全体のサイズ>],
         *     clipPos: [<クリップ位置>],
         *     clipSize: <null||サイズ>,
         * }
         *
         * - type は以下の通り, デフォルト 'normal'
         *  'normal' = 画像をクリップ位置からブロックサイズ分表示
         *  'repeat' = 画像を要素サイズに合わせて繰り返し表示
         *  'resize' = 画像を要素サイズに合わせて拡大・縮小, imgタグによる自動拡大縮小処理で行う
         *  'auto_tiling' = マップチップ用オートタイリング処理で表示
         * - clipSize は 'repeat' と 'resize' 時は設定必須
         *   'normal' は強制的にブロックサイズが使われ、'auto_tiling' は自動
         * - __default__ キーの値が基本となる
         * - 別種を設定した場合は __default__ に別種情報を上書きしたものが最終的な値として使われる
         * - nameの文字列は任意だが, 画像の意味を標準化する予定なので
         *   ユーザが自由に設定できるのは、今後 /[-_a-zA-Z0-9]+/ にする予定
         */
        this._variationName_ = '__default__';
        this._variationData_ = undefined;

        /** オートタイリング用の境界線情報
            [上, 右上隅, 右, 右下隅, 下, 左下隅, 左, 左上隅]
            へ、それぞれ境界があるかを 0 or 1 で表現する */
        this._boundaryData_ = null;

        /** オートタイリング時の同種判定時に、特定方向の判定を 1=同種 0=別種 null=設定無し で固定する
            データは3x3の二次元配列、createBoundaryData 参照, 中心は設定しても無視される */
        this._fixedSameTiles_ = null;
    };
    $f.inherit(kls, new cls.Block());

    function __INITIALIZE(self, imageData){
        self.__view__.addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'chip');
        self._variationData_ = {
            '__default__': {
                type: 'normal',
                url: undefined,
                fullSize: undefined,
                clipPos: undefined,
                clipSize: null
            }
        };
        $f.extend(self._variationData_.__default__, imageData);
        // オートタイルなら境界線情報を初期化
        // ! 前は自動初期化せずに明示初期化を強制していたが
        //   オートタイルだけその処理が必要になると「どんなブロックでも引数に取れる」
        //   方向性に反するので止めた
        if (self.isAutoTile()) self.setBoundaryData();
    };

    kls.prototype._validateChip_ = function(){
        var errMsg = 'RPGMaterial:Chip._validateChip_, invalid initializing';
        var type = this._variationData_.__default__.type;
        if ($f.inArray(type, ['normal', 'repeat', 'resize', 'auto_tiling']) === false) {
            throw new Error(errMsg + ', wrong type=`' + type + '`');
        };
        var k, prop;
        for (k in this._variationData_.__default__) {
            prop = this._variationData_.__default__[k];
            if (prop === undefined) {
                throw new Error(errMsg + ', variationData');
            };
            if ($f.inArray(type, ['repeat', 'resize'])
                && k === 'clipSize' && prop === null) {
                throw new Error(errMsg + ', variationData.clipSize must set for \'repeat\' or \'resize\' type');
            };
        };
    };

    kls.prototype._draw = function(){
        cls.Block.prototype._draw.apply(this);
        this.drawChipBody();
    };
    /** 画像本体を描画する */
    kls.prototype.drawChipBody = function(){
        var self = this;

        var variationData = this._getVariationData_(this._variationName_);
        var type = variationData.type;

        // 'normal'と'repeat'時に使うので共通化
        var variationDataToCSSProps = function(variationData){
            return {
                position: 'absolute',
                backgroundImage: 'url(' + variationData.url + ')',
                top: -variationData.clipPos[0],
                left: -variationData.clipPos[1],
                width: variationData.fullSize[0],
                height: variationData.fullSize[1]
            };
        };

        // 初期化的処理, 生成直後や画像処理種別が変わった場合にはここから再描画
        if (this._imageBodyView_ === null) {
            // 通常はdiv背景画像で画像を表示
            if (type === 'normal') {
                this._imageBodyView_ = $('<div />')
                    .css({
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundPosition: 'left top',
                        backgroundRepeat: 'no-repeat'
                    })
                ;
            // オートタイリングと繰り返しの場合は単なる枠
            } else if (type === 'auto_tiling' || type === 'repeat') {
                this._imageBodyView_ = $('<div />')
                    .css({
                        position: 'absolute',
                        top: 0,
                        left: 0
                    })
                ;
            // 拡大・縮小の場合はimgタグを使う
            } else if (type === 'resize') {
                this._imageBodyView_ = $('<img />')
                    .css({
                        position: 'absolute',
                        display: 'block'
                    })
                ;
            };
            this._imageBodyView_.appendTo(this.__view__);
        };


        // 通常
        if (type === 'normal') {
            this._imageBodyView_.css(variationDataToCSSProps(variationData));
        // 繰り返し
        } else if (type === 'repeat') {
            this._imageBodyView_.empty();
            var coords = $f.squaring(variationData.clipSize, this.getSize());
            $f.each(coords, function(nouse, coord){
                self._imageBodyView_.append(
                    $('<div />').css({
                        position: 'absolute',
                        top: coord[0],
                        left: coord[1],
                        width: variationData.clipSize[0],
                        height: variationData.clipSize[1],
                        overflow: 'hidden'
                    }).append(
                        $('<div />').css(variationDataToCSSProps(variationData))
                    )
                );
            });
        // 拡大縮小
        } else if (type === 'resize') {
            // クリップサイズとブロックサイズの比率を求める
            // 大きければ拡大、小さければ縮小となる
            var ratios = [
                this.__width__ / variationData.clipSize[0], // 横幅比率
                this.__height__ / variationData.clipSize[1] // 縦幅比率
            ];
            // 比率を反映して画像ビューをリサイズ
            // ! 端数処理はテキトウなの、resizeオプションは基本的に端数が出ないようにする
            var fullSize = [
                parseInt(variationData.fullSize[0] * ratios[0]),
                parseInt(variationData.fullSize[1] * ratios[1])
            ];
            // 元画像拡大縮小後のクリップポイントリスト [上, 右, 下, 左]
            var p = [
                parseInt(variationData.clipPos[0] * ratios[1]),
                parseInt((variationData.clipPos[1] + variationData.clipSize[0]) * ratios[0]),
                parseInt((variationData.clipPos[0] + variationData.clipSize[1]) * ratios[1]),
                parseInt(variationData.clipPos[1] * ratios[0])
            ];
            // セレクタ文字列化
            var clipSelector = 'rect(' + p.join('px ') +'px)';
            // 画像の位置, 切り抜き表示位置が左上に来るように調整
            // この辺何やってるかわからんなら下記参照
            // ref) http://kjirou.net/main/public/ml/tests/img_clip/index.html
            var pos = [
                -p[0],
                -p[3]
            ];
            this._imageBodyView_
                .attr('src', variationData.url)
                .css({
                    top: pos[0],
                    left: pos[1],
                    width: fullSize[0],
                    height: fullSize[1],
                    clip: clipSelector
                })
            ;
        // オートタイリング
        } else if (type === 'auto_tiling') {
            if (this._boundaryData_ === null) {// 境界線データ未設定
                throw new Error('RPGMaterial:Chip._drawImageBodyView_, invalid situation, none boundary data');
            };
            this._imageBodyView_
                .css({
                    width: this.getSize()[0],
                    height: this.getSize()[1]
                }).empty()
            ;
            // [左上, 右上, 右下, 左下] の順にパーツ座標が収まっている
            var posses = cls.ImageProtocol.parseBoundaryData(this._boundaryData_);
            $f.each(posses, function(i, pos){
                var partDisplayView = $('<div />').css({
                    position: 'absolute',
                    top: (i === 0 || i === 1)? 0: 16,
                    left: (i === 0 || i === 3)? 0: 16,
                    width: 16,
                    height: 16,
                    overflow: 'hidden'
                });
                var absImgPos = [
                    variationData.clipPos[0] + pos[0],
                    variationData.clipPos[1] + pos[1]
                ];
                var partImageView = $('<div />').css({
                    position: 'absolute',
                    backgroundImage: 'url(' + variationData.url + ')',
                    top: -absImgPos[0],
                    left: -absImgPos[1],
                    width: variationData.fullSize[0],
                    height: variationData.fullSize[1],
                    backgroundPosition: 'left top',
                    backgroundRepeat: 'no-repeat'
                });
                partImageView.appendTo(partDisplayView);
                partDisplayView.appendTo(self._imageBodyView_);
            });
        };
    };

    /** チップ設定を取得する */
    kls.prototype._getVariationData_ = function(variationType){
        var variation = {};
        $f.extend(variation, this._variationData_['__default__']);
        if (variationType !== '__default__') {// 別種設定による上書き
            $f.extend(variation, this._variationData_[variationType]);
        };
        return variation;
    };

    /** 別種設定をする
        ! 前はoverride可能にしてたががやっぱダメ
          clone時に自動で呼ばれるため引数の意味が変わると誤った値を設定しちゃう */
    kls.prototype.addVariation = function(name, props){
        if (typeof props !== 'object') {//! 以前に似たAPIが有ったため付けた, 今は無くても良い
            throw new Error('RPGMaterial:Chip.addVariation, invalid parameter');
        };
        // 現在、画像処理種別は別名で変更できない, 対応は難しくないが保留, 必要になったら
        // 対応する場合のメモ
        // 1. addVariation時に type 別に必要な情報が揃っているかのバリデーション
        //    ついでに、初期化時の入力チェックと整合性を持たせて、存在しないキーを更新できないようにする
        // 2. type変更時は _imageBodyView_ の土台から再生成が必要になるので
        //    _variationName_ の値を変える前に、前状態のtypeと違うのかのフラグをどこかに持たす
        if ('type' in props) {
            throw new Error('RPGMaterial:Chip.addVariation, sorry, chip image type is not changable now');
        };
        this._variationData_[name] = props;
    };

    /** 画像を別種に変える／描画も行う */
    kls.prototype.changeVariation = function(name){
        if (this.hasVariation(name) === false) {
            throw new Error('RPGMaterial:Chip.changeVariation, not defined variation-name=`' + name + '`');
        };
        this._variationName_ = name;
    };
    kls.prototype.drawChangeVariation = function(name){
        this.changeVariation(name);
        this.drawChipBody();
    };

    /** 現在選択中の別種名を返す */
    kls.prototype.getVariationName = function(){
        return this._variationName_;
    };

    /** 設定されている画像別種名リスト／チップ画像名リストを返す */
    kls.prototype.getVariationNames = function(){
        return $f.keys(this._variationData_);
    };

    /** 画像別種／チップ画像があるかを判定する */
    kls.prototype.hasVariation = function(name){
        return $f.inArray(name, this.getVariationNames());
    };

    /** オートタイルかを判定する */
    kls.prototype.isAutoTile = function(){
        return this._getVariationData_(this._variationName_).type === 'auto_tiling';
    };

    /** オートタイリング処理時に必要な境界線データを設定する
        引数無しで四方境界線の状況を設定する */
    kls.prototype.setBoundaryData = function(value){
        if (value === undefined) value = [1, 0, 1, 0, 1, 0, 1, 0];
        if (// 複雑なデータなので検証しとく
            // ex) [1,0,0,0,0,1,0,0], 1 は [7][0] 含めて2個連続しないはず
            value instanceof Array === false ||
            value.length !== 8 ||
            $f.collect(value, function(i, v){ if (typeof v !== 'number') return v }).length > 0 ||
            /11/.test(value.join('')) ||
            value[0] && value[7]
        ) {
            throw new Error('RPGMaterial:Chip.setBoundaryData, invalid parameter, value=`' + value + '`');
        };
        this._boundaryData_ = value;
    };

    /** 同種判別方向固定設定をする／反映をする */
    kls.prototype.setFixedSameTiles = function(value){
        if (
            value instanceof Array === false ||
            value.length !== 3 ||
            value[0].length !== 3 || value[1].length !== 3 || value[2].length !== 3
        ) {
            throw new Error('RPGMaterial:Chip.setFixedSameTiles, invalid parameter, value=' + value);
        };
        this._fixedSameTiles_ = value;
    };
    kls.prototype.applyFixedSameTiles = function(sameTiles){
        var self = this;
        if (this._fixedSameTiles_ === null) return;
        $f.each(this._fixedSameTiles_, function(ri, row){
            $f.each(row, function(ci, val){
                if (ri === 1 && ci === 1) return; // 中心は除外
                if (val === 0) {
                    sameTiles[ri][ci] = 0;
                } else if (val === 1) {
                    sameTiles[ri][ci] = 1;
                };
            });
        });
    };

    kls.prototype._cloneData = function(newObj){
        cls.Block.prototype._cloneData.call(this, newObj);
        var data = cls.JSONUtils.deepcopy(this._variationData_);
        delete data.__default__;
        var k;
        for (k in data) {
            newObj.addVariation(k, data[k]);
        };
        newObj.changeVariation(this._variationName_);
        if (this.isAutoTile()) {
            newObj.setBoundaryData(cls.JSONUtils.deepcopy(this._boundaryData_));
        };
        if (this._fixedSameTiles_ !== null) {
            newObj.setFixedSameTiles(cls.JSONUtils.deepcopy(this._fixedSameTiles_));
        };
    };

    kls._factory = function(size, position, imageData){
        var obj = cls.Block._factory.apply(this, [size, position]);
        __INITIALIZE(obj, imageData);
        obj._validateChip_();
        return obj;
    };

    return kls;
//}}}
})();

/** 単種一回アニメーション付与チップMixinクラス */
cls.SingleAnimatedChipMixin = (function(){
//{{{
    //
    // 必須手動拡張:
    // _initializeSingleAnimatedChipMixin
    // _removeSingleAnimatedChipMixin
    //
    var kls = function(){
        /** ChipAnimationインスタンス */
        this._chipAnimation = undefined;

        //
        // 単にアクセサ群を提供するだけのクラスで、もしかして無い方がいいかもしれん
        // 作っちゃったので一応使ってみるけど、邪魔になったら消す
        // と思ったが、_remove時の削除同期が入ってるから要るかも
        //
    };

    kls.prototype._initializeSingleAnimatedChipMixin = function(chipAnimation){
        this._chipAnimation = chipAnimation;
    };

    kls.prototype._removeSingleAnimatedChipMixin = function(){
        if (
            this.isFinishedAnimation() === false &&
            this._chipAnimation.getThread().isStarted()
        ) {
            this.stopAnimation();
        };
    };

    kls.prototype.startAnimation = function(){
        this._chipAnimation.run();
    };

    kls.prototype.pauseAnimation = function(){
        this._chipAnimation.pause();
    };

    kls.prototype.restartAnimation = function(){
        this._chipAnimation.rerun();
    };

    kls.prototype.stopAnimation = function(){
        this._chipAnimation.getThread().stop();
    };

    kls.prototype.isFinishedAnimation = function(){
        return this._chipAnimation.getThread().isFinished();
    };

    kls.prototype.getAnimation = function(){
        return this._chipAnimation;
    };

    return kls;
//}}}
})();

/** 単純なチップクラス */
cls.$chips.PlainChip = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Chip(), cls.Chip);

    kls.prototype._clone = function(){
        var obj = kls.factory(
            this.getSize(),
            this.getPos(),
            this._variationData_.__default__
        );
        cls.Chip.prototype._cloneData.call(this, obj);
        return obj;
    };

    kls.factory = kls._factory;

    return kls;
//}}}
})();

/** キャラクターチップクラス */
cls.$chips.CharacterChip = (function(){
//{{{
    var kls = function(){

        /** 現在の絶対方向値 */
        this._direction = 0;

        /** 現在の姿勢値 */
        this._pose = 1;

        /** 今の足踏み中姿勢番号 */
        this._stampIndex = 0;

        /** 一歩分の距離, デフォルトはブロック横幅 */
        this._paceDistance = undefined;

        /** 一歩分の距離を歩く際に掛かる時間(ms) */
        this._paceTime = 333;

        /** 一歩内で何回足踏みを進めるか, 通常は2 */
        this._paceStampCount = 2;
    };
    $f.inherit(kls, new cls.Chip());

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'characterchip';

    /** 絶対方向の意味マップ, variationキーとしても使っている
        キャラチップ仕様に合わせるとSWENの順が自然だが
        相対的な方向計算がやり易いので回転方向と数値を連続させている */
    var __DIRECTION_MAP = {
        0: 'south',
        1: 'west',
        2: 'north',
        3: 'east'
    };

    /** 相対方向(キャラクターの向きからの方向)の意味マップ
        もし値を変える場合は +1 による角度変化を絶対方向の変化と合わす必要がある
        今は +1=90度時計回り, この辺りに慎重なのは8方向対応も有り得るため */
    var __RELATIVE_DIRECTION_MAP = {
        0: 'front',
        1: 'right',
        2: 'back',
        3: 'left'
    };

    /** 姿勢の意味マップ, variationキーとしても使っている
        ! 'leftside'と'rightside'は画像の位置で左か右かということ
          右足前や左足前が決まってるのかと思ったら画像によってまちまち
          かつ、列内でも右足前と左足前が混在している、ちびキャラツクール画像でもそう */
    var __POSE_MAP = {
        0: 'leftside',
        1: 'stand',
        2: 'rightside'
    };

    /** 足踏みアニメのための姿勢変更順序, 最後になったら最初に戻る */
    var __STAMP_POSES = [1, 0, 1, 2];

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._paceDistance = self.getWidth();
    };

    // 各種描画処理
    // ! 各処理について基本は別個に描画を行わない、大抵は移動しつつ足踏みしたりするので
    //   同フレームに2状態の変更が有った場合に2回描画することになって無駄だから
    //   割と速度に関係する点なので、ここは利便性より重視する
    kls.prototype._draw = function(){
        cls.Chip.prototype._draw.apply(this);
        this.drawCharacterBody();
    };
    /** キャラ本体を描画する */
    kls.prototype.drawCharacterBody = function(){
        __CHANGE_BODY(this);
        this.drawChipBody();
    };
    /** 向きと姿勢を反映してキャラ画像別種を設定する */
    function __CHANGE_BODY(self){
        var vname = __DIRECTION_MAP[self._direction] + '-' + __POSE_MAP[self._pose];
        self.changeVariation(vname);
    };

    /** 向きを絶対方向で指定する, 現在は数値指定のみ */
    kls.prototype.point = function(value){
        this._direction = value;
        if (this._direction in __DIRECTION_MAP === false) {
            throw new Error('RPGMaterial:CharacterChip.point, not defined direction=' + this._direction);
        };
    };

    /** 向きを相対方向で指定する, 現在は数値指定のみ */
    kls.prototype.turn = function(value){
        this.point((this._direction + value) % 4);
    };

    /** 姿勢を相対方向で指定する, 現在は数値指定のみ */
    kls.prototype.pose = function(value){
        this._pose = value;
        if (this._pose in __POSE_MAP === false) {
            throw new Error('RPGMaterial:CharacterChip.turn, not defined pose=' + this._pose);
        };
    };

    /** 足踏みアニメを1コマ進める */
    kls.prototype.stamp = function(){
        this._stampIndex = (this._stampIndex + 1) % __STAMP_POSES.length;
        this.pose(__STAMP_POSES[this._stampIndex]);
    };

    /**
     * 座標指定で移動する
     *
     * @param endIndex arr=終点の位置
     * @param duration num=アニメーション時間(ms)
     * @param stepInterval num=足踏みアニメ一コマの時間(ms) || undefined|null=足踏み無し
     * @param options:
     *          maxStepCount:
     * @return deferred
     */
    kls.prototype.runMoving = function(endIndex, duration, stepInterval, options){
        var self = this;
        var opts = options || {};
        // 未定義で0になってしまうとヤバそうなので弾く、ついでに小さ過ぎる値も
        if (typeof duration !== 'number' || duration < cls.STABLE_INTERVAL) {
            throw new Error('RPGMaterial:CharacterChip.move, invalid duration=' + duration);
        };
        if (stepInterval === undefined || stepInterval === null) {
            stepInterval = null;
        } else {
            stepInterval = $f.withinNum(stepInterval, cls.STABLE_INTERVAL); //! 小さ過ぎる値を排除
        };

        // 最大足踏み回数, 1歩=2足踏み の想定だが、ラグでずれて 3足踏み になってしまうための対処
        //! ただし、稀に逆の足踏み不足になる点については未対応。完了時に立ち状態に戻すと良い
        var maxStepCount = ('maxStepCount' in opts)? opts.maxStepCount: null;

        //! 絶対座標配置時は、親も含めてshowされてないと出発点座標が[0,0]になってしまう
        //  わかり難いバグなので、メモ的にエラーを返すようにする
        //  もし、隠しつつアニメしたかったらvisibilityを併用する必要がある
        //! マルチ環境時に邪魔になるなら条件分岐で飛ばすこと
        if (this.getView().is(':visible') === false) {
            throw new Error('RPGMaterial:CharacterChip.move, please show view before animate');
        };

        //! stopは必要になったら定義する
        var thread = ThreadManager.factoryClient('RPGMaterial.CharacterChip.move', true);
        thread.start();
        var nextStepTime = 0;
        var stepCount = 0;
        var startTime = (new Date()).getTime();

        this.animate({
            top: endIndex[0],
            left: endIndex[1]
        }, {
            easing: 'linear',
            duration: duration,
            complete: function(){
                self.pos(endIndex);
                thread.complete();
            },
            step: function(){
                var executionTime = (new Date()).getTime() - startTime; // 実行してからの時間
                // 足踏み判定
                if (stepInterval !== null &&
                    (maxStepCount === null || stepCount < maxStepCount)  &&
                    nextStepTime <= executionTime
                ) {
                    nextStepTime += stepInterval;
                    self.stamp();
                    self.drawCharacterBody();
                    stepCount += 1;
                };
            }
        });

        return thread.getDeferred();
    };

    /** 歩数を指定して前後左右のいずれかへ歩く
        @param paceCount num=歩数
        @param rd num=相対方向, 動きとしては 前進 or カニ歩き or 後ずさり になる
        @param options:
                 paceTime: 一歩の間隔, 詳細はコンストラクタ参照
                 paceStampCount: 一歩内での足踏み数, コンストラクタ参照
        @return deferred */
    kls.prototype.walk = function(paceCount, rd, options){
        var opts = options || {};
        paceCount = paceCount || 1;
        rd = rd || 0;
        var paceTime = ('paceTime' in opts)? opts.paceTime: this._paceTime;
        var paceStampCount = ('paceStampCount' in opts)? opts.paceStampCount: this._paceStampCount;

        // 次位置を計算
        var oper = __GET_DIRECTION_OPERATOR(this._direction, rd);
        var nextPos = [
            this.getTop() + this._paceDistance * paceCount * oper[0],
            this.getLeft() + this._paceDistance * paceCount * oper[1]
        ];
        // 合計アニメ時間
        var totalPaceTime = paceTime * paceCount;
        // 足踏み時間の間隔
        var stepInterval = paceTime / paceStampCount;
        // アニメ開始
        return this.runMoving(nextPos, totalPaceTime, stepInterval, {
            maxStepCount: paceCount * paceStampCount
        });
    };
    /** 向きと相対方向から座標計算用の演算子セットを返す
        @param ad int=絶対方向
        @param rd int=相対方向
        @return arr [<top用演算子>, <left用演算子>] それぞれ 0 || 1 || -1 */
    function __GET_DIRECTION_OPERATOR(ad, rd){
        // 南を向いて相対方向へ移動した場合の座標上の変化方向を示すマップ
        var operators = {
            0: [1, 0],  // 南を向いて前へ移動
            1: [0, -1], // 南を向いて右へ移動
            2: [-1, 0], // 南を向いて後へ移動
            3: [0, 1]   // 南を向いて左へ移動
        };
        return operators[(ad + rd) % 4];
    };
    /** 倍速で歩く, walkのショートカット関数 */
    kls.prototype.dash = function(/* args passing */){
        var opts = arguments[2] || {};
        opts.paceTime = this._paceTime / 2;
        return this.walk(arguments[0], arguments[1], opts)
    };
    /** 半分の速度で歩く, walkのショートカット関数 */
    kls.prototype.amble = function(/* args passing */){
        var opts = arguments[2] || {};
        opts.paceTime = this._paceTime * 2;
        return this.walk(arguments[0], arguments[1], opts)
    };

    /**
     * 道に沿って進む
     *
     * @param steps arr 道となる座標リスト [[x1, y1], ... [xn, yn]]
     *              ex) [[0, 0], [0, 1], [-1, 1], [-1, 2]]
     *              次座標へは縦横1マスの距離しか移動できない, 斜め移動も不可
     * @param directionMap obj 「次座標 - 現座標」結果である [0,1] [1,0] [-1,0] [0,-1] が
     *                         絶対方向のどれに相当するのかのマップ
     *                         ex) 数学的な [x, y] 座標体系の場合
     *                             { 0: [0, -1], // 南は y - 1
     *                               1: [-1, 0],
     *                               2: [0, 1],
     *                               3: [1, 0]  }
     * @param options:
     *   moveMethodName: 'walk' || 'dash' || 'amble'
     * @return deferred
     */
    kls.prototype.followPath = function(steps, directionMap, options){
        var opts = options || {};
        var moveMethodName = ('moveMethodName' in opts)? opts.moveMethodName: 'walk';

        // あるマスの次のマス位置を示す差分リスト
        // 各要素は [0,1][1,0][-1,0][0,-1] のいずれかになる
        var deltas = [];
        var i;
        for (i = 0; i < steps.length - 1; i++) {
            deltas.push([
                steps[i + 1][0] - steps[i][0],
                steps[i + 1][1] - steps[i][1]
            ]);
        };
        // 上記差分それぞれが絶対方向のどれになるのかへ変換する関数
        var _trans = function(delta){
            var k;
            for (k in directionMap) {
                if (delta[0] === directionMap[k][0] && delta[1] === directionMap[k][1]) {
                    return k;
                };
            };
            // 同じ座標を連続して入れてしまうことが良くある
            throw new Error('RPGMaterial:CharacterChip.followPath, invalid steps or directionMap');
        };
        // 歩き開始
        var d = new Deferred();
        var idx = 0;
        var self = this;
        (function(idx){
            // 特に_transエラーが捕まえられないのでtry/catchする
            try {
                var thisFunc = arguments.callee;
                var nextAd = _trans(deltas[idx]);
                var nextRd = __GET_RD_BY_ADS(self._direction, nextAd);
                self.turn(nextRd);
                self.drawCharacterBody();
                self[moveMethodName](1, 0).next(function(){
                    idx += 1;
                    if (idx < deltas.length) {
                        thisFunc(idx);
                    } else {
                        d.call();
                    };
                });
            } catch (err) {
                //!! 開発用エラーハンドラを使ってるので後で使う時に使用を止める
                //   throw new Error でダメなら考える
                cls.catchError(err);
            };
        })(idx);
        return d;
    };
    /** 絶対方向2が絶対方向1からみてどの相対方向になるのかを算出する */
    function __GET_RD_BY_ADS(ad1, ad2){
        var rd = ad2 - ad1;
        if (rd < 0) rd += 4;
        return rd;
    };

    /** その場足踏みを行う, @return deferred
        options:
          duration: num=マイクロ秒, 初期値はほぼ永続する時間
          interval: 足踏み間隔, 初期値は500, 見た目で決めた */
    kls.prototype.live = function(options){
        var self = this;
        var opts = options || {};
        var duration = ('duration' in opts)? opts.duration: 86400 * 1000;
        var interval = ('interval' in opts)? opts.interval: 500;
        var anim = cls.$animations.PlainIteratedAnimation.factory(function(counter){
            self.stamp();
            self.drawCharacterBody();
        }, ~~(duration / interval), interval);
        anim.run();
        return anim.getThread().getDeferred();
    };

    /** キャラチップ画像URLを返す */
    kls.prototype.getImageUrl = function(){
        return this._variationData_.__default__.url;
    };
    /** キャラチップ画像を変更する */
    kls.prototype.changeImage = function(url){
        $f.each(this._variationData_, function(vname, dat){
            if ('url' in dat) dat.url = url;
        });
    };

    kls.prototype._clone = function(){
        var self = this;
        var obj = kls.factoryBy3x4(
            this._variationData_.__default__.url,
            this.getSize(),
            this.getPos()
        );
        cls.Chip.prototype._cloneData.call(this, obj);
        //! 浅いコピーだけなのでオブジェクトコピる際は要改修
        var props = '_direction _pose _stampIndex _paceDistance _paceTime _paceStampCount'.split(' ');
        $f.each(props, function(nouse, propName){
            obj[propName] = self[propName];
        });
        return obj;
    };


    /**
     * 横3縦4型画像からの生成関数
     *
     * - 後で他形式に対応した時に困りそうなので"factory"では無くしている
     * - __INITIALIZEではなくてここで色々やっているのはChip生成引数に
     *   imageDataを入れなければいけない関係上
     * - 複数画像を別個に別種登録して１つの画像にすることも出来ない
     *   現状changeImage時に一括変換が必要になっているため
     *
     * @param characterSize サイズ || null or undefined(default)=[32, 32]
     */
    kls.factoryBy3x4 = function(url, characterSize, pos){
        characterSize = characterSize || [32, 32];

        var imageSize = [characterSize[0] * 3, characterSize[1] * 4];
        var img = cls.ImageIndexer.factory();
        img.upload('tmp', url, imageSize, characterSize);

        var obj = cls.Chip._factory.apply(this, [characterSize, pos, img.get('tmp', 2)]);
        obj.addVariation('south-leftside', img.get('tmp', 1));
        obj.addVariation('south-stand', img.get('tmp', 2));
        obj.addVariation('south-rightside', img.get('tmp', 3));
        obj.addVariation('west-leftside', img.get('tmp', 4));
        obj.addVariation('west-stand', img.get('tmp', 5));
        obj.addVariation('west-rightside', img.get('tmp', 6));
        obj.addVariation('east-leftside', img.get('tmp', 7));
        obj.addVariation('east-stand', img.get('tmp', 8));
        obj.addVariation('east-rightside', img.get('tmp', 9));
        obj.addVariation('north-leftside', img.get('tmp', 10));
        obj.addVariation('north-stand', img.get('tmp', 11));
        obj.addVariation('north-rightside', img.get('tmp', 12));

        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();

/** ウィンドウ用ポーズサインチップクラス */
cls.$chips.WindowPauseSignChip = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Chip(), cls.Chip);
    $f.mixin(kls, new cls.SingleAnimatedChipMixin(), cls.SingleAnimatedChipMixin);

    kls.prototype._initializeWindowPauseSignChip = function(){
        var chipAnimation = cls.$chipAnimations.GobackChipAnimation.factory(this, -1, 166);
        this._initializeSingleAnimatedChipMixin(chipAnimation);
        chipAnimation.getThread().addTag('window_pause_sign_chip');
    };

    kls.prototype._remove = function(){
        cls.Chip.prototype._remove.apply(this);
        this._removeSingleAnimatedChipMixin();
    };

    kls.factoryByImageProtocol = function(protocolName, position /*, var args */){
        var obj;
        var protocol = cls.ImageProtocol.get(protocolName);
        if (protocolName === 'rpg_tkool_vx') {
            var url = arguments[2];
            var size = protocol.window_.parts.pause_sign_1[1];
            var imgFullSize = protocol.window_.size;
            var imgPosition = protocol.window_.parts.pause_sign_1[0];
            var obj = this._factory(size, position, {
                url: url,
                fullSize: imgFullSize,
                clipPos: imgPosition
            });
            obj.addVariation('$goback$4$1@', {});
            obj.addVariation('$goback$4$2@', {
                clipPos: protocol.window_.parts.pause_sign_2[0],
                clipSize: protocol.window_.parts.pause_sign_2[1]
            });
            obj.addVariation('$goback$4$3@', {
                clipPos: protocol.window_.parts.pause_sign_3[0],
                clipSize: protocol.window_.parts.pause_sign_3[1]
            });
            obj.addVariation('$goback$4$4@', {
                clipPos: protocol.window_.parts.pause_sign_4[0],
                clipSize: protocol.window_.parts.pause_sign_4[1]
            });
        };
        obj._initializeWindowPauseSignChip();
        return obj;
    };

    return kls;
//}}}
})();


/** 抽象基底ウィンドウクラス */
cls.Window = (function(){
//{{{
    var kls = function(){

        this.__objectLabel__ = 'Window';

        /** コンテンツエリアブロック */
        this._windowContentBlock_ = undefined;

        /** 枠の太さ, 現在は上下左右共通 */
        this._frameWidth_ = 16;

        /* ウィンドウ画像データ
           現在は {imageType:'auto', url:'<画像URL>'} のみ対応 */
        this._imageData_ = undefined;

        /** コンテンツ部分を除く体裁部分のブロックパーツ群
            チップの繰り返し指定をするためにBlockである必要がある */
        this._partBlocks_ = undefined;

        /** 全てのパーツを生成せずに_contentBlock_のみを配置して返すオプション
            処理が重いため、開発中は動的生成して本番は背景画像化することがあったり
            そもそも規格外の背景へ変えたい時などに使う */
        this._noneAllParts_ = false;

        /** 背景2部分を生成しないオプション, 性能対策と要素の重なりを減らして描画を早くする趣旨
            なお、背景1部分まで消してしまうと、大抵は枠が16px未満なので空きが出来てしまう */
        this._noneBackground2_ = false;
    };
    $f.inherit(kls, new cls.Block());

    kls.ZINDEX_PAUSE_SIGN = 200;
    kls.ZINDEX_WINDOW_CONTENT = 100;
    kls.ZINDEX_FRAME_PARTS = 20;
    kls.ZINDEX_BG2_PARTS = 11;
    kls.ZINDEX_BG1_PARTS = 10;

    kls.prototype._initializeWindow_ = function(){
        var self = this;

        this.__view__.addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'window');

        // コンテンツエリア
        this._windowContentBlock_ = cls.$blocks.PlainBlock.factory(
            [this._calculateSideLength_('horizontal'), this._calculateSideLength_('vertical')],
            [this._frameWidth_, this._frameWidth_]
        );
        this._windowContentBlock_.setZIndex(kls.ZINDEX_WINDOW_CONTENT);
        this._windowContentBlock_.show();
        this.append(this._windowContentBlock_);
        this.chainDrawing(this._windowContentBlock_.__objectId__);

        // 各パーツの位置・サイズデータを生成
        var partsBaseData = {
            topLeft: [
                [this._frameWidth_, this._frameWidth_],
                [0, 0],
                kls.ZINDEX_FRAME_PARTS
            ],
            topRight: [
                [this._frameWidth_, this._frameWidth_],
                [0, this.__width__ - this._frameWidth_],
                kls.ZINDEX_FRAME_PARTS
            ],
            bottomRight: [
                [this._frameWidth_, this._frameWidth_],
                [this.__height__ - this._frameWidth_, this.__width__ - this._frameWidth_],
                kls.ZINDEX_FRAME_PARTS
            ],
            bottomLeft: [
                [this._frameWidth_, this._frameWidth_],
                [this.__height__ - this._frameWidth_, 0],
                kls.ZINDEX_FRAME_PARTS
            ],
            topSide: [
                [this._calculateSideLength_('horizontal'), this._frameWidth_],
                [0, this._frameWidth_],
                kls.ZINDEX_FRAME_PARTS
            ],
            rightSide: [
                [this._frameWidth_, this._calculateSideLength_('vertical')],
                [this._frameWidth_, this.__width__ - this._frameWidth_],
                kls.ZINDEX_FRAME_PARTS
            ],
            bottomSide: [
                [this._calculateSideLength_('horizontal'), this._frameWidth_],
                [this.__height__ - this._frameWidth_, this._frameWidth_],
                kls.ZINDEX_FRAME_PARTS
            ],
            leftSide: [
                [this._frameWidth_, this._calculateSideLength_('vertical')],
                [this._frameWidth_, 0],
                kls.ZINDEX_FRAME_PARTS
            ],
            background1: [
                [this.__width__ - 4, this.__height__ - 4],
                [2, 2],
                kls.ZINDEX_BG1_PARTS
            ],
            background2: [
                [this.__width__ - 4, this.__height__ - 4],
                [2, 2],
                kls.ZINDEX_BG2_PARTS
            ]//,
        };

        // 各パーツの画像に関するデータを生成
        // !! 今は imageType が 'auto' の設定をベタ書きしている !!
        var partsImageData = {
            topLeft: [[0, 64], [16, 16], 'normal'],
            topRight: [[0, 112], [16, 16], 'normal'],
            bottomRight: [[48, 112], [16, 16], 'normal'],
            bottomLeft: [[48, 64], [16, 16], 'normal'],
            topSide: [[0, 80], [32, 16], 'repeat'],
            rightSide: [[16, 112], [16, 32], 'repeat'],
            bottomSide: [[48, 80], [32, 16], 'repeat'],
            leftSide: [[16, 64], [16, 32], 'repeat'],
            background1: [[0, 0], [64, 64], 'resize'],
            background2: [[64, 0], [64, 64], 'repeat']
        };

        if (this._noneAllParts_ === false) {
            // 各パーツブロックを生成
            this._partBlocks_ = {};
            $f.each(partsBaseData, function(partId, baseData){

                // 背景無しオプション
                if (self._noneBackground2_ && partId === 'background2') {
                    return;
                };

                var imageData = partsImageData[partId];

                var size = baseData[0];
                var clipPos = baseData[1];
                var zIndex = baseData[2];

                // urlとfullSizeは'auto'の場合を直接記述している
                // 本来はpartsImageData生成時にパーツ別に設定する
                var chipSettings = {
                    type: imageData[2],
                    url: self._imageData_.url,
                    fullSize: [128 ,128],
                    clipPos: imageData[0]
                };
                if ($f.inArray(imageData[2], ['repeat', 'resize'])) {
                    chipSettings.clipSize = imageData[1];
                };

                // 用意した枠に背景としてChipオブジェクトを生成して入れる
                var chip = cls.$chips.PlainChip.factory(size, clipPos, chipSettings);
                chip.setZIndex(zIndex);
                chip.setUnchainedDrawing(true);
                self._partBlocks_[partId] = chip;
            });

            // 各パーツを土台へ追加・描画
            // 以後変化しないので一度だけ描画すれば良い
            $f.each(this._partBlocks_, function(partId, block){
                self.append(block);
                block.drawAndShow();
            });
        };
    };

    kls.prototype._validateWindow_ = function(){
        // サイズ指定有り、かつ枠の2倍以上の幅が無ければエラー
        if (
            this.__width__ === null ||
            this.__height__ === null ||
            this.__width__ < this._frameWidth_ * 2 ||
            this.__height__ < this._frameWidth_ * 2
        ) {
            throw new Error('RPGMaterial:Window._validateWindow_, invalid factory');
        };
    };

    /** 隅を抜いた一辺の長さを計算する
        @param direction 'horizontal' || 'vertical' */
    kls.prototype._calculateSideLength_ = function(direction){
        if (direction === 'horizontal') {
            return this.__width__ - this._frameWidth_ * 2;
        } else if (direction === 'vertical') {
            return this.__height__ - this._frameWidth_ * 2;
        };
        throw new Error('RPGMaterial.Window._calculateSideLength, invalid parameter');
    };

    /** ポーズサインを生成する, 配置は最下部中央 */
    kls.prototype._createPauseSign = function(){
        var chip = cls.$chips.WindowPauseSignChip.factoryByImageProtocol(
            'rpg_tkool_vx',
            null,
            this._imageData_.url
        );
        chip.pos([
            this.__height__ - chip.getSize()[1],
            parseInt(this.__width__ / 2 - chip.getSize()[0] / 2)
        ]);
        chip.setZIndex(kls.ZINDEX_PAUSE_SIGN);
        return chip;
    };

    /** コンテンツエリアブロックへのアクセサ */
    kls.prototype.getContentBlock = function(){
        return this._windowContentBlock_;
    };

    /**
     * options:
     *   noneAllParts   : true=全てのパーツを生成しない
     *   noneBackground2: true=背景部分のパーツを生成しない
     */
    kls._factory = function(size, pos, imageData, options){
        var opts = options || {};
        var obj = cls.Block._factory.apply(this, [size, pos]);
        obj._imageData_ = imageData;
        if (opts.noneAllParts === true) obj._noneAllParts_ = true;
        if (opts.noneBackground2 === true) obj._noneBackground2_ = true;
        obj._initializeWindow_();
        obj._validateWindow_();
        return obj;
    };

    return kls;
//}}}
})();

/** 単純なウィンドウクラス */
cls.$windows.PlainWindow = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Window());
    kls.factory = function(){
        return cls.Window._factory.apply(this, arguments);
    };
    /** ツクールVX仕様のウィンドウチップを解釈して生成する */
    kls.factoryByVX = function(url, size, pos, options){
        return cls.Window._factory.apply(this, [size, pos, {
            imageType: 'auto',
            url: url
        }, options]);
    };
    return kls;
//}}}
})();

/** メッセージウィンドウクラス */
cls.$windows.MessageWindow = (function(){
//{{{
    var kls = function(){
        this._doneDrawOne = false;
        /** メッセージ部分のブロック */
        this._messageBlock = undefined;
        /** ポーズサインチップ */
        this._pauseSignChip = undefined;
        /** 初回会話開始時に文字送りまでに一瞬入る間隔(ms), 表示からすぐ文字が進むと不自然なため */
        this._startingInterval = 500;
    };
    $f.inherit(kls, new cls.Window());
    $f.mixin(kls, new cls.OpenAndCloseBlockMixin());

    function __INITIALIZE(self, messageBlockFactoryArgs){
        // 終了後クリックで閉じる設定を追加
        $f.extend(messageBlockFactoryArgs[5], {
            onfinalclick: function(){
                self.close();
            }
        });
        // メッセージ部分
        self._messageBlock = cls.$blocks.MessageBlock.factory.apply(
            cls.$blocks.MessageBlock,
            messageBlockFactoryArgs
        );
        self._windowContentBlock_.append(self._messageBlock);
        self._windowContentBlock_.chainDrawing(self._messageBlock);
        self._messageBlock.show();
        // ポーズサイン
        self._pauseSignChip = self._createPauseSign();
        self.append(self._pauseSignChip);
        self._pauseSignChip.drawAndShow();
        // メッセージとポーズサインを連携
        self._messageBlock.__onparagraphstartHandler = function(){
            self._pauseSignChip.hide();
            self._pauseSignChip.pauseAnimation();
        };
        self._messageBlock.__onparagraphfinishHandler = function(){
            self._pauseSignChip.restartAnimation();
            self._pauseSignChip.show();
        };
    };

    /** メッセージを追加する, 単なる MessageBlock.addParagraph のアクセサ */
    kls.prototype.addMessage = function(/* args passing */){
        return this._messageBlock.addParagraph.apply(this._messageBlock, arguments);
    };

    /** メッセージを開始する
        !! スキップボタンを付ける場合はTalkWindow.startTalk を参照 !! */
    kls.prototype.startMessage = function(/* args passing */){
        var self = this;
        var args = arguments;
        this._pauseSignChip.hide();
        this._pauseSignChip.startAnimation();
        setTimeout(function(){
            self._messageBlock.runNextParagraph.apply(self._messageBlock, args);
        }, this._startingInterval);
    };

    kls._factory = function(size, position, windowOptions, messageBlockFactoryArgs){
        var obj = cls.Window._factory.apply(this, [size, position, windowOptions]);
        obj._initializeOpenAndCloseBlockMixin();
        __INITIALIZE(obj, messageBlockFactoryArgs);
        return obj;
    };

    /** 直近プロジェクトのための生成ルーチン */
    kls.factoryForMe = function(url, pos){
        // 横幅 = 16 + 8 + 372 + 8 + 16 = 400
        // 縦幅 = 16 + 8 +  96 + 8 + 16 = 144
        // という構成, 16は窓枠太さ, 8はパディング, 352x96がメッセージブロックサイズ
        var size = [420, 144]; // 会話ウィンドウと共通サイズにする
        var obj = this._factory(size, pos, {
            imageType: 'auto',
            url: url
        }, [
            46, 15, // 15px * (46 / 2)文字 = 345 * 係数
            4, 24, // 24px * 4行 = 96
            [8, 8],
            {
                //width: 352,
                height: 96,
                autoCleaning: true
            }
        ]);
        return obj;
    };

    return kls;
//}}}
})();

/** 会話ウィンドウクラス */
cls.$windows.TalkWindow = (function(){
//{{{
    var kls = function(){

        /** 顔グラ用の枠ブロック */
        this._faceChipDisplayBlock = undefined;
        /** メッセージ部分のブロック */
        this._messageBlock = undefined;
        /** ポーズサインチップ */
        this._pauseSignChip = undefined;
        /** 初回会話開始時に文字送りまでに一瞬入る間隔(ms), 表示からすぐ文字が進むと不自然なため */
        this._startingInterval = 500;

        /**
         * アクターマップ
         *
         * '<アクターID>': {
         *     faceChip:  <PlainChipインスタンス>,
         * }
         */
        this._actors = undefined;

        /** アニメーション有効フラグ, 現在はポーズサインについてのみ
            性能対策のため */
        this._enableAnimation = true;
    };
    $f.inherit(kls, new cls.Window());
    $f.mixin(kls, new cls.OpenAndCloseBlockMixin());

    kls.prototype._initializeTalkWindow = function(messageBlockFactoryArgs){
        var self = this;
        this._actors = {};
        // 顔グラ用枠
        this._faceChipDisplayBlock = cls.$blocks.PlainBlock.factory([96, 96], [8, 8]);
        this._windowContentBlock_.append(this._faceChipDisplayBlock);
        this._faceChipDisplayBlock.draw();
        this._faceChipDisplayBlock.show();
        // 終了後クリックで閉じる設定を追加
        $f.extend(messageBlockFactoryArgs[5], {
            onfinalclick: function(){
                self.close();
            }
        });
        // メッセージ部分
        this._messageBlock = cls.$blocks.MessageBlock.factory.apply(
            cls.$blocks.MessageBlock,
            messageBlockFactoryArgs
        );
        this._windowContentBlock_.append(this._messageBlock);
        this._windowContentBlock_.chainDrawing(this._messageBlock.getBlockId());
        this._messageBlock.show();
        // ポーズサイン
        this._pauseSignChip = this._createPauseSign();
        this.append(this._pauseSignChip);
        this._pauseSignChip.draw();
        this._pauseSignChip.show();
    };

    /** 参加するアクターを登録する */
    kls.prototype.entryActor = function(actorId, faceChip){
        this._actors[actorId] = {
            faceChip: faceChip
        };
        this._faceChipDisplayBlock.append(faceChip);
    };

    /** 会話を追加する */
    kls.prototype.addTalk = function(actorId, variationName, text, paragraphOptions){
        var self = this;
        if (actorId in this._actors === false) {
            throw new Error('RPGMaterial:$windows.TalkWindow, not entryed actorId=`' + actorId + '`');
        };

        // 段落オプションのonstartとonfinishを使って顔グラ変更やポーズサイン設定をしている
        // なので、引数指定のonstart/onfinish はその中へ埋め込む
        var paragraphOptions = paragraphOptions || {};
        var onstart = function(){};
        if ('onstart' in paragraphOptions) {
            onstart = paragraphOptions.onstart;
            delete paragraphOptions.onstart;
        };
        var onfinish = function(){};
        if ('onfinish' in paragraphOptions) {
            onfinish = paragraphOptions.onfinish;
            delete paragraphOptions.onfinish;
        };
        var fixedOptions = {
            onstart: function(){
                var myFace = self._actors[actorId].faceChip;
                myFace.changeVariation(variationName);
                myFace.draw();
                myFace.show();
                $f.each(self._actors, function(nouse, actor){// 自分を除く他の人の顔を非表示にする
                    if (actor.faceChip !== myFace) actor.faceChip.hide();
                });
                self._pauseSignChip.hide();
                if (self._enableAnimation) {
                    self._pauseSignChip.pauseAnimation();
                };
                onstart();
            },
            onfinish: function(){
                if (self._enableAnimation) {
                    self._pauseSignChip.restartAnimation();
                };
                self._pauseSignChip.show();
                onfinish();
            }
        };
        $f.extend(paragraphOptions, fixedOptions);

        this._messageBlock.addParagraph(text, paragraphOptions);
    };

    /** 会話を開始する
        ! messageBlock.skipMessages によるスキップボタンを付ける場合は、この開始前に
          スキップボタンを押せるようにしないこと、ポーズボタンアニメ初期化をしないことや
          以下のsetTimeoutがスキップ中に開始されることで(_isOutputting=falseのタイミングに割りこまれる)
          二重の不具合になる */
    kls.prototype.startTalk = function(callback){
        var self = this;
        callback = callback || function(){};
        this._pauseSignChip.hide();
        if (this._enableAnimation) {
            this._pauseSignChip.startAnimation();
        };
        setTimeout(function(){
            callback();
            self._messageBlock.runNextParagraph();
        }, this._startingInterval);
    };

    /** メッセージブロックを返す, 単なるアクセサ */
    kls.prototype.getMessageBlock = function(){
        return this._messageBlock;
    };

    /** アニメーションを無効にする */
    kls.prototype.disableAnimation = function(){
        this._enableAnimation = false;
    };

    kls._factory = function(size, position, windowOptions, messageBlockFactoryArgs){
        var obj = cls.Window._factory.apply(this, [size, position, windowOptions]);
        obj._initializeOpenAndCloseBlockMixin();
        obj._initializeTalkWindow(messageBlockFactoryArgs)
        return obj;
    };

    /** 直近プロジェクトのための生成ルーチン */
    kls.factoryForMe = function(url, pos, options){
        var opts = options || {};
        var messageBlockOpts = {
            autoCleaning: true
        };
        if ('outputtingMode' in opts) messageBlockOpts.outputtingMode = opts.outputtingMode;
        if ('interval' in opts) messageBlockOpts.interval = opts.interval;
        // 横幅 = 16 + 8 + 96 + 8 + 268 + 8 + 16 = 420
        // 縦幅 = 16 + 8 +  96 + 8 + 16 = 144
        var size = [420, 144]; // メッセージウィンドウと共通サイズにする
        var obj = this._factory(size, pos, {
            imageType: 'auto',
            url: url
        }, [
            34, 15, // 15px * (34 / 2)文字 = 255 * 係数
            4, 24, // 24px * 4行 = 96
            [8, 112],
            messageBlockOpts
        ]);
        return obj;
    };

    return kls;
//}}}
})();


/** 抽象基底ダイアログクラス */
cls.Dialog = (function(){
//{{{
    //
    // Windowを継承しないのは以下の理由から, 特に1
    // 1.ウィンドウは生成直後にサイズが決まるので、いったんサイズ情報を保留にしたかった
    //   そもそも、MessageWindowやTalkWindowがWindowを継承しているのが間違っているっぽい
    // 2.フィルタがセットで必要で、フィルタはダイアログと親子関係に出来ない
    // 3.背景がウィンドウじゃない場合もできるかもしれない
    //
    // 残りタスク:
    // - フィルタ用クリックハンドラ
    // - 内容だけorボタンだけのダイアログを可能にする, 今は両方ある前提
    // - getPosOverを使った追加場所とはことなるブロックを起点にした位置決め
    //   「ゲーム画面内の一部であるメインスクリーンの中央」に出す場合に使うはず
    // - ボタン間の間隔を指定することでのボタンサイズの自動設定
    // - ボタンマウスオーバー時にウィンドウチップの > を出す
    //
    var kls = function(){
        this.__objectLabel__ = 'Dialog';
        /** 背景用ウィンドウ */
        this._win_ = undefined;
        this._windowImageData_ = undefined;
        this._noneWindow_ = false;// 暫定Window用オプション
        this._noneWindowBackground2_ = false;// 暫定Window用オプション
        /** 内容本体／ブロック
            内容がブロックの場合は両方同じ値になる, 今はブロックのみ */
        this._content_ = null;
        this._contentBlock_ = null;
        /** ボタンデータ, 各値={ buttonId:'<任意キー>', label:'<ラベル>' } */
        this._buttonData_ = undefined;
        /** ボタン格納用ブロック */
        this._buttonFrame_ = null;
        /** ボタン整列タイプ, 並び順だけでなく余白やカーソル位置なども変わる
            'flat'=横並び中央寄せ || 'list'(未実装)=選択肢式,縦並び左寄せ */
        this._buttonSortType_ = 'flat';
        /** ボタンサイズ */
        this._buttonSize_ = undefined;
        /** ボタン余白, [上, 右, 下, 左], 今は上下以外不使用 */
        this._buttonSpacing_ = undefined;
        /** 操作抑止フィルター, block || null=未設定 */
        this._filter_ = null;
        /** 最後に選択したボタンID, str || null=未選択状態
            外部からの被参照用に使う, イベント内では evt.data.buttonId を使用 */
        this.selectedButtonId = null;
        /** ウィンドウを閉じ始めているか, 連打対策 */
        this._isClosed = false;
    };
    $f.inherit(kls, new cls.Block());
    $f.mixin(kls, new cls.OpenAndCloseBlockMixin());

    function __INITIALIZE(self){
        self.__view__.addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'dialog');
        self.setZIndex(1); // フィルタを下に入れるため最低でも1にする
        self._windowImageData_ = {
            url: null
        };
        self._buttonData_ = [];
        self.addButton('ok', 'OK');
        self._buttonSize_ = [100, 24];// 横幅300px程度を想定
        self._buttonSpacing_ = [8, 0, 8, 0];
    };

    // 初期設定スタイル, 色は文字が白を想定
    kls.BUTTON_STYLES = {};
    kls.BUTTON_STYLES.FLAT_DEFAULT = { color: '#FAFAFA', fontSize:14,
            letterSpacing:0, textAlign:'center', cursor:'pointer', border:'1px solid #FAFAFA' };

    /** ウィンドウ画像用データを設定する, 現在はURLのみ */
    kls.prototype.setWindowImageData = function(url){
        this._windowImageData_.url = url;
    };

    /** 内容を設定する, @param content 今はBlockインスタンスのみ */
    kls.prototype.setContent = function(content){
        this._content_ = content;
    };

    /** ボタンサイズを設定する,　単なるアクセサ */
    kls.prototype.setButtonSize = function(value){
        this._buttonSize_ = value;
    };

    /** ボタン間隔を設定する,　単なるアクセサ */
    kls.prototype.setButtonSpacing = function(value){
        this._buttonSpacing_ = value;
    };

    /** ブロック群を生成する, draw前に行う
        初期化時に行わないのは、動的幅・位置調整が複雑、ブロック生成処理を含むので重い という点から
        分けた方が便利だと判断したため */
    kls.prototype.initializeBlocks = function(){
        var self = this;
        // 枠を除く横幅
        //   内容があればそちらに, 内容が無ければボタンサイズに合わせる・・・ようにしたいが
        //   今は内容必須なので無意味になってる
        var contentWidth = null;
        // 内容
        if (this._content_ instanceof cls.Block) {// 今はブロックのみ
            this._contentBlock_ = this._content_;
            this._contentBlock_.getView().addClass(cls.$consts.CSS_SELECTOR_PREFIX + 'content_block');
            contentWidth = this._contentBlock_.getWidth();
        } else {
            //! 今は内容が無い場合には未対応
            throw new Error('RPGMaterial:Dialog.initializeBlocks, invalid content=' + this._content_);
        };
        if (this._contentBlock_ === null) {// 今は内容が無い場合はNG
            throw new Error('RPGMaterial:Dialog.initializeBlocks, none content');
        };
        // ボタン
        var buttonCount = this._buttonData_.length;
        var buttonSpacing;
        if (buttonCount > 0) {
            // 'flat', 左右やボタン間余白は、横幅とボタンサイズから自動的に決まる
            if (this._buttonSortType_ === 'flat') {
                // ボタン枠
                this._buttonFrame_ = cls.$blocks.PlainBlock.factory([
                    contentWidth,
                    this._buttonSize_[1] + this._buttonSpacing_[0] + this._buttonSpacing_[2]
                ], [ this._contentBlock_.getHeight(), 0 ]);
                this._buttonFrame_.drawAndShow();
                // 各ボタン
                $f.each(this._buttonData_, function(idx, dat){
                    // 横幅からボタン数分の幅を除いた残り, マイナスへは現在未対応で一律0にしている
                    var totalSpacing = $f.withinNum(contentWidth - self._buttonSize_[0] * buttonCount, 0);
                    var oneSpacing = parseInt(totalSpacing / (buttonCount+1));
                    // ボタンブロック
                    var block = cls.$blocks.PlainBlock.factory(self._buttonSize_, [
                        self._buttonSpacing_[0],
                        idx * self._buttonSize_[0] + (idx + 1) * oneSpacing
                    ]);
                    self._buttonFrame_.append(block);
                    block.style($f.extend({ lineHeight:self._buttonSize_[1]+'px'}, kls.BUTTON_STYLES.FLAT_DEFAULT));
                    block.text(dat.label);
                    dat.block = block;
                    block.drawAndShow();
                    block.getView().bind('mousedown',
                        {dialog:self, buttonId:dat.buttonId, buttonData:dat}, self._onbuttonclick);
                });
            };
        };
        if (this._buttonFrame_ === null) {// 今はボタンが無い場合もNG
            throw new Error('RPGMaterial:Dialog.initializeBlocks, none buttons');
        };
        // ウィンドウ枠
        this._win_ = cls.$windows.PlainWindow.factoryByVX(
            this._windowImageData_.url,
            [contentWidth+16*2, this._contentBlock_.getHeight()+this._buttonFrame_.getHeight()+16*2],
            null,
            { noneAllParts:this._noneWindow_, noneBackground2:this._noneWindowBackground2_ }
        );
        this._win_.getContentBlock().append(this._contentBlock_);
        this._win_.getContentBlock().append(this._buttonFrame_);
        // 全体枠
        this.append(this._win_);
        this.size(this._win_.getSize());
    };

    /** 内容部分のブロックを返す, 単なるアクセサ */
    kls.prototype.getContentBlock = function(){
        if (this._contentBlock_ === undefined) {// 未初期化
            throw new Error('RPGMaterial:Dialog.getContentBlock, not executed initializeBlocks');
        };
        return this._contentBlock_;
    };

    // ボタン設定
    /** ボタンを追加する, @param buttonId ユニークキー,重複時はエラー */
    kls.prototype.addButton = function(buttonId, label){
        if (this.getButton(buttonId) !== null) {
            throw new Error('RPGMaterial:Dialog.addButton, already defined buttonId=' + buttonId);
        };
        this._buttonData_.push({
            buttonId: buttonId,
            label: label,
            block: null
        });
    };
    /** ボタン設定を全て消す */
    kls.prototype.clearButtons = function(){
        this._buttonData_ = [];
    };
    /** ボタンデータをキー指定で返す, @return dict || null=無い場合 */
    kls.prototype.getButton = function(buttonId){
        var i;
        for (i = 0; i < this._buttonData_.length; i++) {
            if (this._buttonData_[i].buttonId === buttonId) { return this._buttonData_[i] };
        };
        return null;
    };

    // 操作抑止フィルタ
    /** 操作抑止フィルタ用ブロックを返す, 単なるアクセサ */
    kls.prototype.getFilter = function(){
        return this._filter_;
    };
    /** 親ブロックまたは指定するブロックに操作抑止フィルタを貼る
        z-indexはダイアログ-1になる, 色を付ける場合はgetFilterで抽出して操作する
        showは設定タイミングと表示タイミングは普通異なるので手動設定する */
    kls.prototype.drawFilter = function(belongingBlock){
        belongingBlock = belongingBlock || this.__parentBlock__;
        if (belongingBlock === undefined || belongingBlock === null) {
            throw new Error('RPGMaterial:Dialog.drawFilter, not set belongingBlock');
        };
        var filter = cls.$blocks.PlainBlock.factory(belongingBlock.getSize());
        belongingBlock.append(filter);
        filter.setZIndex(this.getZIndex() - 1);
        filter.bindDisablingContextmenu();
        filter.draw();
        this._filter_ = filter;
        return filter;
    };

    // OpenAndCloseBlockMixin関係
    kls.prototype._open = function(){
        this._win_.drawAndShow();
        this._contentBlock_.drawAndShow();
        if (this._filter_ !== null) this._filter_.show();
    };
    kls.prototype._close = function(){
        this._isClosed = true;
        if (this._filter_ !== null) this._filter_.remove();
    };

    /** ボタンクリックハンドラを設定する */
    kls.prototype.setOnbuttonclick = function(callback){
        this.__onbuttonclick = callback;
    };
    /** ボタンクリックハンドラ, __は処理本体で更新用, _はbind用 */
    kls.prototype.__onbuttonclick = function(evt){
        var dialog = evt.data.dialog;
        dialog.close();
        // ex) 以下ボタン別処理例
        //var buttonId = evt.data.buttonId;
        //if (buttonId === 'ok') {
        //};
    };
    kls.prototype._onbuttonclick = function(evt){
        var dialog = evt.data.dialog;
        if (dialog._isClosed) return false;
        //! close内でdeferred.callをしているので、選択中ボタンIDはその前に格納する必要がある
        dialog.selectedButtonId = evt.data.buttonId;
        dialog.__onbuttonclick(evt);
        return false;
    };

    /**
     * options:
     *     noneWindow: true=ウィンドウの各パーツ画像を出さない,ウィンドウ自体は配置される
     */
    kls._factory = function(options){
        var opts = options || {};
        var obj = cls.Block._factory.apply(this, []);
        if ('noneWindow' in opts) obj._noneWindow_ = opts.noneWindow;
        obj._initializeOpenAndCloseBlockMixin();
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();

/** 単純なダイアログクラス */
cls.$dialogs.PlainDialog = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Dialog());
    kls.factory = cls.Dialog._factory;
    return kls;
//}}}
})();


/** 抽象基底アニメーションクラス */
cls.Animation = (function(){
//{{{
    var kls = function(){

        /** オブジェクトID, 1からの連番で生成毎に加算 */
        this.__objectId__ = undefined;

        /** ThreadManager.Clientオブジェクト */
        this.__thread__ = undefined;

        /** 次のsetTimeoutキューのID
            更新する場合は常に最新の未実行キューのIDが入るようにする */
        this._timerId = null;

        /** ポーズ中フラグ */
        this.__isPaused__ = false;
    };

    var __CURRENT_OBJECT_ID = 0;

    function __INITIALIZE(self){
        self.__objectId__ = (__CURRENT_OBJECT_ID += 1);
        self.__thread__ = ThreadManager.factoryClient('RPGMaterial.Animation', true);
        self.__thread__.bind('stop', {self:self}, self._onstop);
        self.__thread__.addTag('animation');
    };

    /** アニメーションを開始する, _付きをoverride, @return deferred */
    kls.prototype._run = function(){
        throw new Error('RPGMaterial:Animation._run, not implemented');
    };
    kls.prototype.run = function(){
        // 独立性担保のため実行時引数は取れなくする, 他メソッドも同様
        // 当インスタンスを何かに渡して後で何かが任意のタイミングで実行するという形式をとりたいから
        if (arguments.length > 0) {
            throw new Error('RPGMaterial:Animation.run, can\'t set args');
        };
        this.__thread__.start();
        this._run();
        return this.__thread__.getDeferred();
    };

    /** アニメーション内容を直接更新する単なるアクセサ, 継承時の上書きでは使わない */
    kls.prototype.bindOnrun = function(callback){
        this._run = callback;
    };

    /** アニメーションをポーズする, 必要なら_付きをoverride
        ここではポーズフラグをON/OFFにするだけで具体的な処理は各クラスに任せている
        空ループさせてるだけでもいいのだが、IEだとそれでも結構重いので要注意 */
    kls.prototype._pause = function(){
    };
    kls.prototype.pause = function(){
        if (arguments.length > 0) {
            throw new Error('RPGMaterial:Animation.pause, can\'t set args');
        };
        // clearTimeoutはポーズ処理には絶対必要
        // 例えば、run->pause1->rerun1->pause2->rerun2 を高速実行すると
        // runとrerun1の初巡が発生しない内にrerun2まで行い、キューのスレッドが3本立ってしまう
        if (this._timerId !== null) clearTimeout(this._timerId);
        this._pause();
        this.__isPaused__ = true;
    };

    /** アニメーションのポーズを解除する, 必要なら_付きをoverride */
    kls.prototype._rerun = function(){
        this._run.apply(this, arguments);
    };
    kls.prototype.rerun = function(){
        if (arguments.length > 0) {
            throw new Error('RPGMaterial:Animation.rerun, can\'t set args');
        };
        if (this.isPaused()) {
            this.__isPaused__ = false;
            this._rerun();
        };
    };

    /** 正常終了時に呼ぶ, 必要なら_付きをoverride */
    kls.prototype._complete = function(){
    };
    kls.prototype.complete = function(){
        if (arguments.length > 0) {
            throw new Error('RPGMaterial:Animation.complete, can\'t set args');
        };
        this._complete();
        this.__thread__.complete();
    };

    /** 強制停止時のハンドラ, 必要なら_stopをoverride */
    kls.prototype._stop = function(){
    };
    kls.prototype._onstop = function(evt){
        var self = evt.data.self;
        if (this._timerId !== null) clearTimeout(this._timerId);
        self._stop();
    };

    /** スレッドインスタンスを返す */
    kls.prototype.getThread = function(){
        return this.__thread__;
    };

    /** ポーズフラグを返す */
    kls.prototype.isPaused = function(){
        return this.__isPaused__;
    };

    kls._factory = function(){
        var obj = new this();
        __INITIALIZE(obj);
        return obj;
    };
    //! 即実行するrunに対応するのは基本止めた
    //  アニメーションインスタンスを保持して任意のタイミングで実行する形式を重視したいため

    return kls;
//}}}
})();

/** 繰り返し表現付与アニメーションMixinクラス */
cls.IteratedAnimationMixin = (function(){
//{{{
    //
    // 必須手動拡張:
    // _initializeIteratedAnimationMixin
    // _runIteratedAnimationMixin (必須ではないがほぼ使う)
    // __oniterate
    //
    var kls = function(){
        /** 繰り返し回数, 0以上の整数, -1は無限 */
        this._maxIterationCount = -1;
        this._currentIterationCount = 0;
        /** 繰り返し間隔(ms), 秒数と間違えて高速無限ループをさせそうなので
            FASTEST_INTERVAL 以下の場合は実行時エラーになる */
        this._iterationInterval = 1000;
        /** 前回の繰り返し処理のreturn値 */
        this._preResult = undefined;
    };

    kls.prototype._initializeIteratedAnimationMixin = function(){
        this.getThread().addTag(this.__objectId__.toString());
    };

    // ! ポーズ機能が欲しい

    /** 通常はそのまま _run へ代入する */
    kls.prototype._runIteratedAnimationMixin = function(){
        var self = this;
        this._timerId = setTimeout(function(){
            if (self.getThread().isFinished()) return;
            if (self.isPaused()) return;

            // ループが早過ぎるとエラー, 恐らく秒数と間違っているため
            if (self._iterationInterval < cls.$consts.FASTEST_INTERVAL) {
                throw new Error('RPGMaterial:IteratedAnimationMixin._runIteratedAnimationMixin, invalid setting, running interval too fast');
            };

            self._currentIterationCount += 1;
            self._oniterate();

            // 終了判定はoniterateの後にする, 前だと終了するまでにもう1ループ分の時間が掛かるから
            if (self._maxIterationCount !== -1 &&
                self._currentIterationCount === self._maxIterationCount) {
                self.complete();
                return;
            };

            self._timerId = setTimeout(arguments.callee, self._iterationInterval);
        }, 1);
    };

    /** 繰り返しイベントハンドラ, __付きをoverride, data.result にて前回のreturn結果を受け取る */
    kls.prototype.__oniterate = function(counter, data){
        throw new Error('RPGMaterial:IteratedAnimationMixin.__oniterate, not implemented');
        //return result
    };
    kls.prototype._oniterate = function(){
        var data = {
            result: this._preResult
        };
        this._preResult = this.__oniterate(this._currentIterationCount, data);
    };

    return kls;
//}}}
})();

/** 単純なアニメーションクラス */
cls.$animations.PlainAnimation = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Animation(), cls.Animation);
    kls.factory = kls._factory;
    return kls;
//}}}
})();

/** 単純な繰り返しアニメーションクラス */
cls.$animations.PlainIteratedAnimation = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.Animation(), cls.Animation);
    $f.mixin(kls, new cls.IteratedAnimationMixin(), cls.IteratedAnimationMixin);
    kls.prototype._run = kls.prototype._runIteratedAnimationMixin;
    kls.factory = function(oniterate, count, interval){
        var obj = cls.Animation._factory.apply(this);
        obj._initializeIteratedAnimationMixin();
        obj.getThread().addTag('plain_iterated_animation');
        obj.__oniterate = oniterate;
        obj._maxIterationCount = count;
        obj._iterationInterval = interval;
        return obj;
    };
    return kls;
//}}}
})();

/** ブロック点滅アニメーションクラス */
cls.$animations.BlinkAnimation = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.$animations.PlainIteratedAnimation());
    /** blockOrView ビューも可
        count 表示or非表示回数, 2回で1点滅になる
        options.interval 点滅間隔
        options.hideStart true(default)=非表示から始まる, false=表示から始まる */
    kls.factory = function(blockOrView, count, options){
        var opts = options || {};
        var interval = ('interval' in opts)? opts.interval: 50;// テキトー
        var hideStart = ('hideStart' in opts)? opts.hideStart: true;
        var oniterate = function(cnt){
            if (cnt % 2 === 1) {
                (hideStart)? blockOrView.hide(): blockOrView.show();
            } else {
                (hideStart)? blockOrView.show(): blockOrView.hide();
            };
        };
        var obj = cls.$animations.PlainIteratedAnimation.factory.apply(this, [oniterate, count, interval]);
        return obj;
    };
    return kls;
//}}}
})();

/** フェードによるブロック交代アニメーションクラス */
cls.$animations.FadeChangeAnimation = (function(){
//{{{
    // 表示中ブロックが徐々に透けて次のブロックを表示する
    // ブロック同士は同階層である必要がある, 前ブロックは実行後hide状態
    var kls = function(){
        this._currentBlock = undefined; // 現在表示中のブロック
        this._nextBlock = undefined; // 次に表示するブロック
        this._duration = undefined; // 実行時間(ms)
        this._underZIndex = undefined; // 終了時の非表示ブロックの高さ
        this._upperZIndex = undefined; // 終了時の表示中ブロックの高さ
        this._topZIndex = undefined; // 最前面表示用に一時的に使われる高さ
    };
    $f.inherit(kls, new cls.Animation());
    kls.prototype._run = function(){
        var self = this;
        // まずは今のブロックを最前面表示
        this._currentBlock.drawSettingZIndex(this._topZIndex);
        this._currentBlock.show();
        // 下に次のブロックを入れる
        this._nextBlock.drawSettingZIndex(this._upperZIndex);
        this._nextBlock.show();
        // 徐々に今のブロックを消してゆく
        this._currentBlock.fadeOut(this._duration, function(){
            // 非表示にして高さを戻す
            self._currentBlock.hide();
            self._currentBlock.drawSettingZIndex(self._underZIndex);
            self._currentBlock.getView().css('opacity', 1.0);
            self.complete();
        });
    };
    kls.factory = function(currentBlock, nextBlock, duration, underZIndex, upperZIndex, topZIndex){
        var obj = cls.Animation._factory.apply(this);
        obj._currentBlock = currentBlock;
        obj._nextBlock = nextBlock;
        obj._duration = (duration !== undefined)? duration: 200;//=jQuery.fadeInの'fast'
        obj._underZIndex = (underZIndex !== undefined)? underZIndex: currentBlock.getZIndex();
        obj._upperZIndex = (upperZIndex !== undefined)? upperZIndex: nextBlock.getZIndex();
        obj._topZIndex = (topZIndex !== undefined)? topZIndex: cls.$consts.ZINDEX_TOP;
        return obj;
    };
    return kls;
//}}}
})();


/** 抽象基底チップアニメーションクラス */
cls.ChipAnimation = (function(){
//{{{
    var kls = function(){
        /** 対象チップインスタンス */
        this._chip = undefined;
    };
    $f.inherit(kls, new cls.Animation(), cls.Animation);

    //! 仕様が固まるまで保留
    ///** 必要チップ名リスト, 各サブクラスで定義する
    //    生成前にもChipインスタンスをチェックしたいので静的定義の必要有り */
    //kls._requiredChipNames = undefined;

    kls.prototype._initializeChipAnimation_ = function(){
    };

    kls.prototype._validateChipAnimation_ = function(){
    };

    //! 仕様が固まるまで保留, 本来は代用情報も含めて存否判定の必要がある
    ///** 必要チップ画像名が定義されているかを判定する
    //    生成前に確認する必要があるため静的に定義した */
    //kls.checkRequiredChipNames = function(chip){
    //    // 必要チップ定義チェック
    //    var success = $f.collect(this._requiredChipNames, function(i, v){
    //        if (chip.hasChipImage(v) === false) return v;
    //    }).length === 0;
    //    return success;
    //};

    kls._factory = function(chip){
        var obj = cls.Animation._factory.apply(this);
        obj._chip = chip;
        obj._initializeChipAnimation_();
        obj._validateChipAnimation_();
        return obj;
    };

    return kls;
//}}}
})();

/** 行き帰りチップアニメーションクラス */
cls.$chipAnimations.GobackChipAnimation = (function(){
//{{{
    var kls = function(){};
    $f.inherit(kls, new cls.ChipAnimation(), cls.ChipAnimation);
    $f.mixin(kls, new cls.IteratedAnimationMixin(), cls.IteratedAnimationMixin);

    var STATUSES = $f.collect([1, 2, 3, 4, 3, 2], function(i, v){
        return '$goback$4$' + v + '@';
    });

    kls.prototype.__oniterate = function(counter, data){
        this._chip.drawChangeVariation(STATUSES[counter % 6]); // 2 3 4 3 2 1 .. の順に繰り返す
    };
    kls.prototype._run = kls.prototype._runIteratedAnimationMixin;

    kls.factory = function(chip, count, interval){
        var obj = this._factory(chip);
        obj._initializeIteratedAnimationMixin();
        obj.getThread().addTag('goback_chip_animation');
        obj._maxIterationCount = count;
        obj._iterationInterval = interval;
        return obj;
    };
    return kls;
//}}}
})();


// 外部呼出し用ショートカット群
cls.block = function(){
    return cls.$blocks.PlainBlock.factory.apply(cls.$blocks.PlainBlock, arguments);
};
cls.text = function(){
    return cls.$blocks.TextBlock.factoryFast.apply(cls.$blocks.TextBlock, arguments);
};
cls.chip = function(){
    return cls.$chips.PlainChip.factory.apply(cls.$chips.PlainChip, arguments);
};
cls.character3x4 = function(){
    return cls.$chips.CharacterChip.factoryBy3x4.apply(cls.$chips.CharacterChip, arguments);
};
cls.windowVX = function(){
    return cls.$windows.PlainWindow.factoryByVX.apply(cls.$windows.PlainWindow, arguments);
};
cls.board = function(){
    return cls.$boards.PlainBoard.factory.apply(cls.$boards.PlainBoard, arguments);
};
cls.buttonSet = function(){
    return cls.$boards.ButtonSetBoard.factory.apply(cls.$boards.ButtonSetBoard, arguments);
};
cls.mapEditor = function(){
    return cls.$mapEditors.PlainMapEditor.factory.apply(cls.$mapEditors.PlainMapEditor, arguments);
};
cls.dialog = function(){
    return cls.$dialogs.PlainDialog.factory.apply(cls.$dialogs.PlainDialog, arguments);
};


__classScope__['RPGMaterial'] = cls;
})();


//---------------------------------------------------------------
// 試験中
//
(function(){
var cls = RPGMaterial;
var $d = RPGMaterial.consoleLog;
var $f = RPGMaterial.$functions;


/** ログビューワブロッククラス */
cls.$trials.LogViewerBlock = (function(){
//{{{
    //
    // メッセージブロックのログ風機能は使わないの？:
    // - [アイコン][ログ] のようなブロック構成に対応できないから
    //   後、向こうが肥大化しちゃうので、できればこっちに分けたい
    // - 自動改行などをするなら向こうの方がいいけど、等幅しか使えなくなるので良し悪し
    // - HTMLの機能も使いたくないので行数判別は諦める、長い文章は手動で改行を決めるなど工夫する
    // 未対応メモ:
    // - ログの流れを下から上にも可能にする
    // - テキストで追加できるようにする
    // - ログとビューアの横幅が合ってない場合の対応を考える
    // - ログデータをテキストリストへ変換する
    //   ブロック内で「テキストがどこか」を判別する方法が必要になる
    // - ログ表示時にアニメーション
    //
    var kls = function(){
        /** 未表示ログのキュー */
        this._queue = undefined;
        /** 表示中ログブロックリスト */
        this._rows = undefined;
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.toString = function(){ return 'LogViewerBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'logviewer';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._queue = [];
        self._rows = [];
    };

    /** ログのキューを追加する, 引数は現在Blockしか取れない */
    kls.prototype.addLog = function(textOrBlock){
        var block = textOrBlock;
        this._queue.push(block);
    };

    /** 次キューのログを表示する */
    kls.prototype.nextLog = function(){
        var self = this;
        if (this._queue.length === 0) {// キュー無し
            throw new Error('RPGMaterial:LogViewerBlock, none queue');
        };
        // 非表示にして最上部へ追加
        var log = this._queue.shift();
        log.pos([0, 0]);
        log.hide(false);
        log.getView().addClass(__CSS_SELECTOR + '-log');
        this.append(log);
        // 次ログのブロック縦幅分、全表示中ブロックを下方向へ移動
        $f.each(this._rows, function(nouse, row){
            row.move([log.getSize()[1], null]);
            row.draw(false);
        });
        // 次ログを表示
        log.show(false);
        this._rows.push(log);
        // 表示範囲から消えたものをブロック上は削除する
        var sight = this.getSize()[1];
        $f.each(this._rows, function(nouse, row){
            if (row.getPos()[0] > sight) { row.remove() };
        });
    };

    kls.factory = function(size, pos){
        var obj = cls.Block._factory.apply(this, [size, pos]);
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();


/** パラメータディスプレイクラス */
cls.$trials.ParameterDisplayBlock = (function(){
//{{{
    //
    // 上手く抽象化できなかったので、とりあえず動かせるように作ってみた
    // 何かの折に整理する
    //
    var kls = function(){
        /** 値セット */
        this._valueSet = new kls.ValueSet(this);
        /** 部分ビュー辞書, '<任意のキー>':<PartViewインスタンス> */
        this._partViews = {};
        /** 色の類型と初期色 */
        this._colors = {
            normal: '#FAFAFA',
            good: '#33CC33',
            bad: '#FF0000',
            inactive: '#666666',
            notice: '#FFFF00'//,
        };
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.toString = function(){ return 'ParameterDisplayBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'parameterdisplay';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
    };

    kls.prototype._draw = function(){
        cls.Block.prototype._draw.apply(this);
        this.drawValue();
    };

    /** 値を描画する, スタイル変更等の必要があるなら_付きを上書き */
    kls.prototype._drawValue = function(){
        var self = this;
        $f.each(this._partViews, function(nouse, partView){
            partView.draw();
        });
    };
    kls.prototype.drawValue = function(){
        this._drawValue();
    };

    /** 値を更新する／同時に描画する */
    kls.prototype.updateValue = function(values){
        this._valueSet.setValues(values);
    };
    kls.prototype.drawUpdatingValue = function(values){
        this.updateValue(values);
        this.drawValue();
    };

    /** 部分ビューを追加する, @return 生成したPartViewインスタンス */
    kls.prototype.appendPartView = function(key, text, color){
        var pv = new kls.PartView(this, text, color);
        this.getView().append(pv._view);
        this._partViews[key] = pv;
        return pv;
    };

    /** 部分ビューを返す, 単なるアクセサ */
    kls.prototype.getPartView = function(key){
        return this._partViews[key];
    };

    /** 色を上書き＆拡張する */
    kls.prototype.extendColors = function(colors){
        $f.extend(this._colors, colors);
    };

    /** 値セット簡易クラス */
    kls.ValueSet = function(myParent){
        var self = this;
        this._myParent = myParent;
        /** 各値, '<任意のキー>':<null=値無し||数値や文字列> */
        this._values = {
            current: undefined,
            min: null,
            max: null
        };
        /** 値を設定する */
        this.setValue = function(key, value){
            this._values[key] = value;
        };
        /** 値一式を設定する
            @arg values arr=[現在, 最小, 最大] || dict=キー:値ペアとして認識 || スカラ=単一値 */
        this.setValues = function(values){
            var self = this;
            if (values instanceof Array) {
                this._values.current = (values[0] !== undefined)? values[0]: null;
                this._values.min = (values[1] !== undefined)? values[1]: null;
                this._values.max = (values[2] !== undefined)? values[2]: null;
            } else if (typeof values === 'string' || typeof values === 'number' || values === null) {
                this.setValue('current', values);
            } else {
                $f.each(values, function(k, v){ self.setValue(k, v) });
            };
        };
        /** 値を返す */
        this.getValue = function(key){
            if (key in this._values === false) {// min/max設定忘れはとてもある
                throw new Error('RPGMaterial:ParameterDisplayBlock.ValueSet.getValue, not defined key=' + key);
            };
            return this._values[key];
        };
        /** 現在値を返す */
        this.val = function(){
            return this.getValue('current');
        };
        // 以下、動的テキスト／カラーコード生成関数内で使うためのお便利メソッド群
        /** 現在値が最小値／最大値に等しいかを判定する */
        this.isMin = function(){
            return this._values.current === this._values.min;
        };
        this.isMax = function(){
            return this._values.current === this._values.max;
        };
        /** 現在値をある値と比較して超過／以上／等しい／以下／未満かを判定する */
        this.compare = function(operand, target){
            return $f.compareNum(operand, this._values.current, target);
        };
    };

    /** テキストジェネレータのプリセット
        ! キーに静的テキストで入れられるような文字列を設定しないこと, 詳細はPartView()参照
        ! 最大・最小値は設定されているが、現在値がその範囲外になることもあり得る
          例えば コスト 100 / 80 のようにオーバーしている状況を表す場合等
        ! PartView内に持たないのは、生成メソッド内で使用＆後で全体に対しても使うかもしれないから */
    kls.TEXT_GENERATOR = {};
    kls.TEXT_GENERATOR.__SIMPLE__ = function(value, valueSet){
        if (value === null) return '-';
        return value.toString();
    };
    // +/- を付ける
    kls.TEXT_GENERATOR.__WITH_OPERAND__ = function(value, valueSet){
        if (value === null) return '-';
        return $f.toModifierString(value);
    };

    /** カラージェネレータのプリセット */
    kls.COLOR_GENERATOR = {};
    // HP・MPなどの満タンから始まって0まで減っていくパラメータ
    kls.COLOR_GENERATOR.__FULL_TO_EMPTY__ = function(value, valueSet){
        if (value === null) return 'normal';
        if (valueSet.isMax()) return 'good';
        if (value > 0 && value < valueSet.getValue('max') / 2) return 'bad';
        if (value === 0) return 'inactive';
        return 'normal';
    };
    // 通常0であるパラメータ
    kls.COLOR_GENERATOR.__ZERO_BASE__ = function(value, valueSet){
        if (value > 0) return 'good';
        if (value < 0) return 'bad';
        return 'normal';
    };
    kls.COLOR_GENERATOR.__NOT_OVER_MAX__ = function(value, valueSet){
        if (value > valueSet.getValue('max')) return 'bad';
        return 'normal';
    };

    /** 部分ビュー簡易クラス */
    kls.PartView = function(myParent, text, color, view){
        this._myParent = myParent;
        this._view = $('<span />');
        /** テキスト前後の文字列, 動的生成後に付与される */
        this.textPrefix = '';
        this.textSuffix = '';
        /** 現在値がnullの場合に非表示にするか */
        this.isNullAsHidden = false;
        /** 静的テキストか動的生成用関数を設定する
            str=テキスト || str=TEXT_GENERATORキーの小文字 || func */
        this.text = text || kls.TEXT_GENERATOR.__SIMPLE__;
        if (typeof this.text === 'string' && this.text.toUpperCase() in kls.TEXT_GENERATOR) {
            this.text = kls.TEXT_GENERATOR[this.text.toUpperCase()];
        };
        /** 静的カラーコードか動的生成用関数を設定する
            str=カラーコード || str=COLOR_GENERATORキーの小文字 || func */
        this.color = color || 'normal';
        if (typeof this.color === 'string' && this.color.toUpperCase() in kls.COLOR_GENERATOR) {
            this.color = kls.COLOR_GENERATOR[this.color.toUpperCase()];
        };
        /** 描画する */
        this.draw = function(){
            var t, c;
            if (this.isNullAsHidden && this._myParent._valueSet.val() === null) {
                this._view.hide();
            } else {
                // テキスト
                t = this.text;
                if (typeof t !== 'string') {
                    t = t(this._myParent._valueSet.val(), this._myParent._valueSet);
                };
                this._view.text(this.textPrefix + t + this.textSuffix);
                // カラーコード
                c = this.color;
                if (typeof c !== 'string') {
                    c = c(this._myParent._valueSet.val(), this._myParent._valueSet);
                };
                if (c in this._myParent._colors) c = this._myParent._colors[c];
                this._view.css('color', c);
                this._view.show();
            };
        };
        /** ビューを返す, 単なるアクセサ */
        this.getView = function(){
            return this._view;
        };
    };

    kls._factory = function(size, pos){
        var obj = cls.Block._factory.apply(this, [size, pos]);
        __INITIALIZE(obj);
        return obj;
    };

    /**
     *  現在値のみを表示するための生成メソッド
     *
     *  現在値のみなのに他の値も渡しているのは
     *  他の値によってテキストや色が変わることもあるから
     *  例えば、HPが最大値なら緑で、最大HPの半分なら赤になり'!'マークが付くとか
     *
     *  values num=現在値のみ || arr=[現在, 最小, 最大] || dict=ペア群
     *         詳細は ValueSet.setValues 参照
     *  options:
     *    textGenerator :
     *    colorGenerator:
     *    unitText      : 単位を表すテキスト
     *    textPrefix    :
     *    textSuffix    :
     */
    kls.factorySingle = function(size, pos, values, options){
        var opts = options || {};
        var obj = this._factory.apply(this, [size, pos]);
        // 値一式を格納
        obj._valueSet.setValues(values);
        // 値部分のテキストと全体の色の描画ルーチンを設定
        var textGenerator = ('textGenerator' in opts)? opts.textGenerator: null;
        var colorGenerator = ('colorGenerator' in opts)? opts.colorGenerator: null;
        // 値の部分ビュー生成
        var valuePart = obj.appendPartView('value', textGenerator, colorGenerator);
        if ('textPrefix' in opts) valuePart.textPrefix = opts.textPrefix;
        if ('textSuffix' in opts) valuePart.textSuffix = opts.textSuffix;
        // 単位の部分ビュー生成
        var unitPart;
        if ('unitText' in opts) {
            unitPart = obj.appendPartView('unit', function(v){
                if (v !== null) return opts.unitText;
                return '';
            }, colorGenerator);
            unitPart.isNullAsHidden = true;
            unitPart.getView().css({ marginLeft:1 });
        };
        // 全体のスタイルを設定, !これを変更したい場合は外部で直接変更する
        //obj.style({ fontSize:12, lineHeight:size[1]+'px', letterSpacing:0, textAlign:'center' });
        return obj;
    };

    /**
     * 現在値/最大値 形式の生成メソッド
     *
     * オプション:
     *   colorGenerator  :
     *   separatorMargin: num=セパレータ前後の間隔
     */
    kls.factoryWithMax = function(size, pos, values, options){
        var opts = options || {};
        var obj = this._factory.apply(this, [size, pos]);
        obj._valueSet.setValues(values);
        var colorGenerator = ('colorGenerator' in opts)? opts.colorGenerator: kls.COLOR_GENERATOR.__FULL_TO_EMPTY__;
        var separatorMargin = ('separatorMargin' in opts)? opts.separatorMargin: 3;

        var valuePart = obj.appendPartView('value', null, colorGenerator);
        var sepPart = obj.appendPartView('separator', '/', colorGenerator);
        sepPart.getView().css({ marginLeft:separatorMargin, marginRight:separatorMargin });
        var maxPart = obj.appendPartView('max', function(v, vs){
            var max = vs.getValue('max');
            if (max === null) return '-';
            return max;
        }, colorGenerator);
        //obj.style({ fontSize:12, lineHeight:size[1]+'px', letterSpacing:0, textAlign:'center' });
        return obj;
    };

    return kls;
//}}}
})();


/** mixiアプリ用ユーティリティクラス */
cls.$trials.MixiappUtils = (function(){
//{{{
    //
    // - もし巨大になったりこのライブラリ外でも使う状況になったら単独ライブラリ化する
    //   その場合はFacebookなどで使うことも考慮してオープンソーシャル用として作ること
    // - なので、なるべく分離できるようにしておく
    //
    var kls = function(){};

    kls.URLS = {};
    kls.URLS.RUN_APPLI = 'http://mixi.jp/run_appli.pl';

    /** mixiアプリ上であるかを判定する, errorRaising true(default)=無い場合はエラー */
    kls.isEnabled = function(errorRaising){
        if (errorRaising === undefined) errorRaising = true;
        var vars = ['opensocial', 'gadgets'];
        var global = (function(){ return this })();
        var i;
        for (i = 0; i < vars.length; i++) {
            if (vars[i] in global === false) {
                if (errorRaising) {
                    throw new Error('RPGMaterial:MixiappUtils.isEnabled, invalid situation');
                } else {
                    return false;
                };
            };
        };
        return true;
    };

    /**
     * canvasへOWNERとしてリダイレクトさせる
     *
     * - 1) VIEWERがOWNERでない場合, 2) アプリ未インストールの場合 のどちらかの条件に合致する際に
     *   強制的にOWNERへ変更して入口までリダイレクトさせる
     *   いわゆるログインチェック失敗後のリダイレクト処理
     * - 最もありがちな処理をメモ的用途で関数化したもの
     *   この関数の趣旨は「メモ」なので注意, 後で見ると分け解らんから安易に消さないこと
     *   複雑になるようなら各所でベタ書きOK
     * - 挙動としては2回リダイレクトして最終的には以下へ飛ぶ
     *   join_appli.pl?id=<APP_ID>&r=%2Frun_appli.pl%3Fid%3D<personId>
     * - 参考URL)
     *   - 公式, 関数の解説があるけど肝心のログインチェック的に使えるのかには言及がない
     *     http://developer.mixi.co.jp/appli/spec/pc/change_view_flow/
     *   - VIEWERがOWNERであるかのチェック方法について
     *     http://kur.jp/2009/08/11/mixiapp-3/
     *
     * @param personId OWNERへ変更したい(主に)VIEWERのID
     */
    kls.redirectToCanvasAsOwner = function(personId, urlParams){
        kls.isEnabled();
        urlParams = urlParams || {};
        var view = gadgets.views.getSupportedViews()['canvas'];
        gadgets.views.requestNavigateTo(view, urlParams, personId);
    };

    /**
     * ありがちな開始処理をまとめたもの
     *
     * VIEWER情報取得とログインチェックという別の処理を同時に行っているが
     * これはリクエストを1回で済ますため
     * 現在はログインチェックに失敗すると必ずリダイレクトするようになっている
     *
     * 取れる情報の種類や抽出方法は以下参照
     * http://developer.mixi.co.jp/appli/spec/pc/get_mymixi_info/
     *
     * options:
     *   complete:
     *   fail:
     */
    kls.start = function(options){
        var opts = options || {};
        kls.isEnabled();
        var complete = opts.complete || function(dataSet){};
        var fail = opts.fail || function(dataSet){};

        var params = {};
        //! 以下の項目は権限により取れないこともあることに注意
        params[opensocial.DataRequest.PeopleRequestFields.PROFILE_DETAILS] = [
            opensocial.Person.Field.GENDER
            //opensocial.Person.Field.HAS_APP //! 無くても取れるみたい
            //opensocial.Person.Field.PROFILE_URL,
            //opensocial.Person.Field.ADDRESSES,
            //opensocial.Person.Field.AGE,
            //opensocial.Person.Field.DATE_OF_BIRTH,
            //mixi.PersonField.BLOOD_TYPE
        ];

        var req = opensocial.newDataRequest();
        req.add(req.newFetchPersonRequest(opensocial.IdSpec.PersonId.VIEWER, params), 'viewer');
        req.add(req.newFetchPersonRequest(opensocial.IdSpec.PersonId.OWNER), 'owner');
        req.send(function(data) {
            var dataSet = {
                data: data
            };
            if (data.hadError()) {// リクエスト自体が失敗
                fail(dataSet);
                return;
            };
            var viewer = data.get('viewer').getData();
            var viewerId = viewer.getId();
            var hasApp = viewer.getField(opensocial.Person.Field.HAS_APP);
            var owner = data.get('owner').getData();
            var ownerId = owner.getId();
            //! hasAppは文字列なので注意
            if (viewerId !== ownerId || hasApp === 'false') {
                kls.redirectToCanvasAsOwner(viewerId);
            } else {
                dataSet.viewer = viewer;
                dataSet.viewerId = viewerId;
                dataSet.nickname = viewer.getDisplayName();
                dataSet.thumbnailUrl = viewer.getField(opensocial.Person.Field.THUMBNAIL_URL);
                dataSet.gender = viewer.getField(opensocial.Person.Field.GENDER).getKey();
                complete(dataSet);
            };
        });
    };

    /** 永続化APIから取得したValue文字列のエスケープを解除する
        メモ的用途の関数 */
    kls.unescapeValueString = function(valueString){
        kls.isEnabled();
        return gadgets.util.unescapeString(valueString);
    };

    /** ボイスを投稿する
        ! なお、ボイス投稿ボタンはmixi側指定のものを必ず使うこと
        ref) http://developer.mixi.co.jp/appli/spec/pc/send_voice/ */
    kls.postVoice = function(mixiappId, message, options){
        kls.isEnabled();
        var opts = options || {};
        complete = opts.complete || function(){};
        fail = opts.fail || function(){};
        finish = opts.finish || function(){};

        //
        // ボイスの内容は以下の2行となる
        // '{message} http://mixi.at/xxxxxxx ({アプリ名})'
        //
        // また、投稿前にアプリ名を抜いた内容の確認ダイアログが出る
        //
        message = message || '';

        // URLにはappPrames指定も可能
        var params = {};
        params[mixi.Status.Field.URL] = kls.URLS.RUN_APPLI + '?id=' + mixiappId;
        //params[mixi.Status.Field.MOBILE_URL] =
        //        "http://ma.mixi.net/[アプリID]/?url=...";
        //params[mixi.Status.Field.TOUCH_URL] =
        //        "http://mixi.jp/run_appli.pl?id=[アプリID]&appParams=..."
        mixi.requestUpdateStatus(message, function(response) {
            if (response.hadError()) {
                fail(response);
            } else {
                complete(response);
            };
            finish(response);
        }, params);
    };

    /** 友人を招待する
        ref) http://developer.mixi.co.jp/appli/spec/pc/invite_appli/ */
    kls.inviteFriends = function(options){
        kls.isEnabled();
        var opts = options || {};
        complete = opts.complete || function(){};
        fail = opts.fail || function(){};
        finish = opts.finish || function(){};
        opensocial.requestShareApp('VIEWER_FRIENDS', null, function(response) {
            if (response.hadError()) {
                fail(response);
            } else {
                complete(response);
            };
            finish(response);
        });
    };

    //! サンプルコード
    ///** mixi用) 自分＋アプリインストール済みマイミクをリストで取得し、関数を実行する */
    //cls.fetchHasAppPlayers = function(success){
    //    var req = opensocial.newDataRequest();
    //    // 自分
    //    req.add(req.newFetchPersonRequest(opensocial.IdSpec.PersonId.VIEWER), 'viewer');
    //    // アプリインストール済みマイミク
    //    var ip = {};
    //    ip[opensocial.IdSpec.Field.USER_ID] = opensocial.IdSpec.PersonId.VIEWER;
    //    ip[opensocial.IdSpec.Field.GROUP_ID] = 'FRIENDS';
    //    var idSpec = opensocial.newIdSpec(ip);
    //    var dp = {};
    //    dp[opensocial.DataRequest.PeopleRequestFields.FILTER] = opensocial.DataRequest.FilterType.HAS_APP;
    //    req.add(req.newFetchPeopleRequest(idSpec, dp), 'friends');
    //    // 情報取得
    //    req.send(function(data) {
    //        var players = [];
    //        players.push(data.get('viewer').getData());
    //        var friends = data.get('friends').getData();
    //        friends.each(function(friend) {
    //            players.push(friend);
    //        });
    //        success(players);
    //    });
    //};

    return kls;
//}}}
})();


/** 画像リスト参照クラス */
cls.$trials.ImageBookBlock = (function(){
//{{{
    //
    // 注意:
    // - 現在は全部同サイズの画像のみ有効
    // - ボタンが収まらない画像横幅だと正しく表示されない
    // - 目次が収まらない画像縦幅だと正しく表示されない
    //
    var kls = function(){

        /**
         * ページリスト
         *
         * 各要素 = {
         *     pageNumer: <表示用ページ番号>,
         *     url: <ページ画像URL>,
         *     title: <null || ページタイトル>,
         * }
         *
         * - ページ数は要素番号 + 1
         */
        this._pages = undefined;

        /** 現在表示中のページ要素番号 */
        this._currentPageIndex = 0;

        /** 画像サイズ */
        this._imageSize = undefined;

        /** 画像表示ブロック */
        this._imageBlock = undefined;
        /** 操作盤ブロック */
        this._controllerBlock = undefined;
        /** 操作盤上のボタンセット */
        this._buttonSet = undefined;
        /** 目次ブロック */
        this._indexBlock = undefined;
        this._isShownIndexBlock = false;
    };
    $f.inherit(kls, new cls.Block());
    $f.mixin(kls, new cls.OpenAndCloseBlockMixin());

    kls.prototype.toString = function(){ return 'ImageBookBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'imagebook';

    /** 操作盤縦幅, 生成時に必要なのでここで定義, 横幅は同画像横幅 */
    var __CONTROLLER_HEIGHT = 32;

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._pages = [];

        self.bindDisablingContextmenu();
        self.style({ bg:'#FFF' }, false);

        // 画像表示枠
        self._imageBlock = cls.block(self._imageSize);
        self.append(self._imageBlock);
        self._imageBlock.style({ cursor:'pointer' });
        self._imageBlock.getView().bind('mousedown', {self:self}, __ONPAGECLICK);
        self._imageBlock.drawAndShow();

        // 操作盤
        self._controllerBlock = cls.block(
            [self._imageSize[0], __CONTROLLER_HEIGHT], [self._imageSize[1], 0]);
        self.append(self._controllerBlock);
        self._controllerBlock.style({ bg:'#CCC' }, false);
        self._controllerBlock.drawAndShow();

        // ボタンセット
        self._buttonSet = cls.buttonSet([4, 1], [60, 24], [4, 4], { spacing:4 });
        self._controllerBlock.append(self._buttonSet);
        var buttonData = [
            ['previous', [0, 0], 'Prev'],
            ['next', [0, 1], 'Next'],
            ['close', [0, 2], 'Close'],
            ['index', [0, 3], 'Index']//,
        ];
        $f.each(buttonData, function(nouse, dat){
            var key = dat[0];
            var idx = dat[1];
            var label = dat[2];
            var block = cls.block(self._buttonSet.getSquareSize());
            block.style({ fontSize:12, lineHeight:'24px', bg:'#AAA',
                color:'#FFF', textAlign:'center' });
            block.text(label);
            var button = self._buttonSet.defineButton(key, idx, block);
            button.square.style({ cursor:'pointer' });
            $f.toUnselectable(self._buttonSet.getButtonBlock(key).getView());
        });
        self._buttonSet.bindOnbuttonsetclick({self:self}, __ONBUTTONSETCLICK);
        self._buttonSet.drawAndShow();

        // 目次ブロック
        var idxSize = [
            ~~(self._imageBlock.getWidth() / 4),
            self._imageBlock.getHeight()
        ];
        self._indexBlock = cls.block(idxSize);
        self.append(self._indexBlock);
        self._indexBlock.pos([null, 'right']);
        self._indexBlock.setZIndex(10);
        self._indexBlock.style({ bg:'#FFF', overflow:'scroll-y' });
        self._indexBlock.draw();
    };

    /** ページを追加する */
    kls.prototype.addPage = function(url, title){
        this._pages.push({
            pageNumer: this._pages.length + 1,
            url: url,
            title: title || null
        });
    };

    /** override, 目次項目初期化を行う */
    kls.prototype._open = function(){
        var self = this;
        var rowHeight = 16; // 1行の幅
        $f.each(this._pages, function(pageIdx, page){
            var title = page.title || 'page';
            var block = cls.block([self._indexBlock.getWidth(), rowHeight], [pageIdx * rowHeight, 2]);
            self._indexBlock.append(block);
            block.style({ lineHeight:rowHeight+'px', textAlign:'left', cursor:'pointer',
                fontSize:12, color:'blue' });
            block.text(page.pageNumer + '. ' + title);
            block.drawAndShow();
            block.getView().bind('mousedown', {self:self, pageIndex:pageIdx}, __ONINDEXCLICK);
        });
    };

    /** 次のページへ進める */
    kls.prototype.drawNextPage = function(){
        this._currentPageIndex += 1;
        this._currentPageIndex %= this._pages.length; // 最大値を超えた場合
        this.draw(false);
    };
    /** 前のページへ戻る */
    kls.prototype.drawPreviousPage = function(){
        this._currentPageIndex -= 1;
        if (this._currentPageIndex < 0) { // マイナスの場合
            this._currentPageIndex = this._pages.length - 1;
        };
        this.draw(false);
    };
    /** 特定のページを表示する */
    kls.prototype.drawJumpPage = function(pageIndex){
        this._currentPageIndex = pageIndex;
        this.draw(false);
    };
    /** 描画のフック */
    kls.prototype._draw = function(){
        var self = this;
        cls.Block.prototype._draw.apply(this);

        // 現在のページへ変更
        var page = this._pages[this._currentPageIndex];
        this._imageBlock.style({ img:page.url });
    };

    /** ボタンセットを返す, 単なるアクセサ */
    kls.prototype.getButtonSet = function(){
        return this._buttonSet;
    };

    /** ページクリックハンドラ */
    function __ONPAGECLICK(evt){
        var self = evt.data.self;
        var isRightClick = (evt.which === 3);
        if (isRightClick) {
            self.drawPreviousPage();
        } else {
            self.drawNextPage();
        };
        return false;
    };

    /** ボタンクリックハンドラ */
    function __ONBUTTONSETCLICK(evt){
        var self = evt.data.self;
        var buttonKey = evt.data.buttonKey;
        // 前へ
        if (buttonKey === 'previous') {
            self.drawPreviousPage();
        // 次へ
        } else if (buttonKey === 'next') {
            self.drawNextPage();
        // 閉じる
        } else if (buttonKey === 'close') {
            self.close();
        // 目次
        } else if (buttonKey === 'index') {
            if (self._isShownIndexBlock) {
                self._indexBlock.hide();
            } else {
                self._indexBlock.show();
            };
            self._isShownIndexBlock = !self._isShownIndexBlock;
        };
        return false;
    };

    /** 目次項目クリックハンドラ */
    function __ONINDEXCLICK(evt){
        var self = evt.data.self;
        var pageIndex = evt.data.pageIndex;
        self.drawJumpPage(pageIndex);
        self._isShownIndexBlock = false;
        self._indexBlock.hide();
        return false;
    };

    /**
     * @param imageSize arr 画像のサイズ, 現在全ページ同サイズのみ対応
     */
    kls.factory = function(imageSize, pos){
        var size = [
            imageSize[0],
            imageSize[1] + __CONTROLLER_HEIGHT
        ];
        var obj = cls.Block._factory.apply(this, [size, pos]);
        obj._initializeOpenAndCloseBlockMixin();
        obj._imageSize = imageSize;
        __INITIALIZE(obj);
        return obj;
    };

    return kls;
//}}}
})();


/** 画像テキストクラス */
cls.$trials.ImageTextBlock = (function(){
//{{{
    var kls = function(){
        /** 1文字のサイズ, [横px, 縦px] */
        this._characterSize = undefined;
        /** 文字数 */
        this._length = undefined;
        /** 文字画像マップ, '<文字>':{画像別種データ} */
        this._imageMap = undefined;
        /** 現在の文字列 */
        this._imageText = '';
        /** 文字チップリスト, [0]=最も左の桁 */
        this._characterChips = undefined;
        /** 文字チップリストが描画済みかのフラグ */
        this._isDrawnChips = false;
        /** 左寄せか右寄せか, 'left' || 'right' */
        this._textAlign = 'left';
        /** 文字間隔 */
        this._spacing = 0; //! 初期値は実質factory内のものが反映されている
    };
    $f.inherit(kls, new cls.Block());

    kls.prototype.toString = function(){ return 'ImageTextBlock' }

    var __CSS_SELECTOR = cls.$consts.CSS_SELECTOR_PREFIX + 'imagetext';

    /** チップへ文字を各別種として登録する際の別種名プレフィックス */
    var __VARIATION_NAME_PREFIX  = 'character_';

    function __INITIALIZE(self){
        self.getView().addClass(__CSS_SELECTOR);
        self._imageMap = {};

        self._characterChips = [];
        $f.each($f.squaring(self._characterSize, self.getSize(), self._spacing), function(i, partPos){
            //! Chipは生成時に画像情報を入れないといけないのでダミーを入れている
            //  遅延で生成しようかと思ったけど、あまり意味がないので止めた
            var chip = cls.chip(self._characterSize, partPos, {
                url: 'dummy.png',
                fullSize: [1, 1],
                clipPos: [0, 0]//,
            });
            self.append(chip);
            self._characterChips.push(chip);
        });
    };

    /** 文字と画像のマッピングを設定する
        imageData obj Chip._factoryと同じ形式, 通常は ImageIndexer.get で設定する */
    kls.prototype.setImage = function(character, imageData){
        var vname = __VARIATION_NAME_PREFIX + character;
        $f.each(this._characterChips, function(nouse, chip){
            chip.addVariation(vname, imageData);
            //! デフォルトのままだとdraw時に存在しないdummy.pngへリクエストしてしまう
            if (chip.getVariationName() === '__default__') {
                chip.changeVariation(vname);
                chip.drawAndShow();
            };
        });
        this._imageMap[character] = vname;
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
        // チップリストを初期化
        //! 生成時にやると存在しないdummy.pngへリクエストしてしまう
        if (this._isDrawnChips === false) {
            $f.each(this._characterChips, function(i, v){ v.drawAndShow(); });
            this._isDrawnChips = true;
        };
        // 全ての文字を非表示
        $f.each(this._characterChips, function(i, v){ v.hide(); });
        // テキスト無しなら終了
        if (this._imageText === '') return;
        // 文字リストを逆順を考慮して用意
        var characters = this._imageText.split('');
        var chips = this._characterChips.slice();
        if (this._textAlign === 'right') {
            characters.reverse();
            chips.reverse();
        };
        // 反映
        $f.each(chips, function(i, chip){
            var c = characters[i];
            if (c !== undefined && self._imageMap[c] !== undefined) {
                chip.drawChangeVariation(__VARIATION_NAME_PREFIX + c);
                chip.show();
            };
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
//}}}
})();


})();
