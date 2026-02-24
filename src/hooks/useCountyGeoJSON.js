/**
 * Fetches US county GeoJSON keyed by 5-digit FIPS code.
 *
 * Source: Plotly's counties dataset (~3.8 MB, CORS-enabled).
 * Cached in module memory for the browser session — no localStorage needed
 * since the file is static and loads in ~1 second on a typical connection.
 *
 * NOAA alerts include `geocode.SAME` codes in the format PSSCCC where
 * P=part-of-county, SS=state FIPS, CCC=county FIPS.  Strip the leading
 * digit to get the standard 5-digit county FIPS: same.slice(1).
 */

import { useState, useEffect } from 'react';

const COUNTIES_URL =
  'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';

// Module-level session cache — fetched at most once per page load.
let cache   = null;
let pending = null;

function load() {
  if (cache)   return Promise.resolve(cache);
  if (pending) return pending;

  pending = fetch(COUNTIES_URL)
    .then(r => r.json())
    .then(data => {
      cache = {};
      (data.features ?? []).forEach(f => {
        if (f.id && f.geometry) cache[String(f.id)] = f.geometry;
      });
      pending = null;
      return cache;
    })
    .catch(() => {
      pending = null;
      return {};
    });

  return pending;
}

/**
 * Returns a { fipsCode: geometry } map for all US counties.
 * Starts empty and resolves to the full map within ~1 second.
 */
export function useCountyGeoJSON() {
  const [counties, setCounties] = useState(() => cache ?? {});

  useEffect(() => {
    if (cache) return; // already loaded this session
    load().then(map => setCounties(map));
  }, []);

  return counties;
}
