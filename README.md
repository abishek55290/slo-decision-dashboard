# SLO Decision Dashboard

An explainable reliability decision-support dashboard that connects **user impact, SLO/SLI health, error budgets, support incidents, examination-period demand, and engineering priorities**.

The system helps engineering teams decide **what reliability work should be prioritized and why**, while keeping high-impact decisions under human control.

---

## 🎯 Problem Statement

Online learning platforms experience significantly higher traffic and reliability risk during examination periods.

Although Service Level Objectives (SLOs) may exist, they are often maintained separately from:

* User impact
* Error-budget consumption
* Support incidents
* Reliability tasks
* Planned features
* Examination-period demand

This makes it difficult for engineering teams to determine which reliability issue should be addressed first.

The **SLO Decision Dashboard** connects these signals into one explainable decision workflow.

---

## 💡 Solution

The dashboard evaluates reliability priorities using measurable evidence and configurable decision rules.

For every recommendation, the system provides:

1. **Priority score**
2. **User-impact evidence**
3. **SLO/SLI evidence**
4. **Error-budget evidence**
5. **Incident evidence**
6. **Examination-period context**
7. **Recommendation reason**
8. **Human approval or override**

The system is designed as a **decision-support tool**, not an autonomous decision maker.

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────────┐
                  │      React Frontend     │
                  │  Dashboard + Analytics  │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │       API Layer         │
                  │   TypeScript / Server   │
                  └────────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
       │ SLO / SLI   │  │ Incidents   │  │ Features /   │
       │ Data        │  │ Data        │  │ Reliability   │
       └─────────────┘  └─────────────┘  └──────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ Explainable Decision    │
                  │ Engine                  │
                  │ Python / TypeScript     │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ PostgreSQL Database     │
                  │ Decisions + Metrics     │
                  └─────────────────────────┘
```

---

## ⚙️ Decision Engine

The recommendation score is based on configurable weighted signals.

Example configuration:

```text
User Impact       → 30%
SLO Breach        → 25%
Error Budget      → 20%
Incident Severity → 15%
Exam Period       → 10%
```

Conceptually:

```text
Priority Score =
    User Impact × 0.30
  + SLO Breach × 0.25
  + Error Budget × 0.20
  + Incident Severity × 0.15
  + Exam Period × 0.10
```

### Important Design Principle

These weights are **configurable rules**, rather than fixed decision logic.

This allows an engineering organization to adjust the decision policy without redesigning the complete application.

---

## 🔎 Explainability

The dashboard does not simply output a priority score.

Each recommendation contains supporting evidence explaining **why the item received its priority**.

Example:

```text
Recommendation: Investigate Exam Submission API

Priority: HIGH

Evidence:
✓ High user impact
✓ SLO breach detected
✓ Error budget significantly consumed
✓ Multiple support incidents
✓ Examination period active

Reason:
The issue affects a large number of users while the
service is exceeding its reliability objective during
a high-demand examination period.
```

This allows engineers and managers to validate the recommendation.

---

## 👥 Human-in-the-Loop Workflow

High-impact recommendations require human confirmation.

```text
Data
  ↓
Decision Engine
  ↓
Recommendation
  ↓
Evidence
  ↓
Manager Review
  ├── Approve
  │     ↓
  │   Decision Stored
  │
  └── Override
        ↓
     Override Reason Required
        ↓
     Decision Stored
