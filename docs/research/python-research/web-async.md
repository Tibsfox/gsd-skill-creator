# Python Web Frameworks, Async Ecosystem, and Server-Side Story

A deep dive into the Python web stack — from CGI scripts in the 1990s to ASGI-powered async APIs in the 2020s. Python's web story is one of pragmatism, layered abstractions, and a long, painful migration from synchronous WSGI to asynchronous ASGI.

---

## 1. Django — The Batteries-Included Workhorse

- **Creators:** Adrian Holovaty and Simon Willison
- **Origin:** Lawrence Journal-World newspaper, Lawrence, Kansas
- **First public release:** July 2005 (open-sourced under BSD)
- **Named after:** Jazz guitarist Django Reinhardt
- **Tagline:** "The web framework for perfectionists with deadlines"
- **Current version:** Django 5.1 (August 2024), with 5.2 LTS in April 2025
- **License:** BSD-3-Clause

### Philosophy

Django embraced the **"batteries-included"** maxim. Where Ruby on Rails was contemporary in spirit (DRY, MVC, convention over configuration), Django shipped with everything a newspaper website needed out of the box: ORM, templating, form handling, authentication, sessions, internationalization, and most famously, the **Django admin interface** — an auto-generated CRUD backend derived from your models. The admin alone sold Django to thousands of organizations who would have otherwise built one by hand.

### The Stack

- **ORM:** Pythonic active-record-ish model layer with QuerySet lazy evaluation, supports PostgreSQL, MySQL, SQLite, Oracle.
- **Migrations:** Added in Django 1.7 (September 2014), replacing the third-party South. Auto-generated from model diffs.
- **Templates:** Django Template Language (DTL), restricted-by-design (no arbitrary Python in templates), with auto-escaping.
- **Admin:** `django.contrib.admin` — register a model, get a polished CRUD UI.
- **Forms:** Declarative form classes, validation, rendering.
- **URLs:** Regex/path-based URL dispatch via `urls.py`.
- **Class-Based Views (CBVs):** Added Django 1.3 (March 2011), generic views via mixins.
- **Auth:** `django.contrib.auth` — user model, permissions, sessions.
- **Channels:** ASGI/WebSocket layer (separate package, by Andrew Godwin), introduced 2016.
- **Async views:** Django 3.0 (December 2019) added `async def` view support; ORM async came piecemeal in 4.1+ (2022+).

### Django REST Framework (DRF)

- **Creator:** Tom Christie
- **First release:** 2011
- **Current:** DRF 3.15+ (2024)
- The de facto Django REST library. Serializers (analogous to forms but for JSON), ViewSets, routers, browsable API, token/JWT/OAuth auth, throttling, pagination. Practically synonymous with "Django API."

### Notable Users

- **Instagram** — see Section 12 below
- **Pinterest** — early Django adopter, eventually mixed in custom services
- **Disqus** — ran Django at huge scale on PostgreSQL
- **The Washington Post**, **The Guardian**, **NASA**, **Bitbucket** (originally), **Mozilla**, **Eventbrite**, **Spotify** (parts of)
- **National Geographic**, **Knight Foundation** journalism projects

---

## 2. Flask — The Microframework That Started as a Joke

- **Creator:** Armin Ronacher (also created Jinja2, Werkzeug, Click, MarkupSafe — the "Pallets Projects" suite)
- **Origin:** April 1, 2010 — released as an April Fool's joke (a "single-file framework" parody) that the community took seriously
- **First serious release:** Flask 0.1 in April 2010
- **Current version:** Flask 3.0 (September 2023), 3.1 (December 2024)
- **License:** BSD-3-Clause
- **Organization:** Pallets Projects

### Philosophy

The **microframework**: provide URL routing, request/response handling, and a templating integration — and nothing else. Want a database? Pick one. Want forms? Pick one. Want auth? Pick one. The result was an ecosystem of "Flask-X" extensions: Flask-SQLAlchemy, Flask-Login, Flask-Migrate, Flask-WTF, Flask-RESTful, Flask-Admin, Flask-CORS.

### Built On

