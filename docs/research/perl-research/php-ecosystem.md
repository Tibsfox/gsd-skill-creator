# PHP: The Language That Won the Web

*From Perl CGI scripts to powering 76% of the server-side internet*

---

## 1. History and the Perl Connection

### Origins: A Perl Programmer's Side Project

In 1994, Danish-Canadian programmer **Rasmus Lerdorf** wrote a set of Common Gateway Interface (CGI) programs in C to track visits to his online resume. He called them **Personal Home Page Tools** (PHP Tools). The critical detail: Lerdorf's first implementation was actually written *in Perl*. He rewrote it in C specifically to eliminate the overhead of forking Perl on every page request --- but the Perl DNA was already embedded in the language's design.

PHP's Perl heritage is visible everywhere:

- **`$` sigil for variables** --- directly from Perl
- **Associative arrays** --- PHP's arrays are Perl hashes by another name
- **String interpolation** --- `"Hello $name"` works identically in both
- **Regular expressions** --- PHP adopted Perl-Compatible Regular Expressions (PCRE) as its regex engine
- **Loose typing and context sensitivity** --- the "do what I mean" philosophy
- **`foreach`, string operators, `print`/`echo`** --- syntactic siblings

Lerdorf publicly announced PHP Tools v1.0 on the Usenet group `comp.infosystems.www.authoring.cgi` on **June 8, 1995** --- the same era when Perl 5 was becoming the dominant CGI language.

### The Timeline

| Year | Version | Milestone |
|------|---------|-----------|
| 1994 | PHP Tools | Rasmus Lerdorf's personal CGI scripts (rewritten from Perl to C) |
| 1995 | PHP/FI | "Personal Home Page / Forms Interpreter" --- public release |
| 1997 | PHP/FI 2.0 | ~50,000 domains using it. Still a one-person project. |
| 1998 | **PHP 3** | Complete rewrite by **Zeev Suraski** and **Andi Gutmans** (Israel). Renamed to recursive acronym "PHP: Hypertext Preprocessor." Extensible architecture. The language explodes in popularity. |
| 2000 | **PHP 4** | Powered by the new **Zend Engine 1.0** (Suraski + Gutmans founded Zend Technologies). Sessions, output buffering, safer user input handling. |
| 2004 | **PHP 5** | Zend Engine II. Real OOP: visibility modifiers, abstract classes, interfaces, exceptions, PDO, SimpleXML. PHP becomes a serious language. |
| 2015 | **PHP 7** | The performance revolution. **2x faster than PHP 5.6**, 3x lower memory use. Scalar type declarations, return types, null coalescing (`??`), spaceship operator (`<=>`). PHP 6 was skipped (abandoned Unicode rewrite). |
| 2020 | **PHP 8.0** | **JIT compilation** via Tracing JIT in OPcache. Named arguments, attributes (annotations), match expressions, union types, nullsafe operator, fibers (8.1), enums (8.1), readonly properties (8.2). |
| 2023 | **PHP 8.3** | Typed class constants, `json_validate()`, `#[\Override]` attribute, deep-cloning of readonly properties. |
| 2024 | **PHP 8.4** | Property hooks, asymmetric visibility, HTML5 DOM parser, `array_find()`/`array_any()`/`array_all()`, BCMath OOP API, method chaining on `new`. |
| 2025 | **PHP 8.5** | **Pipe operator** (`\|>`), built-in **URI extension** (RFC 3986 + WHATWG), `clone with` syntax, `#[\NoDiscard]` attribute, OPcache merged into core. Released November 20, 2025. |
| 2026 | **PHP 8.5.4** | Current latest stable (March 12, 2026). PHP 8.6 in active development for late 2026. |

### The PHP 6 That Never Was

PHP 6 was planned to add native Unicode (UTF-16) support throughout the engine. After years of development, the effort was abandoned due to performance concerns and complexity. The version number was skipped entirely, jumping from 5 to 7 --- a pragmatic decision that also served as a psychological break from PHP's messy past.

