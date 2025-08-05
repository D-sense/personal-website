---

date: 2019-09-01
linktitle: Sending SMS in Golang
title: Sending SMS in Golang to Nigeria Phone Numbers
categories: ["Go", "Golang"]
tags: ["sms", "go", "golang", "nigeria", "backend"]
weight: 10
hero: /img/posts/golang-cover.png
hero_credit: "Photo by Gopher Community"
hero_source: "https://golang.org"
---

## Introduction

This tutorial will show you how to handle sending SMS in Go to Nigeria phone numbers with ease. To be specific, in the last two API services I programmed for a Nigerian client, part of the requirements is the ability to send SMS to customers without attracting a noticeable cost. This means, to get a very cost-effective rate for each SMS sent, there has to be an integration with local SMS vendors. As a result, I created this [client package](https://github.com/D-sense/sms-nigeria-go) to implement this feature. Currently, the package supports two vendors, namely [Bulk SMS Nigeria](https://www.bulksmsnigeria.com/) and [SMS Clone](http://smsclone.com).

### Requirement

I assume that you are familiar with Go (basic knowledge of the language will do). In addition, you have Go downloaded and installed.

### Usage

We'll start with downloading and importing the package:

```go
# download the package
go get github.com/d-sense/sms-nigeria-go
```

```go
# import the package in .go file
"github.com/d-sense/sms-nigeria-go"
```

In the .go (this may be the main.go or any other file in which you want to add the SMS service) file, declare and initialize the notification service (service could be any of the supported vendors you have registered with), and send data:

##### *Bulk SMS Nigeria vendor  --> [register and redeem your account here](https://www.bulksmsnigeria.com/)

```go
#To send SMS:

# declaring the notification service
var bulkSmsNigeria sms_nigeria_go.SmsController

# declare, initialize, and send data
data := &sms_nigeria_go.BulkSmsNigeriaNotification{
	Sender:    os.Getenv("SMS_SENDER"),
	Recipient: recipient,
	Body:      textMessage,
	ApiToken:  os.Getenv("BULK_SMS_NIGERIA_API_TOKEN"),
}

result, err := repo.SendBulkSmsNigeria(data)
if err != nil {
	log.Fatal(err)
}
fmt.Println(result)
```

##### *SMS Clone vendor  --> [register and redeem your account here](http://smsclone.com)

```go
#To send SMS:

# declare the notification service
var smsClone sms_nigeria_go.SmsController

# declare, initialize, and send data
smsCloneData := &sms_nigeria_go.SmsCloneNotification{
	Username:  os.Getenv("USERNAME"),
	Password:  os.Getenv("PASSWORD"),
	Sender:    os.Getenv("SMS_SENDER"),
	Recipient: recipient,
	Message:   textMessage,
}

result, err := repo.SendSmsClone(smsCloneData, sms_nigeria_go.SmsCloneNormalRoute)
if err != nil {
	log.Fatal(err)
}
fmt.Println(result)

------------------------------------------------------------------------
 
# To Check your account balance:

# to check credit balance
credential := sms_nigeria_go.SmsCloneCredential{
	Username: os.Getenv("USERNAME"),
	Password: os.Getenv("PASSWORD"),
}

balance, err := repo.CheckBalanceSmsClone(&credential)
if err != nil {
	log.Fatal(err)
}
fmt.Println(balance)

```


## Summary
In this tutorial, we have seen how to easily send SMS to Nigerian phone numbers using the client package. 

