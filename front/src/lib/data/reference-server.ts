/**
 * Server-only entry point for the reference vocabularies.
 *
 * This is a separate module on purpose. `reference.ts` must stay free of any
 * import of `@/lib/supabase/server`, because `use-reference.ts` is a Client
 * Component and the bundler traces the whole module graph — including a
 * dynamic `await import` — so a server wrapper living beside the core pulls
 * `next/headers` into the client bundle and the build fails with
 * "You're importing a component that needs next/headers".
 *
 * Server Components and Server Actions import from here. Client Components use
 * `useSubjects()` from `./use-reference.ts`. Scripts pass their own client to
 * `getReferenceVocabularies` directly.
 */

import { createClient } from "@/lib/supabase/server";

import {
  getReferenceVocabularies,
  type ReferenceVocabularies,
} from "./reference.ts";

export async function getServerReferenceVocabularies(): Promise<ReferenceVocabularies> {
  return getReferenceVocabularies(await createClient());
}
