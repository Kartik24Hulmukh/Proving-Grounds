# Threat Model

Assets: source, credentials, developer/CI machine, capsule logs. Threats: malicious fork code, unsafe setup, path traversal, command injection, resource exhaustion, exfiltration, capsule tampering. Controls: schemas, argv subprocesses where possible, workspace enforcement, no secrets, restricted container/network, timeouts, redaction, hashes, least privilege. Worktrees are not a security sandbox.
