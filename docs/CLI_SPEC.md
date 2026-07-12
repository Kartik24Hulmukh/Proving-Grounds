# CLI Spec

```bash
evidence verify <base>..<head> --claims claims.yml --output .evidence
evidence replay capsule.json
evidence validate <claims-or-capsule.json>
evidence demo
```
Exit: 0 demonstrated; 1 regression/vacuous; 2 inconclusive/setup; 3 invalid input; 4 internal error. JSON is canonical machine output.
