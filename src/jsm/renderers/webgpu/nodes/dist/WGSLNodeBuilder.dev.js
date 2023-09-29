"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _three = require("three");

var _UniformsGroup = _interopRequireDefault(require("../../common/UniformsGroup.js"));

var _NodeUniform = require("../../common/nodes/NodeUniform.js");

var _NodeSampler = _interopRequireDefault(require("../../common/nodes/NodeSampler.js"));

var _NodeSampledTexture = require("../../common/nodes/NodeSampledTexture.js");

var _UniformBuffer = _interopRequireDefault(require("../../common/UniformBuffer.js"));

var _StorageBuffer = _interopRequireDefault(require("../../common/StorageBuffer.js"));

var _BufferUtils = require("../../common/BufferUtils.js");

var _CubeRenderTarget = _interopRequireDefault(require("../../common/CubeRenderTarget.js"));

var _Nodes = require("../../../nodes/Nodes.js");

var _WGSLNodeParser = _interopRequireDefault(require("./WGSLNodeParser.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var gpuShaderStageLib = {
  'vertex': GPUShaderStage.VERTEX,
  'fragment': GPUShaderStage.FRAGMENT,
  'compute': GPUShaderStage.COMPUTE
};
var supports = {
  instance: true
};
var wgslTypeLib = {
  "float": 'f32',
  "int": 'i32',
  uint: 'u32',
  bool: 'bool',
  color: 'vec3<f32>',
  vec2: 'vec2<f32>',
  ivec2: 'vec2<i32>',
  uvec2: 'vec2<u32>',
  bvec2: 'vec2<bool>',
  vec3: 'vec3<f32>',
  ivec3: 'vec3<i32>',
  uvec3: 'vec3<u32>',
  bvec3: 'vec3<bool>',
  vec4: 'vec4<f32>',
  ivec4: 'vec4<i32>',
  uvec4: 'vec4<u32>',
  bvec4: 'vec4<bool>',
  mat3: 'mat3x3<f32>',
  imat3: 'mat3x3<i32>',
  umat3: 'mat3x3<u32>',
  bmat3: 'mat3x3<bool>',
  mat4: 'mat4x4<f32>',
  imat4: 'mat4x4<i32>',
  umat4: 'mat4x4<u32>',
  bmat4: 'mat4x4<bool>'
};
var wgslMethods = {
  dFdx: 'dpdx',
  dFdy: 'dpdy',
  mod: 'threejs_mod',
  lessThanEqual: 'threejs_lessThanEqual',
  inversesqrt: 'inverseSqrt'
};
var wgslPolyfill = {
  lessThanEqual: new _Nodes.CodeNode("\nfn threejs_lessThanEqual( a : vec3<f32>, b : vec3<f32> ) -> vec3<bool> {\n\n\treturn vec3<bool>( a.x <= b.x, a.y <= b.y, a.z <= b.z );\n\n}\n"),
  mod: new _Nodes.CodeNode("\nfn threejs_mod( x : f32, y : f32 ) -> f32 {\n\n\treturn x - y * floor( x / y );\n\n}\n"),
  repeatWrapping: new _Nodes.CodeNode("\nfn threejs_repeatWrapping( uv : vec2<f32>, dimension : vec2<u32> ) -> vec2<u32> {\n\n\tlet uvScaled = vec2<u32>( uv * vec2<f32>( dimension ) );\n\n\treturn ( ( uvScaled % dimension ) + dimension ) % dimension;\n\n}\n")
};

var WGSLNodeBuilder =
/*#__PURE__*/
function (_NodeBuilder) {
  _inherits(WGSLNodeBuilder, _NodeBuilder);

  function WGSLNodeBuilder(object, renderer) {
    var _this;

    var scene = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, WGSLNodeBuilder);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WGSLNodeBuilder).call(this, object, renderer, new _WGSLNodeParser["default"](), scene));
    _this.uniformsGroup = {};
    _this.builtins = {
      vertex: new Map(),
      fragment: new Map(),
      compute: new Map(),
      attribute: new Map()
    };
    return _this;
  }

  _createClass(WGSLNodeBuilder, [{
    key: "build",
    value: function build() {
      var object = this.object,
          material = this.material;

      if (material !== null) {
        _Nodes.NodeMaterial.fromMaterial(material).build(this);
      } else {
        this.addFlow('compute', object);
      }

      return _get(_getPrototypeOf(WGSLNodeBuilder.prototype), "build", this).call(this);
    }
  }, {
    key: "needsColorSpaceToLinear",
    value: function needsColorSpaceToLinear(texture) {
      return texture.isVideoTexture === true && texture.colorSpace !== _three.NoColorSpace;
    }
  }, {
    key: "getSampler",
    value: function getSampler(textureProperty, uvSnippet) {
      var shaderStage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.shaderStage;

      if (shaderStage === 'fragment') {
        return "textureSample( ".concat(textureProperty, ", ").concat(textureProperty, "_sampler, ").concat(uvSnippet, " )");
      } else {
        this._include('repeatWrapping');

        var dimension = "textureDimensions( ".concat(textureProperty, ", 0 )");
        return "textureLoad( ".concat(textureProperty, ", threejs_repeatWrapping( ").concat(uvSnippet, ", ").concat(dimension, " ), 0 )");
      }
    }
  }, {
    key: "getVideoSampler",
    value: function getVideoSampler(textureProperty, uvSnippet) {
      var shaderStage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.shaderStage;

      if (shaderStage === 'fragment') {
        return "textureSampleBaseClampToEdge( ".concat(textureProperty, ", ").concat(textureProperty, "_sampler, vec2<f32>( ").concat(uvSnippet, ".x, 1.0 - ").concat(uvSnippet, ".y ) )");
      } else {
        console.error("WebGPURenderer: THREE.VideoTexture does not support ".concat(shaderStage, " shader."));
      }
    }
  }, {
    key: "getSamplerLevel",
    value: function getSamplerLevel(textureProperty, uvSnippet, biasSnippet) {
      var shaderStage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.shaderStage;

      if (shaderStage === 'fragment') {
        return "textureSampleLevel( ".concat(textureProperty, ", ").concat(textureProperty, "_sampler, ").concat(uvSnippet, ", ").concat(biasSnippet, " )");
      } else {
        this._include('repeatWrapping');

        var dimension = "textureDimensions( ".concat(textureProperty, ", 0 )");
        return "textureLoad( ".concat(textureProperty, ", threejs_repeatWrapping( ").concat(uvSnippet, ", ").concat(dimension, " ), i32( ").concat(biasSnippet, " ) )");
      }
    }
  }, {
    key: "getTexture",
    value: function getTexture(texture, textureProperty, uvSnippet) {
      var shaderStage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.shaderStage;
      var snippet = null;

      if (texture.isVideoTexture === true) {
        snippet = this.getVideoSampler(textureProperty, uvSnippet, shaderStage);
      } else {
        snippet = this.getSampler(textureProperty, uvSnippet, shaderStage);
      }

      return snippet;
    }
  }, {
    key: "getTextureCompare",
    value: function getTextureCompare(texture, textureProperty, uvSnippet, compareSnippet) {
      var shaderStage = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.shaderStage;

      if (shaderStage === 'fragment') {
        return "textureSampleCompare( ".concat(textureProperty, ", ").concat(textureProperty, "_sampler, ").concat(uvSnippet, ", ").concat(compareSnippet, " )");
      } else {
        console.error("WebGPURenderer: THREE.DepthTexture.compareFunction() does not support ".concat(shaderStage, " shader."));
      }
    }
  }, {
    key: "getTextureLevel",
    value: function getTextureLevel(texture, textureProperty, uvSnippet, biasSnippet) {
      var shaderStage = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.shaderStage;
      var snippet = null;

      if (texture.isVideoTexture === true) {
        snippet = this.getVideoSampler(textureProperty, uvSnippet, shaderStage);
      } else {
        snippet = this.getSamplerLevel(textureProperty, uvSnippet, biasSnippet, shaderStage);
      }

      return snippet;
    }
  }, {
    key: "getPropertyName",
    value: function getPropertyName(node) {
      var shaderStage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.shaderStage;

      if (node.isNodeVarying === true && node.needsInterpolation === true) {
        if (shaderStage === 'vertex') {
          return "NodeVaryings.".concat(node.name);
        }
      } else if (node.isNodeUniform === true) {
        var name = node.name;
        var type = node.type;

        if (type === 'texture' || type === 'cubeTexture') {
          return name;
        } else if (type === 'buffer' || type === 'storageBuffer') {
          return "NodeBuffer_".concat(node.node.id, ".").concat(name);
        } else {
          return "NodeUniforms.".concat(name);
        }
      }

      return _get(_getPrototypeOf(WGSLNodeBuilder.prototype), "getPropertyName", this).call(this, node);
    }
  }, {
    key: "getUniformFromNode",
    value: function getUniformFromNode(node, type, shaderStage) {
      var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      var uniformNode = _get(_getPrototypeOf(WGSLNodeBuilder.prototype), "getUniformFromNode", this).call(this, node, type, shaderStage, name);

      var nodeData = this.getDataFromNode(node, shaderStage);

      if (nodeData.uniformGPU === undefined) {
        var uniformGPU;
        var bindings = this.bindings[shaderStage];

        if (type === 'texture' || type === 'cubeTexture') {
          var texture = null;

          if (type === 'texture') {
            texture = new _NodeSampledTexture.NodeSampledTexture(uniformNode.name, uniformNode.node);
          } else if (type === 'cubeTexture') {
            texture = new _NodeSampledTexture.NodeSampledCubeTexture(uniformNode.name, uniformNode.node);
          }

          texture.setVisibility(gpuShaderStageLib[shaderStage]); // add first textures in sequence and group for last

          var lastBinding = bindings[bindings.length - 1];
          var index = lastBinding && lastBinding.isUniformsGroup ? bindings.length - 1 : bindings.length;

          if (shaderStage === 'fragment') {
            var sampler = new _NodeSampler["default"]("".concat(uniformNode.name, "_sampler"), uniformNode.node);
            sampler.setVisibility(gpuShaderStageLib[shaderStage]);
            bindings.splice(index, 0, sampler, texture);
            uniformGPU = [sampler, texture];
          } else {
            bindings.splice(index, 0, texture);
            uniformGPU = [texture];
          }
        } else if (type === 'buffer' || type === 'storageBuffer') {
          var bufferClass = type === 'storageBuffer' ? _StorageBuffer["default"] : _UniformBuffer["default"];
          var buffer = new bufferClass('NodeBuffer_' + node.id, node.value);
          buffer.setVisibility(gpuShaderStageLib[shaderStage]); // add first textures in sequence and group for last

          var _lastBinding = bindings[bindings.length - 1];

          var _index = _lastBinding && _lastBinding.isUniformsGroup ? bindings.length - 1 : bindings.length;

          bindings.splice(_index, 0, buffer);
          uniformGPU = buffer;
        } else {
          var uniformsGroup = this.uniformsGroup[shaderStage];

          if (uniformsGroup === undefined) {
            uniformsGroup = new _UniformsGroup["default"]('nodeUniforms');
            uniformsGroup.setVisibility(gpuShaderStageLib[shaderStage]);
            this.uniformsGroup[shaderStage] = uniformsGroup;
            bindings.push(uniformsGroup);
          }

          if (node.isArrayUniformNode === true) {
            uniformGPU = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = node.nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _uniformNode = _step.value;

                var uniformNodeGPU = this._getNodeUniform(_uniformNode, type); // fit bounds to buffer


                uniformNodeGPU.boundary = (0, _BufferUtils.getVectorLength)(uniformNodeGPU.itemSize);
                uniformNodeGPU.itemSize = (0, _BufferUtils.getStrideLength)(uniformNodeGPU.itemSize);
                uniformsGroup.addUniform(uniformNodeGPU);
                uniformGPU.push(uniformNodeGPU);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                  _iterator["return"]();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          } else {
            uniformGPU = this._getNodeUniform(uniformNode, type);
            uniformsGroup.addUniform(uniformGPU);
          }
        }

        nodeData.uniformGPU = uniformGPU;

        if (shaderStage === 'vertex') {
          this.bindingsOffset['fragment'] = bindings.length;
        }
      }

      return uniformNode;
    }
  }, {
    key: "isReference",
    value: function isReference(type) {
      return _get(_getPrototypeOf(WGSLNodeBuilder.prototype), "isReference", this).call(this, type) || type === 'texture_2d' || type === 'texture_cube';
    }
  }, {
    key: "getBuiltin",
    value: function getBuiltin(name, property, type) {
      var shaderStage = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.shaderStage;
      var map = this.builtins[shaderStage];

      if (map.has(name) === false) {
        map.set(name, {
          name: name,
          property: property,
          type: type
        });
      }

      return property;
    }
  }, {
    key: "getVertexIndex",
    value: function getVertexIndex() {
      if (this.shaderStage === 'vertex') {
        return this.getBuiltin('vertex_index', 'vertexIndex', 'u32', 'attribute');
      }

      return 'vertexIndex';
    }
  }, {
    key: "getInstanceIndex",
    value: function getInstanceIndex() {
      if (this.shaderStage === 'vertex') {
        return this.getBuiltin('instance_index', 'instanceIndex', 'u32', 'attribute');
      }

      return 'instanceIndex';
    }
  }, {
    key: "getFrontFacing",
    value: function getFrontFacing() {
      return this.getBuiltin('front_facing', 'isFront', 'bool');
    }
  }, {
    key: "getFragCoord",
    value: function getFragCoord() {
      return this.getBuiltin('position', 'fragCoord', 'vec4<f32>', 'fragment');
    }
  }, {
    key: "isFlipY",
    value: function isFlipY() {
      return false;
    }
  }, {
    key: "getAttributes",
    value: function getAttributes(shaderStage) {
      var snippets = [];

      if (shaderStage === 'compute') {
        this.getBuiltin('global_invocation_id', 'id', 'vec3<u32>', 'attribute');
      }

      if (shaderStage === 'vertex' || shaderStage === 'compute') {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.builtins.attribute.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _step2$value = _step2.value,
                _name = _step2$value.name,
                property = _step2$value.property,
                _type = _step2$value.type;
            snippets.push("@builtin( ".concat(_name, " ) ").concat(property, " : ").concat(_type));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        var attributes = this.getAttributesArray();

        for (var index = 0, length = attributes.length; index < length; index++) {
          var attribute = attributes[index];
          var name = attribute.name;
          var type = this.getType(attribute.type);
          snippets.push("@location( ".concat(index, " ) ").concat(name, " : ").concat(type));
        }
      }

      return snippets.join(',\n\t');
    }
  }, {
    key: "getVar",
    value: function getVar(type, name) {
      return "var ".concat(name, " : ").concat(this.getType(type));
    }
  }, {
    key: "getVars",
    value: function getVars(shaderStage) {
      var snippets = [];
      var vars = this.vars[shaderStage];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = vars[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var variable = _step3.value;
          snippets.push("\t".concat(this.getVar(variable.type, variable.name), ";"));
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return "\n".concat(snippets.join('\n'), "\n");
    }
  }, {
    key: "getVaryings",
    value: function getVaryings(shaderStage) {
      var snippets = [];

      if (shaderStage === 'vertex') {
        this.getBuiltin('position', 'Vertex', 'vec4<f32>', 'vertex');
      }

      if (shaderStage === 'vertex' || shaderStage === 'fragment') {
        var varyings = this.varyings;
        var vars = this.vars[shaderStage];

        for (var index = 0; index < varyings.length; index++) {
          var varying = varyings[index];

          if (varying.needsInterpolation) {
            var attributesSnippet = "@location( ".concat(index, " )");

            if (varying.type === 'int' || varying.type === 'uint') {
              attributesSnippet += ' @interpolate( flat )';
            }

            snippets.push("".concat(attributesSnippet, " ").concat(varying.name, " : ").concat(this.getType(varying.type)));
          } else if (shaderStage === 'vertex' && vars.includes(varying) === false) {
            vars.push(varying);
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.builtins[shaderStage].values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _step4$value = _step4.value,
              name = _step4$value.name,
              property = _step4$value.property,
              type = _step4$value.type;
          snippets.push("@builtin( ".concat(name, " ) ").concat(property, " : ").concat(type));
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var code = snippets.join(',\n\t');
      return shaderStage === 'vertex' ? this._getWGSLStruct('NodeVaryingsStruct', '\t' + code) : code;
    }
  }, {
    key: "getUniforms",
    value: function getUniforms(shaderStage) {
      var uniforms = this.uniforms[shaderStage];
      var bindingSnippets = [];
      var bufferSnippets = [];
      var groupSnippets = [];
      var index = this.bindingsOffset[shaderStage];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = uniforms[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var uniform = _step5.value;

          if (uniform.type === 'texture' || uniform.type === 'cubeTexture') {
            if (shaderStage === 'fragment') {
              var _texture = uniform.node.value;

              if (_texture.isDepthTexture === true && _texture.compareFunction !== null) {
                bindingSnippets.push("@binding( ".concat(index++, " ) @group( 0 ) var ").concat(uniform.name, "_sampler : sampler_comparison;"));
              } else {
                bindingSnippets.push("@binding( ".concat(index++, " ) @group( 0 ) var ").concat(uniform.name, "_sampler : sampler;"));
              }
            }

            var texture = uniform.node.value;
            var textureType = void 0;

            if (texture.isCubeTexture === true) {
              textureType = 'texture_cube<f32>';
            } else if (texture.isDepthTexture === true) {
              textureType = 'texture_depth_2d';
            } else if (texture.isVideoTexture === true) {
              textureType = 'texture_external';
            } else {
              textureType = 'texture_2d<f32>';
            }

            bindingSnippets.push("@binding( ".concat(index++, " ) @group( 0 ) var ").concat(uniform.name, " : ").concat(textureType, ";"));
          } else if (uniform.type === 'buffer' || uniform.type === 'storageBuffer') {
            var bufferNode = uniform.node;
            var bufferType = this.getType(bufferNode.bufferType);
            var bufferCount = bufferNode.bufferCount;
            var bufferCountSnippet = bufferCount > 0 ? ', ' + bufferCount : '';
            var bufferSnippet = "\t".concat(uniform.name, " : array< ").concat(bufferType).concat(bufferCountSnippet, " >\n");
            var bufferAccessMode = bufferNode.isStorageBufferNode ? 'storage,read_write' : 'uniform';
            bufferSnippets.push(this._getWGSLStructBinding('NodeBuffer_' + bufferNode.id, bufferSnippet, bufferAccessMode, index++));
          } else {
            var vectorType = this.getType(this.getVectorType(uniform.type));

            if (Array.isArray(uniform.value) === true) {
              var length = uniform.value.length;
              groupSnippets.push("uniform ".concat(vectorType, "[ ").concat(length, " ] ").concat(uniform.name));
            } else {
              groupSnippets.push("\t".concat(uniform.name, " : ").concat(vectorType));
            }
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      var code = bindingSnippets.join('\n');
      code += bufferSnippets.join('\n');

      if (groupSnippets.length > 0) {
        code += this._getWGSLStructBinding('NodeUniforms', groupSnippets.join(',\n'), 'uniform', index++);
      }

      return code;
    }
  }, {
    key: "buildCode",
    value: function buildCode() {
      var shadersData = this.material !== null ? {
        fragment: {},
        vertex: {}
      } : {
        compute: {}
      };

      for (var shaderStage in shadersData) {
        var flow = '// code\n\n';
        flow += this.flowCode[shaderStage];
        var flowNodes = this.flowNodes[shaderStage];
        var mainNode = flowNodes[flowNodes.length - 1];
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = flowNodes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var node = _step6.value;
            var flowSlotData = this.getFlowData(node
            /*, shaderStage*/
            );
            var slotName = node.name;

            if (slotName) {
              if (flow.length > 0) flow += '\n';
              flow += "\t// flow -> ".concat(slotName, "\n\t");
            }

            flow += "".concat(flowSlotData.code, "\n\t");

            if (node === mainNode && shaderStage !== 'compute') {
              flow += '// result\n\t';

              if (shaderStage === 'vertex') {
                flow += 'NodeVaryings.Vertex = ';
              } else if (shaderStage === 'fragment') {
                flow += 'return ';
              }

              flow += "".concat(flowSlotData.result, ";");
            }
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
              _iterator6["return"]();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }

        var stageData = shadersData[shaderStage];
        stageData.uniforms = this.getUniforms(shaderStage);
        stageData.attributes = this.getAttributes(shaderStage);
        stageData.varyings = this.getVaryings(shaderStage);
        stageData.vars = this.getVars(shaderStage);
        stageData.codes = this.getCodes(shaderStage);
        stageData.flow = flow;
      }

      if (this.material !== null) {
        this.vertexShader = this._getWGSLVertexCode(shadersData.vertex);
        this.fragmentShader = this._getWGSLFragmentCode(shadersData.fragment);
      } else {
        this.computeShader = this._getWGSLComputeCode(shadersData.compute, (this.object.workgroupSize || [64]).join(', '));
      }
    }
  }, {
    key: "getRenderTarget",
    value: function getRenderTarget(width, height, options) {
      return new _three.RenderTarget(width, height, options);
    }
  }, {
    key: "getCubeRenderTarget",
    value: function getCubeRenderTarget(size, options) {
      return new _CubeRenderTarget["default"](size, options);
    }
  }, {
    key: "getMethod",
    value: function getMethod(method) {
      if (wgslPolyfill[method] !== undefined) {
        this._include(method);
      }

      return wgslMethods[method] || method;
    }
  }, {
    key: "getType",
    value: function getType(type) {
      return wgslTypeLib[type] || type;
    }
  }, {
    key: "isAvailable",
    value: function isAvailable(name) {
      return supports[name] === true;
    }
  }, {
    key: "_include",
    value: function _include(name) {
      wgslPolyfill[name].build(this);
    }
  }, {
    key: "_getNodeUniform",
    value: function _getNodeUniform(uniformNode, type) {
      if (type === 'float') return new _NodeUniform.FloatNodeUniform(uniformNode);
      if (type === 'vec2') return new _NodeUniform.Vector2NodeUniform(uniformNode);
      if (type === 'vec3') return new _NodeUniform.Vector3NodeUniform(uniformNode);
      if (type === 'vec4') return new _NodeUniform.Vector4NodeUniform(uniformNode);
      if (type === 'color') return new _NodeUniform.ColorNodeUniform(uniformNode);
      if (type === 'mat3') return new _NodeUniform.Matrix3NodeUniform(uniformNode);
      if (type === 'mat4') return new _NodeUniform.Matrix4NodeUniform(uniformNode);
      throw new Error("Uniform \"".concat(type, "\" not declared."));
    }
  }, {
    key: "_getWGSLVertexCode",
    value: function _getWGSLVertexCode(shaderData) {
      return "".concat(this.getSignature(), "\n\n// uniforms\n").concat(shaderData.uniforms, "\n\n// varyings\n").concat(shaderData.varyings, "\n\n// codes\n").concat(shaderData.codes, "\n\n@vertex\nfn main( ").concat(shaderData.attributes, " ) -> NodeVaryingsStruct {\n\n\t// system\n\tvar NodeVaryings: NodeVaryingsStruct;\n\n\t// vars\n\t").concat(shaderData.vars, "\n\n\t// flow\n\t").concat(shaderData.flow, "\n\n\treturn NodeVaryings;\n\n}\n");
    }
  }, {
    key: "_getWGSLFragmentCode",
    value: function _getWGSLFragmentCode(shaderData) {
      return "".concat(this.getSignature(), "\n\n// uniforms\n").concat(shaderData.uniforms, "\n\n// codes\n").concat(shaderData.codes, "\n\n@fragment\nfn main( ").concat(shaderData.varyings, " ) -> @location( 0 ) vec4<f32> {\n\n\t// vars\n\t").concat(shaderData.vars, "\n\n\t// flow\n\t").concat(shaderData.flow, "\n\n}\n");
    }
  }, {
    key: "_getWGSLComputeCode",
    value: function _getWGSLComputeCode(shaderData, workgroupSize) {
      return "".concat(this.getSignature(), "\n// system\nvar<private> instanceIndex : u32;\n\n// uniforms\n").concat(shaderData.uniforms, "\n\n// codes\n").concat(shaderData.codes, "\n\n@compute @workgroup_size( ").concat(workgroupSize, " )\nfn main( ").concat(shaderData.attributes, " ) {\n\n\t// system\n\tinstanceIndex = id.x;\n\n\t// vars\n\t").concat(shaderData.vars, "\n\n\t// flow\n\t").concat(shaderData.flow, "\n\n}\n");
    }
  }, {
    key: "_getWGSLStruct",
    value: function _getWGSLStruct(name, vars) {
      return "\nstruct ".concat(name, " {\n").concat(vars, "\n};");
    }
  }, {
    key: "_getWGSLStructBinding",
    value: function _getWGSLStructBinding(name, vars, access) {
      var binding = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var group = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var structName = name + 'Struct';

      var structSnippet = this._getWGSLStruct(structName, vars);

      return "".concat(structSnippet, "\n@binding( ").concat(binding, " ) @group( ").concat(group, " )\nvar<").concat(access, "> ").concat(name, " : ").concat(structName, ";");
    }
  }]);

  return WGSLNodeBuilder;
}(_Nodes.NodeBuilder);

var _default = WGSLNodeBuilder;
exports["default"] = _default;