- **Werkzeug** — the WSGI toolkit (also by Ronacher) that provides the Request/Response objects, routing, debugging middleware
- **Jinja2** — the template engine (also by Ronacher), now used far beyond Flask (Ansible, Salt, Sphinx, FastAPI docs)
- **MarkupSafe** — string escaping
- **ItsDangerous** — signed cookies/tokens
- **Click** — CLI building (used for `flask` command)

### Notable Users

- **Pinterest** (parts), **LinkedIn** (parts), **Netflix** (internal tooling), **Reddit** (originally was Pylons; uses Flask in places), **Lyft**, **Mozilla**, **MIT**, **Uber** (some services)

### Flask 2.0 (May 2021)

Added optional async views (`async def`) — but Flask is still WSGI under the hood, so async views run in a thread, defeating most async benefits. For real async, the world moved to FastAPI/Starlette/Quart.

---

## 3. FastAPI — The Modern Async API Framework

- **Creator:** Sebastián Ramírez (a.k.a. tiangolo, Colombian engineer based in Berlin)
- **First release:** December 5, 2018
- **Current version:** FastAPI 0.115+ (late 2024), still pre-1.0 but production-ubiquitous
- **License:** MIT
- **GitHub stars:** ~75K+ (one of the fastest-growing Python projects in history)

### Philosophy

FastAPI took three Python developments — **type hints** (PEP 484, 2014), **async/await** (PEP 492, 2015), and **Pydantic** (data validation via type hints) — and wove them into a framework where:

1. **Type hints ARE the interface contract.** Function signatures define request schemas, response schemas, query params, headers, and dependencies. No separate IDL.
2. **OpenAPI/Swagger is automatic.** From those same type hints, FastAPI generates `/docs` (Swagger UI) and `/redoc` (ReDoc) endpoints, plus a downloadable OpenAPI JSON schema.
3. **Async-native.** Built on Starlette, designed for `async def` from day one.
4. **Dependency injection** via `Depends()` — clean, testable, recursive.

### The Stack

- **Starlette** — the ASGI toolkit underneath (routing, middleware, websockets, background tasks)
- **Pydantic** — data validation and serialization (Pydantic v2 in 2023 was a major rewrite in Rust, ~5-50x faster)
- **Uvicorn** — the ASGI server typically used to run it
- **Type hints + automatic docs** — the killer feature

### Performance

FastAPI is one of the fastest Python frameworks, often cited in TechEmpower benchmarks at speeds approaching Node.js (Express/Fastify) and Go's net/http for typical JSON CRUD workloads. The bottleneck is rarely Python anymore — it's the database.

### Notable Users

- **Microsoft** (multiple internal tools, including parts of ML model serving)
- **Uber** (Ludwig ML platform)
- **Netflix** (Dispatch incident management)
- **Hugging Face** (model serving APIs, Inference API)
- **Explosion AI** (spaCy and Prodigy)
- **Cloudflare**, **Cisco**, **Quora** (parts)
- A vast majority of newer ML/AI inference APIs (OpenAI, Anthropic, et al. ship reference clients designed against FastAPI-style backends)

---

## 4. Starlette — The ASGI Foundation

- **Creator:** Tom Christie (also DRF, also Uvicorn, also HTTPX — Christie is a Python web godfather)
- **First release:** 2018
- **Current version:** Starlette 0.41+ (late 2024)
- **License:** BSD-3-Clause

Starlette is the lightweight ASGI framework that FastAPI is built on. It provides:

- ASGI-compliant request/response objects
- Routing (path-based, regex, mount sub-apps)
- Middleware (CORS, GZip, sessions, HTTPS redirect, trusted hosts)
- WebSocket support
- Background tasks
- Static files
- TestClient (built on HTTPX)

You can use Starlette directly without FastAPI for thinner, lower-level apps. FastAPI = Starlette + Pydantic + auto-docs + DI.

---

## 5. WSGI → ASGI: The Async Revolution

### WSGI — The Original Standard

