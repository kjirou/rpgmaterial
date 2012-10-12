//あいう
// vim: set foldmethod=marker :
(function(){

var tester = FatmanTools.factoryTester('rpgmaterial');
$(document).ready(function(){
    tester.test();
});

var cls = RPGMaterial;
var $f = RPGMaterial.$functions;

// テスト用の画像設定
var img = cls.ImageIndexer.factory();
//- githubアップ時に内部に他者様素材を含まない為の対処
var imgUrl = 'http://kjirou.net/rpgmaterial_sample_images';
//- マップ
img.upload('a2', imgUrl + '/TileA2.png', [512, 384], [64, 96]);
img.upload('icon', imgUrl + '/usui-IconSet-min.png', [384, 528], [24, 24]);
img.upload('creava_a2',  imgUrl + '/creava-TileA2.png', [512, 384], [64, 96]);
img.upload('mani2_bg', imgUrl + '/mani2-sitazi.png', [256, 192], [64, 96]);
img.clip('gray_rock', imgUrl + '/TileB.png', [512, 512], [288, 128], [32, 32]);
img.clip('wooden_grave', imgUrl + '/TileB.png', [512, 512], [288, 192], [32, 32]);
img.clip('stump', imgUrl + '/TileB.png', [512, 512], [160, 96], [32, 32]);
img.clip('signboard', imgUrl + '/TileB.png', [512, 512], [160, 32], [32, 32]);
img.clip('front', imgUrl + '/usui-Actor4.png', [96, 128], [0, 32], [32, 32]);
img.clip('back', imgUrl + '/usui-Actor4.png', [96, 128], [96, 32], [32, 32]);
//- フェイス
img.upload('face_boy', imgUrl + '/boy.png', [384, 192], [96, 96]);
img.upload('face_girl', imgUrl + '/girl.png', [384, 192], [96, 96]);
img.upload('face_heroine', imgUrl + '/heroine.png', [384, 192], [96, 96]);
img.upload('face_badman', imgUrl + '/badman.png', [384, 192], [96, 96]);
img.upload('face_variants', imgUrl + '/variants_faces.png', [384, 192], [96, 96]);
//- テキスト
img.upload('text_merged', imgUrl + '/text_merged.png', [192, 32], [16, 16], { uploadSize:[192, 16] });
img.upload('text_merged_green', imgUrl + '/text_merged.png', [192, 32], [16, 16], { uploadPos:[16, 0], uploadSize:[192, 16] });

var linkButton = function(selector, text){
    return $('<a href="javascript:void(0)" />').css({ fontSize:12, marginRight:3 }).text(text).appendTo(selector);
};

var easyKVSUrl = 'http://kjirou.net/main/public/php/app/easykvs/intro/api.php';


//
// Console only
//
//{{{
tester.add(1, 'Deferred, some checkings', function(u, $d){
    // ひとつのdeferred.callで複数プロセスを走らせることが出来るか
    // -> !無理 この場合d2しか表示されない
    var d = new Deferred();
    d.next(function(){ $d('next(d1)') });
    d.next(function(){ $d('next(d2)') });
    Deferred.wait(1.0).next(function(){
        d.call();
    });
    // parallelに設定した配列に後からDeferredインスタンスを足すことは出来るか？
    // -> !無理 この場合最初のstoppers[0]がcallされた時点で"Parallel!"と表示
    var stoppers = [new Deferred()];
    Deferred.parallel(stoppers).next(function(){
        $d('Paralleled!');
    });
    Deferred.wait(0.1).next(function(){
        stoppers.push(new Deferred());
    });
    Deferred.wait(3.0).next(function(){
        stoppers[0].call();
        $d('stopper1 called');
    });
    Deferred.wait(5.0).next(function(){
        stoppers[1].call();
        $d('stopper2 called');
    });
    // parallelへ空配列を入れるとどうなるのか
    // -> 進む
    Deferred.parallel([]).next(function(){
        $d('Blank stoppers!');
    });
});
tester.add(1, 'Application, basic usage', function(u, $d){
    var app;
    app = cls.Application.factory();
    app.define('foo');
    app.define('bar', 'somestring');
    app.define('baz', {a:1});
    try { app.define('foo'); return false } catch (e) { $d(e) };
    try { app.define('define'); return false } catch (e) { $d(e) };

    try { app.checkDefinitions(); return false } catch (e) { $d(e) };
    app.foo = 1;
    app.checkDefinitions();

    app.directSettingOnly = 1;
    try { app.checkDefinitions(); return false } catch (e) { $d(e) };
    delete app.directSettingOnly;
    app.checkDefinitions();

    delete app.bar;
    try { app.checkDefinitions(); return false } catch (e) { $d(e) };
    app.bar = 1;
    app.checkDefinitions();

    app.defineNameSpace('subdir');
    app.checkDefinitions();

    app.subdir.a = 1;
    app.subdir.b = 2;
    if (app.subdir.get('a') !== 1) u.error();

    var k, v;
    for (k in app.subdir) {
        if (app.subdir.hasOwnProperty(k) === false) return;
        if ($f.inArray(k, ['get', 'set'])) u.error();
        $d('Own prop =', k);
    };

    $d(app);
});
tester.add(1, 'PlainBlock, instanceof OtherBlockClasses', function(u, $d){
    var block = cls.$blocks.PlainBlock.factory([0, 0], null);
    if (block instanceof cls.Block !== true) u.error();
    if (block instanceof cls.$blocks.PlainBlock !== true) u.error();
    if (block instanceof cls.$blocks.MessageBlock !== false) u.error();
    if (block instanceof cls.Chip !== false) u.error();
    try { block.append('Not block value');// Block以外はエラー
        return false; } catch (err) { $d(err); };
});
tester.add(1, 'PlainBlock, append and remove', function(u, $d){
    var p1 = cls.$blocks.PlainBlock.factory([0, 0], null);
    var c1 = cls.$blocks.PlainBlock.factory([0, 0], null);
    var p2 = cls.$blocks.PlainBlock.factory([0, 0], null);
    var c2 = cls.$blocks.PlainBlock.factory([0, 0], null);
    p1.append(c1);
    p2.append(c2);
    try { p1.append(c2); return false } catch (e) { $d(e) };
});
tester.add(1, 'Block.getPosIn', function(u, $d){
    var a = cls.$blocks.PlainBlock.factory([400, 400]);
    var b = cls.$blocks.PlainBlock.factory([200, 100], [50, 25]);
    var c = cls.$blocks.PlainBlock.factory([10, 10], [20, 40]);
    var x = cls.$blocks.PlainBlock.factory([0, 0]);
    a.append(b);
    b.append(c);

    if (c.getPosIn(a)[0] !== 50+20) u.error();
    if (c.getPosIn(a)[1] !== 25+40) u.error();
    if (b.getPosIn(a)[0] !== 50) u.error();
    try { x.getPosIn(a); return false } catch (e) { $d(e) };
    try { b.getPosIn(b); return false } catch (e) { $d(e) };
});
tester.add(1, 'Block.getPosOver', function(u, $d){
    var p = cls.$blocks.PlainBlock.factory([100, 50]);
    var a = cls.$blocks.PlainBlock.factory([50, 30], [10, 10]);
    var aa = cls.$blocks.PlainBlock.factory([20, 20], [0, 0]);
    var x = cls.$blocks.PlainBlock.factory([10, 10]);
    p.append(a);
    a.append(aa);
    var r;
    r = x.getPosOver(a, null, p);
    $d(r);
    if (r.join(',') !== '10,10') u.error();
    r = x.getPosOver(a, ['center', 'center'], p);
    $d(r);
    if (r.join(',') !== '20,30') u.error();
    r = x.getPosOver(a, ['bottom', 'right'], p);
    $d(r);
    if (r.join(',') !== '30,50') u.error();
    r = x.getPosOver(aa, ['bottom', 'right'], p);
    $d(r);
    if (r.join(',') !== '20,20') u.error();
});
tester.add(1, 'Block, check style method', function(u, $d){
    var b = cls.$blocks.PlainBlock.factory([1, 1]);
    b.style({ color:'#FFF' });
    try { b.style('color', '#FFF'); return false } catch (e) { $d(e) };
    try { b.style({zIndex:1}); return false } catch (e) { $d(e) };
});
tester.add(1, 'Block.setUnchainedDrawing', function(u, $d){
    var drawings = [];

    var p = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    p._draw = function(){ $d('p.draw()'); drawings.push(this); };

    var c1 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    c1.setUnchainedDrawing(true);
    c1._draw = function(){ $d('c1.draw()'); drawings.push(this); };
    var c2 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    c2._draw = function(){ $d('c2.draw()'); drawings.push(this); };

    var gc1 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    gc1.setUnchainedDrawing(true);
    gc1._draw = function(){ $d('gc1.draw()'); drawings.push(this); };
    var gc2 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    gc2._draw = function(){ $d('gc2.draw()'); drawings.push(this); };

    p.append(c1);
    p.append(c2);
    c2.append(gc1);
    c2.append(gc2);

    p.draw(true);// gc2 -> c2 -> p
    if (drawings[0] !== gc2 || drawings[1] !== c2 || drawings[2] !== p) u.error();
});
tester.add(1, 'Block._getDrawingChainedBlocks', function(u, $d){
    var drawings = [];

    var p = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    p._draw = function(){ $d('p.draw()'); drawings.push(this); };

    var c1 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    c1.setUnchainedDrawing(true);
    c1._draw = function(){ $d('c1.draw()'); drawings.push(this); };
    var c2 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    c2._draw = function(){ $d('c2.draw()'); drawings.push(this); };

    p.append(c1);
    p.append(c2);
    p.chainDrawing(c1.getBlockId());

    p.draw(true);// c2 -> p
    p.draw();// c1 -> p, setUnchainedDrawing は無関係
    p.draw(false);// p only

    if (drawings[0] !== c2 || drawings[1] !== p || drawings[2] !== c1 ||
        drawings[3] !== p || drawings[4] !== p) u.error();

    var c3 = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    try {
        p.chainDrawing(c3.getBlockId());
        return false;
    } catch (err) {$d('NP =', err)};

    return p;
});
tester.add(1, 'LvManager, basic usage', function(u, $d){
    var lv = cls.LvManager.factory();
    try { lv.setLvMap([1, 2, 3]); return false; } catch (e) { $d(e) };

    lv = cls.LvManager.factory();
    lv.setLvMap(10, function(nextLv){
        return (nextLv - 1) * 5;
    });
    if (lv.getLvCap() !== 10) u.error();
    if (lv.calculateTotalNecessaryExp(2, 4) !== 25) u.error();
    if (lv.calculateTotalNecessaryExp(1, 10) !== lv.getExpCap()) u.error();

    var r;
    r = lv.gainExp(4);
    if (r !== false) u.error();
    r = lv.gainExp(2);
    if (r instanceof Array !== true) u.error();
    if (r[0] !== 2 || r[0] !== lv.getLv()) u.error();
    if (r[1] !== 1) u.error();
    if (r[2] !== 10) u.error();
    r = lv.gainExp(99999);
    if (r[0] !== 10 || r[1] !== null || r[2] !== null) u.error();

    lv = cls.LvManager.factory();
    lv.setLvMap([0, 10, 20, 40, 80]);
    lv.gainExp(5);
    lv.gainExpByLv(3);
    if (lv.getExp() !== 75) u.error();
    lv.drainExpByLv(2);
    if (lv.getExp() !== 10) u.error();
});
tester.add(1, 'NumberValue, basic usage', function(u, $d){
    var nv = cls.$values.NumberValue.factory(0);
    nv.set(3);
    nv.delta(5);
    $d(nv.get());
    if (nv.get() !== 8) u.error();
    nv.delta(-10);
    $d(nv.get());
    if (nv.get() !== -2) u.error();

    nv = cls.$values.NumberValue.factory(null, {
        max: 99,
        min: 0
    });
    nv.within(200);
    $d(nv.get());
    if (nv.get() !== 99) u.error();
    nv.within(-100);
    $d(nv.get());
    if (nv.get() !== 0) u.error();
    $d(nv.get());
    try { nv.set(100); return false } catch (e) { $d(1, e) };
    try { nv.set(-1); return false } catch (e) { $d(2, e) };
    try { nv.delta(-1, true); return false } catch (e) { $d(3, e) };
    try { nv.delta(100, true); return false } catch (e) { $d(4, e) };
    try { nv.set(null); return false } catch (e) { $d(5, e) };
    try { nv.set(undefined); return false } catch (e) { $d(6, e) };
});
//}}}


//
// $animations
//
//{{{
tester.add(1, 'PlainAnimation, basic usage', function(u, $d){

    var anim = cls.$animations.PlainAnimation.factory();
    anim.bindOnrun(function(){
        var self = this;
        var cnt = 1;
        var timerId = setInterval(function(){
            if (cnt > 5) {
                clearInterval(timerId);
                // スレッド管理のため終了時にはcompleteを呼ぶ
                self.complete();
                return;
            };
            u.consoleLog('Count =', cnt);
            cnt += 1;
        }, 1000);
    });

    anim.getThread().getDeferred().next(function(){
        u.consoleLog('Complete!');
    });

    $('#animations').append(
        $('<a href="javascript:void(0)" />').text(u.title)
        .css({ marginRight:3, fontSize:12 })
        .one('mousedown', function(){ anim.run() })
    );

    return anim;
});
tester.add(1, 'PlainIteratedAnimation basic usage', function(u, $d){
    var anim = cls.$animations.PlainIteratedAnimation.factory(function(counter){
        u.consoleLog('Counter =', counter);
    }, 5, 1000);
    anim.getThread().getDeferred().next(function(){
        u.consoleLog('Complete!');
    });

    $('#animations').append(
        $('<a href="javascript:void(0)" />').text(
            u.title
        ).css({
            marginRight: 3,
            fontSize: 12
        }).one('mousedown', function(){
            anim.run();
        })
    );

    return anim;
});
tester.add(1, 'PlainIteratedAnimation infinity iteration and stop', function(u, $d){
    var anim = cls.$animations.PlainIteratedAnimation.factory(function(result){
        result = result || 0;
        var statuses = ['Hop', 'Step', 'Jump'];
        var idx = result % 3;
        u.consoleLog(result , '=', statuses[idx]);
        result += 1;
        return result;
    }, -1, 500);
    anim.getThread().getDeferred().next(function(){
        u.consoleLog('Stopped!');
    });

    $('#animations').append(
        $('<a href="javascript:void(0)" />').text(
            u.title
        ).css({
            marginRight: 3,
            fontSize: 12
        }).bind('mousedown', function(){
            if (anim.getThread().isStarted() === false) {
                anim.run();
            } else {
                anim.getThread().stop();
            };
        })
    );

    return anim;
});
tester.add(1, 'PlainIteratedAnimation pause and rerun', function(u, $d){
    var anim = cls.$animations.PlainIteratedAnimation.factory(function(counter){
        u.consoleLog('Counter =', counter);
    }, 20, 500);
    anim.getThread().getDeferred().next(function(){
        u.consoleLog('Complete!');
    });

    $('#animations').append(
        $('<a href="javascript:void(0)" />').text(
            u.title
        ).css({
            marginRight: 3,
            fontSize: 12
        }).bind('mousedown', function(){
            if (anim.getThread().isStarted() === false) {
                anim.run();
            } else if (anim.isPaused() === true) {
                anim.rerun();
            } else {
                anim.pause();
            };
        })
    );

    return anim;
});
tester.add(1, 'PlainIteratedAnimation effect to PlainChip', function(u, $d){
    var chip = cls.$chips.PlainChip.factory([32, 32], [10, 0], {
        url: imgUrl + '/usui-Actor4.png',
        fullSize: [96, 128],
        clipPos: [0, 32]
    });
    chip.toRelativePosition();
    chip.addVariation('front', {});
    chip.addVariation('right', {
        clipPos: [64, 32]
    });
    chip.addVariation('back', {
        clipPos: [96, 32]
    });
    chip.addVariation('left', {
        clipPos: [32, 32]
    });
    var variations = ['front', 'right', 'back', 'left'];

    var anim = cls.$animations.PlainIteratedAnimation.factory(function(counter){
        chip.drawChangeVariation(variations[counter % 4]);
    }, 60, 50);

    // 終了状態が 完了(complete) か 強制停止(stop) かで条件分岐
    anim.getThread().getDeferred().next(function(){
        if (anim.getThread().getState() === 'stop') {
            u.consoleLog('Stopped!');
        } else {// 'complete'
            u.consoleLog('Completed!');
        };
    });

    chip.getView().appendTo($('#animations')).mousedown(function(){
        if (anim.getThread().getState() === 'notstart') {// `anim.isStarted() === false` と同じ
            anim.run();
        } else {
            anim.getThread().stop();
        };
    });
    chip.draw();
    chip.show();

    return chip;
});
tester.add(1, 'FadeChangeAnimation, basic usage', function(u, $d){
    var screen = cls.$blocks.PlainBlock.factory([32, 32], [20, 35]);

    var fromRed = cls.$blocks.PlainBlock.factory(screen.getSize());
    fromRed.style({ bg:'#FF0000' });
    fromRed.setZIndex(1);
    fromRed.draw();
    fromRed.show();
    screen.append(fromRed);

    var toBlue = cls.$blocks.PlainBlock.factory(screen.getSize());
    toBlue.style({ bg:'#0000FF' });
    toBlue.setZIndex(10);
    toBlue.draw();
    screen.append(toBlue);

    var anim = cls.$animations.FadeChangeAnimation.factory(fromRed, toBlue, 1000);

    anim.getThread().getDeferred().next(function(){
        u.consoleLog('Complete animation');
        u.consoleLog('Red z-index =', fromRed.getZIndex(), 'Blue z-index', toBlue.getZIndex());
    });

    screen.getView().appendTo($('#animations')).mousedown(function(){
        u.consoleLog('Red z-index =', fromRed.getZIndex(), 'Blue z-index', toBlue.getZIndex());
        u.consoleLog('Start animation');
        anim.run();
    });
    screen.draw();
    screen.show();
});
tester.add(1, 'BlinkAnimation, basic usage', function(u, $d){
    var block = cls.block([32, 32], [20, 70]);
    block.style({ bg:'green' });
    block.getView().appendTo($('#animations'));
    block.drawAndShow();
    block.bindEvent('mousedown', {}, function(){
        var anim = cls.$animations.BlinkAnimation.factory(block, 7/*, { hideStart:false }*/);
        anim.run().next(function(){
            u.consoleLog('Complete');
        });
    });
});
//}}}


//
// $blocks
//
//{{{
tester.add(1, 'PlainBlock basic usage', function(u, $d){

    var screen = cls.$blocks.PlainBlock.factory([100, 50], [0, 0]);
    screen.style({ bg:'#EEE' });
    screen.text('あいう\nえお', 'nl2br');

    screen.getView().appendTo($('#blocks'));
    screen.draw();
    screen.show();

    return screen;
});
tester.add(1, 'TestPlainBlock(assuming, you defined PlainBlock sub-class) show in document', function(u, $d){

    // $functions.inherit 関数でプロトタイプ・チェーン継承する
    // プロトタイプチェーンをしたくない場合は mixin 関数を使う
    var TestPlainBlock = (function(){
        var kls = function(){};
        $f.inherit(kls, new cls.$blocks.PlainBlock());
        kls.prototype.toString = function(){
            return 'TestPlainBlock'
        };
        // 生成関数定義は必ず必要, 以下何も処理を加えない例
        kls.factory = function(){
            return cls.$blocks.PlainBlock.factory.apply(this, arguments);
        };
        return kls;
    })();

    var screen = TestPlainBlock.factory([50, 100], [0, 110]);
    screen.style({ img:'./sample_images/background/bg-128x128.jpg' });

    if (screen.toString() !== 'TestPlainBlock') u.error();
    if (screen instanceof cls.$blocks.PlainBlock !== true) u.error();

    screen.getView().appendTo($('#blocks'));
    screen.draw();
    screen.show();

    return screen;
});
tester.add(1, 'PlainBlock, remove and append', function(u, $d){

    var parent_ = cls.$blocks.PlainBlock.factory([50, 100], [0, 165]);
    parent_.style({ bg:'#EEE' });

    var child1 = cls.$blocks.PlainBlock.factory([40, 40], [5, 5]);
    child1.style({ bg:'#FFFF00' });
    child1.draw();
    child1.show();
    parent_.append(child1);

    var child2 = cls.$blocks.PlainBlock.factory([40, 40], [55, 5]);
    child2.style({ bg:'#FF9933' });
    child2.draw();
    child2.show();
    parent_.append(child2);

    var gc = cls.$blocks.PlainBlock.factory([20, 20], [10, 10]);
    gc.style({ bg:'#FF0000' });
    gc.draw();
    gc.show();
    child1.append(gc);

    parent_.getView().appendTo($('#blocks')).mousedown(function(){
        //
        // removeしても再配置可能
        // ただし、内部でjQuery.removeが実行されるため、イベントハンドラは消失する
        //
        // また、参照が残ってるとデータも残ってるということでもあるので
        // 変数への参照を適切に切ってください
        //
        gc.remove();
        if (Math.random() > 0.5) {
            child1.append(gc);
        } else {
            child2.append(gc);
        };
        gc.draw();
        gc.show();
        u.consoleLog('child1 has', child1.__childrenBlocks__);
        u.consoleLog('child2 has', child2.__childrenBlocks__);
    });
    parent_.draw();
    parent_.show();

    return parent_;
});
tester.add(1, 'PlainBlock has some YourBlocks with parent-child-relationship', function(u, $d){

    //
    // 今度はPlainBlockではなくて抽象基底クラスであるBlockから継承している
    // ライブラリ側としてはこれは絶対ルールだが、利用者様はどのクラスを継承しても問題無い
    //
    // 何が変わるかというと、もちろん末端クラスの持ってる機能が無くなる点
    // ただ、PlainBlockの場合はほとんど変わらない、cloneメソッドが消えるだけ
    //
    var YourBlock = (function(){
        var kls = function(){};
        $f.inherit(kls, new cls.Block());

        kls.prototype._remove = function(){
            u.consoleLog('Removed =', this);
        };

        // 生成関数factoryが無いので作る
        kls.factory = function(size, position,  backgroundColor){
            // まずは親クラスの生成関数を自分のスコープで呼ぶ
            var obj = cls.Block._factory.apply(this, [size, position]);
            // クリックしたら削除するイベントを付与
            obj.__view__.bind('mousedown', {self:obj}, function(evt){
                var self = evt.data.self;
                self.remove();
                // イベントの伝搬を止めている
                // ref) http://semooh.jp/jquery/cont/doc/event/
                evt.stopPropagation();
            });
            // 背景色を設定し易くしてみる
            //   _initializeへ引数やプロパティで渡して実行してもいいけど
            //   特に理由が無ければここにベタ書きでもいいと思う
            obj.style({ bg:backgroundColor});
            return obj;
        };

        return kls;
    })();

    // ついでに親子関係のテストもする
    var s = cls.$blocks.PlainBlock.factory([100, 100], [0, 220]);
    s.style({ img:'./sample_images/background/bg-32x32.png' });

    var p = YourBlock.factory([100, 100], [0, 0], '#EEE');
    var c1 = YourBlock.factory([40, 40], [0, 0], '#FF0000');
    var c2 = YourBlock.factory([20, 20], [40, 40], '#00FF00');
    var c3 = YourBlock.factory([40, 40], [60, 60], '#0000FF');
    p.append(c1);
    p.append(c2);
    p.append(c3);

    var gc1_1 = YourBlock.factory([10, 30], [5, 5], '#FF9933');
    var gc1_2 = YourBlock.factory([10, 30], [5, 25], '#FF9933');
    c1.append(gc1_1);
    c1.append(gc1_2);

    var gc3 = YourBlock.factory([20, 20], [10, 10], '#3399FF');
    c3.append(gc3);

    s.append(p);
    s.getView().appendTo($('#blocks'));
    s.draw(true);
    s.show(true);

    return s;
});
tester.add(1, 'PlainBlock, use covering', function(u, $d){
    var b = cls.$blocks.PlainBlock.factory([100, 40], [55, 0]);
    b.style({ bg:'yellow' });
    b.getView().appendTo($('#blocks')).mousedown(function(){
        var r = Math.random();
        if (r > 0.5) {
            b.drawCover('key', 'black_mist');
            u.consoleLog(b.__coverViews__);
        } else {
            b.clearCover('key');
            u.consoleLog(b.__coverViews__);
        };
    });
    b.draw();
    b.show();
});
tester.add(1, 'PlainBlock positioning by relative', function(u, $d){
    var frame = cls.$blocks.PlainBlock.factory([100, 100], [0, 440]);// これは絶対配置
    frame.style({ bg:'#EEE' });

    var b1 = cls.$blocks.PlainBlock.factory([80, 10], [0, 10]);
    b1.toRelativePosition();// position:relative; top:0; left:10px; と同じ
    b1.setZIndex(1);
    b1.style({ bg:'#CCC' });

    var b2 = b1.clone();
    b2.move([+10, 0]);// position:relative; top:20px; left:10px; と同じ

    var b3 = b2.clone();
    b3.move([+10, 0]);

    frame.append(b1);
    frame.append(b2);
    frame.append(b3);

    var p1 = cls.$blocks.PlainBlock.factory([40, 20]);
    p1.style({ bg:'orange' });
    var p2 = p1.clone();
    var p3 = p2.clone();

    try { p1.pos(['top', 'left']); return false } catch(err) {$d(err)}; // 追加前は無理

    frame.append(p1);
    frame.append(p2);
    frame.append(p3);

    p1.pos(['top', 'left']);
    p2.pos(['center', 'center']);
    p3.pos(['bottom', 'right']);

    frame.getView().appendTo($('#blocks'));
    frame.draw(true);
    frame.show(true);
});
tester.add(1, 'Block.animate, basic usage', function(u, $d){

    var frame = cls.$blocks.PlainBlock.factory([50, 100], [0, 550]);
    frame.style({ bg:'#EEE' });

    var mover = cls.$blocks.PlainBlock.factory([25, 25], [0, 0]);
    mover.style({ bg:'#FF9933' });

    var isStarted = false;

    frame.append(mover);
    frame.getView().appendTo($('#blocks')).bind('mousedown', function(){

        if (isStarted) {
            //! 今はstop時のハンドラは無いので注意, 理由はソース参照
            mover.stop();
            return false;
        };
        isStarted = true;

        mover.animate({
            top: 75,
            left: 25
        }, {
            duration: 3000,
            easing: 'linear'//,
        });
    });
    frame.draw(true);
    frame.show(true);
});
tester.add(1, 'Block.fadeIn/fadeOut, basic usage', function(u, $d){
    var face = cls.$chips.PlainChip.factory([96, 96], [0, 610], img.get('face_heroine', 1));
    face.getView().appendTo($('#blocks')).one('mousedown', function(){
        face.fadeOut('fast', function(){
            face.fadeIn('slow', function(){
                face.fadeOut(3000, function(){
                    face.fadeIn(3000, function(){
                        u.consoleLog('fadeOut/fadeIn end');
                    });
                });
            });
        });
    });
    face.draw();
    face.show();
});
tester.add(1, 'TextBlock, basic usage', function(u, $d){
    var tb = cls.$blocks.TextBlock.factoryFast(80, 'あるこう\nあるこう\nわたしは元気', [0, 710]);
    tb.style({ fontSize:12, letterSpacing:1 });
    tb.style({ bg:'#EEE' });
    tb.drawAndShow();
    tb.getView().appendTo($('#blocks'));
});
tester.add(1, 'TextBlock, use factory and padding and clone', function(u, $d){
    var tb = cls.$blocks.TextBlock.factory();
    tb.size([80, null]);
    tb.pos([60, 710]);
    tb.style({ fontSize:10, letterSpacing:1 });
    tb.style({ bg:'#EEE' });
    tb.setText('padding5px');
    tb.setLineHeight(20);
    tb.setPadding(5);
    tb.adjustHeight();
    var cloned = tb.clone();
    cloned.drawAndShow();
    cloned.getView().appendTo($('#blocks'));
});
tester.add(1, 'GaugeBlock, basic usage', function(u, $d){
    var gauge = cls.$blocks.GaugeBlock.factory([28, 2], [105, 3]);
    gauge.setEmptyColor('#FF0000');
    gauge.setValueColor('#00FF00');
    gauge.setGaugeRate(0.33);
    gauge.drawAndShow();
    gauge.getView().appendTo($('#blocks'));
    var gauge2 = cls.$blocks.GaugeBlock.factory([64, 5], [110, 3]);
    gauge2.setEmptyColor('#FF0000');
    gauge2.setValueColor('#FFFF00');
    gauge2.drawAndShow();
    gauge2.getView().appendTo($('#blocks')).bind('mousedown', {}, function(){
        var anim = cls.$animations.PlainIteratedAnimation.factory(function(counter){
            gauge2.setGaugeRate((1 - counter / 50));
            gauge2.draw();
        }, 50, 50);
        anim.getThread().getDeferred().next(function(){
            u.consoleLog('Complete!');
            return Deferred.wait(1.0).next(function(){
                gauge2.setGaugeRate(1.0);
                gauge2.draw();
            });
        });
        anim.run();
    });
});
//}}}


//
// $boards, MapEditor
//
//{{{
tester.add(1, 'PlainBoard, basic development APIs usage', function(u, $d){
//{{{
    // 列4x行6 の盤
    var board = cls.$boards.PlainBoard.factory([4, 6], [32, 32]);

    // マスが持つオブジェクトの層を設定する
    // 下記の例では 地形(草原や山等)、地点(城や看板)、キャラ の3層構成を定義している
    board.defineLayer('landform', 1);
    board.defineLayer('spot', 5);
    board.defineLayer('character', 10);

    try {
        board.defineLayer('landform', 2);
        return false;
    } catch (err) { $d(err) };
    try {
        board.defineLayer('not_enough_order', 0);
        return false;
    } catch (err) { $d(err) };
    try {
        board.defineLayer('over_order', 101);
        return false;
    } catch (err) { $d(err) };

    var landformLayer = board.getLayer('landform');

    // OK, 非オートタイル
    landformLayer.addBlockModel('grass', function(size, options){
        return cls.$chips.PlainChip.factory(size, null, {
            url: imgUrl + '/TileA2.png',
            fullSize: [512, 384],
            clipPos: [0, 0]
        });
    });
    // OK, オートタイル
    landformLayer.addBlockModel('road', function(size, options){
        return cls.$chips.PlainChip.factory(size, null, {
            type: 'auto_tiling',
            url: imgUrl + '/TileA2.png',
            fullSize: [512, 384],
            clipPos: [0, 128]
        });
    });
    // OK, 上記'grass'の原型を使って修正して返している
    landformLayer.addBlockModel('thick_grass', function(size, options){
        var block = options.layer.getBlockModel('grass').factory(size, options);
        block.addVariation('thick', {
            clipPos: [192, 0]
        });
        block.changeVariation('thick');
        return block;
    });
    // 実行時NG, ブロックを返さない
    landformLayer.addBlockModel('not_returned_block', function(size, options){});

    try { landformLayer.addBlockModel('grass', function(){});
        return false; } catch (err) { $d(err) };
    try { landformLayer.addBlockModel('hill', 'not_func');
        return false; } catch (err) { $d(err) };

    var grass = landformLayer.createBlock('grass');
    var road = landformLayer.createBlock('road');
    var thickGrass = landformLayer.createBlock('thick_grass');
    $d('Layer blocks =', grass, road, thickGrass);

    // isAutoTile
    if (grass.isAutoTile() !== false) u.error();
    if (road.isAutoTile() !== true) u.error();

    try { landformLayer.createBlock('not_returned_block');
        return false; } catch (err) { $d(err) };

    var sq = board.getSquare([0, 0]);
    try { board.getSquare(undefined);
        return false; } catch (err) { $d(err) };
    try { board.getSquare([999,999]);
        return false; } catch (err) { $d(err) };
    $d('square =', sq);

    sq.setLayerBlock('landform', 'grass');
    try { sq.setLayerBlock('landform', 'road');
        return false; } catch (err) { $d(err) };
    sq.removeLayerBlock('landform');
    try { sq.removeLayerBlock('landform');
        return false; } catch (err) { $d(err) };
    try { sq.setLayerBlock('landform', null);
        return false; } catch (err) { $d(err) };
    try { sq.setLayerBlock('landform', 'not_defined_block_model_type');
        return false; } catch (err) { $d(err) };
    sq.setLayerBlock('landform', cls.$chips.PlainChip.factory(board.getSize(), null, {// 個別設定
        url: imgUrl + '/TileA2.png',
        fullSize: [512, 384],
        clipPos: [0, 0]
    }));
    sq.removeLayerBlock('landform');

    // isSameTile
    sq.setLayerBlock('landform', 'grass');
    var sq01 = board.getSquare([0, 1]);
    if (sq.isSameTile(sq01, 'landform')) u.error();
    sq01.setLayerBlock('landform', 'grass');
    if (sq.isSameTile(sq01, 'landform') === false) u.error();
    sq.removeLayerBlock('landform');
    if (sq.isSameTile(sq01, 'landform')) u.error();
    sq.setLayerBlock('landform', 'road');
    if (sq.isSameTile(sq01, 'landform')) u.error();
    sq01.removeLayerBlock('landform');
    sq01.setLayerBlock('landform', 'road');
    if (sq.isSameTile(sq01, 'landform') === false) u.error();

    // 条件指定の eachSquares
    var c = 0;
    board.eachSquares(function(sq, utils){
        if (sq.getRowIndex() > 1) u.error();
        if (sq.getColumnIndex() > 2) u.error();
        $d('1) 行,列 =', sq.getRowIndex(), sq.getColumnIndex());
        c += 1;
    }, {// 行0,1 列0,1,2 のみ実行
        rect: [0, 2, 1, 0]
    });
    if (c !== 6) u.error();

    c = 0;
    board.eachSquares(function(sq, utils){
        if (sq.getRowIndex() < 3) u.error();
        if (sq.getColumnIndex() < 2) u.error();
        $d('2) 行,列 =', sq.getRowIndex(), sq.getColumnIndex());
        c += 1;
    }, {// 行3,4,5 列2,3 のみ実行
        rect: [3, null, null, 2]
    });
    if (c !== 6) u.error();

    // フリースペース
    var sq = board.getSquare([3, 3]);
    try { sq.getFreeSpace('not_defined');
        return false; } catch (err) { $d(err) };
    sq.setFreeSpace('yourkey', 'YOURVALUE');
    if (sq.getFreeSpace('yourkey') !== 'YOURVALUE') u.error('freespace');
//}}}
});
tester.add(1, 'PlainBoard, basic usage', function(u, $d){

    var board = cls.$boards.PlainBoard.factory([5, 5], [32, 32], [10, 10]);

    board.defineLayer('landform', 1);
    board.defineLayer('map_object', 2);

    var landformLayer = board.getLayer('landform');
    landformLayer.addBlockModel('grass', function(){
        return cls.$chips.PlainChip.factory([32, 32], null, {
            url: imgUrl + '/TileA2.png',
            fullSize: [512, 384],
            clipPos: [0, 0]
        });
    });

    // 個別マップオブジェクトであるキャラクター
    var cc = cls.$chips.PlainChip.factory([32, 32], null, {
        url: imgUrl + '/usui-Actor4.png',
        fullSize: [96, 128],
        clipPos: [0, 32]
    });
    board.getSquare([1, 1]).setLayerBlock('map_object', cc);

    board.eachSquares(function(sq){
        // 要素配置
        sq.setLayerBlock('landform', 'grass');
        // クリックイベント設定
        sq.bindOnsquareclick(function(evt){
            var self = evt.data.square;
            var currentSquare;
            board.eachSquares(function(sq){// キャラの場所を判定
                if (sq.hasLayerBlock('map_object')) {
                    currentSquare = sq;
                    return false;
                };
            });
            // ブロック移動
            currentSquare.drawMovingLayerBlock(self, 'map_object');
            u.consoleLog('Move block from', currentSquare, 'to', self);
        });
    });

    // 各マスのレイヤーへ全部ブロックを配置し終わったら描画する
    board.draw();

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12})
        .text(u.title)
        .one('mousedown', function(){
            board.getView().appendTo($(document.body));
            board.show();
        })
        .appendTo($('#boards'))
    ;
    $d(board);
    return board;
});
tester.add(1, 'PlainBoard, decorations', function(u, $d){

    var board = cls.$boards.PlainBoard.factory([3, 3], [32, 32], [10, 10]);

    board.defineLayer('landform', 1);
    board.defineLayer('bg', 5);
    board.defineLayer('map_object', 10);

    var landformLayer = board.getLayer('landform');
    landformLayer.addBlockModel('bush', function(size, options){
        return img.asChip('mani2_bg', 7);
    });

    var bgLayer = board.getLayer('bg');
    bgLayer.addBlockModel('normal', function(size, options){
        return cls.$blocks.PlainBlock.factory(size);
    });

    var cc = img.asChip('front');
    board.getSquare([0, 0]).setLayerBlock('map_object', cc);

    var signboard = img.asChip('signboard');
    board.getSquare([2, 2]).setLayerBlock('map_object', signboard);

    var modes = [
        'closing_line',
        'coloring',
        'background_coloring',
        'blinking'
    ];
    var modeIdx = 0;

    var colors = [
        ['mist'],
        ['fog'],
        ['cloud'],
        ['black_fog'],
        ['#FF0000', 1.0],
        ['#FFFF00', 0.5]//,
    ];
    var coloringIdx = 0;
    var bgcoloringIdx = 0;

    board.eachSquares(function(sq){

        sq.setLayerBlock('landform', 'bush');
        sq.setLayerBlock('bg', 'normal');

        sq.bindOnsquareclick(function(evt){
            var self = evt.data.square;

            // 看板のあるマスだけはモード変更
            if (self.hasLayerBlock('map_object') && self.getLayerBlock('map_object') === signboard) {
                modeIdx += 1;
                u.consoleLog('Change mode to', '"' + modes[modeIdx % modes.length] + '"');
                if (modeIdx % 10 === 0) {// 10回ごとに全削除
                    board.eachSquares(function(sq){
                        sq.clearClosingLine();
                        sq.clearColoring();
                        sq.clearLayerColoring('bg');
                    });
                    u.consoleLog('Clear all');
                };
                return true;
            };

            var mode = modes[modeIdx % modes.length];

            if (mode === 'closing_line') {
                self.drawClosingLine();
                u.consoleLog('Closing line');
            } else if (mode === 'coloring') {
                var args = colors[coloringIdx % colors.length];
                self.drawColoring.apply(self, args);
                u.consoleLog('Coloring to', args);
                coloringIdx += 1;
            // 機能として提供されている着色は全てレイヤーの上に掛かるものなので
            // もしレイヤーの下やレイヤー内、つまりはキャラの後ろなどに設定したければ
            // 自分で着色用のレイヤーを作る必要がある
            } else if (mode === 'background_coloring') {
                var args = colors[bgcoloringIdx % colors.length];
                args = cls.JSONUtils.deepcopy(args);
                args.unshift('bg');
                self.drawLayerColoring.apply(self, args);
                u.consoleLog('Background coloring to', args);
                bgcoloringIdx += 1;
            } else if (mode === 'blinking') {
                self.runBlinking();
                u.consoleLog('Blinking');
            };
        });
    });

    board.draw();

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12})
        .text(u.title)
        .one('mousedown', function(){
            board.getView().appendTo($(document.body));
            board.show();
        })
        .appendTo($('#boards'))
    ;
    $d(board);
    return board;
});
tester.add(1, 'PlainBoard, with auto tiling basic usage', function(u, $d){

    var board = cls.$boards.PlainBoard.factory([5, 5], [32, 32], [10, 10]);
    board.defineLayer('landform', 1);
    var landformLayer = board.getLayer('landform');

    // 石畳
    landformLayer.addBlockModel('road', function(size, options){
        return img.asAutoTile('a2', 3);
    });
    // 丘
    landformLayer.addBlockModel('hill', function(size, options){
        // 他の設定を引き継ぐ場合
        // 画像設定を二度書かないように作ったのだが ImageIndexer が出来たからいらない気がする
        // 折を見て消去するかも
        var block = options.layer.getBlockModel('road').factory(size, options);
        block.addVariation('hilled', {clipPos:[192,64]});
        block.changeVariation('hilled');
        return block.clone(); // ついでにオートタイルのcloneテスト
    });
    // 穴
    landformLayer.addBlockModel('hole', function(size, options){
        return img.asAutoTile('a2', [2, 2]);
    });
    // 非オートタイル
    landformLayer.addBlockModel('grass', function(size, options){
        return img.asChip('a2', 1);
    });

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12})
        .text(u.title)
        .one('mousedown', function(){

            //--------------------
            board.eachSquares(function(sq){
                // 初期設定
                sq.setLayerBlock('landform', 'road');
                // クリック時にタイルを変更する設定
                var keys = ['hill', 'hole', 'grass', 'road'];
                var keyIdx = 0;
                sq.bindOnsquareclick(function(evt){
                    var self = evt.data.square;
                    self.removeLayerBlock('landform');
                    var block = self.setLayerBlock('landform', keys[keyIdx % keys.length]);
                    block.show(); // 面倒だけど、普通地形が変わることはそうないはず
                    board.syncBoundaryData('landform');
                    board.draw();
                    keyIdx += 1;
                });
            });
            // 全タイルを配置後に境界線データを設定
            board.syncBoundaryData('landform');
            // その後に描画
            board.draw();
            //--------------------

            board.getView().appendTo($(document.body));
            board.show();
        })
        .appendTo($('#boards'))
    ;
    $d(board);
    return board;
});
tester.add(1, 'PlainMapEditor, basic usage', function(u, $d){

    // 盤設定
    var board = cls.$boards.PlainBoard.factory([7, 9], [32, 32]);

    var landform1 = board.defineLayer('landform1', 10);
    var landform2 = board.defineLayer('landform2', 20);
    var landform3 = board.defineLayer('landform3', 30);
    var spot = board.defineLayer('spot', 40);

    landform1.addBlockModel('grass', function(){ return img.asAutoTile('a2', 1) });
    landform1.addBlockModel('lava', function(){ return img.asAutoTile('a2', [3, 0]) });
    landform1.addBlockModel('hole_on_grass', function(){ return img.asAutoTile('a2', [2, 2]) });
    landform1.addBlockModel('hole_on_lava', function(){ return img.asAutoTile('a2', [3, 1]) });
    // 草穴穴溶穴穴草 こんな風にしたいときに下記の設定が必要になる
    landform1.defineSameKinds('hole_on_grass', 'hole_on_lava');

    landform2.addBlockModel('road', function(){ return img.asAutoTile('a2', 3) });
    landform2.addBlockModel('desert', function(){ return img.asAutoTile('a2', 4) });
    landform2.addBlockModel('highland', function(){ return img.asAutoTile('a2', [2, 1]) });
    landform2.addBlockModel('hole', function(){ return img.asAutoTile('a2', [2, 2]) });
    // 枠無し
    landform2.addBlockModel('grass', function(){ return img.asAutoTile('a2', 6) });
    landform2.addBlockModel('bush', function(){ return img.asAutoTile('creava_a2', 5) });

    landform3.addBlockModel('forest', function(){ return img.asAutoTile('creava_a2', 2) });
    landform3.addBlockModel('mountain', function(){ return img.asAutoTile('creava_a2', 3) });
    landform3.addBlockModel('canyon', function(){ return img.asAutoTile('creava_a2', [2, 2]) });
    landform3.addBlockModel('fence', function(){ return img.asAutoTile('a2', 5) });

    spot.addBlockModel('signboard', function(){ return img.asChip('signboard') });
    spot.addBlockModel('gray_rock', function(){ return img.asChip('gray_rock') });
    spot.addBlockModel('wooden_grave', function(){ return img.asChip('wooden_grave') });
    spot.addBlockModel('stump', function(){ return img.asChip('stump') });

    // エディタ設定
    var me = cls.mapEditor([450, 400], [10, 10], board, {
        //paletteExtent: [4, 7]
    });
    me.style({ bg:'#F6F6F6' });
    //me.enableBeforeunload(); // ページ移動時に確認ダイアログを出したい場合
    me.addCommand('Close', function(utils){// 閉じるコマンド追加
        u.consoleLog(utils);
        if (confirm('OK?') === true) this.remove();
        return false;
    });

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12}).text(u.title)
        .one('mousedown', function(){
            me.draw();
            me.getView().appendTo($(document.body));
            me.show();
        })
        .appendTo($('#boards'))
    ;
});
tester.add(1, 'PlainMapEditor, data loading', function(u, $d){
//{{{
    var board = cls.$boards.PlainBoard.factory([3, 2], [32, 32]);

    var x = board.defineLayer('x', 1);
    var y1 = board.defineLayer('y1', 2);
    var y2 = board.defineLayer('y2', 3);

    x.addBlockModel('bx1', function(){ return img.asAutoTile('a2', 1) });
    x.addBlockModel('bx2', function(){ return img.asAutoTile('a2', 2) });
    y1.addBlockModel('by11', function(){ return img.asAutoTile('a2', 3) });
    y1.addBlockModel('by12', function(){ return img.asAutoTile('a2', 4) });
    y2.addBlockModel('by2', function(){ return img.asAutoTile('a2', 5) });

    var me = cls.mapEditor([400, 300], [10, 10], board, {
        paletteExtent: [4, 4]
    });
    me.style({ bg:'#F6F6F6' });
    //me.enableBeforeunload();

    var json;
    var clone = function(){ return cls.JSONUtils.fromJSON(me.dumpBoardData()) };
    $d('sample =', clone());

    json = clone();
    json.extent = [3, 3];// サイズ違い
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    delete json.layers.y2;// レイヤキー無し
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    json.layers.x.order = 99;// オーダー違い
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    delete json.layers.y1.block_models.by11;// レイヤ内に原型無し
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    delete json.squares.x;// マスマップ内にレイヤ足りず
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    json.squares.y1 = '3' + json.squares.y1;// マスに存在しないはずのidがある
    try { me.loadBoardData(json); return false; } catch (err) { $d(err) };

    json = clone();
    json.squares.y1 = '2' + json.squares.y1;// 左上に初期値を入れた正しいデータ
    me.loadBoardData(json);

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12}).text(u.title)
        .one('mousedown', function(){
            me.draw();
            me.getView().appendTo($(document.body));
            me.show();
        })
        .appendTo($('#boards'))
    ;
