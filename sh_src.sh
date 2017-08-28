cd "$(dirname $BASH_SOURCE)"

export PYTHONPATH=$PYTHONPATH:server:test

which pyenv &> /dev/null
if [ $? = 0 ]; then
    pyenv activate simp-phone-00
fi

# nvm is a shell function, not an executable
type nvm &> /dev/null
if [ $? = 0 ]; then
    nvm use v8.3.0
fi
