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
       │ Data        │  │ Data        │  │ Reliability  │
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
------------------------------------------------------------ × 100
Total Reliability Priorities
```

This measures how effectively the system connects engineering reliability priorities to actual user impact.

The dashboard calculates the result from the available validation data rather than using a hard-coded percentage.

---

## 🧪 Validation, Unit Testing & Error Handling

The SLO Decision Dashboard uses automated unit tests to validate the reliability decision engine under both normal and adversarial conditions.

### Unit Testing

The Python decision engine is tested using **pytest**.

Test file:

```text
tests/test_decision_engine.py
```

Run the complete test suite with:

```bash
python -m pytest -v
```

The current test suite contains **20 test cases** covering normal behavior, boundary conditions, missing data, invalid inputs, and adversarial scenarios.

### Test Coverage

| Test Case | Validation                                                             |
| --------- | ---------------------------------------------------------------------- |
| Case 1    | Healthy service produces LOW priority                                  |
| Case 2    | Severe SLO breach produces CRITICAL priority                           |
| Case 3    | High incident count with low user impact is not blindly ranked highest |
| Case 4    | Examination-period amplification                                       |
| Case 5    | Zero requests do not cause division-by-zero                            |
| Case 6    | Malformed rule weights are handled safely                              |
| Case 7    | Extreme user-impact values are clamped                                 |
| Case 8    | Recommendation and evidence generation                                 |
| Case 9    | Telemetry outage handling                                              |
| Case 10   | Missing SLO target                                                     |
| Case 11   | Zero HTTP requests                                                     |
| Case 12   | Corrupted rule weights                                                 |
| Case 13   | Extreme user-impact clamping                                           |
| Case 14   | Error budget above 100%                                                |
| Case 15   | P1 incident with low user impact                                       |
| Case 16   | Low incident count with high user impact                               |
| Case 17   | Conflicting priority signals                                           |
| Case 18   | Extreme examination-period load                                        |
| Case 19   | Missing incident severity                                              |
| Case 20   | Invalid negative metrics                                               |

### Current Test Result

The complete automated test suite currently passes:

```text
20 passed
```

This confirms that the implemented decision-engine behavior satisfies the defined normal and adversarial validation scenarios.

### Adversarial Testing

The test suite intentionally includes abnormal scenarios such as:

* Missing SLO target
* Zero HTTP requests
* Corrupted rule weights
* Extreme user-impact values
* Error budget above 100%
* Low-impact P1 incidents
* Conflicting priority signals
* Extreme examination-period load
* Missing incident severity
* Invalid negative metrics
* Telemetry outage

These tests verify that the decision engine remains stable when input data is incomplete, inconsistent, or outside expected operating ranges.

### Error Boundaries and Defensive Handling

The application includes defensive handling at multiple levels.

#### Decision Engine

The decision engine protects against:

* Missing SLO targets
* Zero HTTP requests
* Invalid negative metrics
* Missing incident severity
* Corrupted or malformed rule weights
* Extremely large user-impact values
* Error-budget consumption above 100%
* Missing telemetry data

Scores are clamped to valid ranges where required so that unexpected input does not produce invalid priority values.

#### API Layer

The Express API validates important request data before modifying application state.

Examples include:

* Returning `404` when a requested task or recommendation does not exist
* Returning `400` for invalid rule arrays
* Rejecting empty human override reasons
* Returning `500` when the application dataset is unavailable
* Catching seed-data reset failures

#### Human Override Boundary

High-impact recommendations require human control.

An override cannot be stored without a non-empty justification:

```text
Recommendation
      ↓
Human Review
      ↓
Approve OR Override
            ↓
    Override reason required
            ↓
       Decision recorded
```

This prevents the system from silently changing an engineering recommendation without an accountable human decision.

### Testing Workflow

The validation workflow is:

```text
Code Change
    ↓
Run pytest
    ↓
20 automated scenarios
    ↓
Check failures
    ↓
Fix implementation
    ↓
Run pytest again
    ↓
20/20 tests passed
    ↓