//}}}
});
//}}}


//
// $chips
//
//{{{
tester.add(1, 'PlainChip basic usage', function(u, $d){

    var screen = cls.$blocks.PlainBlock.factory([64, 64]);
    screen.style({ bg:'#EEE' });

    var mc = cls.$chips.PlainChip.factory([32, 32], null, {
        url: imgUrl + '/signboard.png',
        fullSize: [32, 32],
        clipPos: [0, 0]
    });

    var cc = cls.$chips.PlainChip.factory([32, 32], [32, 32], {
        url: imgUrl + '/usui-Actor4.png',
        fullSize: [96, 128],
        clipPos: [0, 32]
    });
    cc.addVariation('front', {}); // __default__ のエイリアス設定のみ
    cc.addVariation('back', {
        clipPos: [96, 32]
    });

    screen.append(mc);
    screen.append(cc);
    screen.getView()
        .one('mousedown', function(){
            // 看板がコピーされる
            var cloned = mc.clone();
            screen.append(cloned);
            cloned.move([+8, +16]);
            cloned.draw();
            cloned.show();
            // キャラが後ろを向く
            cc.drawChangeVariation('back');
        })
        .appendTo($('#chips'));
    screen.draw(true);
    screen.show(true);

    return screen;
});
tester.add(1, 'PlainChip cloned with background', function(u, $d){

    var screen = cls.$blocks.PlainBlock.factory([32, 64], [0, 70]);
    screen.style({ bg:'#EEE' });

    var mc = cls.$chips.PlainChip.factory([32, 32], null, {
        url: imgUrl + '/signboard.png',
        fullSize: [32, 32],
        clipPos: [0, 0]
    });

    try {// typeは現在変更不可
        mc.addVariation('type_is_not_changable', {type:'normal'});
        return false;
    } catch (err) { $d(err) };

    screen.append(mc);
    screen.getView()
        .one('mousedown', function(){
            var cloned = mc.clone();
            screen.append(cloned);
            cloned.move([+32, 0]);
            cloned.draw();
            cloned.show();
        })
        .appendTo($('#chips'));
    screen.draw(true);
    screen.show(true);

    return screen;
});
tester.add(1, 'PlainChip factory with \'auto_tiling\' option', function(u, $d){

    var tile = cls.$chips.PlainChip.factory([32, 32], [65, 0], {
        type: 'auto_tiling',
        url: imgUrl + '/TileA2.png',
        fullSize: [512, 384],
        clipPos: [0, 128]
    });
    tile.style({ bg:'#EEE' });

    // NG境界線データ
    var invalidValues = [
        '00000000',
        [],
        [0,0,0,0,0,0,0,true],
        [0,0,0,1,0,1,1,0],
        [1,0,0,0,0,0,0,1]//,
    ];
    var noneAllError = false;
    var i;
    for (i = 0; i < invalidValues.length; i++) {
        try {
            tile.setBoundaryData(invalidValues[i]);
            noneAllError = true;
        } catch(err) { $d('NP =', err) }
    };
    if (noneAllError) u.error();

    // 有り得る境界線データを全部巡回させてテスト
    // 座標が拾えてないと中でエラーが発生する
    var values = [];
    var model = [0,0,0,0,0,0,0,0];
    values.push(cls.JSONUtils.deepcopy(model));
    var i, c;
    for (i = 0; i < 8; i++) {
        // [1,0,0,0,0,0,0,0] を1巡させる
        c = cls.JSONUtils.deepcopy(model);
        c[i]++;
        values.push(c);
        // [1,0,1,0,0,0,0,0] を1巡させる
        c = cls.JSONUtils.deepcopy(model);
        c[i]++;
        c[(i + 2) % model.length]++;
        values.push(c);
        // これで各パーツごとに 一辺のみx2 二辺x1 隅x1 なしx1 の全てのパターンが判定される
    };
    var p;
    for (i = 0; i < values.length; i++) {
        $d('From =', values[i]);
        var p = cls.ImageProtocol.parseBoundaryData(values[i]);
        $d('To =', p);
    };

    // OK境界線データ
    tile.setBoundaryData(values[0]);
    var valueIdx = 0;

    tile.getView()
        .bind('mousedown', function(evt){
            var v = values[valueIdx % values.length];
            u.consoleLog('Current boundary data =', v);
            tile.setBoundaryData(v);
            tile.draw();
            valueIdx += 1;
        })
        .appendTo($('#chips'));
    tile.draw();
    tile.show();
    return tile;
});
tester.add(1, 'PlainChip factory with \'resize\' option', function(u, $d){

    var r = cls.$blocks.PlainBlock.factory([80, 80], [0, 105]);
    r.style({ bg:'#EEE' });

    var cc = cls.$chips.PlainChip.factory([64, 64], [8, 8], {
        type: 'resize',
        url: imgUrl + '/usui-Actor4.png',
        fullSize: [96, 128],
        clipPos: [0, 32],
        clipSize: [32, 32]
    });
    cc.addVariation('back_and_grow', {
        clipPos: [96, 32],
        clipSize: [32, 16] // 縦のクリップサイズを縮めたので縦に画像が伸びることになる
    });

    r.append(cc);
    r.getView()
        .bind('mousedown', {}, function(evt){
            cc.drawChangeVariation('back_and_grow');
        })
        .appendTo($('#chips'));
    r.draw(true);
    r.show(true);

    return screen;
});
tester.add(1, 'PlainChip factory with \'repeat\' option', function(u, $d){

    var chip = cls.$chips.PlainChip.factory([80, 80], [0, 200], {
        type: 'repeat',
        url: imgUrl + '/usui-Actor4.png',
        fullSize: [96, 128],
        clipPos: [96, 32],
        clipSize: [32, 32]
    });
    chip.addVariation('turn_right', {
        clipPos: [64, 32]
    });

    chip.getView()
        .one('mousedown', function(){
            chip.drawChangeVariation('turn_right');
        })
        .appendTo($('#chips'));
    chip.draw();
    chip.show();

    return screen;
});
tester.add(1, 'PlainChip, use for face', function(u, $d){
    var chip = cls.$chips.PlainChip.factory([96, 96], [0, 290], img.get('face_boy', 1));
    chip.addVariation('none', img.get('face_boy', 1));
    chip.addVariation('smiling', img.get('face_boy', 5));
    chip.addVariation('annoyed', img.get('face_boy', 2));
    chip.addVariation('angry', img.get('face_boy', 8));
    chip.addVariation('sad', img.get('face_boy', 6));
    chip.addVariation('crying', img.get('face_boy', 7));
    chip.addVariation('surprised', img.get('face_boy', 6));
    chip.addVariation('appalling', img.get('face_boy', 4));

    var names = chip.getVariationNames();
    var idx = 0;

    chip.getView()
        .bind('mousedown', {}, function(evt){
            idx += 1;
            var name = names[idx % names.length];
            u.consoleLog('Variation name =', name);
            chip.drawChangeVariation(name);
        })
        .appendTo($('#chips'))
    ;
    chip.draw();
    chip.show();
    return chip;
});
tester.add(1, 'CharacterChip, point', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [0, 390]);
    chip.bindDisablingContextmenu();
    chip.drawAndShow();
    var currentValue = 0;
    chip.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                currentValue = (currentValue + 1) % 4;
                u.consoleLog('Change value to', currentValue);
            } else {
                chip.point(currentValue);
                chip.draw(false);
                u.consoleLog('point to', currentValue);
            };
            return false;
        })
        .bind('mouseover', {}, function(evt){
            $d('Please right-click');
        })
        .appendTo($('#chips'))
    ;
});
tester.add(1, 'CharacterChip, turn', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [33, 390]);
    chip.bindDisablingContextmenu();
    chip.drawAndShow();
    var currentValue = 0;
    chip.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                currentValue = (currentValue + 1) % 4;
                u.consoleLog('Change value to', currentValue);
            } else {
                chip.turn(currentValue);
                chip.draw(false);
                u.consoleLog('turn to', currentValue);
            };
            return false;
        })
        .appendTo($('#chips'))
    ;
});
tester.add(1, 'CharacterChip, pose', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [66, 390]);
    chip.bindDisablingContextmenu();
    chip.drawAndShow();
    var currentValue = 0;
    chip.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                chip.turn(1);
                chip.draw(false);
                u.consoleLog('turn to 1');
            } else {
                chip.pose(currentValue);
                chip.draw(false);
                u.consoleLog('pose to', currentValue);
                currentValue = (currentValue + 1) % 3;
            };
            return false;
        })
        .appendTo($('#chips'))
    ;
});
tester.add(1, 'CharacterChip, stamp', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [0, 425]);
    chip.bindDisablingContextmenu();
    chip.drawAndShow();
    chip.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                chip.live({ duration:5000 }).next(function(){
                    u.consoleLog('live end');
                }).error(function(err){ u.consoleLog(err) });
                return false;
            };
            chip.stamp();
            chip.drawCharacterBody();
        })
        .appendTo($('#chips'))
    ;
});
tester.add(1, 'CharacterChip, move', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [33, 425]);
    var button = cls.block([32, 32], [33, 425]);
    button.bindDisablingContextmenu();
    button.style({ bg:'#CCC',fontSize:10 });
    button.drawAndShow();

    var modes = ['move', 'walk', 'path'];
    var modeIndex = 0;
    var _getMode = function(){ return modes[modeIndex] };
    button.text(_getMode());

    button.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                modeIndex = (modeIndex + 1) % modes.length;
                button.text(_getMode());
                return false;
            };
            var field = cls.block([640, 320]);
            field.style({ bg:'#EEE' });
            field.drawAndShow();
            field.getView().appendTo($('#chips'));
            var chip = cls.$chips.CharacterChip.factoryBy3x4(imgUrl + '/usui-Actor4.png');
            field.append(chip);
            chip.drawAndShow();
            // move
            if (_getMode() === 'move') {
                chip.runMoving([64, 320], 5000, 333).next(function(){
                    u.consoleLog('move end, pos =', chip.getPos());
                    field.remove();
                });
            // walk
            } else if (_getMode() === 'walk') {
                chip.walk(3).next(function(){
                    chip.point(3);
                    chip.drawChipBody();
                    return chip.walk(5, null, { paceTime:666 });
                }).next(function(){
                    return chip.walk(3, 3, { paceTime:999 });
                }).next(function(){
                    chip.turn(1);
                    chip.drawChipBody();
                    return chip.walk(6, null, { paceTime:999, paceStampCount:12 });
                }).next(function(){
                    chip.turn(2);
                    chip.drawChipBody();
                    return chip.dash(5);
                }).next(function(){
                    chip.turn(3);
                    chip.drawChipBody();
                    return chip.amble(4);
                }).next(function(){
                    u.consoleLog('move end, pos =', chip.getPos());
                    return Deferred.wait(1.0);
                }).next(function(){
                    field.remove();
                }).error(function(err){
                    u.consoleLog(err);
                });
            // followPath
            } else if (_getMode() === 'path') {
                chip.followPath(
                    cls.Range.strToCoords('(0..4,0)(5,0..5)(4..0,5)(0,4..0)'),
                    { 0:[1,0], 1:[0,-1], 2:[-1,0], 3:[0,1] }, {
                        //moveMethodName: 'dash'
                    }
                ).next(function(){
                    u.consoleLog('move end, pos =', chip.getPos());
                    return Deferred.wait(1.0).next(function(){ field.remove() });
                }).error(function(err){
                    u.consoleLog(err);
                });
            };
            return false;
        })
        .appendTo($('#chips'))
    ;
});
tester.add(1, 'CharacterChip, clone', function(u, $d){
    var chip = cls.$chips.CharacterChip.factoryBy3x4(
        imgUrl + '/usui-Actor4.png', null, [66, 425]);
    chip.bindDisablingContextmenu();
    chip.drawAndShow();
    chip.getView()
        .bind('mousedown', {}, function(evt){
            var isRightClick = (evt.which === 3);
            if (isRightClick) {
                chip.point($f.randInt(0, 3))
                chip.pose($f.randInt(0, 2))
                chip.drawCharacterBody();
                return false;
            };
            var cloned = chip.clone();
            chip.remove();
            Deferred.wait(0.25).next(function(){
                cloned.drawAndShow();
                cloned.getView().appendTo('#chips');
                u.consoleLog('cloned');
            }).error(function(err){ u.consoleLog(err) });
        })
        .appendTo($('#chips'))
    ;
});
//}}}


