import { Meyer, queryEgon } from "./sparql/odrrp";
import { AddressRUIAN, queryRuianAddressPointURIs } from "./sparql/ruian";
import { WikiResponse, queryWikidata } from "./sparql/wikidata";
import { writeFileSync, statSync, readFileSync, existsSync } from "fs";

const join_responses = (a : any, map_from: string, b: any, map_to:string, as: string) => {
  return a.map((aa:any) => {
    const c = aa;
    c[as] = b.find((bb: any) => { return aa[map_from] === bb[map_to] });
    //delete c[map_from];
    if (c[as]) delete c[as][map_to];
    return c;
  });
}

const cache_or_query = async (cache: string, query: any, threshold : Date) => {
  if (existsSync(cache) && statSync(cache).mtime > threshold) {
    return JSON.parse(String(readFileSync(cache)));
  }

  const result = await query();
  const json = JSON.stringify(result);
  writeFileSync(cache, json);

  return result;
};

export const sparql_federated_with_cache = async () => {
  const lastFiveMinutes = new Date(new Date().setDate(new Date().getTime() - 5*60*1000));

  const wikiQuery = await cache_or_query("./.data/sparql-wiki-cache.json", queryWikidata, lastFiveMinutes) as unknown as [WikiResponse];
  const egonQuery = await cache_or_query("./.data/sparql-egon-cache.json", queryEgon, lastFiveMinutes) as unknown as [Meyer];
  const cuzkQuery = await cache_or_query("./.data/sparql-cuzk-cache.json", (async ()=> { 
    const SOFT_LIMIT_QUERY = 80; //INFO: Server bails out on bigger payloads -> chunk-up the work
    var promises = new Array<Promise<[AddressRUIAN]>>();
  
    const addressPoints = egonQuery.map((e:any) => { return e.addr });
    for (var i = 0; i < egonQuery.length/SOFT_LIMIT_QUERY; i++) {
      promises.push(
        queryRuianAddressPointURIs(
          addressPoints.slice(
            i * SOFT_LIMIT_QUERY, 
            i * SOFT_LIMIT_QUERY + SOFT_LIMIT_QUERY
          ) as [string]
        )
      );
    }
  
    const aquiredAddresses = (await Promise.all(promises) as any).flat() as [AddressRUIAN];
    return aquiredAddresses;
  }), lastFiveMinutes) as unknown as [AddressRUIAN];

  const merge_egon = join_responses(egonQuery, "addr", cuzkQuery, "addresniBod", "address");
  const merge_wiki = join_responses(merge_egon, "ico", wikiQuery, "ico", "wiki-extras");
  const sparql_merge = JSON.stringify(merge_wiki);

  writeFileSync("./.data/sparql-cache.json", sparql_merge);
  return merge_wiki;
}

sparql_federated_with_cache().then(res => console.log(res));