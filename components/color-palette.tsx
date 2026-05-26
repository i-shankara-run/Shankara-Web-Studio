"use client";

import { useMemo } from "react";
import { BRAND_PALETTE, getShades } from "@/lib/colors";

interface Props {
  selectedColor: string | null;
  selectedShade: string | null;
  onSelect: (color: string, shade: string) => void;
}

export function ColorPalette({ selectedColor, selectedShade, onSelect }: Props) {
  const shades = useMemo(
    () => (selectedColor ? getShades(selectedColor) : []),
    [selectedColor],
  );

  return (
    <div className="color-palette-wrap">
      <div className="color-palette-grid">
        {BRAND_PALETTE.map((c) => {
          const isActive = selectedColor === c.hex;
          return (
            <button
              type="button"
              key={c.hex}
              className={`color-palette-swatch ${isActive ? "color-palette-swatch-active" : ""}`}
              style={{ background: c.hex }}
              onClick={() => {
                const sh = getShades(c.hex);
                onSelect(c.hex, sh[2]);
              }}
              aria-label={`Color ${c.hex}`}
              aria-pressed={isActive}
            />
          );
        })}
      </div>

      {selectedColor && shades.length > 0 && (
        <div className="color-shade-row" role="radiogroup" aria-label="Shade variants">
          <span className="color-shade-label">Pick a shade</span>
          <div className="color-shade-tiles">
            {shades.map((sh) => {
              const isActive = selectedShade?.toLowerCase() === sh.toLowerCase();
              return (
                <button
                  type="button"
                  key={sh}
                  className={`color-shade-tile ${isActive ? "color-shade-tile-active" : ""}`}
                  style={{ background: sh }}
                  onClick={() => onSelect(selectedColor, sh)}
                  aria-label={`Shade ${sh}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
