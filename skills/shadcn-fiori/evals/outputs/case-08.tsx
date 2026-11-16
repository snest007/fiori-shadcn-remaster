import * as React from "react"
import { ComboBox, ComboBoxItem } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Title } from "@/components/ui/title"

// A predefined country dataset: UN member states plus the two observer states.
const COUNTRY_CODES = `AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI
CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR
GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG
LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO
OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY
TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW PS VA`.split(/\s+/)
const countryNames = new Intl.DisplayNames(["en"], { type: "region" })
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"))

export default function CountrySelectionPage() {
  const [value, setValue] = React.useState("")
  const [committed, setCommitted] = React.useState(false)
  const selected = COUNTRIES.find((country) => country.name.toLocaleLowerCase() === value.toLocaleLowerCase())
  const invalid = committed && value !== "" && !selected

  return (
    <main data-case="case-08" style={{ padding: "var(--sapContent_Space_M)", display: "grid", gap: "var(--sapContent_Space_S)", alignContent: "start" }}>
      <Title level="H1" size="H3">Choose a Country</Title>
      <p id="country-help">Type a country name to narrow {COUNTRIES.length} options, then choose one suggestion.</p>
      <div style={{ display: "grid", gap: "var(--fiori-table-cell-vertical-padding)", maxInlineSize: "calc(var(--sapContent_Space_M) * 12)" }}>
        <Label htmlFor="country-picker">Country</Label>
        <ComboBox id="country-picker" aria-describedby="country-help" value={value} filter="contains"
          onValueChange={(next) => { setValue(next); setCommitted(false) }} onCommit={() => setCommitted(true)}
          valueState={invalid ? "negative" : "none"} valueStateMessage="Choose a country from the available options."
          listLabel="Countries" arrowLabel="Show countries" dialogTitle="Choose a country">
          {COUNTRIES.map((country) => <ComboBoxItem key={country.code} text={country.name} additionalText={country.code} />)}
        </ComboBox>
      </div>
      <p role="status">{selected ? `Selected country: ${selected.name} (${selected.code})` : "No country selected."}</p>
    </main>
  )
}
