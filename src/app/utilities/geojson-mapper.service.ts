import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeojsonMapperService {

  private readonly EARTH_RADIUS: number = 6371009;

  constructor() { }

  stringToGeojson(coordinatesText: any) {
    const coordinates = [JSON.parse(coordinatesText).map((d: any) => [...d.split(',').reverse().map((e: any) => +e), 100])]
    return [
      {
          "type": "Feature",
          "geometry": {
              "type": "Polygon",
              coordinates
          },
          "properties": {}
      }
  ]
  }

  coordinateToString(coordinate: any) {
    return JSON.stringify(coordinate.flat().map((d: any) => `${d[1]},${d[0]}`))
  }


computeArea(path: any) {
  const coordinate = path.flat().map((d: any) => {
    return {latitude: d[1], longitude: d[0]}
  })
    return Math.abs(this.computeSignedArea(coordinate, this.EARTH_RADIUS));
}

computeSignedArea(path: any, radius: any) {
    const size = path.length;
    if (size < 3) {
        return 0;
    }
    let total = 0;
    let prev = path[size - 1];
    let prevTanLat = Math.tan((Math.PI / 2 - this.toRadians(prev.latitude)) / 2);
    let prevLng = this.toRadians(prev.longitude);

    for (const point of path) {
        const tanLat = Math.tan((Math.PI / 2 - this.toRadians(point.latitude)) / 2);
        const lng = this.toRadians(point.longitude);
        total += this.polarTriangleArea(tanLat, lng, prevTanLat, prevLng);
        prevTanLat = tanLat;
        prevLng = lng;
    }
    return total * (radius * radius);
}

polarTriangleArea(tan1: any, lng1: any, tan2: any, lng2: any) {
    const deltaLng = lng1 - lng2;
    const t = tan1 * tan2;
    return 2 * Math.atan2(t * Math.sin(deltaLng), 1 + t * Math.cos(deltaLng));
}

toRadians(degrees: any) {
    return (degrees * Math.PI) / 180;
}

}