//
// $chipAnimations
//
//{{{
tester.add(1, 'GobackChipAnimation basic usage', function(u, $d){
    var chip = cls.$chips.WindowPauseSignChip.factoryByImageProtocol(
        'rpg_tkool_vx',
        null,
        imgUrl + '/window_skin-2.png'
    );
    chip.getView()
        .bind('mousedown', {}, function(evt){
            if (chip.getAnimation().getThread().isStarted() === false) {
                chip.startAnimation();
                u.consoleLog('Threads =', ThreadManager.getServer().findActiveClients());
            } else {
                chip.remove();// 削除したらアニメーションも消えてる
                u.consoleLog('Threads =', ThreadManager.getServer().findActiveClients());
            };
        })
        .appendTo($('#chip_animations'));
    chip.draw();
    chip.show();
    return chip;
});
//}}}


//
// $dialogs
//
//{{{
tester.add(1, 'PlainDialog, basic usage (alert like)', function(u, $d){
    linkButton('#dialogs', u.title)
        .bind('mousedown', function(){
            var scr = cls.block([600, 400]);
            scr.style({ bg:'#FAFAFA' });
            var dia = cls.$dialogs.PlainDialog.factory();
            scr.append(dia);
            dia.setWindowImageData(imgUrl + '/window_skin-1.png');
            dia.setContent(cls.$blocks.TextBlock.factoryFast(268, '\n300 ゴールドを\n支払いました\n'));
            dia.initializeBlocks();// 内容ブロック直アクセスや位置調整前に必要
            dia.pos(['center', 'center']);
            dia.getContentBlock().style({ fontSize:14, color:'#FAFAFA', letterSpacing:1, textAlign:'center' });
            dia.drawFilter();
            dia.getFilter().style({ bg:'black_fog' });
            dia.getDeferredClosing().next(function(){
                u.consoleLog('Closed dialog =>', dia);
            });
            scr.getView().appendTo($('#dialogs'));
            scr.drawAndShow();
            dia.open();
        })
    ;
});
tester.add(1, 'PlainDialog, basic usage (confirm like)', function(u, $d){
    var scr = cls.block([600, 400]);
    scr.style({ bg:'#FAFAFA' });
    var dia = cls.$dialogs.PlainDialog.factory();
    scr.append(dia);
    dia.setWindowImageData(imgUrl + '/window_skin-1.png');
    var txt = cls.$blocks.TextBlock.factoryFast(268, '300 ゴールドが必要です\nよろしいですか？\n(所持金 2000 ゴールド)');
    txt.setPadding(10);
    txt.style({ fontSize:12, color:'#FAFAFA', letterSpacing:1, textAlign:'left' });
    txt.adjustHeight();
    dia.setContent(txt)
    dia.addButton('cancel', 'キャンセル');
    try { dia.addButton('cancel', 'エラー確認用'); return false } catch (e) { $d(e) };
    dia.initializeBlocks();// 内容ブロック直アクセスや位置調整前に必要
    dia.pos(['centertop', 'centerleft']);
    dia.drawFilter();
    dia.getFilter().style({ bg:'mist' });
    dia.setOnbuttonclick(function(evt){
        var buttonId = evt.data.buttonId;
        $d('buttonId =', buttonId);
        if (buttonId === 'ok') {
            dia.close();
        } else if (buttonId === 'cancel') {
        };
    });
    dia.getDeferredClosing().next(function(){
        u.consoleLog('Closed dialog =>', dia);
    });
    linkButton('#dialogs', u.title)
        .bind('mousedown', function(){
            scr.getView().appendTo($('#dialogs'));
            scr.drawAndShow();
            dia.open();
        })
    ;
});
//}}}


