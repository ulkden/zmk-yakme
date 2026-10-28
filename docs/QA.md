# Manual QA

Every feature has a **QA issue** (label `qa`), numbered in the order a new user meets it:
getting started → importing → editing keys → layers → combos → behaviors → checking your work →
exporting → saving. The issues also outline the user documentation: each one becomes a section of
the user guide once it passes.

## Running the app

```sh
npm run serve        # then open http://localhost:8080
```

For a fresh start (no saved keymap), use a private window or clear the site data for localhost.

## How to test and give feedback

1. Pick the lowest-numbered open QA issue and set its **QA status** to *In QA* on the project board.
2. Follow the **Test steps**, then check every **Acceptance criteria** item.
3. Post **one comment per finding** using the template in the issue. Always post a `Result:` line,
   even when everything passes. Suggestions are welcome as `Severity: idea`.
4. Set **QA status** to *Passed* or *Needs changes*.

Problems found outside a QA issue go in a new issue made with the **QA feedback** form.

### Feedback comment template

```text
Result: pass | fail | partial
Step: <step number, or "general">
Expected: <what should have happened>
Actual: <what happened; screenshots welcome>
Suggestion: <optional idea or change>
Severity: blocker | major | minor | idea
```

Keep the field names exactly as shown: they are read back automatically when feedback is reviewed.

## Review loop

1. We periodically review open feedback together, decide on changes, and fix them with tests.
2. A fixed issue goes back to *In QA* for a re-test.
3. When it passes, the matching user-guide section is written and the issue moves to *Documented* and
   is closed.

| QA status       | Meaning                                         |
|-----------------|-------------------------------------------------|
| Not started     | Not tested yet                                  |
| In QA           | Being tested (or re-tested after a fix)         |
| Needs changes   | Feedback is waiting for review or a fix         |
| Passed          | All acceptance criteria met                     |
| Documented      | User-guide section written; issue closed        |