---

## 2. PHP's Web Dominance

### The Numbers (2026)

According to W3Techs (January 2026):

- **PHP powers 76.5% of all websites** with a known server-side programming language
- **ASP.NET**: 6.2% (distant second)
- **Ruby**: 5.3%
- **Java**: 4.0%
- **Python**: 1.8%

This is not a statistical anomaly. PHP has held >75% market share for over a decade.

### Why? WordPress.

**WordPress** is the single largest reason PHP dominates the web:

- Powers approximately **43% of ALL websites** on the internet (not just CMS-powered sites --- all sites)
- 64.2% of all CMS-powered sites run WordPress
- WordPress is written entirely in PHP
- Its plugin ecosystem (60,000+ plugins) is entirely PHP
- Its theme ecosystem is entirely PHP

Beyond WordPress, PHP powers the engines behind:

| Platform | Role |
|----------|------|
| **Drupal** | Enterprise CMS (governments, universities, media companies) |
| **Joomla** | General-purpose CMS |
| **MediaWiki** | Powers Wikipedia and thousands of wikis worldwide |
| **Magento** (Adobe Commerce) | Major e-commerce platform |
| **WooCommerce** | WordPress e-commerce (powers ~25% of online stores) |
| **Moodle** | Learning management (250M+ users) |
| **phpBB** | Forum software that defined an era |
| **phpMyAdmin** | The MySQL web admin tool that virtually every shared host runs |

### The Shared Hosting Amplifier

PHP's dominance was cemented by the **LAMP stack** (Linux, Apache, MySQL, PHP) becoming the default offering of virtually every shared hosting provider from the late 1990s onward. When "getting a website" meant "getting a cPanel account," PHP was already there, configured and ready. No compilation step, no deployment pipeline, no server configuration. Upload a `.php` file and it works.

---

## 3. Composer and Packagist: PHP's CPAN Equivalent

### Before Composer: The Dark Ages

Before Composer (2012), PHP had **PEAR** (PHP Extension and Application Repository), which was notoriously painful to use. Dependency management was essentially manual --- download a zip, extract it, hope the paths work. This was PHP's biggest ecosystem weakness compared to Perl's CPAN, Ruby's Gems, or Python's pip.

### Composer Changed Everything

**Composer** (created by Nils Adermann and Jordi Boggiano, 2012) is a dependency manager for PHP that finally gave the language a modern package management story.

How it works:

1. You declare dependencies in `composer.json`
2. Run `composer install` or `composer update`
3. Composer resolves the full dependency tree, downloads packages, and generates an autoloader
4. Your code uses `require 'vendor/autoload.php'` and every class is available

### Packagist: The Central Repository

**Packagist.org** is PHP's central package repository --- the equivalent of CPAN for Perl, PyPI for Python, or npm for JavaScript.

| Metric | Packagist (PHP) | CPAN (Perl) |
|--------|-----------------|-------------|
| **Total packages** | ~400,000 packages, 4.5M+ versions | ~220,000 modules in ~45,500 distributions |
| **Contributors** | Hundreds of thousands | ~14,500 |
| **Package format** | `composer.json` (JSON) | `Makefile.PL` or `Build.PL` |
| **Dependency resolution** | SAT solver (automatic) | Manual or via `cpanm` |
| **Autoloading** | PSR-4 standard (automatic) | Manual `use` statements |
| **Private registries** | Private Packagist (commercial), Satis (self-hosted) | CPAN::Mini, DarkPAN |

Packagist's growth trajectory has been remarkable. From its launch in 2012, it reached 400,000 packages --- nearly doubling CPAN's module count despite a 17-year head start (CPAN launched in 1995). Much of this growth is driven by the Laravel and Symfony ecosystems, which encourage small, focused, reusable packages.

### The PSR Standards

The **PHP-FIG** (Framework Interoperability Group) created PSR (PHP Standards Recommendations) that made Composer's ecosystem cohesive:

