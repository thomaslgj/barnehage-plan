export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Personvernerklæring</h1>
        <p className="text-sm text-gray-900 mb-8">Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}</p>

        <div className="space-y-8 text-gray-900">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduksjon</h2>
            <p className="mb-4">
              Velkommen til Flyt. Vi tar personvernet ditt på alvor og forplikter oss til å beskytte dine personopplysninger.
              Denne personvernerklæringen forklarer hvilke data vi samler inn, hvorfor vi samler dem, og dine rettigheter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Dataansvarlig</h2>
            <p className="mb-4">
              Dataansvarlig for behandlingen av dine personopplysninger er:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Flyt</p>
              {/* TODO: Legg til faktisk kontaktinformasjon */}
              <p>E-post: privacy@flyt.no</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hvilke data samler vi inn?</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.1 Kontoinformasjon</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>E-postadresse</li>
                  <li>Navn</li>
                  <li>Profilbilde/avatar</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.2 Husholdsdata</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Husholdsnavn</li>
                  <li>Medlemmer i husholdningen</li>
                  <li>Barnens navn</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.3 Brukerinnhold</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Hente- og leveringsplan</li>
                  <li>Daglige notater</li>
                  <li>Utstyrsstatus</li>
                  <li>Varslingsinnstillinger</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.4 Teknisk informasjon</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Enhetsinformasjon (type, OS-versjon)</li>
                  <li>App-versjon</li>
                  <li>Feilrapporter (crashes)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Hvorfor samler vi inn disse dataene?</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Primære formål (Nødvendig for tjenesten)</h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-blue-800">
                  <li>Koordinere barnehage-henting mellom familiemedlemmer</li>
                  <li>Sende varslinger om utstyr og påminnelser</li>
                  <li>Dele informasjon innad i husholdningen</li>
                  <li>Autentisere og sikre din konto</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Sekundære formål (Med ditt samtykke)</h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-green-800">
                  <li>Forbedre appen basert på bruksmønstre</li>
                  <li>Analysere funksjonalitet og ytelse</li>
                  <li>Utvikle nye funksjoner</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Retts grunnlag</h2>
            <p className="mb-4">
              Vi behandler dine personopplysninger basert på følgende rettslige grunnlag:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Avtale:</strong> For å levere tjenesten du har registrert deg for</li>
              <li><strong>Samtykke:</strong> For valgfrie funksjoner som analytics og markedsføring</li>
              <li><strong>Legitim interesse:</strong> For sikkerhet, feilretting og support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Deling av data</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Vi selger ALDRI dine personopplysninger til tredjeparter.</strong>
              </p>
            </div>
            <p className="mb-4">Vi deler data med:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Supabase (database):</strong> Lagring av alle appdata. Supabase er GDPR-compliant og servere er i EU.
              </li>
              <li>
                <strong>Dine husholdsmedlemmer:</strong> Data du legger inn deles med andre i samme hushold.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Hvor lenge lagrer vi data?</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Aktiv konto:</strong> Så lenge kontoen er aktiv</li>
              <li><strong>Etter sletting:</strong> 30 dager for recovery, deretter permanent slettet</li>
              <li><strong>Lovpålagt lagring:</strong> Noen data kan beholdes for juridiske formål (fakturering, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Dine rettigheter (GDPR)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📋 Rett til innsyn</h3>
                <p className="text-sm">Se all data vi har om deg</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📤 Rett til dataportabilitet</h3>
                <p className="text-sm">Eksporter data i maskinlesbart format</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">✏️ Rett til retting</h3>
                <p className="text-sm">Rette feil eller utdatert informasjon</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🗑️ Rett til sletting</h3>
                <p className="text-sm">Slette konto og all data permanent</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🚫 Rett til begrensning</h3>
                <p className="text-sm">Begrense behandling av dine data</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">⛔ Rett til innsigelse</h3>
                <p className="text-sm">Protestere mot behandling</p>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Hvordan utøve dine rettigheter:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-blue-800">
                <li><strong>I appen:</strong> Gå til Innstillinger → Personvern</li>
                <li><strong>Via e-post:</strong> Kontakt privacy@flyt.no</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Sikkerhet</h2>
            <p className="mb-4">Vi tar sikkerhet på alvor og implementerer:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Kryptering av data i transit (HTTPS/TLS)</li>
              <li>Kryptering av data ved lagring</li>
              <li>Autentisering med mulighet for biometrisk innlogging</li>
              <li>Row Level Security (RLS) i database</li>
              <li>Regelmessige sikkerhetsrevisjoner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Barn</h2>
            <p>
              Flyt er designet for voksne (18+) som koordinerer barnehage-henting. Vi samler ikke bevisst inn
              personopplysninger fra barn under 16 år uten foreldresamtykke.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Endringer i personvernerklæringen</h2>
            <p>
              Vi kan oppdatere denne personvernerklæringen. Ved vesentlige endringer vil du bli varslet via e-post
              eller i appen. Fortsatt bruk av tjenesten etter endringer utgjør aksept av den nye erklæringen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Kontakt og klager</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Kontakt oss:</h3>
                <p>E-post: privacy@flyt.no</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Klage til Datatilsynet:</h3>
                <p className="mb-2">
                  Hvis du mener vi ikke overholder personvernreglene, har du rett til å klage til:
                </p>
                <p className="font-medium">Datatilsynet</p>
                <p>Postboks 458 Sentrum, 0105 Oslo</p>
                <p>E-post: postkasse@datatilsynet.no</p>
                <p>Web: <a href="https://www.datatilsynet.no" className="text-blue-600 hover:underline">www.datatilsynet.no</a></p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-900 text-center">
            Denne personvernerklæringen er utformet i tråd med GDPR (General Data Protection Regulation)
            og norsk personvernlovgivning.
          </p>
        </div>
      </div>
    </div>
  );
}
