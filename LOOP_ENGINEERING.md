# Loop Engineering

For every gate: observe failure; state hypothesis; add minimal reproduction; implement smallest correct change; run targeted then full suite; attack malformed/path/timeout/flaky cases; inspect capsule/report; document decision; repeat.

Never rerun blindly, weaken assertions, hide inconclusive results, or expand scope before P0 is green. Preserve logs. Cap retries and resources. Stop only after clean-checkout verification.