- **PEP 333** — Python Web Server Gateway Interface, **December 2003**, by Phillip J. Eby
- **PEP 3333** — WSGI 1.0.1 update for Python 3, **September 2010**, by Phillip J. Eby
- A simple synchronous callable: `def app(environ, start_response): ...`
- Decoupled application code from server, enabling Apache mod_wsgi, Gunicorn, uWSGI, mod_python alternatives, etc.
- Every "real" Python web framework from 2003-2018 was WSGI-based: Django, Flask, Pyramid, Bottle, web2py, Pylons, TurboGears

### The Async Problem

WSGI was synchronous-only. One request = one thread (or one worker process). For long-polling, WebSockets, server-sent events, or thousands of concurrent slow connections, this scaled poorly. The Python ecosystem watched Node.js eat real-time use cases starting around 2010-2012.

### ASGI — Asynchronous Server Gateway Interface

- **Creator:** Andrew Godwin (also Django South, Django Migrations, Django Channels)
- **Origin:** Spec drafted around 2016 alongside Django Channels, formalized as ASGI 2.0 in 2018, ASGI 3.0 in late 2019
- **The protocol:** A three-part async callable `async def app(scope, receive, send): ...` where `scope` describes the connection, `receive` is an async callable for incoming events, `send` is an async callable for outgoing events
- **Supports:** HTTP, WebSockets, HTTP/2, server-push, long-polling — anything event-based
- **Servers:** Uvicorn, Daphne, Hypercorn

ASGI was the first Python web standard designed for `async def` from the ground up. FastAPI, Starlette, Quart, Django Channels, Litestar, Sanic, and modern Tornado all speak ASGI.

---

## 6. async/await — Python's Long Road to Native Async

### The Pre-History

- **Twisted** — 2002, by Glyph Lefkowitz. Event-driven networking, callback-based (Deferreds). Powerful, weird, ahead of its time. The Borg of Python async — assimilated email, IRC, HTTP, SMTP, SSH, DNS, etc. Still alive in 2026.
- **Tornado** — 2009, FriendFeed/Facebook. Single-threaded event loop, callbacks, then generators-as-coroutines. Used to power FriendFeed, then Facebook chat after the 2009 acquisition.
- **gevent** — 2009, by Denis Bilenko. Greenlet-based (monkey-patched stdlib), cooperative multitasking, lets sync code "go async" by patching socket. Used heavily by Pinterest, Instagram, others.
- **eventlet** — similar to gevent, used by OpenStack.

### The PEP March

- **PEP 342** (2005) — Coroutines via Enhanced Generators (`yield` as expression)
- **PEP 380** (2009) — `yield from` (Python 3.3, 2012)
- **PEP 3156** (2012) — Tulip / asyncio module proposal, Guido van Rossum
- **Python 3.4** (March 2014) — `asyncio` lands as provisional, with `@asyncio.coroutine` + `yield from`
- **PEP 492** (2015) — Coroutines with `async`/`await` syntax
- **Python 3.5** (September 2015) — **`async def` and `await` become first-class syntax**
- **PEP 525** (2016) — Async generators
- **PEP 530** (2016) — Async comprehensions
- **Python 3.6** (December 2016) — async generators land
- **Python 3.7** (June 2018) — `asyncio.run()`, contextvars, `async`/`await` become reserved keywords
- **Python 3.8** (October 2019) — `asyncio.run()` matured, asyncio REPL via `python -m asyncio`
- **Python 3.11** (October 2022) — TaskGroups, `except*`, exception groups, faster asyncio
- **Python 3.12+** — continued asyncio refinements, per-interpreter GIL groundwork

### asyncio Architecture

- **Event loop** — the heart, schedules tasks, runs callbacks, manages I/O via selectors (select/epoll/kqueue/IOCP)
- **Coroutines** — `async def` functions; calling them returns a coroutine object, awaiting drives them
- **Tasks** — wraps a coroutine and schedules it on the loop (`asyncio.create_task()`)
- **Futures** — low-level result containers; Tasks are Futures
- **Transports/Protocols** — low-level networking abstraction
- **Streams** — high-level reader/writer abstraction over transports

### Alternative Loops

