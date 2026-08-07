import React from 'react'
import { LegalDocument, LegalSection } from './LegalDocument'

/**
 * Terms of Service — SHELL. Section skeletons only; drop final copy in per
 * section before launch. Route: /terms (also referenced by the email footer
 * URLS.termsUrl and the signup agreement links).
 */
export const TermsPage: React.FC = () => (
  <LegalDocument title="Terms of Service" lastUpdated="Not yet published">
    <LegalSection heading="1. Agreement to terms">
      [Placeholder — acceptance of these terms by using krewtree.]
    </LegalSection>
    <LegalSection heading="2. Who can use krewtree">
      [Placeholder — eligibility, age, and account requirements for workers and companies.]
    </LegalSection>
    <LegalSection heading="3. Accounts and security">
      [Placeholder — account creation, accurate information, and keeping credentials safe.]
    </LegalSection>
    <LegalSection heading="4. Using the platform">
      [Placeholder — acceptable use; what workers and companies may and may not do.]
    </LegalSection>
    <LegalSection heading="5. Job postings and applications">
      [Placeholder — responsibilities of companies posting jobs and workers applying; no guarantee
      of hiring.]
    </LegalSection>
    <LegalSection heading="6. Payments and paid features">
      [Placeholder — boosts and any paid features, billing, and refunds.]
    </LegalSection>
    <LegalSection heading="7. Content and intellectual property">
      [Placeholder — ownership of your content and the license you grant krewtree to operate the
      service.]
    </LegalSection>
    <LegalSection heading="8. Termination">
      [Placeholder — how either party may end the relationship and what happens to your data.]
    </LegalSection>
    <LegalSection heading="9. Disclaimers">
      [Placeholder — the service is provided "as is"; krewtree is not a party to employment
      relationships.]
    </LegalSection>
    <LegalSection heading="10. Limitation of liability">
      [Placeholder — limits on krewtree's liability.]
    </LegalSection>
    <LegalSection heading="11. Changes to these terms">
      [Placeholder — how and when these terms may change.]
    </LegalSection>
    <LegalSection heading="12. Contact">
      [Placeholder — how to reach krewtree with questions about these terms.]
    </LegalSection>
  </LegalDocument>
)
