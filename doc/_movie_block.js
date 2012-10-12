//あいう
//
// プロジェクトのStoryの方がためになる
// Timelineの使い方が自分で作って置いてなんだが間違ってる
//
// 派生でTimelineができたことと、AnimationのAPIが固まったことが成果
//
/** ムービーブロッククラス, ! 廃止予定 */
cls.$trials.MovieBlock = (function(){

    var kls = function(){

        /** Timelineインスタンス */
        this._timeline = undefined;

        /**
         * 動作マップ
         *
         * '<任意の文字列>': {
         *     layer: <Timeline.Layerインスタンス>,
         *     // 定型動作を示す文字列 || 関数 || Animationインスタンス のいずれかを指定する
         *     // 登録時にlayer側のイベントハンドラに登録されるので、この値が参照されることは無い
         *     animation: <動作>,
         * }
         */
        this._animations = undefined;
    };
    $f.inherit(kls, new cls.Block());

    function __INITIALIZE(self, playtime){
        self._timeline = Timeline.factory(playtime);
        self._animations = {};
    };

    /** 動作を登録する */
    kls.prototype.registerAnimation = function(animationKey, animation /* var args */){
        var self = this;

        if (animationKey in this._animations) {// 登録済み, 上書き変更不可, 未活動レイヤーが残るから
            throw new Error('RPGMaterial:MovieBlock.registerAnimation, already existed animation key=`' + animationKey +  '`');
        };

        var layer = this._timeline.createLayer();

        var throwError = function(){
            throw new Error('RPGMaterial:MovieBlock.registerAnimation, invalid parameter, animationKey=`' + animationKey + '`');
        };

        // 定型動作指定を展開
        if (animation === 'wait') {
            var waitTime = arguments[2];
            if (waitTime === undefined) throwError();
            animation = function(){
                return Deferred.wait(parseFloat(waitTime / 1000));
            };
        } else if (animation === 'show') {
            var block = arguments[2];
            if (block === undefined) throwError();
            animation = function(){
                block.draw();
                block.show();
            };
        } else if (animation === 'hide') {
            var block = arguments[2];
            if (block === undefined) throwError();
            animation = function(){
                block.hide();
            };
        } else if (animation === 'fadeIn') {
            var block = arguments[2];
            var speed = arguments[3];
            if (block === undefined || speed === undefined) throwError();
            animation = function(){
                var d = new Deferred();
                block.fadeIn(speed, function(){
                    d.call();
                });
                return d;
            };
        } else if (animation === 'fadeOut') {
            var block = arguments[2];
            var speed = arguments[3];
            if (block === undefined || speed === undefined) throwError();
            animation = function(){
                var d = new Deferred();
                block.fadeOut(speed, function(){
                    d.call();
                });
                return d;
            };
        } else if (animation === 'fadeInOut') {
            var block = arguments[2];
            var inSpeed = arguments[3];
            var waitTime = arguments[4];
            var outSpeed = arguments[5];
            if ($f.inArray(undefined, [block, inSpeed, waitTime, outSpeed])) throwError();
            animation = function(){
                var d = new Deferred();
                block.fadeIn(inSpeed, function(){
                    Deferred.wait(parseFloat(waitTime / 1000)).next(function(){
                        block.fadeOut(outSpeed, function(){
                            d.call();
                        });
                    });
                });
                return d;
            };
        } else if (animation === 'message') {
            var block = arguments[2];
            if (block instanceof cls.$blocks.MessageBlock === false) throwError();
            animation = function(){
                var d = new Deferred();
                block.setOnfinishHandler(function(){
                    d.call();
                });
                block.runNextParagraph();
                return d;
            };
        };

        // 動作設定
        if (animation instanceof cls.Animation) {// アニメーションインスタンス
            layer.onstart(function(){
                animation.run();
                return animation.getThread().getDeferred();
            });
        } else if (Deferred.isDeferred(animation)) {// Deferredインスタンス
            layer.onstart(function(){
                return animation;
            });
        } else if (typeof animation === 'function') {// 関数
            layer.onstart(animation);
        } else {
            throw new Error('RPGMaterial:MovieBlock.registerAnimation, invalid parameter animation=`' + animation +  '`');
        };

        this._animations[animationKey] = {
            animation: animation,
            layer: layer
        };
    };

    /** ムービーを開始する／タイムライン終了同期を返す
        単なるLayerインスタンスへのアクセサ */
    kls.prototype.startTimeline = function(){
        this._timeline.start();
    };
    kls.prototype.getTimelineDeferred = function(){
        return this._timeline.getDeferred();
    };

    /** 時間を指定して動作を開始する 単位:ms, 単なるLayerインスタンスへのアクセサ */
    kls.prototype.onTimeline = function(animationKey, ms){
        this._getLayer(animationKey).on(ms);
    };

    /** 動作を連鎖させる
        引数には (1, 2, 3, 4...) という風に連続指定可能 */
    kls.prototype.chainAnimation = function(beforeAnimationKey, animationKey /* var args */){
        if (arguments.length > 2) {
            var nextArgs = Array.prototype.slice.apply(arguments, [1]);
            arguments.callee.apply(this, [beforeAnimationKey, animationKey]);
            arguments.callee.apply(this, nextArgs);
        };
        this._getLayer(animationKey).after(this._getLayer(beforeAnimationKey));
    };

    /** アニメーションキーからレイヤーを取得する, 上記2メソッドの為に共通化しただけ */
    kls.prototype._getLayer = function(animationKey){
        if (animationKey in this._animations === false) {// 未登録動作を指定した
            throw new Error('RPGMaterial:MovieBlock._getLayer, not found animation key=`' + animationKey +  '`');
        };
        return this._animations[animationKey].layer;
    };

    kls.factory = function(size, position, playtime){
        var obj = cls.Block._factory.apply(this, [size, position]);
        if (playtime === undefined) playtime = null;
        __INITIALIZE(obj, playtime);
        return obj;
    };

    return kls;

})();


