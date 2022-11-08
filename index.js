
/*--------------------------
    Keyboad
    -------------------------*/

// キーボードの入力状態を記録する配列の定義
const input_key_buffer = new Array();

// ◎キーボードの入力イベントをトリガーに配列のフラグ値を更新させる
// キーを押したとき
window.addEventListener("keydown", handleKeydown);
function handleKeydown(e) {
    e.preventDefault();
    input_key_buffer[e.keyCode] = true;
}

// キーをはなしたとき
window.addEventListener("keyup", handleKeyup);
function handleKeyup(e) {
    e.preventDefault();
    input_key_buffer[e.keyCode] = false;
}

/*--------------------------
    canvas要素の取得
    -------------------------*/

// canvas要素の取得
const canvas = document.getElementById("maincanvas");
//二次元情報の取得（canvasのおきまり）
const ctx = canvas.getContext("2d");

/*--------------------------
    初期値設定
    -------------------------*/
// プレイヤーの初期座標
let x = 0;
let y = 300;

// ゴールの初期座標
let goalX = 850;
let goalY = 100;

// 上下方向の速度
let vy = 0;
// ジャンプしたか否かのフラグ値
let isJump = false;
// ゲームオーバーか否かのフラグ値
let isGameOver = false;

// 移動中の場合にカウントする
let walkingCount = 0;
// カウントに対して画像を切り替える単位
const walkRange = 15;

// ブロック要素の定義（ブロックの位置と大きさはここで調整）
const blocks = [
    { x: 0, y: 532, w: 100, h: 32 },
    { x: 100, y: 500, w: 100, h: 32 },
    { x: 200, y: 450, w: 100, h: 32 },
    { x: 300, y: 400, w: 100, h: 32 },
    { x: 400, y: 350, w: 100, h: 32 },
    { x: 500, y: 300, w: 100, h: 32 },
    { x: 600, y: 250, w: 100, h: 32 },
    { x: 700, y: 200, w: 100, h: 32 },
    { x: 800, y: 120, w: 100, h: 32 },
];

// 敵の情報
const enemies = [
    { x: 650, y: 100, isJump: true, vy: 0 },
    { x: 720, y: 100, isJump: true, vy: 0 },
    { x: 740, y: 100, isJump: true, vy: 0 },
    { x: 760, y: 100, isJump: true, vy: 0 },
    { x: 800, y: 100, isJump: true, vy: 0 },
];

/*--------------------------
    メイン部分
-------------------------*/

// ロード時に処理が実行されるようにする（最初の一回）
window.addEventListener("load", update);

