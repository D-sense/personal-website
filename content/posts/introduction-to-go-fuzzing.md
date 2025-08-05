---
date: 2023-01-11
linktitle: Introduction to Fuzzing in Go
title: Introduction to Fuzzing in Go
categories: ["Go", "Golang", "Test", "Fuzz", "Security"]
tags: ["go", "golang", "Fuzz", "Security"]
weight: 10
hero: /img/posts/fuzz-testing-go.png
hero_credit: "Photo by Gopher Community"
hero_source: "https://golang.org"
---

## Introduction
Every time we get on the system to fix a bug in a feature, refactor a feature, or add a new feature, we are probably introducing bugs.
As a result, the system may fail at handling the new additions correctly.
So, it is safe to say: you can only find bugs you can anticipate. A quick example is when you attempt to dereference a nil pointer! Boom!!! This happens a lot.

```go
# A problem:

func main2() {
	type Profile struct {
		Name   string
		Age    int
		Skills []string
	}

	students := []Profile{
		{
			Name:   "John",
			Age:    10,
			Skills: []string{"programming", "sleeping"},
		},
	}

	age := students[1].Age
	fmt.Println(age)
}
```

In an ideal situation, you would want to test your code right after/before completing the implementation, right?
This code will run perfectly well as long as we have at least 2 student profile records. However, the moment we start having one student record, this will definitely break! 

#### Possible Solution
A possible solution would be to check the length of the slice before accessing any of its items to avoid accessing an item that doesn't exist, thus running into an out of bounds index.
Although for this simple code snippet we could enforce the check and be fine, right? However, there is no way to enforce this check everywhere, and in fact, you cannot guarantee a check anywhere the list is used.

#### Efficient Solution
First, let's look at a more complex problem. Below is a caesar package that provides support for encoding and decoding texts using the Caesar Cipher principle:

```go
# caesar.go :

// Package caesar provides support for encoding and decoding using Caesar Cipher principle.
// The encryption and decryption of the text is done using a key that specifies the alphabet rotation factor.
package caesar

import (
	"fmt"
	"go-fuzzing/validation"
	"regexp"
	"strings"
	"unicode"
)

const (
	alphabet = "abcdefghijklmnopqrstuvwxyz"
)

type NewEncoding struct {
	Text string `json:"text" validate:"required"`
	Key  int    `json:"key"`
}

type NewDecoding struct {
	Text string `json:"text" validate:"required"`
	Key  int    `json:"key"`
}

// Encrypter encrypts a string using Caesar Cipher principle.
func Encrypter(data NewEncoding) (string, error) {
	// validate input data
	if err := validation.Check(data); err != nil {
		return "", fmt.Errorf("validating data: %w", err)
	}

	return caesarCipher(data.Text, data.Key), nil
}

// Decrypter decrypts a string using Caesar Cipher principle.
func Decrypter(data NewDecoding) (string, error) {
	// validate input data
	if err := validation.Check(data); err != nil {
		return "", fmt.Errorf("validating data: %w", err)
	}

	data.Key = 26 - (data.Key % 26)
	return caesarCipher(data.Text, data.Key), nil
}

// caesarCipher encrypts or decrypts a string using a key that specifies the alphabet rotation factor.
func caesarCipher(str string, key int) string {
	runes := []rune(str)
	re := regexp.MustCompile("A-Za-z")

	for i, char := range runes {
		isCurrentCharUpperCase := unicode.IsUpper(char)
		newChar := string(char)
		if isCurrentCharUpperCase {
			newChar = strings.ToLower(newChar)
		}
		index := strings.Index(alphabet, newChar)
		if index == -1 && !re.MatchString(newChar) {
			continue
		}

		newIndex := (index + key) % 26
		if isCurrentCharUpperCase {
			runes[i] = unicode.ToUpper(rune(alphabet[newIndex]))
			continue
		}

		runes[i] = rune(alphabet[newIndex])
	}

	return string(runes)
}
```

Let's create a `main.go` file:

```go
package main

import (
	"go-fuzzing/caesar"
	"log"
)

func main() {
	// =========================================================================
	// Encoding Text
	text := "Let's carve him as a dish fit for the gods."
	key := 3
	encData := caesar.NewEncoding{
		Text: text,
		Key:  key,
	}

	encodedStr, err := caesar.Encrypter(encData)
	if err != nil {
		log.Fatalf("error encoding a text: %v", err)
	}

	log.Println("encoded text: ", encodedStr)
	log.Println("================================================")

	// =========================================================================
	// Decoding Text
	decodedData := caesar.NewDecoding{
		Text: encodedStr,
		Key:  key,
	}

	decodedStr, err := caesar.Decrypter(decodedData)
	if err != nil {
		log.Fatalf("error encoding a text: %v", err)
	}

	log.Println("decoded text: ", decodedStr)
}

```

