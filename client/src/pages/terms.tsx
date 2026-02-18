/**
 * TERMS OF SERVICE
 * ================
 * Concise terms for Driiva telematics insurance (UK).
 * Last updated: February 2026
 */

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 pt-safe pt-6 pb-24 text-white">
        {/* Header - fixed at top */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-1">Terms of Service (ToS)</h1>
        <p className="text-white/60 text-xs mb-6">Effective: February 2026 · Driiva Ltd (UK)</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 text-left"
        >
          <p className="text-white/90 text-sm leading-relaxed mb-6">
            Welcome to Driiva. We're the intelligent car insurance where safe driving can earn you up to 15% back – year after year. By using our app, you agree to these terms. Please read them.
          </p>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">Our service</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Driiva offers telematics-based car insurance and a community rewards programme. We use your driving data to calculate a personal score and your share of the community pool. The service is offered in the UK and subject to FCA and Consumer Duty.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">2. How refunds work</h2>
            <p className="text-white/80 text-sm leading-relaxed mb-2">
              The pool is funded by premiums and other sources. Qualified drivers may receive a refund based on behaviour and actuarial principles.
            </p>
            <ul className="list-disc list-inside text-white/80 text-sm space-y-1 mb-2">
              <li>~80% of your refund comes from your own driving score.</li>
              <li>~20% reflects a community bonus.</li>
              <li>Your personal efforts drive most of your refund.</li>
            </ul>
            <p className="text-white/80 text-sm leading-relaxed">
              Our community score averages only drivers who qualify (score 70+). High-risk drivers pay premiums that reflect their risk and help balance the pool. Refunds are capped (e.g. up to ~15%) to ensure sustainability.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">3. Driving score</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              We analyse speed, braking, acceleration, cornering, and phone usage. You get clear feedback on how your driving affects scores and refunds. Unsafe habits may lead to higher premiums or declined coverage.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">4. Your obligations</h2>
            <ul className="list-disc list-inside text-white/80 text-sm space-y-1">
              <li>Provide accurate information and keep it up to date.</li>
              <li>Use the app and any telematics device lawfully.</li>
              <li>Don't misuse the service or manipulate scores.</li>
              <li>Keep your account credentials secure.</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">5. Termination</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              You may close your account anytime via the app or by contacting us. We may suspend or terminate if you breach these terms, fail to pay, provide false information, or misuse the app. On termination, your right to use the service and earn refunds ceases. Data retention follows our Privacy Policy.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">6. Liability</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              We don't exclude liability for death or personal injury caused by our negligence, or fraud. Otherwise, we're not liable for indirect, consequential, or special loss, or amounts above fees paid in the 12 months before a claim. You use the app and drive at your own risk.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">7. Changes</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              We may update these terms. We'll notify you of material changes. Continued use after the effective date constitutes acceptance where the law allows.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="text-lg font-semibold text-white mb-2">8. General</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, unless you're a consumer elsewhere in the UK.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Questions? Contact us at{" "}
              <a href="mailto:info@driiva.co.uk" className="text-teal-400 hover:underline">
                info@driiva.co.uk
              </a>
              . For full policy terms, see your policy document.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
