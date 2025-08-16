---
linktitle: Building a smart, agentic email assistant
title: "Building a smart, agentic email assistant"
date: 2025-02-05T22:34:17+01:00
categories: ["AI", "LLM", "Go", "Golang"]
tags: ["ai", "llm", "agent", "go", "golang", "backend"]
weight: 10
hero: https://d2908q01vomqb2.cloudfront.net/1b6453892473a467d07372d45eb05abc2031647a/2025/08/13/compute2373-2.png
hero_credit: "AWS Blog"
hero_source: "https://aws.amazon.com/blogs/compute/effectively-building-ai-agents-on-aws-serverless/"
---

## Introduction

I have been exploring LLMs (Large Language Models) and agentic-driven applications for over a year now. The exploration mostly focuses on building smart tooling to improve and automate repetitive tasks. This journey has forced me to delve deep into AI and strive to understand even more advanced and complex AI concepts. This has been going incredibly well, and I've learned valuable lessons about the power of context-aware agents.

A few months ago, I started designing and developing a smarter email agent that can handle the following tasks perfectly:
- Responding to emails from colleagues in a natural, human-like manner
- Accepting or rejecting meeting invites intelligently (yes, my inbox gets full really quickly due to having it tied to work, test, and dev environments, all of which send out lots of emails daily)
- Summarizing what has been accomplished on a daily basis and emailing it to me as a daily digest

The motivation behind this project was simple: I was spending too much time on routine email management when I could be focusing on more strategic work. What started as a straightforward automation task quickly evolved into a fascinating exploration of how context and intelligence can transform simple agents into truly smart assistants.

## The First Iteration: A Simple Approach

This sounds like a pretty simple task with the availability of email APIs and webhook events. So I thought too, and I started building out the code. The initial design focused on:

### Core Architecture
- Registering and listening to webhook events for new emails received:
- The agent needs to be able to read the content and determine if an email is a meeting invite or a communication email with a message. The agent needs to be able to take appropriate action:
     (1) If it's an invite: accept or reject the invite based on predefined rules.
     (2) If it's an email with a message: respond to the email in the most human-like way possible.
- Record every action taken (accept/reject invites and responses to emails) and share a summary by the end of the day.

Here's the core implementation of the first version:

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strings"
    
    "github.com/openai/openai-go"
)

type EmailAgent struct {
    openaiClient *openai.Client
    emailClient  EmailService
    actions      []Action
}

type EmailEvent struct {
    From        string `json:"from"`
    Subject     string `json:"subject"`
    Body        string `json:"body"`
    IsInvite    bool   `json:"is_invite"`
    MessageID   string `json:"message_id"`
}

type Action struct {
    Type        string `json:"type"` // "accept_invite", "reject_invite", "reply"
    EmailID     string `json:"email_id"`
    Response    string `json:"response"`
    Timestamp   string `json:"timestamp"`
}

func (ea *EmailAgent) handleEmailWebhook(w http.ResponseWriter, r *http.Request) {
    var event EmailEvent
    if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if event.IsInvite {
        ea.handleInvite(event)
    } else {
        ea.handleEmailMessage(event)
    }
    
    w.WriteHeader(http.StatusOK)
}

func (ea *EmailAgent) handleInvite(event EmailEvent) {
    // Simple logic: accept all invites
    action := Action{
        Type:      "accept_invite",
        EmailID:   event.MessageID,
        Response:  "Thank you for the invitation. I'll be there!",
        Timestamp: time.Now().Format(time.RFC3339),
    }
    
    ea.emailClient.AcceptInvite(event.MessageID)
    ea.actions = append(ea.actions, action)
}

func (ea *EmailAgent) handleEmailMessage(event EmailEvent) {
    prompt := fmt.Sprintf(`
        You are a professional email assistant. Respond to this email in a friendly, 
        professional manner:
        
        From: %s
        Subject: %s
        Message: %s
        
        Write a brief, appropriate response.
    `, event.From, event.Subject, event.Body)
    
    response := ea.generateResponse(prompt)
    
    action := Action{
        Type:      "reply",
        EmailID:   event.MessageID,
        Response:  response,
        Timestamp: time.Now().Format(time.RFC3339),
    }
    
    ea.emailClient.SendReply(event.MessageID, response)
    ea.actions = append(ea.actions, action)
}

