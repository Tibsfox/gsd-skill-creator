import { describe, it, expect } from "vitest";
import {
  type CRTConfig,
  CRT_DEFAULTS,
  mergeCRTConfig,
  isEffectEnabled,
} from "./crt-config.js";

describe("CRTConfig", () => {
  describe("interface shape", () => {
    it("has enabled boolean", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.enabled).toBe("boolean");
    });

    it("has scanlineIntensity number", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.scanlineIntensity).toBe("number");
    });

    it("has barrelDistortion number", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.barrelDistortion).toBe("number");
    });

    it("has phosphorGlow number", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.phosphorGlow).toBe("number");
    });

    it("has chromaticAberration number", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.chromaticAberration).toBe("number");
    });

    it("has vignette number", () => {
      const config: CRTConfig = { ...CRT_DEFAULTS };
      expect(typeof config.vignette).toBe("number");
    });
  });

  describe("CRT_DEFAULTS", () => {
    it("has enabled set to true", () => {
      expect(CRT_DEFAULTS.enabled).toBe(true);
    });

    it("has scanlineIntensity of 0.6", () => {
      expect(CRT_DEFAULTS.scanlineIntensity).toBe(0.6);
    });

    it("has barrelDistortion of 0.15", () => {
      expect(CRT_DEFAULTS.barrelDistortion).toBe(0.15);
    });

    it("has phosphorGlow of 0.4", () => {
      expect(CRT_DEFAULTS.phosphorGlow).toBe(0.4);
    });

    it("has chromaticAberration of 2.0", () => {
      expect(CRT_DEFAULTS.chromaticAberration).toBe(2.0);
    });

    it("has vignette of 0.5", () => {
      expect(CRT_DEFAULTS.vignette).toBe(0.5);
    });
  });

  describe("mergeCRTConfig", () => {
    it("returns defaults when given empty partial", () => {
      const result = mergeCRTConfig({});
      expect(result).toEqual(CRT_DEFAULTS);
    });

    it("overrides only the specified field", () => {
      const result = mergeCRTConfig({ scanlineIntensity: 0.8 });
      expect(result.scanlineIntensity).toBe(0.8);
      expect(result.barrelDistortion).toBe(CRT_DEFAULTS.barrelDistortion);
      expect(result.phosphorGlow).toBe(CRT_DEFAULTS.phosphorGlow);
      expect(result.chromaticAberration).toBe(
        CRT_DEFAULTS.chromaticAberration,
      );
      expect(result.vignette).toBe(CRT_DEFAULTS.vignette);
      expect(result.enabled).toBe(CRT_DEFAULTS.enabled);
    });

    it("allows disabling via enabled: false", () => {
      const result = mergeCRTConfig({ enabled: false });
      expect(result.enabled).toBe(false);
      // Other values remain at defaults
      expect(result.scanlineIntensity).toBe(CRT_DEFAULTS.scanlineIntensity);
    });

    it("overrides multiple fields", () => {
      const result = mergeCRTConfig({
        scanlineIntensity: 0.2,
        vignette: 0.9,
      });
      expect(result.scanlineIntensity).toBe(0.2);
      expect(result.vignette).toBe(0.9);
      expect(result.barrelDistortion).toBe(CRT_DEFAULTS.barrelDistortion);
    });
  });

  describe("isEffectEnabled", () => {
    it("returns false for all effects when config is disabled", () => {
      const config = mergeCRTConfig({ enabled: false });
      expect(isEffectEnabled(config, "scanlineIntensity")).toBe(false);
      expect(isEffectEnabled(config, "barrelDistortion")).toBe(false);
      expect(isEffectEnabled(config, "phosphorGlow")).toBe(false);
      expect(isEffectEnabled(config, "chromaticAberration")).toBe(false);
      expect(isEffectEnabled(config, "vignette")).toBe(false);
    });

    it("returns false for an effect with intensity 0", () => {
      const config = mergeCRTConfig({ scanlineIntensity: 0 });
      expect(isEffectEnabled(config, "scanlineIntensity")).toBe(false);
    });

    it("returns true for effects with intensity > 0 when enabled", () => {
      const config = mergeCRTConfig({});
      expect(isEffectEnabled(config, "scanlineIntensity")).toBe(true);
      expect(isEffectEnabled(config, "barrelDistortion")).toBe(true);
      expect(isEffectEnabled(config, "phosphorGlow")).toBe(true);
      expect(isEffectEnabled(config, "chromaticAberration")).toBe(true);
      expect(isEffectEnabled(config, "vignette")).toBe(true);
    });

    it("returns true for other effects when one is zeroed out", () => {
      const config = mergeCRTConfig({ scanlineIntensity: 0 });
      expect(isEffectEnabled(config, "scanlineIntensity")).toBe(false);
      expect(isEffectEnabled(config, "barrelDistortion")).toBe(true);
      expect(isEffectEnabled(config, "phosphorGlow")).toBe(true);
    });
  });
});
