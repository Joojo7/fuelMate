import Link from "next/link";
import styles from "./privacy.module.scss";

export const metadata = {
  title: "Privacy Policy & Disclaimer — Pitstop",
  description: "Privacy policy, data attribution, and legal disclaimer for Pitstop fuel station finder.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles["back-link"]}>
          ← BACK TO PITSTOP
        </Link>
      </nav>

      <main className={styles.content}>
        <h1 className={styles.title}>[LEGAL // PRIVACY // DISCLAIMER]</h1>
        <p className={styles.updated}>Last updated: February 2026</p>

        {/* ── DISCLAIMER ──────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>⚠ DISCLAIMER</h2>
          <div className={styles.warning}>
            <p>
              <strong>THIS APPLICATION IS PROVIDED STRICTLY &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;,
              WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
              TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              ACCURACY, RELIABILITY, COMPLETENESS, OR NON-INFRINGEMENT.</strong>
            </p>
            <p>
              Pitstop is an <strong>independent, unofficial, non-commercial project</strong>. It is
              <strong> NOT affiliated with, endorsed by, sponsored by, or in any way officially
              connected to</strong> BP, Shell, Caltex, TotalEnergies, Chevron, or any other fuel
              retailer, petroleum company, or brand whose data may appear in this application.
              All trademarks, brand names, logos, and service marks belong to their respective owners.
            </p>
            <p>
              <strong>DO NOT RELY ON THIS APPLICATION FOR CRITICAL DECISIONS.</strong> Station
              data including locations, operating hours, fuel availability, amenities, and open/closed
              status may be <strong>inaccurate, outdated, incomplete, or entirely wrong</strong> at
              any given time. Stations may have closed, relocated, changed their hours, or altered
              their fuel offerings without this application reflecting those changes.
            </p>
            <p>
              The developer(s) of Pitstop shall <strong>NOT be liable for any direct, indirect,
              incidental, special, consequential, or exemplary damages</strong> arising from or
              related to your use of or inability to use this application, including but not limited
              to damages for loss of profits, goodwill, data, or other intangible losses, wasted fuel,
              missed appointments, vehicle damage, personal injury, or any other outcome resulting from
              reliance on information presented by this application — <strong>even if advised of the
              possibility of such damages</strong>.
            </p>
            <p>
              <strong>YOU USE THIS APPLICATION ENTIRELY AT YOUR OWN RISK.</strong> By accessing
              or using Pitstop, you acknowledge and agree that you have read, understood, and accept
              all terms of this disclaimer. If you do not agree, you must immediately stop using
              this application.
            </p>
          </div>
        </section>

        {/* ── DATA SOURCES & ATTRIBUTION ──────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>DATA SOURCES &amp; ATTRIBUTION</h2>
          <p>
            Pitstop aggregates publicly available fuel station data from multiple sources.
            We gratefully acknowledge the following:
          </p>
          <ul className={styles.list}>
            <li>
              <strong>BP Australia &amp; New Zealand</strong> — Station data sourced from
              publicly available CSV datasets. BP and the BP logo are trademarks of BP p.l.c.
              This project is not affiliated with BP in any way.
            </li>
            <li>
              <strong>Shell</strong> — Station location data for select countries. Shell and the
              Shell Pecten logo are trademarks of Shell International Limited. This project is
              not affiliated with Shell in any way.
            </li>
            <li>
              <strong>TotalEnergies</strong> — Station data sourced via OpenStreetMap community
              contributions. TotalEnergies and its logo are trademarks of TotalEnergies SE.
              This project is not affiliated with TotalEnergies in any way.
            </li>
            <li>
              <strong>Caltex / Chevron</strong> — Station data for select countries. Caltex and
              Chevron are trademarks of Chevron Corporation. This project is not affiliated
              with Chevron in any way.
            </li>
            <li>
              <strong>OpenStreetMap</strong> — Map data © <a href="https://www.openstreetmap.org/copyright"
              target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, licensed
              under the Open Data Commons Open Database License (ODbL).
            </li>
            <li>
              <strong>CARTO</strong> — Map tile rendering provided by <a href="https://carto.com/"
              target="_blank" rel="noopener noreferrer">CARTO</a>.
            </li>
            <li>
              <strong>Google Maps Platform</strong> — Map tiles provided by Google. Google Maps
              is a trademark of Google LLC.
            </li>
            <li>
              <strong>Leaflet</strong> — Open-source map library by <a href="https://leafletjs.com/"
              target="_blank" rel="noopener noreferrer">Volodymyr Agafonkin</a>.
            </li>
          </ul>
          <p>
            If you are a rights holder and believe your data is being used incorrectly, please
            contact us and we will promptly address your concern.
          </p>
        </section>

        {/* ── PRIVACY POLICY ─────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>PRIVACY POLICY</h2>

          <h3 className={styles.subheading}>What data we collect</h3>
          <p>Pitstop is designed to be as privacy-respecting as possible:</p>
          <ul className={styles.list}>
            <li>
              <strong>Geolocation</strong> — If you grant permission, your browser&apos;s
              Geolocation API provides your approximate coordinates to show nearby stations.
              This data is <strong>never transmitted to any server, never stored in any
              database, and never shared with any third party</strong>. It exists only in
              your browser&apos;s memory for the duration of your session.
            </li>
            <li>
              <strong>localStorage</strong> — We store the following non-sensitive preferences
              in your browser&apos;s local storage: your selected country, your favourite/tracked
              stations, and whether you have completed the onboarding tour. This data never
              leaves your device.
            </li>
            <li>
              <strong>No accounts, no emails, no passwords</strong> — Pitstop does not have
              user accounts. We do not collect your name, email address, phone number, or any
              other personal identifier.
            </li>
            <li>
              <strong>No cookies</strong> — Pitstop does not set any cookies.
            </li>
            <li>
              <strong>No analytics or tracking</strong> — Pitstop does not use Google Analytics,
              Facebook Pixel, or any other user tracking service.
            </li>
          </ul>

          <h3 className={styles.subheading}>Third-party services</h3>
          <p>When you use Pitstop, your browser makes requests to the following external services:</p>
          <ul className={styles.list}>
            <li>
              <strong>Google Maps Tile API</strong> — To render map tiles. Subject to
              the <a href="https://policies.google.com/privacy" target="_blank"
              rel="noopener noreferrer">Google Privacy Policy</a>.
            </li>
            <li>
              <strong>CARTO tile servers</strong> — Fallback map tile provider. Subject to
              the <a href="https://carto.com/privacy/" target="_blank"
              rel="noopener noreferrer">CARTO Privacy Policy</a>.
            </li>
            <li>
              <strong>AWS S3 (Amazon Web Services)</strong> — To fetch BP station CSV data.
              Your IP address is visible to AWS as part of the HTTP request. Subject to
              the <a href="https://aws.amazon.com/privacy/" target="_blank"
              rel="noopener noreferrer">AWS Privacy Policy</a>.
            </li>
          </ul>
          <p>
            These services may log your IP address and basic request metadata as part of
            their standard operations. Pitstop has no control over their data practices.
          </p>

          <h3 className={styles.subheading}>Data retention</h3>
          <p>
            Pitstop retains <strong>zero user data</strong> on any server. All user preferences
            are stored exclusively in your browser&apos;s localStorage and can be cleared at
            any time by clearing your browser data or using your browser&apos;s developer tools.
          </p>

          <h3 className={styles.subheading}>Children&apos;s privacy</h3>
          <p>
            Pitstop does not knowingly collect any data from anyone, including children
            under the age of 13.
          </p>
        </section>

        {/* ── LIMITATION OF LIABILITY ────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>LIMITATION OF LIABILITY</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE
            DEVELOPER(S), CONTRIBUTORS, OR ANY PARTY INVOLVED IN CREATING, PRODUCING, OR
            DELIVERING PITSTOP BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION
            DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, FUEL COSTS, VEHICLE DAMAGE,
            PERSONAL INJURY, OR OTHER INTANGIBLE LOSSES (EVEN IF SUCH PARTIES HAVE BEEN
            ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), ARISING OUT OF OR IN CONNECTION
            WITH YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE APPLICATION.
          </p>
          <p>
            SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR
            CONSEQUENTIAL OR INCIDENTAL DAMAGES, SO THE ABOVE LIMITATION MAY NOT APPLY
            TO YOU. IN SUCH JURISDICTIONS, LIABILITY IS LIMITED TO THE GREATEST EXTENT
            PERMITTED BY LAW.
          </p>
        </section>

        {/* ── NO GUARANTEE OF AVAILABILITY ───────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>NO GUARANTEE OF AVAILABILITY</h2>
          <p>
            Pitstop may be discontinued, modified, or become unavailable at any time without
            prior notice. The developer(s) are under no obligation to maintain, update, or
            support this application. Data sources may change, become unavailable, or be
            revoked by their respective owners at any time.
          </p>
        </section>

        {/* ── INTELLECTUAL PROPERTY ──────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>INTELLECTUAL PROPERTY</h2>
          <p>
            All fuel brand names, logos, and trademarks mentioned in this application are the
            property of their respective owners. Their use in this application is purely for
            identification and informational purposes and does not imply any endorsement,
            sponsorship, or affiliation.
          </p>
          <p>
            The Pitstop application code, UI design, and terminal/HUD aesthetic are the
            original work of the developer(s). The data displayed within the application
            belongs to its respective sources as credited above.
          </p>
        </section>

        {/* ── CHANGES TO THIS POLICY ─────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>CHANGES TO THIS POLICY</h2>
          <p>
            This policy may be updated at any time without notice. Continued use of
            Pitstop after any changes constitutes acceptance of the revised terms.
          </p>
        </section>

        {/* ── CONTACT ────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={styles.heading}>CONTACT</h2>
          <p>
            If you have questions, concerns, or data removal requests, please open an issue
            on the project&apos;s repository or contact the developer directly.
          </p>
        </section>

        <footer className={styles.footer}>
          <Link href="/" className={styles["back-link"]}>
            ← BACK TO PITSTOP
          </Link>
        </footer>
      </main>
    </div>
  );
}
