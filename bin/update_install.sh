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

EXPECTED_VERSION_PYTHON="3.6.1"

### python #

echo "checking python version.."
ACTUAL_VERSION="$(python --version | sed 's/Python //')"
if [ "$ACTUAL_VERSION" != "$EXPECTED_VERSION_PYTHON" ]
then
    echo "expecting python $EXPECTED_VERSION_PYTHON, " \
         "found $ACTUAL_VERSION" 1>&2
    exit 1
fi
echo "..ok"
echo "updating python packages"
PACKAGES_TO_UNINSTALL=$(pip freeze | grep -v -f requirements.txt -)
if [ "$PACKAGES_TO_UNINSTALL" != '' ]
then
    echo "$PACKAGES_TO_UNINSTALL" | \
        xargs pip uninstall -y
    if [ $? != 0 ]
    then
        echo "pip uninstall failed" 1>&2
        exit 2
    fi
fi
pip install -r requirements.txt
if [ $? != 0 ]
then
    echo "pip install failed" 1>&2
    exit 3
fi
pip freeze > .requirements-lock.txt

### node #

npm prune && npm install
if [ $? != 0 ]
then
    echo "npm install failed" 1>&2
    exit 2
fi
