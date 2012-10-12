#!/bin/sh
#あいう

#
# Closure Compiler Application による圧縮ルーチン
#

CUR=$(cd $(dirname $0) && pwd)

# Env
COMPILER_JAR='/usr/local/gcca/compiler.jar'
JS_DIR=$CUR
OUTPUT_FILE=$CUR'/rpgmaterial.min.js'

# Process
#   index.js以降はsrc内をアルファベット順に出力, lsで出てくる順と同じ
java -jar $COMPILER_JAR \
    --js $JS_DIR/rpgmaterial.js \
    --js_output_file $OUTPUT_FILE
