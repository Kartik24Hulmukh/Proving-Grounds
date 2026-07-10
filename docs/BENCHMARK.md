# Benchmark Plan

Start with controlled fixtures, including the core auth/off-by-one/vacuous trio and a redaction-oriented safety fixture.

Methodology:
- Use hidden siblings for checker isolation so the benchmark harness cannot contaminate the subject under test.
- Disclose the fixture set, scoring rules, runtime budget, and any model-assisted steps.
- Publish only redacted summaries for private or undisclosed repositories.

Later evaluate 20 permissively licensed PRs with responsible disclosure. Report regressions, vacuous evidence, valid/killed/surviving mutants, inconclusive rate, runtime and cost. Never publish private code or undisclosed findings.
