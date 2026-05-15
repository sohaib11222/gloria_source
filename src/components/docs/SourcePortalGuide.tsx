import React, { useEffect, useMemo, useState } from "react";
import "./docs.css";

const sections = [
	{ id: "overview", label: "Overview" },
	{ id: "portal-flow", label: "Portal flow" },
	{ id: "source-profile", label: "Profile & approval" },
	{ id: "locations-branches", label: "Locations & branches" },
	{ id: "pricing", label: "Availability & pricing" },
	{ id: "agreements", label: "Agreements" },
	{ id: "bookings", label: "Bookings" },
	{ id: "verification-health", label: "Verification & health" },
	{ id: "schemas", label: "Schemas & samples" },
	{ id: "launch-checklist", label: "Launch checklist" },
];

const CodeBlock: React.FC<{ title?: string; children: string }> = ({
	title,
	children,
}) => (
	<div className="source-doc-code-card">
		{title && <div className="source-doc-code-title">{title}</div>}
		<pre className="source-doc-code">
			<code>{children}</code>
		</pre>
	</div>
);

const PortalCard: React.FC<{
	title: string;
	subtitle: string;
	items: string[];
	badge?: string;
}> = ({ title, subtitle, items, badge }) => (
	<div className="source-doc-card">
		<div className="source-doc-card-topline">
			{badge && <span className="source-doc-pill">{badge}</span>}
		</div>
		<h3>{title}</h3>
		<p>{subtitle}</p>
		<ul>
			{items.map((item) => (
				<li key={item}>{item}</li>
			))}
		</ul>
	</div>
);

