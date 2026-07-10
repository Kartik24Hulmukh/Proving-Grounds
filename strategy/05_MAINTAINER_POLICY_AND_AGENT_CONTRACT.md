# Maintainer Policy and Agent Contract

## Repository policy example
```yaml
evidencePolicyVersion: "0.1"
requireCapsule: true
maximumRegressions: 0
maximumVacuousIntendedClaims: 0
allowInconclusive: false
minimumValidMutants: 5
minimumMutationStrength: 0.70
requireReplay: true
```

## Agent completion contract
Before an agent says “done,” it must: propose explicit claims; obtain/record acceptance; run the independent verifier; attach the capsule; disclose regressions, vacuous claims, survivors and unknowns; never rewrite the verifier verdict.

The policy enables maintainers to accept AI assistance without accepting unverifiable PR volume.
