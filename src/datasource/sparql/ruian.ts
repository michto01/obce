/*
 * Extract data from RUIÁN via SPARQL
 *
 * Extracting information about particular address point via the
 * SPARQL interface.
 * 
 * @discussion: Extracted informations are: -- TODO --
 *
 * @endpoint: https://linked.cuzk.cz.opendata.cz/sparql
 */

import { SparqlJsonParser } from "sparqljson-parse";
import { SparqlNode, sparql_query, sparql_value } from "./@generic";

const ENDPOINT='https://linked.cuzk.cz.opendata.cz/sparql';

const QUERY = `
PREFIX s: <http://schema.org/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX ruian: <https://linked.cuzk.cz/ontology/ruian/>

SELECT ?addr ?adresniMistoKod ?lat ?lon ?cisloOrientacni ?cisloDomovni ?uliceNazev ?castObceNazev ?obecNazev
WHERE {
  VALUES ?addr { @ADRESNI_MISTO@ }
  
  ?addr skos:notation ?adresniMistoKod;
        geo:hasGeometry/s:geo ?gps .
  
  ?gps s:latitude ?lat ;
       s:longitude ?lon .
  
  OPTIONAL { ?addr ruian:čísloOrientační ?cisloOrientacni . }
  OPTIONAL { ?addr ruian:čísloDomovní ?cisloDomovni . }

  OPTIONAL { ?addr ruian:ulice/s:name ?uliceNazev . }
  
  ?addr ruian:stavebníObjekt/ruian:částObce ?castObce .
  
  ?castObce s:name ?castObceNazev ;
            ruian:obec/s:name ?obecNazev .

}
`

interface QueryRUAINResult {
    addr: SparqlNode;
    adresniMistoKod: SparqlNode;
    lat: SparqlNode;
    lon: SparqlNode;
    cisloOrientacni: SparqlNode;
    cisloDomovni: SparqlNode;
    uliceNazev: SparqlNode;
    castObceNazev: SparqlNode;
    obecNazev: SparqlNode;
}

export type AddressRUIAN = {
    addresniBod: string;
    kod: string;
    souradnice: [number, number];
    cisloOrientacni: number | null;
    cisloDomovni: number | null;
    ulice: string | null;
    castObce: string;
    obec: string;
}

const parseAddressPoint = (q : QueryRUAINResult) => {
    return {
        addresniBod: sparql_value(q.addr),
        kod: sparql_value(q.adresniMistoKod),
        souradnice: [Number(sparql_value(q.lat)), Number(sparql_value(q.lon))],
        cisloOrientacni: sparql_value(q.cisloOrientacni) != null ? Number(sparql_value(q.cisloOrientacni)) : null,
        cisloDomovni: sparql_value(q.cisloDomovni) != null ? Number(sparql_value(q.cisloDomovni)) : null,
        ulice: sparql_value(q.uliceNazev),
        castObce: sparql_value(q.castObceNazev),
        obec: sparql_value(q.obecNazev)
    }
};

/*! Get single Address from RUIAN using code
 * 
 */
export async function queryRuianAddressPoint(
    point: string
) : Promise<[AddressRUIAN]> {
    const query = QUERY.replace("@ADRESNI_MISTO@", `<https://linked.cuzk.cz/resource/ruian/adresni-misto/${point}>`);
    const sparql = await sparql_query(ENDPOINT, query, { limit: 10, offset: 0});
    const parser = new SparqlJsonParser();

    return parser.parseJsonResults(sparql.data).map(e => {
        const tc = e as unknown as QueryRUAINResult;
        if (tc == null) return;
        return parseAddressPoint(tc);
    }) as [AddressRUIAN];
}

/*! Get multiple Addresses from RUIAN at once.
 * 
 * @note The RUIAN SPARQL will reject queries with over ?80? addresses.
 *       The current query should be revised, otherwise use batch processing
 *       as shown in `./odrrp.ts`.
 */
export async function queryRuianAddressPointURIs(
    point_uris: [string]
) : Promise<[AddressRUIAN]> {
    const envelope = point_uris.map(e => `<${e}>`).join(' ');
    const query = QUERY.replace("@ADRESNI_MISTO@", `${envelope}`);
    const sparql = await sparql_query(ENDPOINT, query, { limit: 10000, offset: 0});
    const parser = new SparqlJsonParser();

    return parser.parseJsonResults(sparql.data).map(e => {
        const tc = e as unknown as QueryRUAINResult;
        if (tc == null) return;
        return parseAddressPoint(tc);
    }) as [AddressRUIAN];
}

/*
Example:
queryRuianAddressPoint('21511888').then((result) => {
    console.log(result);
});
*/