- **uvloop** — 2016, Yury Selivanov, libuv-based asyncio loop (the same C library Node.js uses), 2-4x faster than default. Powers Uvicorn's "uvicorn[standard]" install.
- **trio** — 2017, Nathaniel J. Smith, alternative async library with **structured concurrency** (nurseries) that influenced PEP 654 and asyncio's TaskGroup. The "what asyncio should have been" for purists.
- **anyio** — 2018, Alex Grönholm, abstraction layer over both asyncio and trio. Used by Starlette/FastAPI internally so they work on either backend.
- **curio** — David Beazley, experimental, structured-concurrency, influence on trio.

---

## 7. Other Frameworks

### Tornado

- **Origin:** FriendFeed, 2009. Open-sourced after Facebook acquired FriendFeed in August 2009.
- **Current:** Tornado 6.4 (2024)
- Single-threaded event loop, originally used callbacks, later generators, now `async`/`await` interop with asyncio.
- Used to power Facebook real-time features (chat, notifications), Quora (originally), Disqus (parts), HubSpot.

### Bottle

- **Creator:** Marcel Hellkamp
- **First release:** 2009
- **Single-file** WSGI microframework, **no dependencies**. Literally one .py file. Used in embedded systems, scripts, prototypes.

### Pyramid

- **Origin:** Spin-out from repoze.bfg + Pylons project, 2010
- **Pylons Project** — umbrella organization (Chris McDonough, Ben Bangert, et al.)
- Flexible, configurable, **traversal-based** routing as well as URL-dispatch. Mozilla used it heavily for a while (MDN, Mozillians).

### Sanic

- **Origin:** 2016, Eli Stevens / Channelcat
- One of the first async Python web frameworks (uvloop-based) before ASGI was formalized. Flask-like API, async-native. Sanic 23+ supports ASGI.

### Litestar (formerly Starlite)

- **Origin:** 2021, originally "Starlite" — renamed Litestar in 2023 after Starlette objected
- **Current:** Litestar 2.x (2024)
- Async-native, type-hint-first, similar territory to FastAPI but with built-in batteries: stores, OpenAPI plugins, SQLAlchemy integration, message channels, dependency injection. Faster startup than FastAPI in many benchmarks.

### Quart

- **Creator:** Phil Jones
- An **async re-implementation of Flask's API** on ASGI. If you have a Flask app and want async without changing your mental model, Quart is the path. Joined the Pallets Projects in 2020.

### Other notables

- **web2py** — Massimo Di Pierro, full-stack, in-browser IDE
- **Falcon** — minimalist, REST-focused, very fast
- **Masonite** — Laravel-inspired full-stack
- **Robyn** — 2022, Rust-based, multi-threaded with Python bindings
- **BlackSheep** — 2018, async, ASGI, dependency injection

---

## 8. HTTP Clients

### requests — The Classic

- **Creator:** Kenneth Reitz
- **First release:** February 2011
- **Tagline:** "HTTP for Humans"
- **Current:** requests 2.32+ (2024)
- The most-downloaded Python package on PyPI for years. Replaced the painful `urllib2` with a humane API: `requests.get(url).json()`. Used by, essentially, everyone. Synchronous, sessions, cookies, multipart, OAuth, certs.
- **Maintenance:** Now maintained by the Python Software Foundation after Reitz stepped back.

### httpx — The Modern Successor

- **Creator:** Tom Christie (Encode org — also Starlette, Uvicorn, DRF)
- **First release:** 2019
- **Current:** httpx 0.27+ (2024)
- API-compatible-ish with `requests`, but **supports both sync AND async** (`httpx.Client` and `httpx.AsyncClient`). Built-in HTTP/2 support (via `h2`). The de facto modern HTTP client. Used internally by Starlette's TestClient and by countless FastAPI apps.

### aiohttp

- **Origin:** 2014, by Andrew Svetlov, Nikolay Kim et al.
- **Current:** aiohttp 3.10+ (2024)
- Both client AND server async HTTP library, built directly on asyncio. Pre-dates ASGI. The OG async HTTP for Python. Used by Home Assistant, Discord.py (older versions), many bots and crawlers.

### Other notables

