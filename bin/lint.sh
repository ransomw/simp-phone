#! /bin/sh

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"

# ensure the script is run from the project root directory
cwd="$(pwd)"
script_parent_dir="$(dirname $SCRIPT_DIR)"
if [ $cwd != $script_parent_dir ]
then
    echo "run from project root directory" 1>&2
    exit 64
fi

RUN_JS=1
RUN_JSON=1
RUN_PYTHON=1
RUN_WHITESPACE=1

VERBOSE=0

while getopts "vt:" opt; do
    case "$opt" in
        t)  RUN_JS=0
            RUN_JSON=0
            RUN_PYTHON=0
            RUN_WHITESPACE=0
            if [ "$OPTARG" = "js" ]; then
                RUN_JS=1
            elif [ "$OPTARG" = "json" ]; then
                RUN_JSON=1
            elif [ "$OPTARG" = "python" ]; then
                RUN_PYTHON=1
            elif [ "$OPTARG" = "whitespace" ]; then
                RUN_WHITESPACE=1
            else
                echo "unrecognized test type $OPT_ARG" 2>&1
                exit 64
            fi
            ;;
        v)  VERBOSE=1
            ;;
    esac
done


FILES_PYTHON=$(find \
                   server/ \
                   bin/ \
                   test/test_simp_phone \
                   -name '*.py')
FILES_JS=$(find \
               client/ \
               bin/ \
               -name '*.js')
FILES_CSS=$(find \
                client/style/ \
                -name '*.less')
FILES_JSON=$(
    find package.json;
    find test/ client/ server/ -name '*.json';
    find test/ client/ server/ -name '*.json.example')

FILES_MARKDOWN="README.md"
FILES_TXT="requirements.txt"

if [ $RUN_JS = 1 ]
then
    echo "$FILES_JS" | while read file_js
    do
        if [ $VERBOSE = 1 ]; then
            echo "linting '$file_js'"
        fi
        ./node_modules/jshint/bin/jshint $file_js
    done
fi

if [ $RUN_JSON = 1 ]
then
    echo "$FILES_JSON" | while read file_json
    do
        if [ $VERBOSE = 1 ]; then
            echo "linting '$file_json'"
        fi
        ./node_modules/jsonlint/lib/cli.js -q $file_json
    done
fi

if [ $RUN_PYTHON = 1 ]
then
    echo "$FILES_PYTHON" | while read file_python
    do
        if [ $VERBOSE = 1 ]; then
            echo "linting '$file_python' for errors"
        fi
        pylint -E $file_python
    done
fi

if [ $RUN_WHITESPACE = 1 ]
then
    echo "$FILES_PYTHON
$FILES_JS
$FILES_CSS
$FILES_JSON
$FILES_MARKDOWN
$FILES_TXT" | \
        while read file_whitespace
        do
            if [ $VERBOSE = 1 ]; then
                echo "checking '$file_whitespace' whitespace"
            fi
            if grep -n '\s$' "$file_whitespace"
            then
                echo "*** found EOL space in $file_whitespace" 1>&2
            fi
            if grep -n -P "\t" "$file_whitespace"
            then
                echo "*** found tabs in $file_whitespace" 1>&2
            fi
        done
fi
