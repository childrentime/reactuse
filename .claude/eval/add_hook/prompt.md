Add a new hook to `@reactuses/core` called `useStep` in the `state` category.

It manages a step counter for wizards/multi-step flows: given a `max` number of steps it
exposes the current step (1-based) and helpers to go to the next/previous step, jump to a
specific step, and check whether the current step is the first or last. It should clamp so
you can't go below step 1 or above `max`.

Implement it, test it, and document it.
