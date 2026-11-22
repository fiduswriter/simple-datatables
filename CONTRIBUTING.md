Contributing
============

Thanks for your interest in improving simple-datatables!

simple-datatables is developed and published from
https://github.com/fiduswriter/simple-datatables.

Making a change
---------------

* Fork the repository and open a pull request against ``main``.
* Verify your change locally before submitting. The supported Node.js
  version and browser are the ones set up in ``.github/workflows/test.yml``
  (Node.js 24, current stable Chrome)::

      npm install
      npm run build
      npm test

  You can also run ``npm run lint`` (spelling and code style) and
  ``npm run test_server`` to try the demos in a browser on port 3000.
* New features and bug fixes come with tests that exercise the new or
  fixed behavior — add a case page under ``test/cases/`` and wire it into
  ``test/test.mjs`` — and with documentation updates in
  ``docs/documentation/``.
* Add an entry to the "Unreleased" section of
  ``docs/documentation/Upgrading.md``; it doubles as our changelog.
* Breaking changes: keep them to a minimum. Constructor options and their
  defaults, public properties and methods on ``DataTable``, ``rows`` and
  ``columns``, event names and their arguments, rendered DOM structure and
  default class names, and the exported TypeScript types all count as
  interface. If a change is not technically necessary, it is a breaking
  change we would rather not have. Anything unavoidable must be spelled out
  in the pull request description and in the Upgrading entry.
* Do not add new runtime dependencies for a feature that can be implemented
  without them. We keep this library dependency-free.

Use of AI tooling
-----------------

Using AI coding assistants while preparing a contribution is fine; we do
not police how the code in a pull request was written. You are
responsible for what you submit:

* **The code has to actually run.** Run the test suite (and, if you touched
  rendering, try the affected demos with ``npm run test_server``) yourself.
  "The tool said it works" is not a verification.
* **Tests have to test what they claim to test.** A test should fail if
  the behavior it covers is removed. Tests that merely mirror
  implementation details, assert that a function was called, or check
  strings that happen to be in the current code will be asked to be
  changed or removed.
* **Breaking changes must be minimized and justified** (see above).
* **Be prepared to talk about your code.** During review we will ask what
  parts of the change do and why they are needed. If you cannot explain
  what the tool produced, say so openly — for example: "I asked the tool to
  add feature X and I don't know enough about the implementation to explain
  it." That is an acceptable and appreciated answer. It means we will
  review more closely, ask for changes, or in some cases implement the
  feature ourselves. A pull request whose code nobody can explain and which
  shows no sign of ever having been run may be closed.

Untested code, invented APIs and quiet rewrites of unrelated parts of the
code base are the most common reasons contributions get rejected. Read
your own diff before requesting review.

Licensing
---------

Contributions are provided under the license documented in ``LICENSE``
(LGPL-3.0), unless you explicitly state otherwise.
