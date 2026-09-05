# StudyForge Full-Stack Upgrade Checklist

- [x] Upgrade the static project to the full-stack web-db-user scaffold and inspect generated auth/database files.
- [x] Add persistent dark mode toggle with saved preference and accessible labels.
- [x] Add mock authentication flow with login page, sign-in state, sign-out action, and protected dashboard experience.
- [x] Add interactive progress charts using the project charting primitives and responsive tooltips.
- [x] Extend the database schema for exams, subjects, topics, questions, options, sessions, attempts, and subscriptions.
- [x] Generate and apply database migrations without inserting fake test data.
- [x] Add server database helpers and typed tRPC procedures for authentication, question retrieval, sessions, attempts, analytics, and profile data.
- [x] Connect the practice UI to persisted question/session state and record attempts.
- [x] Add admin content management for WAEC subjects/topics/questions and CSV import validation with duplicate detection.
- [x] Add premium plan presentation, Nigeria-ready payment setup, subscription state, and gated exam simulations.
- [x] Add server tests for auth, question/session persistence, admin permissions, and subscription gating.
- [x] Validate TypeScript, tests, production build, desktop/mobile screenshots, and key UI flows.
- [x] Save a final checkpoint and deliver the upgraded project version.

- [x] Configure the supplied Turso/libSQL URL and token as server-only environment variables.
- [x] Configure Paystack server credentials and webhook verification secret after the provider choice.
- [x] Replace the mock auth persistence path with the real protected auth/session flow while retaining the demo login fallback for preview.

- [x] Add normalized question options storage or document and enforce the serialized option model consistently.
- [x] Apply and verify the generated Turso schema intent through a non-destructive libSQL fallback after the managed migration command could not connect.
- [x] Add typed profile read/update procedures and connect the profile page to persisted user data.
- [x] Upgrade admin tooling with subject/topic/question list, edit, and delete actions.
- [x] Replace the naive CSV parser with robust quoted-field parsing and validation.
- [x] Implement a timed exam simulation flow using gated premium exam records.
- [x] Add persistence tests for session creation, attempt submission, completion, and premium access gating.

- [x] Complete admin CRUD with safe relational deletes for subjects, topics, questions, options, and attempts, and expose the full catalog rather than only the first eight rows.
- [x] Replace line-based CSV parsing with a multiline quoted-field parser and explicit malformed-row validation feedback.
- [x] Implement a premium exam question pipeline tied to the premium exam record, with persisted exam-mode progression and completion.

- [x] Expose dedicated subject and topic rows with direct CRUD actions in the admin UI, including safe delete-path verification.
- [x] Add exam-specific premium question retrieval keyed by WAEC_FULL and persist exam-mode session progression/completion against that exam.
- [x] Add tests for admin subject/topic CRUD reachability and premium exam-mode retrieval/progression.

- [x] Add examId linkage to practice sessions and apply the additive Turso migration.
- [x] Use WAEC_FULL examId in exam start, question retrieval, submit, and completion procedures.
- [x] Add integration tests for an exam-mode WAEC_FULL session from start through submit and complete, plus admin CRUD reachability checks.

- [x] Verify the generated 0002 migration intent with a Turso-local idempotent runner after the managed migration command cannot connect.
- [x] Refactor premium retrieval, submission validation, and completion checks to use the persisted session examId rather than a hardcoded exam code.
- [x] Exercise admin subject/topic/question CRUD procedures directly in integration tests with cleanup-safe fixtures.

- [x] Add direct integration coverage for admin subject/topic/question creation via validated import and direct delete procedures using isolated idempotent fixture records.

- [x] Make the startup route always render the sign-in page for unauthenticated visitors and remove any hardcoded default learner name.
- [x] Add persistent in-app streak notifications triggered by study activity and a notification history surface.
- [x] Add granular learner analytics for accuracy, time, completion, subject breakdown, and recent trends.
- [x] Add a Paystack test-mode checkout verification flow with safe status handling and a test-mode indicator.
- [x] Add an admin bulk-edit workflow for selecting and updating multiple WAEC content rows.
- [x] Seed all requested WAEC subjects idempotently without fabricating user reviews or testimonials.
- [x] Add tests for startup auth gating, streak notifications, analytics aggregation, Paystack test-mode handling, bulk edits, and subject seeding.
- [x] Validate the updated desktop/mobile experience and save a final checkpoint.

- [x] Replace the remaining hardcoded dashboard greeting name with the authenticated user's name and a neutral fallback.
- [x] Bind progress subject breakdown, completion/time metrics, and recent trends to live analytics data.
- [x] Add focused assertions for startup auth, streak creation, analytics aggregation, Paystack mode, bulk edits, and exact 36-subject seeding; document transient Turso timeout risk.
- [x] Capture final desktop and mobile screenshots after the gap fixes and save a new checkpoint.

- [x] Surface live completed-session and average-time metrics directly in ProgressView.
- [x] Strengthen tests with exact 36-subject coverage, analytics field assertions, notification-trigger coverage, startup auth coverage, and a documented Turso timeout note.
- [x] Capture a fresh post-fix desktop screenshot and save the final checkpoint.

- [x] Expand the WAEC question bank with additional topic coverage across the requested subjects.
- [x] Add server and UI filters for question difficulty and selected subject.
- [x] Add a 30-day study streak and progress chart backed by persisted learner activity.
- [x] Fix first-time authentication so unauthenticated visitors never see a learner name and new accounts show zero progress.
- [x] Expose all requested WAEC subjects in subject selection and practice setup.
- [x] Add tests for question filtering, subject selection, zero-state analytics, and 30-day history.
- [x] Validate desktop/mobile flows and save the updated checkpoint.

- [x] Expand seeded WAEC topic/question coverage so every surfaced WAEC subject has at least one real question set.
- [x] Add a focused automated contract test that selects each subject and verifies subject-scoped retrieval.
- [x] Save a fresh checkpoint after the full-subject seed, tests, and responsive validation pass.

- [x] Remove residual static weak-topic and focus-subject copy that could imply prior progress for a first-time learner.

- [x] Save a new StudyForge checkpoint after the full-subject seed, subject-selection tests, residual copy cleanup, and responsive validation changes.
