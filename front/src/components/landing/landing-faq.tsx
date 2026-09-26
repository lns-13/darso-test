import { Accordion, type AccordionItemData } from "@/components/library/accordion";

const FAQ_ITEMS: AccordionItemData[] = [
  {
    id: "how-it-works",
    question: "Comment fonctionne darso ?",
    answer:
      "Vous choisissez la matière et le niveau, comparez les profs vérifiés, réservez un créneau et démarrez votre séance en visio ou à domicile. Le paiement est déclenché uniquement après la séance.",
  },
  {
    id: "teacher-verification",
    question: "Comment sont vérifiés les profs ?",
    answer:
      "Chaque prof passe une vérification d'identité, un contrôle des diplômes, et un entretien pédagogique. Les 3 premières séances sont notées manuellement par notre équipe qualité avant d'obtenir le badge Vérifié.",
  },
  {
    id: "pricing",
    question: "Combien coûte une séance ?",
    answer:
      "Les tarifs sont fixés par chaque prof, généralement entre 80 et 250 MAD par heure selon le niveau et la matière. Aucun frais caché : le prix affiché est celui que vous payez.",
  },
  {
    id: "payments",
    question: "Comment sont gérés les paiements ?",
    answer:
      "Vous ajoutez une carte au moment de la réservation. Le montant est prélevé après la séance, une fois que vous l'avez validée. Reçus et factures sont générés automatiquement dans votre espace.",
  },
  {
    id: "choose-teacher",
    question: "Peut-on choisir son prof ?",
    answer:
      "Oui, entièrement. Vous consultez profils, avis, disponibilités et vidéos de présentation avant de réserver. Vous pouvez aussi filtrer par sexe, langue et méthode d'enseignement.",
  },
  {
    id: "subscription",
    question: "Y a-t-il un abonnement ?",
    answer:
      "Non. darso fonctionne à la séance, sans engagement. Vous pouvez néanmoins acheter des packs de séances à tarif préférentiel avec un même prof.",
  },
  {
    id: "cancel",
    question: "Puis-je annuler une séance ?",
    answer:
      "Oui, gratuitement jusqu'à 12 heures avant le créneau. Passé ce délai, la séance est facturée à 50 %. En cas d'imprévu grave, contactez le support pour une révision.",
  },
  {
    id: "teach-on-darso",
    question: "Comment devenir prof sur darso ?",
    answer:
      "Créez votre profil en 5 minutes, envoyez vos justificatifs, et notre équipe revient vers vous sous 48 h. Une fois validé, vous fixez vos tarifs, votre agenda et recevez vos premières demandes.",
  },
];

export function LandingFaq() {
  return (
    <section aria-labelledby="faq-heading" className="bg-[#EDEDEF]">
      <div className="container-wide py-16 md:py-24">
        <header className="mx-auto mb-8 max-w-[720px] text-center md:mb-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6E7178]">
            Support
          </p>
          <h2
            id="faq-heading"
            className="mt-2 text-[32px] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#0B0B0F] md:text-[44px]"
            style={{ fontFamily: "var(--font-cabinet), system-ui, sans-serif" }}
          >
            Questions fréquentes
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#6E7178]">
            Tout ce que vous devez savoir avant votre première séance.
          </p>
        </header>

        <div className="mx-auto max-w-[720px]">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </div>
    </section>
  );
}
