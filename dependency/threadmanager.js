//あいう <- For auto file encoding
/**
 * ThreadManager
 *
 * Management asynchronous processes class
 *
 * @dependency (if use enableJSDeferred)
 *               JSDeferred <http://cho45.stfuawsc.com/jsdeferred/doc/intro.html>
 * @author kjirou[dot]web[at]google[dot]com
 *         <http://kjirou.sakura.ne.jp/mt/>
 * @charset utf-8
 *
 * 残タスク:
 * - 複数環境対応, factoryClient時にサーバ名指定も出来るようにする
 */
(function(){
    var __classScope__ = this;

    // 依存関係チェック
    if ('ThreadManager' in __classScope__) {
        alert('`ThreadManager` is already defined');
        return;
    };

    /** 開発用出力関数ショートカット, 後で入れる */
    var $d = undefined;

    /** 大域スコープを保持 */
    var $global = this;


    /**
     * ThreadManagerクラス本体
     */
    var cls = function(){
        throw new Error('Error in ThreadManager(), impossible `call` and `new`');
    };

    cls.VERSION = '1.0.0';
    cls.RELEASED_AT = '2012-05-10 00:00:00';

    /** 開発中フラグ */
    cls.debug = false;

    /** 開発用出力関数 */
    cls.$d = function(){
        if (cls.debug && 'console' in this && 'log' in this.console) {
            try {
                return this.console.log.apply(this.console, arguments);
            } catch (err) {// For IE
                var args = Array.prototype.slice.apply(arguments);
                return this.console.log(args.join(' '));
            };
        };
    };
    $d = cls.$d;

    /** JSDeferred有効を初期設定にする */
    cls._enabledJSDeferred = false;
    cls.enableJSDeferred = function(){
        if ('Deferred' in $global === false || typeof Deferred !== 'function' ||
            Deferred.isDeferred(new Deferred()) === false) {
            throw new Error('Error in ThreadManager.enableJSDeferred, not required JSDeferred as `Deferred`');
        };
        cls._enabledJSDeferred = true;
    };

    /** 配列内に要素が含まれるかを判定する, @return num indexOfと同じ */
    cls._inArray = function(target, arr){
        var i;
        for (i = 0; i < arr.length; i++) { if (arr[i] === target) return i };
        return -1;
    };

    /** 配列a のいずれかの要素が 配列b にも含まれているかを判定する
        @return true=ある, false=ない */
    cls._multiInArray = function(a, b){
        var i;
        for (i = 0; i < a.length; i++) { if (cls._inArray(a[i], b) !== -1) return true };
        return false;
    };


    /**
     * スレッドサーバクラス
     */
    cls.Server = (function(){

        var kls = function(){

            //
            // 唯一のオブジェクトを使いまわすので、初期化方法が必要
            // ということで、初期値代入は _reset を使うこと
            //

            // 各クライアントへ割り振るユニークID, 連番
            this._currentClientId = undefined; // init=>number

            // 実行中スレッドクライアントリスト, 実行前後スレッドの管理は今は不要なので保留中
            // 各セット => '<クライアントID>': <クライアントインスタンス>
            this._activeClients = undefined; // init=>{}
        };

        /** 唯一のインスタンス */
        kls.__instance__ = null;

        /** インスタンスを初期化する, _reset との違いは一番最初の初期化時だけに呼ばれる点 */
        kls.prototype._initialize = function(){
            this._reset();
        };

        /** インスタンスを初期状態にする */
        kls.prototype._reset = function(){
            this._currentClientId = 0;
            this._activeClients = {};
        };

        /** 次のクライアントIDを返す */
        kls.prototype._getNextClientId = function(){
            this._currentClientId += 1;
            return this._currentClientId;
        };

        /** 実行中クライアントへ追加する／除去する */
        kls.prototype._addActiveClient = function(client){
            this._activeClients[client._clientId] = client;
        };
        kls.prototype._removeActiveClient = function(client){
            delete this._activeClients[client._clientId];
        };

        /** 実行中クライアントリストから、条件を指定してクライアントリストを抽出する
            @param obj conditions 抽出条件集合, ソース上部参照
            @return arr クライアントリスト, クライアントID昇順 */
        kls.prototype.findActiveClients = function(conditions){
            var conds = conditions || {};

            var divisionName = ('divisionName' in conds)? conds.divisionName: null;
            var tags = ('tags' in conds)? conds.tags: null;
            if ('tag' in conds) tags = [conds.tag]; // tags 設定を上書きする

            var list = [];
            var k, cli;
            for (k in this._activeClients) {
                cli = this._activeClients[k];

                // 所属名条件
                if (divisionName !== null) {
                    if (divisionName !== cli._divisionName) continue;
                };
                // タグ名条件, 複数指定した場合はいずれかを含むもの全て
                if (tags !== null) {
                    if (cls._multiInArray(tags, cli._tags) === false) continue;
                };

                list.push(cli);
            };

            // クライアントID昇順ソート
            list.sort(function(a, b){return a._clientId - b._clientId});

            return list;
        };

        /** 実行中クライアントを停止する */
        kls.prototype.stopActiveClients = function(/* args passing */){
            var clients = this.findActiveClients.apply(this, arguments);
            var i;
            for (i = 0; i < clients.length; i++) {
                cli = clients[i];
                cli.stop();
            };
            // ! 全stopのdeferredで同期を取ることも考えたが、以下の理由で止めた
            //   1. stop処理はほとんどの場合非同期処理ではない
            //   2. stopに同期処理と非同期処理が混ざった場合、
            //      単なる Deferred.parallel(deferreds) 的な処理だと
            //      同期処理の方が既に .call() しちゃってるので、終わらなくなる
            //      そうすると、complete/stop を全部 Deferred対応にしないといけなくなり、影響が大き過ぎる
            //   3. そもそも、Deferredが無い場合もある
            //   4. そもそも、この関数自体あんまり使わないので手を掛けない方がいい
        };

        /** 唯一のインスタンスを返す */
        kls._singleton = function(){
            if (this.__instance__ === null) {
                var obj = new this;
                obj._initialize();
                this.__instance__ = obj;
            };
            return this.__instance__;
        };

        return kls;
    })();


    /**
     * スレッドクライアントクラス
     */
    cls.Client = (function(){

        var kls = function(){

            // 全クライアントでのユニークID, 1以上の整数で連番
            this._clientId = undefined;

            // 所属先名, タグリスト, Server側解説参照
            this._divisionName = null;
            this._tags = [];

            /**
             * スレッド実行・結果状況判定用フラグ
             *
             * 有り得るフラグの組み合わせは以下の通り, getState で抽出する
             *
             *              未実行 実行中 完了済 停止済
             * _isStarted        F      T      T      T
             * _isCompleted      F      F      T      F
             * _isStopped        F      F      F      T
             */
            this._isStarted = false;
            this._isCompleted = false;
            this._isStopped = false;

            /** 停止時のコールバック関数初期値, 詳細は this.bind 参照 */
            this._onComplete = function(evt){};
            this._onStop = function(evt){};
            this._onFinish = function(evt){};

            /** スレッド終了時に同期するDeferredオブジェクト, @see cls._enabledJSDeferred */
            this._deferred = null;
        };

        /** 初期化メソッド */
        kls.prototype._initialize = function(){

            var server = cls.getServer();

            // クライアントID
            this._clientId = server._getNextClientId();
        };

        /** 抽出用タグを付ける */
        kls.prototype.addTag = function(tag){
            tag = tag.toString();// 文字列のみ
            this._tags.push(tag);
        };

        /** イベントハンドラを定義する, 'finish', 'complete', 'stop' の指定が可能
            bindとコールバック関数の引数は jQuery.bind の仕様に合わせている */
        kls.prototype.bind = function(handlerType, data, callback){
            var handlerTypes = {
                complete: '_onComplete',
                stop: '_onStop',
                finish: '_onFinish'
            };
            if (handlerType in handlerTypes === false) {
                throw new Error('Error in ThreadManager.bind, invalid handlerType=`' + handlerType + '`');
            };
            this[handlerTypes[handlerType]] = function(){
                var evt = {'data': data};
                callback(evt);
            };
        };

        /** スレッドを開始する */
        kls.prototype.start = function(){
            if (this.isStarted()) {
                throw new Error('Error in ThreadManager.Client.start, already started');
            };
            this._isStarted = true;
            var server = cls.getServer();
            server._addActiveClient(this);
        };

        /** 完了する */
        kls.prototype.complete = function(){
            if (this.isStarted() === false) {
                throw new Error('Error in ThreadManager.Client.complete, not yet started');
            };
            if (this.isFinished()) {
                throw new Error('Error in ThreadManager.Client.complete, already finished');
            };
            this._isCompleted = true;
            this._onComplete();
            this._finish();
        };

        /** 停止する */
        kls.prototype.stop = function(){
            var self = this;
            if (this.isStarted() === false) {
                throw new Error('Error in ThreadManager.Client.stop, not yet started');
            };
            if (this.isFinished()) {
                throw new Error('Error in ThreadManager.Client.stop, already finished');
            };
            // ! _isStoppedが_onStopより上なのは重要なので変える場合は注意
            //   _onStop内でgetStateを呼び出された場合の「停止済」(今はこれ)か「実行中」かの判断が変わる
            //   もし両方必要なら、実行前後でフラグを分ける必要がある
            this._isStopped = true;
            this._onStop();
            this._finish();
        };

        /** 終了する, 完了・停止時共通処理 */
        kls.prototype._finish = function(){
            this._onFinish();
            var server = cls.getServer();
            server._removeActiveClient(this);
            if (this.hasDeferred()) this._deferred.call();
        };

        /** Deferredアクセサ群 */
        kls.prototype.hasDeferred = function(){
            return this._deferred !== null;
        };
        kls.prototype.getDeferred = function(){
            if (this.hasDeferred() === false) {
                throw new Error('Error in ThreadManager.Client.getDeferred, JSDeferred is disabled');
            };
            return this._deferred;
        };

        /** 状況概要を文字列で返す／その他判定用ショートカットメソッド */
        kls.prototype.getState = function(){
            if (this._isStarted === false) return 'notstart'; // 未実行
            if (this._isCompleted === true) return 'complete'; // 完了済み
            if (this._isStopped === true) return 'stop'; // 終了済み
            return 'start'; // 実行中
        };
        kls.prototype.isStarted = function(){// 開始済みか
            return this.getState() !== 'notstart';
        };
        kls.prototype.isFinished = function(){// 終了済みか
            return this.getState() === 'complete' || this.getState() === 'stop';
        };

        return kls;
    })();


    /** クライアントを生成する, useDeferred=trueでDeferred連携 */
    cls.factoryClient = function(divisionName, useDeferred){
        var client = new cls.Client();
        if (divisionName !== undefined) client._divisionName = divisionName;
        // 明示指定は初期設定に勝つ
        if (useDeferred === true || useDeferred === undefined && cls._enabledJSDeferred) {
            client._deferred = new Deferred();
        };
        client._initialize();
        return client;
    };

    /** 唯一のサーバを返す */
    cls.getServer = function(){
        return cls.Server._singleton();
    };


    /** テスト関数群 */
    cls.__test1Vars = null;
    cls.__test1 = function(){
        cls.debug = true;

        var a = cls.factoryClient();
        var b = cls.factoryClient('timer');
        var c = cls.factoryClient('timer');
        c.addTag('related_by_dog_object');
        var d = cls.factoryClient('event');
        d.addTag('related_by_cat_object');
        var e = cls.factoryClient('event');
        e.addTag('related_by_dog_object');
        e.addTag('related_by_cat_object');

        var clients = [a, b, c, d, e];
        var server = cls.getServer();

        $d('Not started =', server.findActiveClients());

        e.start();
        c.start();
        a.start();
        $d('No.1, 3, 5 started =', server.findActiveClients());

        b.start();
        d.start();
        $d('All started =', server.findActiveClients());

        $d('Find by divisionName =', server.findActiveClients({divisionName:'timer'}));
        $d('Find by tag =', server.findActiveClients({tag:'related_by_dog_object'}));
        $d('FInd by tags =', server.findActiveClients({tags: ['related_by_dog_object', 'related_by_cat_object']}));
        $d('Find by divisionName & tag =', server.findActiveClients({divisionName:'event', tag:'related_by_dog_object'}));

        b.complete();
        c.complete();
        d.stop();
        e.stop();
        $d('No.2, 3 completed & No.4, 5 stopped =', server.findActiveClients());

        $d('No.1 status = ', a.getState());
        $d('No.2 status = ', b.getState());
        $d('No.3 status = ', c.getState());
        $d('No.4 status = ', d.getState());
        $d('No.5 status = ', e.getState());

        cls.__test1Vars = clients;
    };
    cls.__test2 = function(){
        cls.debug = true;
        var cli = cls.factoryClient();
        $d(cli.getState());
        cli.start();
        $d(cli.getState());
        setTimeout(function(){
            cli.complete();
            $d(cli.getState());
        }, 2000);
    };
    cls.__test3 = function(){
        cls.debug = true;

        var a = cls.factoryClient();
        a.bind('stop', {a:1, b:2, self:a}, function(evt){
            $d('Stopped', evt.data);
        });
        a.start();
        setTimeout(function(){
            a.stop();
        }, 1000);

        var b = cls.factoryClient();
        b.bind('complete', {}, function(evt){
            $d('Completed');
        });
        b.bind('finish', {}, function(evt){
            $d('Finished');
        });
        b.start();
        setTimeout(function(){
            b.complete();
        }, 3000);
    };
    cls.__test4 = function(){
        cls.debug = true;
        var a = cls.factoryClient();
        a.bind('stop', {}, function(evt){
            $d('Done a._onStop');
        });
        var b = cls.factoryClient();
        b.bind('stop', {}, function(evt){
            $d('Done b._onStop');
        });

        a.start();
        b.start();
        setTimeout(function(){
            var server = cls.getServer();
            server.stopActiveClients();
        }, 2000);
    };
    cls.__testWithDeferred1 = function(){
        cls.debug = true;
        cls.enableJSDeferred();
        var cli = cls.factoryClient();
        cli.getDeferred().next(function(){
            $d('Deferred end');
        });

        cli.start();
        setTimeout(function(){
            cli.complete();
        }, 3000);
    };
    cls.__testWithDeferred2 = function(){
        cls.debug = true;
        var cli = cls.factoryClient();
        cli.getDeferred(); // -> Error
    };
    cls.__testWithDeferred3 = function(){
        cls.debug = true;
        delete Deferred;
        cls.enableJSDeferred();
    };


    // クラスを外部へ定義
    __classScope__['ThreadManager'] = cls;
})();
