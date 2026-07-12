# Evidence Model

| Claim | Base | Head | Verdict |
|---|---|---|---|
| intended_delta | fail | pass | demonstrated |
| intended_delta | pass | pass | vacuous |
| intended_delta | pass | fail | regression |
| intended_delta | fail | fail | inconclusive |
| invariant | pass | pass | demonstrated |
| invariant | pass | fail | regression |
| invariant | fail | pass/fail | inconclusive |

Any unknown/error/timeout is inconclusive.