```

This prevents the system from making autonomous high-impact engineering decisions.

---

## 👤 User Roles

### Engineering Manager

Can:

* Review recommendations
* Inspect supporting evidence
* Approve high-impact reliability actions
* Override recommendations
* Provide override reasons
* Configure decision rules
* Review evaluation metrics

### Engineer

Can:

* View reliability recommendations
* Inspect SLO/SLI health
* Review incidents
* Examine evidence
* Analyze reliability priorities

The prototype currently uses two organizational roles to demonstrate role-based decision workflows.

---

## 📊 Dashboard Capabilities

### SLO Health

Monitor:

* SLO status
* SLI measurements
* Breach conditions
* Error-budget consumption

### User Impact Analysis

Analyze the number and severity of users affected by reliability problems.

### Incident Analysis

Connect support/reliability incidents to engineering priorities.

### Reliability vs Features

Compare planned feature work against reliability priorities.

### Rules Configuration

Configure the weights used by the decision engine.

### Recommendations

View prioritized reliability actions with supporting evidence.

### Decisions

Track:

* Approved recommendations
* Overridden recommendations
* Decision makers
* Override reasons

### Evaluation Metrics

Measure whether reliability priorities are supported by measurable user-impact evidence.

### Error Analysis

Inspect normal and adversarial decision cases.

### Test Runner

Execute decision-engine validation scenarios.

---

## 📈 Primary Evaluation Metric

The primary success metric is:

```text
Reliability Priorities with Measurable User-Impact Evidence
---------------------------------------------------------------- × 100
Total Reliability Priorities
```

This measures how effectively the system connects engineering reliability priorities to actual user impact.

The dashboard calculates the result from the available validation data rather than using a hard-coded percentage.

---

## 🧪 Validation & Adversarial Testing

The prototype includes test scenarios covering both normal and failure conditions.

### Normal Cases

* Healthy service
* Moderate SLO degradation
* High user impact
* Active examination period

### Adversarial / Edge Cases

* Severe SLO breach
* Many incidents but low user impact
* High user impact during examinations
* High-impact recommendation override
* Missing SLO information
* Missing incident information
* Missing user-impact information
* Zero-request scenarios
* Invalid rule weights

The objective is to ensure that invalid or incomplete data does not cause the decision engine to crash or produce unexplained behavior.

---

## 🗄️ Data & Database

The project includes PostgreSQL database support for storing application data and decision information.

Database-related files:

```text
database/
└── schema.sql
```

Example seed data is available in:

```text
seed/
├── seed_data.json
└── seed_data.py
```

---

## 🛠️ Technology Stack

| Layer             | Technology                      |
| ----------------- | ------------------------------- |
| Frontend          | React + TypeScript              |
| Backend/API       | TypeScript / Node.js            |
| Decision Engine   | Python + TypeScript             |
| Database          | PostgreSQL                      |
| Styling           | CSS                             |
| Visualization     | Dashboard charts                |
| Testing           | Python + TypeScript test suites |
| Development       | Vite / npm                      |
| Container Support | Docker Compose                  |

---

## 📁 Project Structure

```text
slo-decision-dashboard/
│
├── backend/
│   └── main.py
│
├── database/
│   └── schema.sql
│
├── decision_engine/
│   └── engine.py
│
├── seed/
│   ├── seed_data.json
│   └── seed_data.py
│
├── src/
│   ├── components/
│   │   ├── DecisionsView.tsx
│   │   ├── ErrorAnalysisView.tsx
│   │   ├── EvaluationMetricsView.tsx
│   │   ├── EvidenceModal.tsx
│   │   ├── RecommendationsList.tsx
│   │   ├── RulesConfigView.tsx
│   │   ├── SloHealthTable.tsx
│   │   ├── TestRunnerView.tsx
│   │   └── UserImpactCharts.tsx
│   │
│   ├── engine/
│   │   ├── decisionEngine.ts
│   │   └── testSuite.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── tests/
│   └── test_decision_engine.py
│
├── server.ts
├── package.json
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## 🚀 Running the Project Locally

### Prerequisites

Install:

* Node.js
* npm
* Python 3.x
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/slo-decision-dashboard.git
cd slo-decision-dashboard
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the application

```bash
npm run dev
```

The development server runs at:

```text
http://localhost:3000
```

---

## 🔐 Security

Environment-specific configuration should be stored outside source control.

The repository includes:

```text
.env.example
```

Sensitive environment files such as `.env.local` are excluded through `.gitignore`.

**Never commit API keys, passwords, database credentials, or other secrets to the repository.**

---

## ⚠️ Limitations

The current prototype has several limitations:

1. Validation uses synthetic/sample data.
2. Real LMS integration is not yet implemented.
3. Some SLO/SLI signals are simulated.
4. Decision quality depends on the configured rules and weights.
5. Human approval is required for high-impact actions.
6. The recommendation score should be treated as decision support, not an autonomous decision.
7. Production deployment would require stronger authentication, authorization, monitoring, and security controls.

---

## 🔮 Future Improvements

Potential production extensions include:

* Integration with real LMS platforms
* Real-time SLO monitoring
* Prometheus/Grafana integration
* Automated incident ingestion
* Historical decision learning
* Advanced anomaly detection
* Role-based authentication
* Audit logging
* Cloud deployment
* Notification and escalation workflows
* ML-assisted impact prediction

---

## 🎯 Project Outcome

The SLO Decision Dashboard demonstrates an end-to-end approach for transforming reliability data into **explainable, measurable, and human-reviewed engineering priorities**.

Instead of asking:

> "What should engineering work on first?"

the system provides:

> **"What should be prioritized, what evidence supports it, and who approved the decision?"**

---

## 📌 Project Status

**Prototype:** End-to-end functional prototype

**Focus:** SLO-driven reliability prioritization

**Decision Style:** Explainable + rule-based + human-in-the-loop

**Primary Domain:** Online learning / examination infrastructure
