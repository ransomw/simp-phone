## simp-phone

a simple phone for the browser

![the simpsons](doc/img/the_simpsons.gif)

##### RFC 7118

[SIP over WebSocket](https://tools.ietf.org/html/rfc7118)

##### Plivo

requires
[signup](https://manage.plivo.com/accounts/register/),
provides
[numbers](https://manage.plivo.com/number/)
and
[endpoints](https://manage.plivo.com/endpoint/).

application configuration in the Plivo web UI involves

* associating a SIP endpoint and phone number with an application

* setting the application's "Answer" and "Hangup" URLs to
  ```
  <server_url>/plivourls/answer?caller_id=<phone_number>&sip_username=<sip_username>
  ```
  and
  ```
  <server_url>/plivourls/hangup
  ```
  where `<server_url>` is a publicly visible URL that directs
  HTTP requests to this application's server
  (see [below](#run-server)).

login to the phone with **endpoint** username and password,
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
npm test
```

see `package.json` for additional `test:` scripts

##### build client

```
npm run build
```

see `package.json` for additional `build:` scripts

##### run server

```
./bin/run_server.py
```

pass `--help` flag for more options

----

### status

both incoming and outgoing calls are supported,
tho probably buggy.
and be further forewarned that the user interface is a nightmare.

it's recommended to deploy to a remote
_for Plivo callback URLs only_
— load the UI from a local dev server.

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