//
// $functions
//
//{{{
tester.add(1, '$f.inherit set SubClass.prototype.__myClass__', function(u, $d){
    var pb = cls.$blocks.PlainBlock.factory([0, 0], [0, 0]);
    if (pb.__myClass__ !== cls.$blocks.PlainBlock) u.error();
    var pia = cls.$animations.PlainIteratedAnimation.factory(function(){}, 1, 1000);
    if (pia.__myClass__ !== cls.$animations.PlainIteratedAnimation) u.error();
    // FYI)
    if (pb.constructor === pb.__myClass__) u.error();
    if (pb.constructor !== cls.Block) u.error();
});
tester.add(1, '$f.uniqueArray', function(u, $d){
    var arr = [1, 2, 1, 3, 2, 4, 'a', '1', 1, true];
    var newArr = $f.uniqueArray(arr);
    if (newArr.length !== 7) u.error();
    if ($f.uniqueArray(newArr).length !== 7) u.error();
    if (arr.length !== 10) u.error();
});
tester.add(1, '$f.areSimilarArrays', function(u, $d){
    if ($f.areSimilarArrays([1, 2, 3], [1, 2, 3]) !== true) u.error();
    if ($f.areSimilarArrays([null, undefined, false], [null, undefined, false]) !== true) u.error();
    if ($f.areSimilarArrays([1, 2, 3], [1, 2, '3']) !== false) u.error();
    if ($f.areSimilarArrays([1, 2, {}], [1, 2, {}]) !== false) u.error();
    if ($f.areSimilarArrays([1, 2, 3], [3, 2, 1]) !== false) u.error();
    if ($f.areSimilarArrays([1, 2, 3], [3, 2, 1], true) !== true) u.error();
});
tester.add(1, '$f.withinNum', function(u, $d){
    if ($f.withinNum(1, 0) !== 1) u.error();
    if ($f.withinNum(1, 2) !== 2) u.error();
    if ($f.withinNum(10, 5, 15) !== 10) u.error();
    if ($f.withinNum(20, 5, 15) !== 15) u.error();
    if ($f.withinNum(0, null, 15) !== 0) u.error();
});
tester.add(1, '$f.randInt', function(u, $d){
    var i;
    for (i = 0; i < 10; i++) {
        if ($f.inArray($f.randInt(1, 3), [1, 2, 3]) === false) u.error();
    };
    try { $f.randInt(2, 1); return false } catch (e) { $d(e) };
});
tester.add(1, '$f.normalizeNewLineCharacters', function(u, $d){
    var t = '1\n2\r\r3\r\r\n4\n\r\n5\n\n';
    var n = $f.normalizeNewLineCharacters(t, {deleteLast:true});
    if (n !== '1\n2\n\n3\n\n4\n\n5\n') u.error();
});
tester.add(1, '$f.trimNewLineCharacters', function(u, $d){
    if ($f.trimNewLineCharacters('\n\naiu\neo\n\n') !== 'aiu\neo') u.error();
    if ($f.trimNewLineCharacters('\r\nai\ru\neo\r\n') !== 'ai\ru\neo') u.error();
    if ($f.trimNewLineCharacters('ai\nu\neo') !== 'ai\nu\neo') u.error();
    if ($f.trimNewLineCharacters('') !== '') u.error();
    if ($f.trimNewLineCharacters('\r\n') !== '') u.error();
});
tester.add(1, '$f.squaring', function(u, $d){
    var coords;
    coords = $f.squaring([5, 5], [20, 20]);
    $d(coords);
    if (coords.length !== 16) u.error();
    coords = $f.squaring([5, 5], [20, 20], 1);
    $d(coords);
    if (coords.length !== 16) u.error();
    coords = $f.squaring([5, 5], [20, 20], 2);
    $d(coords);
    if (coords.length !== 9) u.error();
    coords = $f.squaring([100, 100], [1, 1]);
    $d(coords);
    if (coords.length !== 1) u.error();
    return true;
});
tester.add(1, '$f.toUnselectable', function(u, $d){
    var v = $('<div />');
    v.text('[テキスト選択不可の親]')
        .css({
            position: 'absolute',
            top: 10,
            left: 10,
            width: 80,
            height: 80,
            fontSize: 12,
            backgroundColor: '#EEE'
        })
        .append(
            $('<span />').css({color: 'red'}).text('[子要素1]').append(
                $('<span />').css({color: 'orange'}).text('[孫要素1]')
            )
        )
        .append(
            $('<span />').css({color: 'blue'}).text('[子要素2]').append(
                $('<span />').css({color: 'green'}).text('[孫要素2]')
            )
        )
        .append(
            $('<span />').css({color:'black', backgroundColor:'yellow'}).text('[解除]').mousedown(function(){
                $f.toUnselectable(v, true);
            })
        )
        .appendTo($('#functions'))
    ;
    $f.toUnselectable(v);
    return true;
});
tester.add(1, '$f.collapseMDArray', function(u, $d){

    var arr2d = [
        [1,2,3,4],
        [5,6,7,8],
        [9,10,11,12],
        [13,14,15,16]//,
    ];
    var res2d = $f.collapseMDArray(arr2d);
    $d(res2d);
    if (res2d.length !== 16 || res2d[0] !== 1 || res2d[15] !== 16) u.error();

    var arr3d = [
        [ [1,2], [3,4], [5,6], [7,8] ],
        [ [9,10], [11,12], [13,14], [15,16] ],
        [ [17,18], [19,20], [21,22], [23,24] ]//,
    ];
    var res3d = $f.collapseMDArray(arr3d, 3);
    $d(res3d);
    if (res3d.length !== 24 || res3d[0] !== 1 || res3d[23] !== 24) u.error();

    var res3d2 = $f.collapseMDArray(arr3d, 2);
    $d(res3d2);
    if (res3d2.length !== 12 || res3d2[0] instanceof Array !== true) u.error();
});
tester.add(1, '$f.parseMapLikeText', function(u, $d){
    try { $f.parseMapLikeText('aaa\nbb');
        return false; } catch (err) { $d(err) };
    try { $f.parseMapLikeText('aaa\nbbb', ['a']);
        return false; } catch (err) { $d(err) };
    var pair = $f.parseMapLikeText('abc\r\ndef\r\nghi\njkl');
    if (pair[0][1][1] !== 'e' || pair[1][0] !== 3 || pair[1][1] !== 4) u.error();
    var pair2 = $f.parseMapLikeText([['abc'],['def'],['ghi'],['jkl']]);
    if ($f.collapseMDArray(pair2[0]).join('') !== 'abcdefghijkl') u.error();
});
tester.add(1, '$f.format', function(u, $d){
    var r;
    r = $f.format("pi is {0}", Math.PI);
    $d(r);
    r = $f.format("pi is {PI}, sqrt2 is {SQRT2}", Math);
    $d(r);
    r = $f.format("pi is {0.PI}, max value is {1.MAX_VALUE}", Math, Number);
    $d(r);
    r = $f.format("fruits {0}, {1}, {0}!", ["apple", "lemon", "oranges"]);
    $d(r);
    r = $f.format("pi is {9.PI}, max value is {10.MAX_VALUE}", Math, Math, Math, Math, Math, Math, Math, Math, Math, Math, Number);
    $d(r);
    if ($f.format('a{0}b{1}', 'one', 2) !== 'aoneb2') u.error();
    var a = ['one', 2];
    if ($f.format('a{0}b{1}', a) !== 'aoneb2') u.error();
    var b = {foo:111,bar:222,baz:333};
    if ($f.format('1{foo}2{bar}3{baz}', b) !== '111122223333') u.error();
    if ($f.format('{0.0}|{1.baz}', a, b) !== 'one|333') u.error();
    $d($f.format('{0.0}|{1.baz}', a, b));
});
tester.add(1, '$f.compareNum', function(u, $d){
    if ($f.compareNum('gt', 2, 1) !== true) u.error();
    if ($f.compareNum('>', 2, 1) !== true) u.error();
    if ($f.compareNum('egt', 2, 2) !== true) u.error();
    if ($f.compareNum('>=', 2, 2) !== true) u.error();
    if ($f.compareNum('eq', 1, 1) !== true) u.error();
    if ($f.compareNum('==', 1, 1) !== true) u.error();
    if ($f.compareNum('elt', 2, 2) !== true) u.error();
    if ($f.compareNum('<=', 2, 2) !== true) u.error();
    if ($f.compareNum('lt', 1, 2) !== true) u.error();
    if ($f.compareNum('<', 1, 2) !== true) u.error();
});
tester.add(1, '$f.randRatioChoice', function(u, $d){
    var results = {a:0, b:0, c:0};
    var i;
    for (i = 0; i < 100; i++) {
        results[$f.randRatioChoice({a:1, b:3, c:5})] += 1;
    };
    $d(results);
});
tester.add(1, '$f.spacing', function(u, $d){
    var r;
    r = $f.spacing(100, [30, 40]);
    var handCalc = (100 - 30 - 40) / 3;
    $d(r, handCalc);
    if (r[0] !== handCalc) u.error();
    if (r[1] !== handCalc + 30 + handCalc) u.error();

    r = $f.spacing(100, [60, 40, 40]);
    var handCalc = (100 - 60 - 40 - 40) / 2;
    $d(r, handCalc);
    if (r[0] !== 0) u.error();
    if (r[1] !== 60 + handCalc) u.error();
    if (r[2] !== 60 + 40 + handCalc * 2) u.error();
});
//}}}