- **PSR-4**: Autoloading standard (the glue that makes Composer work)
- **PSR-7**: HTTP message interfaces
- **PSR-12**: Extended coding style guide
- **PSR-15**: HTTP middleware
- **PSR-18**: HTTP client interface

These standards mean packages from different frameworks can interoperate --- something Perl's CPAN ecosystem achieved through convention but never formally standardized.

---

## 4. PHP 8.x Modern Features: This Is NOT 2005 PHP

The most common criticism of PHP is based on a version of the language that no longer exists. Modern PHP (8.x) is a dramatically different language.

### JIT Compilation (8.0)

PHP 8.0 introduced a **Tracing JIT compiler** built on top of DynASM. While the JIT provides modest improvements for typical web workloads (which are I/O bound), it offers **2-3x speedups for CPU-intensive tasks** like mathematical computations, image processing, and machine learning inference.

### Fibers (8.1) --- Cooperative Multitasking

```php
$fiber = new Fiber(function (): void {
    $value = Fiber::suspend('fiber started');
    echo "Value from main: $value\n";
});

$result = $fiber->start();        // "fiber started"
$fiber->resume('hello fiber');    // "Value from main: hello fiber"
```

Fibers provide the foundation for **async PHP** without callbacks or promises. Libraries like **ReactPHP**, **Amp**, and **Revolt** build event loops on top of fibers, enabling non-blocking I/O similar to Node.js.

### Enums (8.1)

```php
enum Suit: string {
    case Hearts = 'H';
    case Diamonds = 'D';
    case Clubs = 'C';
    case Spades = 'S';
    
    public function color(): string {
        return match($this) {
            Suit::Hearts, Suit::Diamonds => 'red',
            Suit::Clubs, Suit::Spades => 'black',
        };
    }
}
```

First-class enums with methods, interfaces, and backed values. PHP waited a long time for these, but the implementation is excellent.

### Named Arguments (8.0)

```php
// Before: positional nightmare
htmlspecialchars($string, ENT_COMPAT | ENT_HTML401, 'UTF-8', false);

// After: self-documenting
htmlspecialchars($string, double_encode: false);
```

### Match Expressions (8.0)

```php
$result = match($status) {
    200 => 'OK',
    301, 302 => 'Redirect',
    404 => 'Not Found',
    500 => 'Server Error',
    default => 'Unknown',
};
```

Strict comparison (no type coercion), returns a value, exhaustive (throws if no match). A proper replacement for `switch`.

### Union and Intersection Types (8.0/8.1)

```php
function process(int|float $number): int|float { ... }
function filter(Iterator&Countable $collection): array { ... }
```

### Readonly Properties and Classes (8.1/8.2)

```php
readonly class Point {
    public function __construct(
        public float $x,
        public float $y,
    ) {}
}
```

Immutable value objects with minimal boilerplate --- constructor promotion + readonly in a single declaration.

### Property Hooks (8.4)

```php
class User {
    public string $fullName {
        get => "$this->firstName $this->lastName";
        set(string $value) {
            [$this->firstName, $this->lastName] = explode(' ', $value, 2);
        }
    }
}
```

Computed properties without the getter/setter boilerplate. Inspired by C# and Kotlin.

### Pipe Operator (8.5)

```php
// Before: inside-out nesting
$result = array_map('strtoupper', array_filter($list, 'is_string'));

// After: left-to-right flow
$result = $list
    |> array_filter($$, 'is_string')
    |> array_map('strtoupper', $$);
```

The `|>` operator passes the result of the left expression as `$$` into the right expression. Functional programming idiom that Perl developers will recognize from Unix pipes.

### Asymmetric Visibility (8.4)

```php
class BankAccount {
    public private(set) float $balance;  // read anywhere, write only internally
}
```

### The Transformation Summary

