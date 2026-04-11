# Enterprise SOA: The Classical Stack

**Scope:** XML-RPC, SOAP, WSDL, UDDI, the WS-* specification family, Enterprise Service Buses, BPEL, SOA governance, and the vendors and tools of the 2000s enterprise era.

**Reader assumption:** You are a modern developer who has heard of SOAP but never actually had to use it in anger. This document walks you through the classical enterprise SOA stack as it was actually practiced between roughly 1998 and 2015, with real code and configuration examples.

**Scope exclusion:** This document deliberately does not cover the history of distributed computing (CORBA, DCOM, RMI), SOA principles in the abstract, or the modern REST/gRPC/service-mesh/microservices era. Those are covered by sibling documents.

---

## Table of Contents

1. [XML-RPC — the simpler ancestor](#1-xml-rpc--the-simpler-ancestor)
2. [SOAP — Simple Object Access Protocol](#2-soap--simple-object-access-protocol)
3. [WSDL — Web Services Description Language](#3-wsdl--web-services-description-language)
4. [UDDI — Universal Description, Discovery and Integration](#4-uddi--universal-description-discovery-and-integration)
5. [The WS-* specification family](#5-the-ws-specification-family)
6. [SOAP toolkits and vendors](#6-soap-toolkits-and-vendors)
7. [Enterprise Service Buses (ESB)](#7-enterprise-service-buses-esb)
8. [Apache Camel — a deeper look](#8-apache-camel--a-deeper-look)
9. [Enterprise Integration Patterns](#9-enterprise-integration-patterns)
10. [BPEL — Business Process Execution Language](#10-bpel--business-process-execution-language)
11. [SOA governance](#11-soa-governance)
12. [Enterprise tooling](#12-enterprise-tooling)
13. [Certification and accreditation](#13-certification-and-accreditation)
14. [The enterprise SOA playbook (2005 vintage)](#14-the-enterprise-soa-playbook-2005-vintage)
15. [SOAP vs REST — the debate that defined an era](#15-soap-vs-rest--the-debate-that-defined-an-era)
16. [Why enterprise SOA failed](#16-why-enterprise-soa-failed)
17. [What enterprise SOA got right](#17-what-enterprise-soa-got-right)
18. [Legacy enterprise SOA today (2025-2026)](#18-legacy-enterprise-soa-today-2025-2026)

---

## 1. XML-RPC — the simpler ancestor

Before SOAP, before WSDL, before the WS-* swamp, there was XML-RPC. It was an accident that became a protocol that became an ancestor, and its story is essential to understanding how the enterprise SOA stack accumulated the weight it eventually could not carry.

### 1.1 Origins: Dave Winer and Microsoft, 1998

The XML-RPC story begins in early 1998 in a series of phone calls and emails between Dave Winer of UserLand Software and a group at Microsoft that included Don Box, Mohsen Al-Ghosein, and Bob Atkinson. Winer had been building Frontier, a scripting environment for the Mac, and he needed a way to let his scripts talk to servers across the internet. Microsoft had been working on something called "SOAP" — which at that stage stood for nothing in particular and was not yet a public protocol — as a way to let DCOM objects talk across HTTP.

The two sides had different goals. Winer wanted something simple enough that a scripter could understand the wire format by reading it. Microsoft wanted something rich enough to carry COM calls, including object references and transactional context. They could not agree on scope, so they agreed to ship two specifications. Winer took the simple subset they had agreed on, wrote it up in a weekend, and posted XML-RPC at xmlrpc.com in June 1998. Microsoft took the richer vision and kept working on it, eventually producing SOAP 0.9 in September 1999 as a Microsoft-only publication, then handing it to the W3C in 2000.

This fork is the original sin of the enterprise SOA stack. From day one there was a tension between "simple enough to understand" and "rich enough to carry everything an enterprise middleware might want." XML-RPC picked the first horn; SOAP picked the second; and for the next fifteen years the enterprise world paid the price.

### 1.2 The XML-RPC specification

The entire XML-RPC specification fits on a single web page. The complete list of wire types is:

- `<i4>` or `<int>` — four-byte signed integer
- `<boolean>` — 0 or 1
- `<string>` — ASCII string (though many implementations treat it as UTF-8)
- `<double>` — double precision signed floating point
- `<dateTime.iso8601>` — ISO 8601 date/time
- `<base64>` — base64-encoded binary
- `<struct>` — a collection of named values
- `<array>` — an ordered list of values

That is it. There is no schema language, no type extension mechanism, no namespace, no attachment format, no security story, no session concept, no addressing, no routing, no transaction context. The entire protocol is: POST an XML document to an HTTP endpoint, get an XML document back.

### 1.3 A worked XML-RPC example

Here is a real XML-RPC request against a WordPress blog, asking for the most recent post:

```http
POST /xmlrpc.php HTTP/1.1
User-Agent: Frontier/5.1.2 (WinNT)
Host: example.com
Content-Type: text/xml
Content-Length: 381

<?xml version="1.0"?>
<methodCall>
  <methodName>metaWeblog.getRecentPosts</methodName>
  <params>
    <param>
      <value><string>1</string></value>
    </param>
    <param>
      <value><string>admin</string></value>
    </param>
    <param>
      <value><string>hunter2</string></value>
    </param>
    <param>
      <value><int>1</int></value>
    </param>
  </params>
</methodCall>
```

And the response:

```http
HTTP/1.1 200 OK
Connection: close
Content-Length: 612
Content-Type: text/xml
Date: Fri, 17 Jul 1998 19:55:08 GMT
Server: UserLand Frontier/5.1.2-WinNT

<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
      <value>
        <array>
          <data>
            <value>
              <struct>
                <member>
                  <name>postid</name>
                  <value><string>42</string></value>
                </member>
                <member>
                  <name>title</name>
                  <value><string>Hello, world</string></value>
                </member>
                <member>
                  <name>dateCreated</name>
                  <value><dateTime.iso8601>19980717T14:08:55</dateTime.iso8601></value>
                </member>
                <member>
                  <name>description</name>
                  <value><string>My first post</string></value>
                </member>
              </struct>
            </value>
          </data>
        </array>
      </value>
    </param>
  </params>
</methodResponse>
```

A fault looks like this:

```xml
<?xml version="1.0"?>
<methodResponse>
  <fault>
    <value>
      <struct>
        <member>
          <name>faultCode</name>
          <value><int>403</int></value>
        </member>
        <member>
          <name>faultString</name>
          <value><string>Incorrect username or password.</string></value>
        </member>
      </struct>
    </value>
  </fault>
</methodResponse>
```

A Python client using the standard library `xmlrpc.client` module looks like:

```python
import xmlrpc.client

server = xmlrpc.client.ServerProxy("https://example.com/xmlrpc.php")
posts = server.metaWeblog.getRecentPosts("1", "admin", "hunter2", 1)
print(posts[0]["title"])
```

That is the entire client code. No WSDL to generate, no stub classes, no SOAP headers, no endpoint binding. It is three lines.

### 1.4 Why "simple enough" eventually wasn't enough

XML-RPC has three fatal limitations for enterprise use, and they are instructive because every one of them became a WS-* specification:

**No schema.** You cannot tell an XML-RPC endpoint "I want to send you a struct with fields `firstName`, `lastName`, and `dateOfBirth`, where `dateOfBirth` must be before today." You send a struct; if the server does not like it, you get a fault at runtime. Enterprise developers wanted compile-time type checking and generated client stubs. This became WSDL and XML Schema.

**No extensibility.** The eight wire types are the eight wire types. You cannot add a ninth. You cannot carry a user principal, a transaction ID, a reliability sequence number, or a digital signature without overloading the struct with magic field names that the receiver has to know about out of band. Enterprise developers wanted a formal extension mechanism. This became SOAP headers and the WS-* stack.

**No discovery.** There is no way to ask an XML-RPC endpoint "what methods do you support?" other than calling `system.listMethods`, which is an optional convention. There is no machine-readable description of the methods, their parameters, or their return types. Enterprise developers wanted a registry of services, a way to search for "all services that expose a customer lookup," and an automated way to bind to them. This became UDDI.

Every single one of these limitations was real for the use cases that IBM and Microsoft and BEA were selling to Fortune 500 banks. But — and this is the cruel irony — every single one of the WS-* solutions to them was so heavy that most teams would have been better off with XML-RPC plus some discipline.

### 1.5 XML-RPC's surviving niches

XML-RPC did not die. It became load-bearing infrastructure in a surprisingly large slice of the web, all because it was simple enough to implement in a weekend and good enough for most publishing use cases.

**WordPress.** Every WordPress site ships with `xmlrpc.php`. The MetaWeblog API, the WordPress API, and the Blogger API are all XML-RPC. Desktop blog editors like MarsEdit, Windows Live Writer, and ecto all spoke XML-RPC to WordPress. Even as of the mid-2020s, most WordPress installations still have XML-RPC enabled, though security concerns have led many hosts to disable it by default.

**Trackbacks and pingbacks.** The trackback protocol, which let one blog tell another "I linked to your post," was XML-RPC. Pingbacks, a slightly later evolution, were also XML-RPC. For a brief period in the early 2000s, trackbacks were the connective tissue of the blogosphere.

**Atom Publishing Protocol's ancestor.** The Blogger API, which Google's Blogger service exposed, was XML-RPC. It was eventually superseded by AtomPub (which was REST), but XML-RPC was the bridge.

**Python's SimpleXMLRPCServer.** Python shipped XML-RPC in the standard library from Python 2.2 (2001) onward. It is still there today as `xmlrpc.server` and `xmlrpc.client`. Generations of Python developers have written throwaway RPC services with it.

**Supervisor.** The Supervisor process control system uses XML-RPC as its control protocol. `supervisorctl` talks to `supervisord` over XML-RPC.

**Odoo / OpenERP.** The Odoo ERP system exposes its entire data model over XML-RPC. Partners integrating with Odoo still write XML-RPC clients in 2025.

**Ubuntu Pastebin.** The original Ubuntu pastebin accepted pastes via XML-RPC.

XML-RPC's lesson is the lesson that enterprise SOA refused to learn: if you make it simple enough to be used casually, it will be used casually, and that casual use will compound into infrastructure. If you make it complicated enough to require tooling and training and vendor support, it will be used formally, and that formal use will eventually be regretted.

---

## 2. SOAP — Simple Object Access Protocol

### 2.1 The authors and the timeline

SOAP was born from the same 1998 Microsoft/UserLand conversation that produced XML-RPC, but it took the other fork. The original authors credited on the September 1999 SOAP 0.9 specification were Don Box (DevelopMentor), Dave Winer (UserLand), Bob Atkinson (Microsoft), and Mohsen Al-Ghosein (Microsoft). Don Box would go on to become the public face of SOAP through his book "Essential SOAP" and his work on the .NET Framework. Dave Winer would, within a year, publicly distance himself from SOAP as it grew beyond what he thought was reasonable.

The specification timeline:

- **September 1999** — SOAP 0.9, published as a Microsoft Note, effectively private.
- **December 1999** — SOAP 1.0, slightly revised, still Microsoft.
- **May 2000** — SOAP 1.1 submitted to the W3C as a W3C Note by Microsoft, IBM, Lotus, UserLand, and DevelopMentor. The IBM signature was the pivot point. Once IBM was on board, the enterprise middleware vendors fell in line: BEA, Sun, Oracle, SAP, and the Java community all committed to SOAP as the web services wire format.
- **September 2000** — The W3C chartered the XML Protocol Working Group to produce a formal W3C Recommendation.
- **June 2003** — SOAP 1.2 became a W3C Recommendation. The Working Group deliberately dropped the expansion "Simple Object Access Protocol" because, by then, SOAP was neither simple, nor about objects, nor strictly about access. In SOAP 1.2 the letters simply stand for themselves.

Between SOAP 1.1 and SOAP 1.2, the industry built an enormous amount of SOAP 1.1 infrastructure. SOAP 1.2 was technically cleaner but practically everyone stayed on SOAP 1.1 for years, because every toolkit, every WSDL file, and every enterprise service was bound to SOAP 1.1. Most WS-* specifications were written against SOAP 1.1. If you encounter SOAP in the wild today, it is almost always 1.1.

### 2.2 The SOAP envelope structure

A SOAP message is an XML document with a specific root element structure. The outermost element is the Envelope, which contains an optional Header and a mandatory Body. The Body contains either a payload or a Fault, but not both.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <!-- optional header blocks, each namespaced -->
  </soap:Header>
  <soap:Body>
    <!-- exactly one payload element OR one soap:Fault element -->
  </soap:Body>
</soap:Envelope>
```

For SOAP 1.2 the namespace is `http://www.w3.org/2003/05/soap-envelope` rather than `http://schemas.xmlsoap.org/soap/envelope/`. A SOAP 1.1 processor rejects SOAP 1.2 messages and vice versa; the namespace is the version discriminator.

**Headers** are the extensibility point. A header block is any XML element directly inside `<soap:Header>`. It can have two SOAP-defined attributes: `mustUnderstand` and `actor` (SOAP 1.1) or `role` (SOAP 1.2). If `mustUnderstand="1"` and the receiver does not understand the header, it must return a fault and not process the message. This is the hook on which the entire WS-* stack is hung: WS-Security adds a `<wsse:Security>` header, WS-Addressing adds a `<wsa:To>` header, WS-ReliableMessaging adds a `<wsrm:Sequence>` header, and so on.

**Body** is the payload. In document style it contains an arbitrary XML element defined by the service's WSDL. In RPC style it contains an element named after the operation, whose children are the parameters.

**Fault** is the error channel. A SOAP fault looks like this (SOAP 1.1):

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Client</faultcode>
      <faultstring>Invalid account number</faultstring>
      <faultactor>http://bank.example.com/accounts</faultactor>
      <detail>
        <err:AccountFault xmlns:err="http://bank.example.com/errors">
          <err:accountNumber>00000000</err:accountNumber>
          <err:reason>ACCOUNT_NOT_FOUND</err:reason>
        </err:AccountFault>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>
```

The four SOAP 1.1 fault codes are `VersionMismatch`, `MustUnderstand`, `Client`, and `Server`. SOAP 1.2 restructured this into a hierarchy with `Code`, `Reason`, `Node`, `Role`, and `Detail` subelements, and replaced `Client`/`Server` with `Sender`/`Receiver`. Again, almost all production SOAP is 1.1, so you will see the older structure most often.

### 2.3 A worked SOAP request and response

Here is a SOAP 1.1 request to a hypothetical currency conversion service, converting 100 USD to EUR:

```http
POST /currency/convert HTTP/1.1
Host: fx.example.com
Content-Type: text/xml; charset=utf-8
Content-Length: 512
SOAPAction: "http://fx.example.com/currency/Convert"

<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   soap:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>client42</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">hunter2</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <fx:Convert xmlns:fx="http://fx.example.com/currency">
      <fx:amount>100.00</fx:amount>
      <fx:from>USD</fx:from>
      <fx:to>EUR</fx:to>
      <fx:rateDate>2006-03-15</fx:rateDate>
    </fx:Convert>
  </soap:Body>
</soap:Envelope>
```

Notice the `SOAPAction` HTTP header. This is a SOAP 1.1 peculiarity: every request must carry a `SOAPAction` header whose value is a URI that identifies the operation being invoked. In SOAP 1.2 this was folded into the `Content-Type` as an `action` parameter. The `SOAPAction` header is notorious because it was supposed to allow firewalls and routers to filter SOAP traffic without parsing the body, but in practice almost everyone ignored it, and the quoting rules around it caused endless interop bugs. Some toolkits sent `SOAPAction: ""`, some sent `SOAPAction: ""` with the quotes literal, some sent no header at all. The WS-I Basic Profile eventually had to legislate the exact format.

The response:

```http
HTTP/1.1 200 OK
Content-Type: text/xml; charset=utf-8
Content-Length: 384

<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <fx:ConvertResponse xmlns:fx="http://fx.example.com/currency">
      <fx:result>
        <fx:amount>83.42</fx:amount>
        <fx:currency>EUR</fx:currency>
        <fx:rateUsed>0.8342</fx:rateUsed>
        <fx:rateDate>2006-03-15</fx:rateDate>
      </fx:result>
    </fx:ConvertResponse>
  </soap:Body>
</soap:Envelope>
```

Compare this to the equivalent XML-RPC. The SOAP version is roughly three times the bytes on the wire, and every field required a schema definition, a WSDL fragment, and generated stub code. It is also significantly more structured — the namespace disambiguation means a mediator can route on `{http://fx.example.com/currency}Convert` without guessing. The enterprise pitch was that this verbosity paid for itself in tooling. The counter-pitch from the REST camp was that nobody's tooling actually worked well enough to justify the complexity.

### 2.4 SOAP over transports other than HTTP

One of SOAP's explicit design goals was transport neutrality. An envelope could travel over any transport that could carry an opaque blob. HTTP was the most common transport, but the specification explicitly envisioned others, and in practice several were widely used.

**SOAP over HTTP(S).** By far the dominant binding. A request is an HTTP POST with `Content-Type: text/xml` (SOAP 1.1) or `application/soap+xml` (SOAP 1.2). Responses come back on the same HTTP connection. This is the "normal" SOAP you almost always encounter.

**SOAP over SMTP.** Yes, really. The SOAP specification described how to put a SOAP envelope in an email message and let it travel through store-and-forward mail relays. The `From` and `To` headers of the mail became the sender and receiver of the message. This was almost never used in practice, but it was in the spec, and a few asynchronous B2B scenarios used it in the early 2000s. The advantage was that you got retry, queueing, and loose coupling for free; the disadvantage was that you got retry, queueing, and loose coupling for free, which meant hours of latency and no easy way to correlate responses.

**SOAP over JMS.** This was a big deal in the Java enterprise world. JMS (Java Message Service) was the Java API for messaging, and every enterprise had a JMS broker (IBM MQ, TIBCO EMS, SonicMQ, ActiveMQ, WebLogic JMS). Putting SOAP over JMS meant you got persistent queues, guaranteed delivery, and transactional enlistment for free. The downside was that the JMS binding for SOAP was not standardized until quite late — Sun published a JSR (JSR 914 was JMS itself, the SOAP-over-JMS binding came much later as JSR 921 attempts and eventually W3C Member Submission in 2008), and before that every vendor had their own incompatible variant. A request over SOAP/JMS looked something like:

```java
// Sender side, using Spring JMS
Message request = session.createTextMessage(soapEnvelopeXml);
request.setStringProperty("SOAPJMS_contentType", "text/xml; charset=utf-8");
request.setStringProperty("SOAPJMS_soapAction", "http://fx.example.com/currency/Convert");
request.setStringProperty("SOAPJMS_targetService", "Convert");
request.setStringProperty("SOAPJMS_bindingVersion", "1.0");
request.setJMSReplyTo(replyQueue);
request.setJMSCorrelationID(UUID.randomUUID().toString());
producer.send(request);
```

**SOAP over IBM MQ.** Before JMS became universal, IBM MQ (originally MQSeries) had its own SOAP binding, which IBM documented in redbooks. It was very popular inside IBM shops and nowhere else.

**SOAP over raw TCP.** A few specialized toolkits supported this. Microsoft's WCF had a `netTcpBinding` that sent SOAP envelopes over a binary-framed TCP connection. This was much faster than SOAP over HTTP because it avoided the HTTP framing and the text XML — WCF would use a binary XML encoding called "MTOM" or just its own fast infoset format. `netTcpBinding` was WCF-to-WCF only; no other toolkit spoke it.

**SOAP over UDP.** Yes, also real. WS-Discovery used multicast UDP to announce the presence of services on a local network. Microsoft's device discovery protocol (used by printers announcing themselves on your LAN via Web Services for Devices) was SOAP over UDP.

The lesson of SOAP's transport neutrality is that "transport neutral" is a feature that sounds wonderful in architecture diagrams and is a nightmare in practice. The moment you have SOAP-over-HTTP, SOAP-over-JMS, and SOAP-over-MQ in the same enterprise, your routing layer needs to know about all three, your security story fragments across three transports, and your tooling only half-works for any of them. Every enterprise that bought into the transport-neutrality pitch eventually regretted it.

### 2.5 SOAP encoding styles — the four variants

This section is the single most confusing part of SOAP for anyone encountering it for the first time, so pay attention. SOAP specified not one wire format but four, and the distinctions between them mattered enormously for interop.

The two orthogonal axes are **style** (RPC vs Document) and **use** (encoded vs literal).

**Style** determines the structure of the Body. In **RPC style**, the Body contains a single element named after the operation, and the children of that element are the parameters:

```xml
<soap:Body>
  <fx:Convert>
    <amount>100.00</amount>
    <from>USD</from>
    <to>EUR</to>
  </fx:Convert>
</soap:Body>
```

In **Document style**, the Body contains an arbitrary XML document defined by the service's WSDL. There is no requirement that its root element match the operation name:

```xml
<soap:Body>
  <ConversionRequest xmlns="http://fx.example.com/currency">
    <Amount>100.00</Amount>
    <FromCurrency>USD</FromCurrency>
    <ToCurrency>EUR</ToCurrency>
  </ConversionRequest>
</soap:Body>
```

**Use** determines how the XML inside the Body is typed. In **encoded** use (specifically, SOAP Section 5 encoding), the XML carries explicit type annotations:

```xml
<soap:Body>
  <fx:Convert>
    <amount xsi:type="xsd:decimal">100.00</amount>
    <from xsi:type="xsd:string">USD</from>
    <to xsi:type="xsd:string">EUR</to>
  </fx:Convert>
</soap:Body>
```

The encoding rules also defined how to represent arrays, structs, and object references. The key feature — and the key problem — was that encoded messages could carry back-references using `href` and `id` attributes, to represent shared or cyclic object graphs:

```xml
<soap:Body soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <m:addEmployee xmlns:m="urn:hr">
    <employee href="#id1"/>
    <manager href="#id1"/>
  </m:addEmployee>
  <multiRef id="id1" xsi:type="hr:Person">
    <name>Alice</name>
    <email>alice@example.com</email>
  </multiRef>
</soap:Body>
```

This was a direct import of CORBA and Java serialization semantics. It was also an interop nightmare, because no two encoded-SOAP toolkits implemented the rules quite the same way. The WS-I Basic Profile 1.0 eventually **banned** SOAP encoding from compliant services.

In **literal** use, the XML in the Body conforms directly to an XML Schema definition — no `xsi:type` annotations, no `href`/`id` tricks, just a plain XML document that an XSD validator can validate. This is what almost all production SOAP uses today.

That gives four combinations:

1. **RPC/encoded.** The original SOAP 1.1 "default" style. Interop nightmare. Banned by WS-I BP 1.0. Do not use. You will still find it in legacy Axis 1 services from 2003.
2. **RPC/literal.** RPC body structure but literal XML typing. Allowed by WS-I BP 1.0 but rarely used in practice.
3. **Document/encoded.** Theoretically possible. Nobody ever used it. Banned by WS-I BP 1.0.
4. **Document/literal.** The winner.

### 2.6 Document/literal wrapped — the dominant style

Within document/literal, there was a further subdivision called the "wrapped" convention, and this is what nearly all modern SOAP services use.

The problem with plain document/literal is that the Body contains an arbitrary element, and the receiver has no easy way to dispatch the request to the correct operation without looking at the `SOAPAction` header (which, remember, is unreliable). The wrapped convention solves this by insisting that the Body contain exactly one element, whose name matches the operation name, and whose children are the parameters. This gives you the dispatchability of RPC style and the schema-pure typing of document/literal:

```xml
<soap:Body>
  <fx:Convert xmlns:fx="http://fx.example.com/currency">
    <fx:amount>100.00</fx:amount>
    <fx:from>USD</fx:from>
    <fx:to>EUR</fx:to>
  </fx:Convert>
</soap:Body>
```

That looks identical to RPC style. The difference is in the WSDL: in document/literal wrapped, there is an actual XSD element named `Convert` with a complexType wrapping `amount`, `from`, and `to`. In RPC style, the `Convert` element is synthesized from the operation name and is not itself in any schema.

Why does this matter? Because document/literal wrapped WSDL can be validated by a schema-aware XML parser without any SOAP-specific knowledge. You can hand the XML to any XSD validator, any data binding tool, any XML editor, and they all know what to do. RPC style requires SOAP-aware tooling to synthesize the wrapping element. The tooling-independence of document/literal wrapped is what made it the winner.

Microsoft's WCF used document/literal wrapped by default. Apache Axis2 used document/literal (unwrapped) by default but supported wrapped. Apache CXF used document/literal wrapped by default. By around 2007, if you were starting a new SOAP service, you used document/literal wrapped; if you were consuming an existing service, you held your nose and dealt with whatever it happened to use.

### 2.7 SOAP with Attachments, MTOM, and XOP

SOAP's XML-only body was a problem for binary data. Base64-encoding a 10 MB image inflates it by 33% and costs CPU on both ends. The industry produced two solutions.

**SOAP with Attachments (SwA)**, published as a W3C Note in December 2000, wrapped the SOAP envelope inside a MIME multipart message. The SOAP envelope was the first MIME part; the binary data was a second part, referenced from the SOAP body via a `href="cid:..."` attribute pointing at the Content-ID of the attached part. It looked like this on the wire:

```http
POST /receive HTTP/1.1
Host: example.com
Content-Type: multipart/related; type="text/xml"; boundary="MIME_boundary"; start="<soap@example.com>"
SOAPAction: "http://example.com/receive"

--MIME_boundary
Content-Type: text/xml; charset=UTF-8
Content-Transfer-Encoding: 8bit
Content-ID: <soap@example.com>

<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <m:uploadImage xmlns:m="http://example.com/images">
      <m:filename>cat.jpg</m:filename>
      <m:image href="cid:image@example.com"/>
    </m:uploadImage>
  </soap:Body>
</soap:Envelope>
--MIME_boundary
Content-Type: image/jpeg
Content-Transfer-Encoding: binary
Content-ID: <image@example.com>

...raw JPEG bytes here...
--MIME_boundary--
```

SwA worked but had interop problems. The reference from the SOAP body to the MIME part was not schema-valid XML (the `href` attribute was not defined in any standard XSD for the body element), so validators choked. Different toolkits handled it differently. IBM and BEA in particular wanted something better.

**MTOM (Message Transmission Optimization Mechanism)**, a W3C Recommendation in January 2005, replaced SwA. It paired with **XOP (XML-binary Optimized Packaging)** to define a cleaner story. An MTOM/XOP message still uses MIME multipart under the hood, but the schema sees the binary data as a `xsd:base64Binary` element. On the wire the element is replaced with an `<xop:Include>` reference to a MIME part:

```xml
<soap:Body>
  <m:uploadImage xmlns:m="http://example.com/images">
    <m:filename>cat.jpg</m:filename>
    <m:image>
      <xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include"
                   href="cid:image@example.com"/>
    </m:image>
  </m:uploadImage>
</soap:Body>
```

From the schema's point of view, `m:image` is still a `base64Binary` element. If the receiver does not support XOP, it can reconstruct the canonical form by inlining the MIME part's bytes as base64. If both sides support XOP, the bytes go on the wire as raw binary, and you get the bandwidth savings.

MTOM became the standard for SOAP-with-binary, and every major toolkit (WCF, CXF, Axis2, Metro) supported it. In practice it worked well enough, though the MIME framing still caused occasional interop bugs and the configuration knobs varied between toolkits.

### 2.8 Headers as the extensibility point

This is where the WS-* swamp comes from. SOAP headers are the formal extension point, and the SOAP specification says almost nothing about what can go in them. Anyone can define a namespace, drop an element into `<soap:Header>`, and insist that receivers process it if `mustUnderstand="1"`.

The WS-* specifications are, almost without exception, schemas for header blocks. WS-Security defines a `<wsse:Security>` header. WS-Addressing defines `<wsa:To>`, `<wsa:From>`, `<wsa:Action>`, `<wsa:MessageID>`, `<wsa:ReplyTo>`. WS-ReliableMessaging defines `<wsrm:Sequence>` and `<wsrm:SequenceAcknowledgement>`. WS-AtomicTransaction defines `<wscoor:CoordinationContext>`. Every one of these is a chunk of XML that goes in the SOAP header.

A SOAP envelope with several WS-* headers stacked up looks like this (and this is a realistic sample of what a 2008 enterprise message actually looked like):

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <wsa:MessageID xmlns:wsa="http://www.w3.org/2005/08/addressing">
      uuid:12345678-1234-1234-1234-123456789012
    </wsa:MessageID>
    <wsa:To xmlns:wsa="http://www.w3.org/2005/08/addressing">
      http://bank.example.com/accounts
    </wsa:To>
    <wsa:Action xmlns:wsa="http://www.w3.org/2005/08/addressing">
      http://bank.example.com/accounts/GetBalance
    </wsa:Action>
    <wsa:ReplyTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <wsa:Address>http://client.example.com/inbox</wsa:Address>
    </wsa:ReplyTo>
    <wsrm:Sequence xmlns:wsrm="http://docs.oasis-open.org/ws-rx/wsrm/200702">
      <wsrm:Identifier>urn:uuid:abcdef00-0000-0000-0000-000000000001</wsrm:Identifier>
      <wsrm:MessageNumber>42</wsrm:MessageNumber>
    </wsrm:Sequence>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
                   soap:mustUnderstand="1">
      <wsu:Timestamp wsu:Id="TS-1">
        <wsu:Created>2008-06-15T14:23:45Z</wsu:Created>
        <wsu:Expires>2008-06-15T14:28:45Z</wsu:Expires>
      </wsu:Timestamp>
      <wsse:BinarySecurityToken
          EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
          ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"
          wsu:Id="X509-1">MIIBxTCCAW+gAwIBAgIQ...(truncated base64)...==</wsse:BinarySecurityToken>
      <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
          <ds:Reference URI="#Body-1">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
            <ds:DigestValue>7H...=</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>QW...=</ds:SignatureValue>
        <ds:KeyInfo>
          <wsse:SecurityTokenReference>
            <wsse:Reference URI="#X509-1"
                            ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>
          </wsse:SecurityTokenReference>
        </ds:KeyInfo>
      </ds:Signature>
    </wsse:Security>
  </soap:Header>
  <soap:Body wsu:Id="Body-1"
             xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <acc:GetBalance xmlns:acc="http://bank.example.com/accounts">
      <acc:accountNumber>12345678</acc:accountNumber>
    </acc:GetBalance>
  </soap:Body>
</soap:Envelope>
```

That envelope is about 2 KB to carry an operation whose semantic payload is "give me the balance of account 12345678." The signature alone is 400 bytes. The addressing headers are 300. The reliability sequence is 150. The timestamp is 100. And all of this had to be parsed, validated, verified, and processed by the receiver before the business logic could run. On busy services this was genuinely expensive — a fast SOAP stack could do maybe 500-2000 such messages per second per core in 2008, compared to tens of thousands of JSON-over-HTTP requests.

### 2.9 What SOAP got right

**Namespaces.** SOAP was rigorously namespaced from day one. A document/literal SOAP body's content is unambiguously typed by its element's qualified name. This turns out to matter enormously when you are mediating messages — a router can make decisions based on QNames without parsing the body, and two services in different domains can have identically-named operations without colliding.

**Headers as an extension point.** The separation of header from body was prescient. It is the same shape as HTTP headers, and the same shape as gRPC metadata, and the same shape as Kafka headers. The industry eventually reinvented this pattern everywhere.

**mustUnderstand.** The ability to mark a header as "you must process this or fail the message" is a genuinely good idea. It lets you evolve a protocol by adding new header semantics without silently losing safety. Few modern protocols have an equivalent.

**Transport neutrality (as a concept).** Even if it didn't work well in practice, the idea that the message format should not be tied to HTTP is a good one. Kafka, NATS, and gRPC-over-whatever all inherit this intuition.

**Formal fault model.** SOAP faults are structured, typed, and namespaced. Compared to "HTTP 500 with an error string," this is a genuine step up. Modern gRPC's Status message is essentially a simplified SOAP fault.

### 2.10 What SOAP got wrong

**XML.** XML is verbose, expensive to parse, and hostile to debugging. Every byte of XML a SOAP message costs CPU cycles to produce and to consume, and the final wire size is 3-5x what an equivalent JSON or binary encoding would be. In an era when bandwidth was expensive and CPUs were slow, this was a massive tax.

**Namespace verbosity.** Correct SOAP requires declaring half a dozen XML namespaces on every message. Even pretty-printed, a SOAP envelope is a wall of `xmlns:` attributes.

**RPC/encoded.** The original default encoding was a source of endless interop bugs and had to be explicitly banned by WS-I before SOAP became usable in practice. Shipping a default that was broken was a self-inflicted wound that the project never fully recovered from.

**SOAPAction.** The `SOAPAction` HTTP header added complexity, interop bugs, and no real value. It should have been the element name in the body (which is what the wrapped convention effectively does).

**The WS-* stack.** SOAP's extensibility was a loaded gun. Every "this should be standardized" impulse became a new WS-* spec, and the specs accreted at a rate faster than any toolkit could implement them correctly. By 2007 there were around 30 WS-* specifications, and no two toolkits implemented the same subset the same way.

**Tool-generated code.** The SOAP pitch depended on code generators: you point `wsimport` or `wsdl2java` at a WSDL, it generates Java classes, and you call them. In practice the generated code was ugly, non-idiomatic, fragile, and hard to version. Every SOAP toolkit generated subtly different stubs, and migrating between toolkits meant regenerating and rewriting.

**Document/literal wrapped is not in the spec.** The dominant style was a convention invented by Microsoft for WCF and informally adopted by everyone else. It was never formally standardized. This meant that the "correct" way to do SOAP was the way that the tools happened to agree on, not anything the specifications said.

**No streaming.** SOAP messages are self-contained documents. Streaming a response is not part of the model. For large payloads, you either base64-encode them into the body (bad), use MTOM attachments (complicated), or split the response into chunks (ad hoc). Modern gRPC server streaming is an obvious missing piece.

**No versioning story.** How do you evolve a SOAP interface? You add a new operation (breaking nothing but growing the WSDL). You change a schema (risking breaking clients). You version the namespace (forcing every client to migrate). Every option is bad. The WS-* community never produced a widely-adopted versioning guideline, and every SOA initiative invented its own.

---

## 3. WSDL — Web Services Description Language

### 3.1 The timeline

WSDL 1.1 was published as a W3C Note in March 2001, authored by Erik Christensen (Microsoft), Francisco Curbera (IBM), Greg Meredith (Microsoft), and Sanjiva Weerawarana (IBM). It was a W3C Note, not a Recommendation — meaning the W3C acknowledged it existed and would host the document, but had not formally endorsed it. Despite this, WSDL 1.1 became the de facto standard and the target of every SOAP toolkit.

WSDL 2.0 became a W3C Recommendation in June 2007 after a long working group process. It was a significant rework: the element names changed (`portType` became `interface`, `port` became `endpoint`), the message element was removed, and HTTP binding was improved. WSDL 2.0 was technically cleaner but practically a failure — by 2007 the industry had thoroughly standardized on WSDL 1.1, and no major toolkit adopted WSDL 2.0 as its primary format. Apache Woden tried to provide WSDL 2.0 support for Java, but it never took off. If you encounter WSDL in the wild today, it is almost always WSDL 1.1.

### 3.2 The six elements of WSDL 1.1

WSDL 1.1 is structured as six nested element types, each building on the previous:

1. **`<types>`** — XML Schema definitions for the data types used by the service. This is just an `xsd:schema` element embedded in the WSDL.
2. **`<message>`** — Abstract message definitions. Each message has one or more parts, and each part references a type or element from `<types>`.
3. **`<portType>`** — An abstract interface. Contains operations, each of which specifies an input message, an output message, and optionally fault messages.
4. **`<binding>`** — A concrete protocol binding for a portType. Specifies whether it is SOAP over HTTP, the encoding style, the SOAPAction values, etc.
5. **`<port>`** — A concrete endpoint, which is a binding plus a network address.
6. **`<service>`** — A collection of ports.

The conceptual layering is: abstract data types → abstract messages → abstract operations → concrete protocol → concrete endpoint → logical service. In theory this separation lets you define an operation once and bind it to multiple protocols (SOAP/HTTP, SOAP/JMS, raw HTTP GET). In practice, almost every WSDL bound a single portType to a single SOAP/HTTP binding, and the layering was just noise.

### 3.3 A worked WSDL example: a calculator service

Here is a complete WSDL 1.1 document for a four-operation calculator service, using document/literal wrapped style:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wsdl:definitions
    name="CalculatorService"
    targetNamespace="http://calc.example.com/"
    xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:tns="http://calc.example.com/">

  <wsdl:types>
    <xsd:schema targetNamespace="http://calc.example.com/"
                elementFormDefault="qualified">

      <xsd:element name="Add">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="a" type="xsd:double"/>
            <xsd:element name="b" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="AddResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="result" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="Subtract">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="a" type="xsd:double"/>
            <xsd:element name="b" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="SubtractResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="result" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="Multiply">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="a" type="xsd:double"/>
            <xsd:element name="b" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="MultiplyResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="result" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="Divide">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="a" type="xsd:double"/>
            <xsd:element name="b" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="DivideResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="result" type="xsd:double"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="DivideByZeroFault">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="message" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

    </xsd:schema>
  </wsdl:types>

  <wsdl:message name="AddRequest">
    <wsdl:part name="parameters" element="tns:Add"/>
  </wsdl:message>
  <wsdl:message name="AddReply">
    <wsdl:part name="parameters" element="tns:AddResponse"/>
  </wsdl:message>
  <wsdl:message name="SubtractRequest">
    <wsdl:part name="parameters" element="tns:Subtract"/>
  </wsdl:message>
  <wsdl:message name="SubtractReply">
    <wsdl:part name="parameters" element="tns:SubtractResponse"/>
  </wsdl:message>
  <wsdl:message name="MultiplyRequest">
    <wsdl:part name="parameters" element="tns:Multiply"/>
  </wsdl:message>
  <wsdl:message name="MultiplyReply">
    <wsdl:part name="parameters" element="tns:MultiplyResponse"/>
  </wsdl:message>
  <wsdl:message name="DivideRequest">
    <wsdl:part name="parameters" element="tns:Divide"/>
  </wsdl:message>
  <wsdl:message name="DivideReply">
    <wsdl:part name="parameters" element="tns:DivideResponse"/>
  </wsdl:message>
  <wsdl:message name="DivideByZeroFaultMessage">
    <wsdl:part name="fault" element="tns:DivideByZeroFault"/>
  </wsdl:message>

  <wsdl:portType name="CalculatorPortType">
    <wsdl:operation name="Add">
      <wsdl:input message="tns:AddRequest"/>
      <wsdl:output message="tns:AddReply"/>
    </wsdl:operation>
    <wsdl:operation name="Subtract">
      <wsdl:input message="tns:SubtractRequest"/>
      <wsdl:output message="tns:SubtractReply"/>
    </wsdl:operation>
    <wsdl:operation name="Multiply">
      <wsdl:input message="tns:MultiplyRequest"/>
      <wsdl:output message="tns:MultiplyReply"/>
    </wsdl:operation>
    <wsdl:operation name="Divide">
      <wsdl:input message="tns:DivideRequest"/>
      <wsdl:output message="tns:DivideReply"/>
      <wsdl:fault name="DivideByZero" message="tns:DivideByZeroFaultMessage"/>
    </wsdl:operation>
  </wsdl:portType>

  <wsdl:binding name="CalculatorSoapBinding" type="tns:CalculatorPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="Add">
      <soap:operation soapAction="http://calc.example.com/Add"/>
      <wsdl:input>  <soap:body use="literal"/> </wsdl:input>
      <wsdl:output> <soap:body use="literal"/> </wsdl:output>
    </wsdl:operation>
    <wsdl:operation name="Subtract">
      <soap:operation soapAction="http://calc.example.com/Subtract"/>
      <wsdl:input>  <soap:body use="literal"/> </wsdl:input>
      <wsdl:output> <soap:body use="literal"/> </wsdl:output>
    </wsdl:operation>
    <wsdl:operation name="Multiply">
      <soap:operation soapAction="http://calc.example.com/Multiply"/>
      <wsdl:input>  <soap:body use="literal"/> </wsdl:input>
      <wsdl:output> <soap:body use="literal"/> </wsdl:output>
    </wsdl:operation>
    <wsdl:operation name="Divide">
      <soap:operation soapAction="http://calc.example.com/Divide"/>
      <wsdl:input>  <soap:body use="literal"/> </wsdl:input>
      <wsdl:output> <soap:body use="literal"/> </wsdl:output>
      <wsdl:fault name="DivideByZero">
        <soap:fault name="DivideByZero" use="literal"/>
      </wsdl:fault>
    </wsdl:operation>
  </wsdl:binding>

  <wsdl:service name="CalculatorService">
    <wsdl:port name="CalculatorPort" binding="tns:CalculatorSoapBinding">
      <soap:address location="http://calc.example.com/calculator"/>
    </wsdl:port>
  </wsdl:service>

</wsdl:definitions>
```

That is roughly 120 lines of XML to describe a service that does add, subtract, multiply, and divide on two doubles. The actual semantic content — "these four operations each take two doubles and return one double, and divide can fault" — is maybe ten lines of information. Everything else is ceremony: namespace declarations, message wrapping, binding boilerplate, element/complexType nesting.

This is not an unfair example. This is what real production WSDL looks like. An enterprise service with, say, forty operations and a dozen data types would produce a WSDL of 2000-4000 lines, and that was considered normal.

### 3.4 How WSDL maps abstract operations to concrete protocols

The layering in WSDL 1.1 is theoretically beautiful. You define an abstract `portType` that says "there is an operation called Add that takes an AddRequest message and returns an AddReply message." Then you define one or more `binding` elements that map that portType to a concrete wire protocol.

For SOAP over HTTP, the binding looks like what I showed above. For SOAP over JMS, the binding would replace `<soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>` with a JMS-specific transport URI and add JMS-specific configuration. For raw HTTP GET (yes, WSDL 1.1 supports this as well, via the `http:binding` extension), the binding would specify the URL template and which message parts map to query parameters.

In practice, multi-binding WSDLs are vanishingly rare. I have personally inspected hundreds of WSDL files in enterprise systems, and I can count on one hand the number that had more than one binding. The layering is a fiction that was never exercised.

### 3.5 WSDL-first vs code-first development

There were two schools of thought about how to build a SOAP service.

**WSDL-first** (also called "contract-first") said: write the WSDL by hand or in a WSDL editor. Generate server skeletons from it. Implement the skeletons. The argument was that this forced you to think about the interface contract explicitly, before getting entangled in implementation details. It also gave you tight control over the wire format, which mattered for interop with other toolkits.

**Code-first** said: write your implementation class with language-specific annotations (JAX-WS `@WebService`, WCF `[ServiceContract]`), then let the toolkit generate WSDL from your code. The argument was that this was faster, easier for developers who did not want to learn WSDL, and produced naturally idiomatic code on the server side. The counter-argument was that the generated WSDL was often ugly, non-portable, and sensitive to changes in the implementation class.

The enterprise architect community was vehement that you had to do WSDL-first. Thomas Erl's SOA books spent chapters on this. Every governance team I ever encountered mandated WSDL-first for "strategic" services. Books were written. Consulting engagements were sold. The problem was that very few developers actually wanted to write WSDL by hand, and the WSDL editors (XMLSpy, Stylus Studio, Eclipse WTP) were not good enough to make it pleasant. So most organizations officially required WSDL-first, had an "architect" team that wrote the WSDLs, and then had application teams who hated the architect team and worked around them.

Spring-WS, which came out in 2005, took an interesting third path: it was explicitly contract-first, but instead of making you write WSDL, it made you write XSD, and then generated the WSDL from the XSD plus a simple Java class. This was closer to what most developers actually wanted, and Spring-WS became popular in the Java community as a result.

### 3.6 Tooling: the code generators

Every major language had at least one WSDL-to-code generator, and each one produced subtly different output.

**Java — `wsimport`** (Sun/Oracle, shipped with the JDK). Generates JAX-WS client stubs from a WSDL. Invocation: `wsimport -keep -s src -p com.example.calc https://calc.example.com/calculator?wsdl`. The generated code is a mess of interfaces, `@WebServiceClient`-annotated service classes, JAXB-generated value types, and ObjectFactory classes with `createXxx` methods for every element. For the calculator WSDL above, `wsimport` would generate about 15 Java files totaling perhaps 500 lines.

**Java — `wsdl2java`** (Apache CXF). Similar to `wsimport` but with CXF-specific extensions. Invocation: `wsdl2java -d src -p com.example.calc https://calc.example.com/calculator?wsdl`. The generated code is cleaner than `wsimport` output but still verbose.

**Java — Apache Axis `WSDL2Java`** (Axis 1.x). The original. Generated code that was even uglier than `wsimport` and that was tightly coupled to Axis runtime classes. If you have ever maintained an Axis 1 service you still have scars.

**.NET — `wsdl.exe`** (early .NET, 2002-era). Generated ASMX service proxies. Later deprecated in favor of `svcutil.exe`.

**.NET — `svcutil.exe`** (WCF era, 2006+). Generates WCF client proxies from a WSDL. Invocation: `svcutil.exe /language:cs /out:Calculator.cs /config:app.config https://calc.example.com/calculator?wsdl`. Also generates an `app.config` fragment containing the endpoint configuration. Tighter than `wsimport` output but still verbose.

**C/C++ — `wsdl2cpp`** (Apache Axis C++) and `gsoap`'s `wsdl2h`. gSOAP was the more popular of the two. Invocation: `wsdl2h -o calc.h https://calc.example.com/calculator?wsdl`, then `soapcpp2 calc.h` to generate the C++ stubs. Notable for actually working and being fast.

**Perl — `SOAP::Lite`**. Did not generate code at all; it was a dynamic dispatch library. You called `SOAP::Lite->service($wsdl_url)->Add(a => 2, b => 3)` and it parsed the WSDL at runtime and made the call. This was either refreshingly dynamic or horrifying depending on your politics.

**Python — `ZSI`**. The Zolera SOAP Infrastructure. Had a `wsdl2py` tool that generated client stubs. The generated code was a maintenance nightmare and ZSI was essentially abandoned by 2010.

**Python — `suds`**. Took the SOAP::Lite approach: dynamic WSDL parsing, no code generation. `client = suds.client.Client(wsdl_url); client.service.Add(2, 3)`. Much nicer than ZSI. The original project was abandoned around 2012 and the `suds-jurko` fork kept it alive for a few more years.

**Python — `zeep`**. The modern Python SOAP library, came out around 2014. Same dynamic style as suds but better. Still maintained as of the mid-2020s. If you need to talk to SOAP from Python in 2026, you use zeep.

**Ruby — `soap4r`**. Shipped with Ruby standard library until Ruby 1.9, then removed. Replaced by `savon` for client-side and... nothing really for server-side.

**Go — `gowsdl`**. A third-party WSDL-to-Go generator. Works well enough for simple WSDLs, gives up on complex ones.

The recurring pattern: every language had a SOAP toolkit, every toolkit was either code-generating or dynamic, both approaches had serious problems, and nobody was really happy. The WSDL-to-code pipeline is one of the major reasons developers who used SOAP remember the experience with distaste.

### 3.7 Why WSDL is verbose but machine-readable

The defense of WSDL is that it is unambiguous and machine-consumable. Given a WSDL file, any compliant toolkit should be able to generate a client that can call the service, and the client's calls should be compatible with any compliant server. This is not true of most RPC protocols — there is no equivalent for HTTP+JSON that tells you the exact shape of the request and response without prose documentation.

OpenAPI (formerly Swagger) eventually filled this niche for REST, but it is younger (first version 2011) and less comprehensive than WSDL. A WSDL can describe not just the shape of the messages but the exact SOAP headers, the exact binding, the exact fault cases, and the exact transport. OpenAPI 3 can describe most of this for HTTP but has no model for multi-transport, and its handling of authentication is more hand-wavy than WS-Security.

So WSDL was verbose but it was genuinely machine-readable in a deep way, and this is the part of SOAP that enterprise architects were not wrong to value. The mistake was believing that machine-readability was worth the cost of the rest of the stack.

---

## 4. UDDI — Universal Description, Discovery and Integration

### 4.1 The founding: IBM, Microsoft, Ariba, September 2000

UDDI was announced on September 6, 2000, by IBM, Microsoft, and Ariba as a joint project to build a global public registry of web services. The vision was explicit and grand: businesses around the world would publish descriptions of their services to UDDI, other businesses would search UDDI to find services that met their needs, and the whole thing would enable dynamic, machine-driven business-to-business integration at a scale that had never been possible before. The tagline was "the yellow pages of the internet for web services."

The three founders each ran a public UDDI node. IBM's was at uddi.ibm.com, Microsoft's at uddi.microsoft.com, SAP joined later and ran one at uddi.sap.com. These three nodes were federated: a publication to any one of them would replicate to the others, so that a search against any node would find entries published at any other. The federation was, in its day, one of the more ambitious distributed systems on the public internet.

The UDDI consortium was run by OASIS. UDDI 1.0 was published in September 2000. UDDI 2.0 came in June 2002, adding federation improvements. UDDI 3.0 came in July 2003, adding digital signatures on entries and better taxonomy support. Each version was backwards-incompatible in ways that made it painful to migrate. The specification itself was about 500 pages.

### 4.2 The white pages / yellow pages / green pages metaphor

UDDI's organizing metaphor was the paper phone directories of the pre-internet era. A town's phone book had three sections:

- **White pages** — an alphabetical list of residents and their phone numbers. In UDDI terms: a list of businesses, with names, contact information, and unique identifiers.
- **Yellow pages** — businesses categorized by what they do (plumbers, lawyers, restaurants). In UDDI terms: businesses tagged with industry and service taxonomies, so that you could search for "all businesses that sell insurance in California."
- **Green pages** — technical details for contacting a business electronically. In UDDI terms: the specific technical bindings — WSDL references, endpoint URLs, authentication requirements — needed to actually call a service.

This was a memorable framing that everyone trotted out in presentations. It was also misleading, because the analogy broke down the moment you tried to use it. In a phone book, the white pages and yellow pages are just different indexes into the same underlying list of businesses. In UDDI, the green pages were a fundamentally different kind of data — the technical bindings — and the relationship between a business, its services, and its bindings was a three-level graph that nobody who had only seen phone books was prepared for.

### 4.3 The UDDI data model: businessEntity, businessService, bindingTemplate, tModel

The UDDI data model had four main entity types.

**`businessEntity`** represented a business or organization. It had a unique key (initially a UUID, later a URI), one or more names, contacts, descriptions, and a collection of `businessService` children.

**`businessService`** represented a service offered by the business. It had a name, description, and a collection of `bindingTemplate` children. A single `businessService` could have multiple bindings — for example, a SOAP/HTTP binding and a SOAP/JMS binding for the same logical service.

**`bindingTemplate`** represented a specific endpoint for a service. It had an access point (typically a URL), and references to one or more `tModel` entries that described the technical details.

**`tModel`** ("technical model") was the most confusing and most powerful concept. A `tModel` was essentially a reference to a technical specification — typically a WSDL portType, but it could also be an interface definition, a protocol specification, a taxonomy, or anything else that a service needed to refer to unambiguously. A `bindingTemplate` pointed to one or more `tModel`s to say "this endpoint speaks the protocol described by these specifications." The canonical example was: a `tModel` whose `overviewURL` pointed to a WSDL document, and a `bindingTemplate` that referenced that `tModel` to mean "this endpoint implements the interface defined by that WSDL."

Here is what an actual UDDI entry looked like in XML (UDDI 2.0 format):

```xml
<businessEntity businessKey="D2033110-3AAF-11D5-80DC-002035229C64"
                operator="http://www.ibm.com"
                authorizedName="jdoe"
                xmlns="urn:uddi-org:api_v2">
  <discoveryURLs>
    <discoveryURL useType="businessEntity">
      http://uddi.ibm.com/ubr/inquiryapi?businessKey=D2033110-3AAF-11D5-80DC-002035229C64
    </discoveryURL>
  </discoveryURLs>
  <name xml:lang="en">Acme Currency Exchange</name>
  <description xml:lang="en">Real-time currency conversion services</description>
  <contacts>
    <contact useType="Technical Contact">
      <personName>Jane Doe</personName>
      <email>jdoe@acme.example.com</email>
    </contact>
  </contacts>
  <businessServices>
    <businessService serviceKey="D206BCA0-3AAF-11D5-80DC-002035229C64"
                     businessKey="D2033110-3AAF-11D5-80DC-002035229C64">
      <name xml:lang="en">Currency Conversion Service</name>
      <description xml:lang="en">SOAP-based currency conversion</description>
      <bindingTemplates>
        <bindingTemplate bindingKey="D20A8C70-3AAF-11D5-80DC-002035229C64"
                         serviceKey="D206BCA0-3AAF-11D5-80DC-002035229C64">
          <description xml:lang="en">Production SOAP endpoint</description>
          <accessPoint URLType="https">
            https://fx.acme.example.com/currency/convert
          </accessPoint>
          <tModelInstanceDetails>
            <tModelInstanceInfo tModelKey="uuid:D20E4E40-3AAF-11D5-80DC-002035229C64">
              <instanceDetails>
                <overviewDoc>
                  <overviewURL>
                    https://fx.acme.example.com/currency?wsdl
                  </overviewURL>
                </overviewDoc>
              </instanceDetails>
            </tModelInstanceInfo>
          </tModelInstanceDetails>
        </bindingTemplate>
      </bindingTemplates>
      <categoryBag>
        <keyedReference keyName="Currency exchange services"
                        keyValue="523130"
                        tModelKey="uuid:C0B9FE13-179F-413D-8A5B-5004DB8E5BB2"/>
      </categoryBag>
    </businessService>
  </businessServices>
  <identifierBag>
    <keyedReference keyName="D-U-N-S"
                    keyValue="01-234-5678"
                    tModelKey="uuid:8609C81E-EE1F-4D5A-B202-3EB13AD01823"/>
  </identifierBag>
  <categoryBag>
    <keyedReference keyName="Finance and insurance"
                    keyValue="52"
                    tModelKey="uuid:C0B9FE13-179F-413D-8A5B-5004DB8E5BB2"/>
  </categoryBag>
</businessEntity>
```

Note the D-U-N-S number (Dun & Bradstreet's business identifier) in the `identifierBag`. The NAICS industry code (52 = Finance and Insurance, 523130 = Commodity Contracts Dealing) in the `categoryBag`. The `tModelKey` references pointing to canonical taxonomy tModels that everyone was supposed to agree on. The `bindingTemplate` with an HTTPS access point and a reference to a `tModel` whose overview document was the WSDL. This is the entire conceptual shape of UDDI in a single example.

### 4.4 The UDDI inquiry and publish APIs

UDDI itself was exposed as — of course — a SOAP service. Each UDDI node implemented two APIs: the inquiry API (read-only, public) and the publish API (write, authenticated). A search for businesses by name looked like:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <find_business generic="2.0" maxRows="10" xmlns="urn:uddi-org:api_v2">
      <name>Acme</name>
    </find_business>
  </soap:Body>
</soap:Envelope>
```

The response would be a `businessList` element containing summary information about matching businesses. To get the full details of a business, you would then call `get_businessDetail`:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <get_businessDetail generic="2.0" xmlns="urn:uddi-org:api_v2">
      <businessKey>D2033110-3AAF-11D5-80DC-002035229C64</businessKey>
    </get_businessDetail>
  </soap:Body>
</soap:Envelope>
```

Publishing required an authentication token obtained from `get_authToken`, then a call to `save_business`:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <save_business generic="2.0" xmlns="urn:uddi-org:api_v2">
      <authInfo>...token from get_authToken...</authInfo>
      <businessEntity>...the full business entity XML above...</businessEntity>
    </save_business>
  </soap:Body>
</soap:Envelope>
```

The Java API for UDDI, JAX-R (JSR 93, Java API for XML Registries, finalized in 2002), tried to wrap this in a more palatable object model. A simple inquiry looked like:

```java
Connection connection = connectionFactory.createConnection();
RegistryService rs = connection.getRegistryService();
BusinessQueryManager bqm = rs.getBusinessQueryManager();

Collection<String> findQualifiers = new ArrayList<>();
findQualifiers.add(FindQualifier.CASE_SENSITIVE_MATCH);

Collection<String> namePatterns = new ArrayList<>();
namePatterns.add("%Acme%");

BulkResponse response = bqm.findOrganizations(
    findQualifiers, namePatterns, null, null, null, null);

for (Organization org : (Collection<Organization>) response.getCollection()) {
    System.out.println(org.getName().getValue());
    for (Service svc : (Collection<Service>) org.getServices()) {
        System.out.println("  " + svc.getName().getValue());
        for (ServiceBinding sb : (Collection<ServiceBinding>) svc.getServiceBindings()) {
            System.out.println("    " + sb.getAccessURI());
        }
    }
}
```

This was not exactly fun to write. JAX-R never achieved wide adoption; most UDDI clients either used the raw SOAP calls or a vendor-specific Java API.

### 4.5 The three public nodes and their 2006 shutdown

The IBM, Microsoft, and SAP public UDDI nodes launched in 2001 and ran for five years. They collected, at their peak, somewhere around 30,000-40,000 published businessEntities. This sounds like a lot until you realize that most of them were test entries, duplicates, spam, and abandoned projects. The actual number of publicly-discoverable production web services on the public UDDI federation at any point was probably in the low hundreds, and even those were almost all published by vendors showcasing their products rather than by actual service providers expecting to be discovered.

In December 2005, IBM, Microsoft, and SAP jointly announced that they were shutting down the public UDDI nodes. The operators' statement noted that "the goals originally envisioned for the UDDI Business Registry — creating a common business registry for public use — have been met, and the UDDI industry effort will now turn its attention to providing services via private installations." This was the kind of corporate statement that says "this project failed and we are turning it off" in the maximum number of positive-sounding words. The nodes went dark in early 2006.

### 4.6 Why UDDI failed

UDDI failed for a cluster of reasons that all compound one another.

**Nobody used it for discovery.** The fundamental premise of UDDI was that a programmer would write a program that, at runtime, would query UDDI to find a suitable service and bind to it dynamically. This simply did not happen. When a developer needed to integrate with Acme Corp's currency service, they did not search UDDI; they called their contact at Acme, got a WSDL URL and some credentials over email, and hard-coded them. The "dynamic discovery" use case was a fiction that had no corresponding reality in how integrations actually got built.

**Trust was unsolved.** Even if you did find a matching service in UDDI, how did you know it was the real one? Anyone could publish a `businessEntity` claiming to be Citibank. The UDDI 3.0 digital signature mechanism tried to address this, but nobody operated the PKI needed to make it meaningful, and nobody trusted the signatures anyway. In the real world, integrations start with a business relationship and a contract, not a search.

**Classification taxonomies didn't work.** UDDI depended on businesses tagging themselves with industry codes from taxonomies like NAICS and UNSPSC. In practice, nobody agreed on the right codes, nobody kept their tags up to date, and nobody searched by them. The NAICS code for "commodity contracts dealing" was not something any developer was going to type into a search box.

**The data was garbage.** Because there was no incentive to keep UDDI entries accurate, they became stale fast. Endpoints moved, WSDLs changed, services were retired, businesses merged and split. A UDDI registry that might once have been useful rapidly decayed into a directory of broken links and dead URLs.

**Public was pointless, private was overkill.** The "federated public registry" concept had no use cases. Internal enterprise registries — private UDDI nodes inside a single company — had more justification, because they could enforce consistency and keep entries current. But a private UDDI was a huge investment for a problem that a SharePoint list, a wiki, or a spreadsheet would solve just as well. Several enterprise registry vendors (Systinet, webMethods CentraSite) eventually pivoted from "UDDI" to "SOA registry/repository" with proprietary extensions, de-emphasizing UDDI interoperability because nobody needed it.

**The API was painful.** JAX-R was not a pleasant API to use. Raw SOAP calls against UDDI were even less pleasant. There was friction at every step, and the benefit of doing any of it was unclear.

**Service discovery was a solved problem already, badly.** In the real world, "service discovery" meant "there is a list of endpoints somewhere, probably in a spreadsheet that the networking team owns." This was awful but it was what worked. A heavyweight standardized SOAP-based registry with an XML taxonomy system was not solving a burning need; it was solving a problem that most enterprises had already solved, badly, and were not going to re-solve just because Microsoft and IBM thought they should.

### 4.7 The lesson: a registry that nobody writes to is not a discovery mechanism

Anne Thomas Manes put this well in several of her Burton Group reports in the mid-2000s: "A registry that nobody writes to is not a discovery mechanism; it is an empty database that happens to have a SOAP interface." The UDDI experience is worth sitting with because it is a pattern that the industry keeps rediscovering.

Every "service registry" or "service catalog" effort in the decade after UDDI — Systinet, CentraSite, HP Service Manager, various "API portal" products — hit the same wall. If using the registry was extra work on top of building the service, and if skipping the registry did not break anything, the registry got skipped. The only registries that worked were the ones that were free or automatic: load balancer pools, DNS entries, Kubernetes services. The moment you required humans to manually maintain a registry, the registry rotted.

This lesson applies directly to modern equivalents. Internal developer portals (Backstage), API catalogs, service meshes with service discovery — all of them either make registration automatic (the service registers itself on startup, or the CI/CD pipeline registers it on deploy) or they have the same failure mode UDDI did. The UDDI failure was not a failure of XML or SOAP; it was a failure to recognize that manually-maintained registries do not work at scale.

---

## 5. The WS-* specification family

This section will take a tour of the major WS-* specifications. There is no way to cover all of them in depth — there are more than thirty in total and each has hundreds of pages of specification — so I will focus on the ones you were most likely to encounter in production, with code examples where they matter.

### 5.1 WS-Security (OASIS, 2004-2006)

WS-Security is the most important WS-* specification after SOAP and WSDL themselves, and it is the one you are most likely to still encounter in production today. It was published by OASIS in 2004 as "Web Services Security: SOAP Message Security 1.0," with a 1.1 revision in 2006. The authors were primarily from IBM, Microsoft, VeriSign, and RSA.

The problem WS-Security solved was: how do you attach authentication, integrity, and confidentiality to a SOAP message in a way that survives intermediaries? HTTPS gives you point-to-point encryption, but it does not survive through an ESB, and it does not tell you anything about the identity of the sender beyond "they have a TCP connection to me right now." Enterprise integration needed **message-level security**: a signature that travels with the message, an encrypted payload that only the final receiver can decrypt, an identity token that intermediaries can inspect without decrypting the payload.

WS-Security accomplishes this by defining a `<wsse:Security>` header block that can contain:

- **Security tokens** — credentials like usernames, X.509 certificates, Kerberos tickets, SAML assertions, or custom tokens.
- **XML Signatures** (per W3C XML-DSig) that sign specific parts of the message, identified by `wsu:Id` attributes.
- **XML Encryption** (per W3C XML-Enc) that encrypt specific parts of the message.

**UsernameToken** is the simplest authentication profile. The header contains a username and either a plaintext password, a password hash, or a password with a nonce and timestamp to prevent replay:

```xml
<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
               soap:mustUnderstand="1">
  <wsse:UsernameToken>
    <wsse:Username>alice</wsse:Username>
    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">
      pG9FJEzLuQp4lKpQ8Gs3Pw==
    </wsse:Password>
    <wsse:Nonce>3MiJtMj9Ph/o+c6zv11CFw==</wsse:Nonce>
    <wsu:Created xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      2006-06-15T10:23:00Z
    </wsu:Created>
  </wsse:UsernameToken>
</wsse:Security>
```

The password digest is `Base64(SHA1(nonce + created + password))`. The server recomputes this and rejects stale or replayed messages by checking the timestamp and nonce.

**X.509 Token Profile** uses a binary security token containing a full X.509 certificate, and signs the message body with the corresponding private key:

```xml
<wsse:Security soap:mustUnderstand="1">
  <wsse:BinarySecurityToken
      EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
      ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"
      wsu:Id="X509-1234">
    MIIDXTCCAkWgAwIBAgIJAKq...[base64-encoded certificate]...==
  </wsse:BinarySecurityToken>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SIG-5678">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <ds:Reference URI="#Body-9012">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <ds:DigestValue>...20-byte SHA1 digest of canonical body...</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>...RSA signature over SignedInfo...</ds:SignatureValue>
    <ds:KeyInfo>
      <wsse:SecurityTokenReference>
        <wsse:Reference URI="#X509-1234"
                        ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>
      </wsse:SecurityTokenReference>
    </ds:KeyInfo>
  </ds:Signature>
</wsse:Security>
```

There is a special hell reserved for people who have debugged XML signature verification failures. The signature depends on **canonical XML** (C14N), which is a normalization of the XML — removing insignificant whitespace, sorting attributes, expanding namespaces — so that two logically-equivalent XML documents produce the same bytes. XML Signature uses a variant called **Exclusive Canonical XML** (exc-c14n), which is slightly different because it handles namespace context differently. If the sender and receiver use different canonicalization algorithms, or different namespace prefixes, or different whitespace handling, the signature verification fails and you get a cryptic "signature invalid" error with no useful debugging information. I once spent three days chasing a WS-Security signature failure that turned out to be caused by a load balancer that was stripping an XML comment from the body.

**SAML Token Profile** uses a SAML assertion as the security token. SAML (Security Assertion Markup Language) is a separate OASIS standard for expressing identity and authorization claims in XML; WS-Security can carry a SAML assertion in the `<wsse:Security>` header and use it as the basis for signing. This became the standard way to do federated identity across SOAP services, and it is still used in enterprise B2B integrations today.

**Encryption** uses XML Encryption to encrypt specific elements of the message. The encrypted element is replaced by an `<xenc:EncryptedData>` element containing the ciphertext and a reference to the encryption key. Typically the key is a symmetric session key that is itself encrypted with the receiver's public key and carried in an `<xenc:EncryptedKey>` element in the security header:

```xml
<wsse:Security soap:mustUnderstand="1">
  <xenc:EncryptedKey xmlns:xenc="http://www.w3.org/2001/04/xmlenc#" Id="EK-1">
    <xenc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#rsa-1_5"/>
    <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <wsse:SecurityTokenReference>
        <wsse:KeyIdentifier ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509SubjectKeyIdentifier">
          ...SKI of receiver's certificate...
        </wsse:KeyIdentifier>
      </wsse:SecurityTokenReference>
    </ds:KeyInfo>
    <xenc:CipherData>
      <xenc:CipherValue>...session key encrypted with RSA-1.5...</xenc:CipherValue>
    </xenc:CipherData>
    <xenc:ReferenceList>
      <xenc:DataReference URI="#ED-1"/>
    </xenc:ReferenceList>
  </xenc:EncryptedKey>
</wsse:Security>
...
<soap:Body>
  <xenc:EncryptedData Id="ED-1" Type="http://www.w3.org/2001/04/xmlenc#Content">
    <xenc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
    <xenc:CipherData>
      <xenc:CipherValue>...encrypted body content...</xenc:CipherValue>
    </xenc:CipherData>
  </xenc:EncryptedData>
</soap:Body>
```

WS-Security is cryptographically sound and genuinely powerful. It is also operationally a nightmare. The failure modes are opaque, the interop between toolkits is spotty, and the performance cost is significant — signing and encrypting a SOAP message can easily take 5-10 ms per message on a 2008-vintage server, which limits a fully-secured WS-Security service to a few hundred messages per second per core. In a world where TLS with client certificates solves 90% of the use case with 10% of the complexity, WS-Security was always a hard sell unless you genuinely needed end-to-end security across intermediaries.

### 5.2 WS-Addressing (W3C Rec, 2006)

WS-Addressing solves the problem of putting addressing information into the SOAP message itself, rather than relying on the transport. Without WS-Addressing, a SOAP message carries no indication of where it is going, where it came from, or what operation it invokes — all of that is in the HTTP request line and headers. The moment the message leaves the HTTP transport (for example, it gets put on a JMS queue, or it gets logged, or it gets stored-and-forwarded), that context is lost.

WS-Addressing defines a set of header blocks:

```xml
<soap:Header>
  <wsa:MessageID xmlns:wsa="http://www.w3.org/2005/08/addressing">
    urn:uuid:6B29FC40-CA47-1067-B31D-00DD010662DA
  </wsa:MessageID>
  <wsa:RelatesTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
    urn:uuid:6B29FC40-CA47-1067-B31D-00DD010662D9
  </wsa:RelatesTo>
  <wsa:To xmlns:wsa="http://www.w3.org/2005/08/addressing">
    http://bank.example.com/accounts
  </wsa:To>
  <wsa:From xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:Address>http://client.example.com/sender</wsa:Address>
  </wsa:From>
  <wsa:ReplyTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:Address>http://client.example.com/inbox</wsa:Address>
  </wsa:ReplyTo>
  <wsa:FaultTo xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:Address>http://client.example.com/faults</wsa:Address>
  </wsa:FaultTo>
  <wsa:Action xmlns:wsa="http://www.w3.org/2005/08/addressing">
    http://bank.example.com/accounts/GetBalance
  </wsa:Action>
</soap:Header>
```

The key concept is the **Endpoint Reference (EPR)**, which is WS-Addressing's equivalent of a URL-plus-metadata. An EPR can contain not just an address but also reference parameters (opaque identifiers that the receiver uses to route the message internally) and metadata (policy assertions, WSDL references):

```xml
<wsa:ReplyTo>
  <wsa:Address>http://client.example.com/inbox</wsa:Address>
  <wsa:ReferenceParameters>
    <cust:CustomerID xmlns:cust="http://client.example.com/">42</cust:CustomerID>
    <cust:SessionID xmlns:cust="http://client.example.com/">xyz-123</cust:SessionID>
  </wsa:ReferenceParameters>
</wsa:ReplyTo>
```

The reference parameters are pulled out and promoted to first-class headers on the reply message. This is an extremely clever mechanism that lets the receiver route a reply to the correct session without the sender having to encode session state in the address URL. It is also almost universally misunderstood and misimplemented.

WS-Addressing enables three important patterns:

1. **Asynchronous request/reply.** Send a request with `<wsa:ReplyTo>` pointing at an async inbox. The receiver eventually produces a reply and sends it to the inbox as a one-way message, with `<wsa:RelatesTo>` pointing at the original `<wsa:MessageID>`. No open connection required.

2. **Routing through intermediaries.** An ESB can inspect `<wsa:To>` and forward the message without understanding the body.

3. **Callback endpoints.** A long-running BPEL process can receive a callback at a specific URL regardless of how the original request was delivered.

WS-Addressing is one of the genuinely useful WS-* specifications. It is still used inside implementations of WS-ReliableMessaging and WS-AtomicTransaction, even if you do not invoke it directly.

### 5.3 WS-ReliableMessaging (OASIS, 2007)

WS-ReliableMessaging (WS-RM) solves the at-least-once and exactly-once delivery problem over unreliable transports. It was standardized by OASIS in 2007 as WS-ReliableMessaging 1.1. The authors were IBM, Microsoft, BEA, TIBCO, and others.

The protocol defines:

- **Sequences** — a numbered series of messages between two endpoints.
- **Acknowledgments** — messages from the receiver back to the sender confirming which messages have been received.
- **Retransmission** — the sender resends unacknowledged messages after a timeout.
- **Delivery assurances** — configurable guarantees: `AtMostOnce`, `AtLeastOnce`, `ExactlyOnce`, `InOrder`.

A WS-RM sequence starts with a `CreateSequence` handshake. Then each message carries a sequence header:

```xml
<soap:Header>
  <wsrm:Sequence xmlns:wsrm="http://docs.oasis-open.org/ws-rx/wsrm/200702">
    <wsrm:Identifier>urn:uuid:12345678-1234-1234-1234-123456789012</wsrm:Identifier>
    <wsrm:MessageNumber>42</wsrm:MessageNumber>
  </wsrm:Sequence>
</soap:Header>
```

The receiver periodically sends back a `SequenceAcknowledgement` listing which message numbers have been received:

```xml
<soap:Header>
  <wsrm:SequenceAcknowledgement xmlns:wsrm="http://docs.oasis-open.org/ws-rx/wsrm/200702">
    <wsrm:Identifier>urn:uuid:12345678-1234-1234-1234-123456789012</wsrm:Identifier>
    <wsrm:AcknowledgementRange Upper="41" Lower="1"/>
    <wsrm:AcknowledgementRange Upper="44" Lower="43"/>
  </wsrm:SequenceAcknowledgement>
</soap:Header>
```

The sender notices that message 42 is missing from the acknowledged ranges and resends it. When all messages have been delivered, the sender sends `CloseSequence` and the receiver responds with `CloseSequenceResponse`, then the sender sends `TerminateSequence` to tear down the state.

WS-RM works. It is also almost never the right answer. If you need reliable delivery, you almost always want a message broker (IBM MQ, TIBCO EMS, ActiveMQ, RabbitMQ, Kafka) which gives you reliability plus queueing plus routing plus persistence plus observability, for a tiny fraction of the WS-RM complexity. The only places WS-RM was useful were scenarios where you needed reliability over HTTP without a broker, and in practice those were rare. WS-RM was implemented in WCF, Apache Sandesha (CXF and Axis2), and Metro, and was widely cited in architecture diagrams and rarely used in production.

### 5.4 WS-AtomicTransaction and WS-BusinessActivity (OASIS)

These two specifications, together with WS-Coordination, attempted to bring two-phase commit and compensating transactions to SOAP. The WS-AtomicTransaction (WS-AT) model was classic 2PC: a coordinator runs a prepare phase, then a commit phase, across multiple participants. The WS-BusinessActivity (WS-BA) model was for long-running transactions where 2PC is not practical: participants perform work and register compensating actions that can be invoked to undo the work if the overall activity fails.

A WS-AT flow looks like this:

1. Client calls service A, which enlists in a transaction coordinated by coordinator C.
2. Client also calls service B, which enlists in the same transaction via C.
3. Client asks C to commit.
4. C sends `Prepare` to A and B. Both reply with `Prepared` (or `Aborted`).
5. C sends `Commit` to A and B. Both reply with `Committed`.

The wire protocol carries coordination context in a header:

```xml
<soap:Header>
  <wscoor:CoordinationContext xmlns:wscoor="http://docs.oasis-open.org/ws-tx/wscoor/2006/06">
    <wscoor:Identifier>urn:uuid:abcd1234-...</wscoor:Identifier>
    <wscoor:Expires>2008-06-15T10:30:00Z</wscoor:Expires>
    <wscoor:CoordinationType>
      http://docs.oasis-open.org/ws-tx/wsat/2006/06
    </wscoor:CoordinationType>
    <wscoor:RegistrationService>
      <wsa:Address>https://coordinator.example.com/register</wsa:Address>
    </wscoor:RegistrationService>
  </wscoor:CoordinationContext>
</soap:Header>
```

WS-AT was implemented in WCF (via `DistributedTransactionPermission` and integration with MSDTC), in IBM WebSphere, and in a few other places. It was almost never used successfully across organizational boundaries, because distributed 2PC across organizational boundaries is a terrible idea — you are giving a foreign coordinator the ability to hold transaction locks on your database. Within a single enterprise, using WS-AT to cross application boundaries was a nightmare of MSDTC configuration, firewall rules, and clock skew problems. This specification family is the poster child for "specifications that worked on paper and almost never worked in production."

### 5.5 WS-Policy and WS-PolicyAttachment (W3C Rec, 2007)

WS-Policy is a framework for expressing capabilities, requirements, and preferences of a web service in a machine-readable form. A policy is a set of alternatives, each of which is a set of assertions. A policy might say "this service requires either a UsernameToken or an X.509 certificate, and requires TLS 1.0 or higher, and supports WS-RM with an InOrder delivery assurance."

A policy document looks like:

```xml
<wsp:Policy xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"
            xmlns:sp="http://docs.oasis-open.org/ws-sx/ws-securitypolicy/200702">
  <wsp:ExactlyOne>
    <wsp:All>
      <sp:TransportBinding>
        <wsp:Policy>
          <sp:TransportToken>
            <wsp:Policy>
              <sp:HttpsToken RequireClientCertificate="false"/>
            </wsp:Policy>
          </sp:TransportToken>
          <sp:AlgorithmSuite>
            <wsp:Policy>
              <sp:Basic256/>
            </wsp:Policy>
          </sp:AlgorithmSuite>
        </wsp:Policy>
      </sp:TransportBinding>
      <sp:SignedSupportingTokens>
        <wsp:Policy>
          <sp:UsernameToken sp:IncludeToken="http://docs.oasis-open.org/ws-sx/ws-securitypolicy/200702/IncludeToken/AlwaysToRecipient">
            <wsp:Policy>
              <sp:WssUsernameToken10/>
            </wsp:Policy>
          </sp:UsernameToken>
        </wsp:Policy>
      </sp:SignedSupportingTokens>
    </wsp:All>
  </wsp:ExactlyOne>
</wsp:Policy>
```

This policy says: the service requires HTTPS (no client cert needed) with at least Basic256 cipher suite, plus a UsernameToken in the WS-Security header. A client toolkit is expected to read this policy, figure out what it has to do to comply, and configure its runtime accordingly.

WS-PolicyAttachment defines how policies are associated with WSDL elements (services, ports, operations, messages). A WSDL can either embed policies inline or reference them via URI.

**WS-SecurityPolicy** is the single most-used set of WS-Policy assertions: it defines a vocabulary for expressing security requirements (which this example uses). WS-RMPolicy defines assertions for reliable messaging. WS-AtomicTransactionPolicy defines assertions for transactions. Each WS-* specification tended to spawn a matching policy vocabulary.

In practice, WS-Policy was most useful when a toolkit like WCF could read a policy from a WSDL and auto-configure the client. `svcutil.exe` would read a policy that said "UsernameToken over HTTPS" and generate an `app.config` with the corresponding WCF binding. When this worked it was genuinely magical. When it did not — which was often — you would spend a day figuring out why `svcutil.exe` had produced a binding that did not match what the server actually expected.

### 5.6 WS-Trust (OASIS, 2007)

WS-Trust defines how to exchange one kind of security token for another through a **Security Token Service (STS)**. The canonical use case: a client authenticates to an STS using username/password, gets back a SAML assertion, then presents the SAML assertion to a service that trusts the STS.

The client calls the STS with a `RequestSecurityToken` (RST):

```xml
<soap:Body>
  <wst:RequestSecurityToken xmlns:wst="http://docs.oasis-open.org/ws-sx/ws-trust/200512">
    <wst:RequestType>
      http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue
    </wst:RequestType>
    <wst:TokenType>
      http://docs.oasis-open.org/wss/oasis-wss-saml-token-profile-1.1#SAMLV2.0
    </wst:TokenType>
    <wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy">
      <wsa:EndpointReference xmlns:wsa="http://www.w3.org/2005/08/addressing">
        <wsa:Address>https://bank.example.com/accounts</wsa:Address>
      </wsa:EndpointReference>
    </wsp:AppliesTo>
    <wst:KeyType>
      http://docs.oasis-open.org/ws-sx/ws-trust/200512/SymmetricKey
    </wst:KeyType>
    <wst:KeySize>256</wst:KeySize>
  </wst:RequestSecurityToken>
</soap:Body>
```

The STS responds with a `RequestSecurityTokenResponse` containing the issued token. The client then includes that token in the WS-Security header of subsequent calls to the target service.

WS-Trust is the conceptual ancestor of modern OAuth 2.0 and OpenID Connect token flows. The shape is the same — a trusted issuer issues a token that a client presents to a resource server. The difference is that WS-Trust is XML-based, tightly coupled to SOAP, and implemented via WS-* headers; OAuth 2.0 is JSON-based, HTTP-native, and implemented via bearer tokens in HTTP headers. The conceptual continuity is why the OAuth designers borrowed so much terminology from WS-Trust; the implementation discontinuity is why OAuth won.

### 5.7 WS-Federation

WS-Federation is a specification that builds on WS-Trust to provide identity federation across security domains. It was a Microsoft-led effort (via the "Identity Metasystem" initiative) and was the underlying protocol for Active Directory Federation Services (ADFS) v1 and v2, and for Microsoft's CardSpace identity selector. WS-Federation competed with SAML 2.0's Web Browser SSO profile for the same use case — cross-domain browser-based single sign-on — and for years both existed in parallel, with Microsoft pushing WS-Federation and everyone else pushing SAML.

A WS-Federation sign-in flow looks like this at the HTTP level:

```
1. User's browser hits https://rp.example.com/app (relying party)
2. RP redirects to https://sts.example.com/sts?wa=wsignin1.0&wreply=...&wtrealm=https://rp.example.com/
3. STS authenticates the user (via whatever means)
4. STS returns an HTML form with a hidden input containing a SAML assertion,
   auto-submitted via JavaScript to wreply URL
5. RP receives the SAML assertion, validates it, establishes a session
```

The SAML assertion inside the form POST is essentially the same kind of XML that WS-Trust would issue, wrapped in a `wresult` form field. WS-Federation was eventually superseded by SAML 2.0 Web Browser SSO in most enterprise deployments, and then by OpenID Connect in newer deployments. Old ADFS 2.0 systems still use WS-Federation and you will find them in production as of 2026.

### 5.8 WS-SecureConversation

WS-SecureConversation addresses the performance problem of WS-Security: signing and encrypting every message with asymmetric crypto is slow. WS-SecureConversation defines a way to bootstrap a symmetric session key via an initial WS-Trust exchange, then use that session key for subsequent messages. This is conceptually very similar to how TLS handshakes work, except at the SOAP message layer instead of the transport layer.

The initial request to the STS creates a `SecurityContextToken` (SCT):

```xml
<wst:RequestSecurityToken>
  <wst:RequestType>
    http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue
  </wst:RequestType>
  <wst:TokenType>
    http://docs.oasis-open.org/ws-sx/ws-sc/200512/sct
  </wst:TokenType>
  <wst:Entropy>
    <wst:BinarySecret Type="http://docs.oasis-open.org/ws-sx/ws-trust/200512/Nonce">
      ...client's random entropy...
    </wst:BinarySecret>
  </wst:Entropy>
</wst:RequestSecurityToken>
```

Subsequent messages reference the SCT and sign/encrypt using keys derived from the session secret. This works and is measurably faster than per-message X.509 signing. It is also approximately reinventing TLS at a higher layer, and by about 2010 most practitioners had concluded that the right answer was just to use TLS.

### 5.9 WS-MetadataExchange

WS-MetadataExchange (WS-MEX) defines a way for a client to ask a service "what is your metadata?" and get back a WSDL document, a WS-Policy document, or both. The canonical endpoint is the service's address with an `mex` suffix, and the request is a SOAP message:

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <wsa:Action xmlns:wsa="http://www.w3.org/2005/08/addressing">
      http://schemas.xmlsoap.org/ws/2004/09/mex/GetMetadata/Request
    </wsa:Action>
    <wsa:To xmlns:wsa="http://www.w3.org/2005/08/addressing">
      https://bank.example.com/accounts/mex
    </wsa:To>
  </soap:Header>
  <soap:Body>
    <mex:GetMetadata xmlns:mex="http://schemas.xmlsoap.org/ws/2004/09/mex">
      <mex:Dialect>http://schemas.xmlsoap.org/wsdl/</mex:Dialect>
    </mex:GetMetadata>
  </soap:Body>
</soap:Envelope>
```

The response contains the WSDL. WS-MEX was used by WCF's `svcutil.exe` as an alternative to `?wsdl` URL suffix retrieval; it lets WCF services expose their metadata through a SOAP endpoint without also having to expose it through an HTTP GET. In practice most people just used `?wsdl` and ignored WS-MEX.

### 5.10 WS-Eventing (W3C Rec, 2011)

WS-Eventing defines a publish/subscribe pattern for SOAP. A client subscribes to an event source by sending a `Subscribe` message containing a filter and an endpoint reference to deliver events to. The source sends events to the subscriber as one-way SOAP messages, and can notify the subscriber of subscription expiration.

```xml
<soap:Body>
  <wse:Subscribe xmlns:wse="http://www.w3.org/2011/03/ws-evt">
    <wse:EndTo>
      <wsa:Address>http://client.example.com/endSubscription</wsa:Address>
    </wse:EndTo>
    <wse:Delivery Mode="http://www.w3.org/2011/03/ws-evt/DeliveryModes/Push">
      <wse:NotifyTo>
        <wsa:Address>http://client.example.com/events</wsa:Address>
      </wse:NotifyTo>
    </wse:Delivery>
    <wse:Expires>2011-12-31T23:59:59Z</wse:Expires>
    <wse:Filter Dialect="http://www.w3.org/TR/1999/REC-xpath-19991116">
      //OrderPlaced[Amount &gt; 1000]
    </wse:Filter>
  </wse:Subscribe>
</soap:Body>
```

WS-Eventing competed with WS-Notification (a parallel OASIS spec family including WS-BaseNotification, WS-BrokeredNotification, and WS-Topics). The two were functionally similar and mutually incompatible. Eventually W3C and OASIS produced a joint follow-up, but by then nobody cared — enterprises used JMS/AMQP/MQ for pub/sub, and the WS-* pub/sub stack was a ghost town.

### 5.11 WS-Management

WS-Management is a specification for managing computer systems (servers, switches, storage arrays) using SOAP. It defines operations like `Get`, `Put`, `Create`, `Delete`, `Enumerate`, and `Invoke` against management resources. Microsoft uses WS-Management as the wire format for WinRM (Windows Remote Management) and PowerShell remoting; Dell, HP, and others use it for hardware management interfaces (iDRAC, iLO). It is a rare WS-* specification that actually succeeded at what it set out to do, largely because it was deployed in a closed ecosystem where Microsoft could mandate its use.

A WS-Management request for a WMI property looks like:

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing"
               xmlns:wsman="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">
  <soap:Header>
    <wsa:To>http://server.example.com:5985/wsman</wsa:To>
    <wsman:ResourceURI>
      http://schemas.microsoft.com/wbem/wsman/1/wmi/root/cimv2/Win32_OperatingSystem
    </wsman:ResourceURI>
    <wsa:Action>http://schemas.xmlsoap.org/ws/2004/09/transfer/Get</wsa:Action>
    <wsman:SelectorSet>
      <wsman:Selector Name="Name">Microsoft Windows Server 2008</wsman:Selector>
    </wsman:SelectorSet>
  </soap:Header>
  <soap:Body/>
</soap:Envelope>
```

### 5.12 WS-I and the Basic Profile

By 2002, the interoperability problems with SOAP and WSDL were bad enough that IBM and Microsoft jointly founded the **Web Services Interoperability Organization (WS-I)**. Its mission was to produce "profiles" — subsets of the existing specifications — that would work across toolkits. Implementers could then claim "WS-I BP 1.0 compliant" as a shorthand for "will actually interop."

**Basic Profile 1.0** (April 2004) was the first and most important. It pinned down:

- SOAP 1.1 only (not 1.2).
- WSDL 1.1 only.
- XML Schema 1.0.
- **Banned** RPC/encoded style. Document/literal or RPC/literal only.
- Forbade certain WSDL constructs that different toolkits implemented differently.
- Specified exactly how the `SOAPAction` header must be formatted (quoted string, empty string allowed).
- Specified HTTP status code handling.
- Specified attachment handling via SOAP with Attachments (later deprecated in favor of MTOM).

The Basic Profile was genuinely useful and made SOAP interop much better than it had been. But "much better than it had been" still meant that a significant fraction of production SOAP integrations had subtle interop bugs.

**Basic Profile 1.1** (August 2004) clarified some ambiguities in 1.0 and pulled out attachment handling into a separate profile.

**Basic Profile 2.0** (November 2010) added support for SOAP 1.2, MTOM, and WS-Addressing. By 2010 most of the WS-* momentum had already drained away and BP 2.0 was largely ignored. There was no BP 3.0.

**Basic Security Profile 1.0** (March 2007) did for WS-Security what BP 1.0 did for SOAP: pinned down exactly which WS-Security features had to work across implementations.

WS-I's profiles had to exist because the specifications themselves were too ambiguous and too flexible to produce interoperable implementations. This is worth dwelling on: SOAP and WSDL were billed as standards that would enable interop, and the reality was that a second layer of specifications was required to tame the flexibility of the first layer enough to achieve the goal the first layer was marketed as achieving. The parallel in the modern world is that REST APIs are billed as "just HTTP" and then every serious REST API adopts OpenAPI plus JSON Schema plus a style guide plus a linter to try to achieve the same goal. The problem is not SOAP; the problem is that distributed contracts are hard, and specifications alone are never enough.

### 5.13 The WS-* swamp

The standard joke in the 2005-2010 era was that WS-* had gotten so big that nobody, not even the vendors, knew the whole thing. A poster circulated at conferences listing the WS-* specs with their statuses and dependencies, and it was genuinely difficult to fit on a single slide.

Let me enumerate the specifications that actually existed, just so the scale is on the record:

- **Core:** SOAP 1.1, SOAP 1.2, WSDL 1.1, WSDL 2.0, XML Schema 1.0, XML Schema 1.1
- **Messaging:** MTOM, XOP, SOAP with Attachments, WS-Addressing, WS-Eventing, WS-Notification (WS-BaseNotification, WS-BrokeredNotification, WS-Topics), WS-Enumeration, WS-Transfer
- **Reliability:** WS-ReliableMessaging, WS-Reliability (a competing specification), WS-MakeConnection
- **Security:** WS-Security, WS-SecurityPolicy, WS-Trust, WS-SecureConversation, WS-Federation, WS-Authorization (never ratified)
- **Transactions:** WS-Coordination, WS-AtomicTransaction, WS-BusinessActivity
- **Metadata:** WS-MetadataExchange, WS-Policy, WS-PolicyAttachment, WS-Discovery
- **Management:** WS-Management, WS-ResourceFramework (WS-RF: WS-Resource, WS-ResourceProperties, WS-ResourceLifetime, WS-BaseFaults, WS-ServiceGroup), WS-DistributedManagement
- **Business processes:** WS-BPEL, WS-HumanTask, BPEL4People, WS-CDL (Choreography Description Language)

That is over thirty specifications in active circulation around 2008. Many of them had competing alternatives. WS-ReliableMessaging had a competing WS-Reliability. WS-Notification had a competing WS-Eventing. WS-Federation competed with SAML. The WS-Resource Framework was an entire separate specification family for "stateful" services that never took off. A team standing up a new SOAP service in 2008 had to navigate all of these decisions — which reliable messaging spec, which security profile, which management spec — and no two vendors agreed.

The term "WS-*-hell" was common by 2007. "The WS-death-star" was another. The image of the overlapping WS-* standards formed the aesthetic backdrop to the entire "REST is simpler" argument. When Roy Fielding wrote "REST APIs must be hypertext-driven" in 2008, he was partly writing against the ceremony-loving world that had produced the WS-* swamp.

---

## 6. SOAP toolkits and vendors

Every language ecosystem produced at least one SOAP toolkit, and each toolkit was painful in its own distinctive way. This section surveys the major ones.

### 6.1 Apache Axis (Java, 2003)

Apache Axis 1.0 was released in June 2003 by the Apache Web Services project. It grew out of IBM's SOAP4J and Apache SOAP (an earlier, lighter-weight Apache project). Axis 1 was the first widely-used open-source SOAP toolkit for Java and became the de facto standard for a few years. It supported SOAP 1.1, WSDL 1.1, and had tools for WSDL-to-Java (`WSDL2Java`) and Java-to-WSDL generation.

A Hello-World Axis 1 service looked like:

```java
// HelloService.java
public class HelloService {
    public String sayHello(String name) {
        return "Hello, " + name + "!";
    }
}
```

You would deploy this by writing a WSDD (Web Service Deployment Descriptor):

```xml
<deployment xmlns="http://xml.apache.org/axis/wsdd/"
            xmlns:java="http://xml.apache.org/axis/wsdd/providers/java">
  <service name="HelloService" provider="java:RPC">
    <parameter name="className" value="example.HelloService"/>
    <parameter name="allowedMethods" value="sayHello"/>
  </service>
</deployment>
```

And then running `AdminClient deploy.wsdd` against a running Axis servlet. This was, in 2004, the easiest way to stand up a SOAP service in Java. It was also a complete disaster — WSDD was unwieldy, the `RPC` provider used RPC/encoded by default (which was banned by WS-I BP 1.0), and the generated WSDL was ugly.

Axis 1 was superseded by **Apache Axis2** (released in 2006), which was a ground-up rewrite with a different architecture (AXIOM object model, module-based extensibility for WS-* specs). Axis2 supported WS-Security via the Rampart module, WS-RM via Sandesha, WS-Policy via Neethi, and so on. The architecture was cleaner but the learning curve was steep and the module versioning was a nightmare. Axis2 never achieved the mindshare that Axis 1 had — by the time it was mature, Apache CXF had emerged as a more approachable alternative.

### 6.2 Apache CXF (Java, 2006)

Apache CXF (originally "Celtix eXtensible Framework") was formed in 2006 by the merger of two projects: **XFire** (a community Apache project that had developed an alternative to Axis) and **Celtix** (an IONA-sponsored project). The merged codebase became a top-level Apache project and rapidly became the most popular Java SOAP framework.

CXF's advantages over Axis2:

- **JAX-WS and JAX-RS in one framework.** JAX-WS (JSR 224) was the Java standard API for SOAP web services. JAX-RS (JSR 311) was the standard for REST. CXF supported both with the same runtime, which mattered as the industry drifted toward REST.
- **Spring integration.** Spring's ApplicationContext XML files could directly configure CXF endpoints, which fit naturally into the Spring-dominated Java enterprise ecosystem.
- **Cleaner code generation.** `wsdl2java` produced less ugly stubs than Axis.
- **Better WS-* support.** CXF's WS-Security support (via WSS4J) was the most widely-used Java WS-Security implementation.

A minimal CXF service using JAX-WS annotations:

```java
import javax.jws.WebService;
import javax.jws.WebMethod;

@WebService(
    serviceName = "CalculatorService",
    portName = "CalculatorPort",
    targetNamespace = "http://calc.example.com/")
public class CalculatorServiceImpl {

    @WebMethod(operationName = "Add")
    public double add(double a, double b) {
        return a + b;
    }

    @WebMethod(operationName = "Divide")
    public double divide(double a, double b) throws DivideByZeroFault {
        if (b == 0.0) {
            throw new DivideByZeroFault("Cannot divide by zero");
        }
        return a / b;
    }
}
```

Publishing it:

```java
import javax.xml.ws.Endpoint;

public class CalculatorServer {
    public static void main(String[] args) {
        Endpoint.publish("http://localhost:8080/calculator",
                         new CalculatorServiceImpl());
        System.out.println("Calculator service started");
    }
}
```

With CXF on the classpath, this runs a SOAP service backed by the JDK's built-in HTTP server. The WSDL is auto-generated and available at `http://localhost:8080/calculator?wsdl`. This was, in 2008, genuinely pleasant — the fewest ceremony steps of any SOAP toolkit at the time.

Configuring WS-Security on CXF involved a WSS4J interceptor:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:jaxws="http://cxf.apache.org/jaxws"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <jaxws:endpoint id="calculator"
                  implementor="#calcImpl"
                  address="/calculator">
    <jaxws:inInterceptors>
      <bean class="org.apache.cxf.ws.security.wss4j.WSS4JInInterceptor">
        <constructor-arg>
          <map>
            <entry key="action" value="UsernameToken Timestamp"/>
            <entry key="passwordCallbackClass" value="example.ServerPasswordCallback"/>
          </map>
        </constructor-arg>
      </bean>
    </jaxws:inInterceptors>
  </jaxws:endpoint>

  <bean id="calcImpl" class="example.CalculatorServiceImpl"/>
</beans>
```

And a callback class to look up passwords:

```java
public class ServerPasswordCallback implements CallbackHandler {
    public void handle(Callback[] callbacks) throws IOException, UnsupportedCallbackException {
        for (Callback cb : callbacks) {
            if (cb instanceof WSPasswordCallback) {
                WSPasswordCallback pc = (WSPasswordCallback) cb;
                if ("alice".equals(pc.getIdentifier())) {
                    pc.setPassword("hunter2");
                }
            }
        }
    }
}
```

This was typical of WS-* configuration: a lot of XML plumbing, a couple of callback classes, and a pile of vendor-specific property names that you had to look up in documentation. CXF was the best Java SOAP framework of the era, and it was still not exactly pleasant.

### 6.3 Microsoft .NET: ASMX (2002) and WCF (2006)

Microsoft shipped SOAP support in .NET 1.0 (2002) via a framework called **ASMX** (the file extension for ASP.NET web services). You wrote a class with `[WebMethod]` attributes and saved it as `.asmx`, and IIS would serve it as a SOAP endpoint:

```csharp
// Calculator.asmx.cs
using System.Web.Services;

[WebService(Namespace = "http://calc.example.com/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Calculator : WebService
{
    [WebMethod]
    public double Add(double a, double b) { return a + b; }

    [WebMethod]
    public double Divide(double a, double b)
    {
        if (b == 0) throw new SoapException("Division by zero",
            SoapException.ClientFaultCode);
        return a / b;
    }
}
```

ASMX was the easiest way to stand up a SOAP service in 2003-2005. Its limitations became obvious quickly: no WS-* support beyond WS-Security basics, no transport beyond HTTP, no customization of the wire format, and a fixed serialization model that mapped poorly onto anything complicated.

Microsoft's response was **Windows Communication Foundation (WCF)**, which shipped in .NET 3.0 in late 2006. WCF was a complete ground-up rewrite of the RPC story for .NET, and it was genuinely ambitious. It unified:

- ASMX web services
- .NET Remoting (an RPC framework for .NET-to-.NET communication)
- Enterprise Services / COM+
- MSMQ (Microsoft Message Queue)
- WS-* protocols

WCF's central abstraction was the **binding**, which was a bundle of transport + encoding + protocol options. Built-in bindings included:

- `basicHttpBinding` — SOAP 1.1 over HTTP (equivalent to ASMX).
- `wsHttpBinding` — SOAP 1.2 over HTTP with WS-Security, WS-Addressing, WS-RM.
- `ws2007HttpBinding` — Updated to WS-* 2007 specifications.
- `wsFederationHttpBinding` — WS-Federation.
- `netTcpBinding` — Binary-framed SOAP over TCP (WCF-to-WCF only, very fast).
- `netNamedPipeBinding` — Named pipes (same machine only).
- `netMsmqBinding` — MSMQ transport.
- `webHttpBinding` — Plain REST-ish HTTP (later bolted on).

A WCF service:

```csharp
using System.ServiceModel;

[ServiceContract(Namespace = "http://calc.example.com/")]
public interface ICalculator
{
    [OperationContract]
    double Add(double a, double b);

    [OperationContract]
    [FaultContract(typeof(DivideByZeroFault))]
    double Divide(double a, double b);
}

[DataContract(Namespace = "http://calc.example.com/")]
public class DivideByZeroFault
{
    [DataMember]
    public string Message { get; set; }
}

public class CalculatorService : ICalculator
{
    public double Add(double a, double b) { return a + b; }

    public double Divide(double a, double b)
    {
        if (b == 0)
            throw new FaultException<DivideByZeroFault>(
                new DivideByZeroFault { Message = "Cannot divide by zero" });
        return a / b;
    }
}
```

And the hosting configuration in `app.config`:

```xml
<configuration>
  <system.serviceModel>
    <services>
      <service name="Example.CalculatorService">
        <endpoint address=""
                  binding="wsHttpBinding"
                  bindingConfiguration="secureBinding"
                  contract="Example.ICalculator"/>
        <endpoint address="mex"
                  binding="mexHttpBinding"
                  contract="IMetadataExchange"/>
        <host>
          <baseAddresses>
            <add baseAddress="http://localhost:8080/calculator"/>
          </baseAddresses>
        </host>
      </service>
    </services>
    <bindings>
      <wsHttpBinding>
        <binding name="secureBinding">
          <security mode="Message">
            <message clientCredentialType="UserName"/>
          </security>
          <reliableSession enabled="true" ordered="true"/>
        </binding>
      </wsHttpBinding>
    </bindings>
    <behaviors>
      <serviceBehaviors>
        <behavior>
          <serviceMetadata httpGetEnabled="true"/>
          <serviceDebug includeExceptionDetailInFaults="false"/>
        </behavior>
      </serviceBehaviors>
    </behaviors>
  </system.serviceModel>
</configuration>
```

WCF was the most technically sophisticated SOAP toolkit ever built. It had a clean contract model, a pluggable channel stack, first-class WS-* support that actually worked, and genuinely excellent tooling via Visual Studio and `svcutil.exe`. It was also drowning in configuration — the XML above is for a single service with modest requirements, and production WCF configs routinely ran 500-1000 lines. WCF configuration debugging was a distinct professional skill in the late 2000s, and "WCF config hell" was a recurring complaint on Stack Overflow.

WCF was eventually deprecated. Microsoft announced in 2019 that .NET Core would not include WCF server support, and that existing WCF services should be migrated to gRPC or ASP.NET Core Web API. The community produced a port called **CoreWCF** that brought WCF server support to .NET Core, but the message from Microsoft was clear: the WCF era was over. WCF is still supported on .NET Framework 4.x for legacy compatibility, and lots of production .NET code still uses it, but no new greenfield .NET application in 2026 is going to use WCF.

### 6.4 IBM WebSphere

IBM WebSphere Application Server was IBM's flagship Java EE application server. Its web services story in the early 2000s was based on Apache Axis (IBM was a major Axis contributor) with IBM extensions, and later moved to an IBM-specific stack that supported the full WS-* family. WebSphere was the platform of choice for large IBM-shop enterprises — banks, insurance companies, telecoms, governments — and "SOA on WebSphere" was IBM's largest consulting revenue stream for years.

A typical WebSphere SOA deployment combined:

- **WebSphere Application Server** for the runtime.
- **WebSphere Process Server** for BPEL execution.
- **WebSphere Message Broker** (later IBM Integration Bus) as the ESB.
- **WebSphere Service Registry and Repository (WSRR)** for governance.
- **WebSphere MQ** for messaging.
- **DataPower** (XML gateways) for external-facing SOAP endpoints.

This was a full stack, expensive stack, and it genuinely did work when configured correctly by people who knew what they were doing. It also locked you entirely into IBM's product family, and the licensing costs were famously eye-watering — a mid-sized WebSphere SOA deployment could easily run $5-10M over five years in license fees, maintenance, and IBM consulting.

### 6.5 BEA WebLogic (and Oracle WebLogic after 2008)

BEA Systems was the second-tier Java EE vendor in the 2000s, behind IBM but ahead of everyone else. Their application server, BEA WebLogic, was the runtime for a huge number of enterprise SOAP deployments, particularly in the finance sector. BEA's SOA story included:

- **WebLogic Server** for the runtime.
- **WebLogic Integration** (formerly WLI) for BPM/BPEL.
- **AquaLogic Service Bus (ALSB)**, BEA's ESB (acquired from Plumtree).
- **AquaLogic Service Registry** (OEM'd from Systinet).

Oracle acquired BEA in January 2008 for $8.5 billion. Everything was rebranded: ALSB became Oracle Service Bus, WebLogic Integration became Oracle SOA Suite, and BEA's customer base became Oracle's. This was the final consolidation move in the ESB vendor space — after the BEA acquisition, the major commercial ESB vendors were IBM, Oracle, TIBCO, webMethods/Software AG, and Microsoft.

### 6.6 Sun/Oracle Metro (JAX-WS + WSIT)

Sun Microsystems built a Java SOAP stack called **Metro**, which combined two components: **JAX-WS RI** (the JAX-WS reference implementation) and **WSIT** (Web Services Interoperability Technology). WSIT's goal was specifically to interop with Microsoft's WCF — Sun and Microsoft co-sponsored the project under "Project Tango" to guarantee that a JAX-WS client could talk to a WCF service using the full WS-* stack, and vice versa. This included WS-Security, WS-SecureConversation, WS-RM, WS-Trust, WS-Policy, and WS-AtomicTransaction.

Metro was included in GlassFish (Sun's Java EE reference application server) and was the default SOAP stack for Sun's enterprise customers. After Oracle acquired Sun in 2010, Metro continued to ship with GlassFish but with steadily decreasing investment. It is still maintained today as part of Eclipse Metro (the project moved to Eclipse after Oracle stopped funding Java EE) and is still a reasonable choice if you need pure JAX-WS with good WS-* interop.

### 6.7 Spring-WS

**Spring Web Services** was released in 2005 by the Spring Framework team as an alternative to Axis. Its distinctive philosophy was **contract-first without WSDL**: you wrote an XSD, Spring-WS generated a WSDL from the XSD and your endpoint methods, and you wrote endpoint methods that took JDOM or DOM or JAXB objects. The framework did not care about the specific Java types — it routed messages to endpoint methods based on the root element of the payload.

A Spring-WS endpoint:

```java
@Endpoint
public class CalculatorEndpoint {

    private static final String NAMESPACE_URI = "http://calc.example.com/";

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "Add")
    @ResponsePayload
    public AddResponse add(@RequestPayload Add request) {
        AddResponse response = new AddResponse();
        response.setResult(request.getA() + request.getB());
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "Divide")
    @ResponsePayload
    public DivideResponse divide(@RequestPayload Divide request) {
        if (request.getB() == 0) {
            throw new DivideByZeroException();
        }
        DivideResponse response = new DivideResponse();
        response.setResult(request.getA() / request.getB());
        return response;
    }
}
```

With Spring configuration:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:sws="http://www.springframework.org/schema/web-services">

  <sws:annotation-driven/>

  <sws:dynamic-wsdl id="calculator"
                    portTypeName="Calculator"
                    locationUri="/calculator"
                    targetNamespace="http://calc.example.com/">
    <sws:xsd location="/WEB-INF/calculator.xsd"/>
  </sws:dynamic-wsdl>

  <bean class="example.CalculatorEndpoint"/>
</beans>
```

Spring-WS was the Java SOAP framework for people who already used Spring and wanted the smallest amount of SOAP-specific ceremony possible. It did not support the full WS-* family (no WS-RM, limited WS-AT), but it supported WS-Security well and it was markedly more pleasant than Axis or CXF for straightforward services. It is still maintained today as part of the Spring portfolio, and as of 2026 it is the Java SOAP framework you would pick if you had to build a new SOAP service in a Spring-based codebase (though the correct answer is usually "don't build a new SOAP service").

### 6.8 gSOAP (C/C++)

**gSOAP** was a C/C++ SOAP toolkit maintained by Robert van Engelen at Florida State University and later as a commercial product by Genivia. It was distinctive for targeting constrained environments: embedded systems, network devices, and high-performance C++ services where the JVM and .NET were too heavy. It supported SOAP 1.1, SOAP 1.2, WSDL 1.1, MTOM, and a reasonable subset of WS-*.

A gSOAP workflow started with a C or C++ header file with annotations:

```cpp
// calculator.h
//gsoap fx service name: Calculator
//gsoap fx service namespace: http://calc.example.com/
//gsoap fx service location: http://localhost:8080/calculator

//gsoap fx service method-documentation: Add Add two numbers
int fx__Add(double a, double b, double *result);

//gsoap fx service method-documentation: Divide Divide two numbers
int fx__Divide(double a, double b, double *result);
```

Running `soapcpp2 calculator.h` generated a pile of C++ source files implementing the SOAP client and server stubs. The server implementation:

```cpp
#include "soapH.h"
#include "Calculator.nsmap"

int main() {
    struct soap soap;
    soap_init(&soap);
    int m = soap_bind(&soap, NULL, 8080, 100);
    if (m < 0) {
        soap_print_fault(&soap, stderr);
        return 1;
    }
    for (;;) {
        int s = soap_accept(&soap);
        if (s < 0) break;
        soap_serve(&soap);
        soap_end(&soap);
    }
    soap_done(&soap);
    return 0;
}

int fx__Add(struct soap *soap, double a, double b, double *result) {
    *result = a + b;
    return SOAP_OK;
}

int fx__Divide(struct soap *soap, double a, double b, double *result) {
    if (b == 0.0) {
        return soap_sender_fault(soap, "Division by zero", NULL);
    }
    *result = a / b;
    return SOAP_OK;
}
```

gSOAP was dramatically faster and smaller than any JVM-based SOAP toolkit. A gSOAP server could easily do 10,000+ SOAP messages per second on 2010-vintage hardware. It was also painful to use — C and C++ memory management is its own burden, and the generated code was not pleasant to debug. It found a niche in telecoms equipment, network management, and scientific grid computing (the globus toolkit used gSOAP).

### 6.9 Perl SOAP::Lite

**SOAP::Lite** was Paul Kulchenko's dynamic Perl SOAP library, first released in 2001. It was famous for being the simplest SOAP toolkit to use for quick tasks:

```perl
use SOAP::Lite;

my $result = SOAP::Lite
    ->uri('http://calc.example.com/')
    ->proxy('http://calc.example.com/calculator')
    ->Add(SOAP::Data->name('a' => 5), SOAP::Data->name('b' => 3))
    ->result;

print "5 + 3 = $result\n";
```

No code generation, no WSDL parsing (though optional WSDL support was added later), just an object that let you call any method on any SOAP endpoint. SOAP::Lite was the tool of choice for Perl sysadmins doing quick integration scripts. It was also full of quirks — the `SOAP::Data` wrapping was unintuitive, the default was RPC/encoded which conflicted with WS-I BP, and namespaces were a constant source of bugs. SOAP::Lite was largely abandoned by 2010 and the Perl community gradually migrated to LWP::UserAgent plus XML::LibXML for direct SOAP work, or more commonly, abandoned SOAP in favor of REST.

### 6.10 Python: ZSI and suds and zeep

**ZSI (Zolera SOAP Infrastructure)** was the first serious Python SOAP toolkit, maintained by the Zolera corporation. It did code generation from WSDL via a `wsdl2py` tool, produced heavy generated code, and was a maintenance burden. ZSI was effectively abandoned by around 2008-2010.

**suds** was a dynamic Python SOAP client by Jeff Ortel at Red Hat, released around 2008. It parsed the WSDL at runtime and exposed the service as a Python object:

```python
from suds.client import Client

client = Client('http://calc.example.com/calculator?wsdl')
result = client.service.Add(5, 3)
print(f"5 + 3 = {result}")
```

suds was a pleasure compared to ZSI. It handled most straightforward SOAP services correctly, supported WS-Security via plugins, and had reasonable error messages. The original project was abandoned by its author around 2011, and the community fork **suds-jurko** (maintained by Jurko Gospodnetić) kept it alive.

**zeep** is the modern Python SOAP library, created by Michael van Tellingen in 2014. It was a ground-up rewrite that addressed many of suds's limitations (better XSD handling, proper WS-Addressing, WS-Security, MTOM attachments, async support). As of 2026, zeep is the Python SOAP library you want. A typical zeep usage:

```python
from zeep import Client
from zeep.wsse.username import UsernameToken

client = Client(
    'https://bank.example.com/accounts?wsdl',
    wsse=UsernameToken('alice', 'hunter2')
)

balance = client.service.GetBalance(accountNumber='12345678')
print(f"Balance: {balance.amount} {balance.currency}")
```

### 6.11 Why every ecosystem had its own painful toolkit

A meta-question emerges from this survey: why did every language have its own SOAP toolkit, and why were they all, to varying degrees, painful?

The answer lies in the mismatch between SOAP's abstraction and most languages' native idioms. SOAP assumes an XML-schema-typed world, where every value has a QName and every operation is described by a WSDL. Most languages do not natively work that way — they have their own type systems, their own object models, their own idioms for RPC. The SOAP toolkit's job was to build a bridge between the language's native world and the SOAP wire format, and that bridge was always a source of friction.

Java came closest to feeling natural, because JAX-WS was designed as part of Java EE and the annotation-driven model matched Java's idioms. Even so, Java SOAP code had a distinct "generated from WSDL" smell that more native Java code lacked.

.NET with WCF also felt natural within its own world, because WCF was a Microsoft-designed end-to-end framework and they could make the language and the framework match. But as soon as you stepped outside WCF's happy path — interop with Java toolkits, non-standard WS-* combinations — the friction returned.

Scripting languages (Perl, Python, Ruby, PHP) had the worst experience because their dynamic type systems did not match SOAP's static schemas well, and because they had less investment in code generation. The dynamic wrappers (SOAP::Lite, suds, zeep) were the best answer the scripting world had, and they were still not great.

C and C++ were painful because memory management and XML parsing are miserable in those languages regardless of the protocol. gSOAP did as well as anyone could reasonably be expected to do.

The toolkit pain is a large part of why developers remember SOAP so negatively. The pitch was "you generate code from WSDL and then you just call methods," and the reality was "you generate code from WSDL, discover the generated code is broken in some subtle way, spend two days debugging namespace handling, find a workaround, and then call methods carefully." Multiply that experience by every new WSDL you had to consume, every toolkit upgrade, every WS-* configuration change, and you get a decade-long impression that SOAP was fundamentally hostile.

---

## 7. Enterprise Service Buses (ESB)

### 7.1 The ESB concept

The Enterprise Service Bus was the central architectural concept of mid-2000s enterprise SOA. It was coined by Gartner analysts around 2002 and promoted heavily by vendors through the decade that followed. The pitch was simple: instead of point-to-point integrations between every pair of systems (which produce the dreaded "spaghetti" architecture), route all messages through a central bus that provides routing, transformation, protocol bridging, and monitoring.

The theoretical advantages of an ESB:

- **Location transparency.** Services do not need to know the network location of other services. They publish a message to a logical channel and the bus routes it.
- **Format transformation.** A service that expects XML can receive data from a service that produces JSON or CSV, because the bus transforms the format in transit.
- **Protocol bridging.** A SOAP/HTTP service can talk to a JMS queue can talk to an FTP drop can talk to a COBOL mainframe through MQ Series, because the bus bridges the transports.
- **Centralized routing.** Business routing rules ("send orders over $100K to the high-priority queue") are expressed once, in the bus, rather than in every producer.
- **Monitoring and auditing.** Every message crosses the bus, so every message can be logged, audited, and reported on from a single point.
- **Orchestration.** Multi-step business processes can be expressed as routes through the bus, often using BPEL or a proprietary orchestration language.

This was a compelling story to sell to enterprise architects who were tired of point-to-point integration bloat. It was also, in hindsight, a story that subtly violated its own stated principle of loose coupling. An ESB is a central component that every service depends on. If the ESB goes down, every integration goes down. If the ESB is slow, every integration is slow. If the ESB's routing rules change, every affected integration's behavior changes. The ESB was centralization reimagined as decoupling, and the reality was closer to the first than the second.

### 7.2 Sonic ESB (Progress Software, ~2002)

The first commercial product explicitly branded as an "Enterprise Service Bus" was **Sonic ESB** from Sonic Software, released in 2002. Sonic had been making a JMS broker (SonicMQ) and extended it with ESB features: content-based routing, XSLT transformation, and a visual process orchestration tool. Progress Software acquired Sonic in 2003 and continued selling Sonic ESB until the Sonic product line was sold to Aurea Software in 2013.

Sonic ESB is historically important because it established the ESB product category. Before Sonic, the equivalent products were marketed as "integration brokers," "EAI tools," or "message brokers." The ESB framing, which positioned the bus as the core of a service-oriented architecture rather than just an integration tool, was Sonic's marketing innovation, and every competitor followed suit.

A typical Sonic ESB deployment had SonicMQ as the messaging substrate, Sonic ESB nodes as the service containers, and the Sonic Workbench (an Eclipse-based visual designer) for building routes. Routes were expressed as XML configurations that chained together "itineraries" of processing steps.

### 7.3 TIBCO BusinessWorks

TIBCO Software had been doing enterprise messaging since the early 1990s, originally for financial trading systems on Wall Street. Their flagship product **TIBCO Rendezvous** was a publish/subscribe messaging system widely used in finance. In the 2000s TIBCO extended this into a full SOA suite:

- **TIBCO Enterprise Message Service (EMS)** — JMS-compliant message broker.
- **TIBCO BusinessWorks** — graphical process designer and runtime for integration flows.
- **TIBCO ActiveMatrix Service Bus** — the formal ESB product.
- **TIBCO BusinessEvents** — complex event processing.

TIBCO BusinessWorks was heavily used in financial services — major banks, insurance companies, and exchanges ran mission-critical trading and settlement flows on BusinessWorks. A BusinessWorks process was defined graphically as a flowchart of "activities" (SOAP invocation, XSLT transform, database query, JMS send), and the runtime executed the graph. BusinessWorks is still in production at major financial institutions in 2026, and TIBCO still sells and supports it.

### 7.4 webMethods

**webMethods** was founded in 1996 and became one of the most successful pure-play integration vendors. Their Integration Server was an early EAI tool that evolved into a full SOA platform. The key products:

- **webMethods Integration Server** — the runtime, with built-in SOAP support, JMS, MQ, file, database, and dozens of adapter connectors to ERPs.
- **webMethods Broker** — message broker.
- **webMethods Trading Networks** — B2B gateway for EDI and AS2.
- **webMethods CentraSite** — SOA registry/repository (a joint product with Fujitsu).

Software AG acquired webMethods in 2007 for $546 million and folded it into their own SOA product line. Software AG continued selling webMethods as their integration platform and it is still sold today under the same name. Like TIBCO, webMethods is in heavy production use in large enterprises.

### 7.5 IBM WebSphere Message Broker / IBM Integration Bus

IBM's enterprise integration story was built around **WebSphere Message Broker**, later renamed **IBM Integration Bus** (2013), later renamed **IBM App Connect Enterprise** (2018). Underneath the rebrandings the product is the same: a message broker that reads messages from MQ queues (or other sources), runs them through a flow of nodes (XSLT transform, ESQL transform, WS invocation, database query), and routes them to destinations.

Flows were designed in the **WebSphere Message Broker Toolkit**, an Eclipse-based visual designer. A typical flow had an MQ Input node, a Compute node (running IBM's proprietary ESQL language for transformation), a WS Request node to call a downstream SOAP service, and an MQ Output node for the reply. A compute node might look like:

```sql
-- ESQL compute node transforming an incoming XML invoice
CREATE COMPUTE MODULE TransformInvoice_Compute
    CREATE FUNCTION Main() RETURNS BOOLEAN
    BEGIN
        SET OutputRoot.Properties = InputRoot.Properties;
        SET OutputRoot.MQMD = InputRoot.MQMD;

        CREATE LASTCHILD OF OutputRoot DOMAIN 'XMLNSC';
        SET OutputRoot.XMLNSC.ns1:Invoice.ns1:Header.ns1:InvoiceNumber =
            InputRoot.XMLNSC.inv:Document.inv:Header.inv:Number;
        SET OutputRoot.XMLNSC.ns1:Invoice.ns1:Header.ns1:Date =
            CAST(InputRoot.XMLNSC.inv:Document.inv:Header.inv:IssueDate AS DATE FORMAT 'yyyy-MM-dd');
        SET OutputRoot.XMLNSC.ns1:Invoice.ns1:Header.ns1:TotalAmount =
            InputRoot.XMLNSC.inv:Document.inv:Totals.inv:Grand;

        DECLARE ref REFERENCE TO InputRoot.XMLNSC.inv:Document.inv:Lines.inv:Line;
        WHILE LASTMOVE(ref) DO
            CREATE LASTCHILD OF OutputRoot.XMLNSC.ns1:Invoice.ns1:LineItems
                AS lineRef NAME 'LineItem';
            SET lineRef.ns1:SKU = ref.inv:Product.inv:Code;
            SET lineRef.ns1:Quantity = ref.inv:Quantity;
            SET lineRef.ns1:UnitPrice = ref.inv:Price;
            MOVE ref NEXTSIBLING REPEAT NAME;
        END WHILE;

        RETURN TRUE;
    END;
END MODULE;
```

ESQL was IBM's SQL-inspired language for message transformation in Message Broker. It was powerful, fast, and completely proprietary to IBM. Skilled Message Broker ESQL developers were in demand at IBM shops, and the skill was transferable to nowhere else.

### 7.6 IBM DataPower

**IBM DataPower** was a different product entirely: a physical hardware appliance (1U rack-mountable, purpose-built) that accelerated XML processing in hardware. DataPower was originally a startup (DataPower Technology, founded 1999) that built FPGA-based XML acceleration. IBM acquired them in 2005.

The pitch was straightforward: SOAP message processing is CPU-expensive (parsing XML, validating XSD, signing/encrypting with WS-Security), so put a hardware box in front of your application servers that does all of that in dedicated silicon. DataPower could do tens of thousands of signature verifications per second, far more than any software implementation. It was marketed as an "XML firewall" and "SOA gateway" — the point of entry where external SOAP traffic got validated, authenticated, and normalized before reaching internal services.

DataPower configuration was done through a web UI and an XML-based configuration language. The boxes were genuinely fast, genuinely secure, and genuinely expensive. A typical DataPower deployment was a pair of appliances (for HA) running $80,000-$200,000, plus maintenance and an IBM professional services engagement to configure them. Many financial services companies still have DataPower in production as the gateway for external B2B SOAP traffic in 2026.

### 7.7 Oracle Service Bus

Oracle Service Bus (OSB), originally BEA AquaLogic Service Bus (ALSB), came to Oracle through the 2008 BEA acquisition. ALSB itself came to BEA through the 2005 acquisition of Plumtree's HiPath ESB. Behind the rebrandings, OSB is the same product: a proxy-based ESB that uses WebLogic Server as its runtime and provides visual routing and transformation.

OSB's distinctive architecture was the "proxy service" / "business service" split. A **proxy service** was the externally-facing endpoint that clients called. A **business service** was the backend endpoint that OSB called. A route between them specified the transformation pipeline. This let you change the backend without changing the frontend, which is the core location-transparency pitch.

OSB was and is the integration platform of choice for Oracle-shop enterprises — particularly those that also run Oracle E-Business Suite, PeopleSoft, or Siebel. Oracle consulting partners made millions of dollars on OSB implementations. Like TIBCO and webMethods, OSB is still a live product with active customers in 2026.

### 7.8 Mule ESB / MuleSoft

**Mule ESB** was created by Ross Mason as an open-source Java ESB, first released in 2005 as a project on CodeHaus. The company MuleSource (later MuleSoft) was founded in 2006 to commercialize it. Mule was distinctive among ESBs for being open-source from the start and for having a fundamentally lighter footprint than the IBM/Oracle/TIBCO alternatives.

Mule's configuration was XML-based. A typical Mule 3 flow that received HTTP, transformed XML, and called a SOAP backend:

```xml
<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ws="http://www.mulesoft.org/schema/mule/ws"
      xmlns:xsl="http://www.mulesoft.org/schema/mule/xml">

  <http:listener-config name="httpIn" host="0.0.0.0" port="8080"/>

  <flow name="orderIntakeFlow">
    <http:listener config-ref="httpIn" path="/orders"/>
    <logger level="INFO" message="Received order: #[payload]"/>

    <xsl:transformer
        xsl-file="transforms/order-to-erp.xsl"
        returnClass="java.lang.String"/>

    <ws:consumer config-ref="erpWS" operation="CreateOrder"/>

    <set-payload value="#[payload.orderId]"/>
  </flow>

  <ws:consumer-config name="erpWS"
                      wsdlLocation="http://erp.example.com/orders?wsdl"
                      service="OrderService"
                      port="OrderPort"
                      serviceAddress="http://erp.example.com/orders"/>

</mule>
```

MuleSoft eventually pivoted the product away from "ESB" branding toward "Anypoint Platform" — an API management and integration platform that positioned Mule as an implementation detail rather than the headline product. Salesforce acquired MuleSoft in 2018 for $6.5 billion, which was the largest exit for an ESB vendor and a signal of how the category was transforming from "buy a bus" to "buy an API management platform."

### 7.9 WSO2 ESB

**WSO2** was founded in 2005 in Sri Lanka by Sanjiva Weerawarana (one of the original WSDL authors) and others. They built a complete open-source SOA platform, with WSO2 ESB as the centerpiece. The WSO2 stack included:

- **WSO2 ESB** — the bus, based on Apache Synapse.
- **WSO2 Application Server** — a Java EE app server based on Apache Tomcat.
- **WSO2 Identity Server** — identity and access management.
- **WSO2 Governance Registry** — SOA registry (replacing UDDI).
- **WSO2 Business Process Server** — BPEL execution.
- **WSO2 Data Services Server** — exposed databases as SOAP and REST services.
- **WSO2 API Manager** — API gateway (arrived later as the industry shifted to REST).

WSO2 became the open-source alternative to the commercial ESB stack for cost-conscious enterprises. The products were genuinely good and the company found reasonable commercial success. By the late 2010s WSO2 had also pivoted toward API management as the primary product, with ESB as a component rather than the headline.

### 7.10 Apache ServiceMix

**Apache ServiceMix** was an open-source ESB based on JBI (Java Business Integration, JSR 208), a Sun-led specification for a container that hosts "service engines" and "binding components." JBI was Sun's attempt to standardize the ESB component model, and ServiceMix was its reference-ish implementation. The JBI approach assumed that an ESB was a container of pluggable components communicating through a Normalized Message Router, with the NMR using a specific XML format.

ServiceMix did work and was used in production by some organizations, but JBI never achieved broad adoption. The JBI specification was overly complex, IBM and Oracle never embraced it, and the JBI containers had poor developer ergonomics. ServiceMix 4.x eventually dropped JBI as the primary model and adopted OSGi + Apache Camel as the underlying architecture, which positioned it as essentially a Karaf runtime with Camel routes on top. By around 2012, most ServiceMix users had effectively become Camel users.

### 7.11 Microsoft BizTalk Server

**Microsoft BizTalk Server** was Microsoft's enterprise integration product, first released in 2000. It pre-dated the ESB label — BizTalk was originally positioned as an "e-business integration server" — but by the mid-2000s it was marketed as an ESB. BizTalk was a very different product from the Java ESBs architecturally: it was tightly integrated with SQL Server (which held all the runtime state), it used Visual Studio as the development environment, and its runtime was the BizTalk Runtime Host, a Windows service.

BizTalk's central abstractions were:

- **Schemas** — XML Schema definitions for messages.
- **Maps** — visual XSLT-ish mappings between schemas, edited in Visual Studio.
- **Orchestrations** — visual process flows, compiled to .NET assemblies. The orchestration language was XLANG/s, a precursor to BPEL.
- **Pipelines** — configurable chains of pipeline components that process messages on receive and send.
- **Receive and Send Ports** — endpoints with adapters for HTTP, FTP, MSMQ, SQL, file, POP3, SMTP, and dozens of proprietary systems.

A BizTalk orchestration looked like a flowchart in Visual Studio, with shapes for Receive, Send, Decision, Parallel, Transform, and so on. Under the hood it compiled to a class that ran on the BizTalk runtime. BizTalk supported WS-* via WCF adapters and was widely used in Microsoft-shop enterprises for B2B integrations, EDI, and internal system orchestration. As of 2026, BizTalk is still supported (the most recent release is BizTalk Server 2020) but Microsoft has effectively stopped investing in it, with the forward path being Azure Logic Apps and Azure Integration Services.

### 7.12 The ESB promises and the ESB reality

The ESB vendor pitch was remarkably consistent across all the products. Every vendor slide deck had some version of:

- **"Decouple your services"** — services don't need to know about each other, just the bus.
- **"Location transparency"** — endpoints can move without clients changing.
- **"Protocol mediation"** — SOAP can talk to JMS can talk to FTP can talk to MQ.
- **"Format transformation"** — XML to XML, XML to JSON, X12 EDI to XML, whatever.
- **"Centralized monitoring"** — see everything from one place.
- **"Reduced TCO"** — fewer point-to-point integrations means less code to maintain.
- **"Agility"** — you can change routing rules without redeploying services.

The reality was more complicated. Let me enumerate the pathologies that every large ESB deployment eventually hit:

**Vendor lock-in.** Once you had 500 routes in TIBCO BusinessWorks, migrating off of TIBCO was a multi-year project costing tens of millions of dollars. The "loose coupling" story applied to services talking through the bus, but the bus itself was the tightest coupling in the enterprise. Every ESB vendor knew this and priced accordingly.

**Single point of failure.** If the ESB went down, everything that depended on it went down. Enterprises responded by running the ESB in a high-availability cluster, which added operational complexity, added cost, and did not actually eliminate the failure mode. Regular outages of the ESB cluster took down whole swaths of the enterprise's integrations.

**Performance bottleneck.** Every message through the ESB added latency — parsing, transformation, routing, logging. A simple point-to-point SOAP call might be 20 ms; the same call through the ESB might be 100-200 ms. For low-latency use cases (trading, real-time pricing), the ESB was a non-starter. Enterprises either bypassed the ESB for these cases (violating their own governance) or accepted a major performance penalty.

**Operational complexity.** ESBs are complicated infrastructure. They had their own installation procedures, their own HA configurations, their own monitoring needs, their own upgrade paths, their own specialist skills. A large ESB team at a Fortune 500 bank was often 20-50 people doing nothing but keeping the bus running. This cost was rarely accounted for in the TCO analyses that justified the purchase.

**The "thick bus" anti-pattern.** The ESB was supposed to provide generic routing and transformation, with business logic staying in the services. In practice, teams put business logic into the bus — "if the order total is over $100K and the customer is international and the product line is Widgets, route to the compliance queue" — and the bus accumulated thousands of lines of integration-specific rules. When the ESB grew an application inside it, it became the monolith it was supposed to prevent.

**The governance gate.** Because the ESB was centralized, every new integration had to go through the ESB team. The ESB team became a bottleneck and a political power broker. Application teams learned to hate the ESB team, work around them when possible, and submit formal tickets when not. The "agility" promise of the ESB was exactly inverted: adding a new service integration might take six months of ESB team backlog.

**Cost.** The commercial ESBs were wildly expensive. Licensing a TIBCO or webMethods or Oracle Service Bus for a Fortune 500 bank would cost $2-10M in initial license fees, $500K-2M per year in maintenance, plus implementation consulting that could easily reach $20-50M on a multi-year SOA initiative. Many of these deals went sideways and delivered far less value than promised.

**The ESB as the new EAI.** By 2010, several influential analysts (Anne Thomas Manes, Gregor Hohpe, others) were pointing out that the ESB had become exactly what it was supposed to replace: a centralized integration hub with its own proprietary vendor stack, no different from the EAI tools of the late 1990s that had spawned the SOA movement in the first place. "Meet the new boss, same as the old boss," one famous blog post put it.

The ESB was the architectural pattern that most fully embodied both the ambitions and the failures of enterprise SOA. When it worked, it worked — there are still major financial institutions running TIBCO BusinessWorks and IBM Integration Bus very successfully, processing billions of dollars in transactions daily. But the "successful" ESB deployments were ones where the organization was willing to invest the operational discipline to make it work, pay the vendor tax, and accept the architectural downsides. The "failed" ESB deployments, which were far more numerous, ended up as expensive exercises in centralization that teams quietly worked around.

---

## 8. Apache Camel — a deeper look

Apache Camel deserves its own section, because it occupied an unusual position in the ESB landscape and it outlived most of its competitors. Camel is not exactly an ESB — it is a Java integration library — but it solved many of the problems that ESBs were built to solve, and it did so in a way that avoided several of the ESB pathologies.

### 8.1 Origins: Gregor Hohpe's EIP book as the foundation

Apache Camel was started in 2007 by James Strachan as a project at Apache. Strachan had been working on ActiveMQ and ServiceMix, and wanted a lightweight DSL-based integration framework that implemented the patterns described in Gregor Hohpe and Bobby Woolf's 2003 book "Enterprise Integration Patterns." The book catalogued 65 patterns for asynchronous messaging systems (more on the book in the next section). Strachan's insight was that those patterns could be expressed as a Java DSL, where each pattern became a method on a builder object, and routes were composed as fluent chains.

The first Camel release was in July 2007. It rapidly became the de facto open-source Java integration framework. Apache ServiceMix adopted Camel as its core routing engine. Mule eventually added Camel support as an alternative DSL. FuseSource (which later became part of Red Hat) commercialized Camel as Red Hat Fuse. By 2015, Camel was the most widely-used integration framework in the Java ecosystem, commercial or open source.

### 8.2 The Camel DSL

Camel's central abstraction is a **route**, which is a chain of processing steps between a source endpoint and one or more destination endpoints. Routes are expressed in one of several DSL styles:

**Java fluent DSL** (most popular):

```java
from("file:data/inbox?delete=true")
    .routeId("orderIntake")
    .unmarshal().jaxb("com.example.orders")
    .filter(simple("${body.amount} > 1000"))
    .choice()
        .when(simple("${body.currency} == 'USD'"))
            .to("jms:queue:orders.usd")
        .when(simple("${body.currency} == 'EUR'"))
            .to("jms:queue:orders.eur")
        .otherwise()
            .to("jms:queue:orders.other")
    .end()
    .log("Routed order ${body.id} to ${header.CamelJmsDestinationName}");
```

**Spring XML DSL** (for people who prefer XML configuration):

```xml
<camelContext xmlns="http://camel.apache.org/schema/spring">
  <route id="orderIntake">
    <from uri="file:data/inbox?delete=true"/>
    <unmarshal>
      <jaxb contextPath="com.example.orders"/>
    </unmarshal>
    <filter>
      <simple>${body.amount} &gt; 1000</simple>
      <choice>
        <when>
          <simple>${body.currency} == 'USD'</simple>
          <to uri="jms:queue:orders.usd"/>
        </when>
        <when>
          <simple>${body.currency} == 'EUR'</simple>
          <to uri="jms:queue:orders.eur"/>
        </when>
        <otherwise>
          <to uri="jms:queue:orders.other"/>
        </otherwise>
      </choice>
    </filter>
    <log message="Routed order ${body.id}"/>
  </route>
</camelContext>
```

**Scala DSL** and **Groovy DSL** also existed. More recently, **YAML DSL** was added for Camel K.

### 8.3 Components: 300+ and counting

Camel's power came from its component library. A component is an adapter for a specific protocol or system, addressed by a URI scheme. The URI `file:data/inbox?delete=true` uses the **file component** with a directory path and a query parameter. The URI `jms:queue:orders.usd` uses the **jms component**. Camel shipped with hundreds of components and the community added more:

- **file** — local filesystem
- **ftp**, **ftps**, **sftp** — remote file transfer
- **http**, **http4**, **https4** — HTTP client
- **jetty**, **netty-http** — HTTP server
- **jms**, **activemq**, **amqp** — JMS/AMQP messaging
- **kafka** — Apache Kafka
- **rabbitmq** — RabbitMQ
- **jdbc**, **sql**, **jpa**, **mybatis** — databases
- **mail**, **imap**, **pop3**, **smtp** — email
- **cxf**, **spring-ws** — SOAP web services
- **restlet**, **jax-rs**, **rest** — REST services
- **aws-s3**, **aws-sqs**, **aws-sns**, **aws-dynamodb**, **aws-lambda**, **aws-kinesis** — AWS services
- **azure-blob**, **azure-queue**, **azure-servicebus** — Azure services
- **google-pubsub**, **google-storage**, **google-bigquery** — Google Cloud
- **salesforce**, **sap-netweaver**, **oracle-ebs** — enterprise apps
- **twitter**, **slack**, **telegram** — social/messaging
- **mongodb**, **cassandra**, **elasticsearch**, **redis** — NoSQL

By Camel 3.x there were more than 300 components. Any integration problem you might encounter had at least one, often several, components available. And because a route is just a URI → URI pipeline, you could connect any component to any other. This is what made Camel genuinely powerful: you could glue FTP to Kafka to Elasticsearch to Slack in a few lines of Java, and it would work.

### 8.4 The core abstractions: Exchange, Message, Body, Headers

Underneath the DSL, Camel's runtime model is built on a few core types:

- **Exchange** — represents a message flowing through a route. Has an IN message and (for in-out exchanges) an OUT message.
- **Message** — a single message with a body and a map of headers.
- **Body** — the payload. Can be any Java object — a String, a byte array, a POJO, a DOM Document, anything.
- **Headers** — a `Map<String, Object>` for metadata. Some headers are Camel-internal (e.g., `CamelFileName`), some are protocol-specific (e.g., HTTP headers), some are user-defined.
- **Properties** — similar to headers but scoped to the Exchange, not the Message. Used for cross-route state.

A Camel **Processor** is the most primitive unit of work:

```java
public class EnrichOrderProcessor implements Processor {
    @Override
    public void process(Exchange exchange) throws Exception {
        Order order = exchange.getIn().getBody(Order.class);
        Customer customer = lookupCustomer(order.getCustomerId());
        order.setCustomer(customer);
        exchange.getIn().setBody(order);
        exchange.getIn().setHeader("CustomerRegion", customer.getRegion());
    }
}
```

You can plug this into a route:

```java
from("jms:queue:orders.incoming")
    .process(new EnrichOrderProcessor())
    .to("jms:queue:orders.enriched");
```

Or inline as a lambda (Camel 2.8+):

```java
from("jms:queue:orders.incoming")
    .process(exchange -> {
        Order order = exchange.getIn().getBody(Order.class);
        order.setTimestamp(System.currentTimeMillis());
    })
    .to("jms:queue:orders.enriched");
```

### 8.5 Real-world Camel routes: three examples

**Example 1: File-to-database batch import with error handling**

```java
from("file:data/inbox?move=.done&moveFailed=.failed&delete=false")
    .routeId("csvImport")
    .onException(Exception.class)
        .maximumRedeliveries(3)
        .redeliveryDelay(5000)
        .handled(true)
        .log(LoggingLevel.ERROR, "Failed to process ${file:name}: ${exception.message}")
        .to("file:data/dead-letter")
    .end()
    .log("Processing file ${file:name}")
    .unmarshal().csv()
    .split(body()).streaming()
        .convertBodyTo(String[].class)
        .process(exchange -> {
            String[] row = exchange.getIn().getBody(String[].class);
            Customer c = new Customer();
            c.setId(row[0]);
            c.setName(row[1]);
            c.setEmail(row[2]);
            exchange.getIn().setBody(c);
        })
        .to("jpa:com.example.Customer")
    .end()
    .log("Imported ${file:name} (${exchangeProperty.CamelSplitSize} rows)");
```

This route watches a directory, streams CSV files row by row, converts each row to a Customer object, persists it via JPA, and moves the file to `.done` on success or `.failed` on error. The `onException` block defines retry and dead-letter behavior. This would be several hundred lines of boilerplate Java without Camel.

**Example 2: HTTP-to-Kafka with transformation**

```java
from("jetty:http://0.0.0.0:8080/orders?httpMethodRestrict=POST")
    .routeId("ordersHttp")
    .log("Received HTTP order: ${body}")
    .unmarshal().json(JsonLibrary.Jackson, Order.class)
    .setHeader("orderId", simple("${body.id}"))
    .setHeader("customerId", simple("${body.customerId}"))
    .marshal().json(JsonLibrary.Jackson)
    .to("kafka:orders?brokers=kafka.example.com:9092")
    .setBody(constant("{\"status\":\"accepted\"}"))
    .setHeader(Exchange.HTTP_RESPONSE_CODE, constant(202))
    .setHeader(Exchange.CONTENT_TYPE, constant("application/json"));
```

This exposes an HTTP endpoint that accepts JSON orders, enriches them with header metadata, publishes to a Kafka topic, and responds with 202 Accepted. Again, dramatically less code than doing the same thing manually.

**Example 3: Legacy SOAP bridging**

```java
from("cxf:bean:legacySoapEndpoint")
    .routeId("legacyBridge")
    .log("Received legacy SOAP request")
    .process(exchange -> {
        // Extract from the SOAP XML structure
        MessageContentsList inParams =
            exchange.getIn().getBody(MessageContentsList.class);
        String accountNumber = (String) inParams.get(0);
        exchange.getIn().setHeader("accountNumber", accountNumber);
    })
    .setHeader(Exchange.HTTP_METHOD, constant("GET"))
    .setHeader(Exchange.HTTP_PATH, simple("/api/v2/accounts/${header.accountNumber}/balance"))
    .to("http4://modern-banking-api.example.com")
    .unmarshal().json(JsonLibrary.Jackson, BalanceResponse.class)
    .process(exchange -> {
        // Repack as SOAP response
        BalanceResponse balance = exchange.getIn().getBody(BalanceResponse.class);
        MessageContentsList outParams = new MessageContentsList();
        outParams.add(balance.getAmount());
        outParams.add(balance.getCurrency());
        exchange.getIn().setBody(outParams);
    });
```

This is the "SOAP facade" pattern that many enterprises use to keep legacy SOAP interfaces alive while the backend is rewritten as REST. Camel is exceptional at this kind of bridging because its component library covers both worlds.

### 8.6 Why Camel outlived most ESBs

Camel is still alive and heavily used in 2026, while TIBCO BusinessWorks and webMethods are in maintenance mode and Oracle Service Bus is a legacy product. Why did Camel survive?

**It was a library, not a product.** Camel did not require you to run a dedicated ESB server or buy licenses. You added a Maven dependency to your existing application and started writing routes. This removed the operational burden that killed so many ESB deployments.

**It was embedded, not centralized.** A Camel route ran inside your application, not in a shared bus. Each team could have their own Camel routes, each team could deploy independently, and no central team gated deployments. This avoided the ESB-as-bottleneck pathology.

**It fit into modern deployment models.** As Java deployments evolved from application servers to Spring Boot to Docker containers to Kubernetes, Camel evolved with them. A Camel-based Spring Boot application could be containerized and deployed to Kubernetes without any architectural changes.

**Apache Camel K.** In 2019, the Camel project introduced **Camel K**, a Kubernetes-native Camel runtime. A Camel K "integration" is a single route file deployed to a Kubernetes cluster, which is automatically wrapped in a pod, exposed via a Service, and managed by an Operator. This was a clean adaptation of the Camel model to cloud-native infrastructure.

A Camel K integration file looks like:

```java
// orders-to-kafka.java
import org.apache.camel.builder.RouteBuilder;

public class OrdersToKafka extends RouteBuilder {
    @Override
    public void configure() throws Exception {
        from("platform-http:/orders?httpMethodRestrict=POST")
            .log("Received order: ${body}")
            .to("kafka:orders?brokers=kafka:9092");
    }
}
```

Deploy with:
```bash
kamel run orders-to-kafka.java
```

And the Camel K Operator provisions everything — the pod, the service, the HTTP route, the Kafka client. This is the ESB pattern reimagined for a Kubernetes world: decentralized, declarative, and managed by the platform rather than by a dedicated ESB team.

**The EIP patterns are evergreen.** Camel's DSL is a direct expression of the EIP patterns, which turn out to still be relevant regardless of whether you are integrating SOAP services or Kafka topics. The 65 patterns from the 2003 book are still what you need to build integration flows in 2026. Camel was never really about SOAP — it was about expressing integration patterns in Java, and the patterns survived the transition away from SOAP.

---

## 9. Enterprise Integration Patterns

### 9.1 The book

"Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions" was published in October 2003 by Gregor Hohpe (then at ThoughtWorks, later Google, later AWS) and Bobby Woolf. It is widely considered one of the most important software books of the 2000s, on par with the Gang of Four's "Design Patterns" (1994) and Martin Fowler's "Patterns of Enterprise Application Architecture" (2002). The book catalogued 65 patterns for asynchronous messaging systems and gave each pattern a memorable name and a distinctive icon that became iconography for the integration community.

The book was written in the pre-SOAP era — the authors explicitly positioned the patterns as independent of any specific technology — but it was published just as the SOA wave was cresting, and it rapidly became the canonical reference for anyone building integration on top of JMS, MSMQ, MQ Series, SOAP, or any of the other messaging systems of the era. Every ESB vendor's documentation cited the book. Every integration consultant owned a copy. Apache Camel's DSL is a direct expression of the patterns in the book.

### 9.2 The 65 patterns

The patterns are organized into categories. I will list them and briefly annotate the ones that matter most.

**Messaging systems (foundational):**

- **Message Channel** — a named connection through which messages flow. Mapped directly to JMS queues/topics, Kafka topics, MQ queues.
- **Message** — a unit of data flowing through a channel, with a header and a body.
- **Pipes and Filters** — chain of processing steps, each reading from one channel and writing to another.
- **Message Router** — receives a message and decides which channel to send it to.
- **Message Translator** — transforms a message from one format to another.
- **Message Endpoint** — where an application connects to a channel.

**Messaging channels:**

- **Point-to-Point Channel** — one sender, one receiver. Maps to JMS queue.
- **Publish-Subscribe Channel** — one sender, multiple receivers. Maps to JMS topic.
- **Datatype Channel** — a channel that carries only messages of a specific type.
- **Invalid Message Channel** — the channel where malformed messages go.
- **Dead Letter Channel** — the channel where undeliverable messages go.
- **Guaranteed Delivery** — persistent storage of messages so they survive failures.
- **Channel Adapter** — connects an application to a messaging system.
- **Messaging Bridge** — connects two messaging systems together.
- **Message Bus** — a unifying channel abstraction across an enterprise.

**Message construction:**

- **Command Message** — a message that instructs the receiver to do something.
- **Document Message** — a message that carries data without implying action.
- **Event Message** — a message that reports that something happened.
- **Request-Reply** — a pair of messages implementing a synchronous RPC-like pattern over async channels.
- **Return Address** — the reply channel in a request-reply.
- **Correlation Identifier** — matches replies to requests.
- **Message Sequence** — splits a large conceptual message into ordered parts.
- **Message Expiration** — messages become invalid after a timeout.
- **Format Indicator** — a header field identifying the message format for evolution.

**Routing:**

- **Content-Based Router** — routes based on message content (e.g., "orders over $100K go to priority queue").
- **Message Filter** — drops messages that don't match a criterion.
- **Dynamic Router** — routes based on a runtime-updated routing table.
- **Recipient List** — sends a message to a dynamically-computed list of recipients.
- **Splitter** — breaks a composite message into multiple smaller messages.
- **Aggregator** — collects related messages and combines them into one.
- **Resequencer** — restores ordering to messages that arrived out of order.
- **Composed Message Processor** — a splitter followed by parallel processing followed by an aggregator.
- **Scatter-Gather** — sends a request to multiple providers, gathers the responses.
- **Routing Slip** — a message carries its own routing instructions.
- **Process Manager** — stateful orchestration of a multi-step workflow.
- **Message Broker** — a central point that routes messages between producers and consumers.

**Transformation:**

- **Envelope Wrapper** — wraps a message in an envelope to carry metadata or security info.
- **Content Enricher** — adds information to a message by looking up data elsewhere.
- **Content Filter** — removes unwanted parts of a message.
- **Claim Check** — store the message body elsewhere, pass only a reference.
- **Normalizer** — converts various input formats to a canonical internal format.
- **Canonical Data Model** — a shared common schema that all applications translate to.

**Endpoints:**

- **Messaging Gateway** — encapsulates messaging code so the application doesn't see it.
- **Messaging Mapper** — maps between messages and domain objects.
- **Transactional Client** — a client that uses transactions for message operations.
- **Polling Consumer** — the receiver polls for messages.
- **Event-Driven Consumer** — the receiver is notified when a message arrives.
- **Competing Consumers** — multiple consumers share a queue.
- **Message Dispatcher** — dispatches messages to handlers within a consumer.
- **Selective Consumer** — receives only messages matching a filter.
- **Durable Subscriber** — receives messages from a topic even when offline.
- **Idempotent Receiver** — handles duplicate messages correctly.
- **Service Activator** — invokes a service when a message arrives.

**Management:**

- **Control Bus** — a separate channel for management messages.
- **Detour** — conditionally routes messages through additional processing steps (e.g., logging, validation).
- **Wire Tap** — non-destructive copy of a message for monitoring.
- **Message History** — records the path a message took through the system.
- **Message Store** — persistent log of all messages for audit/replay.
- **Smart Proxy** — intercepts replies to add metadata or tracking.
- **Test Message** — a synthetic message for monitoring health.
- **Channel Purger** — empties a channel.

### 9.3 Why EIP is still the canonical reference

Twenty years after publication, the EIP book is still the reference you reach for when designing an integration system. This is remarkable given how much the underlying technology has changed. The patterns were written for JMS, and they map equally well to Kafka, RabbitMQ, AWS SQS, Azure Service Bus, and NATS. The patterns were written for the pre-SOAP era, and they map equally well to SOAP, REST, gRPC, and GraphQL. The patterns were written for the pre-cloud era, and they map equally well to Kubernetes service meshes and serverless event-driven architectures.

The reason is that the patterns address fundamental problems in asynchronous messaging that do not depend on the wire format:

- How do you route messages based on content? **Content-Based Router.** This is just as relevant for a Kafka Streams application in 2026 as it was for a JMS application in 2003.
- How do you break a big message into parts, process them, and reassemble? **Splitter + Aggregator.** Every streaming system in the world has an implementation of this.
- How do you handle a large payload without putting the entire payload in every message? **Claim Check.** Kafka's recommendation to store large payloads in S3 and send only the S3 key on the topic is the Claim Check pattern.
- How do you ensure duplicate messages do not cause duplicate effects? **Idempotent Receiver.** This is the foundation of "exactly-once" semantics in modern streaming systems.
- How do you handle messages that cannot be processed? **Dead Letter Channel.** Every message broker has a DLQ concept, and the name comes from EIP.
- How do you track the path of a message through a complex system? **Message History.** This is distributed tracing, which OpenTelemetry implements today.

The book does not solve these problems for you — it names them, gives you a vocabulary, and shows you the trade-offs. The naming is the valuable part. When I say "let's use a Claim Check for the large file uploads" to another engineer, we both instantly know what I mean. That shared vocabulary has persisted for two decades because the underlying problems are permanent.

### 9.4 How EIP maps to Kafka, Kubernetes, and streaming systems

Let me walk through a few specific modern mappings to make the continuity concrete.

**Content-Based Router in Kafka Streams:**

```java
KStream<String, Order> orders = builder.stream("orders");
Map<String, KStream<String, Order>> branches = orders.split(Named.as("order-"))
    .branch((key, order) -> order.getCurrency().equals("USD"),
            Branched.as("usd"))
    .branch((key, order) -> order.getCurrency().equals("EUR"),
            Branched.as("eur"))
    .defaultBranch(Branched.as("other"));

branches.get("order-usd").to("orders.usd");
branches.get("order-eur").to("orders.eur");
branches.get("order-other").to("orders.other");
```

This is a Content-Based Router, implemented on Kafka Streams instead of JMS + ESB, but the pattern is exactly the same.

**Splitter/Aggregator in AWS Step Functions:**

```json
{
  "StartAt": "Split",
  "States": {
    "Split": {
      "Type": "Map",
      "ItemsPath": "$.lineItems",
      "Iterator": {
        "StartAt": "ProcessLineItem",
        "States": {
          "ProcessLineItem": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:...:function:process-line-item",
            "End": true
          }
        }
      },
      "ResultPath": "$.processedItems",
      "Next": "Aggregate"
    },
    "Aggregate": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:...:function:aggregate-results",
      "End": true
    }
  }
}
```

This is Splitter + Aggregator, implemented as a Step Functions Map state instead of a Camel route, but the pattern is exactly the same.

**Claim Check in Kafka + S3:**

A producer that has a 100 MB document uploads it to S3 and publishes a Kafka message with just the S3 URL:

```java
String s3Key = "documents/" + UUID.randomUUID();
s3.putObject(bucket, s3Key, documentBytes);

ClaimCheckMessage msg = new ClaimCheckMessage();
msg.setBucket(bucket);
msg.setKey(s3Key);
msg.setDocumentId(documentId);
msg.setContentType("application/pdf");

producer.send(new ProducerRecord<>("document-uploads", documentId, msg));
```

Consumers receive the small message, fetch the document from S3 when needed, and optionally delete the S3 object after processing. This is the Claim Check pattern, exactly as the book described it, on Kafka + S3.

**Dead Letter Channel in Kubernetes + Kafka:**

Any serious Kafka consumer has a DLQ topic for messages that fail processing repeatedly. The Spring Kafka `@KafkaListener` has `@RetryableTopic` and DLT support built in:

```java
@KafkaListener(topics = "orders")
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2.0),
                dltTopicSuffix = "-dlt")
public void handleOrder(Order order) {
    orderService.process(order);
}

@DltHandler
public void handleDlt(Order order, @Header(KafkaHeaders.EXCEPTION_MESSAGE) String error) {
    log.error("Failed order {} after retries: {}", order.getId(), error);
    deadLetterService.record(order, error);
}
```

This is the Dead Letter Channel pattern.

The point is not that these modern systems copied the EIP book. The point is that the EIP book catalogued the problems that arise whenever you build an integration system, and any subsequent integration system has to solve the same problems. The specific syntax changes — XML routes in ESB, fluent Java in Camel, JSON state machines in Step Functions, topology builders in Kafka Streams — but the patterns underneath are invariant.

### 9.5 EIP as a design vocabulary

The highest value of the EIP book is not the individual patterns but the shared vocabulary. When an architecture team discusses an integration design and someone says "let's use a recipient list here with a scatter-gather for the pricing engines and a timeout on each branch," every experienced integration engineer in the room knows exactly what that means. The patterns have stable names, stable icons (the book's little pictograms are recognizable even today), and stable semantics. That shared vocabulary is one of the EIP book's most durable contributions, and it is the reason it is still on the shelf of every serious integration engineer in 2026.

---

*Part 3 of 6 complete. Sections 10-13 (BPEL, governance, tooling, certification) next.*
