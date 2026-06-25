One of the hook tests in `@reactuses/core` is failing. Run the test suite (or the relevant
test), figure out why it's failing, and fix it.

If everything currently passes, intentionally break a single hook to create a realistic
failure first — for example, change a clamp/boundary condition or an off-by-one in a small
state hook like `useCounter` — then treat that as the bug to find and fix. The point is to
exercise the diagnose-and-repair loop, not to leave the change behind.
