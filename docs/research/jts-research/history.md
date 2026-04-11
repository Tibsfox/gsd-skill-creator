# JavaScript and TypeScript: A History (1995–2025)

*Part of the PNW Research Series, www.tibsfox.com — a thirty-year arc of the language that ate 
the world.*

---

## 1. Origins (1995)

In the spring of 1995, Netscape Communications Corporation was in a hurry. The company was barely a 
year old, its flagship product Netscape Navigator was reshaping the public's experience of the 
internet, and its founders — Marc Andreessen and Jim Clark — saw clearly that the browser was 
becoming a platform, not just a document viewer. What a platform needs, above all, is a way for 
people to write programs for it. Java, released by Sun Microsystems in May 1995, was the obvious 
candidate, and in fact Netscape had already struck a deal with Sun to embed the Java Virtual 
Machine in Navigator 2.0. But Java was heavy. It required a compiler, a runtime, a plug-in 
installation process. It was aimed at what Sun called "professional component writers." Netscape 
wanted something lighter — something a designer could drop into an HTML page the way they dropped 
in an `<img>` tag. They called this the "glue language."

The person hired to build that glue language was Brendan Eich. Eich had joined Netscape in April 
1995 after stints at Silicon Graphics and MicroUnity, and he had been recruited specifically with a 
promise that he would get to implement "Scheme in the browser." Eich was a fan of Scheme — Gerald 
Sussman and Guy Steele's minimalist dialect of Lisp — and he had spent years thinking about how 
to bring its first-class functions and lexical closures to a mass audience. Within weeks of his 
arrival, though, Netscape management handed down a different directive. The language had to look 
like Java. Specifically, it had to look like Java enough that Sun's marketing department would let 
Netscape call it "Java's kid brother" without crying foul. Eich was given ten days in May 1995 to 
produce a working prototype.

