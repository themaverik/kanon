Skills bce, sbce, ears-tests, continuous-testing, microprofile-server, system-tests, java-conventions, java-distiller are vendored from https://github.com/AdamBien/airails (MIT License, Copyright (c) 2025 Adam Bien). Re-sync from upstream when updating.

The only change from upstream is `disable-model-invocation: true` in the frontmatter of sbce, ears-tests and continuous-testing, so they run only when you type their slash command. Re-apply it after a re-sync.

The skill text names upstream skills that Kanōn doesn't vendor, such as java-cli-app, java-cli-script, web-components, aws-cdk and zb. Those mentions don't resolve here. Install them from upstream if you need them.

## Ideas the vendored text builds on

The vendored text uses established ideas that predate airails:

- Boundary-Control-Entity: Ivar Jacobson et al., *Object-Oriented Software Engineering: A Use Case Driven Approach*, Addison-Wesley, 1992
- Ubiquitous language: Eric Evans, *Domain-Driven Design*, Addison-Wesley, 2003
- EARS: Alistair Mavin, Philip Wilkinson, Adrian Harwood & Mark Novak, "Easy Approach to Requirements Syntax (EARS)", IEEE RE'09, 2009, doi:10.1109/RE.2009.9
