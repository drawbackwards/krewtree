import React from 'react'
import { LegalDocument, LegalSection } from './LegalDocument'

/**
 * Privacy Policy — SHELL. Section skeletons only; drop final copy in per section
 * before launch. Route: /privacy (also referenced by the email footer
 * URLS.privacyUrl and the signup agreement links). The SMS section is a
 * deliberate placeholder for the TCPA/consent language phone verification needs.
 */
export const PrivacyPage: React.FC = () => (
  <LegalDocument title="Privacy Policy" lastUpdated="Not yet published">
    <LegalSection heading="1. Overview">
      [Placeholder — what this policy covers and who it applies to.]
    </LegalSection>
    <LegalSection heading="2. Information we collect">
      [Placeholder — account details, profile and job data, usage and device information.]
    </LegalSection>
    <LegalSection heading="3. How we use your information">
      [Placeholder — operating the marketplace, matching, notifications, safety, and improvement.]
    </LegalSection>
    <LegalSection heading="4. How we share information">
      [Placeholder — between workers and companies on the platform, service providers, and legal
      requirements.]
    </LegalSection>
    <LegalSection heading="5. Email and SMS communications">
      [Placeholder — email/SMS you receive, how to opt out, and SMS/messaging consent (TCPA) for
      phone verification and alerts.]
    </LegalSection>
    <LegalSection heading="6. Data retention">
      [Placeholder — how long data is kept and deletion timelines.]
    </LegalSection>
    <LegalSection heading="7. Security">
      [Placeholder — measures used to protect your data.]
    </LegalSection>
    <LegalSection heading="8. Your rights and choices">
      [Placeholder — access, correction, deletion, and other rights depending on your location.]
    </LegalSection>
    <LegalSection heading="9. Cookies and tracking">
      [Placeholder — cookies and analytics used, and choices available.]
    </LegalSection>
    <LegalSection heading="10. Children's privacy">
      [Placeholder — the service is not directed to children under the applicable age.]
    </LegalSection>
    <LegalSection heading="11. Changes to this policy">
      [Placeholder — how updates to this policy are communicated.]
    </LegalSection>
    <LegalSection heading="12. Contact">
      [Placeholder — how to reach krewtree about privacy questions or requests.]
    </LegalSection>
  </LegalDocument>
)