Running the code would result:
- ``encoded text:  Ohw'v fduyh klp dv d glvk ilw iru wkh jrgv.``
- ``decoded text:  Let's carve him as a dish fit for the gods.``

Let's write test for the caesar's Encrypter function:
```go
func Test_Encrypter(t *testing.T) {
	t.Log("Encrypt text")
	{
		t.Logf("\tWhen handling a key of value 1 or greater")
		{
			data := caesar.NewEncoding{
				Text: "Let's carve him as a dish fit for the gods.",
				Key:  14,
			}

			encodedStr, err := caesar.Encrypter(data)
			if err != nil {
				t.Logf("\t%s\tShould not return error for a key greater than zero | Error:= %v", failed, err)
			}

			expectedStr := "Zsh'g qofjs vwa og o rwgv twh tcf hvs ucrg."
			if encodedStr != expectedStr {
				t.Logf("\t\tExp: %s", expectedStr)
				t.Logf("\t\tgot: %s", encodedStr)
				t.Fatalf("\t%s\tShould return a valid encrypted string", failed)
			}

			t.Logf("\t%s\tShould encrypt text", success)
		}
	}
}
```

Running the test, everything looks good...right? Now let's imagine a situation where the value of ``key`` field is set to -18, what is the result?

``
panic: runtime error: index out of range [-7] [recovered]
``

Above error is from this line of the caesarCipher function:

``
runes[i] = unicode.ToUpper(rune(alphabet[newIndex]))
``

It is quite disappointing that our test cannot detect such an edge case. This further proves the saying that you can only find bugs you can anticipate. We need a tool that would make these edge cases detectable before they make it to our development/staging or production environment. 
The good news is that we can implement another test technique in Go namely, Fuzz testing.
Fuzz testing, also known as fuzzing, is a software testing technique that involves providing random or invalid input to a program in order to discover vulnerabilities, crashes, or unexpected behaviors. 
While fuzz testing is a general concept that can be applied to any programming language, Go, or Golang, has gained popularity as a language of choice for implementing fuzz testing tools due to its simplicity, performance, and built-in support for concurrency.

<img src="/img/posts/fuzz-testing-go.png" />

Percy Bolmér. Gopher by Takuya Ueda, Original Go Gopher by Renée French (CC BY 3.0)).

#### Introduction of go-fuzz (Released in 2014):
- go-fuzz was released in 2014.
- Created by Dmitry Vyukov, a software engineer at Google.
- Dmitry Vyukov also developed the original coverage-guided fuzzing technique known as "American Fuzzy Lop" (AFL).

#### Features and Integration of go-fuzz:
- go-fuzz was added to the Go programming language in version 1.18.
- go-fuzz leverages the reflection capabilities of Go.
- Automatically generates and executes a large number of test cases with different inputs.
- Uses code coverage information to guide the generation of new inputs.
- Officially included in the Go standard library as the "testing/fuzz" package in 2016.

Now that we have learned about the history of Fuzz testing in Go, let's write some fuzz test:

```go
func Fuzz_Encrypter(f *testing.F) {
	f.Fuzz(func(t *testing.T, text string, key int) {
		data := caesar.NewEncoding{
			Text: text,
			Key:  key,
		}

		_, err := caesar.Encrypter(data)
		if err != nil {
			t.Logf("\t%s\tShould return error for a key zero value", failed)
		}

	})
}
```

Running the above test would result in:

``
panic: runtime error: index out of range [-18]
``

Fuzz testing technique involves providing random or invalid input to the `Encrypter()` the panic behavior.
The solution to this panic behavior would be to ensure that `Key` field's value is greater than 0. 
This can be achieved by adding validation to the field, like so: 

```go
type NewEncoding struct {
	Text string `json:"text" validate:"required"`
	Key  int    `json:"key"`  // Old definition
	Key  int    `json:"key" validate:"gte=1"`  // New definition
}
```
Let's make the change and run the test again. The test should run successfully now. 

## Summary
Fuzz testing in Go has become an integral part of the development process for many Go projects. Its impact in Go has significantly contributed to improving the reliability and security of Go software by enabling developers to identify and address potential issues early in the development lifecycle.

