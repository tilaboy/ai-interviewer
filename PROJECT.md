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

## User Lifecycle & Growth Plan

### Overview

Two-tier user model: guests can try instantly, registered users get full
tracking and personalized recommendations. The goal is to let anyone
experience the product in 60 seconds, then convert them to registered
users for retention and personalization.

```
┌─────────────────────────────────────────────────────────────┐
│                     GUEST (no account)                      │
│                                                             │
│  Landing: enter name → pick Coding or System Design         │
│  → fixed demo question (curated to showcase the product)    │
│  → full interview experience (45 min, same AI quality)      │
│  → full feedback report                                     │
│                                                             │
│  After feedback:                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ "Sign up to save this result, unlock 134 questions, │    │
│  │  and get personalized recommendations."             │    │
│  │              [ Sign Up with Google ]                 │    │
│  │              [ Sign Up with Email  ]                 │    │
│  │              [ Continue as Guest → ]                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │ signs up
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   REGISTERED USER                           │
│                                                             │
│  ✓ Full question bank (134+ questions, all companies)       │
│  ✓ Interview history persisted to database                  │
│  ✓ Per-question tracking (attempted, score, date)           │
│  ✓ Dimension-level progress (coding: DP weak, graphs OK)    │
│  ✓ Smart question selection:                                │
│    - "Focus on weak areas" mode enabled                     │
│    - Avoids repeating recently-tried questions               │
│    - Suggests similar questions after poor scores            │
│  ✓ Study plan generator                                     │
│  ✓ Progress dashboard with trends                           │
│  ✓ Share feedback reports                                   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 7A: Guest Trial Flow (quick win, no auth needed)
**Goal**: Let anyone try the product in 60 seconds with zero friction.

- [ ] Create a curated demo question pool (2-3 best questions):
      - Coding: a classic medium problem that's fun to work through
      - System Design: "Design a URL shortener" (accessible at all levels)
      - Optional: one behavioral question
- [ ] Update landing page flow:
      - Enter name → choose "Try Coding" or "Try System Design"
      - Skip company/role/level selection (use sensible defaults: Meta, SWE, E4)
      - Go directly to interview with the demo question
- [ ] After feedback, show sign-up prompt (modal or banner)
- [ ] If guest clicks "Continue as Guest", redirect to full setup page
- [ ] Guest sessions stored in localStorage (current behavior)

#### Step 7B: Authentication
**Goal**: Know who users are, persist their data server-side.

- [ ] Install and configure NextAuth.js
- [ ] Auth providers:
      - Google OAuth (primary — most engineers have Google accounts)
      - Email magic link (fallback)
- [ ] Auth pages: /login, /signup (or modal-based)
- [ ] Session management: JWT or database sessions
- [ ] Protected routes: /dashboard requires auth, /setup and /interview
      work for both guests and registered users
- [ ] Nav updates: show user avatar + name when logged in, "Sign In"
      button when not
- [ ] Migrate localStorage sessions to database on first login
      (preserve guest history)

#### Step 7C: Database & Persistence
**Goal**: Store user data, interview history, and question tracking.

Tech choice: **Supabase** (PostgreSQL + auth + real-time, generous free tier)
or **Neon** (serverless PostgreSQL) + Prisma ORM.

```sql
-- Core tables

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  auth_provider TEXT NOT NULL,          -- 'google' | 'email'
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interview_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  company         TEXT NOT NULL,
  role            TEXT NOT NULL,
  level           TEXT NOT NULL,
  interview_type  TEXT NOT NULL,
  question_id     TEXT NOT NULL,        -- matches knowledge base question.id
  question_title  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress|completed|abandoned
  started_at      TIMESTAMPTZ DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  duration_sec    INT
);

CREATE TABLE feedback_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID UNIQUE REFERENCES interview_sessions(id),
  overall_score       INT NOT NULL,
  level_assessment    TEXT NOT NULL,
  dimension_scores    JSONB NOT NULL,    -- [{name, score, evidence}]
  positive_signals    JSONB NOT NULL,    -- [{quote, signal, dimension}]
  negative_signals    JSONB NOT NULL,
  improvements        JSONB NOT NULL,    -- [string]
  generated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transcripts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES interview_sessions(id),
  messages    JSONB NOT NULL,            -- [{role, content, timestamp}]
  code        JSONB,                     -- {language, code} for coding interviews
  diagram     TEXT,                      -- tldraw snapshot JSON
  prompts     JSONB                      -- [{prompt, response}] for AI-native
);

