/** チップ画像ID仕様書クラス */
ChipImageIDSpecification = (function(){
    //
    // !!! 実質使わなくなった !!!
    //
    // -> アニメ側が必要なチップ画像IDを決める
    // -> チップ側にそれが無かったら、代用情報を反映して再判定する
    // ...ということがしたかったが、意味が薄いので止めた
    //
    // 今は画像別種名でやってる管理とWスタンダードにして入れようとしたが、
    // どうせアクターは極僅かなので、必要な表情を、例え画像が無くても全部マッピングだけはしちゃえばいい
    // 他のアニメについても同様で、全手動マッピングする方が遥かに楽で保守も楽
    //
    // これをやるなら、単なるキーである画像別種名を廃止して
    // 全部規格化して以下の管理下に置く位をやらないとあんまり意味がない
    // ゲーム作成サイトとか素材配布サイトとか用だった
    //
    // 規格として管理するのは面白そうなので継続してみる
    //
    // ----------------------------
    // チップ画像ID仕様
    //
    // - 必ず先頭が $ で始まる
    // - $ = 階層を示す
    // - @ = 階層名ではなく画像名であることと、その後は属性情報であることを示す
    //       $a$b@32x32 は $a$b という名前で 32x32 サイズという意味
    //       とりあえずは、1.画像名であることの明示
    //                     2.サイズ情報分離(別サイズ情報で代用できることが多いので) をしたかった
    // ex)
    // "abc" = 今のところは存在しない
    // "$character$body$south$right-step@32x32" = 32x32キャラチップ南向き右足出し画像
    // "$character$face$surprised@96x96"        = 96x96顔グラ驚き表情
    // "$rotate$3$1@" = 輪番で繰り返す場合の画像, "3/1" は 1 2 3 1 2 3 ... の 1 を示す
    // "$goback$4$1@" = 行き帰りで繰り返す場合の画像, ポーズサインはこれ
    //                   4/1 は 1 2 3 4 3 2 1 で繰り返す画像の1 を示す
    //
    // - 使用文字が妙なのは以下の理由から
    //   1. OSのファイル名に使える文字だけにしたい
    //      WinでNG  < > : * ? " / \ |
    //      MacでNG  : /
    //      Linux ... は $ や - だと誤動作を起こし易いかもしれないが、優先度は低い
    //      . は勿論NG
    //   2. - や _ は内部で自由に使えるように残す
    //   3. href属性にそのまま入れると不具合を起こすものはダメ、画像直リンクのため
    //      % と # と + はNG
    //      & と = もURLを張り付けるときなどに紛らわしいのでNG
    //      WSSは加えて ~ {} がNGらしい
    //   4. HTMLにそのまま書けないものはNG ・・・これは該当が既にダメ
    //
    //   こうしてみると、残りが , ; ! $ @ ' () [] しかない
    //   括弧はわかり難いので除外 , ; ' はそれぞれ . : " と間違えやすく
    //   どっちがどっちだかわかってない人も多いので除外、!$@ の中から $ と @ にした
    //
    var kls = function(){};
    kls.DEFINITIONS = {
        '$character$face$none@96x96': {
            'label': '無し',
            'substitutions': null // null=カテゴリデフォルト
        },
        '$character$face$smiled@96x96': {
            'label': '微笑み',
            'substitutions': ['laughing']
        },
        '$character$face$laughing@96x96': {
            'label': '笑い',
            'substitutions': ['smiled']
        },
        '$character$face$annoyed@96x96': {
            'label': '苛々',
            'substitutions': ['angry']
        },
        '$character$face$angry@96x96': {
            'label': '怒り',
            'substitutions': ['annoyed']
        },
        '$character$face$sad@96x96': {
            'label': '悲しみ',
            'substitutions': ['crying']
        },
        '$character$face$crying@96x96': {
            'label': '泣き',
            'substitutions': ['sad']
        },
        '$character$face$surprised@96x96': {
            'label': '驚き',
            'substitutions': ['surprised-cartoony']
        },
        '$character$face$surprised-cartoony@96x96': {
            'label': '漫画的驚き',
            'substitutions': ['surprised']
        },
        '$character$face$narvous@96x96': {
            'label': '緊張',
            'substitutions': ['none']
        },
        '$character$face$appalling@96x96': {
            'label': '呆れ',
            'substitutions': ['none']
        },
        '$goback$4$1@': {
            'label': '行き帰り1/4'
        },
        '$goback$4$2@': {
            'label': '行き帰り2/4'
        },
        '$goback$4$3@': {
            'label': '行き帰り3/4'
        },
        '$goback$4$4@': {
            'label': '行き帰り4/4'
        }//,
    };

    ///** チップ画像IDを指定条件で検索してリストで返す
    //    path str=文字列で検索 || regex=正規表現で検索
    //    exactness (未実装)'about'=代用情報含む, 'strict'=含まない */
    //kls.findIds = function(path/*, exactness*/){
    //    var list = [];
    //    if (path instanceof RegExp) {
    //        list = $f.collect($f.keys(kls.DEFINITIONS), function(i, id){
    //            if (path.test(id)) return id;
    //        });
    //    } else {
    //        list = $f.collect($f.keys(kls.DEFINITIONS), function(i, id){
    //            if (id.indexOf(path) > -1) return id;
    //        });
    //    };
    //    return JSONUtils.deepcopy(list, 'jqueryjson');
    //};

    ///** 代用画像IDリストを取得する, id=チップ画像ID */
    //kls.getSubstitutions = function(id){
    //    var list = [];
    //    var d = kls.DEFINITIONS[id];
    //    if (d === undefined) {
    //        throw new Error('JSRPGMaker.ChipImageIDSpecification.getSubstitutions, invalid id=`' + id + '`');
    //    };
    //    if ('substitutions' in d && d.substitutions instanceof Array) {
    //        list = $f.collect(d.substitutions, function(i, v){
    //            return id.replace(/[-_a-zA-Z0-9]+@([-_a-zA-Z0-9]*)$/, v + '@$1');
    //        });
    //    };
    //    return list;
    //};

    ///** 指定画像IDが属するカテゴリの初期画像IDを取得する */
    //kls.getDefault = function(id){
    //    // ! 暫定, 多分顔グラ位しか初期を返さない, 何個か増えてもこういう感じでやる
    //    // ! 本来は所属カテゴリのIDリストを引いて、substitutions=null を見て返さないといけない
    //    if (/^\$character\$face\$/.test(id)) {
    //        return '$character$face$none@96x96';
    //    };
    //    return null;
    //};

    return kls;
})();

//cls.Test.add(1, 'ChipImageIDSpecification', function(u, cls, $d, $f){
//    if (cls.ChipImageIDSpecification.getSubstitutions('$character$face$appalling@96x96').length === 0) u.error();
//    if (cls.ChipImageIDSpecification.getSubstitutions('$character$face$surprised-cartoony@96x96').length === 0) u.error();
//    if (cls.ChipImageIDSpecification.getSubstitutions('$goback$4$1@').length !== 0) u.error();
//    try {
//        cls.ChipImageIDSpecification.getSubstitutions('unknown');
//        return false;
//    } catch (err) { $d('NP =', err); };
//
//    if (cls.ChipImageIDSpecification.getDefault('$character$face$surprised-cartoony@96x96') !== '$character$face$none@96x96') u.error();
//    if (cls.ChipImageIDSpecification.getDefault('$goback$4$1@') !== null) u.error();
//
//    if (cls.ChipImageIDSpecification.findIds('goback$4').length !== 4) u.error();
//    if (cls.ChipImageIDSpecification.findIds(/^\$character\$face\$s/).length === 0) u.error();
//    if (cls.ChipImageIDSpecification.findIds(/acharacter\$face\$s/).length !== 0) u.error();
//});
