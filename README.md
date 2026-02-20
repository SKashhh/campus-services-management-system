Campus Services Management System

Governance-First Operations Platform with SLA Encoding & Audit Accountability

Problem

Most campus service handling operates through fragmented channels (email, WhatsApp, verbal complaints) with:

• No structured urgency differentiation
• No audit trail
• No measurable SLA compliance
• No workload visibility
• Relationship-dependent escalation

This results in operational opacity, delayed urgent issues, and poor accountability.

What I Built

A full-stack, database-centric operations platform that formalizes complaint handling into:

• Structured intake with standardized categorization
• User-declared priority encoding (low/medium/high)
• SLA-tiered resolution timelines
• Lifecycle-controlled state transitions
• Automated audit logging via database triggers
• Resolution-time calculation at DB layer
• Role-based governance (student / staff / admin)
• Analytics dashboards for workload & SLA monitoring

The system emphasizes signal integrity and governance transparency over premature automation.

Core Design Decision: Priority Tradeoff

Fully automated priority assignment risks contextual misclassification.
Fully manual priority risks inflation and signal distortion.

Chosen approach:

• User-declared priority
• SLA differentiation by tier
• Analytical monitoring of priority distribution
• Audit logging of lifecycle transitions

This balances contextual fairness with systemic accountability.

Architecture

React (UI Layer)
↓
Node.js + Express (Thin API Layer)
↓
PostgreSQL (Single Source of Truth)

Business rules are enforced at the database layer through:

• Constraints
• Triggers
• Stored procedures
• Referential integrity actions

Key Technical Highlights

• 6-table relational schema normalized to 3NF
• 20+ integrity constraints
• 3 PL/pgSQL triggers for automation
• Composite indexing strategy
• 10–20x dashboard query performance improvement under 5,000+ request simulations
• JWT-based authentication + bcrypt hashing
• ACID-compliant transaction management

Operational Metrics Tracked

• SLA Compliance Rate
• Priority Distribution Ratio
• Median Resolution Time by Tier
• Department Workload vs Capacity
• Reopen Rate
• Feedback Rating Distribution




Future Enhancements

• Duplicate complaint clustering
• Soft priority throttling
• Anomaly detection on urgency spikes
• Weighted scoring model for hybrid prioritization

Why This Project Matters

This is not a basic ticketing tool.

It is a governance-oriented operations framework designed to:

• Preserve urgency differentiation
• Embed accountability
• Maintain auditability
• Surface bottlenecks through structured metrics

It creates a stable operational foundation before layering automation or ML.
