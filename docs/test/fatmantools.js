//あいう
/**
 * FatmanTools
 *
 * でぶつーるず
 *
 * @author kjirou[dot]web[at]google[dot]com
 *         <http://kjirou.sakura.ne.jp/mt/>
 * @charset utf-8
 *
 * 残タスク：
 * - ストップウォッチもインスタンスを生成して動かすようにする
 */
(function(){

    var __classScope__ = this;

    // 依存関係チェック
    if ('FatmanTools' in __classScope__) {
        alert('`' + __className__ + '` is already defined');
        return;
    };


    /**
     * FatmanToolsクラス本体
     *
     * デバッグ出力関数も兼ねる
     */
    var cls = function(/* var args */){
        // new を不可にする分岐
        // ! 最初は this === window で判定しようと思ったけどIE8でfalseになってしまった, 原因不明
        // ! JSDeferred は `this instanceof Deferred` でやってたので、以下それの真似
        if (this instanceof arguments.callee) {
            throw new Error('Error in ' + __className__ + '(), impossible `new`');
        };
        arguments.callee.consoleLog.apply(arguments.callee, arguments);
    };

    cls.VERSION = '0.1.0';
    cls.RELEASED_AT = '2012-05-10 00:00:00';

    /** コンソール出力機能ON/OFFフラグ */
    cls.debug = true;

    /** ストップウォッチデータ */
    cls._stopwatchData = undefined;

    /** 計測結果の保持数 */
    cls.maxStopwatchResultCount = 10;

    /** グローバルスコープの変数を取得する */
    cls._getGlobalScope = function(){
        return (function(){return this})();
    };

    /** コンソールへ変数の内容を出力する */
    cls.consoleLog = function(){
        var g = cls._getGlobalScope();
        // ! IE8だと global.console instanceof Object === false
        //   しかも typeof global.console.log === 'object' だった
        //   以下の判定が現在は一番安定してる
        if (cls.debug && typeof g.console === 'object' && 'log' in g.console) {
            try {
                return g.console.log.apply(g.console, arguments);
            } catch (err) {// For IE
                var args = Array.prototype.slice.apply(arguments);
                return g.console.log(args.join(' '));
            };
        };
    };

    /** 依存関係を確認する, というかグローバルスコープに変数名があるかを見るのみ
        無い場合はアラートとエラー出力をする */
    cls.checkDependencies = function(needs){
        var g = cls._getGlobalScope();
        var notdefineds = [], i;
        for (i = 0; i < needs.length; i++) {
            if (needs[i] in g === false) notdefineds.push(needs[i]);
        };
        if (notdefineds.length > 0) {
            var txt = 'Not defined `' + notdefineds.join('`, `') + '`';
            alert(txt);
            throw new Error('Error in FatmanTools.checkDependencies, ' + txt);
        };
    };

    /** 時間計測を始める */
    cls.startWatch = function(key){
        var dat = {
            start: (new Date()).getTime(),
            stop: null
        };
        if (key in this._stopwatchData) {
            var times = this._stopwatchData[key];
            var last = times[times.length - 1]
            // 止める前に開始した場合
            if (last.stop === null) throw new Error('Error in FatmanTools.startWatch, not stopped, key=' + key + '`');
            times.push(dat);
            if (times.length > this.maxStopwatchResultCount) times.shift();
        } else {
            this._stopwatchData[key] = [dat];
        };
    };

    /** 時間計測を止める */
    cls.stopWatch = function(key){
        // 開始する前に止めた場合
        if (key in this._stopwatchData === false ||
            this._stopwatchData[key].slice(-1)[0].stop !== null) {
            throw new Error('Error in FatmanTools.stopWatch, not started');
        };
        this._stopwatchData[key].slice(-1)[0].stop = (new Date()).getTime();
    };

    /** 時間計測データを初期化する */
    cls.resetStopwatch = function(){
        this._stopwatchData = {};
    };

    /** 計測結果を文字列で返す */
    cls.getStopwatchResultsByString = function(key){
        var times = this._stopwatchData[key];
        var deltas = [];
        var i, t;
        for (i = 0; i < times.length; i++) {
            var t = times[i];
            deltas.push(t.stop - t.start);
        };
        return deltas.reverse().join(', ');
    };

    // 初期化
    cls.resetStopwatch();


    /** テスタークラス */
    cls.Tester = (function(){

        var kls = function(testName){
            if (testName === undefined) testName = 'noname';
            this._testName = testName;
            this._testData = [];
            this._currentTestIndex = -1;
            this._results = {};
            this._currentTestId = 0;
            this._isFinishedOnstart = false;
        };

        /** テストを追加する */
        kls.prototype.add = function(level, title, func){
            this._testData.push({
                testId: (this._currentTestId += 1), // 連番
                // 0=実行しない
                // 1=Backgroundモードで実行する, $dもタイトルも出力されない
                // 2=Quietモードで実行する, $dのみ出力されない
                // 3=実行する
                level: level,
                title: title,
                routine: func
            });
        };

        /** 全テストが実行済みかを判定する */
        kls.prototype.isFinished = function(){
            return this._currentTestIndex === this._testData.length - 1;
        };

        /** 次のテストを実行する
            this._nextをそのまま呼ぶとコンソール上にtrue/falseが表示されて紛らわしいので分けた */
        kls.prototype.next = function(){
            this._next();
        };

        /** 全テストを実行する */
        kls.prototype.test = function(){
            while (this._next()) {};
        };

        /** 次のテストを実行する, @return true=テストが有った || false=無かった
            next() を外部から呼び出してひとつずつ進める方式も取りたいので
            テストが無くてもエラーにせず、自動で終了処理に移らせるようにする */
        kls.prototype._next = function(){
            // テスト直前ハンドラ
            if (this._isFinishedOnstart === false) {
                this._onstart();
                this._isFinishedOnstart = true;
            };
            // 1テスト実行
            if (this.isFinished() === false) {
                this._currentTestIndex += 1;
                var testDat = this._testData[this._currentTestIndex];
                this._testOne(testDat);
                return true;
            };
            // 全テスト終了処理
            cls.consoleLog('Tester=`' + this._testName + '` completed all tests, results =', this._results); // テスト結果出力
            this._currentTestIndex = -1;
            return false;
        };

        /** テストを実行する */
        kls.prototype._testOne = function(testDat){
            var t = testDat;// 特に意味はない, 改修履歴上の理由

            if (t.level === 0) return;

            // テスト内用の出力関数
            var printer = cls.consoleLog;
            if (t.level < 3) printer = function(){}; // レベルによる出力制御

            // タイトル出力
            if (t.level >= 2) {
                cls.consoleLog('#### Test['+ (t.level === 2 ? 'Q':'N') +']: ' + t.title + ' ####');
            };

            // 能動エラー発生用関数
            var throwError = function(msg){
                msg = msg || '';
                if (msg !== '') msg = ', ' + msg;
                throw new Error('Fatmantools.Tester, id=`' + t.testId + '` title=`' + t.title + '`' + msg);
            };

            // テスト内用の便利ツール群
            var utils = {
                self: this,
                testId: t.testId,
                level: t.level,
                title: t.title,
                consoleLog: cls.consoleLog, // 常に出力したい場合
                error: throwError
            };

            // テスト実行、結果取得
            var result = t.routine(utils, printer);
            // 結果がfalse時は不正報告
            if (result === false) throwError();
            // テスト結果整理
            var results = {
                title: t.title,
                data: result
            };
            // コンソールで見易い様にする
            results.toString = function(){return this.title};
            // テスト結果格納
            this._results[t.testId] = results;
        };

        /** テスト開始直前に一度だけ実行するルーチン, 必要なら__付きをoverride */
        kls.prototype.__onstart = function(){
        };
        kls.prototype._onstart = function(){
            this.__onstart();
        };

        kls.prototype.getResults = function(){
            return this._results;
        };

        return kls;
    })();

    /** テスターを作成する／返す */
    cls._testers = {};
    cls.factoryTester = function(name){
        var obj = new cls.Tester(name);
        if (name !== undefined) cls._testers[name] = obj;
        return obj;
    };
    cls.getTester = function(name){
        return cls._testers[name];
    };

    __classScope__['FatmanTools'] = cls;
})();
