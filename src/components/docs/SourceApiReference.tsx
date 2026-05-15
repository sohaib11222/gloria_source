import React, { useEffect, useMemo, useState } from "react";
import "./docs.css";

type Section = { id: string; label: string };
type ApiMethod = {
	name: string;
	type: string;
	direction: string;
	request: string;
	response: string;
	notes: string[];
};

const sections: Section[] = [
	{ id: "overview", label: "API overview" },
	{ id: "source-provider", label: "Source Provider gRPC" },
	{ id: "health", label: "GetHealth" },
	{ id: "locations", label: "GetLocations" },
	{ id: "availability", label: "GetAvailability" },
	{ id: "http-location", label: "HTTP location list" },
	{ id: "http-pricing", label: "HTTP pricing XML/JSON" },
	{ id: "bookings", label: "Bookings" },
	{ id: "formats", label: "Data rules" },
	{ id: "errors-performance", label: "Errors & performance" },
	{ id: "implementation", label: "Implementation example" },
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

const ApiCard: React.FC<{
	eyebrow: string;
	title: string;
	children: React.ReactNode;
}> = ({ eyebrow, title, children }) => (
	<div className="source-doc-panel source-api-card">
		<span className="source-doc-pill">{eyebrow}</span>
		<h3>{title}</h3>
		{children}
	</div>
);

const FieldTable: React.FC<{
	columns?: [string, string, string];
	rows: Array<[string, string, string]>;
}> = ({ columns = ["Field", "Required", "Description"], rows }) => (
	<div className="source-doc-table-wrap">
		<table className="source-doc-table">
			<thead>
				<tr>
					{columns.map((column) => (
						<th key={column}>{column}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map((row) => (
					<tr key={row.join("-")}>
						<td>
							<code>{row[0]}</code>
						</td>
						<td>{row[1]}</td>
						<td>{row[2]}</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

const MethodMatrix: React.FC<{ methods: ApiMethod[] }> = ({ methods }) => (
	<div className="source-api-method-grid">
		{methods.map((method) => (
			<div className="source-api-method" key={method.name}>
				<div className="source-api-method-header">
					<span>{method.type}</span>
					<strong>{method.name}</strong>
				</div>
				<p>{method.direction}</p>
				<dl>
					<div>
						<dt>Request</dt>
						<dd>{method.request}</dd>
					</div>
					<div>
						<dt>Response</dt>
						<dd>{method.response}</dd>
					</div>
				</dl>
				<ul>
					{method.notes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			</div>
		))}
	</div>
);

const SourceApiReference: React.FC = () => {
	const [activeSection, setActiveSection] = useState("overview");

	const methods = useMemo<ApiMethod[]>(
		() => [
			{
				name: "GetHealth",
				type: "gRPC",
				direction: "Gloria → Source",
				request: "Empty",
				response: "HealthResponse { ok, note }",
				notes: [
					"Used by endpoint testing and monitoring.",
					"Return ok=false only when you want traffic considered unhealthy.",
				],
			},
			{
				name: "GetLocations",
				type: "gRPC",
				direction: "Gloria → Source",
				request: "Empty",
				response: "LocationsResponse { locations[] }",
				notes: [
					"Coverage only: unlocode + name.",
					"Does not create detailed branch records. Use branch upload or HTTP/XML for that.",
				],
			},
			{
				name: "GetAvailability",
				type: "gRPC",
				direction: "Gloria → Source",
				request: "AvailabilityRequest",
				response: "AvailabilityResponse { vehicles[] }",
				notes: [
					"agreement_ref is always passed and should drive rates/eligibility.",
					"Optional rich fields can carry picture, ACRISS, terms, extras, and charges.",
				],
			},
			{
				name: "CreateBooking",
				type: "gRPC",
				direction: "Gloria → Source",
				request: "BookingCreateRequest",
				response: "BookingResponse",
				notes: [
					"Requires agreement_ref, supplier_offer_ref, and idempotency_key.",
					"Gloria can pass optional pickup, vehicle, customer, and payment fields when available.",
				],
			},
			{
				name: "Modify / Cancel / CheckBooking",
				type: "gRPC",
				direction: "Gloria → Source",
				request: "BookingRef",
				response: "BookingResponse",
				notes: [
					"Requires agreement_ref and supplier_booking_ref.",
					"Return your latest supplier status.",
				],
			},
		],
		[],
	);

	useEffect(() => {
		const applyHash = () => {
			const hash = window.location.hash.replace("#", "") || "overview";
			setActiveSection(hash);
			document
				.getElementById(hash)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		};

		applyHash();

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
		window.addEventListener("hashchange", applyHash);
		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("hashchange", applyHash);
		};
	}, []);

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
				<div className="source-doc-sidebar-title">API reference</div>
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
				<section id="overview" className="source-doc-hero source-api-hero">
					<div className="source-doc-eyebrow">Supplier API contract</div>
					<h1>Source API reference</h1>
					<p>
						This page documents the interfaces Gloria calls when a Source goes
						live: gRPC service methods, HTTP/XML location imports, Gloria
						XML/JSON availability testing, booking callbacks, validation rules,
						and health behavior. It mirrors the actual Source Portal tabs and
						backend adapters.
					</p>
					<div className="source-doc-hero-actions">
						<a href="#source-provider">gRPC contract</a>
						<a href="#http-location">Location payloads</a>
						<a href="#http-pricing">Pricing payloads</a>
						<a
							href="/docs/proto/source_provider.proto"
							download="source_provider.proto"
						>
							Download proto
						</a>
					</div>
				</section>

				<section className="source-doc-section">
					<div className="source-api-lifecycle">
						<div>
							<span>1</span>
							<strong>Agent searches</strong>
							<p>
								Gloria validates agreement, source status, plan, coverage, and
								dates.
							</p>
						</div>
						<div>
							<span>2</span>
							<strong>Gloria calls Source</strong>
							<p>
								gRPC, Gloria XML, or Gloria JSON endpoint is selected from
								Source endpoint settings.
							</p>
						</div>
						<div>
							<span>3</span>
							<strong>Source responds</strong>
							<p>
								Vehicle offers, branch coverage, health, or booking status are
								parsed and normalized.
							</p>
						</div>
						<div>
							<span>4</span>
							<strong>Portal monitors</strong>
							<p>
								Samples, verification, health rate, slow calls, strikes, and
								backoff are displayed in Source.
							</p>
						</div>
					</div>
				</section>

				<section id="source-provider" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>gRPC service</span>
						<h2>SourceProviderService</h2>
						<p>
							If you configure a gRPC endpoint, Gloria creates a client from{" "}
							<code>source_provider.proto</code> and calls your service at the
							configured <code>host:port</code>. Local bind addresses such as{" "}
							<code>0.0.0.0:51061</code> are normalized to{" "}
							<code>localhost:51061</code> for client calls.
						</p>
					</div>
					<MethodMatrix methods={methods} />
					<CodeBlock title="source_provider.proto service">
						{`service SourceProviderService {
  rpc GetHealth (Empty) returns (HealthResponse);
  rpc GetLocations (Empty) returns (LocationsResponse);
  rpc GetAvailability (AvailabilityRequest) returns (AvailabilityResponse);
  rpc CreateBooking (BookingCreateRequest) returns (BookingResponse);
  rpc ModifyBooking (BookingRef) returns (BookingResponse);
  rpc CancelBooking (BookingRef) returns (BookingResponse);
  rpc CheckBooking  (BookingRef) returns (BookingResponse);
}`}
					</CodeBlock>
				</section>

				<section id="health" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Health tab / verification</span>
						<h2>GetHealth</h2>
						<p>
							Implement this lightweight check so the portal can confirm that
							your service is reachable.
						</p>
					</div>
					<div className="source-doc-two-col">
						<ApiCard eyebrow="Request" title="Empty message">
							<p>No fields are sent.</p>
						</ApiCard>
						<ApiCard eyebrow="Response" title="HealthResponse">
							<FieldTable
								rows={[
									["ok", "Yes", "true when your API can accept traffic."],
									[
										"note",
										"Optional",
										"Human-readable message for diagnostics.",
									],
								]}
							/>
						</ApiCard>
					</div>
					<CodeBlock title="Example response">
						{`{
  "ok": true,
  "note": "Service is healthy"
}`}
					</CodeBlock>
				</section>

				<section id="locations" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Locations / coverage</span>
						<h2>GetLocations</h2>
						<p>
							gRPC location sync is coverage-only. Return supported UN/LOCODE
							values so Gloria knows where your source can be searched. It does
							not contain branch address, desk, phone, email, or opening-hour
							detail.
						</p>
					</div>
					<FieldTable
						rows={[
							[
								"locations[].unlocode",
								"Yes",
								"2-letter country code + 3-character location code, e.g. AEDXB or GBLON.",
							],
							[
								"locations[].name",
								"Recommended",
								"Display name used in verification and admin review.",
							],
						]}
					/>
					<CodeBlock title="GetLocations response">
						{`{
  "locations": [
    { "unlocode": "AEDXB", "name": "Dubai" },
    { "unlocode": "GBLON", "name": "London" }
  ]
}`}
					</CodeBlock>
					<div className="source-api-note">
						For full branch records use the manual branch form, branch upload,
						or HTTP/XML location list endpoint.
					</div>
				</section>

				<section id="availability" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Pricing / availability</span>
						<h2>GetAvailability</h2>
						<p>
							This is called when Gloria routes an agent search to your gRPC
							endpoint. Gloria transforms search criteria into
							<code> AvailabilityRequest</code> and normalizes your returned
							vehicles into stored offers.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div>
							<h3>Request fields</h3>
							<FieldTable
								rows={[
									[
										"agreement_ref",
										"Yes",
										"Agreement reference. Use this to select rates, rules, and eligibility.",
									],
									["pickup_unlocode", "Yes", "Pickup UN/LOCODE."],
									["dropoff_unlocode", "Yes", "Return/dropoff UN/LOCODE."],
									["pickup_iso", "Yes", "Pickup date/time in ISO-8601."],
									["dropoff_iso", "Yes", "Dropoff date/time in ISO-8601."],
									[
										"driver_age",
										"Recommended",
										"Driver age. Defaults to 0 if not supplied to adapter.",
									],
									[
										"residency_country",
										"Recommended",
										"ISO-3166 alpha-2 country code.",
									],
									[
										"vehicle_classes",
										"Optional",
										"Filter list for ACRISS/vehicle classes.",
									],
								]}
							/>
						</div>
						<div>
							<h3>Response fields</h3>
							<FieldTable
								rows={[
									[
										"supplier_offer_ref",
										"Strongly recommended",
										"Stable offer reference used for booking. Gloria generates GEN-* if missing.",
									],
									[
										"vehicle_class",
										"Recommended",
										"Class/code such as ECMN, CCAR, CDMR.",
									],
									[
										"make_model",
										"Recommended",
										"Customer-facing vehicle name.",
									],
									[
										"currency",
										"Yes",
										"ISO-4217 currency such as EUR, USD, GBP.",
									],
									["total_price", "Yes", "Total rental price."],
									[
										"availability_status",
										"Yes",
										"AVAILABLE, ON_REQUEST, or SOLD_OUT.",
									],
									[
										"picture_url / ota_vehicle_json",
										"Optional",
										"Rich fields for images, terms, charges, extras, and parsed OTA details.",
									],
								]}
							/>
						</div>
					</div>
					<CodeBlock title="GetAvailability request">
						{`{
  "agreement_ref": "AGR-2026-00042",
  "pickup_unlocode": "AEDXB",
  "dropoff_unlocode": "AEDXB",
  "pickup_iso": "2026-05-23T09:00:00Z",
  "dropoff_iso": "2026-05-27T11:00:00Z",
  "driver_age": 30,
  "residency_country": "FR",
  "vehicle_classes": ["CCAR", "ECAR"]
}`}
					</CodeBlock>
					<CodeBlock title="GetAvailability response with rich fields">
						{`{
  "vehicles": [
    {
      "supplier_offer_ref": "CCAR12345629-04-26",
      "vehicle_class": "CCAR",
      "make_model": "Skoda Fabia or similar",
      "currency": "EUR",
      "total_price": 150,
      "availability_status": "AVAILABLE",
      "picture_url": "https://supplier.example/images/skoda-fabia.png",
      "door_count": "4",
      "baggage": "2",
      "vehicle_category": "CCAR",
      "veh_id": "CCAR12345629-04-26",
      "ota_vehicle_json": "{\"veh_terms_included\":[{\"Code\":\"CDW\",\"ItemDescription\":\"Collision damage waiver\"}],\"priced_equips\":[{\"Code\":\"GPS\",\"Price\":\"25.00\"}]}"
    }
  ]
}`}
					</CodeBlock>
				</section>

				<section id="http-location" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Endpoint import</span>
						<h2>HTTP/XML location list endpoint</h2>
						<p>
							Use this when your supplier system can return detailed branch
							rows. Gloria fetches the configured URL, parses the XML/JSON/PHP
							structure, normalizes it to the manual branch schema, and creates
							or updates branch records plus location coverage.
						</p>
					</div>
					<div className="source-doc-three-col">
						<ApiCard eyebrow="Best for" title="Full import">
							<p>Creates/updates branches, not only coverage.</p>
						</ApiCard>
						<ApiCard eyebrow="Payload" title="GLORIA_locationlistrs">
							<p>
								Use CountryList, CountryCode, VehMatchedLocs, and LocationDetail
								rows.
							</p>
						</ApiCard>
						<ApiCard eyebrow="Mapping" title="Manual schema">
							<p>
								BranchCode, name, address, city, countryCode, natoLocode,
								contact, coordinates, hours.
							</p>
						</ApiCard>
					</div>
					<CodeBlock title="GLORIA_locationlistrs response">
						{`<GLORIA_locationlistrs TimeStamp="2026-06-01T10:00:00" Target="Production" Version="1.00">
  <Success />
  <CountryList>
    <Country>United Arab Emirates</Country>
    <CountryCode>AE</CountryCode>
    <VehMatchedLocs>
      <VehMatchedLoc>
        <LocationDetail Code="DXB01" Name="Dubai Desk" LocationCode="AEDXB"
          Latitude="25.2532" Longitude="55.3657" AtAirport="true" LocationType="Airport">
          <Address>
            <AddressLine>Dubai International Airport Terminal 1</AddressLine>
            <CityName>Dubai</CityName>
            <PostalCode>00000</PostalCode>
            <CountryName Code="AE">United Arab Emirates</CountryName>
          </Address>
          <Telephone PhoneNumber="+971 4 123 4567" />
          <Email>dubai@example-supplier.com</Email>
          <PickupInstructions>Meet at arrivals desk.</PickupInstructions>
        </LocationDetail>
      </VehMatchedLoc>
    </VehMatchedLocs>
  </CountryList>
</GLORIA_locationlistrs>`}
					</CodeBlock>
				</section>

				<section id="http-pricing" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Pricing endpoint</span>
						<h2>HTTP availability: Gloria XML and Gloria JSON</h2>
						<p>
							The Pricing tab can test HTTP endpoints without gRPC. XML mode
							sends a <code>GLORIA_availabilityrq</code> body. Your endpoint may
							respond as <code>OTA_VehAvailRateRS</code>,{" "}
							<code>GLORIA_availabilityrs</code>, equivalent JSON, or PHP
							var_dump text containing those trees.
						</p>
					</div>
					<div className="source-doc-two-col">
						<ApiCard eyebrow="XML request" title="Gloria sends">
							<ul>
								<li>
									<code>Content-Type: text/xml</code>
								</li>
								<li>
									<code>ACC.Source.AccountID</code> from requestor/account ID
								</li>
								<li>
									<code>VehAvailbody.Vehmain</code> with branch codes and dates
								</li>
							</ul>
						</ApiCard>
						<ApiCard eyebrow="JSON request" title="Gloria sends">
							<ul>
								<li>
									<code>Content-Type: application/json</code>
								</li>
								<li>
									Fields match gRPC <code>AvailabilityRequest</code>
								</li>
								<li>
									Response expects <code>vehicles</code> or <code>offers</code>
								</li>
							</ul>
						</ApiCard>
					</div>
					<CodeBlock title="GLORIA_availabilityrq request">
						{`<GLORIA_availabilityrq TimeStamp="2026-05-15T10:30:45" Target="Production" Version="1.00">
  <ACC>
    <Source><AccountID ID="Gloria002" /></Source>
  </ACC>
  <VehAvailbody>
    <Vehmain PickUpDateTime="2026-05-23T09:00:00Z" ReturnDateTime="2026-05-27T11:00:00Z">
      <collectionbranch LocationCode="TIAA02" />
      <returnbranch LocationCode="TIAA02" />
    </Vehmain>
    <DriverAge Age="30" />
    <DriverCitizenCountry Code="FR" />
  </VehAvailbody>
</GLORIA_availabilityrq>`}
					</CodeBlock>
					<CodeBlock title="Accepted GLORIA_availabilityrs response">
						{`<GLORIA_availabilityrs TimeStamp="2026-05-15T10:30:46" Target="Production" Version="1.00">
  <Success />
  <VehAvairsdetails>
    <availcars ACRISS="CCAR">
      <vehdetails Make="SKODA" Model="FABIA" Transmission="Automatic" Doors="4" Seats="5" ImageURL="https://supplier.example/fabia.png" />
      <pricing CarOrderID="CCAR12345629-04-26" Currency="EUR" DailyGross="30.00" TotalGross="150.00" />
      <includedinprice>
        <Item Code="CDW" ItemDescription="Collision damage waiver" Excess="1200.00" Deposit="1200.00" />
      </includedinprice>
      <notincludedinprice>
        <Item Code="FP" ItemDescription="Fuel policy upgrade" Price="35.00" />
      </notincludedinprice>
      <OptionalExtras>
        <Item Code="GPS" ItemDescription="GPS" Price="25.00" />
      </OptionalExtras>
    </availcars>
  </VehAvairsdetails>
</GLORIA_availabilityrs>`}
					</CodeBlock>
					<CodeBlock title="Gloria JSON request/response">
						{`// Request body posted by Gloria JSON mode
{
  "agreement_ref": "Gloria002",
  "pickup_unlocode": "TIAA02",
  "dropoff_unlocode": "TIAA02",
  "pickup_iso": "2026-05-23T09:00:00Z",
  "dropoff_iso": "2026-05-27T11:00:00Z",
  "driver_age": 30,
  "residency_country": "FR"
}

// Response body expected from supplier
{
  "vehicles": [
    {
      "supplier_offer_ref": "CCAR12345629-04-26",
      "vehicle_class": "CCAR",
      "make_model": "Skoda Fabia",
      "currency": "EUR",
      "total_price": 150,
      "availability_status": "AVAILABLE",
      "picture_url": "https://supplier.example/fabia.png",
      "priced_equips": [{ "Code": "GPS", "Price": "25.00" }]
    }
  ]
}`}
					</CodeBlock>
				</section>

				<section id="bookings" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Reservations / cancellations</span>
						<h2>Booking methods</h2>
						<p>
							Booking operations are gRPC methods in the SourceProviderService.
							Gloria validates the required identifiers before calling your
							source.
						</p>
					</div>
					<div className="source-doc-two-col">
						<div>
							<h3>CreateBooking request</h3>
							<FieldTable
								rows={[
									[
										"agreement_ref",
										"Yes",
										"Agreement under which the agent is booking.",
									],
									[
										"supplier_offer_ref",
										"Yes",
										"Offer reference returned by availability.",
									],
									[
										"agent_booking_ref",
										"Optional",
										"Agent-side reference when available.",
									],
									[
										"idempotency_key",
										"Yes",
										"Use this to prevent duplicate bookings.",
									],
								]}
							/>
						</div>
						<div>
							<h3>BookingRef request</h3>
							<FieldTable
								rows={[
									[
										"agreement_ref",
										"Yes",
										"Required on ModifyBooking, CancelBooking, and CheckBooking.",
									],
									[
										"supplier_booking_ref",
										"Yes",
										"Your booking reference from CreateBooking.",
									],
									[
										"status",
										"Response",
										"REQUESTED, CONFIRMED, CANCELLED, FAILED, or your mapped status.",
									],
								]}
							/>
						</div>
					</div>
					<CodeBlock title="CreateBooking request and response">
						{`{
  "agreement_ref": "AGR-2026-00042",
  "supplier_offer_ref": "CCAR12345629-04-26",
  "agent_booking_ref": "AGT-BOOK-10001",
  "idempotency_key": "2f72d34a-314a-49cd-9183-8471f6ac1be1"
}

{
  "supplier_booking_ref": "SUP-BKG-987654",
  "status": "CONFIRMED"
}`}
					</CodeBlock>
				</section>

				<section id="formats" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Validation rules</span>
						<h2>Data format requirements</h2>
					</div>
					<div className="source-doc-three-col">
						<ApiCard eyebrow="Location" title="UN/LOCODE">
							<ul>
								<li>Format: country + location code.</li>
								<li>
									Examples: <code>AEDXB</code>, <code>GBLON</code>,{" "}
									<code>USNYC</code>.
								</li>
								<li>Used for coverage and search routing.</li>
							</ul>
						</ApiCard>
						<ApiCard eyebrow="Time" title="ISO-8601">
							<ul>
								<li>
									Use UTC <code>Z</code> or an explicit offset.
								</li>
								<li>
									Example: <code>2026-05-23T09:00:00Z</code>.
								</li>
								<li>Preserve pickup/dropoff local intent.</li>
							</ul>
						</ApiCard>
						<ApiCard eyebrow="Codes" title="Vehicles & money">
							<ul>
								<li>Currency: ISO-4217 like EUR, USD, GBP.</li>
								<li>Vehicle: ACRISS/OTA-style class codes.</li>
								<li>Country: ISO-3166 alpha-2.</li>
							</ul>
						</ApiCard>
					</div>
				</section>

				<section id="errors-performance" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Operations</span>
						<h2>Error handling and health impact</h2>
						<p>
							Source errors and slow responses are visible in Health and may
							temporarily exclude a source from live availability traffic.
						</p>
					</div>
					<div className="source-doc-two-col">
						<ApiCard eyebrow="gRPC status" title="Recommended errors">
							<ul>
								<li>
									<code>INVALID_ARGUMENT</code> for malformed dates, locations,
									or missing identifiers.
								</li>
								<li>
									<code>NOT_FOUND</code> for missing bookings.
								</li>
								<li>
									<code>UNAVAILABLE</code> for temporary supplier downtime.
								</li>
								<li>
									<code>INTERNAL</code> for unexpected failures.
								</li>
							</ul>
						</ApiCard>
						<ApiCard eyebrow="Monitoring" title="Health rules">
							<ul>
								<li>Target response time: under 3 seconds.</li>
								<li>Failed and slow calls count as unhealthy samples.</li>
								<li>Three active strikes can trigger backoff.</li>
								<li>Backoff schedule: 15m, 30m, 60m, 2h, 4h.</li>
							</ul>
						</ApiCard>
					</div>
				</section>

				<section id="implementation" className="source-doc-section">
					<div className="source-doc-section-heading">
						<span>Starter implementation</span>
						<h2>Node.js gRPC supplier skeleton</h2>
						<p>
							Use this as a shape reference only. Production suppliers should
							add authentication, observability, retries, and their own
							inventory/booking integrations.
						</p>
					</div>
					<CodeBlock title="Node.js / TypeScript gRPC server">
						{`import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

const packageDefinition = protoLoader.loadSync('source_provider.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const proto = grpc.loadPackageDefinition(packageDefinition) as any
const server = new grpc.Server()

server.addService(proto.source_provider.SourceProviderService.service, {
  GetHealth: (_call: any, callback: any) => {
    callback(null, { ok: true, note: 'healthy' })
  },

  GetLocations: (_call: any, callback: any) => {
    callback(null, {
      locations: [
        { unlocode: 'AEDXB', name: 'Dubai' },
        { unlocode: 'GBLON', name: 'London' },
      ],
    })
  },

  GetAvailability: (call: any, callback: any) => {
    const request = call.request
    if (!request.agreement_ref) {
      return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'agreement_ref is required' })
    }

    callback(null, {
      vehicles: [{
        supplier_offer_ref: 'CCAR12345629-04-26',
        vehicle_class: 'CCAR',
        make_model: 'Skoda Fabia or similar',
        currency: 'EUR',
        total_price: 150,
        availability_status: 'AVAILABLE',
        picture_url: 'https://supplier.example/fabia.png',
      }],
    })
  },

  CreateBooking: (call: any, callback: any) => {
    const request = call.request
    if (!request.agreement_ref || !request.supplier_offer_ref || !request.idempotency_key) {
      return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'missing booking identifier' })
    }
    callback(null, { supplier_booking_ref: 'SUP-BKG-987654', status: 'CONFIRMED' })
  },

  ModifyBooking: (call: any, callback: any) => callback(null, { supplier_booking_ref: call.request.supplier_booking_ref, status: 'CONFIRMED' }),
  CancelBooking: (call: any, callback: any) => callback(null, { supplier_booking_ref: call.request.supplier_booking_ref, status: 'CANCELLED' }),
  CheckBooking: (call: any, callback: any) => callback(null, { supplier_booking_ref: call.request.supplier_booking_ref, status: 'CONFIRMED' }),
})

server.bindAsync('0.0.0.0:51061', grpc.ServerCredentials.createInsecure(), (error) => {
  if (error) throw error
  server.start()
})`}
					</CodeBlock>
					<div className="source-doc-checklist source-api-next-steps">
						{[
							"Download and implement source_provider.proto.",
							"Set the gRPC or HTTP endpoint in Source → Pricing / Verification.",
							"Import branch details through Location & Branches.",
							"Run Verification and confirm Health remains healthy.",
						].map((step) => (
							<div key={step}>
								<span>✓</span>
								{step}
							</div>
						))}
					</div>
				</section>
			</article>
		</div>
	);
};

export default SourceApiReference;