const FieldTable: React.FC<{
	rows: Array<[string, string, string]>;
}> = ({ rows }) => (
	<div className="source-doc-table-wrap">
		<table className="source-doc-table">
			<thead>
				<tr>
					<th>Field</th>
					<th>Required</th>
					<th>Purpose</th>
				</tr>
			</thead>
			<tbody>
				{rows.map(([field, required, purpose]) => (
					<tr key={field}>
						<td>
							<code>{field}</code>
						</td>
						<td>{required}</td>
						<td>{purpose}</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

const SourcePortalGuide: React.FC = () => {
	const [activeSection, setActiveSection] = useState("overview");

	useEffect(() => {
		const scrollToHash = () => {
			const hash = window.location.hash.replace("#", "") || "overview";
			setActiveSection(hash);
			const element = document.getElementById(hash);
			if (element)
				element.scrollIntoView({ behavior: "smooth", block: "start" });
		};

		scrollToHash();

		const handleScroll = () => {
			for (let i = sections.length - 1; i >= 0; i -= 1) {
				const element = document.getElementById(sections[i].id);
				if (!element) continue;
				if (element.getBoundingClientRect().top <= 140) {
					setActiveSection(sections[i].id);
					break;
				}
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("hashchange", scrollToHash);
		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("hashchange", scrollToHash);
		};
	}, []);

	const portalFlow = useMemo(
		() => [
			{
				title: "1. Complete source profile",
				subtitle:
					"Keep your company details, logo, business address, and contact data accurate.",
				items: [
					"Settings stores the profile used by admins and agents.",
					"Logo/photo is shown in dashboard and profile surfaces.",
					"Approval status controls when live features unlock.",
				],
				badge: "Settings",
			},
			{
				title: "2. Configure branches & coverage",
				subtitle:
					"Import detailed branch rows and map them to UN/LOCODE coverage.",
				items: [
					"Manual branch form is the canonical field set.",
					"Upload accepts JSON, XML, PHP var_dump, CSV, and Excel.",
					"Endpoint import can use HTTP/XML or gRPC GetLocations.",
				],
				badge: "Locations",
			},
			{
				title: "3. Configure availability/pricing",
				subtitle:
					"Connect your availability endpoint and test responses before agents search.",
				items: [
					"XML mode sends GLORIA_availabilityrq.",
					"JSON/gRPC modes use Gloria field names.",
					"Stored samples expose parsed vehicles, pricing, terms, extras, and images.",
				],
				badge: "Pricing",
			},
			{
				title: "4. Create agreements",
				subtitle:
					"Offer commercial terms to agents so they can activate search and booking flows.",
				items: [
					"Agents must accept/activate agreements.",
					"Agreement references are passed in availability and booking requests.",
					"Notifications show status changes.",
				],
				badge: "Agreements",
			},
			{
				title: "5. Verify, monitor, operate",
				subtitle:
					"Use Verification and Health tabs before and after going live.",
				items: [
					"Verification tests location, pricing, and gRPC readiness.",
					"Health tracks samples, slow rate, strikes, and backoff.",
					"Reservations/Cancellations show operational booking traffic.",
				],
				badge: "Operations",
			},
		],
		[],
	);

	const navigateTo = (id: string) => {
		setActiveSection(id);
		window.history.replaceState(null, "", `#${id}`);
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="source-doc-shell">
			<aside className="source-doc-sidebar">
				<div className="source-doc-sidebar-title">Source docs</div>
				<nav>
					{sections.map((section) => (
						<button
							key={section.id}
							type="button"
							className={activeSection === section.id ? "active" : ""}
							onClick={() => navigateTo(section.id)}
						>
							<span>{section.label}</span>
						</button>
					))}
				</nav>
			</aside>

			<article className="source-doc-content">
				<section id="overview" className="source-doc-hero">
					<div className="source-doc-eyebrow">Gloria Connect Source Portal</div>
					<h1>Source integration guide</h1>
					<p>
						This guide follows the same flow as your Source Portal sidebar and
						explains what data Gloria needs, which endpoint formats are
						supported, and how each tab contributes to going live.
					</p>
					<div className="source-doc-hero-actions">
						<a href="#locations-branches">Branch data</a>
						<a href="#pricing">Pricing endpoint</a>
						<a href="#verification-health">Verification & health</a>
					</div>
				</section>

				<section id="portal-flow" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Recommended order</span>
						<h2>End-to-end portal flow</h2>
						<p>
							Work through these stages from top to bottom. Each stage maps to a
							tab in the Source Portal.
						</p>
					</div>
					<div className="source-doc-flow-grid">
						{portalFlow.map((card) => (
							<PortalCard key={card.title} {...card} />
						))}
					</div>
				</section>

				<section id="source-profile" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Overview / Settings</span>
						<h2>Company profile, approval, and readiness</h2>
						<p>
							The Source Portal only becomes operational after email
							verification, admin approval, and an active plan.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div className="source-doc-panel">
							<h3>Data Gloria stores</h3>
							<FieldTable
								rows={[
									["companyName", "Yes", "Shown to admins and agents."],
									[
										"website / address",
										"Recommended",
										"Displayed in dashboard and profile context.",
									],
									[
										"logo / photo",
										"Recommended",
										"Used to brand source cards and dashboards.",
									],
									[
										"status / approvalStatus",
										"System",
										"Controls access to protected source features.",
									],
								]}
							/>
						</div>
						<div className="source-doc-panel source-doc-callout">
							<h3>Operational gates</h3>
							<ol>
								<li>Email must be verified.</li>
								<li>Admin must approve the company.</li>
								<li>
									A plan/subscription must be active for branch imports and live
									operations.
								</li>
								<li>
									Endpoint tests should pass before agents search your supply.
								</li>
							</ol>
						</div>
					</div>
				</section>

				<section id="locations-branches" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Locations / Location & Branches</span>
						<h2>Coverage and branch rows</h2>
						<p>
							Coverage answers “where do you operate?” Branch rows answer “which
							desk/office serves that location and how can Gloria book it?”
						</p>
					</div>
					<div className="source-doc-three-col">
						<div className="source-doc-panel">
							<h3>Manual branch form</h3>
							<p>
								Canonical schema. Upload and endpoint imports are normalized to
								these same fields.
							</p>
							<ul>
								<li>Branch code + name</li>
								<li>Address, city, country, country code</li>
								<li>UN/LOCODE / NATO locode</li>
								<li>Phone, email, coordinates</li>
								<li>Opening hours, pickup instructions, brand</li>
							</ul>
						</div>
						<div className="source-doc-panel">
							<h3>HTTP/XML import</h3>
							<p>Best when your system can return full branch details.</p>
							<ul>
								<li>GLORIA_locationlistrs</li>
								<li>CountryList + CountryCode</li>
								<li>VehMatchedLocs / LocationDetail</li>
								<li>Creates/updates Branches table rows</li>
							</ul>
						</div>
						<div className="source-doc-panel">
							<h3>gRPC GetLocations</h3>
							<p>Coverage only. It does not create detailed branch records.</p>
							<ul>
								<li>Returns locations[]</li>
								<li>Each row needs unlocode</li>
								<li>Use manual/HTTP upload for branch rows</li>
							</ul>
						</div>
					</div>
					<CodeBlock title="HTTP/XML location list response">
						{`<GLORIA_locationlistrs TimeStamp="2026-06-01T10:00:00" Target="Production" Version="1.00">
  <Success />
  <CountryList>
    <Country>United Arab Emirates</Country>
    <CountryCode>AE</CountryCode>
    <VehMatchedLocs>
      <VehMatchedLoc>
        <LocationDetail Code="DXB01" Name="Dubai Desk" LocationCode="AEDXB"
          Latitude="25.2532" Longitude="55.3657" AtAirport="true">
          <Address>
            <AddressLine>Dubai International Airport</AddressLine>
            <CityName>Dubai</CityName>
            <CountryName Code="AE">United Arab Emirates</CountryName>
          </Address>
          <Telephone PhoneNumber="+971 4 123 4567" />
        </LocationDetail>
      </VehMatchedLoc>
    </VehMatchedLocs>
  </CountryList>
</GLORIA_locationlistrs>`}
					</CodeBlock>
					<CodeBlock title="gRPC GetLocations response shape">
						{`{
  "locations": [
    { "unlocode": "AEDXB", "name": "Dubai" },
    { "unlocode": "GBLON", "name": "London" }
  ]
}`}
					</CodeBlock>
				</section>

				<section id="pricing" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Pricing / Daily Prices</span>
						<h2>Availability, pricing, samples, and daily prices</h2>
						<p>
							The Pricing tab tests live availability endpoints. Daily Prices
							and manual samples help you maintain offer visibility when you do
							not yet have a fully automated endpoint.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div className="source-doc-panel">
							<h3>Supported availability modes</h3>
							<FieldTable
								rows={[
									[
										"Gloria XML",
										"Recommended for OTA suppliers",
										"Gloria sends GLORIA_availabilityrq and accepts OTA_VehAvailRateRS or GLORIA_availabilityrs.",
									],
									[
										"Gloria JSON",
										"Optional",
										"JSON POST with Gloria field names and vehicles[] response.",
									],
									[
										"Gloria gRPC",
										"Optional",
										"GetAvailability returns VehicleOffer rows.",
									],
									[
										"Manual entry",
										"Fallback",
										"Create stored samples directly from the UI.",
									],
								]}
							/>
						</div>
						<div className="source-doc-panel source-doc-callout">
							<h3>What Gloria stores per offer</h3>
							<ul>
								<li>Supplier offer reference / vehicle ID</li>
								<li>Make/model, image URL, ACRISS class</li>
								<li>Transmission, air conditioning, seats, doors, bags</li>
								<li>Total price, daily price, currency</li>
								<li>Included items, not-included items, optional extras</li>
								<li>Raw supplier payload for troubleshooting</li>
							</ul>
						</div>
					</div>
					<CodeBlock title="GLORIA_availabilityrq XML request sent by Gloria">
						{`<GLORIA_availabilityrq TimeStamp="2025-04-28T10:30:45" Target="Production" Version="1.00">
  <ACC><Source><AccountID ID="Gloria002"/></Source></ACC>
  <VehAvailbody>
    <Vehmain PickUpDateTime="2026-05-23T09:00:00" ReturnDateTime="2026-05-27T11:00:00">
      <collectionbranch LocationCode="TIAA02"/>
      <returnbranch LocationCode="TIAA02"/>
    </Vehmain>
    <DriverAge Age="30"/>
    <DriverCitizenCountry Code="FR"/>
  </VehAvailbody>
</GLORIA_availabilityrq>`}
					</CodeBlock>
					<CodeBlock title="Alternative GLORIA_availabilityrs response">
						{`<GLORIA_availabilityrs>
  <Success />
  <VehAvairsdetails>
    <availcars ACRISS="CCAR">
      <vehdetails Make="SKODA" Model="FABIA" Transmission="Automatic" Doors="4" Seats="5" ImageURL="http://..." />
      <pricing CarOrderID="CCAR12345629-04-26" Currency="EUR" DailyGross="30.00" TotalGross="150.00" />
      <includedinprice><Item Code="CDW" ItemDescription="Collision damage waiver" Excess="1200.00" Deposit="1200.00" /></includedinprice>
      <notincludedinprice><Item Code="FP" ItemDescription="Fuel policy upgrade" Price="35.00" /></notincludedinprice>
      <OptionalExtras><Item Code="GPS" ItemDescription="GPS" Price="25.00" /></OptionalExtras>
    </availcars>
  </VehAvairsdetails>
</GLORIA_availabilityrs>`}
					</CodeBlock>
				</section>

				<section id="agreements" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Agreements / Transactions</span>
						<h2>Commercial access for agents</h2>
						<p>
							Agents can only search and book through valid agreements. Use
							agreements to control commercial terms and scope.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div className="source-doc-panel">
							<h3>Agreement lifecycle</h3>
							<ol>
								<li>Source creates/offers an agreement.</li>
								<li>Agent accepts or activates it.</li>
								<li>
									Agreement reference is passed into availability and booking
									requests.
								</li>
								<li>
									Transactions reflect plan/subscription activity and billing
									events.
								</li>
							</ol>
						</div>
						<div className="source-doc-panel">
							<h3>Notifications</h3>
							<p>
								Status changes such as accepted/active agreements are shown in
								the notification drawer and should be reviewed before live
								testing.
							</p>
						</div>
					</div>
				</section>

				<section id="bookings" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Reservations / Cancellations</span>
						<h2>Booking lifecycle</h2>
						<p>
							After an agent chooses an offer, Gloria routes booking operations
							back to the source implementation.
						</p>
					</div>
					<div className="source-doc-three-col">
						<PortalCard
							title="Create booking"
							subtitle="Create reservation from selected offer."
							badge="CreateBooking"
							items={[
								"Uses supplier_offer_ref / VehID.",
								"Returns booking reference and status.",
								"Should be idempotent where possible.",
							]}
						/>
						<PortalCard
							title="Check / modify"
							subtitle="Keep Gloria in sync with supplier state."
							badge="CheckBooking"
							items={[
								"Return latest booking status.",
								"Support customer or timing changes if available.",
								"Preserve supplier reference.",
							]}
						/>
						<PortalCard
							title="Cancel booking"
							subtitle="Cancel active reservations."
							badge="CancelBooking"
							items={[
								"Return CANCELLED or failure reason.",
								"Cancellations appear in the Cancellations tab.",
								"Keep status consistent with supplier system.",
							]}
						/>
					</div>
				</section>

				<section id="verification-health" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Verification / Health</span>
						<h2>Testing and operational monitoring</h2>
						<p>
							Use the Verification playground before launch. Use Health after
							traffic starts flowing.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div className="source-doc-panel">
							<h3>Verification checks</h3>
							<ul>
								<li>Location list endpoint and sample validation</li>
								<li>Availability/pricing request and response parsing</li>
								<li>gRPC health and method reachability</li>
								<li>Backend automated verification status/history</li>
							</ul>
						</div>
						<div className="source-doc-panel">
							<h3>Health rules</h3>
							<ul>
								<li>Slow threshold: 3000ms by default</li>
								<li>Failures and slow calls count as unhealthy samples</li>
								<li>3 active strikes can trigger temporary exclusion</li>
								<li>Backoff ladder: 15m → 30m → 60m → 2h → 4h</li>
							</ul>
						</div>
					</div>
				</section>

				<section id="schemas" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Canonical fields</span>
						<h2>Upload and endpoint schema expectations</h2>
						<p>
							Use these fields in JSON/CSV/Excel uploads or normalize your
							XML/PHP endpoint output to equivalent values.
						</p>
					</div>
					<FieldTable
						rows={[
							[
								"branchCode / BranchCode / Branchcode / Code",
								"Yes",
								"Stable branch identifier used for upsert and booking.",
							],
							["name / Name", "Yes", "Display name for the branch."],
							[
								"countryCode + city",
								"Recommended",
								"Used to auto-map UN/LOCODE if natoLocode is missing.",
							],
							[
								"natoLocode / UNLocode / LocationCode",
								"Recommended",
								"Exact Gloria location mapping.",
							],
							[
								"latitude / longitude",
								"Recommended",
								"Displayed and used for location quality.",
							],
							["Opening / Monday..Sunday", "Optional", "Branch opening hours."],
							["PickupInstructions", "Optional", "Customer pickup guidance."],
						]}
					/>
					<CodeBlock title="Manual-style JSON upload">
						{`{
  "Branches": [
    {
      "branchCode": "KEFA01",
      "name": "Las Americas Airport Branch",
      "status": "ACTIVE",
      "AtAirport": "true",
      "Brand": "Europcar",
      "locationType": "Airport Meet And Greet",
      "collectionType": "AIRPORT",
      "addressLine": "Las Americas International Airport",
      "city": "Las Americas International Airport",
      "country": "Dominican Republic",
      "countryCode": "DO",
      "natoLocode": "DOSDQ",
      "latitude": 18.51401,
      "longitude": -69.85028,
      "phone": "+354 511 5660",
      "email": "branch@example.com"
    }
  ]
}`}
					</CodeBlock>
				</section>

				<section id="launch-checklist" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Go live</span>
						<h2>Launch checklist</h2>
					</div>
					<div className="source-doc-checklist">
						{[
							"Company profile and logo are complete.",
							"Email is verified and admin approval is complete.",
							"Active plan/subscription exists.",
							"Branches are imported and mapped to UN/LOCODEs.",
							"Availability endpoint returns at least one parsed sample.",
							"Agreement is active with at least one agent.",
							"Verification tab passes required checks.",
							"Health tab shows no active exclusion/backoff.",
						].map((item) => (
							<div key={item}>
								<span>✓</span>
								{item}
							</div>
						))}
					</div>
				</section>
			</article>
		</div>
	);
};

export default SourcePortalGuide;
