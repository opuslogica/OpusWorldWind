define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/projections/GeographicProjection',
    'WebWorldWind/util/WWMath'
], function (OpusWorldWind, WorldWind, Vec3, GeographicProjection, WWMath) {
    var ProjectionProj4 = function (proj, projectionLimits) {
        projectionLimits = projectionLimits || null;

        GeographicProjection.call(this, 'Proj4', true, projectionLimits);

        if (!proj4)
        {
            throw new Error('proj4 library is not available');
        }

        this.proj = proj4(proj4.defs.WGS84, proj);
    };

    ProjectionProj4.prototype = Object.create(GeographicProjection.prototype);

    ProjectionProj4.prototype.geographicToCartesian = function (globe, latitude, longitude, elevation, offset, result) {
        if (this.projectionLimits)
        {
            if (latitude > this.projectionLimits.maxLatitude)
            {
                latitude = this.projectionLimits.maxLatitude;
            }
            if (latitude < this.projectionLimits.minLatitude)
            {
                latitude = this.projectionLimits.minLatitude;
            }
            if (longitude > this.projectionLimits.maxLongitude)
            {
                longitude = this.projectionLimits.maxLongitude;
            }
            if (longitude < this.projectionLimits.minLongitude)
            {
                longitude = this.projectionLimits.minLongitude;
            }
        }

        var r = this.proj.forward([
            longitude,
            latitude
        ]);
        result[0] = r[0] + (offset ? offset[0] : 0);
        result[1] = r[1];
        result[2] = elevation;

        return result;
    };

    ProjectionProj4.prototype.geographicToCartesianGrid = function (globe, sector, numLat, numLon, elevations, referencePoint, offset, result) {
        var deltaLat = (sector.maxLatitude - sector.minLatitude) / (numLat > 1 ? numLat - 1 : 1);
        var deltaLon = (sector.maxLongitude - sector.minLongitude) / (numLon > 1 ? numLon - 1 : 1);
        var lon = sector.minLongitude;
        var lat = sector.minLatitude;
        var p = [0, 0];
        var refCenter = referencePoint ? referencePoint : new WorldWind.Vec3(0, 0, 0);
        var offsetX = offset ? offset[0] : 0;
        var resultIndex = 0;
        var elevationIndex = 0;
        var minLatLimit = this.projectionLimits.minLatitude;
        var maxLatLimit = this.projectionLimits.maxLatitude;
        var minLonLimit = this.projectionLimits.minLongitude;
        var maxLonLimit = this.projectionLimits.maxLongitude;
        for (var latIndex = 0; latIndex !== numLat; ++latIndex)
        {
            for (var lonIndex = 0; lonIndex !== numLon; ++lonIndex)
            {
                p[0] = WWMath.clamp(lon, minLonLimit, maxLonLimit);
                p[1] = WWMath.clamp(lat, minLatLimit, maxLatLimit);
                var r = this.proj.forward(p);
                result[resultIndex++] = r[0] - refCenter[0] + offsetX;
                result[resultIndex++] = r[1] - refCenter[1];
                result[resultIndex++] = elevations[elevationIndex++] - refCenter[2];
                lon += deltaLon;
            }
            lon = sector.minLongitude;
            lat += deltaLat;
        }
        return result;
    };

    ProjectionProj4.prototype.cartesianToGeographic = function (globe, x, y, z, offset, result) {
        var r = this.proj.inverse([
            x - (offset ? offset[0] : 0),
            y
        ]);
        result.longitude = r[0];
        result.latitude = r[1];
        result.altitude = z;
        return result;
    };

    return ProjectionProj4;
});