| PHP 5 Era (2005) | PHP 8.5 Era (2026) |
|---|---|
| No type system | Scalar types, union/intersection types, enums, typed properties |
| `mysql_*` functions | PDO, typed ORM layers |
| No dependency manager | Composer + 400K packages |
| Slow interpreter | OPcache + JIT compilation |
| Callback hell | Fibers, async event loops |
| Global state everywhere | Dependency injection, PSR standards |
| `include`/`require` chains | PSR-4 autoloading |
| No annotations | Native attributes (`#[...]`) |

---

## 5. Key Frameworks

### Laravel --- The Dominant Force

**Current version: Laravel 13** (March 17, 2026). Requires PHP 8.3+.

Laravel is to PHP what Rails was to Ruby: the framework that made the language exciting again. Created by **Taylor Otwell** in 2011, it has become the most popular PHP framework by a wide margin, powering over 960,000 websites and holding >50% of the PHP framework market.

Key characteristics:
- **Elegant syntax** --- "the framework for web artisans"
- **Eloquent ORM** --- ActiveRecord pattern with beautiful API
- **Blade templating** --- compiled templates with inheritance
- **Artisan CLI** --- code generation, migrations, queues
- **First-party ecosystem**: Forge (deployment), Vapor (serverless on AWS), Nova (admin panels), Envoyer (zero-downtime deploys), Livewire (reactive frontends without JS), Herd (local development)
- **Laravel 13 additions**: PHP attributes across models/controllers/jobs, first-party AI SDK (production-stable), multi-tenancy in starter kits, JSON:API support

Laravel's Laracasts educational platform has become one of the best programming tutorial sites on the internet, further cementing the ecosystem.

### Symfony --- The Enterprise Standard

**Current version: Symfony 7.4 LTS** (March 2026). Symfony 8.0 released November 2025.

Created by **Fabien Potencier** and SensioLabs (2005). Symfony is a set of reusable PHP components AND a full-stack framework:

- **Component-based architecture** --- 50+ decoupled components usable independently
- **The foundation layer** --- Laravel, Drupal 8+, phpBB, and dozens of other projects use Symfony components internally
- **Enterprise-grade** --- used by major corporations, government agencies
- **Predictable releases** --- time-based: minor every 6 months, major every 2 years, LTS versions
- **Flex + Recipes** --- automated configuration via Composer plugins

Symfony's components (HttpFoundation, Console, Routing, DependencyInjection, etc.) are among the most downloaded packages on Packagist. Even if you use Laravel, you are using Symfony.

### Slim --- The Micro-Framework

A lightweight framework for APIs and small applications. PSR-7/PSR-15 compliant. Think of it as PHP's answer to Sinatra (Ruby) or Flask (Python).

### CakePHP --- Convention Over Configuration

One of PHP's oldest frameworks (2005). Rails-inspired. Strong conventions, built-in ORM, scaffolding, and bake CLI. Solid for rapid prototyping.

### CodeIgniter --- The Lightweight Veteran

Small footprint, near-zero configuration, excellent documentation. Popular in Asia and for projects where a full framework is overkill. CodeIgniter 4 is a modern rewrite.

### Yii --- High Performance

"Yes It Is" framework. Component-based, strong caching support, code generation via Gii. Popular for high-traffic applications. Yii 3 is a modernized rewrite.

---

## 6. The "Hand in Hand" Angle: Perl and PHP as Complementary Tools

### CGI Siblings

Perl and PHP grew up together in the CGI era (roughly 1995--2003). They were not competitors so much as **complementary tools** in the same web stack:

| Role | Perl | PHP |
|------|------|-----|
| **Web presentation** | Possible but clunky (CGI.pm, Template Toolkit) | Native strength --- HTML with embedded code |
| **Text processing** | The king --- regex, file parsing, log analysis | Capable but secondary |
| **System administration** | The glue language --- cron jobs, deployment scripts | Rarely used for sysadmin |
| **Database scripting** | DBI + DBD drivers | mysqli, PDO |
| **One-liners** | `perl -pe 's/foo/bar/g'` | Not designed for this |
| **Rapid web forms** | Possible via CGI.pm | Trivially easy --- `$_GET`, `$_POST` |