//
// $windows
//
//{{{
tester.add(1, 'PlainWindow basic usage', function(u, $d){

    var w = cls.$windows.PlainWindow.factory([256, 128], null, {
        imageType: 'auto',
        url: imgUrl + '/window_skin-2.png'
    });

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12}).text(u.title)
        .one('mousedown', function(){
            w.getView().appendTo($('#windows'));
            w.draw();
            w.show();
        })
        .appendTo($('#windows'))
    ;
    return w;
});
tester.add(1, 'MessageWindow basic usage', function(u, $d){

    var w = cls.$windows.MessageWindow.factoryForMe(imgUrl + '/window_skin-3.png');

    w.addMessage('abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890');
    w.addMessage('１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０');
    w.addMessage('あいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえおかきくけこ');
    w.addMessage('アイウエオカキクケコアイウエオカキクケコアイウエオカキクケコアイウエオカキクケコアイウエオカキクケコアイウエオカキクケコ');
    w.addMessage('漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字');
    w.addMessage('雨ニモマケズ\n風ニモマケズ');
    w.addMessage('雪ニモ夏ノ暑サニモマケヌ\n丈夫ナカラダヲモチ');
    w.addMessage('慾ハナク\n決シテ瞋ラズ\nイツモシヅカニワラッテヰル');

    w.getDeferredClosing().next(function(){
        u.consoleLog('Closed!');
    });

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12}).text(u.title)
        .one('mousedown', function(){
            w.getView().appendTo($('#windows'));
            w.open(); // w.draw() + w.show() と等しい
            w.startMessage();
        })
        .appendTo($('#windows'))
    ;
    return w;
});
tester.add(1, 'TalkWindow basic usage', function(u, $d){

    var boy = cls.$chips.PlainChip.factory([96, 96], null, img.get('face_boy', 1));
    boy.addVariation('none', img.get('face_boy', 1));
    boy.addVariation('smiling', img.get('face_boy', 5));
    boy.addVariation('laughing', img.get('face_boy', 5));
    boy.addVariation('annoyed', img.get('face_boy', 2));
    boy.addVariation('angry', img.get('face_boy', 8));
    boy.addVariation('sad', img.get('face_boy', 6));
    boy.addVariation('crying', img.get('face_boy', 7));
    boy.addVariation('questioning', img.get('face_boy', 3));
    boy.addVariation('surprised', img.get('face_boy', 6));
    boy.addVariation('narvous', img.get('face_boy', 6));
    boy.addVariation('fearing', img.get('face_boy', 6));
    boy.addVariation('awaking', img.get('face_boy', 3));
    boy.addVariation('proud', img.get('face_boy', 4));
    boy.addVariation('appalling', img.get('face_boy', 4));

    var girl = cls.$chips.PlainChip.factory([96, 96], null, img.get('face_girl', 4));
    girl.addVariation('none', img.get('face_girl', 4));
    girl.addVariation('smiling', img.get('face_girl', 1));
    girl.addVariation('laughing', img.get('face_girl', 5));
    girl.addVariation('annoyed', img.get('face_girl', 2));
    girl.addVariation('angry', img.get('face_girl', 6));
    girl.addVariation('sad', img.get('face_girl', 7));
    girl.addVariation('crying', img.get('face_girl', 7));
    girl.addVariation('questioning', img.get('face_girl', 3));
    girl.addVariation('surprised', img.get('face_girl', 3));
    girl.addVariation('narvous', img.get('face_girl', 2));
    girl.addVariation('fearing', img.get('face_girl', 3));
    girl.addVariation('awaking', img.get('face_girl', 8));
    girl.addVariation('proud', img.get('face_girl', 4));
    girl.addVariation('appalling', img.get('face_girl', 7));

    var heroine = cls.$chips.PlainChip.factory([96, 96], null, img.get('face_heroine', 1));
    heroine.addVariation('none', img.get('face_heroine', 1));
    heroine.addVariation('smiling', img.get('face_heroine', 2));
    heroine.addVariation('laughing', img.get('face_heroine', 2));
    heroine.addVariation('annoyed', img.get('face_heroine', 6));
    heroine.addVariation('angry', img.get('face_heroine', 7));
    heroine.addVariation('sad', img.get('face_heroine', 4));
    heroine.addVariation('crying', img.get('face_heroine', 8));
    heroine.addVariation('questioning', img.get('face_heroine', 3));
    heroine.addVariation('surprised', img.get('face_heroine', 3));
    heroine.addVariation('narvous', img.get('face_heroine', 6));
    heroine.addVariation('fearing', img.get('face_heroine', 4));
    heroine.addVariation('awaking', img.get('face_heroine', 3));
    heroine.addVariation('proud', img.get('face_heroine', 5));
    heroine.addVariation('appalling', img.get('face_heroine', 4));

    var badman = cls.$chips.PlainChip.factory([96, 96], null, img.get('face_badman', 1));
    badman.addVariation('oz', img.get('face_badman', 6));

    var others = cls.$chips.PlainChip.factory([96, 96], null, img.get('face_variants', 1));
    others.addVariation('one', img.get('face_variants', 1));
    others.addVariation('two', img.get('face_variants', 2));
    others.addVariation('three', img.get('face_variants', 3));

    var w = cls.$windows.TalkWindow.factoryForMe(
        imgUrl + '/window_skin-1.png', null, {
            //outputtingMode: 'paragraph',
            // IEは他に比べてかなり遅いので、以下のようなinterval値の条件分岐が必要となる
            // ...にしても限界があるので、コンフィグなどプレイヤー側で各自設定できないとイカンかも
            interval: ($f.isIE()? 1: 50)
        }
    );
    w.style({ color: '#FFF' });
    //w.disableAnimation();

    w.entryActor('boy', boy);
    w.entryActor('girl', girl);
    w.entryActor('heroine', heroine);
    w.entryActor('badman', badman);
    w.entryActor('others', others);

    if (1) {
        w.addTalk('boy', 'none', 'abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890');
        w.addTalk('boy', 'none', '１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０');
        w.addTalk('boy', 'none', 'あいうえおかきくけこあいうえおかきくけこあいうえおかきくけこあいうえおかきくけこ');
        w.addTalk('boy', 'none', 'アイウエオカキクケコアイウエオカキクケコアイウエオカキクケコアイウエオカキクケコ');
        w.addTalk('boy', 'none', '漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字漢字');
    };

    if (1) {
        w.addTalk('others', 'one', '\n:center:`『特技はイオナズン』`', {
            outputtingMode: 'paragraph'
        });
        w.addTalk('girl', 'none', '特技はイオナズンとありますが？');
        w.addTalk('boy', 'none', 'はい。イオナズンです。');
        w.addTalk('girl', 'none', 'イオナズンとは何のことですか？');
        w.addTalk('boy', 'none', '魔法です。');
        w.addTalk('girl', 'surprised', 'え、魔法？');
        w.addTalk('boy', 'proud', 'はい。魔法です。\n敵全員に大ダメージを与えます。');
        w.addTalk('girl', 'annoyed', '・・・で、そのイオナズンは当社において働くうえで何のメリットがあるとお考えですか？');
        w.addTalk('boy', 'proud', 'はい。敵が襲って来ても守れます。');
        w.addTalk('girl', 'annoyed', 'いや、当社には襲ってくるような輩はいません。\nそれに人に危害を加えるのは犯罪ですよね。');
        w.addTalk('boy', 'none', 'でも、警察にも勝てますよ。');
        w.addTalk('girl', 'appalling', 'いや、勝つとかそういう問題じゃなくてですね・・・');
        w.addTalk('boy', 'none', '敵全員に１００以上与えるんですよ。');
        w.addTalk('girl', 'angry', 'ふざけないでください。\nそれに１００って何ですか。\nだいたい・・・');
        w.addTalk('boy', 'none', '１００ヒットポイントです。\nHPとも書きます。\nヒットポイントというのは・・・');
        w.addTalk('girl', 'annoyed', '聞いてません。帰って下さい。');
        w.addTalk('boy', 'surprised', 'あれあれ？怒らせていいんですか？\n使いますよ。イオナズン。');
        w.addTalk('girl', 'appalling', 'いいですよ。使って下さい。\nイオナズンとやらを。\nそれで満足したら帰って下さい。');
        w.addTalk('boy', 'proud', '運がよかったな。\n今日はMPが足りないみたいだ。');
        w.addTalk('girl', 'angry', '帰れよ。');
    };

    if (1) {
        w.addTalk('others', 'two', '\n:center:`『お餅 えっ えっ』`', {
            outputtingMode: 'paragraph'
        });
        w.addTalk('girl', 'smiling', '当店のポイントカードはお餅でしょうか');
        w.addTalk('boy', 'surprised', 'えっ');
        w.addTalk('girl', 'smiling', '当店のポイントカードはお餅ですか');
        w.addTalk('boy', 'narvous', 'いえしりません');
        w.addTalk('girl', 'surprised', 'えっ');
        w.addTalk('boy', 'surprised', 'えっ');
        w.addTalk('girl', 'questioning', 'まだお餅になってないということでしょうか');
        w.addTalk('boy', 'surprised', 'えっ');
        w.addTalk('girl', 'surprised', 'えっ');
        w.addTalk('boy', 'questioning', '変化するってことですか');
        w.addTalk('girl', 'annoyed', 'なにがですか');
        w.addTalk('boy', 'questioning', 'カードが');
        w.addTalk('girl', 'awaking', 'ああ使い続けていただければランクがあがってカードが変わりますよ');
        w.addTalk('boy', 'laughing', 'そうなんだすごい');
        w.addTalk('girl', 'smiling', 'ではお作りいたしましょうか無料ですよ');
        w.addTalk('boy', 'questioning', 'くさったりしませんか');
        w.addTalk('girl', 'none', 'ああ期限のことなら最後に使ってから一年間使わないときれます');
        w.addTalk('boy', 'fearing', 'なにそれこわい');
        w.addTalk('girl', 'smiling', 'ちょくちょく来ていただければ無期限と同じですよ');
        w.addTalk('boy', 'fearing', 'なにそれもこわい');
        w.addTalk('girl', 'surprised', 'えっ');
        w.addTalk('boy', 'surprised', 'えっ');
    };

    if (1) {
        w.addTalk('others', 'three', '\n:center:`『シリアス・登場人物多め`\n:center:`表情無しキャラ入り』`', {
            outputtingMode: 'paragraph'
        });
        w.addTalk('girl', 'proud', '手こずらせたわね。\nさあ、ハイムへ戻りましょう、神父。');
        w.addTalk('boy', 'fearing', '・・・か、彼ら全員を殺したのか！\n恐ろしき異教徒の女よ。');
        w.addTalk('girl', 'none', '終わったようね、オズ。\n引きあげるわよ。');
        w.addTalk('badman', 'oz', '待ってくれ、姉さん。\nゲリラのボスを捕らえたぜ。');
        w.addTalk('badman', 'oz', 'オイッ、連れてこい！');
        w.addTalk('badman', 'oz', 'ライムから連れてきたバクラム兵を皆殺しにしたほどの気の強い女だ。');
        w.addTalk('badman', 'oz', '・・・姉さんほどじゃないけどね。');
        w.addTalk('heroine', 'angry', 'さあ、殺しなさいッ！');
        w.addTalk('boy', 'narvous', 'セリエッ、無事かッ！？');
        w.addTalk('heroine', 'sad', 'ごめんなさい、おじさま。\nこんなことになってしまって・・・。');
        w.addTalk('boy', 'sad', '謝るには及ばない。\n迷惑をかけたのは、この私だ。');
        w.addTalk('heroine', 'sad', 'もし、お父様に会うことがあったら娘は立派に死んだと伝えてください。');
        w.addTalk('girl', 'appalling', '三文芝居はもういいかしら？\nさあ、連れていって。');
        w.addTalk('boy', 'angry', 'よいか、セリエッ。妹たちを捜せッ！\n妹たちに会うんだッ！\n忘れるなッ！');
        w.addTalk('girl', 'questioning', 'オズ、その女をどうするつもり？');
        w.addTalk('badman', 'oz', 'もちろん、団長への手みやげさ。');
        w.addTalk('girl', 'none', 'どうかしら？\n生け捕りにしろとは命令されていないわよ。');
        w.addTalk('girl', 'appalling', 'それに、その女・・・。\n捕虜になるぐらいなら、舌でもかんで死ぬほうを選ぶわよ、きっと。');
        w.addTalk('badman', 'oz', '姉さんの言うとおりだ。\nそういう目をしていやがる。');
        w.addTalk('badman', 'oz', 'どうしようか、姉さん？');
        w.addTalk('girl', 'smiling', 'あなたの好きにすればいいわ。');
        w.addTalk('badman', 'oz', 'まずは、自殺できないようにチャームでもかけるか。');
        w.addTalk('badman', 'oz', 'アスモデよ、我がひとみ、我が息吹、汝の心を捕らえ操らん・・・。');
        w.addTalk('badman', 'oz', 'チャーム！');
        w.addTalk('girl', 'appalling', '・・・しかたない子ね。\nシュミが悪いわよ、オズ。');
        w.addTalk('girl', 'none', 'まあ、いいわ。\n先に行っているわよ。\n遅れないようにね、オズ。');
        w.addTalk('badman', 'oz', '可愛がってやるぜ。\nさあ、こっちへ来なッ。');
        w.addTalk('heroine', 'smiling', 'テキストは「タクティクスオウガ」からの引用でした');
    };

    try {
        w.addTalk('kaonashi', 'none', '');
        return false;
    } catch (err) {$d('NP =', err)};

    w.getDeferredClosing().next(function(){
        $d('Closed!');
    });

    $('<a href="javascript:void(0)" />')
        .css({marginRight:3, fontSize:12}).text(u.title)
        .one('mousedown', function(){
            w.getView().appendTo($('#windows'));
            w.open();
            w.startTalk();
        })
        .appendTo($('#windows'))
    ;
    return w;
});
//}}}


