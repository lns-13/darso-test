import { getServerReferenceVocabularies } from "@/lib/data/reference-server";
import { getOwnTeacherProfile } from "@/lib/data/teacher-profile";

import { TeacherProfileClient } from "./profile-client";
import { ProfileSignedOut } from "./signed-out";

/**
 * Server half of the teacher profile screen: it reads the caller's own rows,
 * then hands them to the client form.
 *
 * The role is resolved from `profiles.role` inside `getOwnTeacherProfile`, not
 * from `user.user_metadata.role`. `profiles_private` (birth date, phone) is
 * read here because this is the owner reading their own record; none of it is
 * ever passed to a public surface.
 */
export default async function TeacherProfilePage() {
  const [result, references] = await Promise.all([
    getOwnTeacherProfile(),
    getServerReferenceVocabularies(),
  ]);

  if (result.status !== "ok") {
    return <ProfileSignedOut reason={result.status} />;
  }

  return (
    <TeacherProfileClient profile={result.profile} references={references} />
  );
}