Eich later described this period as the most intense sprint of his career. He wrote the first 
interpreter — a tree-walking evaluator of roughly a few thousand lines of C — in ten days and 
called it **Mocha**. Mocha debuted in a Netscape Navigator pre-release build at the end of May 
1995. It had first-class functions (the Scheme influence), a prototype-based object system (copied 
from Self, David Ungar and Randall Smith's experimental Smalltalk descendant at Sun Labs), C-like 
syntax (the Java influence), regular-expression-style string handling borrowed from AWK and Perl, 
an event model borrowed from Apple's HyperTalk, and exactly none of the type safety Java possessed. 
"I was recruited to Netscape with the promise of 'doing Scheme' in the browser," Eich said years 
later. "At least I got the first-class functions in."

In September 1995, Mocha was renamed **LiveScript** and shipped in the Netscape Navigator 2.0 beta. 
Three months later, in December 1995, a joint Netscape/Sun press release announced that LiveScript 
would henceforth be called **JavaScript**, under a trademark licensing agreement with Sun. The name 
change was pure marketing: Java was the hottest buzzword in the industry, and Netscape wanted to 
catch the wave. The two languages shared almost nothing beyond a C-derived syntax and a vague 
object orientation. Sun's Bill Joy negotiated the trademark terms: Netscape would license the name 
"JavaScript" and Sun would retain trademark ownership, a deal that has since passed through 
Oracle's 2010 acquisition of Sun. JavaScript 1.0 officially shipped in Netscape Navigator 2.0 on 
March 18, 1996.

Eich's stated influences, which he has repeated in many interviews and in his contributions to the 
HOPL-IV paper ("JavaScript: The First 20 Years," 2020, co-authored with Allen Wirfs-Brock), are 
worth listing because they explain nearly every quirk of the language:

- **Scheme** — for first-class functions, closures, garbage collection, tail calls (planned, 
long-deferred).
- **Self** — for the prototype-based object model (no classes, only objects that delegate to 
other objects).
- **Java** — for the C-style syntax and primitive types, plus `Math`, `Date`, `String` library 
shapes.
- **HyperTalk** — for the event-driven programming model (`onClick`, `onMouseOver`).
- **AWK** — for regex, `print`-style I/O, and loose typing.
- **Perl** — for string handling and `eval`.

The rush, the mandated Java-likeness, and the ten-day deadline gave JavaScript its famous early 
rough edges: `typeof null === "object"` (a bug that could never be fixed because too much code 
depended on it), automatic semicolon insertion, `==` vs `===` (type-coercing equality vs strict 
equality), `Date` modeled on `java.util.Date` (itself already deprecated in Java 1.0), implicit 
global variables when `var` was omitted, and the global `this` binding in function calls. Eich has 
acknowledged, graciously, that most of these would have been fixed if he had had three months 
instead of ten days. "I had to do it in ten days or something worse than JS would have happened," 
he told InfoWorld in 2008.

Netscape followed up quickly: JavaScript 1.1 in Navigator 3.0 (August 1996) added basic arrays and 
image object support, and JavaScript 1.2 in Navigator 4.0 (June 1997) added regular expressions, 
the `switch` statement, `do...while`, and — controversially — `==` behaviour changes that would 
later be reverted.

---

## 2. The browser wars and JScript (1996–2000)

Microsoft shipped Internet Explorer 3.0 in August 1996 with its own reverse-engineered JavaScript 
implementation, branded **JScript** to sidestep the Sun trademark. JScript was the work of a small 
team including Shon Katzenberger, Sam Ruby (later of Apache and Atom fame), and others; it was a 
clean-room implementation from the Netscape-published documentation and observed behaviour. Because 
Netscape's JavaScript had no formal specification yet, JScript was compatible in the average case 
and wildly incompatible in the corner cases — different handling of `for...in` enumeration order, 
different global-object semantics, different `Date` parsing, different regular expression handling. 
Microsoft simultaneously shipped VBScript in IE for server-side Active Server Pages (ASP) and DHTML 
pages, but JScript was the one intended for cross-browser authoring.

The period from 1996 through 2001 is remembered as the "DHTML era" or, less kindly, the 
"document.all years." Dynamic HTML — HTML pages that changed their content after loading without 
a server round-trip — was the hot technology, but Netscape and Microsoft implemented it in 
fundamentally incompatible ways. Netscape's DOM exposed layers via `document.layers[]` and 
positioned content with the proprietary `<layer>` element. Microsoft's DOM exposed everything via 
`document.all[]` and positioned content with CSS absolute positioning. Neither vendor would 
implement the other's API. A working cross-browser page required something like:

```javascript
if (document.layers) {
  // Netscape 4
} else if (document.all) {
  // IE 4+
} else if (document.getElementById) {
  // DOM Level 1, the promised land
}
```

This pattern — "browser sniffing" — became the fundamental pain of web development for the next 
seven years. Developers wrote two versions of everything. Entire books were devoted to 
cross-browser DHTML (Danny Goodman's *Dynamic HTML: The Definitive Reference*, O'Reilly 1998, ISBN 
978-1565924949, ran to over 1,400 pages). CSS was similarly fragmented: Netscape 4's CSS support 
was implemented by parsing CSS into a proprietary rendering tree that broke on any non-trivial 
stylesheet.

The browser war intensified through 1997–1998. IE 4.0 (October 1997) introduced the `innerHTML` 
property, `document.all`, and a more complete CSS implementation. Netscape 4.0 (June 1997) shipped 
with JavaScript 1.2 and the failed `<layer>` model. By 1999, IE had overtaken Navigator in market 
share, and in 2003, AOL — which had acquired Netscape in 1999 — disbanded the Netscape browser 
team entirely. The browser war was over, and Microsoft had won. IE 6.0 (August 2001) would dominate 
the web unchallenged until Firefox 1.0 (November 2004) began the slow recovery.

### Standardization at Ecma

Netscape and Microsoft recognized by late 1996 that a standard was urgently needed. They approached 
Ecma International — a Geneva-based standards body founded in 1961 as the European Computer 
Manufacturers Association, which had by the 1990s dropped the expansion and become just "Ecma 
International." Ecma chartered Technical Committee 39 (TC39) in November 1996 specifically to 
standardize JavaScript. The founding participants were Netscape, Sun, Microsoft, Borland, IBM, and 
a handful of others. Guy Steele — co-author of the Scheme specification and Java specification 
— was drafted in as the editor of the first edition, bringing his reputation for meticulous 
formal definition.

**ECMA-262 Edition 1** was ratified in June 1997. Steele gave the language its formal name, 
**ECMAScript**, partly because "JavaScript" was still a Sun trademark and partly because the 
committee could not politically agree on "JavaScript" or "JScript." Eich has said he has always 
found the name "ECMAScript" ugly — "it sounds like a skin disease." Edition 1 defined the core 
language in 172 pages — syntax, types, statements, `Object`, `Array`, `String`, `Number`, 
`Boolean`, `Date`, `Math`, `RegExp` — but did not define the DOM, which was left to the W3C's DOM 
specification effort.

**ECMA-262 Edition 2** (June 1998) was an editorial cleanup, aligning the text with ISO/IEC 16262. 
No new features.

**ECMA-262 Edition 3** (December 1999) was the first substantive revision. Waldemar Horwat, then at 
Netscape, took over as editor. ES3 added regular expressions (full Perl5-compatible syntax), better 
string handling (`String.prototype.split` with regex, `Array.prototype.push` returning length), 
`try`/`catch`/`finally`, formal errors (`TypeError`, `RangeError`, `SyntaxError`, `ReferenceError`, 
`EvalError`, `URIError`), the `in` and `instanceof` operators, `switch` statements with 
fall-through, and `do...while`. ES3 would turn out to be the stable baseline the web actually ran 
on for the next decade. When jQuery shipped in 2006, it was written to ES3. When JSON.org published 
its grammar in 2002, it was ES3-compatible. When Gmail launched in 2004, it was ES3. ES3 was, 
effectively, "JavaScript" for a generation of developers.

---

## 3. The lost years (1999–2005)

Work on **ECMAScript 4** began in 1999, almost before the ink on ES3 had dried. The effort was 
initially driven by Waldemar Horwat (Netscape/Mozilla) and later joined by a loose alliance that 
included Adobe — because ActionScript 3, the language powering Flash Player 9 and beyond, was 
being designed as an ES4 implementation. Adobe's acquisition of Macromedia in April 2005 made them 
a major TC39 stakeholder with a shipping implementation of something very close to ES4. The 
proposed ES4 was enormous in ambition: static classes with visibility modifiers (`public`, 
`private`, `protected`), interfaces, structural types, parameterized types (generics), packages and 
namespaces, optional type annotations, multimethods, generators, destructuring, `let` and `const` 
scoping, proper tail calls, a revised number tower with decimal arithmetic, iterators — the 
entire wish list of a language-design committee that had been waiting ten years.

The problem was political. Microsoft, represented on TC39 by Pratap Lakshman and later Allen 
Wirfs-Brock, had moved on from the browser. Internet Explorer 6 had shipped in August 2001, 
Microsoft had declared victory in the browser war, and the IE team had largely been disbanded by 
2003. Microsoft's Windows team viewed the web browser as a threat to the desktop, and an improved 
JavaScript would only strengthen that threat. Microsoft's official position within TC39, 
articulated most sharply by Chris Wilson and later Allen Wirfs-Brock, was that ES4 was too large, 
too incompatible with existing content, and impossible to implement without breaking the web. Yahoo 
— in the person of Douglas Crockford, who joined Yahoo in 2002 as a JavaScript architect — took 
the same position. Crockford argued forcefully and publicly that ES4 was a "kitchen sink" that 
would fracture the web. The dispute became personal and bitter. Brendan Eich, who by this point was 
Mozilla's CTO and the most vocal ES4 proponent, would later call the episode "the worst experience 
of my technical life."

### Crockford's counter-narrative

While ES4 stalled, Crockford spent the lost years evangelizing a disciplined subset of ES3 and 
building tools to enforce it. He released **JSLint** in 2002 — the first widely-used JavaScript 
code-quality tool — and published **JSMin** in 2003, a minimizer that removed whitespace and 
comments. He gave a series of talks at Yahoo that were recorded and published on YUI Theater, 
becoming among the most-watched developer lectures of the pre-YouTube era. He published 
*JavaScript: The Good Parts* (O'Reilly, May 2008, ISBN 978-0596517748), a famously thin book — 
176 pages — that argued JavaScript contained a beautiful functional language buried under a pile 
of mistakes. "JavaScript is Lisp in C's clothing," Crockford wrote, and the line became a meme. The 
book's cover — a small, elegant butterfly — was intentionally contrasted with the O'Reilly 
*JavaScript: The Definitive Guide* (David Flanagan, then in its 5th edition, ISBN 978-0596101992), 
which ran to nearly 1,000 pages.

Crockford also invented **JSON** (JavaScript Object Notation) as a tiny data interchange format. He 
registered the json.org domain in 2002 and published the grammar on a single HTML page that has 
barely changed since. JSON began life simply as the subset of JavaScript object literals that could 
be safely `eval()`'d as data — no functions, no `undefined`, no single quotes, no trailing 
commas, keys always double-quoted. By 2006 it was an IETF RFC (RFC 4627, Crockford as author; 
updated as RFC 7159 in 2014, then RFC 8259 in 2017). By 2013 it was also an ECMA standard 
(ECMA-404). JSON would become the single most successful thing to come out of JavaScript's first 
fifteen years, arguably more successful than JavaScript itself during that period — every 
programming language, database, API, and configuration file format now speaks JSON.

### ES4's death

In August 2008, at an Oslo TC39 meeting, Eich and the ES4 faction agreed to abandon the spec. The 
announcement, made on the es-discuss mailing list, read in part: "It's no secret that the 
JavaScript standards body, Ecma's Technical Committee 39, has been split for over a year, and that 
the time and energy of its members have been absorbed by a political conflict rather than any 
progress on the work." The plan was to harvest what everyone could agree on from ES4 into a 
smaller, more conservative release — later named ES3.1, and eventually ratified as **ECMAScript 
5**. The large ambitions would be pushed into an open-ended project then called **"Harmony"** — 
which, seven years later, would ship as ES6.

The "lost years" were not entirely lost, of course. They were the period in which the web matured 
from a document medium to an application platform — just without any help from the standards 
body. Developers built increasingly complex applications in ES3 using patterns the language was 
never designed for: constructor functions as classes, closure-based privacy, prototype chain 
manipulation for inheritance, `eval()`-based template systems, and `setTimeout(0)` as a "yield to 
the event loop" hack. This ingenuity-born-of-constraint would shape the language's future: when ES6 
finally added classes, modules, and promises, the designs reflected not the academic ideals of ES4 
but the battle-tested patterns that ES3-era developers had already invented.

---

## 4. AJAX and the rebirth (2005)

On February 18, 2005, Jesse James Garrett of Adaptive Path published an essay titled *"Ajax: A New 
Approach to Web Applications"*. It coined the acronym **AJAX** — "Asynchronous JavaScript and 
XML" — to describe a pattern already visible in Google's new products: Gmail (launched April 1, 
2004) and Google Maps (launched February 8, 2005, ten days before Garrett's essay). Both used the 
`XMLHttpRequest` API to fetch data from the server in the background and rewrite parts of the page 
without reloading. Garrett's essay gave the technique a name and a mythology, and overnight the 
web-development world started paying attention to JavaScript again.

`XMLHttpRequest` was older than most people realized. Microsoft had shipped it in Internet Explorer 
5.0 in March 1999 as an `ActiveXObject("Microsoft.XMLHTTP")`, originally built by Alex Hopmann for 
the Outlook Web Access team so that corporate email could update without reloading. Mozilla adopted 
a native `XMLHttpRequest` constructor in 2002 for Mozilla 1.0, Safari followed in 2004, and Opera 
in 2005. By the time Garrett coined the term, every major browser supported it, though with subtle 
differences that the first AJAX libraries had to paper over.

Google's use of the pattern was the proof of concept. Gmail — which stored emails in the browser, 
handled search without page reloads, and offered keyboard shortcuts — felt more like a desktop 
email client than a web page. Google Maps — which let users drag a continuous map surface rather 
than clicking through tiles — was even more dramatic. Both demonstrated that JavaScript 
applications could rival desktop applications in responsiveness if the developer was willing to do 
the work. Google Suggest (September 2004), which showed search suggestions as you typed, added a 
third example. Together they demolished the conventional wisdom that JavaScript was a toy language.

### The first library wave (2005–2006)

The first generation of AJAX libraries arrived rapidly:

- **Prototype.js** (Sam Stephenson, 2005) — extended native prototypes (`String`, `Array`, 
`Element`) with Ruby-inspired conveniences like `$()` (element by ID) and `$$()` (CSS selector). 
Shipped with Ruby on Rails from Rails 1.0, making it the default JS library for a generation of 
Rails developers.
- **script.aculo.us** (Thomas Fuchs, 2005) — effects, drag-and-drop, and animation on top of 
Prototype. Provided `Effect.Fade`, `Effect.SlideDown`, and similar named transitions.
- **Dojo Toolkit** (Alex Russell, Dylan Schiemann, David Schontzler, and others, 2004–2005) — a 
comprehensive widget library with a module loader, data abstraction, charting, and i18n. Closer in 
spirit to Java Swing than to the DOM. IBM backed Dojo commercially and used it in products like 
Lotus Notes.
- **MooTools** (Valerio Proietti, 2006) — another Prototype-style extension library, with a more 
disciplined class system influenced by Java.
- **YUI** — Yahoo User Interface Library (Thomas Sha, Nate Koechley, and Dan Theurer, 2006) — 
the library Douglas Crockford led from Yahoo's end, released under a BSD license. YUI included 
grids, data tables, rich-text editors, and an event system. YUI 3 (2009) was a significant rewrite; 
Yahoo discontinued YUI in 2014.
- **Ext JS** (Jack Slocum, 2007) — evolved from a Yahoo UI extension into a standalone component 
framework; later became Sencha, a commercial product.

### jQuery (2006)

And then, on **August 26, 2006**, at BarCamp NYC, a 22-year-old named **John Resig** — then a 
developer at Mozilla — announced **jQuery 1.0**. Resig had been working on it since January, 
publishing a blog post on January 14, 2006 titled "jQuery: New Wave JavaScript." jQuery's 
contribution was philosophical as much as technical: instead of extending native prototypes (the 
Prototype.js approach, which led to conflicts with future standards) or providing a comprehensive 
framework (Dojo, YUI), jQuery offered a single function — `$` — that wrapped one or more DOM 
elements in a chainable object. "Write less, do more" was the slogan.

jQuery's technical innovations:

- **Sizzle**, its selector engine (extracted as a separate library in 2008), supported CSS3 
selectors long before browsers did — `:not`, `:nth-child`, attribute selectors, and combinators.
- **`.animate()`** made smooth animations trivial: `$('#box').animate({ opacity: 0.5, left: '100px' 
}, 1000)`.
- **`.ajax()`** made `XMLHttpRequest` usable: `$.ajax({ url: '/api', success: fn })`.
- **`.on()`** (originally `.bind()`, then `.live()`, then `.delegate()`, finally `.on()` in 1.7) 
unified event handling across the zoo of browser event models.
- Above all, it hid the differences between IE6, IE7, Firefox 2, Safari 3, and Opera 9 behind one 
uniform API.

jQuery's adoption was explosive. By 2009 it had overtaken Prototype, by 2011 it was on more than 
half of the top 10,000 websites, and by its peak in 2013 it was used on over 60% of the top million 
sites. It was bundled with WordPress (2008), with Ruby on Rails (replacing Prototype, 2011), and 
with Microsoft's ASP.NET MVC (2009) — a remarkable move for Microsoft, which had historically 
shipped only its own libraries. The jQuery Foundation (later merged into the OpenJS Foundation) 
maintained the project as a community-driven effort. Resig left Mozilla for Khan Academy in 2011 
and handed jQuery over to a team of volunteers led by Dave Methvin, and later Timmy Willison. 
jQuery 3.0 (June 2016) removed IE8 support. The library is still maintained in 2025 — jQuery 
3.7.1 is current — though its relevance has declined as native DOM APIs 
(`document.querySelectorAll`, `fetch`, `classList`, `addEventListener`) caught up with what jQuery 
offered. The jQuery UI and jQuery Mobile spinoffs, once significant, are effectively unmaintained.

---

## 5. ECMAScript 5 (December 2009)

With ES4 shelved, TC39 turned to a much smaller release. The effort was initially called ES3.1 to 
signal its modest ambitions. Waldemar Horwat and Allen Wirfs-Brock co-edited. Wirfs-Brock, formerly 
a Smalltalk implementer at Instantiations and Tektronix and now at Microsoft, brought a meticulous 
formalist's attention to the specification text — he would go on to serve as the primary editor 
through ES6. ES5 was approved as **ECMA-262 Edition 5** on December 3, 2009. A follow-on 
maintenance release, **ES5.1**, was approved in June 2011 and published as **ISO/IEC 16262:2011**.

ES5's contributions were not glamorous but they were load-bearing. In rough order of impact:

- **Strict mode** (`"use strict";` at the top of a file or function). Strict mode turned silent 
errors into thrown errors: assigning to an undeclared variable, duplicating parameter names, using 
`with`, octal literals, and `delete` on an unqualified identifier all became errors. It also 
reserved words for future use (`let`, `yield`, `implements`, etc.) and fixed the `this` binding in 
non-method function calls to `undefined` rather than the global object. Eich described strict mode 
as "the compatibility fig leaf" that allowed the language to evolve without breaking old pages.
- **JSON.parse / JSON.stringify** — standardized Crockford's JSON handling natively, replacing 
library polyfills like `json2.js`.
- **Array extras** — `map`, `filter`, `reduce`, `reduceRight`, `forEach`, `every`, `some`, 
`indexOf`, `lastIndexOf`. These had been on `Array.prototype` in Firefox (with Mozilla-specific 
extensions) since 2005's JavaScript 1.6; ES5 standardized them across all engines.
- **`Object.create`** — a prototype-based alternative to `new` that exposed the underlying 
prototype model directly, letting developers create objects without constructors.
- **Property descriptors** — `Object.defineProperty`, `Object.getOwnPropertyDescriptor`, 
`Object.getOwnPropertyNames`, `writable`, `enumerable`, `configurable`. For the first time, objects 
could be frozen (`Object.freeze`), sealed (`Object.seal`), or made non-extensible 
(`Object.preventExtensions`).
- **Getters and setters** in object literal syntax (`get foo() { ... }`, `set foo(v) { ... }`).
- **`Function.prototype.bind`** — no more `var self = this;` in closures.
- **`Array.isArray`** — ends the `Object.prototype.toString.call(x) === "[object Array]"` ritual.
- **`String.prototype.trim`** — finally, native whitespace trimming.

ES5 was the first ECMAScript edition to be widely and quickly adopted by every major browser. IE9 
(March 2011) was the last to arrive, and from that point on, every production browser implemented 
ES5. The language was once again in a coherent place, and the infrastructure for real applications 
— JSON, higher-order array methods, object freezing, strict mode — was now standardized rather 
than polyfilled.

---

## 6. Node.js and the server-side revolution (2009)

On **November 8, 2009**, a 28-year-old engineer named **Ryan Dahl** walked onto a small stage at 
JSConf EU in Berlin and delivered a forty-five-minute talk titled "Node.js". He had been working on 
it for about eight months, initially alone, on his laptop. The idea came from his frustration with 
how existing web servers handled I/O. Apache and its kin allocated a thread per request, and 
threads were expensive in both memory and context-switching time. Event-driven servers like nginx 
existed but used callbacks in languages (C, Perl) with cumbersome callback ergonomics. JavaScript, 
Dahl realized, had been callback-shaped from the beginning — the browser event loop practically 
demanded it — and Google's new V8 engine, open-sourced in September 2008 with Chrome, was the 
fastest JavaScript implementation ever built. V8 was the work of a team led by Lars Bak, who had 
previously built the Java HotSpot VM and the Self VM. Pair V8 with a non-blocking I/O library — 
**libuv**, Dahl's own abstraction over `epoll` on Linux, `kqueue` on BSD/macOS, and IOCP on Windows 
— and you had a server runtime where every syscall was async by default and callbacks were the 
native idiom.

Dahl's JSConf EU talk ended with a live demo of a 2-line HTTP server handling thousands of 
concurrent connections. The room gave him a standing ovation — one of the few standing ovations 
in the history of developer conferences. Within months Node.js was the most-starred repository on 
GitHub.

The architectural choices of Node.js that are now taken for granted:

- **Single-threaded event loop** — all JavaScript executes on one thread; I/O is handled by a 
thread pool inside libuv and signaled back via callbacks. This eliminated the entire class of 
shared-state concurrency bugs (deadlocks, race conditions) at the cost of being CPU-bound on a 
single core.
- **CommonJS modules** — `require` and `module.exports`, derived from the CommonJS specification 
(Kevin Dangoor, 2009). Node did not invent CommonJS but it made the spec real.
- **`package.json`** — the manifest file Node inherited from CommonJS and refined, now the 
universal metadata format for JavaScript projects.
- **Non-blocking core library** — `fs`, `net`, `http`, `dns`, `crypto`, all async by default, 
with synchronous variants available but discouraged.
- **Callback convention** — `function(err, result)` as the universal async API shape, the 
"error-first callback" pattern.

### npm and the package ecosystem

In January 2010, **Isaac Z. Schlueter** — later to become Node's second BDFL — released 
**npm**, the Node Package Manager, initially as a small side project. npm's `node_modules/` 
directory and recursive dependency installation strategy was novel: each package got its own copy 
of its dependencies, avoiding the "DLL hell" of shared libraries. By 2011 npm was bundled with 
Node. By 2015 it was the largest package registry in the world, surpassing Maven Central, PyPI, and 
RubyGems. By 2020 it hosted over 1.5 million packages. The small-modules philosophy — exemplified 
by packages like `left-pad` (11 lines), `is-even` (which depended on `is-odd`, which depended on 
`is-number`), and `is-promise` (1 line) — became both a strength and a punchline.

The **left-pad incident** of March 2016 exposed the fragility: Azer Koçulu unpublished his 
`left-pad` package from npm after a trademark dispute, and thousands of builds worldwide broke 
instantly, including React and Babel. npm Inc. reversed the unpublishing, set new unpublish 
policies, and the incident sparked a broader conversation about supply-chain security that 
continues to this day.

Schlueter co-founded npm Inc. to host the registry commercially; npm Inc. was acquired by GitHub 
(Microsoft) in April 2020. Alternative registries and clients emerged: **Yarn** (Facebook, October 
2016, created by Sebastian McKenzie and Christoph Nakazawa) introduced lockfiles, deterministic 
installs, and workspaces. **pnpm** (Zoltan Kochan, 2017) used hard-linking to avoid the disk-space 
waste of duplicated `node_modules`.

### Express and the middleware model

**Express.js**, the canonical Node web framework, was released by **TJ Holowaychuk** in June 2010. 
Express provided routing, middleware stacking, view rendering — a minimalist Sinatra-like shape 
that would dominate Node web development for the next decade. Holowaychuk would go on to publish 
hundreds of npm packages (the exact count depends on who you ask but it is widely cited as over 
500) and became something of a folk hero in the Node community before largely stepping away from 
JavaScript around 2014 with a widely-read farewell blog post, "Farewell Node.js," in which he moved 
to Go. He later founded Apex, a serverless framework.

Holowaychuk also created **Mocha** (2011) — the test framework that established describe/it 
BDD-style testing in Node — and **Jade** (2010, later renamed **Pug**), a whitespace-significant 
HTML template engine.

### Governance crises and the Node.js Foundation

**Joyent**, a San Francisco cloud infrastructure company, hired Dahl in 2010 and took on the 
trademark and governance of Node.js. This corporate stewardship was comfortable until late 2014, 
when a group of prominent contributors — Fedor Indutny, Bert Belder, Trevor Norris, Rod Vagg, and 
others — forked Node over disagreements about release cadence, governance transparency, and the 
speed of V8 upgrades, producing **io.js**. io.js moved faster and tracked the V8 release train more 
aggressively. In September 2015 the two projects reconciled under the newly formed **Node.js 
Foundation** (later merged into the **OpenJS Foundation** in March 2019), and Node.js 4.0 — the 
first post-merge release — shipped with the io.js codebase and V8 4.5.

From 2015 onward, Node.js's release cadence became predictable: even-numbered major releases (4, 6, 
8, 10, 12, 14, 16, 18, 20, 22) receive Long Term Support (18 months active + 12 months 
maintenance); odd-numbered releases are short-lived current releases. As of 2025, Node.js 22 is the 
current LTS and Node.js 23 is current.

Ryan Dahl left Node.js in January 2012. His farewell message was characteristically brief: "I'm 
changing my focus slightly and will not be working on Node.js anymore." He would return to the 
runtime world six years later with Deno.

---

## 7. TypeScript's birth (2012)

**Anders Hejlsberg** is one of the most consequential language designers in the history of personal 
computing. Born in Denmark in 1960, he joined Borland in 1983 and was the lead architect of **Turbo 
Pascal** (1983) — the compiler so fast that it redefined developer expectations for compile times 
— then **Delphi** (1995) — the Object Pascal RAD environment that dominated Windows desktop 
development in the late 1990s — and then at Microsoft the lead architect of **C#** (2000) and the 
**.NET Common Language Runtime**. By the late 2000s, Hejlsberg had been the uncontested 
language-design authority inside Microsoft for a decade. C# had reached version 4 and was admired 
even by people outside the Microsoft stack.

In 2010 Hejlsberg turned his attention to JavaScript. Microsoft had a problem: some of its largest 
client applications — the web version of Microsoft Office (later Office 365), the Azure 
management portal, Bing Maps, and much of Visual Studio — were being built in JavaScript, and at 
the multi-hundred-thousand-line scale, the language's loose typing was a liability. Refactoring was 
dangerous without type information, autocomplete was unreliable, and bugs that a compiler would 
have caught slipped through to production. A small skunkworks team inside Microsoft, led by 
Hejlsberg and including Steve Lucco, Luke Hoban, and Daniel Rosenwasser, began working on a 
compile-to-JavaScript language that would add optional static typing without breaking 
compatibility. The project was internally named **Strada**.

On **October 1, 2012**, Microsoft publicly announced **TypeScript 0.8**. The launch blog post, 
written by S. Somasegar (then corporate VP of the developer division), framed TypeScript as "a 
language for application-scale JavaScript development." A thirty-minute video interview with 
Hejlsberg on Channel 9 explained the design philosophy. TypeScript was to be a strict superset of 
JavaScript — any valid JavaScript was valid TypeScript — and the compiler would emit plain ES3 
or ES5. Types were optional, erased at compile time, and structural rather than nominal. A `Point` 
was any object with an `x: number` and a `y: number`, regardless of its declared class or 
constructor. Hejlsberg explained the structural choice as essential to gradual adoption: "If we had 
made the type system nominal, you would have had to change your existing code to fit into it. 
Structural types fit around your code."

### Slow adoption, then the Angular pivot

Adoption was slow for the first three years. TypeScript 1.0 shipped in April 2014 alongside Visual 
Studio 2013 Update 2. The JavaScript community at the time was enamored with CoffeeScript and later 
Babel, and Microsoft's reputation among front-end developers was at its nadir — memories of the 
IE6 monoculture were still raw. Google had been developing its own type-annotation project, 
**AtScript**, for Angular 2. Facebook had created **Flow** (announced November 2014), another 
JavaScript type checker with similar goals to TypeScript but using a different design approach.

The turning point came in **March 2015**, when **Google's Angular team**, led by Miško Hevery and 
Brad Green, publicly announced that **Angular 2** would be rewritten in TypeScript, abandoning 
AtScript entirely. The decision was negotiated at a joint Microsoft/Google meeting in early 2015; 
TypeScript 1.5 incorporated ES6 decorator syntax specifically to meet Angular's requirements. 
Angular 2 shipped in September 2016 and took TypeScript with it into the mainstream. Flow, 
meanwhile, gradually declined as Facebook itself migrated internal projects to TypeScript around 
2022–2023.

From 2016 onward TypeScript adoption accelerated sharply. **VS Code**, itself written in TypeScript 
and shipped by Microsoft in April 2015 (general availability April 2016), made TypeScript editing a 
first-class experience across every OS. React projects started adding TypeScript around 2018 
(DefinitelyTyped, the community-maintained type declaration repository started by Boris Yankov in 
2012, had been growing steadily and now includes over 8,000 packages). By 2020, TypeScript was 
consistently ranked in the top three most-loved languages in the Stack Overflow Developer Survey, 
and by 2023 the State of JS survey reported that more JavaScript developers were writing in 
TypeScript than in plain JavaScript.

### TypeScript milestones

TypeScript's release cadence is regular: a new minor version roughly every three months. Selected 
milestones:

- **1.0** (April 2014) — generics, modules, the first stable release.
- **1.5** (July 2015) — ES6 modules, decorators.
- **2.0** (September 2016) — non-nullable types, control-flow analysis, tagged union types 
(discriminated unions).
- **2.1** (December 2016) — mapped types and `keyof`, the foundation of all future type-level 
programming.
- **2.8** (March 2018) — conditional types (`T extends U ? X : Y`), the beginning of type-level 
computation.
- **3.0** (July 2018) — tuples in rest parameters, `unknown` type, project references.
- **3.7** (November 2019) — optional chaining and nullish coalescing (aligned with TC39 ES2020).
- **4.0** (August 2020) — variadic tuple types, labeled tuple elements.
- **4.1** (November 2020) — template literal types, the turning point that made the type system 
demonstrably Turing-complete.
- **4.9** (November 2022) — `satisfies` operator, a long-requested feature for constraining 
values without widening types.
- **5.0** (March 2023) — decorators finalized (after a seven-year wait for TC39 Stage 3), `const` 
type parameters.
- **5.4** (2024) — `NoInfer` utility type, improved narrowing.

Hejlsberg remained the lead architect through 2024. In March 2024 he announced that Daniel 
Rosenwasser would take over day-to-day architecture while Hejlsberg continued as "Technical 
Fellow." In March 2025 Microsoft announced a port of the TypeScript compiler itself to **Go** — a 
ten-times-faster native implementation — led by Hejlsberg personally. This ended a long-running 
debate about whether TypeScript should remain self-hosted (written in TypeScript, compiled to 
JavaScript, run on Node) or be rewritten in a lower-level language. Hejlsberg chose Go, he said, 
because "we wanted something that compiles to native code, has good concurrency primitives, and is 
easy to port the existing codebase to." The Go-based compiler, codenamed **tsgo**, was announced as 
shipping in TypeScript 7.0.

---

## 8. ECMAScript 6 / ES2015 (June 2015)

**ECMA-262 Edition 6**, approved on **June 17, 2015** and universally known as **ES6** or 
**ES2015**, was the largest single update to JavaScript in its history and the first to 
meaningfully incorporate the ambitions that had died with ES4. Allen Wirfs-Brock was the editor; he 
would describe the six-year editing process as "the most intellectually challenging project of my 
career." Preparation took from 2009 to 2015 — the Harmony project, chartered after the ES4 
collapse in 2008, had finally delivered.

ES6's feature list is a rollcall of features borrowed from Python, Ruby, CoffeeScript, Scheme, 
ActionScript, and the shelved ES4 draft itself:

- **`let` and `const`** — block-scoped variable and constant declarations, ending the reign of 
`var` and its function-level hoisting quirks. `let` in a `for` loop finally gave each iteration its 
own binding — a fix for the most common closure bug in JavaScript.
- **Arrow functions** — `x => x * 2`, with lexical `this` binding (no more `var self = this`). 
Borrowed conceptually from CoffeeScript's `=>` and C#'s lambdas.
- **Classes** — sugar over the existing prototype model, but with real syntactic support for 
constructors, inheritance (`extends`), `super` calls, static methods, and computed property names. 
The committee deliberately did not add private fields or decorators — those came later.
- **Template literals** — backtick-delimited strings with embedded `${expression}` interpolation 
and tagged template support for DSLs.
- **Destructuring** — `const { x, y } = point;` and `const [first, ...rest] = list;`, with 
defaults and nesting.
- **Default parameters** and **rest/spread** — `function f(x, y = 1, ...rest) {}` and 
`f(...args)`.
- **Promises** — native `Promise` constructor, `.then/.catch`, `Promise.all`, `Promise.race`. 
Borrowed from the **Promises/A+** community specification that had coalesced around libraries like 
Q (Kris Kowal), Bluebird (Petka Antonov), and RSVP.js.
- **`Map`, `Set`, `WeakMap`, `WeakSet`** — real hash-map and hash-set data structures, not the 
string-keyed object abuse that had preceded them.
- **Symbols** — unique primitive values used for non-string property keys, and the foundation of 
the iteration protocol (`Symbol.iterator`) and later extension points (`Symbol.toPrimitive`, 
`Symbol.hasInstance`).
- **Iterators and generators** — the `Iterator` protocol (any object with a `next()` method 
returning `{ value, done }`) and `function*` generator syntax, enabling `for...of` loops and lazy 
sequences. Generators came from Python 2.5's PEP 255 and PEP 342.
- **ES Modules** — `import` and `export` statements, static analysis, cyclic dependency handling. 
Design champions: Dave Herman (Mozilla) and Sam Tobin-Hochstadt (Northeastern, later Indiana 
University).
- **`Proxy` and `Reflect`** — metaprogramming primitives for intercepting object operations, 
replacing the nonstandard `__noSuchMethod__` from SpiderMonkey.
- **`for...of` loops** — iterating over any iterable, replacing `for...in` for arrays.
- **`Array.from`**, **`Array.of`**, **`Object.assign`**, **`String.startsWith/endsWith/includes`**, 
**`Number.isNaN`** (replacing the broken global `isNaN`), and many other utility additions.

ES6 was so large that TC39 immediately made two resolutions. First, that it would be the last "big 
bang" release. Second, that the committee would switch to an **annual release cadence** beginning 
in 2016. Every June from that point forward, TC39 would publish whatever had reached Stage 4 of the 
new process, no matter how small. The annual cadence, modeled loosely on the Rust release train, 
has held without deviation from 2016 through 2025 and is widely credited with ending the "lost 
decade" pattern of irregular large releases.

---

## 9. The modern cadence (ES2016 onwards)

From 2016 the language has evolved year by year. Each release is small — often only a handful of 
features — and each release ships across browsers, Node, and TypeScript with minimal delay.

**ES2016** (June 2016). Editor: Brian Terlson (Microsoft). Added `Array.prototype.includes` 
(replacing the awkward `indexOf(x) !== -1`) and the `**` exponentiation operator. That is the 
entire release. The feature was originally proposed as `Array.prototype.contains` but was renamed 
to `includes` because MooTools had monkeypatched `Array.prototype.contains` on enough websites that 
adding the native method broke them — a vivid example of "don't break the web."

**ES2017** (June 2017). Added **`async`/`await`** — arguably the most impactful addition since 
ES6 itself, and one that matured the callback-to-promise-to-async-function progression that had 
been underway since 2009. An `async function` returns a Promise; `await` pauses execution until 
that Promise resolves. The syntax made asynchronous code read like synchronous code, eliminating 
"callback hell" and promise-chain spaghetti. Also in ES2017: `Object.entries` and `Object.values`, 
`String.prototype.padStart` and `padEnd` (resolving the left-pad situation properly), 
`Object.getOwnPropertyDescriptors`, trailing commas in function parameters, and the 
`SharedArrayBuffer` and `Atomics` APIs for shared-memory concurrency between web workers. 
(SharedArrayBuffer was temporarily disabled in all browsers in January 2018 after the 
Spectre/Meltdown CPU vulnerability disclosures, then re-enabled with cross-origin isolation headers 
in 2020.)

**ES2018** (June 2018). Object rest/spread (`const { a, ...rest } = obj`), async iterators and `for 
await...of`, `Promise.prototype.finally`, regular expression lookbehind assertions (`(?<=...)` and 
`(?<!...)`), named capture groups (`(?<year>\d{4})`), Unicode property escapes 
(`\p{Script=Greek}`), and the dotAll regex flag `s`. A substantial regex upgrade.

**ES2019** (June 2019). `Array.prototype.flat` and `flatMap`, `Object.fromEntries` (the inverse of 
`Object.entries`), `String.prototype.trimStart/trimEnd`, optional catch binding (`catch { }` with 
no parameter), `Symbol.description`, stable `Array.prototype.sort` (previously implementations 
could use unstable sorting).

**ES2020** (June 2020). Optional chaining `?.`, nullish coalescing `??`, `BigInt` 
(arbitrary-precision integers, the first new primitive type since ES1), `globalThis` (unifying 
`window` / `global` / `self`), dynamic `import()`, `Promise.allSettled`, 
`String.prototype.matchAll`, module namespace exports (`export * as ns from "mod"`), `import.meta`.

**ES2021** (June 2021). `String.prototype.replaceAll`, logical assignment operators (`||=`, `&&=`, 
`??=`), `Promise.any` (resolves when any input resolves; rejects only if all reject), `WeakRef` and 
`FinalizationRegistry` (weak references and pointers, carefully designed to avoid the portability 
problems of C-style weak references), numeric separators (`1_000_000`).

**ES2022** (June 2022). Class fields (public and private), private methods, static class blocks 
(`static { ... }`), `Object.hasOwn` (replacing `Object.prototype.hasOwnProperty.call`), top-level 
`await` in modules, `Array.prototype.at` (`arr.at(-1)` for negative indexing), `RegExp` match 
indices (`d` flag), `error.cause` (chained errors).

**ES2023** (June 2023). `Array.prototype.findLast` and `findLastIndex`, the "Change Array by Copy" 
proposal (`toSorted`, `toReversed`, `toSpliced`, `with`) providing non-mutating versions of the 
classic array mutators, hashbang grammar (`#!/usr/bin/env node` now legal at top of file), 
`Symbols` as `WeakMap` keys.

**ES2024** (June 2024). `Object.groupBy` and `Map.groupBy`, `Promise.withResolvers`, well-formed 
Unicode strings (`isWellFormed`, `toWellFormed`), `Atomics.waitAsync`, the regular expression `v` 
flag (set notation and string properties), `ArrayBuffer` resize and transfer.

**ES2025** (June 2025). Iterator helpers (`iter.map`, `iter.filter`, `iter.take`, etc. — lazy 
iterator methods on native iterators), JSON modules (`import data from "./config.json" with { type: 
"json" }`), `Promise.try`, Set methods (`union`, `intersection`, `difference`, 
`symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`), duplicate named capture 
groups, regular expression modifiers [CHECK for exact Stage-4 cut at June 2025 plenary].

---

## 10. The module story

No part of JavaScript's history is messier than modules. The language had no module system at all 
for its first fourteen years, and the transition to a standard system has taken another fifteen and 
is still not fully complete.

**Script-tag era** (1995–2009). Every `<script src="">` dumped its symbols into the global 
object. Two scripts defining `foo` overwrote each other silently. Libraries adopted defensive 
conventions like the **IIFE** (Immediately Invoked Function Expression) — `(function() { ... 
})();` — to create a private scope and explicitly attach only a single name to `window`. jQuery, 
Prototype, and MooTools all shipped as IIFEs. The **Revealing Module Pattern** (first named by 
Christian Heilmann around 2007) used IIFEs to return an object with public methods while keeping 
private state in closure scope.

**CommonJS** (2009). CommonJS began as a mailing-list effort in January 2009 led by **Kevin 
Dangoor**, then at Mozilla Messaging. Originally called **ServerJS**, it was renamed CommonJS to 
reflect broader ambitions. The goal was to specify "things JavaScript needs outside the browser" 
— modules, file I/O, binary data, streams. The modules portion solidified first: 
`require("./foo")` returns an object; the module sets properties on `module.exports`. Node.js 
adopted CommonJS for its module system in its earliest 2009 releases and made the pattern famous. 
Synchronous `require`, though problematic for browsers (you can't synchronously fetch a file over 
HTTP), was trivially implementable on a server where files were on a local disk.

**AMD** (Asynchronous Module Definition, 2009–2010). In parallel with CommonJS, a group led by 
**James Burke** developed AMD, a module format specifically designed for the browser. AMD wrapped 
each module in a `define([...deps], function(...) { ... })` call so that dependencies could be 
loaded asynchronously over HTTP. **RequireJS**, Burke's implementation, was the canonical loader. 
AMD dominated browser module loading from roughly 2011 to 2015.

**UMD** (Universal Module Definition). A pattern, not a library — a multi-line wrapper at the top 
of a file that detected whether it was running in CommonJS, AMD, or a browser global and exposed 
itself accordingly. Most published libraries of the 2012–2018 era used UMD wrappers, and the 
boilerplate was universally hated.

**ES Modules** (ES2015, but delayed until 2020 in the real world). TC39 specified `import` and 
`export` in ES2015, but the semantics of module loading — in particular how a host runtime 
resolved specifiers and fetched bytes — were intentionally left out of the language spec and 
delegated to host environments. Browsers gained ESM support via the `<script type="module">` 
attribute by 2017 (Chrome 61, Firefox 60, Safari 11). Node.js wrestled with ESM support for four 
years, beginning with an experimental `--experimental-modules` flag in Node 8.5 (September 2017), 
through several iterations of the specifier resolution algorithm (including the `.mjs` file 
extension debate), before finally shipping stable ESM in Node 12 (May 2019) and unflagging it fully 
in Node 14 (April 2020). The `"type": "module"` field in `package.json` determines whether `.js` 
files are treated as ESM or CommonJS.

**Dual package hell.** Because the package ecosystem was CommonJS-shaped for a decade, the 
migration to ESM has been painful. A single package might need to export both forms; consumers mix 
`require` and `import` in the same application. Node's `"exports"` field in `package.json` and 
conditional exports (2019–2020) are the official solution, but the error message "require() of ES 
Module is not supported" has become one of the most-searched JavaScript errors of the early 2020s. 
The pain began to ease in Node 22 (2024), which introduced experimental `require(esm)` support, 
allowing synchronous `require` of ESM modules under certain conditions. By 2025 the ecosystem is 
slowly converging on ESM-first, but the transition is far from complete.

---

## 11. Frameworks (the history, not the tutorial)

**jQuery** (2006, John Resig). Already covered above. Dominated 2006–2013. Still present on a 
large fraction of the web but rarely used in new projects after 2016.

**Backbone.js** (October 2010, **Jeremy Ashkenas** and the DocumentCloud team). Backbone gave 
JavaScript its first widely-used MV* (Model-View-Whatever) architecture, inspired by Ruby on Rails 
and Cocoa. Models fired change events; views rerendered in response. A `Router` linked URL hash 
fragments to handlers — the first mainstream JavaScript router. Backbone was small — about 
1,500 lines of annotated source — and depended on jQuery (or Zepto) and Underscore (which 
Ashkenas also wrote). LinkedIn Mobile, Trello, Khan Academy, Hulu, Airbnb, and SoundCloud all 
shipped on Backbone at various points.

**Knockout.js** (July 2010, **Steve Sanderson** at Microsoft). Knockout introduced JavaScript 
developers to two-way data binding via observables, borrowing the MVVM pattern from 
WPF/Silverlight. `ko.observable()` wrapped a value, and any `data-bind` attribute in the HTML 
automatically updated when the observable changed. Knockout was influential — its observable 
pattern was a direct ancestor of Vue's reactivity system and Angular's two-way binding — but it 
lost ground to AngularJS.

**AngularJS** (October 2010, **Miško Hevery** at Google). Originally a side project called 
GetAngular to make web form development easier, AngularJS introduced directives (custom HTML 
elements and attributes), dependency injection (Java-Guice-influenced), and two-way data binding 
via a dirty-checking `$scope` model. Its `ng-repeat`, `ng-model`, and `ng-click` attributes allowed 
declarative UI construction that read almost like a domain-specific language. AngularJS was 
enormously popular from 2012 through 2016 but its architecture — dirty checking via `$digest` 
cycles, mutable `$scope` hierarchies, intricate `$apply/$evalAsync` timing — did not scale well 
to large applications. Google's decision to rewrite it from scratch as Angular 2 was announced at 
ng-Europe 2014 by Igor Minar and caused what the community called "Angularmageddon."

**Ember.js** (December 2011, **Yehuda Katz** and **Tom Dale**). Grown out of Apple's abandoned 
SproutCore project (from early iCloud work), Ember positioned itself as the "convention over 
configuration" framework for JavaScript. Routing, data layer (Ember Data), components, a build tool 
(Ember CLI), and testing infrastructure all came in one box. Ember pioneered many patterns later 
adopted elsewhere, including the use of a router as the primary driver of application state, 
CLI-driven scaffolding, and the "stability without stagnation" semver-based upgrade philosophy. 
LinkedIn, Netflix, Heroku, and Apple's documentation sites used Ember at various points.

**React** (May 29, 2013, **Jordan Walke** at Facebook). React was first used internally at Facebook 
in 2011 for the News Feed and then for Instagram after the 2012 acquisition. Walke's insight, 
influenced by the functional programming tradition (he has cited Standard ML and XHP, an internal 
PHP extension at Facebook), was that re-rendering the entire UI on every state change was 
conceptually simpler than observing and patching mutations, and that a **virtual DOM** diffing 
algorithm could make the naive approach fast enough. React was announced by **Tom Occhino** and 
Jordan Walke at JSConf US 2013 to a skeptical reception — the combination of **JSX** 
(HTML-in-JavaScript syntax, compiled by a build step) and one-way data flow struck many in the 
audience as backward.

React's adoption was slow until late 2014, when `react-router` (Michael Jackson and Ryan Florence) 
stabilized and the **Flux** architecture pattern (Facebook's solution for data flow) gave React 
applications a coherent state story. **Redux** (Dan Abramov and Andrew Clark, 2015) — a 
predictable state container inspired by Elm's architecture — replaced Flux and became the 
dominant state-management library. Sebastian Markbåge, Pete Hunt, Cheng Lou, Andrew Clark, and 
Sophie Alpert all became central to React's design over the next several years. By 2016 React was 
dominant.

Notable React milestones: React 0.14 (October 2015, split into react and react-dom), React 15 
(April 2016), React 16 "Fiber" (September 2017, complete rewrite of the reconciliation engine for 
incremental rendering), React 16.8 (February 2019, **Hooks** — `useState`, `useEffect`, 
`useContext` — replacing class components for state), React 18 (March 2022, concurrent features, 
`useId`, `useTransition`), React Server Components (experimental 2020, production-stable in Next.js 
13+ in 2023), React 19 (December 2024, Actions, `use` hook).

The **BSD+Patents license controversy** (2017) is worth noting: React was originally licensed under 
a BSD license with a patent grant that revoked the license if the user sued Facebook for patent 
infringement. Apache and WordPress both banned the license, and in September 2017 Facebook 
relicensed React under the standard MIT license.

**Vue.js** (February 2014, **Evan You**). Evan You had worked on AngularJS at Google Creative Lab 
and wanted a lighter framework that retained Angular's template-based ergonomics without the 
weight. Vue 1.0 shipped in October 2015, Vue 2.0 in September 2016, Vue 3.0 in September 2020 (with 
the Composition API, influenced by React Hooks and Svelte's reactivity). Vue is distinctive for 
being an independent, community-funded project — Evan You left Google in 2016 to work on Vue 
full-time, funded initially by Patreon and later by corporate sponsorships. Vue's adoption is 
particularly strong in China, where it surpasses React in many surveys, and it powers major 
applications at Alibaba, Baidu, and Xiaomi.

**Angular 2+** (September 2016, Google). A ground-up rewrite in TypeScript led by Brad Green, Igor 
Minar, and Miško Hevery. Angular 2 used reactive programming via RxJS, a component-based 
architecture (no more `$scope`), zones for change detection, and a powerful CLI. The migration from 
AngularJS to Angular 2 was contentious. Angular has since stabilized with consistent major releases 
and a loyal enterprise following. Angular 16 (2023) introduced signals-based reactivity, Angular 17 
(November 2023) introduced the new control flow syntax and deferred loading, and Angular 19 
(November 2024) continued the signals migration.

**Svelte** (November 2016, **Rich Harris**). Harris, a graphics editor at The Guardian and later 
The New York Times, created Svelte as a "disappearing framework": code is compiled at build time to 
small, imperative JavaScript that directly manipulates the DOM. There is no virtual DOM and no 
framework runtime shipped to the browser. Svelte 3 (April 2019) introduced reactive assignments 
where `count += 1` triggers a DOM update. Svelte 4 (June 2023) was a maintenance release. Svelte 5 
(October 2024) introduced "runes" — explicit reactivity primitives (`$state`, `$derived`, 
`$effect`). **SvelteKit** (February 2023) is the official meta-framework, analogous to Next.js for 
React. Harris joined Vercel in 2021 to work on Svelte full-time.

**Solid.js** (2018, **Ryan Carniato**). Solid pairs a React-like JSX syntax with fine-grained 
reactive signals (inspired by Knockout observables and S.js). Components execute once; only the 
reactive expressions update. Its performance is consistently at the top of JS framework benchmarks. 
SolidJS 1.0 shipped in June 2021. The signals pattern pioneered in Solid has influenced Vue 3's 
Composition API, Svelte 5's runes, Preact Signals (2022), and Angular's signal-based reactivity 
(Angular 16+, 2023).

**Next.js** (October 25, 2016, **Guillermo Rauch** and ZEIT/Vercel, with **Tim Neutkens** as lead). 
Began as a server-rendered React meta-framework and became the dominant way React is deployed in 
production. Key milestones: Next.js 9 (2019, API routes, dynamic routing), Next.js 13 (October 
2022, App Router, React Server Components, Turbopack experimental), Next.js 14 (October 2023, 
Server Actions stable), Next.js 15 (October 2024). Vercel, the company behind Next.js, was founded 
as ZEIT in 2015 and renamed in 2020.

**Astro** (June 2021, **Fred K. Schott** and the Astro team). A content-first meta-framework that 
ships zero JavaScript by default and supports "islands" of interactivity using any framework — 
React, Vue, Svelte, Solid, Preact — side by side. Astro 3.0 (2023) introduced View Transitions; 
Astro 4.0 (2024) added content collections and improved tooling. Astro's "islands architecture" 
concept was formalized by **Katie Sylor-Miller** in 2019 and popularized by **Jason Miller** 
(Preact creator) in his 2020 blog post.

---

## 12. Build tools evolution

**CoffeeScript** (December 2009, **Jeremy Ashkenas**). Ashkenas published a small 
Ruby/Python-inspired language that compiled to JavaScript, with significant whitespace, implicit 
returns, list comprehensions, existential operators, and the "fat arrow" (`=>`) for lexically-bound 
functions. CoffeeScript became fashionable around 2011–2013 — Dropbox, GitHub (parts), and 
Basecamp used it — and its features strongly influenced ES6. Arrow functions, destructuring, 
rest/spread, classes, default parameters, string interpolation all have CoffeeScript analogs. As 
ES6 landed and Babel made it accessible, CoffeeScript's rationale weakened; by 2016 new projects 
rarely chose it. CoffeeScript 2 (2017) generated modern ES6+ output but adoption did not recover.

**Grunt** (2012, **Ben Alman**). The first widely-adopted task runner for JavaScript build 
pipelines. Configuration-driven with a Gruntfile.js defining tasks: compile, minify, lint, copy. 
Grunt plugins numbered in the thousands.

**Gulp** (2013, **Eric Schoffstall**). A code-over-configuration alternative to Grunt, using Node 
streams to pipe file transformations. Both Grunt and Gulp were displaced by bundler-integrated 
workflows after 2015.

**Browserify** (2011, **James Halliday**, also known as "substack"). The first practical way to use 
`require()` in the browser. Browserify walked the dependency graph of a Node module, resolved 
`require` calls recursively, and concatenated everything into a single file with a small runtime 
shim. It made CommonJS-in-the-browser possible years before ES modules landed and proved that the 
browser and server could share code.

**webpack** (March 2012, **Tobias Koppers**). Started as a side project to improve on Browserify; 
became the dominant bundler from roughly 2015 through 2020. webpack's key innovations: 
code-splitting (`import()` and entry points), loaders (transform any file type — CSS, images, 
SVG, YAML — into JavaScript), plugins (hook into every stage of the compilation), hot module 
replacement (update modules in the running browser without a full page reload), and the 
`CommonsChunkPlugin` / `SplitChunksPlugin` for shared dependencies. Its configuration complexity 
became a meme — joke webpack configs were a genre of developer humor. webpack 5 (October 2020) 
added persistent caching, Module Federation (for microfrontend architectures), and asset modules. 
Koppers began working full-time on webpack via OpenCollective sponsorship in 2017, and later joined 
Vercel to build Turbopack.

**Babel** (originally **6to5**, September 2014, **Sebastian McKenzie**). McKenzie, then a teenager 
in Australia, wrote a tool to transpile ES6 to ES5 so that developers could use new language 
features in old browsers immediately. The project was renamed Babel in February 2015. Babel became 
essential infrastructure: the `preset-env` plugin (2016) automatically determined which transforms 
were needed based on a browser-targets list. Babel also processed JSX for React, experimental TC39 
proposals, and (via `@babel/preset-typescript`) TypeScript. McKenzie later founded **Rome** (2019), 
then **Biome** (2023 fork after Rome governance disputes) — both Rust-based attempts to unify 
linter, formatter, and compiler.

**Rollup** (2015, **Rich Harris**). Harris built Rollup while working on The Guardian's interactive 
journalism team, specifically to handle ES module code cleanly. Rollup pioneered **tree shaking** 
— the automatic removal of unused exports — by relying on the static structure of ES modules 
(which, unlike CommonJS, allows dead-code analysis at build time). Vite uses Rollup for production 
builds. Rollup 4 (2023) added a Rust-based parser for speed.

**Parcel** (December 2017, **Devon Govett**). A zero-configuration bundler that "just worked" by 
auto-detecting file types, transforms, and targets. Influential for showing that configuration did 
not need to be a core part of the bundler experience. Parcel 2 (2022) was a significant rewrite 
using Rust for its resolver and transformer.

**esbuild** (January 2020, **Evan Wallace**). Wallace, co-founder and CTO of Figma, built esbuild 
in Go as a personal project. Its headline claim — "10–100x faster than other bundlers" — was 
true and provable. esbuild achieved its speed through careful parallelism, avoiding AST 
transformations where possible, and operating at a lower level of abstraction than JavaScript-based 
tools. esbuild is used inside Vite (for dev-mode dependency pre-bundling and TypeScript/JSX 
transformation) and inside many other tools as an internal accelerator.

**SWC** (2020, **Donny Wang**, also known as "kdy1"). A Rust-based JavaScript/TypeScript compiler 
originally created to accelerate Next.js's transpilation step, which was previously Babel-based. 
Vercel hired Wang in 2021. Since Next.js 12 (October 2021) SWC is the default compiler. SWC is 
roughly 20x faster than Babel for comparable workloads.

**Vite** (April 2020, **Evan You**). You wrote Vite (pronounced "veet," French for "fast") 
initially for Vue 3 development, but it quickly became framework-agnostic. The key insight was to 
serve source files as native ES modules to the browser during development — no bundling at all; 
the browser's own `import` statements fetch individual files on demand — and only bundle (via 
Rollup) for production. Dev startup time collapsed from tens of seconds to milliseconds for 
projects of any size. Vite's adoption was explosive; by 2023 it had overtaken webpack in 
new-project usage on npm. Vite 5 (November 2023) added environment API improvements. Vite 6 
(November 2024) continued the integration of **Rolldown** (a Rust-based Rollup replacement being 
built by the Vite team to unify dev and build).

**Turbopack** (October 2022, **Tobias Koppers** at Vercel). Announced as webpack's successor, 
written in Rust on top of the **Turbo** engine (an incremental computation framework). Integrated 
into Next.js as an opt-in replacement for webpack. General availability has been gradual through 
2024–2025.

**Rspack** (March 2023, **ByteDance**). A Rust reimplementation of webpack that aims to be 
configuration-compatible — existing `webpack.config.js` files often work without changes. 
Aggressively adopted inside ByteDance (TikTok, Lark) and spreading globally through 2024.

**Biome** (August 2023, forked from Rome). Sebastian McKenzie's vision for a unified Rust-based 
toolchain — formatter + linter in one binary — revived after Rome's organizational collapse. 
Biome 1.0 shipped August 2023; bundling is on the roadmap.

**Oxc** (2023, **Boshen**). A Rust-based JavaScript toolchain focused on correctness and speed. 
Oxlint (the linter component) claims 50–100x faster than ESLint for equivalent rule sets.

---

## 13. The alternative runtimes

For its first fourteen years, JavaScript ran in exactly two places: the browser and (after 2009) 
Node.js. From 2018 onward, the runtime landscape has fragmented productively.

**Deno** (announced May 2018, 1.0 released May 13, 2020, **Ryan Dahl**). Eight years after leaving 
Node, Dahl returned with a talk at JSConf EU 2018 titled "10 Things I Regret About Node.js." His 
regrets were specific and candid: not sticking with Promises (Node adopted callbacks and added 
Promises very late), the design of `package.json` and `node_modules` (the nested directory 
structure could produce pathologically deep file paths), the lack of a security sandbox, the 
decision to omit the file extension in `require` (making resolution ambiguous), not sticking with 
browser-standard APIs, and the decision to use `index.js` as a default module. Deno was his 
corrective. Written in Rust (with V8 for JavaScript execution and Tokio for async I/O), Deno:

- Runs **TypeScript natively** with no configuration or build step.
- Has a **permission model** — file, network, environment, subprocess access must be explicitly 
granted via `--allow-read`, `--allow-net`, etc.
- Originally used **URL-based imports**: `import { serve } from 
"https://deno.land/std/http/server.ts"`.
- Ships a **built-in formatter** (`deno fmt`), **linter** (`deno lint`), **test runner** (`deno 
test`), **bundler**, **documentation generator**, and **LSP** in a single `deno` executable.
- Exposes **Web platform APIs** (`fetch`, `Request`, `Response`, `Web Crypto`, `URL`, `Streams 
API`) rather than Node-specific ones.

Deno 2.0 (October 2024) was a major pivot toward Node compatibility: `npm:` specifiers (import npm 
packages directly), full `node:` built-in support, `package.json` support, a workspace system, and 
JSR (the JavaScript Registry, a new package registry designed for ESM-first publishing). Deno is 
maintained by Deno Land Inc., co-founded by Dahl and Bert Belder in 2021, and it underlies the 
commercial **Deno Deploy** edge-compute platform.

**Bun** (July 2022 first public release, 1.0 September 8, 2023, **Jarred Sumner**). Bun is a 
runtime, package manager, bundler, and test runner in a single binary, written in **Zig** and built 
on Apple's **JavaScriptCore** (the Safari JS engine, from WebKit) rather than V8. Sumner, a former 
Stripe engineer, started Bun as a personal project and incorporated **Oven, Inc.** in 2022 to fund 
its development. Bun's positioning is as a drop-in faster replacement for Node: `bun install` is 
10–30x faster than `npm install` (using hardlinks and a binary lockfile), `bun run` starts 
processes faster than Node, and `bun build` bundles for production. Bun 1.0 was the first 
officially-recommended-for-production release. Bun 1.1 (April 2024) added Windows support. Notable 
built-in features: a SQLite driver (`bun:sqlite`), a Jest-compatible test runner, a React Server 
Components implementation, native `.env` loading, hot reloading, and a transpiler that handles 
TypeScript, JSX, and CSS modules.

**Cloudflare Workers** (September 2017). The first production serverless runtime based on **V8 
Isolates** rather than containers or VMs. An Isolate is a lightweight sandbox within a V8 process; 
Cloudflare runs thousands of isolates per machine, cold-starting them in under 5 milliseconds. 
Workers run at Cloudflare's 300+ edge points-of-presence, and the programming model is based on the 
`fetch` event and the Service Worker API. The runtime was open-sourced as **workerd** in September 
2022.

**Vercel Edge Functions** (2021). V8-Isolate-based edge compute, tightly integrated with Next.js. 
Initially built on Cloudflare's workerd, later moved to Vercel's own infrastructure.

**Deno Deploy** (2021). Deno's commercial edge-compute platform, using Deno's runtime on 
globally-distributed servers.

**Fastly Compute** (2020, originally Compute@Edge). Uniquely, Fastly uses **WebAssembly** as the 
execution model rather than V8, so any language that compiles to WASM can run on it, including 
JavaScript via StarlingMonkey (a SpiderMonkey-based WASM module).

**Hermes** (July 2019, **Facebook/Meta**). A small, fast JavaScript engine written from scratch 
specifically for React Native mobile applications. Hermes compiles JavaScript ahead-of-time to 
bytecode at build time, drastically reducing startup time on mobile devices. It does not 
JIT-compile; it is a bytecode interpreter. As of React Native 0.70 (2022), Hermes is the default 
engine.

**QuickJS** (July 2019, **Fabrice Bellard**). Bellard — whose previous creations include FFmpeg, 
QEMU, TinyCC, and the first IEEE-certified Pi computation record — released QuickJS as "a small 
and embeddable Javascript engine." It supports the full ES2020 specification in roughly 210 KB of 
binary, with no dependencies. QuickJS is used in embedded devices, game engines, and as the basis 
for lightweight runtimes. Bellard continues to maintain it as of 2025.

**LLRT** (February 2024, **Amazon**). Low-Latency Runtime, a JavaScript runtime specifically 
designed for AWS Lambda cold-start optimization. Built on QuickJS, with AWS SDK v3 built in. 
Experimental but indicates the direction of edge-optimized runtimes.

---

## 14. Key people

- **Brendan Eich** — Creator of JavaScript in ten days in May 1995. Co-founded Mozilla with 
Mitchell Baker in 1998. Served as Mozilla's CTO, then briefly CEO (March 2014, resigned April 
2014). Founded Brave Software in 2015. "I had to do it in ten days or something worse than JS would 
have happened."
- **Douglas Crockford** — JSLint, JSMin, JSON, *JavaScript: The Good Parts* (O'Reilly 2008, ISBN 
978-0596517748), *How JavaScript Works* (2018, ISBN 978-1949815009). Yahoo architect 2002–2012, 
then PayPal. "JavaScript is Lisp in C's clothing."
- **John Resig** — jQuery (2006). Mozilla 2007–2011, Khan Academy 2011–present. *Secrets of 
the JavaScript Ninja* (Manning 2013, ISBN 978-1617291319, with Bear Bibeault).
- **Ryan Dahl** — Node.js (2009), Deno (2018). Google Brain 2014–2017. Co-founded Deno Land 
Inc. 2021.
- **Isaac Z. Schlueter** — npm (2010). Node.js BDFL 2012–2014. Co-founded npm Inc.
- **TJ Holowaychuk** — Express, Koa, Mocha, Jade/Pug, Commander, ~500+ npm packages. Departed 
Node for Go in 2014.
- **Jeremy Ashkenas** — Backbone, Underscore, CoffeeScript (all 2009–2010). DocumentCloud, 
later NY Times graphics.
- **Dan Abramov** — Redux (2015, with Andrew Clark), React core team at Facebook/Meta 
2015–2023, Bluesky 2023–present.
- **Evan You** — Vue.js (2014), Vite (2020). Left Google 2016, community-funded full-time OSS 
developer.
- **Rich Harris** — Ractive.js (2013), Rollup (2015), Svelte (2016), SvelteKit (2020). The 
Guardian, NY Times, Vercel (2021–present).
- **Anders Hejlsberg** — Turbo Pascal, Delphi, C#, TypeScript (2012). Microsoft Technical Fellow.
- **Allen Wirfs-Brock** — ES5 and ES2015 editor. Co-author of "JavaScript: The First 20 Years" 
(HOPL-IV, 2020).
- **Addy Osmani** — Google Chrome engineering. *Learning JavaScript Design Patterns* (O'Reilly 
2012, 2nd ed. 2023, ISBN 978-1098139872).
- **Sebastian McKenzie** — Babel/6to5 (2014), Rome, Biome. Also created Yarn (with Christoph 
Nakazawa).
- **Sindre Sorhus** — ~1,000+ npm packages, AVA test runner, ky fetch wrapper.
- **Guillermo Rauch** — Vercel (ZEIT), Socket.IO, Mongoose. CEO positioning Vercel as the React 
deployment platform.
- **Tim Neutkens** — Next.js lead at Vercel since 2016.
- **Jarred Sumner** — Bun (2022), founder of Oven, Inc.
- **Miško Hevery** — AngularJS (2010), later Qwik framework at Builder.io.
- **Jordan Walke** — React creator at Facebook (2011–2013).
- **Guy Steele** — ECMA-262 Edition 1 editor (1997). Co-designer of Scheme, Common Lisp, Java, 
Fortress.
- **Dave Herman** — ES6 modules designer, Mozilla Research, later Cloudflare.

---

## 15. The TC39 process

Since 2013, TC39 has used a **staged proposal process** for new language features. The process was 
designed by Domenic Denicola, Allen Wirfs-Brock, and others to replace the old model of 
accumulating features in enormous draft editions.

**Stage 0 — Strawman.** Anyone can write a proposal. It must be discussed at a TC39 meeting but 
requires no committee endorsement. Hundreds of proposals exist at Stage 0, most of which will never 
advance.

**Stage 1 — Proposal.** At least one TC39 delegate (a "champion") must sponsor the proposal. The 
committee agrees the problem is worth solving and commits to devoting meeting time. A GitHub 
repository is created under the `tc39/` organization (e.g., `tc39/proposal-temporal`). At Stage 1 
the solution shape is still expected to change significantly.

**Stage 2 — Draft.** The proposal has a formal specification text in ECMA-262's algorithmic 
notation. The shape of the solution is roughly settled but details may still change. 
Implementations may begin prototyping. TC39 added **Stage 2.7** in 2023 to mark proposals that have 
completed spec text review and are awaiting test implementations — a de facto gate between design 
and implementation readiness.

**Stage 3 — Candidate.** The specification is considered complete. Two "compliant and reasonably 
complete" implementations are required — typically among V8 (Chrome/Node/Deno), JavaScriptCore 
(Safari/Bun), SpiderMonkey (Firefox), XS (Moddable), or Babel/TypeScript transforms. At Stage 3, 
proposals are rarely changed significantly; browsers may ship them unflagged or behind a flag.

**Stage 4 — Finished.** Two shipping, non-flagged implementations exist and have passed the 
**Test262** conformance test suite (maintained at `tc39/test262` on GitHub). The proposal is merged 
into the next annual edition of ECMA-262. Finished proposals are effectively part of the language.

TC39 meets six times a year in "plenary" sessions — typically three days each, rotating between 
member-company offices in San Francisco, Redmond, Cupertino, New York, and internationally. Member 
companies send voting **delegates**; companies include Google, Apple, Microsoft, Mozilla, Meta, 
Bloomberg, Shopify, Igalia, Agoric, and others. Individual proposals have **champions** who present 
updates and defend design decisions. The committee operates by **consensus**: a proposal advances 
only if no member objects. This rule prevents any single vendor from forcing features through but 
has also occasionally stalled proposals for years. The **decorators** proposal took roughly seven 
years at Stage 2 (multiple complete redesigns) before reaching Stage 3 in March 2022, largely 
because TC39 and the TypeScript/Babel teams disagreed about semantics.

Notable long-running proposals: **Temporal** (a replacement for `Date`, at Stage 3 since 2021, not 
yet Stage 4 as of early 2025 [CHECK]), **Pattern Matching** (Stage 1 since 2020, exploring 
Rust-like `match` syntax), **Records and Tuples** (deeply immutable data structures, Stage 2 since 
2020), and **Type Annotations** (the proposal to allow TypeScript-style type syntax in JavaScript 
source code, erased at runtime, Stage 1 since 2022, championed by Daniel Rosenwasser and others — 
the most politically significant proposal in years).

Ecma International hosts TC39 administratively from Geneva, though most work happens remotely; 
in-person plenaries resumed in 2022 after a pandemic hiatus. Ecma publishes the approved edition 
each June. ECMA-262 is free to download — a condition of Ecma's founding charter — and recent 
editions are also published by ISO as ISO/IEC 22275.

---

## 16. What it all adds up to (2025)

Thirty years after Brendan Eich's ten days in May 1995, JavaScript is the most widely deployed 
programming language in history. Every web browser runs it. Every desktop and mobile operating 
system ships at least one JavaScript engine. Electron applications (VS Code, Slack, Discord, 
1Password, Obsidian, Notion) wrap JavaScript in native shells. React Native and Expo put JavaScript 
on phones. Cloudflare Workers, Vercel Edge, Deno Deploy, and Fastly Compute put JavaScript at the 
edge. Node.js powers back-end services at Netflix, LinkedIn, Uber, PayPal, Walmart, and nearly 
every startup of the past decade. TypeScript has taken over large-scale JavaScript development so 
thoroughly that the State of JS 2024 survey showed 78% of respondents using TypeScript as their 
primary language, surpassing plain JavaScript for the first time. The language specified in 172 
pages in ECMA-262 Edition 1 has grown to over 900 pages in ECMA-262 2024 without abandoning a 
single piece of 1997-era syntax.

What makes the story unusual is how contingent it was. JavaScript might not have existed if 
Netscape had succeeded in its original plan to embed only Java. It might have stayed toy-scale if 
the browser war had not given web developers a reason to write cross-platform code. It might have 
remained a browser-only curiosity if V8 had been a year later or if Ryan Dahl had chosen Python for 
his non-blocking server experiment. It might never have earned serious type tooling if Anders 
Hejlsberg had not noticed, from across Redmond, that Microsoft's largest web applications were 
drowning in untyped JavaScript. Almost every major moment in the language's history was a single 
person — Eich in 1995, Crockford with JSON in 2002, Resig with jQuery in 2006, Dahl with Node in 
2009, Hejlsberg with TypeScript in 2012, Harris with Svelte in 2016, Sumner with Bun in 2022 — 
making a small bet against the conventional wisdom and finding it carried.

Guy Steele, reflecting on the ES1 standardization work in a 2017 interview, said: "We thought we 
were standardizing a scripting language. We didn't know we were standardizing the universal 
language of distributed computing." The contingencies became ossified; the quirks became 
load-bearing; the ten-day prototype became infrastructure. As Eich himself told InfoWorld in 2010, 
when asked if he would design it differently today: "Of course. But I would design my children 
differently too, and they're doing fine."

---

## Addendum: 2025–2026 — TypeScript 6, Temporal lands, the runtime triangle stabilizes

This addendum was added in April 2026 as part of a catalog-wide enrichment
pass. Between the time this document was first written and the time of
the enrichment, four things happened in the JS/TS ecosystem that are
substantial enough to record.

### TypeScript 6.0

**TypeScript 6.0** shipped in late 2025 / early 2026. Unlike the 5.x
cadence — where each release was a six-week compiler maintenance
window with small type-system improvements — TypeScript 6.0 is the
first major-version bump with headline features:

- **`es2025` target and lib.** For the first time, `tsc --target es2025`
  is a valid build target. This reflects the reality that most teams
  are now shipping to evergreen runtimes and can emit modern output
  without a down-transpiler.
- **Built-in Temporal types.** The long-delayed **Temporal API**
  reached TC39 stage 4 in 2025. TypeScript 6.0 ships built-in type
  definitions for the Temporal API under `lib: esnext.temporal`,
  which means any project targeting a Temporal-supporting runtime can
  use the API with full type checking immediately.
- **`#/` subpath imports.** A new syntax for internal subpath imports
  that interacts cleanly with Node.js's `imports` field and with
  package-level subpath resolution.
- **Improved method-level type inference** — specifically, inference
  refinements that were held back from 5.x because they required a
  major-version number for correctness reasons.
- Several new standard-library additions on top of the 5.x baseline.

TypeScript **7** is in early progress as of December 2025, with the
Microsoft team's public post describing the direction but not
committing to a ship date.

**Sources:** [Announcing TypeScript 6.0 — Microsoft DevBlogs](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) · [TypeScript: Documentation — TypeScript 6.0 — typescriptlang.org](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) · [TypeScript 5.x to 6.0 Migration Guide — GitHub Gist](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) · [Progress on TypeScript 7 — December 2025 — Microsoft DevBlogs](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)

### Temporal reaches stage 4

The **Temporal API** — the replacement for `Date` that has been in
TC39 proposal for the better part of a decade — reached **stage 4** in
2025. Stage 4 means the proposal has been formally accepted into the
ECMAScript standard and the relevant features will appear in a future
numbered ECMAScript edition. Deno had shipped an implementation behind
a flag as early as Deno 1.40 (January 2024) and stabilized it in the
Deno 2.x line; the V8 and JavaScriptCore teams have been working on
implementations throughout 2025; and, as noted above, TypeScript 6.0
ships the types.

The practical consequence is that `Date` — JavaScript's single worst
built-in API, adopted directly from Java's 1996 `java.util.Date`
which Java itself deprecated years later — is on its way out. Temporal
is not a polyfill. It is a clean replacement with proper timezone
handling, immutable values, duration arithmetic, and a type hierarchy
that was designed after the world had figured out what a good
date-time API looks like.

**Sources:** [ES2025 Features: Temporal API, Pattern Matching & More — FrontendTools](https://www.frontendtools.tech/blog/javascript-es2025-features) · [Deno 1.40: Temporal API — Deno Blog](https://deno.com/blog/v1.40)

### Node.js 24 LTS, Deno 2.x, Bun 1.3 — the runtime triangle

The three-way runtime story that was in flux during 2023–2024
stabilized in 2025–2026 into a genuine production-grade triangle.

- **Node.js 24** went LTS in late 2025 / early 2026, shipping a V8
  upgrade, native `fetch` improvements, and — crucially —
  production-grade `require(ESM)` stability. The long-standing
  "Node.js can't `require` an ESM package" limitation has been
  resolved, which closes one of the biggest practical gaps in
  Node's ESM story.
- **Deno 2.7** (released February 25, 2026) is the current stable
  release. Deno 2's headline pitches — backward compatibility with
  npm packages, a built-in task runner, stabilized Temporal —
  are production-mature. Windows ARM builds exist now, which
  removes one of the last "runs everywhere except this one thing"
  footnotes.
- **Bun 1.3.x** (latest 1.3.11 as of April 2026) ships with TC39
  **standard ES decorators**, Windows ARM64 support, and a
  front-to-back JavaScript-native toolchain (bundler, test runner,
  package manager, runtime). Bun's pitch remains what it was at 1.0:
  "we don't replace Node.js, we replace the whole Node.js toolchain
  with something that's faster because it doesn't have to be
  compatible with anyone but itself."

Practitioner writing from 2025 consistently frames these three as
complementary rather than competitive. Node.js is the default for
anything that has to interoperate with the existing Node.js
ecosystem, Deno is the default for new projects that want first-class
TypeScript and don't care about twenty years of Node history, Bun
is the default for teams whose primary concern is local-development
speed and tooling uniformity. The "which runtime wins" framing that
shaped the 2021–2023 conversation is gone.

**Sources:** [TypeScript vs Deno vs Bun (2026): Performance, Features, and When to Use Each — Nandann](https://www.nandann.com/blog/typescript-vs-deno-vs-bun-2026-performance-comparison) · [Node.js 22 vs 24 (2026): What Changed & Should You Upgrade? — PkgPulse Blog](https://www.pkgpulse.com/blog/nodejs-22-vs-nodejs-24-2026) · [How to Run TypeScript in 2025: A Comparison of Node.js, Bun, and Deno — Akos Komuves](https://akoskm.com/how-to-run-typescript-2025/)

### ES2025 and the end of the "transpile everything" era

Zooming out: **ES2025** is the first ECMAScript edition where the
default assumption for new web projects is "ship modern output, let
the runtime handle it." Up through ES2022, web developers were still
transpiling down to ES5 for Internet Explorer compatibility. Up through
ES2023, the default build target was still something like ES2020.
With TypeScript 6.0 and the current state of evergreen browsers, the
default target is rising to ES2025 and in practice nobody is
transpiling anything more than decorators and a few edge-case
syntaxes.

The transpile-everything era ran from roughly 2013 (Babel's rise) to
roughly 2025. That is a twelve-year arc, and its end is worth
recording in a language-history document because the shape of the
ecosystem during those twelve years was distorted by the assumption
that the output was going to be ES5. Now it is not. React, Vue, Svelte,
Solid, and the TC39 proposal queue are all designed for environments
where the author's source code and the runtime's input are much closer
together than they used to be.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  JavaScript and TypeScript are the most widely-taught programming
  languages in the Programming Fundamentals wing and the most widely
  used in practice outside systems programming.
- [**digital-literacy**](../../../.college/departments/digital-literacy/DEPARTMENT.md)
  — The web is the default computing environment for most people, and
  the web is a JavaScript delivery surface. Digital literacy's
  treatment of "how the web works" is inseparable from JS/TS.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — Node.js, Deno, and Bun are serious server-side engineering tools.
  The front-end framework ecosystem (React, Vue, Svelte, Solid, Qwik)
  is one of the largest software-engineering subdomains in existence.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  The ten-days-at-Netscape origin story, the browser wars, the Ajax
  revolution, and the ES6 comeback are all canonical case studies in
  how a language can be saved by its constraints.

---

*Sources primary:*
- *Eich, Brendan and Wirfs-Brock, Allen. "JavaScript: The First 20 Years." HOPL-IV (History of 
Programming Languages), ACM, 2020. 190 pages. The authoritative historical reference for 
1995–2015.*
- *ECMA-262, Editions 1 through 2024, Ecma International. [CHECK 2025 edition number when published 
June 2025.]*
- *Crockford, Douglas. JavaScript: The Good Parts. O'Reilly, 2008. ISBN 978-0596517748.*
- *Flanagan, David. JavaScript: The Definitive Guide, 7th ed. O'Reilly, 2020. ISBN 978-1491952023.*
- *Resig, John and Bibeault, Bear. Secrets of the JavaScript Ninja, 2nd ed. Manning, 2016. ISBN 
978-1617292859.*
- *Osmani, Addy. Learning JavaScript Design Patterns, 2nd ed. O'Reilly, 2023. ISBN 978-1098139872.*
- *Goodman, Danny. Dynamic HTML: The Definitive Reference. O'Reilly, 1998. ISBN 978-1565924949.*
- *TC39 GitHub organization (github.com/tc39), proposal repositories and meeting notes.*
- *Ryan Dahl, "Introduction to Node.js," JSConf EU 2009.*
- *Ryan Dahl, "10 Things I Regret About Node.js," JSConf EU 2018.*
- *Microsoft TypeScript announcement, Somasegar, blogs.msdn.com, October 1, 2012.*
- *Garrett, Jesse James. "Ajax: A New Approach to Web Applications." Adaptive Path, February 18, 
2005.*