// 画面を更新する関数を定義 (繰り返しここの処理が実行される)
function update() {
    // 画面全体をクリア
    ctx.clearRect(0, 0, 960, 640);

    console.log(x);


    /*--------------------------
        敵側
    -------------------------*/

    // 敵情報ごとに、位置座標を更新する
    for (const enemy of enemies) {
        // アップデート後の敵の座標
        let updatedEnemyX = enemy.x;
        let updatedEnemyY = enemy.y;
        let updatedEnemyInJump = enemy.isJump;
        let updatedEnemyVy = enemy.vy;

        // 敵は左に固定の速度で移動するようにする
        updatedEnemyX = updatedEnemyX - 0.8;//ここで敵のスピード調整

        // 敵の場合にも、主人公の場合と同様にジャンプか否かで分岐
        if (enemy.isJump) {
            // ジャンプ中は敵の速度分だけ追加する
            updatedEnemyY = enemy.y + enemy.vy;

            // 速度を固定分だけ増加させる
            updatedEnemyVy = enemy.vy + 0.5;

            // ブロックを取得する
            const blockTargetIsOn = getBlockTargetIsOn(
                enemy.x,
                enemy.y,
                updatedEnemyX,
                updatedEnemyY
            );

            // ブロックが取得できた場合には、そのブロックの上に立っているよう見えるように着地させる
            if (blockTargetIsOn !== null) {
                updatedEnemyY = blockTargetIsOn.y - 64;
                updatedEnemyInJump = false;
            }
        } else {
            // ブロックの上にいなければジャンプ中の扱いとして初期速度0で落下するようにする
            if (
                getBlockTargetIsOn(enemy.x, enemy.y, updatedEnemyX, updatedEnemyY) ===
                null
            ) {
                updatedEnemyInJump = true;
                updatedEnemyVy = 0;
            }
        }

        // 算出した結果に変更する
        enemy.x = updatedEnemyX;
        enemy.y = updatedEnemyY;
        enemy.isJump = updatedEnemyInJump;
        enemy.vy = updatedEnemyVy;

        // 算出した結果に変更する
        enemyX = updatedEnemyX;
        enemyY = updatedEnemyY;

    }

    /*--------------------------
        プレイヤー側
    -------------------------*/
    // 更新後のプレイヤーの座標
    let updatedX = x; //xはキーを押して移動していたら変化する、何もしないなら変わらない
    let updatedY = y; //jump後は基本落下していくのでupdateのたびに何もしなくてもyは変化する

    /*--------------------------
      Game Over（y > 600）の場合
    -------------------------*/
    if (isGameOver) {
        // 上下方向は速度分をたす
        updatedY = y + vy;

        // 落下速度はだんだん大きくなる
        vy = vy + 0.5;

        // 一回跳ねた後、さらに落ちて500をこえたら
        if (y > 700) {
            // ゲームオーバーのキャラが更に下に落ちてきた時にダイアログを表示し、各種変数を初期化する
            // alert("GAME OVER");
            isGameOver = false;
            isJump = false;
            updatedX = 0;
            updatedY = 300;
            vy = 0;
        }

        /*--------------------------
        Game Overではない場合
        -------------------------*/

    } else {

        /*--------------------------
       WalkingCount
       -------------------------*/
        // 右か左を入力したら
        if (input_key_buffer[37] || input_key_buffer[39]) {
            walkingCount = walkingCount + 1;
        } else {
            walkingCount = 0; //ここを設定すると歩くたびに0のときの画像で表示
        }

        /*--------------------------
        入力する各キーボードに対しての処理
        -------------------------*/
        //←キー
        if (input_key_buffer[37]) {
            // 左が押されていればx座標を2減らす
            updatedX = x - 2;
        }
        //↑キー(!isJumpの時は不可とし、２段ジャンプさせない)
        if (input_key_buffer[38] && !isJump) {
            // 上が押されていれば、上向きの初期速度を与え、ジャンプ中のフラグを立てる
            vy = -15;//ここでジャンプの速度調整する
            isJump = true;
        }
        //→キー
        if (input_key_buffer[39]) {
            // 右が押されていればx座標を2増やす
            updatedX = x + 2;
        }

        /*--------------------------
        ジャンプしているかしていないか
        -------------------------*/
        // ◎ジャンプしている場合
        if (isJump) {
            // ジャンプ中である場合のみ落下するように調整する
            // 落下速度はだんだん大きくなる(「+」は落下方向へ。描画するたびに0.5が+されることでどんどん落下方向へ座標が向かう)
            vy = vy + 0.5;
            // 上下方向は速度分をたす
            //（１回目は-7分Jump！以降、y-6.5,y-6,,,,y+0,5となっていき+の方向（落下方向）へ）
            updatedY = y + vy;

            // 主人公が乗っているブロック(の情報)を取得する(オブジェクトの形で取得してる)
            const blockTargetIsOn = getBlockTargetIsOn(x, y, updatedX, updatedY);
            // console.log(blockTargetIsOn);

            // ブロックが取得できた場合には、そのブロックの上に立っているよう見えるように着地させる
            if (blockTargetIsOn !== null) {
                updatedY = blockTargetIsOn.y - 64;
                isJump = false;
            } else {
                // (nullの場合)何もしない（落下させ続ける）
            }

            // ◎ジャンプ中でない場合
        } else {
            // ブロックの上にいなければジャンプ中の扱いとして初期速度0で落下するようにする
            if (getBlockTargetIsOn(x, y, updatedX, updatedY) === null) {
                isJump = true;
                vy = 0;
            } else {
                // ブロックの上にいれば何もしない（その座標に留まったまま）
            }
        }

        /*--------------------------
       Game Over判定
       -------------------------*/
        if (y > 600) {
            // 下まで落ちてきたらゲームオーバーとし、上方向の初速度を与える
            isGameOver = true;
            //600を超えた瞬間一気に700まで落とす（なくてもいい？？）
            updatedY = 700;
            vy = -15;
        }
    }

    //算出した結果に変更
    x = updatedX;
    y = updatedY;
    // console.log(updatedY);

    /*--------------------------
       あたり判定
       -------------------------*/
    // すでにゲームオーバーとなっていない場合のみ敵とのあたり判定を行う必要がある
    // なぜなら敵に当たってゲームオーバー状態後も敵に当たれば跳ね続けてしまう（死んでるのにずっとisHitしちゃう）
    if (!isGameOver) {
        // 敵情報ごとに当たり判定を行う
        for (const enemy of enemies) {
            // 更新後のプレイヤーの位置情報と、敵の位置情報とが重なっているかをチェックする
            const isHit = isAreaOverlap(x, y, 64, 64, enemy.x, enemy.y, 32, 32);

            if (isHit) {
                if (isJump && vy > 0) {
                    // ジャンプしていて、落下している状態で敵にぶつかった場合には
                    // 敵をブロックの下にはじくとともに、上向きにジャンプさせる
                    // これもしかしたら下にブロックが二重にあったら敵助かっちゃう？
                    vy = -7;
                    enemy.y = enemy.y + 200;
                } else {
                    // ぶつかっていた場合にはゲームオーバーとし、上方向の初速度を与える
                    isGameOver = true;
                    vy = -10;
                }
            }
        }
    }

    /*--------------------------
      ゴール判定
      -------------------------*/
    const isGoal = isAreaOverlap(x, y, 64, 64, goalX, goalY, 32, 32);
    if (isGoal) {
        alert("Goal!!");
        isJump = false;
        x = 0;
        y = 300;
        vy = 0;
        // これをしてあげないと右キー押したままゴールするとtrueが保持されてリスタート時勝手に右に行く
        input_key_buffer[39] = false;
    }

    /*--------------------------
        画像作成
        -------------------------*/
    // プレイヤー画像要素の作成、画像を表示
    const image = new Image();
    if (isGameOver) {
        // ゲームオーバーの場合にはゲームオーバーの画像が表示する
        image.src = "images/chaewon_gameover.png";
    } else if (Math.floor(walkingCount / walkRange) === 0) {
        image.src = "images/chaewon1.png";
    } else if (Math.floor(walkingCount / walkRange) === 1) {
        image.src = "images/chaewon2.png";
    } else if (Math.floor(walkingCount / walkRange) === 2) {
        image.src = "images/chaewon1.png";
    } else if (Math.floor(walkingCount / walkRange) === 3) {
        image.src = "images/chaewon2.png";
    } else if (Math.floor(walkingCount / walkRange) === 4) {
        image.src = "images/chaewon1.png";
    } else if (Math.floor(walkingCount / walkRange) === 5) {
        image.src = "images/chaewon2.png";
    } else if (Math.floor(walkingCount / walkRange) === 6) {
        image.src = "images/chaewon1.png";
    } else if (Math.floor(walkingCount / walkRange) === 7) {
        image.src = "images/chaewon2.png";
    } else if (Math.floor(walkingCount / walkRange) === 8) {
        image.src = "images/chaewon1.png";
    } else {
        image.src = "images/chaewon2.png";
    }
    ctx.drawImage(image, x, y, 64, 64);

    // 地面の画像を表示
    const groundImage = new Image();
    groundImage.src = "images/block.png";
    //オブジェクトの数だけ繰り返してブロック作成！
    for (const block of blocks) {
        ctx.drawImage(groundImage, block.x, block.y, block.w, block.h);
    }

    // 敵の画像を表示
    const enemyImage = new Image();
    enemyImage.src = "images/monster.png"
    // 敵の描画を敵ごとに行うようにする
    for (const enemy of enemies) {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, 64, 64);
    }

    // ゴールの画像を表示
    const goalImage = new Image();
    goalImage.src = "images/hitumabushi.png"
    ctx.drawImage(goalImage, goalX, goalY, 32, 32);


    // 再描画
    window.requestAnimationFrame(update);
}


