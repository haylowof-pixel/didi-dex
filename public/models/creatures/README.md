# Creature 3D Models

Place legally obtained or exported `.glb` / `.gltf` creature models in this folder and register them in `manifest.json`.

Example:

```json
{
  "species": {
    "Rex": {
      "name": "Rex game model",
      "url": "/models/creatures/rex.glb",
      "materialRegions": [
        { "match": "body", "region": 0 },
        { "match": "belly", "region": 1 },
        { "match": "back", "region": 2 },
        { "match": "stripe", "region": 3 },
        { "match": "crest", "region": 4 },
        { "match": "accent", "region": 5 }
      ]
    }
  }
}
```

`materialRegions` maps material or mesh name fragments to ARK color regions `0` through `5`.
