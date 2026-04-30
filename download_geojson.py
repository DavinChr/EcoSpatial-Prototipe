import urllib.request, json

query = """
[out:json];
area["name"="Kota Bandung"]->.searchArea;
(
  relation["admin_level"="6"](area.searchArea);
);
out geom;
"""

req = urllib.request.Request('https://overpass-api.de/api/interpreter', data=query.encode('utf-8'))
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        
    features = []
    for el in data['elements']:
        if el['type'] == 'relation':
            name = el.get('tags', {}).get('name', 'Unknown')
            # Extract name without "Kecamatan " if present
            if name.startswith('Kecamatan '):
                name = name.replace('Kecamatan ', '')
                
            coords = []
            for member in el.get('members', []):
                if member['type'] == 'way' and member['role'] == 'outer':
                    way_coords = [[node['lon'], node['lat']] for node in member.get('geometry', [])]
                    if way_coords:
                        coords.append(way_coords)
            if coords:
                # Basic MultiPolygon wrapping
                features.append({
                    'type': 'Feature',
                    'properties': {'KECAMATAN': name},
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': coords
                    }
                })
    
    geojson = {'type': 'FeatureCollection', 'features': features}
    with open('d:/KULIAH/Lomba/EcoSpatial/data/bandung.geojson', 'w') as f:
        json.dump(geojson, f)
    print('Successfully generated bandung.geojson from Overpass API! Features count:', len(features))
except Exception as e:
    print('Error:', e)
