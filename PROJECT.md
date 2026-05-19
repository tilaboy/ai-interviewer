# Mock Interview Simulator

## Vision
An AI-powered mock interview platform that simulates realistic interview
experiences across top tech companies. Users select a company, role, and level,
then go through a timed interview conducted by an AI interviewer agent that
knows exactly what signals to look for. After the interview, users receive
detailed feedback with highlighted strengths and areas to improve.

## Supported Scope

### Companies (Phase 1 → Phase N)
| Company | Interview Style Notes |
|---------|---------------------|
| Meta | Values-driven behavioral, medium-hard coding, system design at E4+ |
| Google | Heavy on coding (2-3 rounds), Googleyness behavioral, system design |
| Amazon | Leadership Principles behavioral (very structured), coding, system design |

Each company has its own:
- Interview loop structure (which rounds, how many)
- Question bank (company-tagged questions from public sources)
- Evaluation rubric (e.g., Amazon LPs vs Meta core values vs Google Googleyness)
- Interviewer persona (tone, probing style, hint-giving behavior)

### Roles
| Role | Abbreviation | Special Rounds |
|------|-------------|----------------|
| Software Engineer | SWE | Coding, System Design, Behavioral |
| Machine Learning Engineer | MLE | Coding, ML System Design, Behavioral |
| Data Engineer | DE | Coding (SQL-heavy), Data System Design, Behavioral |

### Levels
| Level | Meta | Google | Amazon |
|-------|------|--------|--------|
| Junior / New Grad | E3 | L3 | SDE I |
| Mid | E4 | L4 | SDE II |
| Senior | E5 | L5 | Senior SDE |
| Staff | E6 | L6 | Principal SDE |

### Interview Types
| Type | UI Components | Key Artifacts |
|------|--------------|---------------|
| Behavioral | Chat + optional speech-to-text | Conversation transcript |
| Coding | Code editor + chat | Code + transcript |
| System Design | Drawing canvas + chat | Diagram + transcript |
| ML System Design | Drawing canvas + chat | ML pipeline diagram + transcript |
| AI-Native Coding | Code editor + AI assistant + chat | Code + prompts + transcript |

---

## Knowledge Base Structure

```
knowledge_base/
├── companies/
│   ├── meta/
│   │   ├── interview_loops.json      # rounds by role × level
│   │   ├── evaluation_rubrics.json   # signals per interview type
│   │   ├── company_values.json       # core values, culture signals
│   │   └── interviewer_persona.json  # how Meta interviewers behave
│   ├── google/
│   │   ├── interview_loops.json
│   │   ├── evaluation_rubrics.json
│   │   ├── company_values.json       # Googleyness criteria
│   │   └── interviewer_persona.json
│   └── amazon/
│       ├── interview_loops.json
│       ├── evaluation_rubrics.json
│       ├── company_values.json       # 16 Leadership Principles
│       └── interviewer_persona.json
├── questions/
│   ├── coding/                       # shared + company-tagged
│   ├── behavioral/                   # company-specific (LP vs values)
│   ├── system_design/                # shared + company-tagged
│   ├── ml_design/                    # shared + company-tagged
│   └── ai_native_coding/            # shared
└── sql/                              # DE-specific SQL questions
```

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN / SIGNUP                         │
│  (email/Google OAuth — stores history and progress)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD                              │
│                                                             │
│  Past interviews:  [Coding - Meta E4 - 72%] [SD - Google…] │
│  Progress chart:   ████████░░ 8/12 dimensions improving    │
│  Weak areas:       "System design deep dives", "STAR..."   │
│                                                             │
│              [ Start New Interview ]                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTERVIEW SETUP                           │
│                                                             │
│  Company:    [ Meta ▼ ]  [ Google ▼ ]  [ Amazon ▼ ]        │
│  Role:       [ SWE  ▼ ]  [ MLE   ▼ ]  [ DE     ▼ ]        │
│  Level:      [ E3   ▼ ]  [ E4    ▼ ]  [ E5     ▼ ] [E6]   │
│  Type:       [ Coding ▼] [ Behavioral ] [ System Design ]  │
│                                                             │
│  Question:   (●) Random from bank                          │
│              ( ) Choose specific topic                      │
│              ( ) Focus on weak areas (from history)         │
│                                                             │
│              [ Start Interview → ]                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTERVIEW SESSION                         │
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │                     │  │  AI Interviewer            ⏱  │  │
│  │   Left Panel        │  │  43:22 remaining              │  │
│  │                     │  │                               │  │
│  │   (varies by type)  │  │  "Good. Now let's talk about  │  │
│  │   - Code editor     │  │   how you'd handle the case   │  │
│  │   - Drawing canvas  │  │   where traffic spikes 10x.   │  │
│  │   - (empty for      │  │   What changes to your        │  │
│  │     behavioral)     │  │   design?"                    │  │
│  │                     │  │                               │  │
│  │                     │  │  [Type your response...]      │  │
│  │                     │  │  [🎤 Voice]                   │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│                                                             │
│  [ End Interview Early ]                                    │
└────────────────────────┬────────────────────────────────────┘
                         │ (timer ends or user ends)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FEEDBACK REPORT                           │