//
// ButtonSetBoard
//
//{{{
tester.add(1, 'ButtonSetBoard, basic usage', function(u, $d){
    var buttonSet = cls.$boards.ButtonSetBoard.factory([10, 2], [24, 24], null, {spacing:8});
    buttonSet.style({ bg:'#CCC' });

    buttonSet.defineButton('topleft', [0, 0], img.asChip('icon', [14, 0]));
    buttonSet.defineButton('one', [0, 2], img.asChip('icon', [14, 1]));
    buttonSet.defineButton('two', [0, 3], img.asChip('icon', [14, 2]));
    buttonSet.defineButton('three', [0, 4], img.asChip('icon', [14, 3]));
    buttonSet.defineButton('bottomright', [1, 9], img.asChip('icon', [14, 15]));

    buttonSet.eachButtons(function(buttonKey, button){
        button.square.style({ cursor:'pointer' });
    });

    buttonSet.bindOnbuttonsetclick({yourdata:12345}, function(evt){
        var buttonSet = evt.data.buttonSet;
        var buttonKey = evt.data.buttonKey;
        var button = evt.data.button;
        u.consoleLog('buttonKey=', buttonKey);
        if (buttonKey === 'topleft') {
            u.consoleLog('Top-Left!');
        };
    });

    linkButton('#button_set_board', u.title)
        .bind('mousedown', function(){
            buttonSet.draw();
            buttonSet.show();
            buttonSet.getView().appendTo($('#button_set_board'));
        })
    ;
});
//}}}


