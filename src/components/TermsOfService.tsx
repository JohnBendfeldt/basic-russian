import React from 'react';

interface TermsOfServiceProps {
  onNavigate: (section: string) => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onNavigate }) => {
  return (
    <div className="section legal-container">
      <div className="legal-card">
        <div className="legal-nav-bar">
          <button 
            className="legal-back-btn" 
            onClick={() => onNavigate('alphabet')}
            aria-label="Back to practice lessons"
          >
            ← Back to Practice
          </button>
        </div>

        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-last-updated">Last Updated: October 16, 2026</p>

        <h2>1. Agreement to Terms</h2>
        <p>By accessing or using <strong>Basic Russian</strong> (located at <a href="https://basicrussian.org">basicrussian.org</a>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.</p>

        <h2>2. Purpose of the Service</h2>
        <p>Basic Russian is provided as an interactive, educational language learning resource designed to help users practice Russian Cyrillic, pronunciation, numbers, common words, and survival phrases. The service is provided free of charge for personal, non-commercial educational use.</p>

        <h2>3. User Accounts &amp; Acceptable Use</h2>
        <p>You may use Basic Russian without an account (Guest Mode) or sign in via Google OAuth or Microsoft Entra ID to save your learning history. When using the service, you agree not to:</p>
        <ul>
          <li>Attempt to bypass, disable, or tamper with security or Row Level Security policies of our database or APIs.</li>
          <li>Use automated bots, scrapers, or scripts to abuse the quiz or voice APIs.</li>
          <li>Impersonate another user or access an account not belonging to you.</li>
        </ul>

        <h2>4. Intellectual Property</h2>
        <p>The code for Basic Russian is open source under the MIT License. The audio assets, learning design, and trademarks belong to their respective creators and operators.</p>

        <h2>5. Disclaimer of Warranties</h2>
        <p>Basic Russian is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied. While we strive for accuracy in our language transliterations and pronunciation guides, we make no guarantees that the content is completely error-free or that service will be uninterrupted.</p>

        <h2>6. Limitation of Liability</h2>
        <p>In no event shall Basic Russian or its developer be liable for any indirect, incidental, or consequential damages resulting from your use of or inability to use the service.</p>

        <h2>7. Modifications to the Service</h2>
        <p>We reserve the right to modify, update, or discontinue any feature of Basic Russian at any time without notice.</p>

        <h2>8. Contact Information</h2>
        <p>For any questions regarding these Terms, please contact:</p>
        <p className="legal-contact-block">
          <strong>Basic Russian</strong><br />
          Attn: John Bendfeldt<br />
          Email: <a href="mailto:dev@basicrussian.org">dev@basicrussian.org</a><br />
          Website: <a href="https://basicrussian.org">https://basicrussian.org</a>
        </p>

        <div className="legal-page-footer">
          <span>Questions about how we handle your data? </span>
          <button 
            type="button" 
            className="legal-inline-link" 
            onClick={() => onNavigate('privacy')}
          >
            View Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
