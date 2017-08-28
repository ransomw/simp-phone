## simp-phone

a simple phone for the browser

##### RFC 7118

[SIP over WebSocket](https://tools.ietf.org/html/rfc7118)

##### Plivo

requires
[signup](https://manage.plivo.com/accounts/register/),
provides
[numbers](https://manage.plivo.com/number/)
and
[endpoints](https://manage.plivo.com/endpoint/).

login with **endpoint** username and password,
_not_ account creds.

----

be sure to

```
find test/ server/ client/ -type f -name '*.example'
```

and duplicate any placeholder credential files --- i.e.

```
cp <path>.example <path>
```

updating the file with valid login information for your account

----

### cli

```
. path/to/simp-phone/sh_src.sh
```

##### install

```
./bin/update_install.sh
```

##### lint

```
./bin/lint.sh
```

optionally, pass `-t <test_type>` parameter,
where `<test_type>` is one of
* `python`
* `js`
* `json`
* `whitespace`

also accepts verbose `-v` flag

##### test server

```
python -m unittest test_simp_phone
```

##### test client

```
./bin/test.js
```

##### build client

```
./bin/build_client.js
```

pass `--help` flag for more options

##### run server

```
./bin/run_server.py
```

pass `--help` flag for more options

----

### status

the application is currently pretty much unusable,
except it does make phone calls.
most of the (self-contained) messes in the codebase consist of
api sandboxes around
[jssip](http://jssip.net/documentation/3.0.x/api/)
and plivo "callback urls".
the question of how to test WebRTC's `MediaStream`s remains
unaddressed.

### thanks

lots of the goodness of the codebase's structure is due
to patterns practiced with
[Chad](https://github.com/cpalsulich)
and
[Emett](https://angel.co/emett-stone)
at Bargible.

(shouts also to
[Steven](https://angel.co/steven-lai-1)
and
[Drew](https://github.com/diffalot)
for their care and tending of the Bargible source).