-- Derived / computed for fast lookups

CREATE TABLE user_question_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  question_id   TEXT NOT NULL,
  best_score    INT,
  attempt_count INT DEFAULT 1,
  last_attempt  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE TABLE user_dimension_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  interview_type  TEXT NOT NULL,
  dimension       TEXT NOT NULL,          -- e.g. "Problem Solving", "STAR Structure"
  avg_score       INT,
  trend           TEXT,                   -- 'improving' | 'stable' | 'declining'
  data_points     INT DEFAULT 0,
  last_updated    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, interview_type, dimension)
);
```

Implementation:
- [ ] Set up Supabase project (or Neon + Prisma)
- [ ] Define Prisma schema matching the above
- [ ] Migration: create tables
- [ ] API routes: save sessions, feedback, transcripts to DB
- [ ] Update feedback page: save to DB instead of (or in addition to) localStorage
- [ ] Backfill: on first login, migrate localStorage history to DB

#### Step 7D: Smart Question Selection
**Goal**: Recommend the right next question based on user history.

Algorithm:
```
1. Load user's question history (attempted questions, scores)
2. Load user's dimension stats (weak areas)
3. Filter available questions by company + role + level + type
4. Remove recently attempted (last 5 sessions)
5. Score each candidate question:
   a. +3 if it targets a weak dimension
   b. +2 if user hasn't tried this topic area
   c. +1 if difficulty matches user's level
   d. -2 if user already scored >80 on this question
6. Pick top-scored question (with some randomness to avoid repetition)
```

- [ ] Build recommendation engine in `src/lib/recommender.ts`
- [ ] Enable "Focus on weak areas" mode on setup page
- [ ] After feedback: "Based on your results, try this next:" suggestion card
- [ ] API route: GET /api/recommend?userId=...&type=coding&level=E4

#### Step 7E: Progress Dashboard (registered users)
**Goal**: Show meaningful progress over time.

- [ ] Per-interview-type score trends (line chart over time)
- [ ] Dimension heatmap: which areas are strong vs weak
- [ ] Question coverage: "You've attempted 12/20 coding questions"
- [ ] Topic coverage: "Strong: arrays, trees. Weak: DP, graphs"
- [ ] Streak tracker: "3 interviews this week"
- [ ] Level readiness: "Your coding scores suggest E4 readiness (72 avg).
      E5 bar is ~80. Focus on: dynamic programming, system optimization."
- [ ] Comparison (optional): "Your avg: 72. E4 candidates avg: 68."

#### Step 7F: Study Plan Generator
**Goal**: Turn data into a concrete practice plan.

After enough data (5+ interviews), generate:
```
Your 2-week study plan for Meta E5 SWE:

Week 1:
  Mon: Coding — Dynamic Programming (your weakest area, score 45)
  Wed: System Design — "Design a distributed cache" (untried topic)
  Fri: Behavioral — Leadership story prep (STAR structure needs work)

Week 2:
  Mon: Coding — Graph algorithms (score 62, room to improve)
  Wed: System Design — "Design a notification system" (retry, prev score 58)
  Fri: Mock full loop — 2 coding + 1 SD + 1 behavioral
```

- [ ] Build study plan generator in `src/lib/study-plan.ts`
- [ ] Display on dashboard with calendar view
- [ ] "Start next session" button links directly to the recommended interview

### Migration Path (localStorage → Database)

To avoid breaking existing guest users:
1. Guests continue using localStorage (current behavior)
2. On sign-up/login, check localStorage for existing sessions
3. Migrate to database with a one-time import
4. After migration, clear localStorage flag
5. Registered users always read/write from database
6. Guest sessions have `user_id = NULL` — on sign-up, backfill

### Cost Considerations

| Component | Free Tier | Cost After |
|-----------|-----------|------------|
| Supabase (DB + Auth) | 500MB, 50K MAU | $25/mo |
| Google Gemini (AI) | Generous | ~$0.01/interview |
| Google Cloud TTS (WaveNet) | 1M chars/mo | $16/1M chars |
| Vercel (hosting) | 100GB bandwidth | $20/mo |
| **Total for ~1000 users/mo** | | **~$25-50/mo** |

### Monetization Options (future)

| Model | Description |
|-------|-------------|
| **Freemium** | 3 interviews/month free, unlimited for $9.99/mo |
| **Pay-per-interview** | First interview free, then $1.99 each |
| **Subscription** | $14.99/mo unlimited, includes study plans |
| **Enterprise** | Team pricing for bootcamps/universities |

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
