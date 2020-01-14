---
author: "Adeshina Hassan"
linktitle: logging in Go
title: "Designing A Basic Logging System in Go Application"
categories: ["Go", "Golang"]
tags: ["observability", "go", "golang", "logging", "backend"]
date: 2019-12-27
weight: 10
---

<img src="/img/golang-cover.png" />


## Introduction

Many companies are betting on Go due to its composability, scalability, and concurrency, and other super interesting features. Simple web services and microservices applications require a well-considered logging strategy to help us understand user behavior, localize errors, and monitor the performance of our applications. In this blog, we are going to explore Tracing, Metric, and Logging. Logging, in particular, will receive the highest focus.

<img src="/img/metric-tracing.png" />

## Tracing / Monitoring / Logging


## What is Tracing?
Tracing covers the wider and continuous view of an application than Logger does. The main reason for implementing tracing is to enable the overseeing of the application’s flow and data progression in and out of the application. As a result, tracing plays a more dirty role than Logging.

Tracing represents a single user’s journey through an entire application. This allows engineers to identify bottlenecks and focus on improving and optimizing the performance of the application. The “runtime/trace” offers facilities for programs to generate traces for the Go execution tracer. When a problem does occur, tracing allows you to see how you got there: which function, the function’s duration, parameters passed, and how deep into the function the user could get. In an ideal Go application, every function has tracing enabled. But, the amount of resulting data can be too much to sort, although cloud technology such as Stackdriver (can be used via OpenCensus go package) can help with instrumenting the tracing process in your application.

Example: The following code records four regions in the execution trace to trace the durations of sequential steps in a cappuccino making operation (from the Trace official package):

```
trace.WithRegion(ctx, “makeCappuccino”, func() {
    // orderID allows to identify a specific order
    // among many cappuccino order region records.
    trace.Log(ctx, “orderID”, orderID)
    trace.WithRegion(ctx, “steamMilk”, steamMilk)
    trace.WithRegion(ctx, “extractCoffee”, extractCoffee)
    trace.WithRegion(ctx, “mixMilkCoffee”, mixMilkCoffee)
})
```

### What is Monitoring?
The term “monitoring” may be used for tracing or logging or a number of other activities casually. However, monitoring is much more specific: instrumenting an application and then collecting, aggregating, and analyzing metrics in order to improve your understanding of how your application behaves.

This type of monitoring is primarily diagnostic — for instance, alerting developers when a system isn't working as it should. In an ideal world where cost isn’t a problem, you could instrument and monitor all of your services. One of the fantastic tools out there for implementing Monitoring in Go application is Opentracing (please check them out).

### What is Logging?
Logging provides us with error report-tracking and related data in a strategically centralized format. Logging can be implemented for small and huge applications of different patterns. The log file serves is considered the first place to visit for obtaining discrete events within your application. Discrete events can be failure, error, or a state transformation in your application that can indicate the main cause for the event.


## The tools for implementing Logging in Go application:
**1- The built-in "Log" Library**: you can use the Golang’s built-in logging library, namely “log”. The package comes with a default logger that writes to standard error and adds a timestamp without the need for configuration. Personally, I find this package more useful for local development when I need to get fast feedback from my code without worrying about generating a rich, structured log:

```
package main
import (“log” “errors” “fmt”)

func add(f int64, s int64) (int64, error) {
    if f < 0 && s < 0 {
         return 0, errors.New(“cannot add signed numbers”)
    }
    return f * s, nil
}
func main() {
    var first, second int64
    first, second = 10, 20
    //first, second = -10, -20
    
    result, err := add(first, second)
    
    if err != nil{
       log.Print(err)
    }
    fmt.Println(result)
}
```


**2- The Mighty “Logrus” package**: You can use Logrus for formatted logs. This is a highly recommended package as it designed for structured logging in a suitable format like JSON. Since JSON format is supported by many languages, this makes it possible for machines to easily parse your Golang logs. The code snippet below provides us with an example and expected result:

```
package main
import (log “github.com/sirupsen/logrus”)
func main() {
      log.SetFormatter(&log.JSONFormatter{})
      coreFields := log.Fields{ “gopher_lagos”: “staging-1”, “meetup”: “foo-app”, “session”: “1ce3f6v”, }
    log.WithFields(coreFields).WithFields(log.Fields{“product_type”: “ticket”, “quantity”: 3, “price”:100.0}).Info(“This is for Gophers Lagos Meetup”)
}
```

