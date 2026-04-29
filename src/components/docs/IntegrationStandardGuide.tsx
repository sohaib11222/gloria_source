import React from 'react';

const IntegrationStandardGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1>Car Rental Integration Standard (Glora)</h1>
      <p style={{ color: '#6b7280' }}>
        As a source company, your XML/gRPC implementation can vary internally, but outbound Gloria contracts must remain standardized so all downstream agents consume one format.
      </p>

      <section>
        <h2>Core Components</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>List of Branches</li>
          <li>Price Request</li>
          <li>Booking Request</li>
          <li>Cancel Request / Reservation Status</li>
        </ul>
      </section>

      <section>
        <h2>Publisher Checklist</h2>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Provide stable branch/location codes and metadata.</li>
          <li>Map supplier-specific pricing response fields into Gloria offer schema.</li>
          <li>Accept booking payload aliases from OTA and Gloria JSON consistently.</li>
          <li>Return cancel/status responses with normalized status values.</li>
        </ul>
      </section>

      <section>
        <h2>Contract Mapping Example</h2>
        <pre className="code-block">{`OTA XML:
<ResNumber Number="RC60653555IW"/>

Gloria JSON:
{
  "supplier_booking_ref": "RC60653555IW",
  "agreement_ref": "AG-2026-490"
}

Gloria gRPC:
supplier_booking_ref = "RC60653555IW"
agreement_ref        = "AG-2026-490"`}</pre>
      </section>
    </div>
  );
};

export default IntegrationStandardGuide;
