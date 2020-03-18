define([
    'OpusWorldWind/overrides',
    'OpusWorldWind/AbstractAirspacePathEditTool',
    'OpusWorldWind/AbstractEditTool',
    'OpusWorldWind/AbstractPathEditTool',
    'OpusWorldWind/AbstractRigidMesh',
    'OpusWorldWind/AbstractSurfacePathEditTool',
    'OpusWorldWind/AbstractSurfaceShapeEditTool',
    'OpusWorldWind/Box',
    'OpusWorldWind/Cone',
    'OpusWorldWind/CursorEditTool',
    'OpusWorldWind/Cylinder',
    'OpusWorldWind/EditToolClickRecognizer',
    'OpusWorldWind/Ellipsoid',
    'OpusWorldWind/ExtrudedPolygonEditTool',
    'OpusWorldWind/Intersection',
    'OpusWorldWind/LatLonIndicatorLayer',
    'OpusWorldWind/MercatorSurfaceImage',
    'OpusWorldWind/OpenStreetMapImageLayer',
    'OpusWorldWind/OutlineTextureProgram',
    'OpusWorldWind/PedestalPlacemark',
    'OpusWorldWind/PlacemarkEditTool',
    'OpusWorldWind/PlaybackIndicatorLayer',
    'OpusWorldWind/PointCloud',
    'OpusWorldWind/PointCloudAttributes',
    'OpusWorldWind/PointPlacemark',
    'OpusWorldWind/PointPlacemarkAttributes',
    'OpusWorldWind/PolylineEditTool',
    'OpusWorldWind/ProjectionProj4',
    'OpusWorldWind/Pyramid',
    'OpusWorldWind/RangeRingEditTool',
    'OpusWorldWind/RigidMeshEditTool',
    'OpusWorldWind/RigidWedgeMesh',
    'OpusWorldWind/ScreenShapePlacemark',
    'OpusWorldWind/ScreenShapePlacemarkAttributes',
    'OpusWorldWind/SectorModifier',
    'OpusWorldWind/SectorRenderable',
    'OpusWorldWind/SquarePlacemark',
    'OpusWorldWind/SurfaceArc',
    'OpusWorldWind/SurfaceCircleEditTool',
    'OpusWorldWind/SurfaceEllipseEditTool',
    'OpusWorldWind/SurfacePathEditTool',
    'OpusWorldWind/SurfacePolygonEditTool',
    'OpusWorldWind/SurfaceRectangleEditTool',
    'OpusWorldWind/SurfaceSquareEditTool',
    'OpusWorldWind/TextBox',
    'OpusWorldWind/TriPath',
    'OpusWorldWind/TriPathProgram',
    'OpusWorldWind/ExtUtils',
    'OpusWorldWind/WcPlacemark',
    'OpusWorldWind/Wedge',
    'OpusWorldWind/WmsLayer',
    'OpusWorldWind/WmsParamLayer'
], function (
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