Commit and push to GitHub
```

The test suite is therefore used as a regression check whenever decision-engine logic is modified.

---

## 🔌 API Endpoint Documentation

The application exposes REST API endpoints through the Express/TypeScript server.

### Health & System

| Method | Endpoint          | Purpose                                        |
| ------ | ----------------- | ---------------------------------------------- |
| GET    | `/api/health`     | Checks API health and current exam-mode status |
| POST   | `/api/exam-mode`  | Enables or disables examination mode           |
| POST   | `/api/reset-data` | Restores the synthetic dataset                 |

### Reliability Data

| Method | Endpoint                            | Purpose                                             |
| ------ | ----------------------------------- | --------------------------------------------------- |
| GET    | `/api/services`                     | Returns available services                          |
| GET    | `/api/slos`                         | Returns SLO/SLI health and error-budget information |
| GET    | `/api/incidents`                    | Returns support/reliability incidents               |
| GET    | `/api/reliability-tasks`            | Returns reliability engineering tasks               |
| POST   | `/api/reliability-tasks/:id/status` | Updates a reliability task status                   |
| GET    | `/api/features`                     | Returns planned product features                    |

The incidents endpoint also supports filtering by service:

```text
GET /api/incidents?service_id=<service-id>
```

### Decision Rules

| Method | Endpoint     | Purpose                                             |
| ------ | ------------ | --------------------------------------------------- |
| GET    | `/api/rules` | Returns configured decision rules                   |
| PUT    | `/api/rules` | Updates rule weights, thresholds, and enabled state |

Rule weights are validated before being applied to the decision engine.

### Recommendations

| Method | Endpoint                            | Purpose                                                |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| GET    | `/api/recommendations`              | Calculates and returns all reliability recommendations |
| GET    | `/api/recommendations/:id`          | Returns one recommendation with supporting evidence    |
| POST   | `/api/recommendations/:id/approve`  | Records a human approval                               |
| POST   | `/api/recommendations/:id/override` | Records a human override with justification            |

The override endpoint requires a non-empty `override_reason`.

Example request:

```json
{
  "user_id": "usr_mgr_1",
  "user_name": "Engineering Manager",
  "override_reason": "The incident has already been mitigated and the recommendation can be deferred."
}
```

### Decisions & Evaluation

| Method | Endpoint              | Purpose                                                   |
| ------ | --------------------- | --------------------------------------------------------- |
| GET    | `/api/decisions`      | Returns recorded human decisions                          |
| GET    | `/api/metrics`        | Calculates the primary reliability evaluation metric      |
| GET    | `/api/error-analysis` | Returns documented normal and adversarial error scenarios |

### API Error Handling

The API uses HTTP status codes to communicate failures.

```text
200 → Successful request
400 → Invalid request data
404 → Requested resource not found
500 → Server or dataset failure
```

Important validation examples include:

* Missing recommendation or task → `404`
* Invalid rules array → `400`
* Empty override reason → `400`
* Missing application dataset → `500`
* Dataset reset failure → `500`

The API layer therefore acts as a validation boundary between the frontend and the decision/data layer.

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

### Database Schema

The PostgreSQL schema is designed to store reliability metrics, incidents, engineering work, recommendations, and human decisions.

| Table               | Purpose                                         | Important Fields                                                                                      |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `users`             | Stores application users and roles              | `id`, `name`, `email`, `role`                                                                         |
| `services`          | Stores monitored services and their SLO targets | `id`, `name`, `slo_target`, `sli_type`, `tier`                                                        |
| `sli_metrics`       | Stores service reliability measurements         | `service_id`, `timestamp`, `total_requests`, `successful_requests`, `failed_requests`, `availability` |
| `incidents`         | Stores support and reliability incidents        | `service_id`, `severity`, `users_affected`, `duration_minutes`, `exam_period`                         |
| `feature_plans`     | Stores planned product features                 | `feature_name`, `business_priority`, `estimated_effort`, `status`                                     |
| `reliability_tasks` | Stores engineering reliability work             | `task_name`, `service_id`, `priority`, `status`, `estimated_effort`                                   |
| `rules`             | Stores configurable decision-engine rules       | `rule_name`, `weight`, `threshold`, `enabled`                                                         |
| `recommendations`   | Stores generated reliability recommendations    | `task_id`, `service_id`, `priority_score`, `priority_level`, `evidence`, `status`                     |
| `decisions`         | Stores human approval and override decisions    | `recommendation_id`, `user_id`, `decision`, `override_reason`                                         |

### Database Relationships

The main relationships are:

```text
Users
  │
  └────────────── Decisions
                       │
                       ▼
                 Recommendations
                  │            │
                  ▼            ▼
          Reliability Tasks   Services
                  │            │
                  └────────────┘
                       │
                       ▼
                  SLI Metrics

Services
   │
   └────────────── Incidents

Rules
   │
   └────── Decision Engine
```

Foreign-key constraints maintain relationships between services, metrics, incidents, reliability tasks, recommendations, and human decisions.

Indexes are also defined for frequently queried reliability data, including:

* SLI metrics by service and timestamp
* Incidents by service
* Incidents during examination periods
* Recommendations by decision status

This schema supports the explainable decision workflow while keeping reliability evidence and human decisions traceable.

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

### 1. Clone the Repository

```bash
git clone https://github.com/abishek55290/slo-decision-dashboard.git
cd slo-decision-dashboard
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Test Suite

```bash
python -m pytest -v
```

Expected result:

```text
20 passed
```

### 5. Start the Application

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

Sensitive environment files such as `.env.local` are excluded through `.gitignore`.

**Never commit API keys, passwords, database credentials, or other secrets to the repository.**

Production deployment would require stronger authentication, authorization, monitoring, and security controls.

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

The SLO Decision Dashboard demonstrat