//
// ImageIndexer
//
//{{{
tester.add(1, 'ImageIndexer, development APIs usage', function(u, $d){

    var imgIdx = cls.ImageIndexer.factory();

    try {
        imgIdx.upload('can_not_devided', 'http://...', [512, 384], [64, 97]);
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.upload('can_not_devided', 'http://...', [512, 384], [63, 96]);
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.clip('too_small', 'http://...', [96, 128], [0, 0], [97, 128]);
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.clip('too_small', 'http://...', [96, 128], [0, 1], [96, 128]);
        return false;
    } catch (err) { $d(err) }

    imgIdx.upload('a1', imgUrl + '/TileA2.png', [512, 384], [64, 96]);
    imgIdx.clip('landing', imgUrl + '/usui-Actor4.png', [96, 128], [32, 64], [32, 32]);

    try {
        imgIdx.upload('a1', imgUrl + '/TileA2.png', [512, 384], [64, 96]);
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.clip('landing', imgUrl + '/usui-Actor4.png', [96, 128], [32, 64], [32, 32]);
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.clip('not_enouth_arguments', imgUrl + '/usui-Actor4.png', [96, 128], [32, 64]);
        return false;
    } catch (err) { $d(err) }

    if (imgIdx.get('a1').clipSize[0] !== 512) u.error();
    if (imgIdx.get('a1', 1).clipPos[0] !== 0) u.error();
    if (imgIdx.get('a1', 32).clipPos[1] !== 448) u.error();
    if (imgIdx.get('a1', [0, 0]).clipPos[1] !== 0) u.error();
    if (imgIdx.get('a1', [3, 7]).clipPos[0] !== 288) u.error();

    $d(imgIdx.getUrl('a1'));
    $d(imgIdx.getUrlForBackground('a1'));

    try {
        imgIdx.asTile('landing');
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.asTile('a1');
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.asAutoTile('landing');
        return false;
    } catch (err) { $d(err) }
    try {
        imgIdx.asAutoTile('a1');
        return false;
    } catch (err) { $d(err) }

    $d(imgIdx.asTile('a1', 1));
    $d(imgIdx.asAutoTile('a1', [2, 1]));
    $d(imgIdx.asChip('landing'));
    $d(imgIdx.asChip('a1'));
});
//}}}


//
// ImageBookBlock
//
//{{{
tester.add(1, 'ImageBookBlock, basic usage', function(u, $d){
    linkButton('#image_book_block', u.title)
        .bind('mousedown', function(){
            var ib = cls.$trials.ImageBookBlock.factory([384, 192]);
            ib.addPage(imgUrl + '/boy.png', '男の子');
            ib.addPage(imgUrl + '/girl.png', '女の子');
            ib.addPage(imgUrl + '/heroine.png', 'ヒロイン');
            ib.addPage(imgUrl + '//badman.png', '悪者');
            $('#image_book_block').append(ib.getView());
            ib.open();
        })
    ;
});
//}}}


//
// ImageTextBlock
//
//{{{
tester.add(1, 'ImageTextBlock, basic usage', function(u, $d){

    function __setImageData(imageTextBlock){
        $f.each('0 1 2 3 4 5 6 7 8 9 ! *'.split(' '), function(idx, cha){
            var left = idx * 16;
            var imageData = img.get('text_merged', [0, idx]);
            imageTextBlock.setImage(cha, imageData);
        });
        it.style({ bg:'#CCC' });
    };
    function __setImageDataGreen(imageTextBlock){
        $f.each('0 1 2 3 4 5 6 7 8 9 ! *'.split(' '), function(idx, cha){
            var left = idx * 16;
            var imageData = img.get('text_merged_green', [0, idx]);
            imageTextBlock.setImage(cha, imageData);
        });
        it.style({ bg:'#CCC' });
    };

    var it;

    // 左から, '012345' を描画
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6);
    __setImageData(it);
    it.setImageText('01234567890!*');
    it.drawAndShow();
    $('#image_text_block').append(it.getView());

    // 右から, '7890!!!' を描画
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6, [0, 100]);
    __setImageData(it);
    it.setTextAlign('right');
    it.setImageText('01234567890!*');
    it.drawAndShow();
    $('#image_text_block').append(it.getView());

    // 左からで空桁有り
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6, [0, 200]);
    __setImageData(it);
    it.setImageText('123!');
    it.drawAndShow();
    $('#image_text_block').append(it.getView());

    // 左からで空桁有り
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6, [0, 300]);
    __setImageData(it);
    it.setTextAlign('right');
    it.setImageText('789!');
    it.drawAndShow();
    $('#image_text_block').append(it.getView());

    // 再描画時に前の内容がクリアされているか
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6, [0, 400]);
    __setImageData(it);
    it.setImageText('000000');
    it.drawAndShow();
    it.setImageText('111');
    it.draw();
    $('#image_text_block').append(it.getView());

    // 文字間隔付き
    it = cls.$trials.ImageTextBlock.factory([16, 16], 6, [0, 500], { spacing:2 });
    __setImageDataGreen(it);
    it.setImageText('99999!');
    it.drawAndShow();
    $('#image_text_block').append(it.getView());
});
//}}}


//
// LogViewerBlock
//
//{{{
tester.add(1, 'LogViewerBlock, basic usage', function(u, $d){
    var viewer = cls.$trials.LogViewerBlock.factory([180, 100], [20, 0]);
    var createLog = function(text){
        var b = cls.block([180, 18]);
        b.getView().text(text).css({ fontSize:12, lineHeight:b.getSize()[1] + 'px', color:'#FFF',
            whiteSpace:'nowrap', overflow:'hidden' });
        return b;
    };
    viewer.addLog(createLog('まもののむれがあらわれた'));
    viewer.addLog(createLog('スライム のこうげき！'));
    viewer.addLog(createLog('つうこんのいちげき！！'));
    viewer.addLog(createLog('ゆうしゃ は 5963 のダメージをうけた！'));
    viewer.addLog(createLog('ゆうしゃ はしんでしまった！'));
    viewer.addLog(createLog('だいまおう は しゃくねつのほのお をはなった！'));
    viewer.addLog(createLog('そうりょ は 1 のダメージ！'));
    viewer.addLog(createLog('そうりょ はすずしげだ！'));
    viewer.addLog(createLog('そうりょ は デコピン をはなった！'));
    viewer.addLog(createLog('だいまおう は くだけちった ！'));
    var first = true;
    linkButton('#log_viewer_block', u.title)
        .bind('mousedown', function(){
            if (first) {
                viewer.getView().appendTo($('#log_viewer_block')).css({ backgroundColor:'#000' });
                viewer.draw();
                viewer.show();
                viewer.nextLog();
                first = false;
            } else {
                viewer.nextLog();
            };
        })
    ;
});
//}}}


