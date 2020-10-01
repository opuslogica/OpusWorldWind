define([
    './overrides',
    './edittools/AbstractAirspacePathEditTool',
    './edittools/AbstractEditTool',
    './edittools/AbstractPathEditTool',
    './shapes/AbstractRigidMesh',
    './edittools/AbstractSurfacePathEditTool',
    './edittools/AbstractSurfaceShapeEditTool',
    './shapes/Box',
    './shapes/Cone',
    './editTools/CursorEditTool',
    './shapes/Cylinder',
    './edittools/EditToolClickRecognizer',
    './shapes/Ellipsoid',
    './edittools/ExtrudedPolygonEditTool',
    './misc/Intersection',
    './layers/LatLonIndicatorLayer',
    './misc/MercatorSurfaceImage',
    './layers/OpenStreetMapImageLayer',
    './programs/OutlineTextureProgram',
    './placemarks/PedestalPlacemark',
    './edittools/PlacemarkEditTool',
    './layers/PlaybackIndicatorLayer',
    './shapes/PointCloud',
    './shapes/PointCloudAttributes',
    './placemarks/PointPlacemark',
    './placemarks/PointPlacemarkAttributes',
    './edittools/PolylineEditTool',
    './misc/ProjectionProj4',
    './shapes/Pyramid',
    './edittools/RangeRingEditTool',
    './edittools/RigidMeshEditTool',
    './shapes/RigidWedgeMesh',
    './placemarks/ScreenShapePlacemark',
    './placemarks/ScreenShapePlacemarkAttributes',
    './misc/SectorModifier',
    './misc/SectorRenderable',
    './placemarks/SquarePlacemark',
    './shapes/SurfaceArc',
    './edittools/SurfaceCircleEditTool',
    './edittools/SurfaceEllipseEditTool',
    './edittools/SurfacePathEditTool',
    './edittools/SurfacePolygonEditTool',
    './edittools/SurfaceRectangleEditTool',
    './edittools/SurfaceSquareEditTool',
    './shapes/TextBox',
    './shapes/TriPath',
    './programs/TriPathProgram',
    './misc/ExtUtils',
    './placemarks/WcPlacemark',
    './shapes/Wedge',
    './layers/WmsLayer',
    './layers/WmsParamLayer'
], function(
    overrides,
    AbstractAirspacePathEditTool,
    AbstractEditTool,
    AbstractPathEditTool,
    AbstractRigidMesh,
    AbstractSurfacePathEditTool,
    AbstractSurfaceShapeEditTool,
    Box,
    Cone,
    CursorEditTool,
    Cylinder,
    EditToolClickRecognizer,
    Ellipsoid,
    ExtrudedPolygonEditTool,
    Intersection,
    LatLonIndicatorLayer,
    MercatorSurfaceImage,
    OpenStreetMapImageLayer,
    OutlineTextureProgram,
    PedestalPlacemark,
    PlacemarkEditTool,
    PlaybackIndicatorLayer,
    PointCloud,
    PointCloudAttributes,
    PointPlacemark,
    PointPlacemarkAttributes,
    PolylineEditTool,
    ProjectionProj4,
    Pyramid,
    RangeRingEditTool,
    RigidMeshEditTool,
    RigidWedgeMesh,
    ScreenShapePlacemark,
    ScreenShapePlacemarkAttributes,
    SectorModifier,
    SectorRenderable,
    SquarePlacemark,
    SurfaceArc,
    SurfaceCircleEditTool,
    SurfaceEllipseEditTool,
    SurfacePathEditTool,
    SurfacePolygonEditTool,
    SurfaceRectangleEditTool,
    SurfaceSquareEditTool,
    TextBox,
    TriPath,
    TriPathProgram,
    ExtUtils,
    WcPlacemark,
    Wedge,
    WmsLayer,
    WmsParamLayer
) {
    'use strict';
    var OpusWorldWind = {};
    OpusWorldWind.AbstractAirspacePathEditTool = AbstractAirspacePathEditTool;
    OpusWorldWind.AbstractEditTool = AbstractEditTool;
    OpusWorldWind.AbstractPathEditTool = AbstractPathEditTool;
    OpusWorldWind.AbstractRigidMesh = AbstractRigidMesh;
    OpusWorldWind.AbstractSurfacePathEditTool = AbstractSurfacePathEditTool;
    OpusWorldWind.AbstractSurfaceShapeEditTool = AbstractSurfaceShapeEditTool;
    OpusWorldWind.Box = Box;
    OpusWorldWind.Cone = Cone;
    OpusWorldWind.CursorEditTool = CursorEditTool;
    OpusWorldWind.Cylinder = Cylinder;
    OpusWorldWind.EditToolClickRecognizer = EditToolClickRecognizer;
    OpusWorldWind.Ellipsoid = Ellipsoid;
    OpusWorldWind.ExtrudedPolygonEditTool = ExtrudedPolygonEditTool;
    OpusWorldWind.Intersection = Intersection;
    OpusWorldWind.LatLonIndicatorLayer = LatLonIndicatorLayer;
    OpusWorldWind.MercatorSurfaceImage = MercatorSurfaceImage;
    OpusWorldWind.OpenStreetMapImageLayer = OpenStreetMapImageLayer;
    OpusWorldWind.OutlineTextureProgram = OutlineTextureProgram;
    OpusWorldWind.PedestalPlacemark = PedestalPlacemark;
    OpusWorldWind.PlacemarkEditTool = PlacemarkEditTool;
    OpusWorldWind.PlaybackIndicatorLayer = PlaybackIndicatorLayer;
    OpusWorldWind.PointCloud = PointCloud;
    OpusWorldWind.PointCloudAttributes = PointCloudAttributes;
    OpusWorldWind.PointPlacemark = PointPlacemark;
    OpusWorldWind.PointPlacemarkAttributes = PointPlacemarkAttributes;
    OpusWorldWind.PolylineEditTool = PolylineEditTool;
    OpusWorldWind.ProjectionProj4 = ProjectionProj4;
    OpusWorldWind.Pyramid = Pyramid;
    OpusWorldWind.RangeRingEditTool = RangeRingEditTool;
    OpusWorldWind.RigidMeshEditTool = RigidMeshEditTool;
    OpusWorldWind.RigidWedgeMesh = RigidWedgeMesh;
    OpusWorldWind.ScreenShapePlacemark = ScreenShapePlacemark;
    OpusWorldWind.ScreenShapePlacemarkAttributes = ScreenShapePlacemarkAttributes;
    OpusWorldWind.SectorModifier = SectorModifier;
    OpusWorldWind.SectorRenderable = SectorRenderable;
    OpusWorldWind.SquarePlacemark = SquarePlacemark;
    OpusWorldWind.SurfaceArc = SurfaceArc;
    OpusWorldWind.SurfaceCircleEditTool = SurfaceCircleEditTool;
    OpusWorldWind.SurfaceEllipseEditTool = SurfaceEllipseEditTool;
    OpusWorldWind.SurfacePathEditTool = SurfacePathEditTool;
    OpusWorldWind.SurfacePolygonEditTool = SurfacePolygonEditTool;
    OpusWorldWind.SurfaceRectangleEditTool = SurfaceRectangleEditTool;
    OpusWorldWind.SurfaceSquareEditTool = SurfaceSquareEditTool;
    OpusWorldWind.TextBox = TextBox;
    OpusWorldWind.TriPath = TriPath;
    OpusWorldWind.TriPathProgram = TriPathProgram;
    OpusWorldWind.ExtUtils = ExtUtils;
    OpusWorldWind.WcPlacemark = WcPlacemark;
    OpusWorldWind.Wedge = Wedge;
    OpusWorldWind.WmsLayer = WmsLayer;
    OpusWorldWind.WmsParamLayer = WmsParamLayer;

    window.OpusWorldWind = OpusWorldWind;

    return OpusWorldWind;
});
