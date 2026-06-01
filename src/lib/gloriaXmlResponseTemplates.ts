export type XmlLineItem = {
	code: string;
	description: string;
	excess?: string;
	deposit?: string;
	price?: string;
};

export type GloriaXmlResponseForm = {
	timestamp: string;
	target: string;
	version: string;
	acriss: string;
	make: string;
	model: string;
	transmission: string;
	doors: string;
	seats: string;
	imageUrl: string;
	carOrderId: string;
	currency: string;
	dailyGross: string;
	totalGross: string;
	vehId: string;
	status: string;
	included: XmlLineItem[];
	notIncluded: XmlLineItem[];
	extras: XmlLineItem[];
};

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function attr(name: string, value: string): string {
	if (!value.trim()) return "";
	return ` ${name}="${escapeXml(value.trim())}"`;
}

export function defaultGloriaXmlResponseForm(): GloriaXmlResponseForm {
	const ts = new Date().toISOString().slice(0, 19);
	return {
		timestamp: ts,
		target: "Production",
		version: "1.00",
		acriss: "CDAR",
		make: "TOYOTA",
		model: "COROLLA",
		transmission: "Automatic",
		doors: "5",
		seats: "5",
		imageUrl: "https://example.com/vehicles/corolla.png",
		carOrderId: "CDAR65505909190226",
		currency: "EUR",
		dailyGross: "33.00",
		totalGross: "132.00",
		vehId: "CDAR65505909190226",
		status: "Available",
		included: [
			{
				code: "CDW",
				description: "Collision damage waiver",
				excess: "900.00",
				deposit: "900.00",
			},
		],
		notIncluded: [
			{
				code: "PCDW",
				description: "Premium insurance (PCDW)",
				price: "60.00",
			},
		],
		extras: [{ code: "GPS", description: "GPS navigation", price: "32.00" }],
	};
}

export function buildGloriaAvailabilityRsXml(form: GloriaXmlResponseForm): string {
	const includedXml = form.included
		.filter((row) => row.code.trim() || row.description.trim())
		.map(
			(row) =>
				`        <Item Code="${escapeXml(row.code || "ITEM")}" ItemDescription="${escapeXml(row.description || row.code)}"${attr("Excess", row.excess ?? "")}${attr("Deposit", row.deposit ?? "")} />`,
		)
		.join("\n");

	const notIncludedXml = form.notIncluded
		.filter((row) => row.code.trim() || row.description.trim())
		.map(
			(row) =>
				`        <Item Code="${escapeXml(row.code || "ITEM")}" ItemDescription="${escapeXml(row.description || row.code)}"${attr("Price", row.price ?? "")} />`,
		)
		.join("\n");

	const extrasXml = form.extras
		.filter((row) => row.code.trim() || row.description.trim())
		.map(
			(row) =>
				`        <Item Code="${escapeXml(row.code || "EXTRA")}" ItemDescription="${escapeXml(row.description || row.code)}"${attr("Price", row.price ?? "")} />`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<GLORIA_availabilityrs TimeStamp="${escapeXml(form.timestamp)}" Target="${escapeXml(form.target)}" Version="${escapeXml(form.version)}">
  <Success />
  <VehAvairsdetails>
    <availcars ACRISS="${escapeXml(form.acriss || "CDAR")}">
      <vehdetails Make="${escapeXml(form.make)}" Model="${escapeXml(form.model)}" Transmission="${escapeXml(form.transmission)}" Doors="${escapeXml(form.doors)}" Seats="${escapeXml(form.seats)}"${attr("ImageURL", form.imageUrl)} />
      <pricing CarOrderID="${escapeXml(form.carOrderId || form.vehId)}" Currency="${escapeXml(form.currency || "EUR")}"${attr("DailyGross", form.dailyGross)} TotalGross="${escapeXml(form.totalGross || "0.00")}" />
${includedXml ? `      <includedinprice>\n${includedXml}\n      </includedinprice>` : ""}
${notIncludedXml ? `      <notincludedinprice>\n${notIncludedXml}\n      </notincludedinprice>` : ""}
${extrasXml ? `      <OptionalExtras>\n${extrasXml}\n      </OptionalExtras>` : ""}
    </availcars>
  </VehAvairsdetails>
</GLORIA_availabilityrs>`;
}

export function buildOtaVehAvailRateRsXml(form: GloriaXmlResponseForm): string {
	const makeModel = `${form.make} ${form.model}`.trim() || "Vehicle";

	const includedXml = form.included
		.filter((row) => row.code.trim())
		.map(
			(row) =>
				`          <Included code="${escapeXml(row.code)}" price="0.00"${attr("excess", row.excess ?? "")}${attr("deposit", row.deposit ?? "")} />`,
		)
		.join("\n");

	const notIncludedXml = form.notIncluded
		.filter((row) => row.code.trim())
		.map(
			(row) =>
				`          <NotIncluded code="${escapeXml(row.code)}"${attr("price", row.price ?? "0.00")} excess="0.00" deposit="0.00" />`,
		)
		.join("\n");

	const extrasXml = form.extras
		.filter((row) => row.code.trim())
		.map(
			(row) =>
				`        <PricedEquip><Equipment Description="${escapeXml(row.description || row.code)}" vendorEquipID="${escapeXml(row.code)}" /><Charge Amount="${escapeXml(row.price ?? "0.00")}" /></PricedEquip>`,
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_VehAvailRateRS>
  <Success />
  <VehAvailRSCore />
  <VehVendorAvails>
    <VehVendorAvail>
      <VehAvails>
        <VehAvail>
          <VehAvailCore Status="${escapeXml(form.status || "Available")}" VehID="${escapeXml(form.vehId || form.carOrderId)}">
            <Vehicle AirConditionInd="Yes" TransmissionType="${escapeXml(form.transmission)}">
              <VehMakeModel Name="${escapeXml(makeModel)}"${attr("PictureURL", form.imageUrl)} />
              <VehType VehicleCategory="${escapeXml(form.acriss)}" DoorCount="${escapeXml(form.doors)}" />
              <VehTerms>
${includedXml}
${notIncludedXml}
              </VehTerms>
            </Vehicle>
            <TotalCharge RateTotalAmount="${escapeXml(form.totalGross || "0.00")}" CurrencyCode="${escapeXml(form.currency || "EUR")}" />
${extrasXml ? `            <PricedEquips>\n${extrasXml}\n            </PricedEquips>` : ""}
          </VehAvailCore>
        </VehAvail>
      </VehAvails>
    </VehVendorAvail>
  </VehVendorAvails>
</OTA_VehAvailRateRS>`;
}