### The Typical Dual-Language Shop (circa 2000--2008)

A common architecture in the LAMP era:

```
[Browser] --> [Apache + mod_php] --> PHP handles web pages
                                     |
                                     v
                              [MySQL database]
                                     ^
                                     |
              [Perl cron jobs] --> ETL, log processing, reports
              [Perl scripts]  --> data import, file transformation
              [Perl daemons]  --> queue workers, monitoring
```

PHP served the web-facing layer; Perl handled everything behind the curtain. Many developers were fluent in both.

### Shared DNA

The languages share enough syntax that switching between them was natural:

```perl
# Perl
my %config = (host => 'localhost', port => 3306);
foreach my $key (keys %config) {
    print "Key: $key, Value: $config{$key}\n";
}
```

```php
// PHP
$config = ['host' => 'localhost', 'port' => 3306];
foreach ($config as $key => $value) {
    echo "Key: $key, Value: $value\n";
}
```

Both languages:
- Use `$` for variables
- Have associative arrays / hashes as a core data structure
- Use PCRE (Perl-Compatible Regular Expressions) --- PHP literally named its regex engine after Perl
- Support string interpolation in double-quoted strings
- Have C-like syntax with Perl's pragmatism
- Favor "there's more than one way to do it" over rigid syntax

### The `mod_*` Era

Apache's module system was the bridge:

- **`mod_perl`** (1996) --- embedded a Perl interpreter in Apache. Persistent connections, startup scripts, full Apache API access. Powerful but complex.
- **`mod_php`** (1997) --- embedded a PHP interpreter in Apache. Zero configuration. Just drop a `.php` file in the document root.

`mod_php`'s simplicity won the adoption war. `mod_perl` was more powerful but required understanding Apache internals. This divergence foreshadowed the languages' different trajectories: Perl toward power users and system complexity, PHP toward ease-of-use and web accessibility.

### Where They Diverged

By the mid-2000s, the paths split:

- **PHP** leaned into frameworks (Symfony 2005, Laravel 2011), got Composer (2012), modernized its type system, and rode WordPress to world domination
- **Perl** maintained its sysadmin/text-processing niche, gained Moose (OOP) and CPAN remained excellent, but never had its "Laravel moment" for web development

The irony: PHP absorbed Perl's best ideas (regex, string handling, pragmatic typing) and applied them to the web-specific domain that Perl had pioneered but never optimized for.

---

## 7. Who Uses PHP

### Major Companies and Platforms

| Organization | PHP Usage |
|---|---|
| **Facebook / Meta** | Originally 100% PHP. Created **HHVM** (HipHop Virtual Machine) and **Hack** (a PHP-derived language with static typing and generics). Facebook still runs on Hack/HHVM --- the largest PHP-derived codebase in the world. HHVM dropped PHP compatibility in v4.0 (2019). |
| **Wikipedia / Wikimedia** | MediaWiki is PHP. All of Wikipedia, Wiktionary, Wikidata, Wikimedia Commons --- PHP. |
| **WordPress.com / Automattic** | The WordPress hosting platform + Tumblr (acquired) + WooCommerce. One of the largest PHP deployments. |
| **Etsy** | E-commerce marketplace. PHP monolith that handles billions of dollars in transactions. |
| **Slack** | Server-side application logic is primarily PHP (Hack). |
| **Mailchimp** | Email marketing platform --- PHP backend. |
| **Tumblr** | Originally built on PHP, now under Automattic. |
| **Lyft** | Uses PHP to run its ride-sharing database infrastructure. |
| **Spotify** | Backend services use PHP alongside other languages. |
| **Baidu** | China's largest search engine uses PHP extensively. |
| **Vimeo** | Video platform built on PHP. |

### The Facebook/Hack Story in Detail

Facebook's PHP journey is one of the most remarkable in software history:

1. **2004**: Zuckerberg writes Facebook in PHP
2. **2008**: Facebook is hitting scaling walls. PHP is too slow for billions of requests.
3. **2010**: **HipHop for PHP (HPHPc)** --- a transpiler that converts PHP to C++, then compiles to native binary. 50% CPU reduction.
4. **2013**: HPHPc replaced by **HHVM** --- a JIT-compiling virtual machine for PHP. Even better performance.
5. **2014**: Facebook releases **Hack** --- a gradually-typed PHP derivative with generics, async/await, and collections. Runs on HHVM.
6. **2017**: HHVM announces it will drop PHP support to focus on Hack.
7. **2019**: HHVM 4.0 ships with no PHP support. Facebook/Meta is now a Hack shop.

The PHP community's response was PHP 7 (2015), which doubled performance and proved that mainstream PHP could close the gap without forking the language. PHP 8's JIT narrowed it further.

---

## 8. Learning Resources

### Official and Canonical

| Resource | Description |
|----------|-------------|
| **[php.net](https://www.php.net)** | The official PHP manual. One of the best language references in existence. Every function documented with examples and user-contributed notes. |
| **[PHP: The Right Way](https://phptherightway.com/)** | Community-maintained guide to modern PHP best practices. The antidote to outdated tutorials. Covers coding standards, dependency management, security, testing, deployment. |
| **[PHP RFC Wiki](https://wiki.php.net/rfc)** | Every proposed language change goes through the RFC process. Reading active RFCs is the best way to understand where PHP is heading. |
| **[PHP.Watch](https://php.watch/)** | Detailed coverage of every PHP version's changes, RFC tracking, and ecosystem analysis. |

### Educational Platforms

| Resource | Description |
|----------|-------------|
| **[Laracasts](https://laracasts.com/)** | Jeffrey Way's screencast platform. Primarily Laravel-focused but covers general PHP, testing, tooling, and software design. Arguably the best programming tutorial platform in any language. |
| **[SymfonyCasts](https://symfonycasts.com/)** | Official Symfony tutorial platform. Deep dives into Symfony components, API development, security, and PHP internals. |
| **[PHP Internals News](https://phpinternals.news/)** | Podcast by Derick Rethans (PHP core contributor, Xdebug creator) interviewing RFC authors about upcoming language changes. |

### The RFC Process

PHP's evolution is governed by a democratic RFC (Request for Comments) process:

1. **Draft**: Anyone can write an RFC on the PHP wiki using the standard template
2. **Discussion**: Posted to `internals@lists.php.net` for community feedback (minimum 2 weeks)
3. **Voting**: PHP contributors vote. Language changes require 2/3 supermajority; other changes require simple majority.
4. **Implementation**: Accepted RFCs get implemented and targeted at a specific PHP version

The RFC process replaced the earlier "benevolent dictator" model and has been credited with PHP's remarkable modernization since PHP 7. Notable recent RFCs include Property Hooks (8.4), the Pipe Operator (8.5), and the ongoing RFC for Pattern Matching.

### Books

- **"PHP 8 Objects, Patterns, and Practice"** by Matt Zandstra --- the definitive PHP OOP book
- **"Laravel Up & Running"** by Matt Stauffer --- canonical Laravel reference
- **"Modern PHP"** by Josh Lockhart (creator of Slim framework) --- modern practices guide

---

## Summary: PHP's Position in 2026

PHP in 2026 is not the PHP that developers mocked in 2010. It is a **statically-typeable, JIT-compiled, async-capable language** with a mature package ecosystem (400K+ packages), the dominant web framework (Laravel), and an installed base that no other server-side language comes close to matching.

Its Perl heritage remains visible in its syntax and pragmatic philosophy, but PHP has charted its own course: where Perl became the Swiss Army chainsaw for system administrators and text wranglers, PHP became the language that made the web accessible to millions of developers --- and then grew up into something genuinely powerful.

The language that started as one programmer's Perl scripts for tracking resume views now powers three-quarters of the server-side web. That is a remarkable origin story.

---

*Part of the Perl Research Series --- exploring the constellation of languages, tools, and ecosystems that orbit Perl's gravitational influence on modern computing.*