tester.add(1, 'MovieBlock, verbose usage', function(u, $d){

    // 縦幅450の意味は、通常TVやモニタの横縦比率は 4:3 に合わせた
    // ムービー的なものを作るならその比率に合わせると良い, 16:9 という選択肢もある
    var movie = cls.$trials.MovieBlock.factory([600, 450], [10, 10], 6000);
    movie.setBackground('color', '#EEE');
    movie.setZIndex(9999);
    movie.draw();
    movie.show();

    var bg = cls.$blocks.PlainBlock.factory([400, 300]);
    bg.setBackground('color', '#FFFF00');
    bg.draw();

    var actor = cls.$chips.PlainChip.factory([32, 32], null, {
        url: './sample_images/chip/ccs-96x128.png',
        fullSize: [96, 128],
        clipPos: [0, 32]
    });
    actor.setZIndex(1);
    actor.draw();

    movie.append(bg);
    movie.append(actor);

    // 直接アニメーション内容をベタ書きすると以下のようになる
    // 通常は文字列指定による定型アニメーションを使うか、Animationを予め用意しておく
    movie.registerAnimation('showBg', function(){
        bg.pos([50, 100]);
        bg.draw();
        bg.show();
    });
    movie.registerAnimation('showActor', function(){
        actor.pos([100+32, 75+32]);
        actor.draw();
        actor.show();
    });
    movie.registerAnimation('moveActor', function(){
        var d = new Deferred();
        actor.animate({
            top: 100+32+128,
            left: 75+32+128
        }, {
            duration: 2000,
            easing: 'linear',
            complete: function(){
                d.call();
            }
        });
        return d;
    });
    // Animationインスタンスを使う方法
    var colors = ['#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFF66', '#FFFF33'];
    var anim = cls.$animations.PlainIteratedAnimation.factory(function(cnt){
        bg.setBackground('color', colors[cnt % colors.length]);
        bg.draw();
    }, 19, 100);
    movie.registerAnimation('glowBg', anim);

    // タイムライン定義
    // 0           =背景出現
    // 1000        =アクター出現
    // 10XXから2000=アクター移動
    // それから1900=背景色変更
    // 6000        =ムービー終了 というタイムライン
    // *)10XXや20XXなのは、Deferred.nextの最速同期時間が不明だから, 多分ブラウザによる
    movie.onTimeline('showBg', 0);
    movie.onTimeline('showActor', 1000);
    movie.chainAnimation('showActor', 'moveActor');
    movie.chainAnimation('moveActor', 'glowBg');

    movie.getTimelineDeferred().next(function(){
        u.consoleLog('Movie end');
        movie.remove();
    });

    $('<a href="javascript:void(0)" />')
        .css({
            position: 'absolute',
            top: 100,
            left: 0,
            fontSize: 12
        })
        .text(u.title)
        .one('mousedown', function(){
            movie.getView().appendTo($(document.body));
            movie.startTimeline();
        })
        .appendTo($('#blocks'))
    ;
    return movie;
});
tester.add(1, 'MovieBlock, basic usage', function(u, $d){

    var movie = cls.$trials.MovieBlock.factory([600, 450], [10, 10]);
    movie.setZIndex(9999);

    var bg = cls.$chips.PlainChip.factory([600, 450], null, {
        type: 'resize',
        url: './sample_images/background/bg-forest-320x240.png',
        fullSize: [320, 240],
        clipPos: [0, 0],
        clipSize: [320, 240]
    });
    movie.append(bg);

    var blocks = [];
    var messages = ['ある日森の中', 'くまさんに出会った', '花咲く森の道',
        'くまさんに出会った', 'くま　さ　ん　に'];
    $f.each(messages, function(i, v){
        var b = cls.$blocks.PlainBlock.factory([600, 50], [200, 0]);
        b.getView().html(v).css({
            fontSize: 32,
            fontWeight: 'bold',
            letterSpacing: 5,
            color: '#FFF',
            lineHeight: '50px',
            textAlign: 'center'
        });
        b.setZIndex(1);
        b.draw();
        movie.append(b);
        blocks.push(b);
    });

    var bgRed = cls.$blocks.PlainBlock.factory([600, 450]);
    bgRed.setBackground('color', '#FF0000');
    bgRed.setZIndex(2);
    movie.append(bgRed);

    movie.registerAnimation('bgIn', 'fadeIn', bg, 1000);
    movie.registerAnimation('wait0', 'wait', 1000);

    // フェードイン - 待機 - フェードアウト
    movie.registerAnimation('in1', 'fadeIn', blocks[0], 500);
    movie.registerAnimation('wait1', 'wait', 1000);
    movie.registerAnimation('out1', 'fadeOut', blocks[0], 500);
    // 'fadeInOut'で上記一式と同じ
    movie.registerAnimation('2', 'fadeInOut', blocks[1], 500, 1000, 500);
    movie.registerAnimation('3', 'fadeInOut', blocks[2], 500, 1000, 500);
    movie.registerAnimation('4', 'fadeInOut', blocks[3], 500, 1000, 500);

    movie.registerAnimation('5a', 'wait', 1000);
    movie.registerAnimation('5b', 'fadeIn', blocks[4], 2000);

    movie.registerAnimation('finish1', 'fadeIn', bgRed, 2900);// 土台要素remove後だとバグるかもなので一瞬早くさせてる
    movie.registerAnimation('finish2', 'fadeOut', movie, 3000);

    movie.onTimeline('bgIn', 1000);
    movie.chainAnimation('bgIn', 'wait0', 'in1', 'wait1', 'out1', '2', '3', '4',
        '5a', '5b', 'finish1');
    // 5b からは 赤い背景フェードインと土台フェードアウトの並列実行
    movie.chainAnimation('5b', 'finish2');

    movie.getTimelineDeferred().next(function(){
        u.consoleLog('Movie end');
        movie.remove();
    });

    $('<a href="javascript:void(0)" />')
        .css({
            position: 'absolute',
            top: 100,
            left: 180,
            fontSize: 12
        })
        .text(u.title)
        .one('mousedown', function(){

            movie.draw();
            movie.show();
            bg.draw();
            bgRed.draw();

            movie.getView().appendTo($(document.body));
            movie.startTimeline();
        })
        .appendTo($('#blocks'))
    ;
    return movie;
});
tester.add(1, 'MovieBlock, into MessageBlock', function(u, $d){

    //
    // あんまりメッセージブロックとの連携がよろしくない
    // メッセージ出力途中にイベントを挟もうとすると onstartやonfinish を使うことになり
    // 同期するのが超面倒
    //
    // 1メッセージブロックずつ作るのが良さげで
    // そのためのショートカットを用意した方が良いかもしれん
    //

    var movie = cls.$trials.MovieBlock.factory([600, 450], [10, 10]);
    movie.setBackground('color', '#C99F70');
    movie.setZIndex(9999);

    var bg = cls.$chips.PlainChip.factory([418, 320], [20, 91], {
        url: './sample_images/background/bg-castle-418x320.png',
        fullSize: [418, 320],
        clipPos: [0, 0]
    });
    movie.append(bg);

    var mess = cls.$blocks.MessageBlock.factory(40, 24, 2, 40, [350, 90], {
        width: 420,
        height: 80,
        interval: 166,
        autoRunning: 1000,
        autoCleaning: true,
        onfinish: function(){
            $d('Message finished');
        }
    });
    mess.getView().css({
        color: '#FFF',
        //fontWeight: 'bold',
        // 文字幅を微調整してもいい状況なら等幅は絶対必要ではない
        fontFamily: '"MS UI Gothic"'
    });
    movie.append(mess);

    var gardet = cls.$chips.FaceChip.factory96x96('./sample_images/face/variants-384x192.png', [80, 150]);
    gardet.addExpression('none', 3);
    gardet.setZIndex(10);
    movie.append(gardet);

    var boy = cls.$chips.FaceChip.factory96x96('./sample_images/face/boy-384x192.png', [200, 150]);
    boy.addExpression('none', 2);
    boy.setZIndex(10);
    movie.append(boy);

    var girl = cls.$chips.FaceChip.factory96x96('./sample_images/face/girl-384x192.png', [200, 260]);
    girl.addExpression('none', 2);
    girl.setZIndex(10);
    movie.append(girl);

    var badman = cls.$chips.FaceChip.factory96x96('./sample_images/face/badman-384x192.png', [200, 370]);
    badman.addExpression('none', 6);
    badman.setZIndex(10);
    movie.append(badman);

    mess.addParagraph('ある日、太陽は暗雲のなかにその姿を消し\n世界は闇に包まれた');
    mess.addParagraph('森は枯れ、田園は荒れ果て\n人々は飢えと寒さにあえぎ苦しんだ');
    mess.addParagraph('偉大なる王ガルデは\n太陽に通じると伝えられる古代の巨塔', {
        onstart: function(){
            gardet.fadeIn(1000);
        }
    });
    mess.addParagraph('「光の樹」に騎士団を送り\n探索を命じた');
    mess.addParagraph('しかし、光を求めて塔に入った騎士たちは\n一人として帰ってこなかった');
    mess.addParagraph('次に、将軍、賢者、魔導師といった', {
        onstart: function(){
            boy.fadeIn(1000);
            setTimeout(function(){
                girl.fadeIn(1000);
            }, 500);
            setTimeout(function(){
                badman.fadeIn(1000);
            }, 1000);
        }
    });
    mess.addParagraph('優れた人々が「光の樹」に挑んだが\n戻った者はいなかった', {
        onfinish: function(){
            boy.fadeOut();
            setTimeout(function(){
                girl.fadeOut();
            }, 500);
            setTimeout(function(){
                badman.fadeOut();
            }, 1000);
        }
    });
    mess.addParagraph('そして、最後にはガルデ王自らが大軍を率い\n「光の樹」の中に消えていった', {
        onfinish: function(){
            gardet.fadeOut(1000);
        }
    });

    movie.registerAnimation('showBg', 'show', bg);
    movie.registerAnimation('showMess', 'show', mess);
    movie.registerAnimation('startMessage', 'message', mess);
    movie.registerAnimation('wait', 'wait', 2000);
    movie.registerAnimation('finish', 'fadeOut', movie, 1000);

    movie.onTimeline('showBg', 0);
    movie.onTimeline('showMess', 0);
    movie.onTimeline('startMessage', 1000);
    movie.chainAnimation('startMessage', 'wait', 'finish');

    movie.getTimelineDeferred().next(function(){
        movie.remove();
        u.consoleLog('Movie end');
    });

    $('<a href="javascript:void(0)" />')
        .css({
            position: 'absolute',
            top: 100,
            left: 340,
            fontSize: 12
        })
        .text(u.title)
        .one('mousedown', function(){

            movie.draw();
            movie.show();
            bg.draw();
            mess.draw();

            gardet.drawChangeVariation('none');
            boy.drawChangeVariation('none');
            girl.drawChangeVariation('none');
            badman.drawChangeVariation('none');

            movie.getView().appendTo($(document.body));
            movie.startTimeline();
        })
        .appendTo($('#blocks'))
    ;
    return movie;
});