/*--------------------------
ブロックに乗っているかの判定
-------------------------*/
// 変更前後のxy座標を受け取って、ブロック上に存在していればそのブロックの情報を、存在していなければnullを返す
function getBlockTargetIsOn(x, y, updatedX, updatedY) {
    // 全てのブロックに対して繰り返し処理をする
    for (const block of blocks) {
        // プレイヤーの画像下部が地面の上部より下となったタイミングでブロックの上にいるか否かの判定をする
        //(ジャンプ後（isJump=true時）はy方向は下へ進む（落下している）ので丁度ローディングの前後でブロックと重なり始めたタイミングってこと)
        if (y + 64 <= block.y && updatedY + 64 >= block.y) {
            // 下となったタイミングで全てのブロックに対して繰り返し処理をする
            if (
                //ブロックに重なる直前、ブロックのx座標よりプレイヤーの座標（右端、横幅分+64）が左に位置する、または、右に位置する
                (x + 64 <= block.x || x >= block.x + block.w) &&
                //かつ、ブロックに重なった瞬間のプレイヤー座標がブロックの外側に位置する
                (updatedX + 64 <= block.x || updatedX >= block.x + block.w)
            ) {
                // ブロックの上にいない場合には何もしない
                continue;
            } else {
                // ブロックの上にいる場合には、そのブロック要素を返す
                return block;
            }
        }
    }
    // 最後までブロック要素を返さなかった場合(return block未実行)はブロック要素の上にいないということなのでnullを返却する
    return null;
}


/**
 * 2つの要素(A, B)に重なる部分があるか否かをチェックする
 * 要素Aの左上の角の座標を(ax, ay)、幅をaw, 高さをahとする
 * 要素Bの左上の角の座標を(bx, by)、幅をbw, 高さをbhとする
 */
function isAreaOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    // A要素の左側の側面が、Bの要素の右端の側面より、右側にあれば重なり得ない
    if (bx + bw < ax) {
        return false;
    }
    // B要素の左側の側面が、Aの要素の右端の側面より、右側にあれば重なり得ない
    if (ax + aw < bx) {
        return false;
    }

    // A要素の上側の側面が、Bの要素の下端の側面より、下側にあれば重なり得ない
    if (by + bh < ay) {
        return false;
    }
    // B要素の上側の側面が、Aの要素の下端の側面より、上側にあれば重なり得ない
    if (ay + ah < by) {
        return false;
    }
    // ここまで到達する場合には、どこかしらで重なる
    return true;
}