- **urllib3** — the lower-level library `requests` is built on. By Andrey Petrov.
- **httplib2** — the predecessor to `requests`
- **treq** — Twisted-based, requests-like API
- **niquests** — fork of requests with async, HTTP/2, HTTP/3

---

## 9. Template Engines

### Jinja2

- **Creator:** Armin Ronacher
- **First release:** 2008 (Jinja 1 was earlier, 2007)
- **Current:** Jinja2 3.1+ (2024)
- Django-template-inspired but more powerful (real expressions, macros, inheritance, autoescape). The de facto standard outside Django: Flask default, FastAPI uses it for HTML responses, Ansible uses it for playbooks, Salt uses it for state files, Sphinx uses it, MkDocs uses it.

### Django Templates

- Built into Django, intentionally restricted. Block inheritance, tags, filters. No arbitrary Python (philosophical decision — designers/non-programmers should be safe authors).

### Mako

- **Creator:** Mike Bayer (also SQLAlchemy, also Alembic — another Python godfather)
- **Origin:** 2006
- More Python-like, embeds actual Python expressions. Faster than Jinja for many workloads. Used by Reddit (originally), Pylons/Pyramid default.

### Chameleon

- ZPT-style (Zope Page Templates), XML-based, very fast.

### Genshi

- XML/XHTML-based, used in Trac.

---

## 10. Servers

### WSGI Servers

- **Gunicorn** — "Green Unicorn", 2010, by Benoit Chesneau. Pre-fork worker model, simple, ubiquitous. The default deployment for Django/Flask in production. Inspired by Ruby's Unicorn.
- **uWSGI** — 2009, by Roberto De Ioris (Unbit). Insanely featured (cron, caching, queues, mules, emperor mode), C-based, fast. The kitchen sink WSGI server. Slowed development in recent years.
- **mod_wsgi** — Apache module, by Graham Dumpleton, the original "real" Python on Apache.
- **Werkzeug dev server** — built into Werkzeug/Flask, dev-only.
- **CherryPy** — both a framework AND a pure-Python WSGI server.
- **Waitress** — pure-Python WSGI server, by the Pylons team. Pyramid's default.
- **bjoern** — small, fast, libev-based, by Jonas Haag.

### ASGI Servers

- **Uvicorn** — 2017, by Tom Christie. Built on uvloop and httptools. The default ASGI server. `uvicorn[standard]` pulls in uvloop, httptools, websockets, watchfiles. Often run behind Gunicorn using `uvicorn.workers.UvicornWorker` to get pre-fork process management.
- **Daphne** — built by Andrew Godwin for Django Channels (2016). The first ASGI server. Pure-Python (Twisted-based).
- **Hypercorn** — by Phil Jones (also Quart). Supports HTTP/1, HTTP/2, HTTP/3, WebSockets. asyncio or trio backends. ASGI 2 and 3.
- **Granian** — 2022, Rust-based, by Giovanni Barillari (also emmett). Often faster than Uvicorn.

### Production Topology

The classic 2024 deployment: **Nginx (reverse proxy/TLS)** → **Gunicorn (process manager) running UvicornWorker** → **FastAPI app** → **PostgreSQL via async SQLAlchemy or asyncpg**. For Django: Nginx → Gunicorn → Django app → PostgreSQL.

---

## 11. ORMs

### SQLAlchemy — The Gold Standard

- **Creator:** Mike Bayer
- **First release:** February 2006
- **Current:** SQLAlchemy 2.0+ (January 2023, major rewrite)
- **License:** MIT
- Two layers:
  - **SQLAlchemy Core** — SQL expression language, schema, connection pool, transaction management. A "Pythonic SQL builder."
  - **SQLAlchemy ORM** — full identity-map, unit-of-work, lazy/eager loading, relationships, inheritance.
- **Alembic** (also Bayer) — the migration tool for SQLAlchemy, since 2012. Replaced sqlalchemy-migrate.
- **SQLAlchemy 2.0** — unified Core/ORM API, full type hint support, **native async via `AsyncSession`** (using greenlet bridge), `Mapped[]` typing.
- Used by basically everyone who isn't using Django ORM: Flask apps, FastAPI apps, OpenStack, Reddit (some), Yelp, Dropbox, Mozilla, Uber.