func (ea *EmailAgent) generateResponse(prompt string) string {
    resp, err := ea.openaiClient.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
        Messages: openai.F([]openai.ChatCompletionMessageParamUnion{
            openai.UserMessage(prompt),
        }),
        Model: openai.F(openai.ChatModelGPT4),
    })
    
    if err != nil {
        log.Printf("Error generating response: %v", err)
        return "Thank you for your email. I'll get back to you soon."
    }
    
    return resp.Choices[0].Message.Content
}
```


## The Reality Check: Limitations of the First Version

So this works just fine. It serves the objective as expected—helping me automate those repetitive tasks. However, there were a few key observations after deploying this first version that made me realize the agent wasn't as "smart" as I had hoped:

### Problem 1: Blind Invitation Acceptance

The agent blindly accepts any invite that comes in. Right, that's not so smart. I need it to accept an invite only if it's within working hours and I'm available on the specified date. Otherwise, it should reject the invite and reply with a message citing my unavailability.

**The Issue:** Without context about my schedule, the agent was essentially a "yes-man" that would overbook my calendar and accept conflicting meetings.

**Solution:** The agent needs access to my calendar system. This is where the concept of context becomes crucial. The agent needs contextual awareness of my availability to handle this task intelligently. This means integrating with calendar APIs (Google Calendar, Outlook, etc.) and implementing logic to:
- Check for existing conflicts
- Respect working hours and time zones
- Consider buffer time between meetings
- Handle recurring meetings appropriately

### Problem 2: Generic Communication Style

The agent exhibits the same tone in all its replies. While this works functionally, I wanted something more sophisticated. I wanted the replies to feel human and be driven by past exchanges. How you respond to a colleague is slightly different from how you would respond to the VP of Engineering, if you understand what I mean.

**The Issue:** The agent lacked emotional intelligence and relationship context, making all interactions feel robotic and impersonal.

**Solution:** Enable the agent to access past conversations I've had (if any) with the email sender, analyze the tone and formality level used in those exchanges, and craft responses that match the established communication pattern. This requires:
- Email history analysis
- Tone detection and classification
- Relationship mapping (colleague, manager, external partner, etc.)
- Context-aware response generation

### The Power of Context

If we examine the two problems outlined above, it becomes crystal clear that the advantages we get when we empower our agents with substantial context and tools far exceed what they can achieve with limited context. With this realization, I started working on version 2 of the tool, equipped with the solutions explained above.

The key insight here is that **context is everything** when building intelligent agents. Without context, you have automation. With context, you have intelligence.

## Version 2: The Context-Aware Smart Agent

Let's take a look at an advanced version of what we had earlier. This iteration incorporates calendar integration and conversation history analysis:

```go
package ai

import (
    "context"
    "fmt"
    "strings"
    "time"
    
    "github.com/tmc/langchaingo/llms"
    "github.com/tmc/langchaingo/llms/anthropic"
    "github.com/tmc/langchaingo/llms/openai"
)

// EmailMessage represents an incoming email to be processed
type EmailMessage struct {
    From    string `json:"from"`
    Subject string `json:"subject"`
    Body    string `json:"body"`
}

// EmailResponse represents the generated reply
type EmailResponse struct {
    Reply string `json:"reply"`
}

// Responder orchestrates context gathering and LLM invocation to craft replies
type Responder struct {
    llm          llms.LLM
    calendar     CalendarProvider
    emailHistory EmailHistoryProvider
    meetingNotes MeetingNotesProvider
    contacts     ContactsProvider
}

// Provider interfaces for different context sources
type CalendarProvider interface {
    NextAvailableSlot() (time.Time, error)
}

type EmailHistoryProvider interface {
    ToneForRecipient(recipient string) (string, error)
}

type MeetingNotesProvider interface {
    LastMeetingNotes(recipient string) (string, error)
}

type ContactsProvider interface {
    RecipientDetails(recipient string) (string, error)
}

// NewResponder builds a Responder given provider selection and API key
func NewResponder(provider, apiKey string) (*Responder, error) {
    var llm llms.LLM
    var err error

    switch provider {
    case "anthropic":
        llm, err = anthropic.New(anthropic.WithAPIKey(apiKey))
    default:
        // Fallback to OpenAI
        llm, err = openai.New(openai.WithAPIKey(apiKey))
    }
    if err != nil {
        return nil, err
    }

    cal, hist, notes, contacts := NewStubProviders()

    return &Responder{
        llm:          llm,
        calendar:     cal,
        emailHistory: hist,
        meetingNotes: notes,
        contacts:     contacts,
    }, nil
}

// Generate creates a reply for the provided email using LLM and context
func (r *Responder) Generate(ctx context.Context, email EmailMessage) (EmailResponse, error) {
    // Gather context from various providers
    slot, _ := r.calendar.NextAvailableSlot()
    tone, _ := r.emailHistory.ToneForRecipient(email.From)
    notes, _ := r.meetingNotes.LastMeetingNotes(email.From)
    details, _ := r.contacts.RecipientDetails(email.From)

    // Build contextual prompt
    prompt := BuildPrompt(email, details, tone, notes, slot)

    // Generate response using LLM
    resp, err := r.llm.Call(ctx, prompt)
    if err != nil {
        return EmailResponse{}, err
    }

    return EmailResponse{Reply: resp}, nil
}

// BuildPrompt crafts a prompt string combining the incoming email and contextual data
func BuildPrompt(email EmailMessage, recipientDetails, tone, notes string, slot time.Time) string {
    return strings.TrimSpace(fmt.Sprintf(`You are a highly efficient AI email assistant.
Your goal is to draft a concise, warm, and decisive reply based on the provided context.

=== Incoming Email ===
Subject: %s
Body: %s

=== Recipient ===
Details: %s
Preferred Tone: %s

=== Previous Interaction ===
Last Meeting Notes: %s

=== Calendar ===
Next Available Slot: %s

=== Instructions ===
- If the sender requests a meeting, propose the available slot.
- Use the preferred tone when writing.
- Keep the response under 120 words.
- Sign off with the sender's first name.

Reply:
`, email.Subject, email.Body, recipientDetails, tone, notes, slot.Format("Monday, Jan 2 3:04PM")))
}

