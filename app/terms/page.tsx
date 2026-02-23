export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Vilkår for bruk</h1>
        <p className="text-sm text-gray-900 mb-8">Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}</p>

        <div className="space-y-8 text-gray-900">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aksept av vilkår</h2>
            <p className="mb-4">
              Ved å opprette en konto og bruke Flyt ("Tjenesten"), aksepterer du å være bundet av disse vilkårene.
              Hvis du ikke aksepterer disse vilkårene, kan du ikke bruke tjenesten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Beskrivelse av tjenesten</h2>
            <p className="mb-4">
              Flyt er en applikasjon for koordinering av barnehage-henting og levering mellom familiemedlemmer.
              Tjenesten inkluderer:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Ukesplan for hente- og leveringsturer</li>
              <li>Notater og påminnelser per dag</li>
              <li>Utstyrsstatus tracking</li>
              <li>Push-varslinger</li>
              <li>Multi-hushold støtte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Brukerkonto</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.1 Registrering</h3>
                <p>
                  Du må opprette en konto for å bruke tjenesten. Du må oppgi nøyaktig og fullstendig informasjon.
                  Du er ansvarlig for å holde kontoinformasjonen din konfidensiell.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.2 Aldersbegrensning</h3>
                <p>
                  Du må være minst 18 år gammel for å opprette en konto. Tjenesten er designet for voksne
                  som koordinerer barnehage-aktiviteter.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3.3 Kontosikkerhet</h3>
                <p>
                  Du er ansvarlig for all aktivitet som skjer under din konto. Varsle oss umiddelbart hvis du
                  mistenker uautorisert bruk av kontoen din.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Akseptabel bruk</h2>
            <p className="mb-4">Du samtykker i å IKKE:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Bruke tjenesten til ulovlige formål</li>
              <li>Forsøke å få uautorisert tilgang til systemene våre</li>
              <li>Dele innhold som er hatefullt, truende eller krenkende</li>
              <li>Spre malware eller skadelig kode</li>
              <li>Misbruke eller trakassere andre brukere</li>
              <li>Bruke tjenesten til kommersielle formål uten tillatelse</li>
              <li>Reverse-engineere eller kopiere tjenesten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Brukerinnhold</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5.1 Eierskap</h3>
                <p>
                  Du beholder eierskap til alt innhold du legger inn i tjenesten (notater, planer, etc.).
                  Ved å legge inn innhold, gir du oss en begrenset lisens til å lagre og vise dette innholdet
                  som nødvendig for å levere tjenesten.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5.2 Deling innad i hushold</h3>
                <p>
                  Innhold du legger inn vil være synlig for andre medlemmer i din husholdning.
                  Du er ansvarlig for å ikke dele sensitiv eller konfidensiell informasjon som ikke er
                  passende for deling med husholdsmedlemmer.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5.3 Backup</h3>
                <p>
                  Selv om vi tar backup av data, anbefaler vi at du tar egne sikkerhetskopier av viktig informasjon.
                  Vi er ikke ansvarlige for tap av data.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Premium-tjenester</h2>
            <p className="mb-4">
              Premium-funksjoner kan bli tilgjengelige i fremtiden. For premium-abonnement gjelder følgende:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Abonnement fornyes automatisk med mindre du avbryter</li>
              <li>Du kan avbryte når som helst via innstillinger</li>
              <li>Refusjon gis ikke for ubrukt tid ved avbryting</li>
              <li>Priser kan endres med 30 dagers varsel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Immaterielle rettigheter</h2>
            <p>
              All kode, design, logoer, og annet materiale i tjenesten er beskyttet av opphavsrett og tilhører Flyt.
              Du får en begrenset, ikke-eksklusiv, ikke-overførbar lisens til å bruke tjenesten for personlig bruk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Ansvarsfraskrivelse</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800">
                <strong>VIKTIG:</strong> Tjenesten leveres "som den er" uten garantier av noe slag.
              </p>
            </div>
            <p className="mb-4">
              Vi garanterer ikke at tjenesten vil være feilfri, sikker, eller alltid tilgjengelig.
              Bruk av tjenesten er på egen risiko.
            </p>
            <p>
              Vi er ikke ansvarlige for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Tap av data eller innhold</li>
              <li>Misforståelser eller konflikter som oppstår fra bruk av tjenesten</li>
              <li>Direkte eller indirekte skader som følge av bruk eller manglende evne til å bruke tjenesten</li>
              <li>Forsinkelser eller feil i varsler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Ansvarsbegrensning</h2>
            <p>
              I den utstrekning loven tillater det, er vårt totale ansvar begrenset til beløpet du har betalt
              for tjenesten de siste 12 månedene (eller 100 NOK for gratis brukere).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Oppsigelse</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">10.1 Din rett til å avslutte</h3>
                <p>
                  Du kan når som helst avslutte din konto via innstillinger i appen.
                  Ved sletting av konto vil all din data bli permanent fjernet innen 30 dager.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">10.2 Vår rett til å avslutte</h3>
                <p>
                  Vi forbeholder oss retten til å suspendere eller avslutte din tilgang til tjenesten hvis du
                  bryter disse vilkårene, uten varsel eller refusjon.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Endringer i vilkår</h2>
            <p>
              Vi kan oppdatere disse vilkårene fra tid til annen. Ved vesentlige endringer vil vi varsle deg
              via e-post eller i appen. Fortsatt bruk av tjenesten etter endringer utgjør aksept av de nye vilkårene.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Gjeldende lov og jurisdiksjon</h2>
            <p>
              Disse vilkårene skal tolkes i henhold til norsk lov. Eventuelle tvister skal løses i norske domstoler.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Kontakt</h2>
            <p className="mb-4">
              Hvis du har spørsmål om disse vilkårene, kontakt oss:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Flyt</p>
              <p>E-post: support@flytfamilie.no</p>
              <p>Web: <a href="https://flytfamilie.no" className="text-blue-600 hover:underline">www.flytfamilie.no</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Diverse bestemmelser</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>
                <strong>Hele avtalen:</strong> Disse vilkårene utgjør hele avtalen mellom deg og Flyt.
              </li>
              <li>
                <strong>Delelighet:</strong> Hvis noen del av vilkårene blir ugyldig, fortsetter resten å gjelde.
              </li>
              <li>
                <strong>Ingen fraskrivelse:</strong> Vår manglende håndheving av noen rettighet fraskriver ikke den rettigheten.
              </li>
              <li>
                <strong>Tildeling:</strong> Du kan ikke overføre disse vilkårene til andre. Vi kan overføre våre rettigheter og plikter.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-900 text-center">
            Ved å bruke Flyt aksepterer du disse vilkårene og vår{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              personvernerklæring
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
