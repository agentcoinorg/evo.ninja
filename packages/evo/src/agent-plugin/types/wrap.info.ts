/// NOTE: This is an auto-generated file.
///       All modifications will be overwritten.
import { WrapManifest } from "@polywrap/wrap-manifest-types-js"

export const manifest: WrapManifest = {
  name: "agent-plugin",
  type: "plugin",
  version: "0.1",
  abi: {
  "moduleType": {
    "kind": 128,
    "methods": [
      {
        "arguments": [
          {
            "kind": 34,
            "name": "message",
            "required": true,
            "scalar": {
              "kind": 4,
              "name": "message",
              "required": true,
              "type": "String"
            },
            "type": "String"
          }
        ],
        "kind": 64,
        "name": "speak",
        "required": true,
        "return": {
          "kind": 34,
          "name": "speak",
          "required": true,
          "scalar": {
            "kind": 4,
            "name": "speak",
            "required": true,
            "type": "String"
          },
          "type": "String"
        },
        "type": "Method"
      },
      {
        "arguments": [
          {
            "kind": 34,
            "name": "message",
            "required": true,
            "scalar": {
              "kind": 4,
              "name": "message",
              "required": true,
              "type": "String"
            },
            "type": "String"
          }
        ],
        "kind": 64,
        "name": "ask",
        "required": true,
        "return": {
          "kind": 34,
          "name": "ask",
          "required": true,
          "scalar": {
            "kind": 4,
            "name": "ask",
            "required": true,
            "type": "String"
          },
          "type": "String"
        },
        "type": "Method"
      },
      {
        "kind": 64,
        "name": "onGoalAchieved",
        "required": true,
        "return": {
          "kind": 34,
          "name": "onGoalAchieved",
          "required": true,
          "scalar": {
            "kind": 4,
            "name": "onGoalAchieved",
            "required": true,
            "type": "Boolean"
          },
          "type": "Boolean"
        },
        "type": "Method"
      },
      {
        "kind": 64,
        "name": "onGoalFailed",
        "required": true,
        "return": {
          "kind": 34,
          "name": "onGoalFailed",
          "required": true,
          "scalar": {
            "kind": 4,
            "name": "onGoalFailed",
            "required": true,
            "type": "Boolean"
          },
          "type": "Boolean"
        },
        "type": "Method"
      }
    ],
    "type": "Module"
  },
  "version": "0.1"
}
}