### Django ORM

- Bundled with Django since day one
- Active-record-ish, model-first, migrations via `makemigrations`/`migrate`
- Query API via `Model.objects.filter().exclude().annotate().values()`
- **Async support** — added incrementally in 4.1+ (2022), full async ORM in 4.2/5.0 (2023-2024)
- Less powerful than SQLAlchemy for complex SQL, but vastly more ergonomic for typical CRUD.

### Tortoise ORM

- **Origin:** 2018
- Async-first, Django-ORM-API-inspired, async/await native from day one. Popular in FastAPI shops before SQLAlchemy 2.0 brought solid async support.

### SQLModel

- **Creator:** Sebastián Ramírez (FastAPI's creator)
- **First release:** August 2021
- **Concept:** A thin wrapper that **combines SQLAlchemy + Pydantic into a single declarative model**. One class definition serves as both the database model AND the API schema. The "FastAPI-era ORM."

### Other notables

- **Peewee** — small, expressive ORM by Charles Leifer
- **Pony ORM** — uses Python generator expressions to build queries (clever)
- **encode/orm** — async ORM by Tom Christie, on top of SQLAlchemy Core, deprecated in favor of SQLAlchemy 2.0
- **GINO** — async, SQLAlchemy Core-based, deprecated
- **Piccolo** — async, with admin interface, modern type hints
- **edgedb-python** / **Gel** — async client for EdgeDB/Gel

### Database drivers (async)

- **asyncpg** — by Magic Stack (Yury Selivanov + crew). The fastest Python PostgreSQL driver, often beats Node.js drivers.
- **aiomysql, aiosqlite, aiomssql** — async drivers for other DBs
- **psycopg3** — major rewrite of psycopg2, with native async support

---

## 12. Instagram Case Study

Instagram is the canonical Python-at-scale story. Founded 2010 by Kevin Systrom and Mike Krieger. Acquired by Facebook in **April 2012** for $1B with 13 employees and ~30M users.

### The Stack (Throughout Its Life)

- **Web framework:** Django from day one. Has stayed Django.
- **Database:** PostgreSQL (originally on Amazon RDS, eventually massive sharded deployment), Cassandra for some workloads, RocksDB-backed caches, Memcached fleet.
- **Async/concurrent:** Originally gevent for I/O concurrency in production. Eventually moved to native async.
- **Web servers:** uWSGI for many years, then transitioned components.
- **Cache:** Memcached at extreme scale (hundreds of TBs).

### Scale Milestones

- 2012: 30M users, 13 employees
- 2015: 400M users
- 2018: 1B users
- 2024: 2B+ monthly active users
- All on Django + PostgreSQL at the core.

### The Python 3 Migration

- **Started:** 2017
- **Completed:** 2017-2018
- **Documented in:** PyCon 2017 talks by Hui Ding and Lisa Guo ("Python at Instagram")
- Instagram moved their entire codebase from Python 2 to Python 3 in months while continuing to ship features. One of the largest Python 3 migrations ever performed.

### Cinder — Instagram's Custom CPython Runtime

- **First public release:** May 2021 (open-sourced as a fork of CPython)
- **What it is:** Meta/Instagram's heavily-optimized fork of CPython 3.8 (and later 3.10/3.12)
- **Key features:**
  - **Static Python** — opt-in, gradually-typed, type-checked-at-compile-time variant that compiles to type-specialized bytecode (often 2-7x faster)
  - **Strict modules** — modules where top-level execution is fully analyzed at compile time
  - **Method-at-a-time JIT** — a custom JIT compiler for hot methods
  - **Immortal objects** — refcount tricks for shared, never-collected objects (later upstreamed as PEP 683 in Python 3.12)
  - **Shadow byte code** — type-specialization caches (influenced PEP 659 / Specializing Adaptive Interpreter in CPython 3.11)
- **Influence on CPython:** Many Cinder ideas have flowed upstream — immortal objects (3.12), the Specializing Adaptive Interpreter (3.11), the eventual JIT work (3.13+ experimental copy-and-patch JIT).
- **Why:** Instagram needed CPython to be faster without rewriting Django. Cinder is the answer, and the broader "Faster CPython" project led by Mark Shannon (Microsoft) shares DNA.

---

## 13. Task Queues — Background Jobs

### Celery

- **Creator:** Ask Solem Hoel
- **First release:** 2009
- **Current:** Celery 5.4+ (2024)
- The dominant Python distributed task queue. **Brokers:** Redis, RabbitMQ (originally and most production), Amazon SQS, others. **Result backends:** Redis, database, RPC.
- **Features:** delayed tasks, scheduled tasks (Celery Beat), retries, chords, chains, groups, canvas (workflow primitives), routing, priorities.
- **Used by:** Mozilla, Instagram, many Django shops. The "if you have Django, you have Celery" pattern.
- **Pain points:** Configuration complexity, debugging distributed failures, version compatibility quirks. The reason alternatives exist.

### RQ (Redis Queue)

- **Creator:** Vincent Driessen (also git-flow!)
- **First release:** 2011
- **Concept:** Simpler than Celery. Redis-only. Pickle-based. Workers are Python scripts. Great for small/medium projects that don't need Celery's complexity.

### Dramatiq

- **Creator:** Bogdan Popa
- **First release:** 2017
- **Concept:** "Celery done right" — simpler API, better defaults, RabbitMQ or Redis. Modern, well-typed, less surprise.

### Other notables

- **arq** — async Redis-based queue, by Samuel Colvin (Pydantic creator)
- **Huey** — by Charles Leifer (Peewee author), Redis or SQLite
- **TaskTiger** — Redis-based, by Closeio
- **Procrastinate** — PostgreSQL-based queue (uses LISTEN/NOTIFY), no Redis required
- **Faust** — Kafka-based stream processing, Robinhood
- **Temporal Python SDK** — durable workflow execution, modern alternative to Celery for complex flows

---

## 14. API Design

### REST: Django REST Framework (DRF)

- See Section 1. The de facto standard for Django-based REST APIs since 2011.

### REST: FastAPI

- See Section 3. Type-hint-driven, auto-OpenAPI, async-native. The dominant choice for new REST APIs in 2024+.

### REST: Other

- **Flask-RESTful**, **Flask-RESTX** — Flask extensions
- **Falcon** — minimalist, REST-only, low overhead
- **APIFlask** — Flask + marshmallow + OpenAPI
- **connexion** — OpenAPI-first (define OpenAPI YAML, generate handlers)

### GraphQL

- **Strawberry** — modern, type-hint-driven (FastAPI-spirit). Created by Patrick Arminio, 2018+. The de facto modern Python GraphQL choice.
- **Graphene** — older, the original Python GraphQL library, by Syrus Akbary. Used by GitHub's earlier Python tooling, often paired with Django via `graphene-django`. Less actively developed than Strawberry now.
- **Ariadne** — schema-first GraphQL (write SDL, bind resolvers). Mirumee Labs.

### gRPC

- **grpcio** — official Google Python gRPC library, supports both sync and async (`grpc.aio`)
- **betterproto** — pure-Python protobuf with dataclasses + asyncio, much nicer API than google's reference
- **Connect-Python** — Buf's Connect protocol, REST/gRPC bridge

### tRPC-style / RPC

- **fastapi-rpc** patterns, **JSON-RPC** via `jsonrpcserver`
- **msgspec** — by Jim Crist-Harif, fast schema-validated msgpack/JSON, used in some FastAPI alternatives

### WebSockets / Real-time

- **websockets** library — by Aymeric Augustin, the standard async websockets library
- **Channels** — Django's ASGI/websocket layer
- **socket.io** — `python-socketio` by Miguel Grinberg
- **Centrifugo** — popular real-time hub with Python clients

---

## Timeline (Compressed)

| Year | Event |
|------|-------|
| 2002 | Twisted released (Glyph Lefkowitz) — Python's first major async framework |
| 2003 | PEP 333 — WSGI (Phillip J. Eby) |
| 2005 | Django open-sourced (Holovaty + Willison) |
| 2006 | SQLAlchemy 0.1 (Mike Bayer) |
| 2008 | Jinja2 (Armin Ronacher) |
| 2009 | Tornado open-sourced (FriendFeed/Facebook); gevent; Celery |
| 2010 | Flask (Armin Ronacher, April 1); PEP 3333 (WSGI 1.0.1); Pyramid |
| 2011 | requests (Kenneth Reitz); Django REST Framework (Tom Christie) |
| 2012 | `yield from` in Python 3.3; Instagram acquired by Facebook |
| 2014 | asyncio lands in Python 3.4 (provisional); Django migrations native |
| 2015 | `async`/`await` syntax in Python 3.5 (PEP 492); aiohttp matures |
| 2016 | uvloop (Yury Selivanov); Django Channels (Andrew Godwin); ASGI drafted |
| 2017 | Uvicorn (Tom Christie); Cinder/Static Python work begins at Instagram; trio |
| 2018 | FastAPI (Sebastián Ramírez, December); Starlette (Tom Christie); ASGI 2.0 |
| 2019 | httpx (Encode); Pydantic momentum; Django 3.0 async views |
| 2020 | FastAPI explodes in popularity; Quart joins Pallets |
| 2021 | Cinder open-sourced; SQLModel (Sebastián Ramírez); Litestar/Starlite |
| 2022 | Python 3.11 — Faster CPython, asyncio TaskGroups; Django 4.1 async ORM |
| 2023 | SQLAlchemy 2.0 (unified, async-native); Pydantic v2 (Rust core) |
| 2024 | FastAPI ~75K stars; Django 5.0/5.1; Litestar 2.x; Granian gains traction |
| 2025+ | Python 3.13 experimental JIT; per-interpreter GIL maturing; async ecosystem stable |

---

## The Story in One Paragraph

Python's web story began with CGI scripts and `mod_python`, formalized with WSGI in 2003, and exploded in 2005-2010 with Django (full-stack) and Flask (microframework). For nearly fifteen years, the entire ecosystem was synchronous WSGI, with Twisted, Tornado, and gevent as the niche async outsiders. Python 3.5's native `async`/`await` syntax (2015) was the inflection point, but it took the **ASGI specification (Andrew Godwin, 2018)** and **FastAPI (Sebastián Ramírez, December 2018)** to give the async world a clear, ergonomic, type-hint-driven path forward. Today, the typical 2024+ Python web stack is **FastAPI + Pydantic v2 + SQLAlchemy 2.0 (async) + Uvicorn + PostgreSQL via asyncpg**, while Django remains the unstoppable workhorse for full-stack apps and Instagram (running custom Cinder/Static Python on Django) proves Python can scale to two billion users without abandoning its roots.

---

## Study Guide — Python Web & Async

### Frameworks

- **Django** — full-stack, batteries-included.
- **Flask** — microframework, Werkzeug-based.
- **FastAPI** — async, type-hints, OpenAPI.
- **Starlette** — FastAPI's underpinnings.
- **Litestar** — alternative to FastAPI.
- **Quart** — async Flask.

### Async primitives

- `async def`, `await`.
- `asyncio.gather`, `asyncio.create_task`.
- `async with`, `async for`.
- `asyncio.Queue`, `asyncio.Semaphore`.

---

## Programming Examples

### Example 1 — FastAPI hello world

```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
async def root():
    return {"hello": "world"}
```

Run with `uvicorn main:app --reload`.

### Example 2 — Async fan-out

```python
import asyncio, httpx

async def fetch(url, client):
    r = await client.get(url)
    return r.status_code

async def main():
    urls = ["https://example.com"] * 10
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*(fetch(u, client) for u in urls))
    print(results)

asyncio.run(main())
```

## DIY — Port a Flask app to FastAPI

Pick any Flask app. Port route by route. Add Pydantic
models. Observe the free OpenAPI docs.

## TRY — Build a websocket chat

FastAPI + Starlette's WebSocket + a dict of connections.
30 lines.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
