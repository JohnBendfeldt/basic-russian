import React from 'react';

interface PrivacyPolicyProps {
  onNavigate: (section: string) => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
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

        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-last-updated">Last Updated: October 16, 2026</p>

        <div className="legal-highlight-box">
          <strong>Plain English Summary:</strong> We believe in privacy by default. Basic Russian is an educational tool. We only collect the minimal information needed to save your quiz progress and learning stats. We never sell your data, we do not run third-party advertising trackers, and you can delete your data at any time.
        </div>

        <h2>1. Information We Collect</h2>
        <p>We collect information in two ways:</p>
        <ul>
          <li><strong>Guest Users (Unauthenticated):</strong> If you use the app without logging in, your quiz scores and word practice history are stored exclusively in your local browser’s <code>localStorage</code>. No personal identification is collected or transmitted to our servers.</li>
          <li><strong>Registered Users (Authenticated via Google or Microsoft):</strong> If you choose to sign in to sync progress across devices, we receive basic authentication details from your chosen OAuth provider:
            <ul>
              <li>Email address</li>
              <li>Display name</li>
              <li>Profile avatar URL (if provided by Google/Microsoft)</li>
            </ul>
          </li>
          <li><strong>Learning Data:</strong> Quiz session scores, accuracy rates, and spaced-repetition performance for practice vocabulary.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>Your information is used strictly to provide and improve your language learning experience:</p>
        <ul>
          <li>To save and display your completed quiz scores and streaks.</li>
          <li>To track vocabulary mastery and generate your personalized &quot;Words to Review&quot; list.</li>
          <li>To authenticate your session securely across multiple devices.</li>
        </ul>
        <p><strong>We do not sell, rent, monetize, or trade your personal data with any third parties or advertisers.</strong></p>

        <h2>3. Data Storage &amp; Security</h2>
        <p>
          Your data is stored in a secure cloud PostgreSQL database managed via Supabase, hosted on enterprise cloud infrastructure. Security measures include:
        </p>
        <ul>
          <li><strong>Encryption in Transit:</strong> All communication between your browser and our services is encrypted using HTTPS / TLS.</li>
          <li><strong>Row Level Security (RLS):</strong> Our database enforces strict row-level security policies at the database engine level, ensuring that users can only view, modify, or delete their own learning records.</li>
          <li><strong>No Password Storage:</strong> We authenticate exclusively through industry-standard OAuth 2.0 (Google and Microsoft Entra ID). We never handle, store, or have access to your account passwords.</li>
        </ul>

        <h2>4. Your Rights &amp; Data Deletion (GDPR &amp; CCPA)</h2>
        <p>You have full control over your personal data:</p>
        <ul>
          <li><strong>Right to Access:</strong> You can view all learning data associated with your account directly in the &quot;My Stats&quot; dashboard.</li>
          <li><strong>Right to Erasure (Right to be Forgotten):</strong> You may request the permanent deletion of your account and all associated quiz history at any time. To request data deletion, email us at <a href="mailto:dev@basicrussian.org">dev@basicrussian.org</a>, and we will purge your records within 14 business days.</li>
          <li><strong>Local Storage Cleansing:</strong> Guest users can erase their local browser history anytime by clearing site cookies and storage in their browser settings.</li>
        </ul>

        <h2>5. Third-Party Services</h2>
        <p>To deliver this application, we work with trusted infrastructure providers:</p>
        <ul>
          <li><strong>Google Identity &amp; Microsoft Entra ID:</strong> Used for secure single sign-on authentication.</li>
          <li><strong>Supabase:</strong> Provides managed PostgreSQL database hosting and session management.</li>
          <li><strong>Netlify:</strong> Provides global static web hosting and serverless functions.</li>
        </ul>

        <h2>6. Children’s Privacy</h2>
        <p>Basic Russian is designed as a general educational resource. We do not knowingly collect personal data from children under the age of 13. If you believe a child has provided us with personal information, please contact us for immediate removal.</p>

        <h2>7. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time to reflect improvements to our app. Any updates will be posted here with a revised &quot;Last Updated&quot; date.</p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions or requests regarding your privacy, please contact:</p>
        <p className="legal-contact-block">
          <strong>Basic Russian</strong><br />
          Attn: John Bendfeldt<br />
          Email: <a href="mailto:dev@basicrussian.org">dev@basicrussian.org</a><br />
          Website: <a href="https://basicrussian.org">https://basicrussian.org</a>
        </p>

        <div className="legal-page-footer">
          <span>Looking for our terms? </span>
          <button 
            type="button" 
            className="legal-inline-link" 
            onClick={() => onNavigate('terms')}
          >
            View Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
