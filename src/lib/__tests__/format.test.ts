import { describe, it, expect } from "vitest";
import { inr, unsplash, whatsappLink } from "../format";

describe("inr", () => {
  it("formats Indian rupees with commas", () => {
    expect(inr(6500)).toContain("6,500");
  });

  it("formats large amounts with lakh separator", () => {
    const result = inr(150000);
    expect(result).toContain("1,50,000");
  });

  it("handles zero", () => {
    expect(inr(0)).toContain("0");
  });
});

describe("unsplash", () => {
  it("returns an unsplash URL with dimensions", () => {
    const url = unsplash("photo-123", 800, 600);
    expect(url).toContain("images.unsplash.com/photo-123");
    expect(url).toContain("w=800");
    expect(url).toContain("h=600");
    expect(url).toContain("fit=crop");
    expect(url).toContain("auto=format");
  });

  it("uses default dimensions", () => {
    const url = unsplash("photo-123");
    expect(url).toContain("w=1200");
    expect(url).toContain("h=800");
  });
});

describe("whatsappLink", () => {
  it("generates WhatsApp link with default phone", () => {
    const link = whatsappLink("Hello");
    expect(link).toContain("wa.me/918310696307");
    expect(link).toContain("text=Hello");
  });

  it("encodes special characters", () => {
    const link = whatsappLink("Hi there! How are you?");
    expect(link).toContain("text=Hi%20there");
  });

  it("uses custom phone number", () => {
    const link = whatsappLink("Test", "919876543210");
    expect(link).toContain("wa.me/919876543210");
  });
});
