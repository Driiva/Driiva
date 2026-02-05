/**
 * TERMS OF SERVICE
 * ================
 * Terms of use for Driiva telematics insurance app (UK).
 * Last updated: February 2026
 */

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-6">
    <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
    <div className="text-white/80 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

const SubSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <h3 className="text-base font-medium text-white/95 mb-1">{title}</h3>
    <div className="text-white/80 text-sm leading-relaxed space-y-1 pl-0">
      {children}
    </div>
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-white/80 text-sm leading-relaxed">{children}</p>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc list-inside text-white/80 text-sm space-y-1 mb-2">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 pb-16 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-white/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-400" />
          </div>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/60 text-xs mb-6">
          Effective: February 2026 · Driiva Ltd (UK)
        </p>

        <div className="backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 text-left">
          <p className="text-white/90 text-sm leading-relaxed mb-6">
            Welcome to Driiva. Driiva is the intelligent car insurance where
            safe driving can earn you up to a 15% refund – year after year.
            Rewards are powered by data intelligence and a community pool for
            fairness. By using our app and services, you agree to these Terms of
            Service. Please read them carefully.
          </p>

          <Section title="1. The service">
            <P>
              Driiva provides telematics-based car insurance and a
              community-driven rewards programme. We use your driving data to
              calculate a personal driving score and to determine your share of
              the community surplus pool, which can result in money off your
              insurance at renewal. The service is offered in the UK and is
              subject to applicable law and regulation (including FCA and
              Consumer Duty).
            </P>
          </Section>

          <Section title="2. Community pool mechanics (how refunds work)">
            <SubSection title="2.1 What the community pool is">
              <P>
                The community pool is funded by premium contributions and other
                sources (e.g. shareholder profit, as described in our product
                materials). Qualified drivers may receive a refund (money off
                their insurance) from this pool based on behavioural eligibility
                and actuarial principles.
              </P>
            </SubSection>
            <SubSection title="2.2 How your refund is determined">
              <List
                items={[
                  "The bulk of your refund (around 80%) is based on your own driving: your personal score and behaviour.",
                  "A smaller portion (around 20%) reflects a community score bonus, so good drivers collectively benefit.",
                  "Even if the community underperforms, your personal efforts determine most of your refund.",
                ]}
              />
            </SubSection>
            <SubSection title="2.3 Community score design">
              <P>
                Our community score is the average of only those drivers who
                qualify for a refund (personal score of 70 or above). This
                “positivity only” design prevents low scorers from dragging down
                the community metric. Example: if 1,000 drivers use Driiva and
                700 qualify (personal score 70+), the community score is the
                average of those 700, not all 1,000.
              </P>
            </SubSection>
            <SubSection title="2.4 High-risk drivers and pool balance">
              <P>
                High-risk drivers pay premiums that reflect their risk and help
                keep the rewards pool balanced. They rarely qualify for refunds
                (typically personal scores below 70), so their impact on the
                pool is limited. Premiums are priced to cover worst-case
                scenarios; a refund cap (e.g. up to around 15%) ensures
                sufficient funds for claims and costs. If claims exceed
                expectations, we manage the pool in line with our product and
                regulatory obligations.
              </P>
            </SubSection>
          </Section>

          <Section title="3. Driving score calculation">
            <SubSection title="3.1 Transparency">
              <P>
                We use a dynamic scoring engine that analyses your driving
                behaviour across categories such as speed, braking, acceleration,
                cornering, and phone usage. Each user receives plain-English
                feedback on how their driving translates into scores and
                outcomes. We are committed to clear, concise explanations of how
                scores and rebates are calculated.
              </P>
            </SubSection>
            <SubSection title="3.2 How the score is used">
              <P>
                Your score is used to determine your eligibility for refunds,
                your share of the community pool, and (where applicable) your
                premium. Unsafe habits identified during onboarding or over time
                may lead to higher premiums or declined coverage. We use
                reciprocal scoring models and real individual behaviour to
                support proactive risk reduction and fair pricing.
              </P>
            </SubSection>
          </Section>

          <Section title="4. Your obligations">
            <List
              items={[
                "You must provide accurate information and keep it up to date.",
                "You must use the app and any telematics device in line with these terms and the law.",
                "You must not misuse the service, attempt to manipulate scores, or breach security.",
                "You are responsible for maintaining the security of your account credentials.",
              ]}
            />
          </Section>

          <Section title="5. Account termination">
            <SubSection title="5.1 Termination by you">
              <P>
                You may close your account at any time via the app (e.g. “Delete
                Account”) or by contacting us. Closure may affect your policy and
                eligibility for refunds; we will explain the implications when
                you request closure.
              </P>
            </SubSection>
            <SubSection title="5.2 Termination or suspension by us">
              <P>
                We may suspend or terminate your account or access to the
                service if you breach these terms, fail to pay premiums, provide
                false information, misuse the app, or where we are required to
                do so by law or regulation. We may also suspend or terminate
                where we discontinue the service or a product, subject to
                applicable notice and regulatory requirements.
              </P>
            </SubSection>
            <SubSection title="5.3 Effect of termination">
              <P>
                On termination, your right to use the app and (where applicable)
                to earn or receive refunds ceases in line with your policy
                terms. Data retention is governed by our Privacy Policy and
                legal obligations.
              </P>
            </SubSection>
          </Section>

          <Section title="6. Liability limitations">
            <SubSection title="6.1 Our liability">
              <P>
                Nothing in these terms excludes or limits our liability for
                death or personal injury caused by our negligence, fraud, or any
                other liability that cannot be excluded or limited by law.
              </P>
              <P>
                Subject to that, we shall not be liable for: (a) indirect,
                consequential, or special loss or damage; (b) loss of profit,
                revenue, data, or goodwill; (c) any failure or delay due to
                matters beyond our reasonable control (e.g. network failure,
                force majeure); or (d) any amount in excess of the fees you have
                paid to us in the 12 months before the claim (or, for
                insurance-related claims, as set out in your policy).
              </P>
            </SubSection>
            <SubSection title="6.2 Your responsibility">
              <P>
                You use the app and drive at your own risk. We are not liable
                for your driving decisions, for the accuracy of GPS or
                telematics in all conditions, or for third-party acts (e.g.
                other drivers, infrastructure). Insurance cover is set out in
                your policy document.
              </P>
            </SubSection>
          </Section>

          <Section title="7. Changes to terms and service">
            <P>
              We may update these terms from time to time. We will notify you of
              material changes (e.g. via the app or email) and, where required
              by law, give you the opportunity to accept or reject them. Continued
              use of the service after the effective date of changes constitutes
              acceptance unless the law requires explicit consent.
            </P>
          </Section>

          <Section title="8. General">
            <P>
              These terms are governed by the laws of England and Wales. Any
              dispute is subject to the exclusive jurisdiction of the courts of
              England and Wales, unless you are a consumer in another part of the
              UK, in which case mandatory consumer protection laws may apply. If
              any part of these terms is held invalid, the rest remains in
              effect. Our failure to enforce a right does not waive that right.
            </P>
          </Section>

          <Section title="9. Contact">
            <P>
              For questions about these terms, contact us at{" "}
              <a
                href="mailto:hello@driiva.com"
                className="text-teal-400 hover:underline"
              >
                hello@driiva.com
              </a>
              . For full terms and conditions of your insurance policy, please
              refer to your policy document and any product-specific terms we
              provide.
            </P>
          </Section>
        </div>
      </motion.div>
    </div>
  );
}