│                                                             │
│  Overall: ██████░░░░ 62/100 (E4 level performance)         │
│                                                             │
│  Dimensions:                                                │
│  ├── Problem Solving    ████████░░  Strong                  │
│  ├── Code Quality       ██████░░░░  Adequate                │
│  ├── Communication      ████░░░░░░  Needs Work              │
│  └── Testing            ███░░░░░░░  Weak                    │
│                                                             │
│  Annotated Transcript:                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ YOU: "I'd use a hashmap to track frequencies"       │   │
│  │ 🟢 Good: identified optimal data structure early     │   │
│  │                                                      │   │
│  │ YOU: "I think the complexity is O(n log n)"          │   │
│  │ 🔴 Incorrect: solution is O(n), not O(n log n)      │   │
│  │                                                      │   │
│  │ YOU: [coded solution without testing]                │   │
│  │ 🟡 Missed: didn't test with empty array edge case   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Top 3 improvements:                                        │
│  1. Always trace through 2-3 test cases before declaring    │
│     your solution complete                                  │
│  2. State time complexity correctly — practice analyzing    │
│     your own solutions                                      │
│  3. Think aloud more — 30s of silence at 12:40 made it     │
│     hard to evaluate your thought process                   │
│                                                             │
│  [ Save ] [ Retry Same Question ] [ New Interview ]         │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Interviewer Agent Design

The interviewer is a Claude-powered agent with a layered system prompt:

```
Layer 1: Base Interviewer Behavior
  - You are a senior engineer conducting a mock interview
  - Be professional, encouraging but realistic
  - Follow the phase structure for this interview type
  - Track time and pace the interview appropriately

Layer 2: Company Persona
  - Loaded from companies/{company}/interviewer_persona.json
  - Meta: direct, fast-paced, values-focused
  - Google: methodical, hints via questions, Googleyness probes
  - Amazon: LP-structured, "tell me about a time", deep STAR probes

Layer 3: Interview Type Behavior
  - Loaded per type (coding, behavioral, system_design, etc.)
  - Defines phases, when to probe, when to hint, when to move on
  - Includes signal detection instructions from rubric

Layer 4: Question + Rubric
  - Specific question with follow-ups
  - Evaluation rubric with positive/negative signals to watch for
  - Level-appropriate expectations

Layer 5: Candidate Context (if returning user)
  - Past weak areas to probe more deeply
  - Skill progression data
```

### Agent Behaviors by Interview Type

**Behavioral Agent:**
- Asks one question at a time
- Listens for STAR structure — probes for missing elements
- "Can you be more specific about YOUR role vs the team's?"
- "What was the measurable outcome?"
- Covers 3-4 questions in 45 minutes
- Ensures coverage of company values/LPs

**Coding Agent:**
- Presents problem, waits for approach discussion before coding
- Calibrated hints: vague at first, more specific if stuck
- "What's the time complexity of this approach?"
- "What edge cases should we consider?"
- "Can you walk me through your code with this input: [edge case]?"
- Adapts difficulty: if solving too fast, ask follow-up variant

**System Design Agent:**
- Lets candidate drive — only redirects if stuck or off-track
- Checks for requirements phase: "Before we design, what questions do you have?"
- Challenges decisions: "Why X over Y?", "What if this component fails?"
- Guides depth: "Let's go deeper on [critical component]"
- Time management: "We have 15 minutes left, let's discuss scalability"

**ML Design Agent:**
- Probes problem formulation: "What exactly is the model predicting?"
- Challenges data assumptions: "Where do these labels come from?"
- Tests model justification: "Why not start with logistic regression?"
- Asks about production: "How do you serve this at 100ms latency?"
- Probes monitoring: "How do you know when the model degrades?"

**AI-Native Coding Agent (interviewer role):**
- Observes candidate's AI usage passively, intervenes occasionally
- "I noticed you accepted that function without modifying it — walk me through what it does"
- "Why did you choose to write that part manually instead of using AI?"
- "The AI suggested X, but you went with Y — what was your reasoning?"
- Notes prompting patterns for feedback

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router) | Main framework, SSR, API routes |
| UI | Tailwind CSS + shadcn/ui | Component library, styling |
| Code Editor | Monaco Editor (@monaco-editor/react) | Coding + AI-native interviews |
| Drawing | tldraw (@tldraw/tldraw) | System design + ML design diagrams |
| Speech | Web Speech API | Optional voice input for behavioral |
| AI | Claude API (@anthropic-ai/sdk) | Interviewer agent + AI coding assistant |
| Auth | NextAuth.js | Login (email, Google OAuth) |
| Database | PostgreSQL (Neon/Supabase) | Users, sessions, feedback history |
| ORM | Prisma | Database access |
| State | Zustand | Client-side interview session state |