// --- Below are Stub Implementations ---

type stubCalendar struct{}

func (s stubCalendar) NextAvailableSlot() (time.Time, error) {
    return time.Now().Add(48 * time.Hour).Truncate(time.Hour), nil
}

type stubEmailHistory struct{}

func (s stubEmailHistory) ToneForRecipient(recipient string) (string, error) {
    // Here, I had a logic that fetches past messages with the recipient, pass them to llm and have it categorize them into 3 categories:
    // 1. Professional - formal business communication
    // 2. Casual - friendly, informal exchanges
    // 3. Mixed - combination of both depending on context
    // The LLM then determines the most appropriate tone to use for future responses
    return "friendly and concise", nil
}

type stubMeetingNotes struct{}

func (s stubMeetingNotes) LastMeetingNotes(recipient string) (string, error) {
    // This logic retrieves notes from the last
    // meeting or interaction with the person
    return "Discussed partnership opportunities and agreed to follow up with next steps.", nil
}

type stubContacts struct{}

func (s stubContacts) RecipientDetails(recipient string) (string, error) {
    // This logic looks up the person in my
    // google contact
    return "Senior Product Manager at PartnerOrg", nil
}

// NewStubProviders returns basic stub providers
func NewStubProviders() (CalendarProvider, EmailHistoryProvider, MeetingNotesProvider, ContactsProvider) {
    return stubCalendar{}, stubEmailHistory{}, stubMeetingNotes{}, stubContacts{}
}

// Example usage of the enhanced email agent
func ExampleUsage() {
    responder, err := NewResponder("openai", "your-api-key-here")
    if err != nil {
        panic(err)
    }

    email := EmailMessage{
        From:    "john.doe@partnerorg.com",
        Subject: "Follow-up on Partnership Discussion",
        Body:    "Hi! Thanks for our chat yesterday. Could we schedule a follow-up meeting to discuss the next steps?",
    }

    ctx := context.Background()
    response, err := responder.Generate(ctx, email)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Generated Reply: %s\n", response.Reply)
}
```

### Key Improvements in Version 2

1. **Provider-Based Architecture**: Uses clean interfaces (CalendarProvider, EmailHistoryProvider, etc.) to separate concerns and enable easy testing with stub implementations
2. **LLM Flexibility**: Supports both OpenAI and Anthropic models through the langchaingo library, allowing easy switching between providers
3. **Context Aggregation**: Gathers contextual information from multiple sources (calendar, email history, meeting notes, contacts) before generating responses
4. **Structured Prompting**: Uses a well-formatted prompt template that clearly organizes context and instructions for consistent, high-quality responses
5. **Concise Response Generation**: Built-in constraints (120-word limit, specific formatting) ensure responses are professional and actionable
6. **Extensible Design**: The interface-based approach makes it easy to add new context providers or replace stub implementations with real integrations

## Lessons Learned

Through building this smart email agent, I've learned several crucial lessons about developing intelligent systems:

### 1. Contextual Awareness Drives Intelligence
What separates basic automation from genuine intelligence is the depth of contextual information available to the system. By incorporating calendar integration, historical communication patterns, and relationship dynamics, I transformed a rudimentary email processor into a sophisticated digital assistant.

### 2. Interface-Driven Design Enables Flexibility
Using provider interfaces instead of concrete implementations made the system incredibly flexible. I could start with simple stub implementations for rapid prototyping, then gradually replace them with real integrations. This approach also made testing much easier since I could mock individual components.

### 3. Structured Prompting Yields Consistent Results
The key to reliable AI responses wasn't just having good context—it was organizing that context in a clear, structured format. The prompt template with distinct sections (email content, recipient details, calendar info, instructions) produced much more consistent and useful responses than ad-hoc prompting.

### 4. LLM Provider Abstraction is Valuable
Supporting multiple LLM providers (OpenAI, Anthropic) through a common interface proved invaluable. Different models have different strengths, and being able to switch providers based on cost, performance, or availability requirements without changing the core logic was a significant advantage.

## Summary

LLMs are very powerful, and with well-crafted prompts, you will get the best out of them. However, empowering your agents with access to tools and context makes them super powerful, smart, and capable of handling complex tasks that go far beyond simple text generation.

The journey from a basic email responder to a context-aware intelligent agent illustrates a fundamental principle in AI development: **intelligence emerges from the intersection of powerful models and rich context**. As we continue to build more sophisticated AI systems, the focus should not just be on better models, but on better ways to provide those models with the context and tools they need to be truly helpful.

The future of AI agents lies not in replacing human intelligence, but in augmenting it with systems that understand context, maintain relationships, and can act intelligently on our behalf while preserving the nuance and personality that makes human communication meaningful.