//
// MessageBlock
//
//{{{
tester.add(1, 'MessageBlock basic usage', function(u, $d){

    var block = cls.$blocks.MessageBlock.factory(20, 12, 4, 20, [10, 10], {
        onfinish: function(){
            $d('Message finished');
        }
    });
    block.style({ bg:'#EEE' });

    block.addParagraph('文字送り中にクリック', {
        onstart: function(){
            $d('First paragraph started');
        },
        onfinish: function(){
            $d('First paragraph finished');
        }
    });
    block.addParagraph('そうすると、段落の最後まで一気に出力、デフォルトの挙動です');

    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'));
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock auto running', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 12, 3, 12, [10, 140], {
        autoRunning: 1000
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('1秒置きに自動出力');
    block.addParagraph('花が咲く');
    block.addParagraph('小鳥が歌うピヨピヨ');
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'));
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock auto cleaning', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 12, 3, 12, [54, 140], {
        interval: cls.$consts.STABLE_INTERVAL,
        autoRunning: 500,
        autoCleaning: true
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('一段落毎に消えます');
    block.addParagraph('JRPGの会話ダイアログはこの設定を使うことになると思います');
    block.addParagraph('・・・\n・・・・・・・\n・・・・・・・・・・');
    block.addParagraph('\n　とある王妃の一日\n\n');
    block.addParagraph('朝起きて、昼食べて、夜寝た');
    block.addParagraph('朝食べて、昼寝て、夜起きた');
    block.addParagraph('朝寝て、昼起きて、夜食べた');
    block.addParagraph('・・・・・・・・・・\n・・・・・・・・・・\n・・・三日でしたね');
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'))
    ;
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock auto line width calculation', function(u, $d){
    var s = cls.$blocks.PlainBlock.factory([100, 100], [0, 270]);
    s.style({ bg:'#EEE' });

    var px9 = cls.$blocks.MessageBlock.factory(10, 9, 1, 9);
    px9.addParagraph('漢字漢字漢');

    var px105 = cls.$blocks.MessageBlock.factory(10, 10.5, 1, 10.5);
    px105.addParagraph('漢字漢字漢');

    var px12 = cls.$blocks.MessageBlock.factory(10, 12, 1, 12);
    px12.addParagraph('漢字漢字漢');

    var px135 = cls.$blocks.MessageBlock.factory(10, 13.5, 1, 13.5);
    px135.addParagraph('漢字漢字漢');

    var px15 = cls.$blocks.MessageBlock.factory(10, 15, 1, 15);
    px15.addParagraph('漢字漢字漢');

    var px12ex = cls.$blocks.MessageBlock.factory(10, 12, 1, 12, null, {marginRate:1.25});
    px12ex.addParagraph('12px余裕＋');

    var blocks = [px9, px105, px12, px135, px15, px12ex];
    $f.each(blocks, function(i, block){
        block.toRelativePosition();// 相対配置にしている
        block.pos([3 * i, 0]);// margin じゃないのでちょっと工夫が必要
        block.style({ bg:'#00FFFF' });
        s.append(block);
    });
    $d(blocks);

    s.getView().mousedown(function(){
        $f.each(blocks, function(i, v){v.runNextParagraph()});
    }).appendTo($('#message_block'));
    s.draw(true);
    s.show(true);

    return s;
});
tester.add(1, 'MessageBlock message is stacked', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 13.5, 6, 13.5, [10, 380], {
        isStacked: true,
        interval: cls.$consts.STABLE_INTERVAL,
        autoRunning: 500
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('積み重ねにすると');
    block.addParagraph('ログやテロップ風に');
    block.addParagraph('することができます');
    var i;
    for (i = 1; i <= 5; i++) {
        block.addParagraph(i + '回目の出力です');
    };
    block.addParagraph('ログビューアにする場合は改行すると表示が不自然になっちゃうので');
    block.addParagraph('1段落のみで');
    block.addParagraph('1文のみで');
    block.addParagraph('自動改行しないように');
    block.addParagraph('文字数調整が必要です');
    block.addParagraph('なおこれはoverflow:hidden;で隠れてるだけです');
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'))
    ;
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock output by sentence', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 12, 6, 15, [10, 525], {
        outputtingMode: 'sentence',
        isStacked: true,
        autoRunning: 500
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('行単位で出力します');
    var i;
    for (i = 1; i <= 10; i++) {
        block.addParagraph(i + '回目の出力です');
    };
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'))
    ;
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock output by paragraph', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 12, 3, 15, [10, 655], {
        outputtingMode: 'paragraph',
        autoCleaning: true
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('段落単位で出力します');
    var i;
    for (i = 1; i <= 5; i++) {
        block.addParagraph(i + '段落目の出力です\nああああああああああ\nアアアアアアアアアア');
    };
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .appendTo($('#message_block'))
    ;
    block.draw();
    block.show();

    return block;
});
tester.add(1, 'MessageBlock skip message', function(u, $d){
    var block = cls.$blocks.MessageBlock.factory(20, 9, 7, 12, [10, 785], {
        isStacked: true
    });
    block.style({ bg:'#EEE' });
    block.addParagraph('skipボタンを押してください');
    var i;
    for (i = 1; i <= 30; i++) {
        block.addParagraph(i + '回目の出力です\nすすすすすすすすすす');
    };
    block.getView()
        .one('mousedown', function(){
            block.runNextParagraph();
        })
        .append(
            $('<div>skip</div>').css({
                position: 'absolute',
                bottom: 0,
                right: 0,
                fontSize: 9,
                cursor: 'pointer'
            }).one('mousedown', function(evt){
                block.skipMessages();
                evt.stopPropagation();
            })
        )
        .appendTo($('#message_block'))
    ;
    block.draw();
    block.show();

    return block;
});
//}}}


//
// ParameterDisplayBlock
//
//{{{
tester.add(1, 'ParameterDisplayBlock, basic usage', function(u, $d){
    var pv = cls.$trials.ParameterDisplayBlock.factorySingle([40, 20], null, 123);
    pv.style({ bg:'#FF6633' });
    pv.draw();
    pv.show();
    pv.getView()
        .appendTo($('#parameter_display_block'))
        .bind('mousedown', function(){
            pv.drawUpdatingValue($f.shuffleArray([1, 12345, null])[0]);
        })
    ;
});
tester.add(1, 'ParameterDisplayBlock, generate text and color', function(u, $d){
    var pv = cls.$trials.ParameterDisplayBlock.factorySingle([60, 20], [0, 45], [100, 0, 100], {
        textGenerator: '__with_operand__',
        colorGenerator: '__full_to_empty__',
        unitText:'P'
    });
    pv.style({ bg:'#FF6633' });
    pv.draw();
    pv.show();
    pv.getView()
        .appendTo($('#parameter_display_block'))
        .bind('mousedown', function(){
            pv.drawUpdatingValue($f.shuffleArray([0, 49, 99, null])[0]);
        })
    ;
});
tester.add(1, 'ParameterDisplayBlock, "current/max" format', function(u, $d){
    var pv = cls.$trials.ParameterDisplayBlock.factoryWithMax(
        [60, 20], [0, 110], [100, 0, 100]);
    pv.style({ bg:'#FF6633' });
    pv.draw();
    pv.show();
    pv.getView()
        .appendTo($('#parameter_display_block'))
        .bind('mousedown', function(){
            pv.drawUpdatingValue($f.shuffleArray([0, 49, 99, {current:null,max:null}])[0]);
        })
    ;
});
//}}}


//
// Request
//
//{{{
tester.add(1, 'GeneralRequest, GET', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){
            var r = cls.$requests.GeneralRequest.factory('./sample_data/json.txt');
            r.execute().next(function(){
                u.consoleLog('isSuccess =', r.isSuccess());
                u.consoleLog('Response text =', r.getResponseText());
                u.consoleLog('Response text as json =', r.getResponseAsJson());
            });
        })
    ;
});
tester.add(1, 'GeneralRequest, POST', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){
            var r = cls.$requests.GeneralRequest.factory('./sample_data/json.txt', {
                method: 'post',
                postData: {
                    'key1': 'value1',
                    'key2': 'value2'
                }
            });
            r.execute().next(function(){
                u.consoleLog('isSuccess =', r.isSuccess());
                u.consoleLog('Response text =', r.getResponseText());
            });
        })
    ;
});
tester.add(1, 'GeneralRequest, fail(not found url)', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){// 存在しないURL
            var r = cls.$requests.GeneralRequest.factory('http://notfoundurl.kjirou.net/');
            r.execute().next(function(){
                u.consoleLog('isSuccess =', r.isSuccess());
                u.consoleLog('Response text =', r.getResponseText());
            });
        })
    ;
});
tester.add(1, 'GeneralRequest, fail(outer domain)', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){// 外部URLで'script'ではない
            var r = cls.$requests.GeneralRequest.factory('http://www.yahoo.co.jp/');
            r.execute().next(function(){
                u.consoleLog('isSuccess =', r.isSuccess());
                u.consoleLog('Response text =', r.getResponseText());
            });
        })
    ;
});
tester.add(1, 'GeneralRequest, stop', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){
            var r = cls.$requests.GeneralRequest.factory('http://tools.kjirou.net/wait-api/?s=5', {
                dataType: 'script',
                onstop: function(){
                    u.consoleLog('onstop!');
                }
            });
            r.execute().next(function(){
                if (r.isSuccess()) {
                    u.consoleLog('None stop!');
                };
            });
            //! 実際のリクエストは止めてない
            //  上記でscriptモードで非JSレスポンスを受けているのでエラーが出る
            setTimeout(function(){
                ThreadManager.getServer().stopActiveClients({divisionName:'RPGMaterial.Request'});
            }, 2000);
        })
    ;
});
tester.add(1, 'EasyKVS requests', function(u, $d){
    linkButton('#request', u.title)
        .bind('mousedown', function(){

            // データ作成
            var update = cls.$requests.EasyKVSUpdateRequest.factory(
                easyKVSUrl, 'rpgmtestuser', {
                    method: 'get'
                }
            );
            update.setKeyValue('foo', 'FOO!');
            update.setKeyValue('bar', 'BAR!');
            // データ取得
            var fetch = cls.$requests.EasyKVSFetchRequest.factory(
                easyKVSUrl, 'rpgmtestuser'
            );
            // データ削除
            var remove = cls.$requests.EasyKVSRemoveRequest.factory(
                easyKVSUrl, 'rpgmtestuser', {
                    method: 'get'
                }
            );
            // データ取得失敗
            var fetchError = cls.$requests.EasyKVSFetchRequest.factory(
                easyKVSUrl, 'rpgmtestuser'
            );
            fetchError._onngdata = function(){
                u.consoleLog('None data');
                throw new Error('None error, SEIJOU DESU');
            };

            update.execute().next(function(){
                u.consoleLog('EasyKVSUpdateRequest');
                u.consoleLog('isSuccess =', update.isSuccess());
                u.consoleLog('Response data =', update.getResponseData());
                return fetch.execute().next(function(){
                    u.consoleLog('EasyKVSFetchRequest');
                    u.consoleLog('isSuccess =', fetch.isSuccess());
                    u.consoleLog('Response data =', fetch.getResponseData());
                });
            }).next(function(){
                return remove.execute().next(function(){
                    u.consoleLog('EasyKVSRemoveRequest');
                    u.consoleLog('isSuccess =', remove.isSuccess());
                    u.consoleLog('Response data =', remove.getResponseData());
                });
            }).next(function(){
                return fetchError.execute().next(function(){
                    // _onngdata内で止まるのでココは実行されない
                    u.consoleLog('EasyKVSFetchRequest2');
                });
            });
        })
    ;
});
//}}}


//
// RichText/Not3d
//
//{{{
tester.add(1, 'RichText development APIs usage', function(u, $d){

    var richText = '今日は:emphasis:`日曜日`!\r\n:emphasis:`いい天気`なので家で:strong:`cording`しよう!\r\rかしこ\n';
    $d(richText);
    var rt = cls.RichText.parse(richText);
    var pt = rt.toPlainText();
    $d(pt);
    if (pt !== '今日は日曜日!\nいい天気なので家でcordingしよう!\n\nかしこ') u.error();

    var i;
    var s = rt.getNextSentence();

    if (rt._pointer !== 0) u.error();
    rt.reset();
    if (rt._pointer !== -1) u.error();

    for (i = 0; i < 7; i++) {
        s.next();
        $d('next =', s._destination);
    };
    try {
        s.next();
    } catch (err) { $d('NP =', err); };
    s.reset();
    $d('reset =', s._destination);
    s.last();
    $d('last =', s._destination);
    s.reset();

    var v = s.getView();
    $d(s._pointer, '=', v.html());
    for (i = 0; i < 7; i++) {
        s.next();
        s.print();
        $d(s._pointer, '=', v.html());
    };
    var lastOutput = v.html();

    s.reset();
    v = s.getView();
    $d('reset =', v.html());
    if (v.text() !== '') u.error();
    s.last();
    s.print();
    $d('last =', v.html());
    if (v.html() !== lastOutput) u.error();
    s.reset();

    if (rt.isFinished() !== false) u.error();
    for (i = 0; i < 4; i++) {
        $d('sentence[' + i + '] =', rt.getNextSentence());
    };
    try {
        rt.getNextSentence();
        return false;
    } catch (err) { $d('NP =', err) };
    if (rt.isFinished() !== true) u.error();

    return rt;
});
tester.add(1, 'RichText automatic carrier return', function(u, $d){

    var richText = '12345:emphasis:`あいうえお`:emphasis:`67890`カキクケコ';
    $d(richText);

    var rt = cls.RichText.parse(richText, {autoReturn: 4});
    var s = rt.getNextSentence();
    var points = s._getAutoReturnPoints();
    $d('Auto return points =', points);

    var v = s.getView();
    var lastOutput;
    while (s.isFinished() === false) {
        s.next();
        s.print();
        lastOutput = v.html();
        $d(lastOutput);
    };
    s.reset();
    s.last();
    s.print();
    if (v.html() !== lastOutput) u.error();

    return rt;
});
tester.add(1, 'RichText basic usage', function(u, $d){

    var richText = '';
    richText += 'メロスは:strong:`激怒`した。\n';
    richText += '\n';
    richText += '必ず、かの:strong:`邪智暴虐（じゃちぼうぎゃく）`の王を除かなければならぬと決意した。\n';
    richText += ':center:`＊中央寄せ＊`\n';
    richText += 'メロスには政治がわからぬ。メロスは、村の牧人である。笛を吹き、羊と遊んで暮して来た。\n';
    richText += ':emphasis:`けれども邪悪に対しては、人一倍に敏感であった。`\n';
    richText += '\n';
    richText += 'きょう未明メロスは村を出発し、:strong:`野を越え山越え、`十里はなれた此（こ）の:emphasis:`シラクスの市`にやって来た。\n';
    $d(richText);

    var rt = cls.RichText.parse(richText, {autoReturn: 40});
    var displayView = $('<div />');
    var s;
    while (rt.isFinished() === false) {
        s = rt.getNextSentence();
        displayView.append(s.getView());
        while (s.isFinished() === false) {
            s.next();
            s.print();
        };
    };

    $('#rich_text').append(
        displayView.css({
            position: 'absolute',
            width: 260,
            height: 100,
            fontSize: 12,
            overflow: 'scroll',
            backgroundColor: '#EEE'
        })
    );

    return rt;
});
tester.add(1, 'RichText simple usage', function(u, $d){
    var richText = 'あああ、いいいい。\nえええおお、\n\n:center:`かかかか`\n\nきくくく';
    var rt = cls.RichText.parse(richText);
    var v = rt.toView();

    $('#rich_text').append(
        v.css({
            position: 'absolute',
            left: 265,
            width: 135,
            fontSize: 12,
            backgroundColor: '#EEE'
        })
    );
    return rt;
});
tester.add(1, 'Not3d, basic usage', function(u, $d){
    var frame = cls.block([150, 100], [0, 410]);
    frame.getView().appendTo($('#rich_text'));
    frame.style({ bg:'#EEE' });
    frame.drawAndShow();

    var n3d = cls.Not3d.factory([0, 0]);
    var baseSize = [20, 35];
    var basePos = [50, 80];
    $f.times(15, function(t){
        var rate = t * 0.1;
        var resultSet = n3d.calculateRect(rate, baseSize, basePos);
        $d(resultSet);
        var rect = cls.block(resultSet[0], resultSet[1]);
        frame.append(rect);
        rect.style({ border:'1px solid blue' });
        rect.drawAndShow();
    });
});
//}}}


})();