The above snippet would result in this:
```
{“gopher_lagos”:”staging-1",”level”:”info”,”meetup”:”foo-app”,”msg”:”This is for Gophers Lagos Meetup”,”number”:3,”price”:100,”product_type”:”ticket”,”session”:”1ce3f6v”,”time”:”2009–11–10T23:00:00Z”}
```



### Best Practices for designing and storing Golang logs (DatadogHQ, 2019):

### 1- Avoid declaring goroutines for logging:
There are two reasons to avoid creating your own goroutines to handle writing logs. First, it can lead to concurrency issues, as duplicates of the logger would attempt to access the same io.Writer. Second, logging libraries usually start goroutines themselves, managing any concurrency issues internally, and starting your own goroutines will only interfere.


### 2- Write your logs to a file
As you collect logs from your application, it is recommended that you write them to a local file directly (not to remote file directly). You need to ensure that your logs are always available locally and not lost in the network.

### 3- Implement a standard logging interface
In a team of developers/engineers, it is probable to see members using different attribute names to describe the same thing. This can lead to an unresolvable inconsistency in your logs and make it drastic to correlate logs that should form part of the same picture. For example, two developers might log the same error, "a missing client name" when handling an upload, in different ways. Implementing a standard logging interface is the only way to avoid such a disaster.

Let's look at a practical example. Below struct defined the objects/events we wish to log. Of course, we can add more events to the list:

```
type LogEvent struct {
    id int
    message string
}
```

Variables to store our log messages as new Events:
```
var (
     invalidArgMessage = LogEvent{1, “Invalid arg: %s”}
     invalidArgValueMessage = LogEvent{2, “Invalid value for argument: %s: %v”}
     missingArgMessage = LogEvent{3, “Missing arg: %s”}
)
```

Standard error messages and init():
```
// Standard “InvalidArg error messagefunc (m *MainLogger) InvalidArg(argumentName string){
    m.Errorf(invalidArgMessage.message, argumentName)
}
// Standard “InvalidArgValue error message
func (m *MainLogger) InvalidArgValue(argumentName string, argumentValue string){
    m.Errorf(invalidArgValueMessage.message, argumentName, argumentValue)
}
// “Standard “MissingArg error message”
func (m *MainLogger) MissingArg(argumentName string){
    m.Errorf(missingArgMessage.message, argumentName)
}
// MainLogger enforces specific log message formats (we are using logrus, but you are free to use other libraries)
type MainLogger struct {
   *logrus.Logger
}
func init() {
    // Log as JSON instead of the default ASCII formatter.
    logrus.SetFormatter(&logrus.JSONFormatter{})
}
```

Creating a constructor/initializer to return our “MainLogger” struct:
```
func NewLogger() *MainLogger {
     f, err := os.OpenFile(“logrus.log”,      os.O_APPEND|os.O_CREATE|os.O_RDWR, 0666)
     if err != nil {
         fmt.Printf(“error opening file: %v”, err)
     }
     var baseLogger = logrus.New()
     var standardLogger = &MainLogger{baseLogger}
     standardLogger.Formatter = &logrus.JSONFormatter{}
     mw := io.MultiWriter(os.Stdout, f)
     standardLogger.SetOutput(mw) return standardLogger
}
```

We are done designing the basic standard interface and can start calling the methods in our Go files as:
```
var standardLogger = logger.NewLogger()

// invoke method when an argument is missing
standardLogger.MissingArg(“imgModel.ImageData”)

// invoke method when an invalid argument is supplied
standardLogger.InvalidArg(“imgModel.ImageData”)
```

#### 4- Centralize Golang logs:
Some Go applications are deployed across a cluster of hosts. When you need to check/investigate your logs in those hosts, you would be compelled to SSH into each one of them. Absolutely, this is not efficient in any way! A scalable and efficient solution is to pass log from local files to a central platform where you can then process the logs as you deem required. There are many ways to achieve this; one way is to use the Golang syslog package to forward logs from throughout your infrastructure to a single syslog server. Another way is to use a log management solution. Datadog and Opentracing, for example, can tail your log files and forward logs to a central platform for processing and analysis.


## Summary
In this blog, we have learned about Tracing, Monitoring, and Logging and their various usage. Moreso, we dived deeper into Logging, discussed both standard and third-party logging libraries, best practice of implementing logging in Go applications, and provided code samples.

I really hope you enjoy reading this blog as much as I enjoyed writing it. The entire codebase can be found [HERE](https://github.com/D-sense/logger-api-demo/blob/master/log/logger.go).

Let's keep Go-ing :)




