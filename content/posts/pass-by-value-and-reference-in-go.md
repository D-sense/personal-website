---
title: "Pass by Value and Reference in Go"
categories: ["Go", "Golang"]
date: 2020-03-01
tags: ["go", "golang", "basic"]
weight: 10
---

## Introduction

Many programming languages support passing an argument by value and/or by reference. In this blog, we are going to learn how Go handles pass-by-value and pass-by-reference.

### What Is Pass-By-Value?
In Go, when a parameter is passed to a function by value, it means the parameter is copied into another location of your memory, and when accessing or modifying the variable within your function, only the copy is accessed/modified and the original value is never modified. 
All primitive/basic types (int (all its variant), float (all its variant), boolean, string, array, and struct) in Go are passed by value. Passing by value is how your values are passed on to functions most of the time. Let us look at some examples below: 

```
# int

func modifyInt(n int) int {
	return n + 5
}

age := 30
fmt.Println("Before function call: ", age)              // 30
fmt.Println("Function call:", modifyInt(age))           // 35
fmt.Println("After function call: ", age)               // 30
```

```
# float

func modifyFloat(n float64) float64 {
	return n + 5.0
}

cash := 10.50
fmt.Println("Before function call: ", cash)             // 10.5
fmt.Println("Function call:", modifyFloat(cash))        // 15.5
fmt.Println("After function call: ", cash)              // 10.5
```

```
# bool

func modifyBool(n bool) bool {
	return !n
}

old := false
fmt.Println("Before function call: ", old)              // false
fmt.Println("Function call:",  modifyBool(old))         // true
fmt.Println("After function call: ", old)               // false
```

```
# string

func modifyString(n string) string {
	return "My favourite language is: " + n
}

message := "Go"
fmt.Println("Before function call: ", message)         // Go
fmt.Println("Function call:", modifyString(message))   // My favourite language is: Go
fmt.Println("After function call: ", message)          // Go
```

```
# array

func modifyArray(coffee [3]string) [3]string {
	coffee[2] = "germany"
	return coffee
}

country := [3]string{"nigeria", "egypt", "sweden"}
fmt.Println("Before function call: ", country)         // [nigeria egypt sweden]
fmt.Println("Function call:", modifyArray(country))    // [nigeria egypt germany]
fmt.Println("After function call: ", country)          // [nigeria egypt sweden]
```

```
# struct

func modifyStruct(p profile) profile {
	p.Age = 85
	p.Name = "Balqees"
	p.Salary = 500.45
	p.TechInterest = true
	return p
}

myProfile := profile{
	Age:          15,
	Name:         "Adeshina",
	Salary:       300,
	TechInterest: false,
}
fmt.Println("Before function call: ", myProfile)       // {15 Adeshina 300 false}
fmt.Println("Function call:", modifyStruct(myProfile)) // {85 Balqees 500.45 true}
fmt.Println("After function call: ", myProfile)        // {15 Adeshina 300 false}
```

If you run through the examples above, we can confirm that the values of variables passed to the functions remain the same before and after the functions calls. In a nutshell, the variables were passed by value. 
Now, let's explore the other way Go function treats parameters; Pass-By-Reference.

### What Is Pass-By-Reference?
Pass-By-Reference means that the memory address of the variable (a pointer to the memory location) is passed to the function. This means any modification within your function that is done on the passed variable will automatically affect the original value of the variable. This is different from Pass-By-Value, where the value (not memory address) of a variable is passed on. Although Go does not support "reference variables" as opposed to languages like C++, conceptually, we can achieve a similar effect. These types (slice, map, pointer, function, and channel) are Passed-By-reference. Let us look at some examples below:
```
# slice

func modifySlice(coffee []string) []string {
	coffee[1] = "turkish_coffee"
	return coffee
}

coffeeBox := []string{"egyptian_coffee", "kenyan_coffee", "brazilian_coffee"}
fmt.Println("Before function call: ", coffeeBox)         // [egyptian_coffee kenyan_coffee brazilian_coffee]
fmt.Println("Function call:", modifySlice(coffeeBox))    // [egyptian_coffee turkish_coffee brazilian_coffee]
fmt.Println("After function call: ", coffeeBox)          // [egyptian_coffee turkish_coffee brazilian_coffee]
```

```
# map

func modifyMap(expenses map[string]int) map[string]int {
	expenses["food"] = 4500
	return expenses
}

expenses := make(map[string]int, 0)
expenses["transport"] = 30
expenses["food"] = 300
expenses["rent"] = 100

fmt.Println("Before function call: ", expenses)         //  map[food:300 rent:100 transport:30]
fmt.Println("Function call:", modifyMap(expenses))      //  map[food:4500 rent:100 transport:30]
fmt.Println("After function call: ", expenses)          //  map[food:4500 rent:100 transport:30]
```

```
# pointer

func ModifyBasicTypes(name *string, age *int, cash *float64, techInterest *bool, countries *[3]string, myProfile *profile) {
	*name = "Golang"
	*age = 90
	*cash = 50.45
	*techInterest = !(*techInterest)
	*countries = [3]string{"sudanese", "belgium", "zambia"}
	*myProfile = profile{
		Age:          100,
		Name:         "GOOGLE",
		Salary:       40.54,
		TechInterest: true,
	}
}

myProfile=  profile{
	Age:          0,
	Name:         "",
	Salary:       0,
	TechInterest: false,
}
fmt.Println("Before function call: ", message, age, cash, old, country, myProfile)     // {0  0 false [nigeria egypt swed] {0  0 false}}
ModifyBasicTypes(&message, &age, &cash, &old, &country, &myProfile)
fmt.Println("After function call: ", message, age, cash, old, country, myProfile)      // {90 Golang 50.45 true [nigerian colombian sudanese] {50 Hassan 45.45 false}}

```

<!--```-->
<!--# function-->

<!--func modifyFunction(f func(string) string, name string) string {-->
<!--	// return f(name)-->
<!--	f = func (n string) string{-->
<!--		return strings.ToUpper(n)-->
<!--	}-->

<!--	return f(name)-->
<!--}-->

<!--msg := "adeshina"-->
<!--anon := func(n string) string {-->
<!--	return n-->
<!--}-->
<!--fmt.Println("Before function call: ", anon(msg))-->
<!--fmt.Println("Function call: ", modifyFunction(anon, msg))-->
<!--fmt.Println("After function call: ", anon(msg))-->
<!--```-->

```
# channel
func modifyChannel(s chan string) {
	s <- "INJECTING A NEW MESSAGE"
}

status := make(chan string)  // P.S: "status" has an empty value at the moment 
go modifyChannel(status)    
fmt.Println("After function call: ", <- status) // INJECTING A NEW MESSAGE
```
Running through the examples above, we can see the effect of passing a parameters to functions by reference. 
In the "slice", example, we can confirm that the value of the variable "coffeeBox" was modified when passed to the function "modifySlice". The same case with "map", "pointer", "function", and "channel". 
If you find yourself in need of modifying the value of a basic type (int, float, bool, etc), simply pass the variable'' memory address to the function (in other words, treat the parameter as a pointer). The "pointer" section exemplifies this scenario clearly. 


## Summary:
When arguments are passed by value, the function receives a copy of each argument; modifications to the copy do not affect the caller. On the other hand, if the argument contains some kind of reference, like a pointer, slice, map, function, or channel, then the caller may be affected by any modifications the function makes to variables indirectly referred to by the argument. 
In this short blog, we have explored the two ways of how Go treats parameters passed to its function. 
It is very important to be aware of this concept so as to avoid false/wrong expectations. 
Till the next blog, keep Go-ing :)