---

## Database Schema (core tables)

```
users
  id, email, name, created_at

interview_sessions
  id, user_id, company, role, level, interview_type,
  question_id, status (in_progress|completed|abandoned),
  started_at, ended_at, duration_seconds

transcripts
  id, session_id, role (interviewer|candidate), content,
  timestamp, metadata (code_snapshot, diagram_snapshot)

feedback_reports
  id, session_id, overall_score,
  dimension_scores (JSON), annotated_transcript (JSON),
  improvements (JSON), level_assessment, generated_at

user_progress
  id, user_id, company, role, interview_type, dimension,
  score_history (JSON), trend (improving|stable|declining)
```

---

## Build Phases

### Phase 1: Foundation + Behavioral Interview
**Goal**: Working end-to-end flow for the simplest interview type.

- [ ] Project setup: Next.js, Tailwind, shadcn/ui, Prisma, auth
- [ ] Knowledge base: restructure for multi-company (Meta first)
- [ ] Interview setup page: company → role → level → type selector
- [ ] Chat interface with timer
- [ ] Claude API integration: behavioral interviewer agent
- [ ] System prompt assembly: persona + rubric + questions
- [ ] Post-interview feedback generation
- [ ] Feedback display: scores + annotated transcript with highlights
- [ ] Basic user dashboard (past interviews list)

### Phase 2: Coding Interview
**Goal**: Add code editor, test execution, coding-specific feedback.

- [ ] Split-pane layout: Monaco editor + chat
- [ ] Multi-language support (Python, JavaScript, Java, C++)
- [ ] Code execution sandbox (WebContainer or API-based)
- [ ] Coding interviewer agent (hints, follow-ups, complexity questions)
- [ ] Code quality analysis in feedback
- [ ] Test case validation display

### Phase 3: System Design + ML Design
**Goal**: Add drawing canvas, design-specific interviewer behavior.

- [ ] Split-pane layout: tldraw canvas + chat
- [ ] Diagram snapshot capture (for feedback report)
- [ ] System design interviewer agent (phase tracking, trade-off probes)
- [ ] ML design variant (reuse canvas, different agent prompt)
- [ ] Design-specific feedback with annotated diagrams

### Phase 4: Multi-Company Expansion
**Goal**: Add Google and Amazon with company-specific behavior.

- [ ] Google knowledge base: interview loops, Googleyness criteria, questions
- [ ] Amazon knowledge base: Leadership Principles, interview loops, questions
- [ ] Company-specific interviewer personas
- [ ] Company-specific evaluation rubrics
- [ ] Question crawler updates for Google/Amazon tagged questions

### Phase 5: AI-Native Coding
**Goal**: Dual-agent interview with AI collaboration analysis.

- [ ] Triple-pane layout: editor + AI assistant + interviewer chat
- [ ] Second Claude API stream (coding assistant with intentional imperfections)
- [ ] Prompt history tracking and display
- [ ] AI collaboration analysis in feedback
- [ ] Larger-scope problem set

### Phase 6: Advanced Features
**Goal**: Polish, analytics, and growth features.

- [ ] Speech-to-text for behavioral interviews
- [ ] User progress tracking and trend analysis
- [ ] Weak-area detection → personalized question selection
- [ ] Interview session replay
- [ ] Comparison: "your performance vs E4 average"
- [ ] Study plan generator based on weak areas
- [ ] Mobile-responsive design
- [ ] Share feedback reports

---

## Question Selection Strategy

When user starts an interview:

```
1. If "Random" selected:
   - Filter questions by: company + role + level + interview_type
   - Exclude questions user has seen in last 5 sessions
   - Weight toward user's weak areas (if history exists)
   - Pick one question + its follow-ups

2. If "Choose topic" selected:
   - Show topic tags for that interview type
   - User picks topic (e.g., "graphs", "distributed systems")
   - Filter and present 3-5 options, user picks one

3. If "Focus on weak areas" selected:
   - Analyze user_progress for declining/weak dimensions
   - Select questions that specifically test those dimensions
   - Inform AI interviewer to probe those areas more deeply
```

---

## Open Questions

1. **Code execution**: Do we sandbox code execution in-browser (WebContainer)
   or send to a backend sandbox (Docker)? WebContainer is simpler but limited
   to JS/TS. Backend sandbox supports all languages but adds complexity.

2. **Voice input**: Is speech-to-text important for V1, or is text-only fine
   to start? Voice adds realism for behavioral but adds complexity.

3. **Diagram analysis**: Can the AI meaningfully analyze a tldraw diagram for
   system design feedback? May need to convert to a structured format or just
   capture snapshots for the user's reference.

4. **Pricing model**: If this grows beyond personal use — per-interview,
   subscription, or freemium? Claude API costs per session (~$0.10-0.50
   per interview depending on length).

5. **Full interview loop mode**: Simulate a complete interview day
   (2 coding + 1 system design + 1 behavioral) with an aggregate
   hire/no-hire assessment?
